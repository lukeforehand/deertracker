import cv2
import hashlib
import json
import pathlib
import shutil

from PIL import Image

from deertracker import photo, database, DEFAULT_PHOTO_STORE


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
    images = {image["id"]: image for image in labels["images"]}
    return [
        {
            "file_path": images[label["image_id"]]["file_name"],
            "label": categories[label["category_id"]],
        }
        for label in labels["annotations"]
        if label["image_id"] not in bbox_image_ids
    ]


def process_labels(photos, labels, output_path=pathlib.Path("caltech/uncropped")):
    output_path.mkdir(exist_ok=True)
    for label in labels:
        (output_path / label["label"]).mkdir(exist_ok=True)
        yield shutil.copy(
            pathlib.Path(photos) / pathlib.Path(label["file_path"]).name,
            output_path / label["label"] / pathlib.Path(label["file_path"]).name,
        )


def load_bboxes(bboxes_json):
    with open(bboxes_json) as j:
        bboxes = json.load(j)
    categories = {category["id"]: category["name"] for category in bboxes["categories"]}
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


def process_annotation(batch, photos, filename, label, bbox):
    (DEFAULT_PHOTO_STORE / label).mkdir(exist_ok=True)
    with database.conn() as db:
        image = cv2.imread(f"{photos}/{filename}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_hash = hashlib.md5(image.tobytes()).hexdigest()

        crop = crop_image(image, bbox)
        obj_id = hashlib.md5(crop.tobytes()).hexdigest()
        obj_path = photo.store(f"{label}/{obj_id}", crop)
        db.insert_object(
            (
                obj_id,
                obj_path,
                0.0,
                0.0,
                None,
                label,
                1.0,
                True,
                image_hash,
                "training",
            )
        )
        db.insert_photo((image_hash, filename, batch["id"]))
        return {"id": obj_id}
