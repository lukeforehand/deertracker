import sqlite3

from deertracker import DEFAULT_DATA_STORE, schema

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"


# FIXME: foreign key constraints don't work
class Connection:
    def __init__(self, database=DEFAULT_DATABASE):
        conn = sqlite3.connect(database)
        conn.execute(schema.CREATE_TABLE_CAMERA)
        conn.execute(schema.CREATE_TABLE_PHOTO)
        conn.execute(schema.CREATE_TABLE_OBJECT)
        self.conn = conn

    def insert_camera(self, camera):
        try:
            sql = "INSERT INTO camera(name, lat, lon) VALUES(?, ?, ?)"
            cur = self.conn.cursor()
            cur.execute(sql, camera)
            self.conn.commit()
            return self._camera_from_tuple(camera)
        except sqlite3.IntegrityError:
            print(f"Camera {camera[0]} already exists")
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
            "lat": camera[1],
            "lon": camera[2],
        }

    def get_photo(self, photo_id):
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM photo WHERE id = ?", [photo_id])
        return cur.fetchone()

    def insert_photo(self, photo):
        try:
            sql = "INSERT INTO photo(id) VALUES(?)"
            cur = self.conn.cursor()
            cur.execute(sql, [photo])
            self.conn.commit()
            return {"id": photo[0]}
        except sqlite3.IntegrityError:
            print(f"Photo {photo[1]} already exists")
            return None

    def insert_object(self, obj):
        try:
            sql = "INSERT INTO object(id, path, lat, lon, time, label, confidence, photo_id, camera_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)"
            cur = self.conn.cursor()
            cur.execute(sql, obj)
            self.conn.commit()
            return {
                "id": obj[0],
                "path": obj[1],
                "lat": obj[2],
                "lon": obj[3],
                "time": obj[4],
                "label": obj[5],
                "confidence": obj[6],
                "photo_id": obj[7],
                "camera_id": obj[8],
            }
        except sqlite3.IntegrityError as e:
            print(f"Object {obj[1]} already exists")
            return None
