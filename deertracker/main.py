import click
import pathlib

from deertracker import (
    DEFAULT_CLASSIFIER_PATH,
    photo,
    visualize,
    caltech as ct,
    classifier,
    nabirds as nab,
)
from deertracker.photo import PhotoProcessor


def find_files(photos):
    exts = []
    exts.extend(photo.PHOTO_EXTS)
    exts.extend([ext.upper() for ext in photo.PHOTO_EXTS])
    exts.extend(photo.VIDEO_EXTS)
    exts.extend([ext.upper() for ext in photo.VIDEO_EXTS])
    return [
        str(x)
        for ext in exts
        for x in pathlib.Path(photos).glob(f"**/*{ext}")
        if x.is_file()
    ]


@click.group()
def main():
    pass


@main.command(help="Add camera location")
@click.option("--name", required=True, help="Name of camera")
@click.option("--lat", required=True, help="Latitude of camera location")
@click.option("--lon", required=True, help="Longitude of camera location")
def add_camera(name, lat, lon):
    camera = photo.add_camera(name, lat, lon)
    click.echo(camera)


@main.command(help="Import photos")
@click.option("--photos", required=True, help="Location of photos to process")
@click.option(
    "--camera",
    default=None,
    required=False,
    help="Name of trail cam to associate with photos",
)
@click.option(
    "--training",
    default=False,
    is_flag=True,
    required=False,
    help="Flag photos as training data, they don't require exif datetime data and the --camera option is not required",
)
def import_photos(photos, camera, training):
    if not camera and not training:
        click.secho(
            "--camera option is required unless --training flag is set", bg="red"
        )
        return

    file_paths = find_files(photos)
    imported_photos = PhotoProcessor(camera, training, file_paths).import_photos()
    with click.progressbar(imported_photos, length=len(file_paths)) as progress:
        for imported_photo in progress:
            if "error" in imported_photo:
                click.secho(str(imported_photo), bg="red")


@main.command(help="Show predictions for photos")
@click.option("--photos", required=True, help="Location of photos to process")
def show_predictions(photos):
    file_paths = find_files(photos)
    predictions = visualize.show_predictions(file_paths)
    with click.progressbar(predictions, length=len(file_paths)) as progress:
        for _ in progress:
            pass


@main.command(help="Show classifications for photo crops")
@click.option("--photos", required=True, help="Location of photo crops to process")
@click.option(
    "--model-dir",
    default=DEFAULT_CLASSIFIER_PATH,
    required=False,
    help="Path to saved classifier model",
)
def show_classes(photos, model_dir):
    file_paths = find_files(photos)
    classes = visualize.show_classes(file_paths, model_dir)
    with click.progressbar(classes, length=len(file_paths)) as progress:
        for _ in progress:
            pass


@main.command(
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


@main.command(help="Process NA Birds bounding boxes")
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


@main.command(help="Process ENA-24 bounding boxes.")
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
    default=classifier.DEFAULT_MODEL_FOLDER,
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
def train(name, images, model_dir, min_images, epochs):
    classifier.train(
        name,
        data_dir=images,
        model_dir=pathlib.Path(model_dir),
        min_images=min_images,
        epochs=epochs,
    )


if __name__ == "__main__":
    main()
