import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let database = 'deertracker.db';
let location = 'default';

export default class Database {

    constructor() {
        SQLite.openDatabase({ name: database, location: location }).then((db) => {
            db.transaction((tx) => {
                tx.executeSql(CREATE_TABLE_LOCATION);
                tx.executeSql(CREATE_TABLE_BATCH);
                tx.executeSql(CREATE_TABLE_PHOTO);
                tx.executeSql(CREATE_TABLE_OBJECT);
                tx.executeSql(CREATE_TABLE_CONFIG);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'discard_empty', 'true' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'discard_empty')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'auto_archive', 'false' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'auto_archive')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'auto_archive_days', '30' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'auto_archive_days')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'google_drive_key', 'password' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'google_drive_key')`);
            });
        });
    }

    async insertBatch(locationId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'INSERT INTO batch(id, time, location_id) VALUES(NULL, ?, ?)',
            [Date.now(), locationId]);
    }

    async deleteBatch(id) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql('DELETE FROM batch where id = ?', [id]);
    }

    async selectBatches() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(`
            SELECT b.*, l.name AS location_name,
                (SELECT COUNT(*) FROM photo p WHERE p.batch_id = b.id)
                AS num_photos,
                (SELECT COUNT(*) FROM photo p
                WHERE p.batch_id = b.id AND p.processed = TRUE)
                AS num_processed,
                (SELECT COUNT(*) FROM photo p
                WHERE p.batch_id = b.id AND (p.upload_id IS NOT NULL OR p.processed = TRUE))
                AS num_uploaded,
                (SELECT COUNT(*) FROM object o JOIN photo p ON o.photo_id = p.id WHERE p.batch_id = b.id)
                AS num_objects,
                FIRST_VALUE(p.path) OVER (PARTITION BY b.id ORDER BY b.id DESC)
                AS photo_path
            FROM batch b
            JOIN location l ON l.id = b.location_id
            JOIN photo p ON b.id = p.batch_id
            GROUP BY b.id
            ORDER BY b.id DESC
        `);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

    async insertPhoto(id, path, lat, lon, batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'INSERT INTO photo(id, path, processed, upload_id, lat, lon, batch_id) VALUES(?, ?, FALSE, NULL, ?, ?, ?)',
            [id, path, lat, lon, batchId]);
    }

    async deletePhoto(id) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql('DELETE FROM photo where id = ?', [id]);
    }

    async selectPhotosToProcess() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(
            `SELECT p.*, l.id AS location_id, l.lat AS location_lat, l.lon AS location_lon
            FROM photo p
            JOIN batch b ON b.id = p.batch_id
            JOIN location l ON l.id = b.location_id
            WHERE p.processed = FALSE AND p.upload_id IS NOT NULL
            ORDER BY p.batch_id ASC, p.id ASC`);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

    async selectPhotosToUpload() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(
            `SELECT p.*, l.id AS location_id, l.lat AS location_lat, l.lon AS location_lon
            FROM photo p
            JOIN batch b ON b.id = p.batch_id
            JOIN location l ON l.id = b.location_id
            WHERE p.upload_id IS NULL AND p.processed = FALSE
            ORDER BY p.batch_id ASC, p.id ASC
            LIMIT 20`);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

    async setPhotoUpload(photoId, uploadId, time, width, height) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        db.executeSql(
            'UPDATE photo SET upload_id = ?, time = ?, width = ?, height = ? WHERE id = ?',
            [uploadId, time, width, height, photoId]
        );
        rs = await db.executeSql('SELECT * from photo WHERE id = ?', [photoId]);
        return rs.map((r) => {
            return r.rows.raw();
        })[0][0];
    }

    async processPhoto(photoId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'UPDATE photo SET processed = TRUE WHERE id = ?', [photoId]
        );
    }

    async selectBatchPhotos(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(`
            SELECT p.batch_id, p.path as photo_path, p.width, p.height, o.*
            FROM photo p LEFT OUTER JOIN object o ON o.photo_id = p.id
            WHERE p.batch_id = ?
        `, [batchId]);
        let objects = rs.map((r) => {
            return r.rows.raw();
        })[0];
        let photos = {}
        for (o of objects) {
            let photo = photos[o.photo_id];
            if (!photo) {
                photo = {
                    batch_id: o.batch_id,
                    photo_id: o.photo_id,
                    photo_path: o.photo_path,
                    width: o.width,
                    height: o.height,
                    objects: []
                };
                photos[o.photo_id] = photo;
            }
            photo.objects.push(o);
        }
        return Object.values(photos);
    }

    async selectObjects() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(`
        SELECT day, label, location_name, num_objects, photo_path, width, height, x, y, w, h FROM (
            SELECT
                STRFTIME('%Y-%m-%d', o.time) AS day, o.label, l.name AS location_name,
                p.width, p.height, p.path AS photo_path, o.x, o.y, o.w, o.h, COUNT(*) AS num_objects,
                ROW_NUMBER() OVER (
                    PARTITION BY o.id
                    ORDER BY o.time DESC
                ) AS row_number
            FROM object o JOIN photo p ON p.id = o.photo_id
            JOIN location l ON l.id = o.location_id
            GROUP BY o.label, day, location_name
            ORDER BY o.time DESC
        ) WHERE row_number = 1
        `);
        let objects = rs.map((r) => {
            return r.rows.raw();
        })[0];
        let days = {}
        for (o of objects) {
            let day = days[o.day];
            if (!day) {
                day = {};
                days[o.day] = day;
            }
            let location = day[o.location_name];
            if (!location) {
                location = [];
                day[o.location_name] = location;
            }
            location.push(o);
        }
        return days;
    }

    async deleteBatchPhotos(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'DELETE FROM photo WHERE batch_id = ?', [batchId]);
    }

    async deleteBatchObjects(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            `DELETE FROM object WHERE photo_id IN
            (SELECT p.id FROM photo p WHERE p.batch_id = ?)`, [batchId]);
    }

    async selectLocations() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('SELECT * FROM location ORDER BY name ASC')
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

    async insertLocation(name, lat, lon) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'INSERT INTO location(id, name, lat, lon) VALUES(NULL, ?, ?, ?)',
            [name, lat, lon]);
    }

    async deleteLocation(id) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'DELETE FROM location WHERE id = ?', [id]);
    }

    async insertObject(obj) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            `INSERT INTO object(id, x, y, w, h, lat, lon, time, label, label_array, score, score_array, photo_id, location_id)
            VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                obj['x'],
                obj['y'],
                obj['w'],
                obj['h'],
                obj['lat'],
                obj['lon'],
                obj['time'],
                obj['label'],
                obj['label_array'],
                obj['score'],
                obj['score_array'],
                obj['photo_id'],
                obj['location_id'],
            ]
        );
    }

    async selectConfig() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('SELECT * FROM config');
        let config = rs.map((r) => {
            return r.rows.raw();
        })[0];
        return new Map(config.map((c) => {
            return [c['key'], c['value']];
        }));
    }

    async updateConfig(key, value) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('UPDATE config SET value = ? WHERE key = ?', [value, key]);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

}

CREATE_TABLE_LOCATION = `
CREATE TABLE IF NOT EXISTS location (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL
)
`

CREATE_TABLE_BATCH = `
CREATE TABLE IF NOT EXISTS batch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time DATETIME NOT NULL,
    location_id INTEGER,
    FOREIGN KEY(location_id) REFERENCES location(id)
)
`

CREATE_TABLE_PHOTO = `
CREATE TABLE IF NOT EXISTS photo (
    id CHARACTER(32) PRIMARY KEY NOT NULL,
    path VARCHAR(255) NOT NULL,
    processed BOOLEAN NOT NULL,
    upload_id NULL,
    time DATETIME,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    width INTEGER,
    height INTEGER,
    batch_id INTEGER,
    FOREIGN KEY(batch_id) REFERENCES batch(id)
)
`

CREATE_TABLE_OBJECT = `
CREATE TABLE IF NOT EXISTS object (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    w INTEGER NOT NULL,
    h INTEGER NOT NULL,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    time DATETIME NOT NULL,
    label VARCHAR(255) NOT NULL,
    label_array VARCHAR(255) NOT NULL,
    score FLOAT NOT NULL,
    score_array VARCHAR(255) NOT NULL,
    photo_id CHARACTER(32) NOT NULL,
    location_id INTEGER NOT NULL,
    FOREIGN KEY(photo_id) REFERENCES photo(id),
    FOREIGN KEY(location_id) REFERENCES location(id)
)
`

CREATE_TABLE_CONFIG = `
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(255) PRIMARY KEY NOT NULL,
    value VARCHAR(255) NOT NULL
)
`
