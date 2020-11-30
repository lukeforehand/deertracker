import pathlib

DEFAULT_DATA_STORE = pathlib.Path(__file__).parent.absolute() / ".data"
DEFAULT_DATA_STORE.mkdir(exist_ok=True)

DEFAULT_PHOTO_STORE = pathlib.Path(DEFAULT_DATA_STORE / "photos")
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)

RELATIVE_PHOTO_STORE = DEFAULT_PHOTO_STORE.relative_to(DEFAULT_DATA_STORE)

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"

DEFAULT_MODEL_PATH = str(
    pathlib.Path(__file__).parent.absolute() / "models/md_v4.1.0.pb"
)
