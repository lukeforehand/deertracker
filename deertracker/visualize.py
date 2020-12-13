import cv2
import matplotlib
import matplotlib.pyplot as plt
import multiprocessing

from deertracker.classifier import load_model as Classifier

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


def show_classes(image_paths):
    classifier = Classifier()
    for image_path in image_paths:
        yield show_class(image_path, classifier)


def show_class(image_path: str, classifier: Classifier):
    """
    Visualize Microsoft's MegaDetector bounding boxes.
    """

    # np.ndarray (width, height, 3) image array
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    font_scale = min(image.shape[0], image.shape[1]) / (25 / 0.05)
    newline_step = int(image.shape[1] * 0.05)
    label_y = newline_step
    for i, score in enumerate(classifier.predict(image)):
        if score > 0.01:
            cv2.putText(
                image,
                f"{int(score * 100)} {classifier.classes[i]}",
                (25, label_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (0, 255, 0),
                2,
            )
            label_y += newline_step
    multiprocessing.Process(target=plot, args=(image,)).start()


def show_predictions(image_paths):
    detector = MegaDetector()
    for image_path in image_paths:
        yield show_prediction(image_path, detector)


def show_prediction(image_path: str, detector: MegaDetector):
    """
    Visualize Microsoft's MegaDetector bounding boxes.
    """

    # np.ndarray (width, height, 3) image array
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    bboxes, classes, scores = detector.predict(image)
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
    for bbox, _class, score in zip(bboxes, classes, scores):
        color = colors[_class]
        cv2.rectangle(image, (bbox[1], bbox[0]), (bbox[3], bbox[2]), color, 2)
        cv2.putText(
            image,
            str(f"{detector.labels[_class]} {score}"),
            (bbox[1], bbox[0] - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
    multiprocessing.Process(target=plot, args=(image,)).start()
