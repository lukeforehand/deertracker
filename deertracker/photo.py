import cv2
import hashlib
import pathlib
import numpy as np
import tarfile

from PIL import Image

from deertracker import (
    database,
    logger,
    server,
    DEFAULT_CROP_STORE,
    DEFAULT_DETECTOR_PATH,
    DEFAULT_CLASSIFIER_PATH,
)


PHOTO_EXTS = {".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mp4", ".mov", ".avi"}

LOGGER = logger.get_logger()


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


def store_crop(filename, photo):
    dest_path = f"{DEFAULT_CROP_STORE}/{filename}"
    photo.save(dest_path, "JPEG")
    return f"{filename}"


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
