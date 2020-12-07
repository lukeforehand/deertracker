# Deer Tracker

Identify and track wildlife using trail cameras and object detection.

[Development notes](docs/NOTES.md)

[Prediction Examples](docs/EXAMPLES.md)

[Datasets](docs/DATASETS.md)

## Install env

```bash
sudo apt-get install -y tk-dev
pyenv install 3.8.2
pyenv global 3.8.2
pip install --upgrade pip
pip install -r requirements.txt
```

## Add camera

```bash
./dt add-camera \
    --name "Southwest Stand" \
    --lat 46.399995 \
    --lon -90.772639

./dt add-camera \
    --name "Turkey Blind" \
    --lat 46.400041 \
    --lon -90.768497
```

Go here to find the lat/lon for your trail cam:

[Find lat/lon](https://www.latlong.net/)

## Run import

```bash
./dt import-photos \
    --photos ~/Google\ Drive/Trail\ Cam \
    --camera "Soutwest Stand"

./dt import-photos \
    --photos ~/Google\ Drive/Trail\ Cam \
    --camera "Turkey Blind"
```

Passing `--training` will flag photos as training data and disable the `--camera` option.
Training photos do not require EXIF Datetime.

## Show prediction

```bash
./dt show-prediction --photo ~/Google\ Drive/Trail\ Cam/001.jpg
```

## Import caltech crops

```bash
./dt caltech \
  --photos ~/Downloads/caltech/cct_images \
  --bboxes ~/Downloads/caltech/caltech_bboxes_20200316.json
  [--show] plots the bounding boxes instead of creating crops
```

* Output is to `.data/photos/training/`

## Sort caltech labeled photos

Sort caltech photos into label folders, these uncropped images can be selectively
imported back into the databsae as crops using th `import-photos --training` command.

```bash
./dt caltech \
  --photos ~/Downloads/caltech/cct_images \
  --bboxes ~/Downloads/caltech/caltech_bboxes_20200316.json
  --labels ~/Downloads/caltech/caltech_images_20200316.json
```

* Output is to `.data/photos/uncropped/`

## Run training

`$name` is the name of the model

```bash
./dt train $name\
 --images ./training_imgs/ \
 --min-images 1000
```
