import cv2
import cvlib as cv
import matplotlib.pyplot as plt
import numpy as np

from cvlib.object_detection import draw_bbox
from PIL import Image


def model(image):
    image = np.array(image)
    bbox, label, conf = cv.detect_common_objects(image)
    results = []
    for i, _ in enumerate(bbox):
        results.append(
            {
                "image": Image.fromarray(
                    # y1:y2, x1:x2
                    image[bbox[i][1] : bbox[i][3], bbox[i][0] : bbox[i][2]]
                ),
                "label": label[i],
                "confidence": conf[i],
            }
        )
    return results


def first_frame(video_path):
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    if success:
        return Image.fromarray(image[:, :, ::-1].copy())
    else:
        return None