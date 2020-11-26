import functools
import hashlib
import multiprocessing
import pathlib

import string

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


def add_camera(name, lat, lon):
    return database.Connection().insert_camera((name, lat, lon))


def import_photos(camera_name, files):
    db = database.Connection()
    camera = db.select_camera(camera_name)
    if camera is None:
        print(f"Camera {camera_name} not found")
        return
    # pool = multiprocessing.Pool(multiprocessing.cpu_count())
    # FIXME: model is probably not serializable, how can we share it or make a pool of them?
    # results = pool.map(
    #    functools.partial(process_photo, MegaDetector(), db, camera),
    #    files,
    # )
    md = MegaDetector()
    results = []
    for photo in files:
        results.append(process_photo(md, db, camera, photo))
    # pool.close()
    # pool.join()
    return results


def hash_exists(db, photo_hash):
    return db.get_photo(photo_hash) is not None


def process_photo(detector, db, camera, file_path):
    try:
        if pathlib.Path(file_path).suffix.lower() in VIDEO_EXTS:
            image = model.first_frame(file_path)
            if image is None:
                return None
        else:
            image = Image.open(file_path)
        photo_hash = hashlib.md5(image.tobytes()).hexdigest()
        if not hash_exists(db, photo_hash):
            photo_time = get_time(image)
            photo_exif = image.info["exif"]
            for obj in model.model(detector, image):
                obj_photo = obj["image"]
                obj_label = obj["label"]
                obj_conf = obj["confidence"]
                obj_hash = hashlib.md5(obj_photo.tobytes()).hexdigest()
                obj_id = f"{obj_label}_{int(obj_conf*100)}_{obj_hash}"
                obj_path = store(obj_id, obj_photo, photo_exif, camera)
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


def get_time(image):
    return datetime.strptime(
        image.getexif()[EXIF_TAGS["DateTime"]], "%Y:%m:%d %H:%M:%S"
    )


def store(photo_hash, photo, exif, camera):
    dest_path = f"{DEFAULT_PHOTO_STORE}/{photo_hash}.jpg"
    # TODO: set_exif GPSTAGS GPSInfo GPSLatitude, GPSLongitude using camera["lat"], camera["lon"]
    # try reading GPSInfo from a valid photo to reverse engineer the format
    photo.save(dest_path, "JPEG", exif=exif)
    return dest_path
