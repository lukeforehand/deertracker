# Training

```bash
Usage: deertracker train [OPTIONS]

  Train classifier

Options:
  --name TEXT           Model identifier  [required]
  --images PATH         Location of training images, should contain a folder
                        per class  [required]

  --model-dir TEXT      Directory to store model snapshots
  --min-images INTEGER  Minimum number of images per class
  --epochs INTEGER      Number of training epochs
  --resume              Resume training from latest checkpoint.
  --help                Show this message and exit.
```

## Run training

```bash
deertracker train \
 --name $model_name \
 --images ./training_imgs/ \
 --min-images 1000 \
 --epochs 500
```

When a model is sufficiently trained, update `classifier` in `config.yaml` with the new model iteration.

## Training can be done in a python notebook like colab.research.google.com with a small amount of code

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
! python -m deertracker.main train \
  --name dt \
  --images "training_imgs" \
  --model-dir ../drive/MyDrive/deertracker/models \
  --min-images 500 \
  --epochs 1000 \
  --resume
```

When a model in colab is sufficiently trained, download it from google drive, and unzip to `.data/models/`, and update `classifier` in `config.yaml` with the new model iteration.
