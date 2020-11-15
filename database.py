import pathlib

import sqlite3

import schema

DEFAULT_DATA_STORE = pathlib.Path(__file__).parent.absolute() / ".data"
DEFAULT_DATA_STORE.mkdir(exist_ok=True)

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"

def conn(database=DEFAULT_DATABASE):
    conn = sqlite3.connect(database)
    conn.execute(schema.CREATE_TABLE_PHOTOS)
    return conn


