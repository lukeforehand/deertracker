# Development Notes

Identify and track deer using trail cameras and object detection.

Trail cameras will be manually geocoded by user.

User chooses geocoded trail camera when importing trail camera photos.

Each photo EXIF should contain DateTime.

Each animal class (someday identity?), geolocation, and time will be tracked and visualized.

Interpolated paths will be drawn on map linking each animal class (someday identity?) geocoded data point in time order.

Photo import process:

* Choose photos
* Associate photo batch with saved camera location
* Photo time is based on photo EXIF DateTime
* Detection model finds animal crops, labels, and confidence
* Database stores all this information per detected animal

## Future

Deep Cut

https://pypi.org/project/deeplabcut/

## Geotracking / Geocoding trail cameras

https://towardsdatascience.com/a-complete-guide-to-an-interactive-geographical-map-using-python-f4c5197e23e0

Simple shapefile rendering

US shapefile 1:500,000

https://www2.census.gov/geo/tiger/GENZ2019/shp/cb_2019_us_all_500k.zip

Other shapefiles

https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html

```bash
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
