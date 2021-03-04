# Labeling

```bash
Usage: deertracker label [OPTIONS] COMMAND [ARGS]...

  Labeling tools

Options:
  --help  Show this message and exit.

Commands:
  caltech                Process Caltech bounding boxes or labels.
  ena24                  Process ENA-24 bounding boxes.
  export-data            Export data store
  import-training-crops  Import training photo crops organized by class
  nabirds                Process NA Birds bounding boxes
  tool                   Review and correct labels
  training-report        Print training data counts per class
```

`caltech`, `ena24`, and `nabirds` commands require respective datasets, more information [here](docs/DATASETS.md).

## Labeling tool tkteach

Copyright https://github.com/Serhiy-Shekhovtsov/tkteach

```bash
Usage: deertracker label tool

  Review and correct labels
```

The tkteach library has been modified and integrated directly with the deertracker
database to create a streamlined labeling and training process for newly imported photos.
