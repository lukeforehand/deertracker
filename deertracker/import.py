#!/usr/bin/python

import click
import functools
import pathlib
import logging
import multiprocessing
import shutil

from deertracker import photo, database


def process_photo(lat, lng, file_path):
    try:
        conn = database.Connection()
        photo_hash = photo.hash(file_path)
        print(photo.get_exif(file_path))
        photo_path = photo.store(photo_hash, file_path)

        time = None
        print(photo_hash)
        conn.insert_photo((photo_hash, photo_path, lat, lng, time))
    except photo.BadPhotoError:
        pass


@click.command()
@click.option("--photos", help="Location of photos to process")
@click.option("--lat", help="Latitude of the trail cam")
@click.option("--lon", help="Longitude of the trail cam")
def main(photos, lat, lon):
    files = [x for x in pathlib.Path(photos).glob("*/*") if x.is_file()]
    pool = multiprocessing.Pool(multiprocessing.cpu_count())
    pool.map(functools.partial(process_photo, lat, lon), files)
    pool.close()
    pool.join()


if __name__ == "__main__":
    main()