import hashlib
import io
import os

from datetime import datetime
from flask import Flask, jsonify, request
from flask_basicauth import BasicAuth
from google.cloud import datastore, storage
from PIL import Image, UnidentifiedImageError
from werkzeug.exceptions import NotFound, BadRequest

from PIL.ExifTags import TAGS, GPSTAGS

EXIF_TAGS = dict(((v, k) for k, v in TAGS.items()))
GPS_TAGS = dict(((v, k) for k, v in GPSTAGS.items()))


def start(port, username, password):
    print(f"HTTP service starting on port {port}")
    app = init_app(username, password)
    app.run(host="0.0.0.0", port=port)


def init_app(username, password):
    app = Flask(__name__)
    app.config["BASIC_AUTH_FORCE"] = True
    app.config["BASIC_AUTH_USERNAME"] = username
    app.config["BASIC_AUTH_PASSWORD"] = password
    basic_auth = BasicAuth(app)

    bucket = storage.Client().get_bucket(os.environ["BUCKET"])
    datastore_client = datastore.Client()

    @app.route("/user/<device_id>", methods=["GET"])
    def user_get(device_id):
        key = datastore_client.key("user", device_id)
        user = datastore_client.get(key)
        if user is None:
            user = datastore.Entity(key=key)
            user["photo_credits"] = 1000
            datastore_client.put(user)
        return jsonify(user)

    @app.route("/user/<device_id>", methods=["PUT"])
    def user_put(device_id):
        photo_credits = int(request.form["photo_credits"])
        key = datastore_client.key("user", device_id)
        user = datastore_client.get(key)
        user["photo_credits"] = photo_credits
        datastore_client.put(user)
        print(f"sending response {user}")
        return jsonify(user)

    @app.route("/", methods=["POST"])
    def post():
        lat = request.form["lat"]
        lon = request.form["lon"]
        image = request.files["image"]
        photo = upload(bucket, datastore_client, image.read(), lat, lon)
        print(f"sending response {photo}")
        return jsonify(photo)

    @app.route("/<upload_id>", methods=["GET"])
    def get(upload_id):
        key = datastore_client.key("photo", upload_id)
        photo = datastore_client.get(key)
        if photo is None:
            raise NotFound()
        print(f"sending response {photo}")
        return jsonify(photo)

    @app.route("/<upload_id>", methods=["PUT"])
    def put(upload_id):
        x = int(request.form["x"])
        y = int(request.form["y"])
        w = int(request.form["w"])
        h = int(request.form["h"])
        label = request.form["label"]
        score = request.form["score"]

        key = datastore_client.key("photo", upload_id)
        photo = datastore_client.get(key)
        if photo is None:
            raise NotFound()
        objects = photo["objects"]
        for obj in objects:
            if obj["x"] == x and obj["y"] == y and obj["w"] == w and obj["h"] == h:
                blob = bucket.blob(obj["path"])
                bucket.copy_blob(blob, bucket, f"ground_truth/{label}/{obj['id']}.jpg")
                obj["label"] = label
                obj["score"] = score
                datastore_client.put(photo)
                break
        return jsonify({"label": label, "score": score, "x": x, "y": y, "w": w, "h": h})

    return app


def get_time(image):
    try:
        return datetime.strptime(
            image.getexif()[EXIF_TAGS["DateTime"]], "%Y:%m:%d %H:%M:%S"
        )
    except KeyError:
        return None


def upload(bucket, datastore_client, image: bytes, lat, lon):
    try:
        buff = io.BytesIO(image)
        image = Image.open(buff)
        width, height = image.size
        time = get_time(image)

        photo_hash = hashlib.md5(image.tobytes()).hexdigest()
        file_path = f"uploads/{photo_hash}.jpg"
        blob = bucket.blob(file_path)
        buff.seek(0)
        blob.upload_from_file(buff)

        key = datastore_client.key("photo", photo_hash)
        photo = datastore.Entity(key=key)
        photo["path"] = file_path
        photo["lat"] = lat
        photo["lon"] = lon
        photo["time"] = time
        photo["width"] = width
        photo["height"] = height
        photo["processed"] = False
        datastore_client.put(photo)

        return {"upload_id": photo_hash, "time": time, "width": width, "height": height}

    except UnidentifiedImageError:
        raise BadRequest()


app = init_app(
    os.environ["BASIC_AUTH_USERNAME"],
    os.environ["BASIC_AUTH_PASSWORD"],
)