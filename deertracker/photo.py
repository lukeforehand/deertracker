import functools
import hashlib
import io
import logging
import multiprocessing
import pathlib
import shutil
import string

from datetime import datetime

from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS

from deertracker import DEFAULT_DATA_STORE
from deertracker import database

DEFAULT_PHOTO_STORE = pathlib.Path(DEFAULT_DATA_STORE / "photos")
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)


class BadPhotoError(Exception):
    pass


def add_camera(name, files, lat, lon):
    make, model = find_camera_make_model(files)
    return database.Connection().insert_camera((name, make, model, lat, lon))


def find_camera_make_model(files):
    pool = multiprocessing.Pool(multiprocessing.cpu_count())
    results = pool.map(_find_camera_make_model, files)
    pool.close()
    pool.join()
    make_models = {make_model for make_model in results if make_model is not None}
    if len(make_models) > 1:
        print("Multiple camera make/models detected in photos, please separate photos")
        return None
    else:
        return list(make_models)[0]


def _find_camera_make_model(file_path):
    try:
        meta = get_meta(file_path)
        return (meta["make"], meta["model"])
    except BadPhotoError:
        return None
    except Exception:
        return None


def import_photos(camera_name, files):
    camera = database.Connection().select_camera(camera_name)
    if camera is None:
        print("Camera not found")
        return
    pool = multiprocessing.Pool(multiprocessing.cpu_count())
    results = pool.map(functools.partial(process_photo, camera), files)
    pool.close()
    pool.join()
    return results


def process_photo(camera, file_path):
    try:
        photo_hash = hash_photo(file_path)
        photo_meta = get_meta(file_path)
        photo_path = store(photo_hash, file_path)
        # TODO: set lat/lon in exif photo_path
        return database.Connection().insert_photo(
            (
                photo_hash,
                photo_path,
                camera["lat"],
                camera["lon"],
                photo_meta["time"],
                camera["name"],
            )
        )
    except BadPhotoError:
        return None
    except Exception:
        logging.exception("Error processing photo")
        return None


def set_exif(photo_path):
    # TODO set the geolocation
    # "gps_latitude", "gps_longitude"
    pass


def get_meta(photo_path):
    try:
        image = Image.open(photo_path)
        exif = image.getexif()
        exif = {TAGS.get(tag_id): exif.get(tag_id) for tag_id in exif}
        return {
            "make": "".join(filter(lambda x: x in string.printable, exif["Make"])),
            "model": "".join(filter(lambda x: x in string.printable, exif["Model"])),
            "time": datetime.strptime(exif["DateTime"], "%Y:%m:%d %H:%M:%S"),
        }

    except UnidentifiedImageError:
        raise BadPhotoError(photo_path)


def store(photo_hash, photo_path):
    """
    copy photo to datastore with photo_hash as filename
    """
    dest_path = DEFAULT_PHOTO_STORE / photo_hash
    shutil.copyfile(photo_path, dest_path)
    return str(dest_path)


def hash_photo(photo_path):
    """
    should be used to avoid double imports
    """
    with open(photo_path, "rb") as image_file:
        return hashlib.md5(image_file.read()).hexdigest()
