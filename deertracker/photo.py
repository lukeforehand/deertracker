import hashlib
import imagehash
import io
import pathlib
import shutil

from datetime import datetime
from exif import Image as ExifImage
from PIL import Image, UnidentifiedImageError

from deertracker import DEFAULT_DATA_STORE

DEFAULT_PHOTO_STORE = pathlib.Path(DEFAULT_DATA_STORE / "photos")
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)


class BadPhotoError(Exception):
    pass


def set_exif(photo_path):
    # TODO set the geolocation
    pass


def get_exif_datetime(photo_path):
    with open(photo_path, "rb") as image_file:
        image = ExifImage(image_file)
        if not image.has_exif:
            raise BadPhotoError(photo_path)
        return datetime.strptime(image["datetime"], "%Y:%m:%d %H:%M:%S")


def store(photo_hash, photo_path):
    """
    copy photo to datastore with photo_hash as filename
    """
    dest_path = DEFAULT_PHOTO_STORE / photo_hash
    shutil.copyfile(photo_path, dest_path)
    return str(dest_path)


def hash(photo_path):
    """
    perception hash will detect similar images
    should be used to avoid double imports
    """
    try:
        Image.open(photo_path)
        with open(photo_path, "rb") as image_file:
            return hashlib.md5(image_file.read()).hexdigest()
    except UnidentifiedImageError:
        raise BadPhotoError(photo_path)
