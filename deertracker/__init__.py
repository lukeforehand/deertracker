import pathlib

# FIXME: __file__ doesn't exist in notebook, so check os.path.abspath('') instead.

ROOT = pathlib.Path(__file__).parent.parent.absolute()

DEFAULT_DATA_STORE = ROOT / ".data"
DEFAULT_DATA_STORE.mkdir(exist_ok=True)

DEFAULT_PHOTO_STORE = DEFAULT_DATA_STORE / "photos"
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"
DEFAULT_DETECTOR_PATH = ROOT / "models/md_v4.1.0.pb"
DEFAULT_CLASSIFIER_PATH = ROOT / "models/dt-0089"
