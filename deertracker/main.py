import click
import pathlib
import os
import warnings

import deertracker as dt

from deertracker import (
    caltech as ct,
    database,
    nabirds as nab,
    photo,
    tkteach,
    visualize,
)

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
warnings.filterwarnings("ignore")


def find_files(input_dir):
    exts = []
    exts.extend(photo.PHOTO_EXTS)
    exts.extend([ext.upper() for ext in photo.PHOTO_EXTS])
    exts.extend(photo.VIDEO_EXTS)
    exts.extend([ext.upper() for ext in photo.VIDEO_EXTS])
    return [
        str(x)
        for ext in exts
        for x in pathlib.Path(input_dir).glob(f"**/*{ext}")
        if x.is_file()
    ]


# API commands
@click.group(help="Deer Tracker")
def main():
    pass


# Server
@main.group(help="Server commands")
def server():
    pass


@server.command(help="Start")
@click.option("--username", required=True, help="required basic auth username")
@click.option("--password", required=True, help="required basic auth password")
@click.option("--port", required=False, default=5000, help="Listen port")
def start(port, username, password):
    from deertracker import server

    server.start(port, username, password)


@server.command(help="Test Server")
@click.option("--port", required=False, default=5000, help="Send port")
@click.option("--photos", required=True, help="Location of photos to test")
def test_server(port, photos):
    from datetime import datetime
    import time
    import requests

    file_paths = find_files(photos)
    for file_path in file_paths:
        now = datetime.now()
        lat = 43.08154
        lon = -89.31911
        multipart_form_data = (
            ("image", (file_path, open(file_path, "rb"))),
            ("lat", (None, str(lat))),
            ("lon", (None, str(lon))),
        )
        response = requests.post(f"http://localhost:{port}/", files=multipart_form_data)
        if response.status_code == 200:

            r = response.json()

            print(f"input: {file_path}")
            print(f"result: {r}")
            print(f"took: {datetime.now() - now}")

            while True:
                print(f"checking status of {r['upload_id']}")
                response = requests.get(f"http://localhost:{port}/{r['upload_id']}")
                if response.status_code == 200:
                    print(response.json())
                    break
                time.sleep(3)


# Labeling subcommands
@main.group(help="Labeling tools")
def label():
    pass


@label.command(help="Export data store")
@click.option(
    "--training",
    default=False,
    is_flag=True,
    required=False,
    help="export training images",
)
@click.option(
    "--assets",
    default=False,
    is_flag=True,
    required=False,
    help="export all datastore assets (database, models, photos, crops)",
)
@click.option(
    "--models",
    default=False,
    is_flag=True,
    required=False,
    help="export models required to run deertracker",
)
def export_data(training, assets, models):
    dt.export_data(assets, models)
    if training:
        with database.conn() as db:
            print(db.training_dataset_report())
            total = db.training_dataset_count()
            results = photo.export_ground_truth()
        with click.progressbar(results, length=total) as progress:
            for _ in progress:
                pass


@label.command(help="Print training data counts per class")
def training_report():
    with database.conn() as db:
        print(db.training_dataset_report())


@label.command(help="Import training photo crops organized by class")
@click.option("--crops", required=True, help="Location of photo crops to process")
@click.option(
    "--ground-truth",
    default=False,
    is_flag=True,
    required=False,
    help="Set flag if photos have already been labeled",
)
def import_training_crops(crops, ground_truth):
    file_paths = find_files(crops)
    imported_crops = photo.import_training_crops(crops, file_paths, ground_truth)
    with click.progressbar(imported_crops, length=len(file_paths)) as progress:
        for annotation in progress:
            if "error" in annotation:
                click.secho(str(annotation), bg="red")


@label.command(help="Review and correct labels")
def tool():
    tkteach.main(dt.DEFAULT_DATABASE, dt.DEFAULT_CROP_STORE)


@label.command(
    help="""
    Process Caltech bounding boxes or labels.
    If bboxes, will store crops in the database.
    If labels, will categorize the images into labeled folders.
"""
)
@click.option(
    "--show",
    default=False,
    is_flag=True,
    required=False,
    help="Show caltech annotations",
)
@click.option("--photos", required=True, help="Location of caltech images")
@click.option("--bboxes", required=True, help="Location of bboxes json")
@click.option(
    "--labels", required=False, default=None, help="Location of image labels json"
)
def caltech(show, photos, bboxes, labels):
    if bboxes and show:
        visualize.show_caltech(photos, bboxes)
    elif labels:
        labels = ct.load_labels(bboxes, labels)
        processed_labels = ct.process_labels(photos, labels)
        with click.progressbar(processed_labels, length=len(labels)) as progress:
            for annotation in progress:
                if "error" in annotation:
                    click.secho(str(annotation), bg="red")
    else:
        annotations = ct.load_bboxes(bboxes)
        processed_annotations = ct.process_annotations(photos, annotations)
        with click.progressbar(
            processed_annotations, length=len(annotations)
        ) as progress:
            for annotation in progress:
                if "error" in annotation:
                    click.secho(str(annotation), bg="red")


@label.command(help="Process NA Birds bounding boxes")
@click.option("--photos", required=True, help="Location of photos")
@click.option("--image-ids", required=True, help="Location of image ids txt")
@click.option("--bboxes", required=True, help="Location of bboxes txt")
@click.option("--classes", required=True, help="Location of classes txt")
@click.option("--labels", required=True, help="Location of image labels txt")
def nabirds(photos, image_ids, bboxes, classes, labels):
    length = len(open(image_ids).readlines())
    processed_annotations = nab.process_annotations(
        photos, image_ids, bboxes, classes, labels
    )
    with click.progressbar(processed_annotations, length=length) as progress:
        for annotation in progress:
            if "error" in annotation:
                click.secho(str(annotation), bg="red")


@label.command(help="Process ENA-24 bounding boxes.")
@click.option("--photos", required=True, help="Location of photos")
@click.option("--bboxes", required=True, help="Location of bboxes json")
def ena24(photos, bboxes):
    annotations = ct.load_bboxes(bboxes)
    processed_annotations = ct.process_annotations(photos, annotations)
    with click.progressbar(processed_annotations, length=len(annotations)) as progress:
        for annotation in progress:
            if "error" in annotation:
                click.secho(str(annotation), bg="red")


@main.command(help="Train classifier")
@click.option("--name", required=True, help="Model identifier")
@click.option(
    "--images",
    required=True,
    help="Location of training images, should contain a folder per class",
    type=pathlib.Path,
)
@click.option(
    "--model-dir",
    default=dt.DEFAULT_MODELS_PATH,
    required=False,
    help="Directory to store model snapshots",
)
@click.option(
    "--min-images",
    default=1000,
    required=False,
    help="Minimum number of images per class",
)
@click.option(
    "--epochs",
    default=500,
    required=False,
    help="Number of training epochs",
)
@click.option(
    "--resume",
    is_flag=True,
    help="Resume training from latest checkpoint.",
)
def train(name, images, model_dir, min_images, epochs, resume):
    from deertracker.classifier import train

    train(
        name,
        data_dir=images,
        model_dir=pathlib.Path(model_dir),
        min_images=min_images,
        epochs=epochs,
        resume=resume,
    )


# Visualization subcommands
@main.group(help="Visualize detections, classes")
def viz():
    pass


@viz.command(help="Show object detections for photos")
@click.option("--photos", required=True, help="Location of photos to process")
def detections(photos):
    file_paths = find_files(photos)
    detected = visualize.show_detections(file_paths)
    with click.progressbar(detected, length=len(file_paths)) as progress:
        for _ in progress:
            pass


@viz.command(help="Show classifications for photo crops")
@click.option("--crops", required=True, help="Location of photo crops to process")
@click.option(
    "--model-dir",
    default=dt.DEFAULT_CLASSIFIER_PATH,
    required=False,
    help="Path to saved classifier model",
)
def classes(crops, model_dir):
    file_paths = find_files(crops)
    classes = visualize.show_classes(file_paths, model_dir)
    with click.progressbar(classes, length=len(file_paths)) as progress:
        for _ in progress:
            pass


if __name__ == "__main__":
    main()
