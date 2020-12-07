import click
import pathlib

from deertracker import photo, visualize, caltech as ct, classifier
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
        for prediction in progress:
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
@click.option("--bboxes", required=True, default=None, help="Location of bboxes json")
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


@main.command(help="Train classifier")
@click.argument("name")
@click.option(
    "--images",
    required=True,
    help="Location of training images, should contain a folder per class",
    type=pathlib.Path,
)
@click.option(
    "--min-images",
    default=1000,
    required=False,
    help="Minimum number of images per class",
)
def train(name, images, min_images):
    classifier.train(name, data_dir=images, min_images=min_images)


if __name__ == "__main__":
    main()
