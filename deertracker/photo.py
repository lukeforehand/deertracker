import cv2
import pathlib
import numpy as np

from PIL import Image

from deertracker import database, logger, model, server

from deertracker.model import Detector


PHOTO_EXTS = {".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mp4", ".mov", ".avi"}

LOGGER = logger.get_logger()


def add_location(name, lat, lon):
    with database.conn() as db:
        return db.insert_location((name, lat, lon))


# FIXME: this doesn't support a lot of video types right now,
# probably need to install more codecs
def first_frame(video_path):
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    return Image.fromarray(image[:, :, ::-1].copy())


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

    def import_photos(self):
        for file_path in self.file_paths:
            yield self.process_photo(file_path)

    def process_photo(self, file_path):
        try:
            if pathlib.Path(file_path).suffix.lower() in VIDEO_EXTS:
                image = first_frame(file_path)
                if image is None:
                    return {"error": f"Video `{file_path}` could not be processed."}
            else:
                image = Image.open(file_path)

            photo = server.upload(
                image.tobytes(), self.location["lat"], self.location["lon"]
            )
            image = np.array(image)
            bboxes, labels, scores, label_arrays, score_arrays = self.detector.predict(
                image, photo["upload_id"]
            )
            model.process_crops(
                (
                    bboxes,
                    labels,
                    scores,
                    label_arrays,
                    score_arrays,
                    image,
                    self.location["lat"],
                    self.location["lon"],
                    photo["time"],
                    photo["upload_id"],
                ),
            )

        except Exception:
            msg = f"Error processing photo `{file_path}`"
            LOGGER.exception(msg)
            return {"error": msg}
