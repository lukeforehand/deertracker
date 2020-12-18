# Deer Tracker

Identify and track wildlife using trail cameras, object detection and classification.

[Development notes](docs/NOTES.md)

[Prediction Examples](docs/EXAMPLES.md)

[Datasets](docs/DATASETS.md)

[Training](docs/TRAINING.md)

## Install env

```bash
sudo apt-get install -y tk-dev
pyenv install 3.8.2
pyenv global 3.8.2
pip install --upgrade pip
pip install -r requirements.txt
pip install --editable .
```

## CLI

Before starting, you need the gps coords of your trail cameras. [Find lat/lon](https://www.latlong.net/)

```bash
deertracker --help

Commands:
  add-camera     Add camera location
  import-photos  Import photos
  label          Labeling tools
  train          Train classifier
  viz            Visualize detections, classes
```

```bash
deertracker label --help

Commands:
  caltech        Process Caltech bounding boxes or labels.
  ena24          Process ENA-24 bounding boxes.
  export-photos  Export photos that have not yet been labeled ground_truth
  nabirds        Process NA Birds bounding boxes
```

```bash
deertracker viz --help

Commands:
  classes     Show classifications for photo crops
  detections  Show object detections for photos
```
