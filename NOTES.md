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

## Training Datasets

Caltech camera traps:
http://lila.science/datasets/caltech-camera-traps

```bash
~/Downloads/azcopy_linux_amd64_10.7.0/azcopy cp \
"https://lilablobssc.blob.core.windows.net/caltech-unzipped/cct_images?st=2020-01-01T00%3A00%3A00Z&se=2034-01-01T00%3A00%3A00Z&sp=rl&sv=2019-07-07&sr=c&sig=uNGA5/QrgqpnU4VeT5tBqhx0GN4Tu8jJ7neUyJqIQss%3D" \
. --recursive
```

### Caltech crops

https://drive.google.com/file/d/1w637_EcV637L8TxfWdcm6WmEvmBh480G/view?usp=sharing

65112 total crops

Distribution:

```bash
  12135 opossum
   7909 raccoon
   6506 coyote
   6429 deer
   6026 rabbit
   5049 bobcat
   4392 cat
   4027 bird
   2861 dog
   2649 squirrel
   2558 car
   1843 rodent
   1199 skunk
   1100 fox
    187 empty
    178 lizard
     45 mountain_lion
     29 badger
      8 insect
      2 bat
      1 pig
      1 cow
```

### Wisconsin whitetail deer data set

```bash
https://drive.google.com/drive/folders/1jjkIPjz0Mv3ETYhafE4maNvtBfAxgRsW?usp=sharing
https://drive.google.com/drive/folders/1E1bVtDpXvgYpXbO5jpYDV37TYc9sUp2C?usp=sharing
https://drive.google.com/drive/folders/1ihIpAar8G2kFvC2jOwJFA9GAUSGwT1Tb?usp=sharing
https://drive.google.com/drive/folders/0B4BRcQQjVlWyVnctaE84Y3dHcDQ?usp=sharing
https://drive.google.com/drive/folders/0B4BRcQQjVlWyVXNMeHJ4LTdJV2c?usp=sharing
```

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
