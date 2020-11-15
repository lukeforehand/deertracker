import imagehash
import pathlib


from PIL import Image


def hash(photo_path):
    """
    perception hash will detect similar images
    should be used to avoid double imports
    """
    return str(imagehash.phash_simple(Image.open(photo_path)))
