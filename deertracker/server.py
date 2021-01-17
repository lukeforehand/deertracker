import hashlib
import io
import multiprocessing
import numpy as np
import time

from datetime import datetime
from flask import Flask, jsonify, request
from PIL import Image, UnidentifiedImageError
from werkzeug.exceptions import NotFound, BadRequest

from deertracker import model, database, DEFAULT_PHOTO_STORE


def start(port):
    pool = multiprocessing.Pool(3)
    pool.apply_async(start_server, (port,))
    start_detector(pool)
    pool.close()
    pool.join()


def start_detector(pool):
    print(f"Starting detector service")
    from deertracker.model import Detector

    detector = Detector()
    print(f"Detector service started")

    while True:
        with database.conn() as db:
            photos = db.select_unprocessed_photos()
        if len(photos) > 0:
            print(f"processing {len(photos)} photos")
        for photo in photos:
            photo_path = DEFAULT_PHOTO_STORE / photo["path"]
            image = Image.open(photo_path)
            image = np.array(image)
            now = datetime.now()
            bboxes, labels, scores, label_arrays, score_arrays = detector.predict(
                image, photo["id"]
            )
            print(
                f"{photo['id']} {bboxes}, {labels}, {scores} {label_arrays} {score_arrays} took {datetime.now() - now} seconds"
            )
            pool.apply_async(
                model.process_crops,
                (
                    bboxes,
                    labels,
                    scores,
                    label_arrays,
                    score_arrays,
                    image,
                    photo["lat"],
                    photo["lon"],
                    photo["time"],
                    photo["id"],
                ),
            )
        time.sleep(3)


def start_server(port):
    app = Flask(__name__)

    @app.route(
        "/",
        methods=["POST"],
    )
    def post():
        lat = request.form["lat"]
        lon = request.form["lon"]
        image = request.files["image"]
        photo = upload(image.read(), lat, lon)
        print(f"sending response {photo}")
        return jsonify(photo)

    @app.route(
        "/<upload_id>",
        methods=["GET"],
    )
    def get(upload_id):
        photo = status(upload_id)
        if photo is None:
            raise NotFound()
        print(f"sending response {photo}")
        return jsonify(photo)

    print(f"HTTP service starting on port {port}")
    app.run(host="0.0.0.0", port=port)


def status(upload_id):
    """
    Gets the prediction result, if any, for the given photo hash (upload_id)
    """
    with database.conn() as db:
        photo = db.select_photo(upload_id)
    if photo is None:
        return None
    photo = {"upload_id": upload_id, "processed": photo["processed"]}
    if photo["processed"]:
        with database.conn() as db:
            photo["objects"] = [
                {
                    "x": str(obj["x"]),
                    "y": str(obj["y"]),
                    "w": str(obj["w"]),
                    "h": str(obj["h"]),
                    "label": obj["label"],
                    "label_array": obj["label_array"],
                    "score": str(obj["score"]),
                    "score_array": obj["score_array"],
                }
                for obj in db.select_photo_objects(upload_id)
            ]
    return photo


def upload(image: bytes, lat, lon):
    try:
        image = Image.open(io.BytesIO(image))
        photo_hash = hashlib.md5(image.tobytes()).hexdigest()
        file_path = f"{photo_hash}.jpg"
        with database.conn() as db:
            photo = db.select_photo(photo_hash)
            if photo is not None:
                return {"upload_id": photo_hash, "time": photo["time"]}
        time = model.get_time(image)
        model.store_photo(file_path, image)
        with database.conn() as db:
            db.insert_photo((photo_hash, file_path, lat, lon, time, None))
        return {"upload_id": photo_hash, "time": time}
    except UnidentifiedImageError:
        raise BadRequest()
