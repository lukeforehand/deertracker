import sqlite3

from deertracker import DEFAULT_DATA_STORE, schema

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"


class Connection:
    def __init__(self, database=DEFAULT_DATABASE):
        conn = sqlite3.connect(database)
        conn.execute(schema.CREATE_TABLE_CAMERA)
        conn.execute(schema.CREATE_TABLE_PHOTO)
        conn.execute(schema.CREATE_TABLE_MODEL)
        self.conn = conn

    def insert_camera(self, camera):
        try:
            sql = (
                "INSERT INTO camera(name, make, model, lat, lon) VALUES(?, ?, ?, ?, ?)"
            )
            cur = self.conn.cursor()
            cur.execute(sql, camera)
            self.conn.commit()
            return self._camera_from_tuple(camera)
        except sqlite3.IntegrityError:
            print("Camera already exists")
            return None

    def select_camera(self, camera_name):
        return self._camera_from_tuple(
            self.conn.cursor()
            .execute("SELECT * FROM camera WHERE name = ?", [camera_name])
            .fetchone()
        )

    def _camera_from_tuple(self, camera):
        return {
            "name": camera[0],
            "make": camera[1],
            "model": camera[2],
            "lat": camera[3],
            "lon": camera[4],
        }

    def insert_photo(self, photo):
        try:
            sql = "INSERT INTO photo(id, path, lat, lon, time, camera_id) VALUES(?, ?, ?, ?, ?, ?)"
            cur = self.conn.cursor()
            cur.execute(sql, photo)
            self.conn.commit()
            return {
                "id": photo[0],
                "path": photo[1],
                "lat": photo[2],
                "lon": photo[3],
                "time": photo[4],
                "camera_id": photo[5],
            }
        except sqlite3.IntegrityError:
            print("Photo already exists")
            return None
