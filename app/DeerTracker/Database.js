import SQLite from 'react-native-sqlite-storage';

import Moment from 'moment';

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
                tx.executeSql(CREATE_TABLE_PROFILE);
                tx.executeSql(CREATE_TABLE_OBJECT);
                tx.executeSql(CREATE_TABLE_CONFIG);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'discard_empty', 'true' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'discard_empty')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'ignore_unknown_animals', 'true' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'ignore_unknown_animals')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'lookback_days', '90' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'lookback_days')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'auto_archive', 'false' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'auto_archive')`);
                tx.executeSql(`INSERT INTO config (key, value) SELECT 'google_drive_key', 'password' WHERE NOT EXISTS(SELECT 1 FROM config WHERE key = 'google_drive_key')`);
            });
        });
    }

    async insertBatch(locationId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return (await db.executeSql(
            'INSERT INTO batch(id, time, location_id) VALUES(NULL, ?, ?)',
            [Date.now(), locationId]))[0].insertId;
    }

    async deleteBatch(id) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql('DELETE FROM batch where id = ?', [id]);
    }

    async selectLookbackCondition(column, not = '') {
        const db = await SQLite.openDatabase({ name: database, location: location });
        let lookbackDays = (await db.executeSql(`SELECT value FROM config WHERE key = 'lookback_days'`)).map((r) => {
            return r.rows.raw();
        })[0][0].value;
        let condition = '';
        if (lookbackDays > 0) {
            let start = Moment();
            start.subtract(lookbackDays, 'days');
            start = start.format('YYYY-MM-DD HH:mm:ss');
            condition = ` AND ${not} ${column} >= '${start}'`;
        } else {
            condition = ` AND ${not} TRUE`;
        }
        return condition;
    }

    async selectBatches() {
        const db = await SQLite.openDatabase({ name: database, location: location });

        let condition = await this.selectLookbackCondition('p.time');

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
            LEFT JOIN photo p ON b.id = p.batch_id
            WHERE TRUE ${condition}
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

    async updatePhoto(photoId, uploadId, time, moonPhase, width, height) {
        time = Moment(time).format('YYYY-MM-DD HH:mm:ss');
        const db = await SQLite.openDatabase({ name: database, location: location });
        db.executeSql(
            'UPDATE photo SET upload_id = ?, time = ?, moon_phase = ?, width = ?, height = ? WHERE id = ?',
            [uploadId, time, moonPhase, width, height, photoId]
        );
        rs = await db.executeSql('SELECT * from photo WHERE id = ?', [photoId]);
        return rs.map((r) => {
            return r.rows.raw();
        })[0][0];
    }

    async updateObjectProfile(objectId, profileId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'UPDATE object set profile_id = ? WHERE id = ?',
            [profileId, objectId]
        );
    }

    async updateObjectReview(objectId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql('UPDATE object SET reviewed = TRUE WHERE id = ?', [objectId]);
    }

    async updateObject(objectId, label, score) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'UPDATE object SET label = ?, score = ?, reviewed = TRUE WHERE id = ?',
            [label, score, objectId]
        );
    }

    async processPhoto(photoId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'UPDATE photo SET processed = TRUE WHERE id = ?', [photoId]
        );
    }

    async selectBatchPhotos(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return (await db.executeSql(`
            SELECT p.id AS photo_id, p.batch_id, p.path as photo_path, p.width, p.height, p.time
            FROM photo p WHERE p.batch_id = ?
            ORDER BY p.time ASC
        `, [batchId])).map((r) => {
            return r.rows.raw();
        })[0];
    }

    async selectPhotosToReviewCount() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        let condition = await this.selectLookbackCondition('time');
        return Object.values(
            (await db.executeSql(`
            SELECT COUNT(*) FROM object WHERE reviewed IS FALSE
            ${condition}
            `))[0].rows.raw()[0])[0];
    }

    async selectPhotosToReview() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql(`
        SELECT STRFTIME('%Y-%m-%d', o.time) AS day, o.*,
            p.path AS photo_path, p.width, p.height, p.upload_id,
            i.name AS profile_name, i.id AS profile_id,
            l.name AS location_name, l.id AS location_id
        FROM object o
        JOIN photo p ON p.id = o.photo_id
        JOIN location l ON l.id = o.location_id
        LEFT JOIN profile i ON i.id = o.profile_id
        WHERE o.reviewed IS FALSE ORDER BY p.time ASC
        `);
        let objects = rs.map((r) => {
            return r.rows.raw();
        })[0];
        for (o of objects) {
            o.label_array = JSON.parse(o.label_array);
            o.score_array = JSON.parse(o.score_array);
            o.objects = [o];
        }
        return objects;
    }

    async selectObjects(day = null, locationId = null) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        let condition = await this.selectLookbackCondition('p.time');
        let sql = `
        SELECT * FROM (
            SELECT o.id, STRFTIME('%Y-%m-%d', o.time) AS day, l.name AS location_name,
                l.id AS location_id, o.label, o.label_array, o.score_array, o.time,
                p.upload_id, p.width, p.height, p.path AS photo_path, o.x, o.y, o.w, o.h,
                i.name AS profile_name, i.id AS profile_id
            FROM object o
            JOIN photo p ON p.id = o.photo_id
            JOIN location l ON l.id = o.location_id
            LEFT JOIN profile i ON i.id = o.profile_id
            WHERE TRUE ${condition}
            ORDER BY o.time ASC
        )`;
        if (day && locationId) {
            sql = sql + ` WHERE day = ? AND location_id = ?`;
        }
        rs = await db.executeSql(sql, [day, locationId]);
        let objects = rs.map((r) => {
            return r.rows.raw();
        })[0];
        let days = {}
        for (o of objects) {
            o.label_array = JSON.parse(o.label_array);
            o.score_array = JSON.parse(o.score_array);

            let day = days[o.day];
            if (!day) {
                day = {};
                days[o.day] = day;
            }
            let location = day[o.location_id];
            if (!location) {
                location = {
                    location_name: o.location_name,
                    location_id: o.location_id,
                    photos: {},
                    object_counts: {}
                };
                day[o.location_id] = location;
            }

            let object_count = location.object_counts[o.label];
            if (!object_count) {
                object_count = 0;
            }
            location.object_counts[o.label] = object_count + 1;

            let photo = location.photos[o.photo_path];
            if (!photo) {
                photo = {
                    time: o.time,
                    photo_path: o.photo_path,
                    width: o.width,
                    height: o.height,
                    objects: []
                };
                location.photos[o.photo_path] = photo;
            }
            photo.objects.push(o);

        }
        return days;
    }

    async deleteBatchPhotos(batchId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'DELETE FROM photo WHERE batch_id = ?', [batchId]);
    }

    async deletePhotoObjects(photoId) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(`DELETE FROM object WHERE photo_id = ?`, [photoId]);
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

    async selectProfileList() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('SELECT * FROM profile ORDER BY name ASC')
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

    async selectProfiles() {
        const db = await SQLite.openDatabase({ name: database, location: location });

        let condition = await this.selectLookbackCondition('o.time');

        rs = await db.executeSql(`
            SELECT i.name AS profile_name, i.id AS profile_id,
            p.path AS photo_path, p.time, p.moon_phase, p.width, p.height,
            o.id, o.x, o.y, o.w, o.h, o.score_array, o.label_array, o.score, o.label,
            l.name AS location_name, l.lat, l.lon
            FROM profile i
            JOIN object o ON o.profile_id = i.id
            JOIN photo p ON p.id = o.photo_id
            JOIN location l ON l.id = o.location_id
            WHERE TRUE ${condition}
            GROUP BY o.photo_id
            ORDER BY o.time DESC`)
        let objects = await rs.map((r) => {
            return r.rows.raw();
        })[0];
        let profiles = {};
        for (o of objects) {
            o.label_array = JSON.parse(o.label_array);
            o.score_array = JSON.parse(o.score_array);
            let profile = profiles[o.profile_name];
            if (!profile) {
                profile = {
                    type: 'profile',
                    objects: []
                };
                profiles[o.profile_name] = profile;
            }
            profile.objects.push(o);
        }
        return Object.values(profiles).sort((a, b) => b.objects[0].time - a.objects[0].time);
    }

    async selectClasses() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        let condition = await this.selectLookbackCondition('o.time');
        rs = await db.executeSql(`
            SELECT o.label AS profile_name, o.label AS profile_id,
            p.path AS photo_path, p.time, p.width, p.height, p.moon_phase,
            o.id, o.x, o.y, o.w, o.h, o.score_array, o.label_array, o.score, o.label,
            l.name AS location_name, l.lat, l.lon
            FROM object o JOIN photo p ON p.id = o.photo_id
            JOIN location l ON l.id = o.location_id
            WHERE TRUE ${condition}
            ORDER BY o.time DESC`)
        let objects = await rs.map((r) => {
            return r.rows.raw();
        })[0];
        let profiles = {};
        for (o of objects) {
            o.profile_name = o.profile_name[0].toUpperCase() + o.profile_name.slice(1);
            o.label_array = JSON.parse(o.label_array);
            o.score_array = JSON.parse(o.score_array);
            let profile = profiles[o.profile_name];
            if (!profile) {
                profile = {
                    type: 'class',
                    objects: []
                };
                profiles[o.profile_name] = profile;
            }
            profile.objects.push(o);
        }
        return Object.values(profiles).sort((a, b) => b.objects[0].time - a.objects[0].time);
    }

    async selectClassStats(label) {
        return await this.selectStats(label, class_sql);
    }

    async selectProfileStats(profileId) {
        return await this.selectStats(profileId, profile_sql);
    }

    async selectArchive() {
        const db = await SQLite.openDatabase({ name: database, location: location });
        let condition = await this.selectLookbackCondition('p.time', 'NOT');
        let objects = (await db.executeSql(`
            SELECT p.id AS photo_id, p.path AS photo_path, o.id AS id
            FROM photo p JOIN object o ON p.id = o.photo_id
            WHERE TRUE ${condition}
            AND o.profile_id IS NULL
        `)).map((r) => {
            return r.rows.raw();
        })[0];
        let photos = {};
        for (o of objects) {
            let photo = photos[o.photo_id];
            if (!photo) {
                photo = {
                    photo_id: o.photo_id,
                    photo_path: o.photo_path,
                    objects: []
                };
                photos[o.photo_id] = photo;
            }
            photo.objects.push(o);
        }
        return Object.values(photos);
    }

    async selectStats(id, sql) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        weekday = (await db.executeSql(sql + `
            SELECT weekday, COUNT(*) AS cnt, COUNT(*) * 1.0 / (SELECT COUNT(*) FROM sighting) AS prob
            FROM sighting GROUP BY weekday ORDER BY prob DESC`, [id])).map((r) => {
            return r.rows.raw();
        })[0];
        weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((w) => {
            let x = weekday.find(x => x.weekday == w);
            return {
                weekday: w.slice(0, 3),
                cnt: x ? x.cnt : 0,
                prob: x ? x.prob : 0.0
            }
        });
        location = (await db.executeSql(sql + `
            SELECT location, lat, lon, COUNT(*) AS cnt, COUNT(*) * 1.0 / (SELECT COUNT(*) FROM sighting) AS prob
            FROM sighting GROUP BY location, lat, lon ORDER BY prob DESC`, [id])).map((r) => {
            return r.rows.raw();
        })[0];
        ampm = (await db.executeSql(sql + `
            SELECT ampm, COUNT(*) AS cnt, COUNT(*) * 1.0 / (SELECT COUNT(*) FROM sighting) AS prob
            FROM sighting GROUP BY ampm ORDER BY prob DESC`, [id])).map((r) => {
            return r.rows.raw();
        })[0];
        moon = (await db.executeSql(sql + `
            SELECT moon_phase, COUNT(*) AS cnt, COUNT(*) * 1.0 / (SELECT COUNT(*) FROM sighting) AS prob
            FROM sighting GROUP BY moon_phase ORDER BY prob DESC`, [id])).map((r) => {
            return r.rows.raw();
        })[0];
        moon = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'].map((m) => {
            let x = moon.find(x => x.moon_phase == m);
            return {
                moon_phase: m,
                label: m.slice(0, 1) + m.slice(m.indexOf(" ") + 1, m.indexOf(" ") + 2),
                cnt: x ? x.cnt : 0,
                prob: x ? x.prob : 0.0
            }
        });
        days = (await db.executeSql(sql + `
        SELECT day, COUNT(*) AS cnt FROM sighting GROUP BY day ORDER BY day ASC`, [id])).map((r) => {
            return r.rows.raw();
        })[0].map((day) => {
            return {
                date: day.day,
                count: day.cnt
            }
        });
        all = (await db.executeSql(sql + `
            SELECT weekday, location, ampm, moon_phase, COUNT(*) AS cnt, COUNT(*) * 1.0 / (SELECT COUNT(*) FROM sighting) AS prob
            FROM sighting GROUP BY weekday, location, ampm, moon_phase ORDER BY prob DESC`, [id])).map((r) => {
            return r.rows.raw();
        })[0];
        r = {
            weekday: weekday,
            location: location,
            ampm: ampm,
            moon: moon,
            days, days,
            all: all
        }
        return r;
    }

    async insertLocation(name, lat, lon) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'INSERT INTO location(id, name, lat, lon) VALUES(NULL, ?, ?, ?)',
            [name, lat, lon]);
    }

    async insertProfile(objectId, name) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'INSERT INTO profile(id, name) VALUES(NULL, ?)',
            [name]);
    }

    async deleteLocation(id) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            'DELETE FROM location WHERE id = ?', [id]);
    }

    async deleteProfile(id) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        await db.executeSql('UPDATE object SET profile_id = NULL WHERE profile_id = ?', [id]);
        return await db.executeSql('DELETE FROM profile WHERE id = ?', [id]);
    }

    async insertObject(obj) {
        obj['time'] = Moment(obj['time']).format('YYYY-MM-DD HH:mm:ss');
        obj['label_array'] = JSON.stringify(obj['label_array']);
        obj['score_array'] = JSON.stringify(obj['score_array']);
        const db = await SQLite.openDatabase({ name: database, location: location });
        return await db.executeSql(
            `INSERT INTO object(id, x, y, w, h, lat, lon, time, label, label_array, score, score_array, reviewed, photo_id, location_id)
            VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?)`,
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
        return Object.assign({}, ...config.map((c) => ({ [c.key]: c.value })));
    }

    async updateConfig(key, value) {
        const db = await SQLite.openDatabase({ name: database, location: location });
        rs = await db.executeSql('UPDATE config SET value = ? WHERE key = ?', [value, key]);
        return rs.map((r) => {
            return r.rows.raw();
        })[0];
    }

}

profile_sql = `WITH sighting AS(
    SELECT i.name AS profile_name, l.name AS location, l.lat, l.lon,
        STRFTIME('%Y-%m-%d', o.time) AS day,
        CASE CAST(STRFTIME('%w', o.time) AS INTEGER)
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            ELSE 'Saturday' END AS weekday,
        CASE
            WHEN CAST(STRFTIME('%H', o.time) AS INTEGER) < 12
            THEN 'Before Noon'
            ELSE 'After Noon'
            END AS ampm,
        p.moon_phase
    FROM profile i
        JOIN object o ON o.profile_id = i.id
        JOIN location l ON l.id = o.location_id
        JOIN photo p ON p.id = o.photo_id
    WHERE o.profile_id = ?
    GROUP BY o.photo_id)
`

class_sql = `WITH sighting AS(
    SELECT o.label AS profile_name, l.name AS location, l.lat, l.lon,
        STRFTIME('%Y-%m-%d', o.time) AS day,
        CASE CAST(STRFTIME('%w', o.time) AS INTEGER)
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            ELSE 'Saturday' END AS weekday,
        CASE
            WHEN CAST(STRFTIME('%H', o.time) AS INTEGER) < 12
            THEN 'Before Noon'
            ELSE 'After Noon'
            END AS ampm,
        p.moon_phase
    FROM object o
        JOIN location l ON l.id = o.location_id
        JOIN photo p ON p.id = o.photo_id
    WHERE o.label = ?)
`


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
    moon_phase VARCHAR(255),
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
    reviewed BOOLEAN NOT NULL,
    photo_id CHARACTER(32) NOT NULL,
    location_id INTEGER NOT NULL,
    profile_id INTEGER NULL,
    FOREIGN KEY(photo_id) REFERENCES photo(id),
    FOREIGN KEY(location_id) REFERENCES location(id),
    FOREIGN KEY(profile_id) REFERENCES profile(id)
)
`

CREATE_TABLE_PROFILE = `
CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE
)
`

CREATE_TABLE_CONFIG = `
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(255) PRIMARY KEY NOT NULL,
    value VARCHAR(255) NOT NULL
)
`
