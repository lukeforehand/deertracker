CREATE_TABLE_CAMERA = """
CREATE TABLE IF NOT EXISTS camera (
    name VARCHAR(255) PRIMARY KEY NOT NULL,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL
)
"""

INSERT_TRAINING_CAMERA = """
INSERT INTO camera(name, lat, lon)
SELECT 'training', 0.0, 0.0
WHERE NOT EXISTS(SELECT 1 FROM camera WHERE name = 'training')
"""

CREATE_TABLE_BATCH = """
CREATE TABLE IF NOT EXISTS batch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time DATETIME NOT NULL
)
"""


CREATE_TABLE_PHOTO = """
CREATE TABLE IF NOT EXISTS photo (
    id CHARACTER(32) PRIMARY KEY NOT NULL,
    path VARCHAR(255) NOT NULL,
    batch_id INTEGER NOT NULL,
    FOREIGN KEY(batch_id) REFERENCES batch(id)
)
"""

CREATE_TABLE_OBJECT = """
CREATE TABLE IF NOT EXISTS object (
    id CHARACTER(32) PRIMARY KEY NOT NULL,
    path VARCHAR(255) NOT NULL UNIQUE,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    time DATETIME,
    label VARCHAR(255) NOT NULL,
    confidence FLOAT NOT NULL,
    ground_truth BOOLEAN NOT NULL,
    photo_id CHARACTER(32) NOT NULL,
    camera_id VARCHAR(255) NOT NULL,
    FOREIGN KEY(photo_id) REFERENCES photo(id),
    FOREIGN KEY(camera_id) REFERENCES camera(name)
)
"""
