import cv2
import cvlib as cv
import matplotlib.pyplot as plt

from cvlib.object_detection import draw_bbox


def model(photo_path):
    print(photo_path)
    image = cv2.imread(photo_path)
    bbox, label, conf = cv.detect_common_objects(image)
    output_image = draw_bbox(image, bbox, label, conf)
    plt.imshow(output_image)
    plt.show()
