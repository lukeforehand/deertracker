# Development Notes

Identify and track deer using trail cameras and object detection.

Trail cameras will be manually geocoded by user.

User chooses geocoded trail camera when importing trail camera photos.

Modify EXIF photo data with trail camera geocode.

User will have option to review object labels from image after AI predictions.

Each photo EXIF should contain:

* Geolocation
* Date time
* Object detection data (model version, object tags, user tags

Each deer identity, geolocation, and time will be tracked and visualized.

Interpolated paths will be drawn on map linking each deer identity's geocoded data points in time order.

Photo import process:

* Choose photos,
* Associate batch with saved camera location
* Tag photo with geolocation.
* Date Times are based on photo metadata
* Model runs animal tagging, outputs object images, labels, confidence

Feature to retrain model based on user feedback?

# Development Notes

## Image EXIF extraction / modification
https://pypi.org/project/exif/

## Object detection / Animal Identification
https://towardsdatascience.com/object-detection-with-less-than-10-lines-of-code-using-python-2d28eebc5b11

required libs
```
opencv-python
cvlib
matplotlib
tensorflow
```

Simple object detection codecode
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

Deep Cut

https://pypi.org/project/deeplabcut/

## Geotracking / Geocoding trail cameras
https://towardsdatascience.com/a-complete-guide-to-an-interactive-geographical-map-using-python-f4c5197e23e0

Simple shapefile rendering

US shapefile 1:500,000

https://www2.census.gov/geo/tiger/GENZ2019/shp/cb_2019_us_all_500k.zip

Other shapefiles

https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html

```
import geopandas as gpd
shapefile = 'data/countries_110m/ne_110m_admin_0_countries.shp'
#Read shapefile using Geopandas
gdf = gpd.read_file(shapefile)[['ADMIN', 'ADM0_A3', 'geometry']]
#Rename columns.
gdf.columns = ['country', 'country_code', 'geometry']
gdf.head()
```

Interpolating lines from camera geocoords

https://www.statology.org/matplotlib-smooth-curve/
