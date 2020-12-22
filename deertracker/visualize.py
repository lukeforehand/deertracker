import cv2
import matplotlib
import matplotlib.pyplot as plt
import multiprocessing
import random

from deertracker import caltech

colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]


def show_caltech(photos, bboxes):

    bboxes = caltech.load_bboxes(bboxes)

    for annotation in random.sample(bboxes, len(bboxes)):
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


def show_classes(image_paths, model_dir):
    from deertracker.classifier import load_model as Classifier

    classifier = Classifier(model_dir)
    for image_path in random.sample(image_paths, len(image_paths)):
        yield show_class(image_path, classifier)


def show_class(image_path: str, classifier):
    """
    Visualize Microsoft's MegaDetector bounding boxes.
    """

    # np.ndarray (width, height, 3) image array
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    predictions = classifier.predict(image)
    index = sorted(range(len(predictions)), reverse=True, key=lambda k: predictions[k])
    xy = (25, 40)
    for i in index:
        score = predictions[i]
        label = classifier.classes[i]
        if score > 0.01:
            cv2.putText(
                image,
                f"{str(int(score * 100)).rjust(2)} {label}",
                xy,
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
            )
            xy = (xy[0], xy[1] + 40)
    pool = multiprocessing.Pool(8)
    pool.map(plot, (image,))
    pool.close()
    pool.join()


def show_detections(image_paths):
    from deertracker.detector import MegaDetector

    detector = MegaDetector()
    for image_path in random.sample(image_paths, len(image_paths)):
        yield show_detection(image_path, detector)


def show_detection(image_path: str, detector):
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
    pool = multiprocessing.Pool(8)
    pool.map(plot, (image,))
    pool.close()
    pool.join()
