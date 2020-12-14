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

## Add camera

```bash
deertracker add-camera \
  --name "Turkey Blind" \
  --lat 46.400041 \
  --lon -90.768497
```

Go here to find the lat/lon for your trail cam:

[Find lat/lon](https://www.latlong.net/)

## Run import

```bash
deertracker import-photos \
  --photos ~/myphotos \
  --camera "Turkey Blind"
```

## Show prediction

```bash
deertracker show-predictions \
  --photos ~/myphotos
```

## Show classification

```bash
deertracker show-classes \
  --photos ~/myphotos \
  --model-dir ./models/dt-0094/
```

`--model-dir` is optional
