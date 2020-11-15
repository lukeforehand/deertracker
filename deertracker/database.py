import sqlite3

from deertracker import DEFAULT_DATA_STORE, schema

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"


class Connection:
    def __init__(self, database=DEFAULT_DATABASE):
        self.conn = sqlite3.connect(database)
        self.conn.execute(schema.CREATE_TABLE_PHOTO)
        self.conn.execute(schema.CREATE_TABLE_MODEL)

    def insert_photo(self, photo):
        sql = "INSERT INTO photo(id, path, lat, lng, time) VALUES(?, ?, ?, ?, ?)"
        cur = self.conn.cursor()
        cur.execute(sql, photo)
        conn.commit()
        return photo[0]
