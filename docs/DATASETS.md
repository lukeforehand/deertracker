# Datasets

Models are trained on crops extracted from various datasets, referenced below.

* Bounding boxes were used for crops when provided by data source.
* Mega Detector was used on images with no bounding box, and manually curated.

[Download crops]()

Distribution:

```bash
  67656 total
  12859 opossum
  11224 raccoon
   7945 coyote
   7811 bobcat
   6366 rabbit
   6205 doe
   3021 squirrel
   2867 buck
   2026 skunk
   1950 fox
   1781 bear
   1290 crow
    836 turkey
    769 owl
    185 fawn
    133 mountain_lion
    123 blue_jay
    120 eagle
    111 yearling_deer
     18 porcupine
     11 fisher
      5 sandhill_crane
```

## Caltech camera traps

This data set was used to curate images of:
opossum, raccoon, coyote, bobcat, rabbit, deer, squirrel, skunk, mountain_lion

[Reference](http://lila.science/datasets/caltech-camera-traps)

```bash
~/Downloads/azcopy_linux_amd64_10.7.0/azcopy cp \
"https://lilablobssc.blob.core.windows.net/caltech-unzipped/cct_images?st=2020-01-01T00%3A00%3A00Z&se=2034-01-01T00%3A00%3A00Z&sp=rl&sv=2019-07-07&sr=c&sig=uNGA5/QrgqpnU4VeT5tBqhx0GN4Tu8jJ7neUyJqIQss%3D" \
. --recursive
```

## Wisconsin whitetail data set

This data set was used to curate images of:
buck, doe, yearling deer, fawn, bear, turkey, mountain_lion

[Download 1](https://drive.google.com/drive/folders/1jjkIPjz0Mv3ETYhafE4maNvtBfAxgRsW?usp=sharing)
[Download 2](https://drive.google.com/drive/folders/1E1bVtDpXvgYpXbO5jpYDV37TYc9sUp2C?usp=sharing)
[Download 3](https://drive.google.com/drive/folders/1ihIpAar8G2kFvC2jOwJFA9GAUSGwT1Tb?usp=sharing)
[Download 4](https://drive.google.com/drive/folders/0B4BRcQQjVlWyVnctaE84Y3dHcDQ?usp=sharing)
[Download 5](https://drive.google.com/drive/folders/0B4BRcQQjVlWyVXNMeHJ4LTdJV2c?usp=sharing)

## NA Birds data set

This data set was used to curate images of:
turkey, blue_jay, owl, eagle, crow

[Reference](https://dl.allaboutbirds.org/nabirds)

## ENA24-detection

This data set was used to curate images of:
bear, turkey, bobcat, coyote, raccoon, skunk, squirrel, rabbit, deer, fox, opossum

[Reference](http://lila.science/datasets/ena24detection)

```bash
~/Downloads/azcopy_linux_amd64_10.7.0/azcopy cp \
"https://lilablobssc.blob.core.windows.net/ena24/images?st=2020-01-01T00%3A00%3A00Z&se=2034-01-01T00%3A00%3A00Z&sp=rl&sv=2019-07-07&sr=c&sig=BBgrO%2BYQKOVHh1zytS9umFv3Fa956F1%2Bb6bU3VhHSqg%3D" \
. --recursive
```
