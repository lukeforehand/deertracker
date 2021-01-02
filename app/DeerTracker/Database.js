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

    async selectBatches() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql('SELECT * from batch ORDER BY id DESC');
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
    time DATETIME NOT NULL
)
`

CREATE_TABLE_PHOTO = `
CREATE TABLE IF NOT EXISTS photo (
    id CHARACTER(32) PRIMARY KEY NOT NULL,
    path VARCHAR(255) NOT NULL,
    batch_id INTEGER NOT NULL,
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
