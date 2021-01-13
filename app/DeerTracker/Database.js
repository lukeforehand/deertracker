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
        return await db.executeSql(
            'DELETE FROM batch where id = ?', [id]);
    }

    async selectBatches() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(`
            SELECT b.*, l.name AS location_name,
                (SELECT COUNT(*) FROM photo p
                WHERE p.batch_id = b.id)
                AS num_photos,
                (SELECT COUNT(*) FROM photo p
                WHERE p.batch_id = b.id AND p.processed = TRUE)
                AS num_processed,
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

    async insertPhoto(id, path, batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'INSERT INTO photo(id, path, processed, batch_id) VALUES(?, ?, FALSE, ?)',
            [id, path, batchId]);
    }

    async selectUnprocessedPhotos() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(
            `SELECT p.*, l.id AS location_id, l.lat AS location_lat, l.lon AS location_lon
            FROM photo p
            JOIN batch b ON b.id = p.batch_id
            JOIN location l ON l.id = b.location_id
            WHERE p.processed = FALSE
            ORDER BY p.batch_id ASC`);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

    async processPhoto(photoId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'UPDATE photo SET processed = TRUE WHERE id = ?', [photoId]
        );
    }

    async selectBatchPhotos(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('SELECT * FROM photo WHERE batch_id = ?', [batchId]);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
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
            'INSERT INTO object(id, x, y, w, h, lat, lon, time, label, score, photo_id, location_id) VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                obj['bbox']['x'],
                obj['bbox']['y'],
                obj['bbox']['w'],
                obj['bbox']['h'],
                obj['lat'],
                obj['lon'],
                obj['time'],
                obj['label'],
                obj['score'],
                obj['photo_id'],
                obj['location_id'],
            ]
        );
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
    score FLOAT NOT NULL,
    photo_id CHARACTER(32) NOT NULL,
    location_id INTEGER NOT NULL,
    FOREIGN KEY(photo_id) REFERENCES photo(id),
    FOREIGN KEY(location_id) REFERENCES location(id)
)
`
