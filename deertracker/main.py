import click
import pathlib

from deertracker import photo, visualize, caltech as ct
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


@main.command(help="Process Caltech")
@click.option(
    "--show",
    default=False,
    is_flag=True,
    required=False,
    help="Show caltech annotations",
)
@click.option("--photos", required=True, help="Location of caltech images")
@click.option("--bboxes", required=True, help="Location of bboxes json")
def caltech(show, photos, bboxes):
    if show:
        visualize.show_caltech(photos, bboxes)
    else:
        annotations = ct.load_bboxes(bboxes)
        processed_annotations = ct.process_annotations(photos, bboxes)
        with click.progressbar(
            processed_annotations, length=len(annotations)
        ) as progress:
            for annotation in progress:
                if "error" in annotation:
                    click.secho(str(annotation), bg="red")


if __name__ == "__main__":
    main()