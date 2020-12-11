import cv2
import matplotlib
import matplotlib.pyplot as plt
import multiprocessing

from deertracker.detector import MegaDetector

from deertracker import caltech

colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]


def show_caltech(photos, bboxes):

    bboxes = caltech.load_bboxes(bboxes)

    for annotation in bboxes:
        image = cv2.imread(f"{photos}/{annotation['file_path']}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        bbox = annotation["bbox"]

        color = colors[annotation["_class"] % 3]

        cv2.rectangle(
            image,
            (int(bbox[0]), int(bbox[1])),
            (int(bbox[0] + bbox[2]), int(bbox[1] + bbox[3])),
            color,
            2,
        )
        cv2.putText(
            image,
            annotation["label"],
            (int(bbox[0]), int(bbox[1]) - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
        plot(image)


def plot(image):
    matplotlib.use("tkagg")
    plt.imshow(image)
    plt.axis("off")
    plt.show()


def show_predictions(image_paths):
    detector = MegaDetector()
    for image_path in image_paths:
        yield show_prediction(image_path, detector)


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
    multiprocessing.Process(target=plot, args=(image,)).start()
