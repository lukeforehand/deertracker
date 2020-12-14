import pathlib

from deertracker import database, caltech, photo


def process_annotations(photos, image_ids, bboxes, classes, labels):
    image_map = {}
    with open(image_ids) as f:
        for line in f:
            pieces = line.strip().split()
            image_id = pieces[0]
            path = pieces[1]
            image_map[image_id] = path
    bbox_map = {}
    with open(bboxes) as f:
        for line in f:
            pieces = line.strip().split()
            image_id = pieces[0]
            bbox = tuple(map(int, pieces[1:]))
            bbox_map[image_id] = bbox
    class_map = {}
    with open(classes) as f:
        for line in f:
            pieces = line.strip().split()
            class_id = pieces[0]
            class_map[class_id] = "_".join(pieces[1:]).replace("/", "_")
    label_map = {}
    with open(labels) as f:
        for line in f:
            pieces = line.strip().split()
            image_id = pieces[0]
            class_id = pieces[1]
            label_map[image_id] = class_map[class_id]

    (photo.DEFAULT_PHOTO_STORE / "training").mkdir(exist_ok=True)
    for category in label_map.values():
        (photo.DEFAULT_PHOTO_STORE / "training" / category).mkdir(exist_ok=True)
    with database.conn() as db:
        batch = db.insert_batch()
    for image_id, path in image_map.items():
        annotation = {
            "file_path": image_map[image_id],
            "label": label_map[image_id],
            "bbox": bbox_map[image_id],
        }
        try:
            yield caltech.process_annotation(
                batch,
                photos,
                annotation["file_path"],
                annotation["label"],
                annotation["bbox"],
            )
        except Exception as e:
            print(e)
