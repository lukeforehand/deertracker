import cv2
import numpy as np

from PIL import Image


def model(detector, classifier, photo, confidence=0.98):
    image = np.array(photo)
    bbox, _class, scores = detector.predict(image)
    results = []
    for i, _ in enumerate(bbox):

        x = bbox[i][1]
        x2 = bbox[i][3]
        y = bbox[i][0]
        y2 = bbox[i][2]
        w = x2 - x
        h = y2 - y

        pw = max(int(w * 0.01), 10)
        ph = max(int(h * 0.01), 10)

        crop = image[
            max(y - ph, 0) : min(y2 + ph, image.shape[0]),
            max(x - pw, 0) : min(x2 + pw, image.shape[1]),
        ]

        label = detector.labels[_class[i]]
        score = scores[i]

        if label == "animal":
            predictions = classifier.predict(crop)
            high_score = np.argmax(predictions)
            score = predictions[high_score]
            label = classifier.classes[high_score]

        if score > confidence:
            results.append(
                {
                    "image": Image.fromarray(crop),
                    "label": label,
                    "confidence": score,
                    "x": x,
                    "y": y,
                    "w": w,
                    "h": h,
                }
            )
    return results


# FIXME: this doesn't support a lot of video types right now,
# probably need to install more codecs
def first_frame(video_path):
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    return Image.fromarray(image[:, :, ::-1].copy())
