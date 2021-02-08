import hashlib
import io
import json
import numpy as np
import os
import pathlib

from datetime import datetime
from flask import Flask, jsonify, request
from google.cloud import datastore, storage
from PIL import Image


class Detector:
    """
    Performs predictions using mega detector and defers to classifier
    """

    def __init__(self, detector_path, classifier_path):
        from deertracker.detector import MegaDetector

        self.detector = MegaDetector(filepath=detector_path)
        from deertracker.classifier import load_model as Classifier

        self.classifier = Classifier(model_path=classifier_path)
        self.labels = self.classifier.classes + list(self.detector.labels.values())
        # for label in self.labels:
        #    (DEFAULT_CROP_STORE / label).mkdir(exist_ok=True)

    def predict(self, image: np.ndarray, confidence=0.97):
        """
        Runs predictions, but pads crops before storage (for training), and result data structure
        is a bit different
        """
        bboxes, labels, scores = self.detector.predict(image)
        r_bboxes = []
        r_labels = []
        r_scores = []
        r_label_arrays = []
        r_score_arrays = []
        for bbox, label, score in zip(bboxes, labels, scores):
            x = bbox[0]
            y = bbox[1]
            w = bbox[2]
            h = bbox[3]
            crop = image[
                max(y, 0) : min(y + h, image.shape[0]),
                max(x, 0) : min(x + w, image.shape[1]),
            ]
            score_array = np.array([score])
            label_array = np.array([label])
            if label == "animal":
                score_array = self.classifier.predict(crop)
                top_idx = np.argsort(-score_array)[:5]
                score_array = score_array[[top_idx]]
                label_array = np.array(self.classifier.classes)[top_idx]
                high_score_idx = np.argmax(score_array)
                animal_score = score_array[high_score_idx]
                animal_label = label_array[high_score_idx]
                if animal_score > confidence:
                    # append animal score to the end
                    score_array = np.append(score_array, [score])
                    label_array = np.append(label_array, [label])
                    score = animal_score
                    label = animal_label
                else:
                    # insert animal score in the beginning
                    score_array = np.append([score], score_array)
                    label_array = np.append([label], label_array)

            r_bboxes.append((int(x), int(y), int(w), int(h)))
            r_labels.append(label)
            r_scores.append(float(score))
            r_score_arrays.append(score_array.tolist())
            r_label_arrays.append(label_array.tolist())
        return r_bboxes, r_labels, r_scores, r_label_arrays, r_score_arrays


def process_crops(
    datastore_client,
    bucket,
    bboxes,
    labels,
    scores,
    label_arrays,
    score_arrays,
    image: np.ndarray,
    photo,
):
    objects = []
    for bbox, label, score, label_array, score_array in zip(
        bboxes, labels, scores, label_arrays, score_arrays
    ):
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
        crop_path = f"crops/{label}/{crop_id}.jpg"
        blob = bucket.blob(crop_path)
        buff = io.BytesIO()
        crop.save(buff, format="JPEG")
        blob.upload_from_string(buff.getvalue())
        objects.append(
            {
                "id": crop_id,
                "path": crop_path,
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "label": label,
                "score": float(score),
                "label_array": label_array,
                "score_array": score_array,
                "ground_truth": False,
            }
        )
    photo["objects"] = objects
    photo["processed"] = True
    datastore_client.put(photo)
    return photo


def process_photo(datastore_client, bucket, detector, photo, photo_bytes):
    image = Image.open(io.BytesIO(photo_bytes))
    image = np.array(image)
    now = datetime.now()
    bboxes, labels, scores, label_arrays, score_arrays = detector.predict(image)
    print(
        f"{bboxes}, {labels}, {scores} {label_arrays} {score_arrays} took {datetime.now() - now} seconds"
    )
    return process_crops(
        datastore_client,
        bucket,
        bboxes,
        labels,
        scores,
        label_arrays,
        score_arrays,
        image,
        photo,
    )


def init_app():

    detector = Detector("/app/detector.pb", "/app/classifier")
    bucket_name = os.environ["BUCKET"]
    bucket = storage.Client().get_bucket(bucket_name)
    datastore_client = datastore.Client()

    app = Flask(__name__)

    @app.route("/", methods=["POST"])
    def post():
        resp = request.json
        resource_name = resp["protoPayload"]["resourceName"]
        if resource_name.startswith(
            f"projects/_/buckets/{bucket_name}/objects/uploads/"
        ):
            print(f"processing resource {resource_name}")
            path = pathlib.Path(resource_name)
            key = datastore_client.key("photo", path.stem)
            photo = datastore_client.get(key)
            blob = bucket.blob(f"uploads/{path.name}")
            return jsonify(
                process_photo(
                    datastore_client,
                    bucket,
                    detector,
                    photo,
                    blob.download_as_bytes(),
                )
            )
        return jsonify({"info": f"{resource_name} was not processed"})

    return app


app = init_app()
