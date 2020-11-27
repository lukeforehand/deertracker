import functools
import hashlib
import itertools
import multiprocessing
import numpy as np
import pathlib
import string
import tensorflow as tf

from datetime import datetime

from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS

from deertracker import DEFAULT_DATA_STORE, database, model, logger
from deertracker.model import MegaDetector


DEFAULT_PHOTO_STORE = pathlib.Path(DEFAULT_DATA_STORE / "photos")
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)

EXIF_TAGS = dict(((v, k) for k, v in TAGS.items()))

PHOTO_EXTS = {".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mp4", ".mov", ".avi"}

LOGGER = logger.get_logger()

# this is somewhat dependent on how much RAM you have
# tensorflow seems to utilize all CPUS regardless
# CPUS = multiprocessing.cpu_count()
CPUS = 1


def add_camera(name, lat, lon):
    with database.conn() as db:
        return db.insert_camera((name, lat, lon))


def import_photos(camera_name, files, ignore_exif=False):
    with database.conn() as db:
        camera = db.select_camera(camera_name)
    if camera is None:
        print(f"Camera {camera_name} not found")
        return

    if CPUS <= 1 or tf.test.is_gpu_available():
        return process_photos(camera, ignore_exif, files)

    pool = multiprocessing.Pool(CPUS)
    results = pool.map(
        functools.partial(process_photos, camera, ignore_exif),
        np.array_split(files, CPUS),
    )
    pool.close()
    pool.join()
    return list(itertools.chain.from_iterable(results))


def process_photos(camera, ignore_exif, file_paths):
    detector = MegaDetector()
    with database.conn() as db:
        return [
            process_photo(detector, db, camera, ignore_exif, file_path)
            for file_path in file_paths
        ]


def process_photo(detector, db, camera, ignore_exif, file_path):
    try:
        if pathlib.Path(file_path).suffix.lower() in VIDEO_EXTS:
            image = model.first_frame(file_path)
            if image is None:
                return None
        else:
            image = Image.open(file_path)
        photo_hash = hashlib.md5(image.tobytes()).hexdigest()
        if not hash_exists(db, photo_hash):
            photo_time = get_time(image, ignore_exif)
            for obj in model.model(detector, image):
                obj_photo = obj["image"]
                obj_label = obj["label"]
                obj_conf = obj["confidence"]
                obj_hash = hashlib.md5(obj_photo.tobytes()).hexdigest()
                obj_id = f"{obj_label}_{int(obj_conf*100)}_{obj_hash}"
                obj_path = store(obj_id, obj_photo, camera)
                db.insert_object(
                    (
                        obj_id,
                        obj_path,
                        camera["lat"],
                        camera["lon"],
                        photo_time,
                        obj_label,
                        obj_conf,
                        photo_hash,
                        camera["name"],
                    )
                )
            db.insert_photo(photo_hash)
        print(f"Processed {file_path}")
    except Exception:
        LOGGER.exception(f"Error processing photo {file_path}")
        return None


def hash_exists(db, photo_hash):
    return db.get_photo(photo_hash) is not None


def get_time(image, ignore_exif):
    try:
        return datetime.strptime(
            image.getexif()[EXIF_TAGS["DateTime"]], "%Y:%m:%d %H:%M:%S"
        )
    except KeyError:
        if ignore_exif:
            return None
        raise


def store(photo_hash, photo, camera):
    dest_path = f"{DEFAULT_PHOTO_STORE}/{photo_hash}.jpg"
    photo.save(dest_path, "JPEG")
    return dest_path
