from datetime import datetime
import hashlib
import io
import multiprocessing
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
        self.pool = multiprocessing.Pool(1)

    def predict(
        self, image: bytes, photo_hash, photo_time, confidence=0.98, lat=None, lon=None
    ):
        """
        Runs predictions, but pads crops before storage (for training), and result data structure
        is a bit different
        """
        image = Image.open(io.BytesIO(image))
        if lat is None or lon is None:
            lat, lon = get_gps(image)
        image = np.array(image)
        bboxes, labels, scores = self._predict(image, confidence=confidence)
        self.pool.apply_async(
            process_image,
            (
                bboxes,
                labels,
                scores,
                image,
                lat,
                lon,
                photo_time,
                photo_hash,
            ),
        )
        return {
            "time": photo_time.timestamp() * 1000,
            "lat": lat,
            "lon": lon,
            "objects": [
                {
                    "bbox": {
                        "x": int(bbox[0]),
                        "y": int(bbox[1]),
                        "w": int(bbox[2]),
                        "h": int(bbox[3]),
                    },
                    "label": label,
                    "score": float(score),
                }
                for bbox, label, score in zip(bboxes, labels, scores)
            ],
        }

    def _predict(self, image: np.ndarray, confidence: float = 0.98):
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
                r_bboxes.append((int(x), int(y), int(w), int(h)))
                r_labels.append(label)
                r_scores.append(float(score))
        return r_bboxes, r_labels, r_scores


def process_image(bboxes, labels, scores, image, lat, lon, image_time, image_hash):
    try:
        file_path = f"{image_hash}.jpg"
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
            crop_id = hashlib.md5(crop.tobytes()).hexdigest()
            crop_path = f"{label}/{int(score*100)}_{crop_id}.jpg"
            store_crop(crop_path, crop)
            with database.conn() as db:
                db.insert_object(
                    (
                        crop_id,
                        crop_path,
                        x,
                        y,
                        w,
                        h,
                        lat,
                        lon,
                        image_time,
                        label,
                        float(score),
                        False,
                        image_hash,
                        None,
                    )
                )
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


def get_gps(image):
    def get_decimal_from_dms(dms, ref):
        degrees = dms[0]
        minutes = dms[1] / 60.0
        seconds = dms[2] / 3600.0
        if ref in ["S", "W"]:
            degrees = -degrees
            minutes = -minutes
            seconds = -seconds
        return round(degrees + minutes + seconds, 5)

    def get_coordinates(geo):
        lat = get_decimal_from_dms(
            geo[GPS_TAGS["GPSLatitude"]], geo[GPS_TAGS["GPSLatitudeRef"]]
        )
        lon = get_decimal_from_dms(
            geo[GPS_TAGS["GPSLongitude"]], geo[GPS_TAGS["GPSLongitudeRef"]]
        )
        return (lat, lon)

    try:
        return get_coordinates(image.getexif()[EXIF_TAGS["GPSInfo"]])
    except KeyError:
        return None
