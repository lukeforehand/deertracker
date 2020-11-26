CREATE_TABLE_CAMERA = """
CREATE TABLE IF NOT EXISTS camera (
    name VARCHAR(255) PRIMARY KEY NOT NULL,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL
)
"""

CREATE_TABLE_PHOTO = """
CREATE TABLE IF NOT EXISTS photo (
    id CHARACTER(32) PRIMARY KEY NOT NULL
)
"""

CREATE_TABLE_OBJECT = """
CREATE TABLE IF NOT EXISTS object (
    id CHARACTER(32) PRIMARY KEY NOT NULL,
    path VARCHAR(255) NOT NULL UNIQUE,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    time DATETIME NOT NULL,
    label VARCHAR(255) NOT NULL,
    confidence FLOAT NOT NULL,
    camera_id VARCHAR(255) NOT NULL,
    photo_id CHARACTER(32) NOT NULL,
    FOREIGN KEY(camera_id) REFERENCES camera(name),
    FOREIGN KEY(photo_id) REFERENCES photo(id)
)
"""