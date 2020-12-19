import functools
import hashlib
import itertools
import multiprocessing
import numpy as np
import pathlib
import tarfile
import tensorflow as tf

from datetime import datetime
from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS

from deertracker import DEFAULT_PHOTO_STORE, database, model, logger

from deertracker.classifier import load_model
from deertracker.detector import MegaDetector


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


def store(filename, photo):
    dest_path = f"{DEFAULT_PHOTO_STORE}/{filename}.jpg"
    photo.save(dest_path, "JPEG")
    return dest_path


def export_ground_truth(output="./deertracker_crops.tar.gz"):
    with database.conn() as db:
        objects = db.select_ground_truth()
    dest_folder = "training_imgs"
    with tarfile.open(output, "w:gz") as tarball:
        for obj in objects:
            file_path = pathlib.Path(obj["path"])
            filename = file_path.relative_to(file_path.parent.parent)
            tarball.add(DEFAULT_PHOTO_STORE / filename, dest_folder / filename)
            print(f"Adding {dest_folder / filename} to {output}")


class PhotoProcessor:
    def __init__(self, file_paths, camera_name):
        self.file_paths = file_paths
        with database.conn() as db:
            self.camera = db.select_camera(camera_name)
            self.batch = db.insert_batch()
        if self.camera is None:
            raise Exception(f"Camera `{camera_name}` not found.")
        self.detector = MegaDetector()
        for label in self.detector.labels.values():
            (DEFAULT_PHOTO_STORE / label).mkdir(exist_ok=True)
        self.classifier = load_model()
        for label in self.classifier.classes:
            (DEFAULT_PHOTO_STORE / label).mkdir(exist_ok=True)

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
                for obj in model.model(self.detector, self.classifier, image):
                    obj_photo = obj["image"]
                    obj_label = obj["label"]
                    obj_conf = float(obj["confidence"])
                    obj_hash = hashlib.md5(obj_photo.tobytes()).hexdigest()
                    obj_id = f"{obj_label}/{int(obj_conf*100)}_{obj_hash}"
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
                            False,
                            photo_hash,
                            self.camera["name"],
                        )
                    )
                return db.insert_photo((photo_hash, file_path, self.batch["id"]))
        except Exception:
            msg = f"Error processing photo `{file_path}`"
            LOGGER.exception(msg)
            return {"error": msg}

    def get_time(self, image):
        try:
            return datetime.strptime(
                image.getexif()[EXIF_TAGS["DateTime"]], "%Y:%m:%d %H:%M:%S"
            )
        except KeyError:
            LOGGER.warn("Image is missing DateTime")
            return None
