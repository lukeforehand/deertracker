import cv2
import hashlib
import itertools
import json
import numpy as np
import pathlib
import shutil
import string

from datetime import datetime
from PIL import Image

from deertracker import photo, database, model, logger


def crop_image(image, bbox):
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


def load_labels(bboxes_json, labels_json):
    with open(bboxes_json) as j:
        bboxes = json.load(j)
        bbox_image_ids = {
            annotation["image_id"] for annotation in bboxes["annotations"]
        }

    with open(labels_json) as j:
        labels = json.load(j)
    categories = {category["id"]: category["name"] for category in labels["categories"]}
    (photo.DEFAULT_PHOTO_STORE / "uncropped").mkdir(exist_ok=True)
    for category in categories.values():
        (photo.DEFAULT_PHOTO_STORE / "uncropped" / category).mkdir(exist_ok=True)
    images = {image["id"]: image for image in labels["images"]}
    return [
        {
            "file_path": images[label["image_id"]]["file_name"],
            "label": categories[label["category_id"]],
        }
        for label in labels["annotations"]
        if label["image_id"] not in bbox_image_ids
    ]


def process_labels(photos, labels):
    for label in labels:
        yield shutil.copy(
            pathlib.Path(photos) / pathlib.Path(label["file_path"]).name,
            photo.DEFAULT_PHOTO_STORE
            / "uncropped"
            / label["label"]
            / pathlib.Path(label["file_path"]).name,
        )


def load_bboxes(bboxes_json):
    with open(bboxes_json) as j:
        bboxes = json.load(j)
    categories = {category["id"]: category["name"] for category in bboxes["categories"]}
    (photo.DEFAULT_PHOTO_STORE / "training").mkdir(exist_ok=True)
    for category in categories.values():
        (photo.DEFAULT_PHOTO_STORE / "training" / category).mkdir(exist_ok=True)
    images = {image["id"]: image for image in bboxes["images"]}
    return [
        {
            "file_path": images[annotation["image_id"]]["file_name"],
            "label": categories[annotation["category_id"]],
            "_class": annotation["category_id"],
            "bbox": annotation["bbox"],
        }
        for annotation in bboxes["annotations"]
    ]


def process_annotations(photos, annotations):
    with database.conn() as db:
        batch = db.insert_batch()
    for annotation in annotations:
        try:
            yield process_annotation(
                batch,
                photos,
                annotation["file_path"],
                annotation["label"],
                annotation["bbox"],
            )
        except Exception as e:
            print(e)


def process_annotation(batch, photos, file_path, label, bbox):
    with database.conn() as db:
        image = cv2.imread(f"{photos}/{file_path}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_hash = hashlib.md5(image.tobytes()).hexdigest()

        obj_photo = crop_image(image, bbox)
        obj_label = label
        obj_hash = hashlib.md5(obj_photo.tobytes()).hexdigest()
        obj_id = f"training/{obj_label}/{obj_hash}"
        obj_path = photo.store(obj_id, obj_photo)
        db.insert_object(
            (
                obj_id,
                obj_path,
                0.0,
                0.0,
                None,
                obj_label,
                1.0,
                image_hash,
                "training",
            )
        )
        db.insert_photo((image_hash, file_path, batch["id"]))
        return {"id": obj_id}
