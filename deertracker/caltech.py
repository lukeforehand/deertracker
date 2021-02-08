import json
import pathlib
import shutil

from deertracker import photo


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
    for annotation in annotations:
        try:
            yield photo.process_annotation(
                photos,
                annotation["file_path"],
                annotation["label"],
                annotation["bbox"],
                ground_truth=True,
            )
        except Exception as e:
            print(e)
