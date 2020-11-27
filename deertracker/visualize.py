import matplotlib

matplotlib.use("tkagg")
import matplotlib.pyplot as plt
import cv2

from .model import MegaDetector


def show_prediction(image_path: str, md: MegaDetector):
    """
    Visualize Microsoft's MegaDetector bounding boxes.
    """

    # np.ndarray (width, height, 3) image array
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    bboxes, classes, scores = md.predict(image)
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
    for bbox, _class, score in zip(bboxes, classes, scores):
        color = colors[_class]
        cv2.rectangle(image, (bbox[1], bbox[0]), (bbox[3], bbox[2]), color, 2)
        cv2.putText(
            image,
            str(f"{md.labels[_class]} {score}"),
            (bbox[1], bbox[0] - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
    plt.imshow(image)
    plt.axis("off")
    plt.show()
