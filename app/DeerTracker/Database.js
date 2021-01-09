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

    async selectBatches() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(`
            SELECT b.*, l.name AS location_name,
                (SELECT COUNT(*) FROM photo p
                WHERE p.batch_id = b.id)
                AS num_photos,
                FIRST_VALUE(p.path) OVER (PARTITION BY b.id ORDER BY b.id DESC)
                AS photo_path
            FROM batch b
            JOIN location l ON l.id = b.location_id
            LEFT OUTER JOIN photo p ON b.id = p.batch_id
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
            'INSERT INTO photo(id, path, batch_id) VALUES(?, ?, ?)',
            [id, path, batchId]);
    }

    async selectBatchPhotos(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('SELECT * FROM photo WHERE batch_id = ?', [batchId]);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
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
            'DELETE FROM location where id = ?', [id]);
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
    batch_id INTEGER,
    FOREIGN KEY(batch_id) REFERENCES batch(id)
)
`

CREATE_TABLE_OBJECT = `
CREATE TABLE IF NOT EXISTS object (
    id CHARACTER(32) PRIMARY KEY NOT NULL,
    path VARCHAR(255) NOT NULL UNIQUE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    w INTEGER NOT NULL,
    h INTEGER NOT NULL,
    lat FLOAT,
    lon FLOAT,
    time DATETIME,
    label VARCHAR(255) NOT NULL,
    confidence FLOAT NOT NULL,
    ground_truth BOOLEAN NOT NULL,
    photo_id CHARACTER(32) NOT NULL,
    location_id INTEGER,
    FOREIGN KEY(photo_id) REFERENCES photo(id),
    FOREIGN KEY(location_id) REFERENCES location(id)
)
`
