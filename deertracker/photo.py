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

from deertracker import DEFAULT_PHOTO_STORE, database, model, logger
from deertracker.model import MegaDetector


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


def store(photo_hash, photo):
    dest_path = f"{DEFAULT_PHOTO_STORE}/{photo_hash}.jpg"
    photo.save(dest_path, "JPEG")
    return dest_path


class PhotoProcessor:
    def __init__(self, camera_name, training, file_paths):
        self.training = training
        self.file_paths = file_paths
        if training:
            camera_name = "training"
        with database.conn() as db:
            self.camera = db.select_camera(camera_name)
            self.batch = db.insert_batch()
        if self.camera is None:
            raise Exception(f"Camera `{camera_name}` not found.")
        self.detector = MegaDetector()

    def import_photos(
        self,
    ):
        if CPUS <= 1 or tf.test.is_gpu_available():
            return self._import_photos(True, self.file_paths)
        pool = multiprocessing.Pool(CPUS)
        results = pool.map(
            functools.partial(self._import_photos, False),
            np.array_split(self.file_paths, CPUS),
        )
        pool.close()
        pool.join()
        return itertools.chain.from_iterable(results)

    def _import_photos(self, yield_results, file_paths):
        if yield_results:
            for file_path in file_paths:
                yield self.process_photo(file_path)
        else:
            return [self.process_photo(file_path) for file_path in file_paths]

    def process_photo(self, file_path):
        try:
            with database.conn() as db:
                if pathlib.Path(file_path).suffix.lower() in VIDEO_EXTS:
                    image = model.first_frame(file_path)
                    if image is None:
                        return {"error": f"Video `{file_path}` could not be processed."}
                else:
                    image = Image.open(file_path)
                photo_hash = hashlib.md5(image.tobytes()).hexdigest()
                if db.select_photo(photo_hash) is not None:
                    return {"error": f"Photo `{file_path}` already exists."}
                photo_time = self.get_time(image)
                for obj in model.model(self.detector, image):
                    obj_photo = obj["image"]
                    obj_label = obj["label"]
                    obj_conf = float(obj["confidence"])
                    obj_hash = hashlib.md5(obj_photo.tobytes()).hexdigest()
                    obj_id = f"{obj_label}_{int(obj_conf*100)}_{obj_hash}"
                    obj_path = store(obj_id, obj_photo)
                    db.insert_object(
                        (
                            obj_id,
                            obj_path,
                            self.camera["lat"],
                            self.camera["lon"],
                            photo_time,
                            obj_label,
                            obj_conf,
                            photo_hash,
                            self.camera["name"],
                        )
                    )
                return db.insert_photo((photo_hash, file_path, self.batch["id"]))
        except Exception:
            msg = f"Error processing photo `{file_path}`"
            LOGGER.exception(msg)
            return {"error": msg}

    # TODO: do we want to override lat/lon from EXIF if available?

    def get_time(self, image):
        try:
            return datetime.strptime(
                image.getexif()[EXIF_TAGS["DateTime"]], "%Y:%m:%d %H:%M:%S"
            )
        except KeyError:
            if self.training:
                return None
            raise
