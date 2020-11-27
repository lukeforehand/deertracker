# Deer Tracker

[Development notes](NOTES.md)

[Prediction Examples](EXAMPLES.md)

## install env

```bash
sudo apt-get install -y tk-dev
pyenv install 3.8.2
pyenv global 3.8.2
pip install --upgrade pip
pip install -r requirements.txt
```

## add camera

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

## run import

```bash
./dt import-photos \
    --photos ~/Google\ Drive/Trail\ Cam \
    --camera "Soutwest Stand"

./dt import-photos \
    --photos ~/Google\ Drive/Trail\ Cam \
    --camera "Turkey Blind"
```

Passing the `--ignore-exif` flag will avoid errors in missing exif data
but will not collect photo timestamps as a result.

## show prediction

```bash
./dt show-prediction --photo ~/Google\ Drive/Trail\ Cam/001.jpg
```

