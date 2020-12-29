import cv2
import hashlib
import numpy as np
import pathlib
import tarfile

from datetime import datetime
from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS

from deertracker import DEFAULT_CROP_STORE, DEFAULT_PHOTO_STORE, database, logger, model

from deertracker.model import Detector


EXIF_TAGS = dict(((v, k) for k, v in TAGS.items()))

PHOTO_EXTS = {".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mp4", ".mov", ".avi"}

LOGGER = logger.get_logger()


def add_location(name, lat, lon):
    with database.conn() as db:
        return db.insert_location((name, lat, lon))


def store_crop(filename, photo):
    dest_path = f"{DEFAULT_CROP_STORE}/{filename}"
    photo.save(dest_path, "JPEG")
    return f"{filename}"


def store_photo(filename, photo):
    dest_path = f"{DEFAULT_PHOTO_STORE}/{filename}"
    photo.save(dest_path, "JPEG")
    return f"{filename}"


def export_ground_truth(output="./deertracker_crops.tar.gz"):
    with database.conn() as db:
        objects = db.select_ground_truth()
    dest_folder = "training_imgs"
    with tarfile.open(output, "w:gz") as tarball:
        for obj in objects:
            file_path = pathlib.Path(obj["path"])
            tarball.add(DEFAULT_CROP_STORE / file_path, dest_folder / file_path)
            yield f"Added {dest_folder / file_path} to {output}"


def import_training_crops(input_dir, file_paths, ground_truth):
    with database.conn() as db:
        batch = db.insert_batch()
    file_paths = [x for x in pathlib.Path(input_dir).glob(f"**/*") if x.is_file()]
    for file_path in file_paths:
        file_path = file_path.relative_to(input_dir)
        label = file_path.parts[0]
        try:
            yield process_annotation(
                batch, input_dir, file_path, label, ground_truth=ground_truth
            )
        except Exception as e:
            print(e)


def crop_image(photo, bbox):
    image = np.array(photo)
    x = int(bbox[0])
    y = int(bbox[1])
    w = int(bbox[2])
    h = int(bbox[3])
    pw = max(int(w * 0.01), 10)
    ph = max(int(h * 0.01), 10)
    x1 = int(max(y - ph, 0))
    x2 = int(min(y + h + ph, image.shape[0]))
    y1 = int(max(x - pw, 0))
    y2 = int(min(x + w + pw, image.shape[1]))
    return Image.fromarray(
        image[
            x1:x2,
            y1:y2,
        ]
    )


def process_annotation(batch, photos, filename, label, bbox=None, ground_truth=False):
    (DEFAULT_CROP_STORE / label).mkdir(exist_ok=True)
    image = Image.open(f"{photos}/{filename}")
    image_hash = hashlib.md5(image.tobytes()).hexdigest()
    with database.conn() as db:
        if db.select_photo(image_hash) is not None:
            return {"error": f"Photo `{filename}` already exists."}
    if bbox:
        image = crop_image(image, bbox)
        obj_id = hashlib.md5(image.tobytes()).hexdigest()
    else:
        obj_id = image_hash
    obj_path = store_crop(f"{label}/{obj_id}.jpg", image)
    with database.conn() as db:
        db.insert_object(
            (
                obj_id,
                obj_path,
                int(bbox[0]),
                int(bbox[1]),
                int(bbox[2]),
                int(bbox[3]),
                0.0,
                0.0,
                None,
                label,
                1.0 if ground_truth else 0.0,
                ground_truth,
                image_hash,
                None,
            )
        )
        db.insert_photo((image_hash, None, batch["id"]))
    return {"id": obj_id}


class PhotoProcessor:
    def __init__(self, file_paths, location_name):
        self.file_paths = file_paths
        self.location = {"id": None, "lat": None, "lon": None}
        with database.conn() as db:
            if location_name:
                self.location = db.select_location(location_name)
                if self.location is None:
                    raise Exception(f"Location `{location_name}` not found.")
            self.batch = db.insert_batch()

        self.detector = Detector()
        for label in self.detector.labels:
            (DEFAULT_CROP_STORE / label).mkdir(exist_ok=True)

    def import_photos(self):
        for file_path in self.file_paths:
            yield self.process_photo(file_path)

    def process_photo(self, file_path):
        try:
            if pathlib.Path(file_path).suffix.lower() in VIDEO_EXTS:
                image = model.first_frame(file_path)
                if image is None:
                    return {"error": f"Video `{file_path}` could not be processed."}
            else:
                image = Image.open(file_path)
            photo_hash = hashlib.md5(image.tobytes()).hexdigest()
            with database.conn() as db:
                if db.select_photo(photo_hash) is not None:
                    return {"error": f"Photo `{file_path}` already exists."}
            photo_time = self.get_time(image)
            model_results = model.model(self.detector, image)
            if len(model_results) > 0:
                for obj in model_results:
                    obj_photo = obj["crop"]
                    obj_label = obj["label"]
                    obj_conf = float(obj["score"])
                    obj_bbox = obj["bbox"]
                    obj_id = hashlib.md5(obj_photo.tobytes()).hexdigest()
                    obj_path = store_crop(
                        f"{obj_label}/{int(obj_conf*100)}_{obj_id}.jpg",
                        obj_photo,
                    )
                    with database.conn() as db:
                        db.insert_object(
                            (
                                obj_id,
                                obj_path,
                                obj_bbox[0],
                                obj_bbox[1],
                                obj_bbox[2],
                                obj_bbox[3],
                                self.location["lat"],
                                self.location["lon"],
                                photo_time,
                                obj_label,
                                obj_conf,
                                False,
                                photo_hash,
                                self.location["id"],
                            )
                        )
                file_path = store_photo(f"{photo_hash}.jpg", image)
            with database.conn() as db:
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
