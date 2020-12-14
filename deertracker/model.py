import cv2
import numpy as np
import tensorflow as tf

from PIL import Image


def model(detector, classifier, photo):
    image = np.array(photo)
    bbox, _class, scores = detector.predict(image)
    results = []
    for i, _ in enumerate(bbox):

        w = bbox[i][3] - bbox[i][1]
        pw = max(int(w * 0.01), 10)
        h = bbox[i][2] - bbox[i][0]
        ph = max(int(h * 0.01), 10)

        crop = image[
            max(bbox[i][0] - ph, 0) : min(bbox[i][2] + ph, image.shape[0]),
            max(bbox[i][1] - pw, 0) : min(bbox[i][3] + pw, image.shape[1]),
        ]

        label = detector.labels[_class[i]]
        score = scores[i]

        if label == "animal":
            predictions = classifier.predict(crop)
            high_score = np.argmax(predictions)
            score = predictions[high_score]
            label = classifier.classes[high_score]

        results.append(
            {
                "image": Image.fromarray(crop),
                "label": label,
                "confidence": score,
            }
        )
    return results


# FIXME: this doesn't support a lot of video types right now,
# probably need to install more codecs
def first_frame(video_path):
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    return Image.fromarray(image[:, :, ::-1].copy())
