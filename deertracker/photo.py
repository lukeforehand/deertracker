import functools
import hashlib
import multiprocessing
import pathlib

import string

from datetime import datetime

from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS

from deertracker import DEFAULT_DATA_STORE, database, model, logger

DEFAULT_PHOTO_STORE = pathlib.Path(DEFAULT_DATA_STORE / "photos")
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)

EXIF_TAGS = dict(((v, k) for k, v in TAGS.items()))

PHOTO_EXTS = {".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mp4", ".mov", ".avi"}

LOGGER = logger.get_logger()


def add_camera(name, lat, lon):
    return database.Connection().insert_camera((name, lat, lon))


def import_photos(camera_name, files):
    camera = database.Connection().select_camera(camera_name)
    if camera is None:
        print(f"Camera {camera_name} not found")
        return
    pool = multiprocessing.Pool(multiprocessing.cpu_count())
    results = pool.map(functools.partial(process_photo, camera), files)
    pool.close()
    pool.join()
    return results


def hash_exists(photo_hash):
    print(database.Connection().get_photo_hash(photo_hash))
    return database.Connection().get_photo_hash(photo_hash) is not None


def process_photo(camera, file_path):
    try:
        if pathlib.Path(file_path).suffix.lower() in VIDEO_EXTS:
            image = model.first_frame(file_path)
            if image is None:
                return None
        else:
            image = Image.open(file_path)

        photo_hash = hashlib.md5(image.tobytes()).hexdigest()
        if not hash_exists(photo_hash):
            photo_time = get_time(image)
            for detected_object in model.model(image):
                photo = detected_object["image"]
                label = detected_object["label"]
                confidence = detected_object["confidence"]
                object_hash = hashlib.md5(photo.tobytes()).hexdigest()
                photo_id = f"{label}_{int(confidence*100)}_{object_hash}"
                photo_path = store(photo_id, photo, image.info["exif"], camera)
                database.Connection().insert_photo(
                    (
                        photo_id,
                        photo_path,
                        camera["lat"],
                        camera["lon"],
                        photo_time,
                        label,
                        confidence,
                        camera["name"],
                    )
                )
            database.Connection().insert_photo_hash(photo_hash)
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
