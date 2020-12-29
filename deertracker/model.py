import cv2
import io
import numpy as np
import pathlib

from PIL import Image

from deertracker import DEFAULT_CLASSIFIER_PATH


class Detector:
    """
    Performs predictions using mega detector and defers to classifier
    """

    def __init__(self):
        from deertracker.detector import MegaDetector

        self.detector = MegaDetector()
        from deertracker.classifier import load_model as Classifier

        self.classifier = Classifier()

        self.labels = self.classifier.classes + list(self.detector.labels.values())

    def predict(self, image, confidence=0.98):
        if isinstance(image, bytes):
            image = np.array(Image.open(io.BytesIO(image)))
        else:
            image = np.array(image)

        bboxes, labels, scores = self.detector.predict(image)
        r_bboxes = []
        r_labels = []
        r_scores = []

        for bbox, label, score in zip(bboxes, labels, scores):
            x = bbox[0]
            y = bbox[1]
            w = bbox[2]
            h = bbox[3]
            crop = image[
                max(y, 0) : min(y + h, image.shape[0]),
                max(x, 0) : min(x + w, image.shape[1]),
            ]
            if label == "animal":
                predictions = self.classifier.predict(crop)
                high_score = np.argmax(predictions)
                score = predictions[high_score]
                label = self.classifier.classes[high_score]
            if score > confidence:
                r_bboxes.append((x, y, w, h))
                r_labels.append(label)
                r_scores.append(score)
        return r_bboxes, r_labels, r_scores


def model(detector, image, confidence=0.98):
    """
    Runs predictions, but pads crops before storage (for training), and result data structure
    is a bit different
    """
    bboxes, labels, scores = detector.predict(image, confidence=confidence)
    results = []
    for bbox, label, score in zip(bboxes, labels, scores):
        x, y, w, h = bbox
        pw = max(int(w * 0.01), 10)
        ph = max(int(h * 0.01), 10)
        crop = Image.fromarray(
            image[
                max(y - ph, 0) : min(y + h + ph, image.shape[0]),
                max(x - pw, 0) : min(x + w + pw, image.shape[1]),
            ]
        )
        results.append(
            {"crop": crop, "label": label, "score": score, "bbox": (x, y, w, h)}
        )
    return results


# FIXME: this doesn't support a lot of video types right now,
# probably need to install more codecs
def first_frame(video_path):
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    return Image.fromarray(image[:, :, ::-1].copy())
