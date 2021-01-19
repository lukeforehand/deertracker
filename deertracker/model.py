from datetime import datetime
import hashlib
import io
import json
import numpy as np
import pathlib
import tarfile

from PIL import Image

from PIL.ExifTags import TAGS, GPSTAGS

from deertracker import (
    DEFAULT_CLASSIFIER_PATH,
    DEFAULT_CROP_STORE,
    DEFAULT_PHOTO_STORE,
    database,
    logger,
)

LOGGER = logger.get_logger()
EXIF_TAGS = dict(((v, k) for k, v in TAGS.items()))
GPS_TAGS = dict(((v, k) for k, v in GPSTAGS.items()))


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

    def predict(self, image: np.ndarray, photo_hash, confidence=0.97):
        """
        Runs predictions, but pads crops before storage (for training), and result data structure
        is a bit different
        """
        bboxes, labels, scores = self.detector.predict(image)
        r_bboxes = []
        r_labels = []
        r_scores = []
        r_label_arrays = []
        r_score_arrays = []
        for bbox, label, score in zip(bboxes, labels, scores):
            x = bbox[0]
            y = bbox[1]
            w = bbox[2]
            h = bbox[3]
            crop = image[
                max(y, 0) : min(y + h, image.shape[0]),
                max(x, 0) : min(x + w, image.shape[1]),
            ]
            score_array = np.array([score])
            label_array = np.array([label])
            if label == "animal":
                score_array = self.classifier.predict(crop)
                top_idx = np.argsort(-score_array)[:3]
                score_array = score_array[[top_idx]]
                label_array = np.array(self.classifier.classes)[top_idx]
                high_score = np.argmax(score_array)
                score = score_array[high_score]
                label = label_array[high_score]
            if score > confidence:
                r_bboxes.append((int(x), int(y), int(w), int(h)))
                r_labels.append(label)
                r_scores.append(float(score))
                r_score_arrays.append(score_array.tolist())
                r_label_arrays.append(label_array.tolist())
        return r_bboxes, r_labels, r_scores, r_label_arrays, r_score_arrays


def process_crops(
    bboxes,
    labels,
    scores,
    label_arrays,
    score_arrays,
    image: np.ndarray,
    lat,
    lon,
    image_time,
    image_hash,
):
    try:
        for bbox, label, score, label_array, score_array in zip(
            bboxes, labels, scores, label_arrays, score_arrays
        ):
            x, y, w, h = bbox
            pw = max(int(w * 0.01), 10)
            ph = max(int(h * 0.01), 10)
            crop = Image.fromarray(
                image[
                    max(y - ph, 0) : min(y + h + ph, image.shape[0]),
                    max(x - pw, 0) : min(x + w + pw, image.shape[1]),
                ]
            )
            crop_id = hashlib.md5(crop.tobytes()).hexdigest()
            crop_path = f"{label}/{int(score*100)}_{crop_id}.jpg"
            store_crop(crop_path, crop)
            with database.conn() as db:
                db.insert_object(
                    (
                        crop_id,
                        crop_path,
                        int(x),
                        int(y),
                        int(w),
                        int(h),
                        float(lat),
                        float(lon),
                        image_time,
                        label,
                        json.dumps(label_array),
                        float(score),
                        json.dumps(score_array),
                        False,
                        image_hash,
                        None,
                    )
                )
        with database.conn() as db:
            db.update_photo(image_hash, processed=True)
    except Exception as e:
        LOGGER.exception(e)


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
        db.insert_photo((image_hash, filename, None, None, None, None, None, None))
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
