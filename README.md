# deertracker
Image EXIF modification / extraction, animal head identification, path generation

## EXIF
https://pypi.org/project/exif/

## Object detection
https://towardsdatascience.com/object-detection-with-less-than-10-lines-of-code-using-python-2d28eebc5b11

### required libs
```
opencv-python
cvlib
matplotlib
tensorflow
```

### Simple code
```
import cv2
import matplotlib.pyplot as plt
import cvlib as cv
from cvlib.object_detection import draw_bbox
im = cv2.imread('apple-256261_640.jpg')
bbox, label, conf = cv.detect_common_objects(im)
output_image = draw_bbox(im, bbox, label, conf)
plt.imshow(output_image)
plt.show()
```

### Geocoding cameras

US shapefile 1:500,000
https://www2.census.gov/geo/tiger/GENZ2019/shp/cb_2019_us_all_500k.zip

Other shapefiles
https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html

### Interpolating lines from camera geocoords

https://www.statology.org/matplotlib-smooth-curve/
