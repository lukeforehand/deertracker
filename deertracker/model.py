import cv2
import numpy as np

from PIL import Image


def model(detector, classifier, photo):
    image = np.array(photo)
    bbox, _class, score = detector.predict(image)
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
        if label == "animal":
            # TODO: verify
            prediction = classifier(crop[np.newaxis, :, :]).numpy()[0]
            # FIXME: remove print
            print(prediction)
            # TODO: pull label and confidence from prediction

        results.append(
            {
                "image": Image.fromarray(crop),
                "label": label,
                "confidence": score[i],
            }
        )
    return results


# FIXME: this doesn't support a lot of video types right now,
# probably need to install more codecs
def first_frame(video_path):
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    return Image.fromarray(image[:, :, ::-1].copy())
