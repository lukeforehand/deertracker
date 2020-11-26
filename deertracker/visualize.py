import matplotlib.pyplot as plt
import cv2

from .model import MegaDetector


def show_prediction(image_path: str, md: MegaDetector = MegaDetector()):
    """
    Visualize Microsoft's MegaDetector bounding boxes.
    """

    # np.ndarray (width, height, 3) image array
    image = cv2.imread(image_path)

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
