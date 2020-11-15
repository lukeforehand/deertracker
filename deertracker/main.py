import click
import pathlib

from deertracker import photo


def file_filter(photos):
    exts = (
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.PNG",
        "*.JPG",
        "*.JPEG",
    )
    files = []
    for ext in exts:
        files.extend([x for x in pathlib.Path(photos).glob(f"**/{ext}") if x.is_file()])
    return files


@click.group()
def main():
    pass


@main.command()
@click.option("--name", required=True, help="Name of camera")
@click.option(
    "--photos",
    required=True,
    help="Location of photos used for detecting camera make model",
)
@click.option("--lat", required=True, help="Latitude of camera location")
@click.option("--lon", required=True, help="Longitude of camera location")
def add_camera(name, photos, lat, lon):
    files = file_filter(photos)
    camera = photo.add_camera(name, files, lat, lon)
    print(camera)


@main.command()
@click.option("--photos", required=True, help="Location of photos to process")
@click.option(
    "--camera", required=True, help="Name of trail cam to associate with photos"
)
def import_photos(photos, camera):
    files = file_filter(photos)
    results = photo.import_photos(camera, files)
    for i, result in enumerate(results):
        if results[i] is not None:
            print(results[i])


if __name__ == "__main__":
    main()