# Deer Tracker

Identify and track wildlife using trail cameras, object detection and classification.

- [Prediction Examples](docs/EXAMPLES.md)
- [Datasets](docs/DATASETS.md)
- [Labeling](docs/LABELING.md)
- [Training](docs/TRAINING.md)

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

```bash
Usage: deertracker [OPTIONS] COMMAND [ARGS]...

  Deer Tracker

Options:
  --help  Show this message and exit.

Commands:
  label   Labeling tools
  server  Server commands
  train   Train classifier
  viz     Visualize detections, classes
```

- If you use bash or zsh then tab completion for commands and options is supported.
- Advanced configuration is available in `config.yaml`
