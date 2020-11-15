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
        photo_hash = photo.hash(file_path)
        time = photo.get_exif_datetime(file_path)
        photo_path = photo.store(photo_hash, file_path)
        conn = database.Connection()
        p = (photo_hash, photo_path, lat, lng, time)
        conn.insert_photo(p)
        return p
    except photo.BadPhotoError:
        return None


@click.command()
@click.option("--photos", help="Location of photos to process")
@click.option("--lat", help="Latitude of the trail cam")
@click.option("--lon", help="Longitude of the trail cam")
def main(photos, lat, lon):
    files = [x for x in pathlib.Path(photos).glob("**/*") if x.is_file()]
    pool = multiprocessing.Pool(multiprocessing.cpu_count())
    results = pool.map(functools.partial(process_photo, lat, lon), files)
    pool.close()
    pool.join()
    for i, result in enumerate(results):
        if results[i] is None:
            print(f"Not processed:\t\t\t\t{files[i]}")
        else:
            print(results[i])


if __name__ == "__main__":
    main()