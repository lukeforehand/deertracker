import cv2
import pathlib
import numpy as np
import tensorflow as tf

from PIL import Image
from typing import Tuple

DEFAULT_MODEL_PATH = str(
    pathlib.Path(__file__).parent.absolute() / "models/md_v4.1.0.pb"
)


class MegaDetector:
    """
    Microsoft's MegaDetector. https://github.com/microsoft/CameraTraps
    """

    def __init__(self, filepath: str = DEFAULT_MODEL_PATH):
        """
        Load the protobuf file, massage from TF 1.13.1 to TF 2.x

        Inputs
        ------
        filepath : str
            Path to the saved megadetector protobuf file. See download links in
            https://github.com/microsoft/CameraTraps/blob/master/megadetector.md
            This was tested with version 4.1
        """
        with tf.io.gfile.GFile(filepath, "rb") as f:
            graph_def = tf.compat.v1.GraphDef()
            graph_def.ParseFromString(f.read())

        # Adapted from TF migration guide:
        # https://www.tensorflow.org/guide/migrate#a_graphpb_or_graphpbtxt
        def wrap_frozen_graph(graph_def, inputs, outputs):
            def _imports_graph_def():
                tf.compat.v1.import_graph_def(graph_def, name="")

            wrapped_import = tf.compat.v1.wrap_function(_imports_graph_def, [])
            import_graph = wrapped_import.graph
            return wrapped_import.prune(
                tf.nest.map_structure(import_graph.as_graph_element, inputs),
                tf.nest.map_structure(import_graph.as_graph_element, outputs),
            )

        # You can see the names of the input/output tensors here:
        # https://github.com/microsoft/CameraTraps/blob/master/detection/run_tf_detector.py#L150-L153
        self.model = wrap_frozen_graph(
            graph_def,
            "image_tensor:0",
            ["detection_boxes:0", "detection_classes:0", "detection_scores:0"],
        )

        self.labels = {
            1: "animal",
            2: "person",
            3: "vehicle",  # available in megadetector v4+
        }

    def predict(
        self, image: np.ndarray, confidence: float = 0.5
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Image -> bounding boxes.

        Inputs
        ------
        image : np.ndarray
            Input uint8 array with shape (width, height, 3)
        confidence : float
            Only bounding boxes with this level of confidence will be output.

        Outputs
        -------
        bboxes : np.ndarray
            Nx4 array of bounding boxes:
                bboxes[i][0]  # starting y coordinate
                bboxes[i][1]  # starting x coordinate
                bboxes[i][2]  # ending y coordinate
                bboxes[i][3]  # ending x coordinate
        classes : np.ndarray
            N-length array of class labels (integers)
        scores : np.ndarray
            N-length array of bounding box scores. Higher is better.
            Use `confidence` to ignore bounding boxes below a confidence.
        """
        # model operates on batches, so add a singular dimension at the front.
        tensor_input = tf.convert_to_tensor(image[None, :, :, :])
        # the map below strips out the singular batch dimension
        bboxes, classes, scores = map(lambda x: x.numpy()[0], self.model(tensor_input))
        bboxes = bboxes[scores > confidence]
        classes = classes[scores > confidence].astype("uint16")
        scores = scores[scores > confidence]
        # Need to convert fractions -> pixels
        bboxes = np.round(bboxes * (image.shape[:2] * 2)).astype("uint16")
        return bboxes, classes, scores


def model(detector: MegaDetector, photo):
    image = np.array(photo)
    bbox, _class, score = detector.predict(image)
    results = []
    for i, _ in enumerate(bbox):
        results.append(
            {
                "image": Image.fromarray(
                    image[
                        bbox[i][0] : bbox[i][2],
                        bbox[i][1] : bbox[i][3],
                    ]
                ),
                "label": detector.labels[_class[i]],
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
