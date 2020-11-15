# install env
```
pyenv install 3.8.2
pyenv global 3.8.2
pip install --upgrade pip
pip install -r requirements.txt
```

# run import
```
python -m deertracker.import \
    --photos ~/Google\ Drive/Trail\ Cam \
    --lat 46.399995 \
    --lon -90.772639
```

Go here to find the lat/lon for your trail cam:

https://www.latlong.net/