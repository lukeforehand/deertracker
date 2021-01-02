import cv2
from datetime import datetime
import hashlib
import io
import numpy as np
import pathlib
import tarfile

from PIL import Image

from PIL.ExifTags import TAGS

from deertracker import (
    DEFAULT_CLASSIFIER_PATH,
    DEFAULT_CROP_STORE,
    DEFAULT_PHOTO_STORE,
    database,
)

EXIF_TAGS = dict(((v, k) for k, v in TAGS.items()))


class Detector:
    """
    Performs predictions using mega detector and defers to classifier
    """

    def __init__(self):
        from deertracker.detector import MegaDetector

        self.detector = MegaDetector()
        from deertracker.classifier import load_model as Classifier

        self.classifier = Classifier()
        self.labels = self.classifier.classes + list(self.detector.labels.values())
        for label in self.labels:
            (DEFAULT_CROP_STORE / label).mkdir(exist_ok=True)

    def predict(self, image: bytes, confidence=0.98, lat=None, lon=None):
        """
        Runs predictions, but pads crops before storage (for training), and result data structure
        is a bit different
        """
        photo_hash = hashlib.md5(image).hexdigest()
        image = Image.open(io.BytesIO(image))
        photo_time = get_time(image)
        image = np.array(image)
        bboxes, labels, scores = self._predict(image, confidence=confidence)
        results = []
        for bbox, label, score in zip(bboxes, labels, scores):
            x, y, w, h = bbox
            pw = max(int(w * 0.01), 10)
            ph = max(int(h * 0.01), 10)
            crop = Image.fromarray(
                image[
                    max(y - ph, 0) : min(y + h + ph, image.shape[0]),
                    max(x - pw, 0) : min(x + w + pw, image.shape[1]),
                ]
            )
            results.append(
                {"crop": crop, "label": label, "score": score, "bbox": (x, y, w, h)}
            )
        if len(results) > 0:
            for obj in results:
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
                            lat,
                            lon,
                            photo_time,
                            obj_label,
                            obj_conf,
                            False,
                            photo_hash,
                            None,
                        )
                    )
            file_path = store_photo(f"{photo_hash}.jpg", image)
        with database.conn() as db:
            db.insert_photo((photo_hash, file_path, None))
        # FIXME make the storage stuff above async
        return results

    def _predict(self, image, confidence=0.98):
        bboxes, labels, scores = self.detector.predict(image)
        r_bboxes = []
        r_labels = []
        r_scores = []
        for bbox, label, score in zip(bboxes, labels, scores):
            x = bbox[0]
            y = bbox[1]
            w = bbox[2]
            h = bbox[3]
            crop = image[
                max(y, 0) : min(y + h, image.shape[0]),
                max(x, 0) : min(x + w, image.shape[1]),
            ]
            if label == "animal":
                predictions = self.classifier.predict(crop)
                high_score = np.argmax(predictions)
                score = predictions[high_score]
                label = self.classifier.classes[high_score]
            if score > confidence:
                r_bboxes.append((x, y, w, h))
                r_labels.append(label)
                r_scores.append(score)
        return r_bboxes, r_labels, r_scores


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
    file_paths = [x for x in pathlib.Path(input_dir).glob(f"**/*") if x.is_file()]
    for file_path in file_paths:
        file_path = file_path.relative_to(input_dir)
        label = file_path.parts[0]
        try:
            yield process_annotation(
                input_dir, file_path, label, ground_truth=ground_truth
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


def process_annotation(photos, filename, label, bbox=None, ground_truth=False):
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
                None,
                None,
                None,
                label,
                1.0 if ground_truth else 0.0,
                ground_truth,
                image_hash,
                None,
            )
        )
        db.insert_photo((image_hash, None, None))
    return {"id": obj_id}


def store_crop(filename, photo):
    dest_path = f"{DEFAULT_CROP_STORE}/{filename}"
    photo.save(dest_path, "JPEG")
    return f"{filename}"


def store_photo(filename, photo):
    dest_path = f"{DEFAULT_PHOTO_STORE}/{filename}"
    photo.save(dest_path, "JPEG")
    return f"{filename}"


def get_time(image):
    try:
        return datetime.strptime(
            image.getexif()[EXIF_TAGS["DateTime"]], "%Y:%m:%d %H:%M:%S"
        )
    except KeyError:
        return None
