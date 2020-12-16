# Training

The following commands require the datasets described here:

[Datasets](DATASETS.md)

## Import training crops

```bash
deertracker import-photos \
  --training \
  --photos ~/myphotos \
```

* Output is to `.data/photos/{category}/`
* Crops will NOT be marked as `ground_truth`
* DateTime EXIF validation is disabled

## Import caltech crops

```bash
deertracker caltech \
  --photos ~/Downloads/caltech/cct_images \
  --bboxes ~/Downloads/caltech/caltech_bboxes_20200316.json
  [--show] plots the bounding boxes instead of creating crops
```

* Output is to `.data/photos/{category}/`
* Crops will be marked as `ground_truth`

## Sort caltech labeled photos

Sort caltech photos without bounding boxes into label folders, these uncropped images can be
selectively imported back into the database as crops using the `import-photos --training` command.

```bash
deertracker caltech \
  --photos ~/Downloads/caltech/cct_images \
  --bboxes ~/Downloads/caltech/caltech_bboxes_20200316.json
  --labels ~/Downloads/caltech/caltech_images_20200316.json
```

* Output is to `./caltech/uncropped/{category}`

## Import NA Bird crops

```bash
deertracker nabirds \
  --image-ids nabirds/images.txt \
  --bboxes nabirds/bounding_boxes.txt \
  --labels nabirds/image_class_labels.txt \
  --classes nabirds/classes.txt \
  --photos nabirds/images/
```

* Output is to `.data/photos/{category}/`
* Crops will be marked as `ground_truth`

## Import ENA-24 crops

```bash
deertracker ena24 \
  --photos ena24/images/
  --bboxes ena24/ena24.json
```

* Output is to `.data/photos/{category}/`
* Crops will be marked as `ground_truth`

## Run training

```bash
deertracker train \
 --name $model_name \
 --images ./training_imgs/ \
 --model-dir ./models/ \
 --min-images 1000 \
 --epochs 500
```

### Training can be done in a python notebook like colab.research.google.com with a small amount of code

```notebook

# pull down the training code
! git clone https://github.com/lukeforehand/deertracker
% cd /content/deertracker/
! git pull
! git checkout main

# install requirements
% pip install --quiet -r requirements.txt

# mount google drive to load training data and save model output
from google.colab import drive
drive.mount("/content/drive", force_remount=True)

# untar the training dataset from google drive
! tar xfz ../drive/MyDrive/deertracker/deertracker_crops.tar.gz

# train, saving the model checkpoints to google drive incase google colab disconnects.
! python -m deertracker.main train dt \
  --images "training_imgs" \
  --model-dir ../drive/MyDrive/deertracker/models \
  --min-images 500 \
  --epochs 1000

```
