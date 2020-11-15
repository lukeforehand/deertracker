import imagehash
import pathlib
import shutil

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


def get_exif(photo_path):
    with open(photo_path, "rb") as image_file:
        my_image = ExifImage(image_file)
        if not my_image.has_exif:
            raise BadPhotoError(photo_path)
        return dir(my_image)


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
        return str(imagehash.phash_simple(Image.open(photo_path)))
    except UnidentifiedImageError:
        raise BadPhotoError(photo_path)
