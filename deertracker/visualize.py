import matplotlib.pyplot as plt
import cv2
import numpy as np

from .model import MegaDetector


def show_megadetector(md: MegaDetector, image: np.ndarray):
    """
    Visualize Microsoft's MegaDetector bounding boxes.

    Inputs
    ------
    image : np.ndarray
        (width, height, 3) image array
    """
    bboxes, classes, scores = md.predict(image)
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
    for bbox, label, score in zip(bboxes, classes, scores):
        color = colors[label]
        cv2.rectangle(image, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
        cv2.putText(
            image,
            str(label),
            (bbox[0], bbox[1] - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
    plt.imshow(image)
    plt.axis("off")
    plt.show()
