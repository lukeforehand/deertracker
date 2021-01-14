import sqlite3

from contextlib import contextmanager
from datetime import datetime

from deertracker import DEFAULT_DATABASE, schema


@contextmanager
def conn():
    c = Connection()
    try:
        yield c
    finally:
        c.close()


# FIXME: verify foreign key constraints work
class Connection:
    def __init__(self, database=str(DEFAULT_DATABASE)):
        conn = sqlite3.connect(database)
        conn.execute(schema.CREATE_TABLE_LOCATION)
        conn.execute(schema.CREATE_TABLE_BATCH)
        conn.execute(schema.CREATE_TABLE_PHOTO)
        conn.execute(schema.CREATE_TABLE_OBJECT)
        self.conn = conn

    def close(self):
        self.conn.commit()
        self.conn.close()

    def insert_location(self, location):
        try:
            sql = "INSERT INTO location(id, name, lat, lon) VALUES(NULL, ?, ?, ?)"
            cur = self.conn.cursor()
            cur.execute(sql, location)
            cur.execute("SELECT LAST_INSERT_ROWID()")
            return self._location_from_tuple(
                (cur.fetchone()[0], location[0], location[1], location[2])
            )
        except sqlite3.IntegrityError:
            return {"error": f"Location `{location[0]}` already exists."}

    def select_location(self, location_name):
        return self._location_from_tuple(
            self.conn.cursor()
            .execute(
                "SELECT id, name, lat, lon FROM location WHERE name = ?",
                [location_name],
            )
            .fetchone()
        )

    def _location_from_tuple(self, location):
        if location is None:
            return None
        return {
            "id": location[0],
            "name": location[1],
            "lat": location[2],
            "lon": location[3],
        }

    def select_photo(self, photo_id):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id, path, processed, lat, lon, time, batch_id FROM photo WHERE id = ?",
            [photo_id],
        )
        photo = cur.fetchone()
        if photo is None:
            return None
        return {
            "id": photo[0],
            "path": photo[1],
            "processed": photo[2],
            "lat": photo[3],
            "lon": photo[4],
            "time": photo[5],
            "batch_id": photo[6],
        }

    def select_unprocessed_photos(self):
        return [
            {
                "id": photo[0],
                "path": photo[1],
                "processed": photo[2],
                "lat": photo[3],
                "lon": photo[4],
                "time": photo[5],
                "batch_id": photo[6],
            }
            for photo in self.conn.cursor()
            .execute(
                """
                SELECT id, path, processed, lat, lon, time, batch_id FROM photo
                WHERE processed IS FALSE
                ORDER BY id ASC
            """
            )
            .fetchall()
        ]

    def update_unprocessed_photo(self, photo_id):
        self.conn.cursor().execute(
            "UPDATE photo SET processed = TRUE WHERE id = ?", [photo_id]
        )

    def select_photo_objects(self, photo_id):
        return [
            self._object_from_tuple(obj)
            for obj in self.conn.cursor()
            .execute(
                """
                SELECT id, path, x, y, w, h, lat, lon, time, label, confidence, ground_truth, location_id, photo_id
                FROM object WHERE photo_id = ?
                """,
                [photo_id],
            )
            .fetchall()
        ]

    def insert_batch(self):
        batch_time = datetime.now()
        sql = "INSERT INTO batch(id, time) VALUES(NULL, ?)"
        cur = self.conn.cursor()
        cur.execute(sql, [batch_time])
        cur.execute("SELECT LAST_INSERT_ROWID()")
        batch_id = cur.fetchone()[0]
        return {"id": batch_id, "time": batch_time}

    def insert_photo(self, photo):
        try:
            sql = "INSERT INTO photo(id, path, processed, lat, lon, time, batch_id) VALUES(?, ?, FALSE, ?, ?, ?, ?)"
            cur = self.conn.cursor()
            cur.execute(sql, photo)
            return {
                "id": photo[0],
                "path": photo[1],
                "processed": False,
                "lat": photo[2],
                "lon": photo[3],
                "time": photo[4],
            }
        except sqlite3.IntegrityError:
            return {"error": f"Photo `{photo[1]}` already exists."}

    def insert_object(self, obj):
        try:
            sql = """
                INSERT INTO object(id, path, x, y, w, h, lat, lon, time, label, confidence, ground_truth, photo_id, location_id)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cur = self.conn.cursor()
            cur.execute(sql, obj)
            return {
                "id": obj[0],
                "path": obj[1],
                "x": obj[2],
                "y": obj[3],
                "w": obj[4],
                "h": obj[5],
                "lat": obj[6],
                "lon": obj[7],
                "time": obj[8],
                "label": obj[9],
                "confidence": obj[10],
                "ground_truth": obj[11],
                "photo_id": obj[12],
                "location_id": obj[13],
            }
        except sqlite3.IntegrityError:
            return {"error": f"Object `{obj[1]}` already exists."}

    def select_ground_truth(self):
        return [
            self._object_from_tuple(obj)
            for obj in self.conn.cursor()
            .execute(
                """
                    SELECT id, path, x, y, w, h, lat, lon, time, label, confidence, ground_truth, location_id, photo_id
                    FROM object WHERE ground_truth IS TRUE AND label NOT IN ('animal', 'vehicle', 'person')
                """
            )
            .fetchall()
        ]

    def _object_from_tuple(self, obj):
        if obj is None:
            return None
        return {
            "id": obj[0],
            "path": obj[1],
            "x": obj[2],
            "y": obj[3],
            "w": obj[4],
            "h": obj[5],
            "lat": obj[6],
            "lon": obj[7],
            "time": obj[8],
            "label": obj[9],
            "confidence": obj[10],
            "ground_truth": obj[11],
            "location_id": obj[12],
            "photo_id": obj[13],
        }

    def training_dataset_report(self):
        total = str(self.training_dataset_count())
        result = [
            f"{str(x[0]).rjust(7)} {x[1]}"
            for x in self.conn.cursor()
            .execute(
                """
                SELECT COUNT(*) cnt, label FROM object WHERE ground_truth IS TRUE AND label
                NOT IN ('animal', 'vehicle', 'person') GROUP BY label ORDER BY cnt DESC
                """
            )
            .fetchall()
        ]
        result = [f"{total.rjust(7)} total", *result]
        return "\n".join(result)

    def training_dataset_count(self):
        return (
            self.conn.cursor()
            .execute(
                "SELECT COUNT(*) FROM object WHERE ground_truth IS TRUE AND label NOT IN ('animal', 'vehicle', 'person')"
            )
            .fetchone()[0]
        )
