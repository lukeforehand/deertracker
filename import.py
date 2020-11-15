#!/usr/bin/python

import click

import pathlib

import database as db

@click.command()
@click.option("--input-dir")
#@click.option("--output-dir", default=db.DEFAULT_DATA_STORE)
def main(input_dir):
    print(input_dir)

    print(db.conn())

if __name__ == '__main__':
    main()