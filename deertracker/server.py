import hashlib
import io

from datetime import datetime
from flask import Flask, jsonify, request
from PIL import Image
from werkzeug.exceptions import NotFound

from deertracker import model, database


def start(port):
    app = Flask(__name__)

    @app.route(
        "/",
        methods=["POST"],
    )
    def post():
        lat = request.form["lat"]
        lon = request.form["lon"]
        image = request.files["image"]
        return upload(image.read(), lat, lon)

    @app.route(
        "/<upload_id>",
        methods=["GET"],
    )
    def get(upload_id):
        print(f"fetching {upload_id}")
        photo = status(upload_id)
        if photo is None:
            raise NotFound()
        return jsonify(photo)

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
        photo["objects"] = [
            {
                "x": obj["x"],
                "y": obj["y"],
                "w": obj["w"],
                "h": obj["h"],
                "label": obj["label"],
                "score": str(obj["confidence"]),
            }
            for obj in db.select_photo_objects(hash)
        ]
    return photo


def upload(image: bytes, lat, lon):
    photo_hash = hashlib.md5(image).hexdigest()
    file_path = f"{photo_hash}.jpg"
    with database.conn() as db:
        photo = db.select_photo(photo_hash)
        if photo is not None:
            return {"upload_id": photo_hash, "time": photo["time"]}
    image = Image.open(io.BytesIO(image))
    time = model.get_time(image)
    model.store_photo(file_path, image)
    with database.conn() as db:
        db.insert_photo((photo_hash, file_path, lat, lon, time, None))
    return {"upload_id": photo_hash, "time": time}
