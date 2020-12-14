# Training dataset

This is a merging of crops from verious datasets, referenced below.

* Bounding boxes were used for crops when provided with dataset.
* Mega Detector was used on images with no bounding box, and manually curated.

[Download crops](https://drive.google.com/file/d/1HyeHr4ugxi0DhKkSQQxOFLC56SbzKjUh/view?usp=sharing)

66,144 total crops
Distribution:

```bash
  12135 opossum
  10933 raccoon
   7600 coyote
   7479 bobcat
   6026 rabbit
   5308 doe
   4029 bird
   2872 dog
   2763 buck
   2649 squirrel
   1730 skunk
   1100 fox
    822 bear
    232 turkey
    186 fawn
    134 mountain_lion
    112 yearling_buck
     19 porcupine
     15 crow
     12 fisher
      6 sandhill_crane
      4 blue_jay
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
turkey

[Reference](https://dl.allaboutbirds.org/nabirds)

## ENA24-detection

This data set was used to curate images of:
bear

[Reference](http://lila.science/datasets/ena24detection)

```bash
~/Downloads/azcopy_linux_amd64_10.7.0/azcopy cp \
"https://lilablobssc.blob.core.windows.net/ena24/images?st=2020-01-01T00%3A00%3A00Z&se=2034-01-01T00%3A00%3A00Z&sp=rl&sv=2019-07-07&sr=c&sig=BBgrO%2BYQKOVHh1zytS9umFv3Fa956F1%2Bb6bU3VhHSqg%3D" \
. --recursive
```
