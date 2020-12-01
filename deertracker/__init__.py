import pathlib

DEFAULT_DATA_STORE = pathlib.Path(".data")
DEFAULT_DATA_STORE.mkdir(exist_ok=True)

DEFAULT_PHOTO_STORE = pathlib.Path(DEFAULT_DATA_STORE / "photos")
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"

DEFAULT_MODEL_PATH = "models/md_v4.1.0.pb"