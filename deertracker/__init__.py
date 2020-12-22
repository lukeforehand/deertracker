import pathlib
import tarfile
import yaml

ROOT = pathlib.Path(__file__).parent.parent.absolute()

with open(ROOT / "config.yaml") as config:
    CONFIG = yaml.safe_load(config.read())

DEFAULT_DATA_STORE = pathlib.Path(CONFIG["data"])
if not DEFAULT_DATA_STORE.is_absolute():
    DEFAULT_DATA_STORE = ROOT / DEFAULT_DATA_STORE
DEFAULT_DATA_STORE.mkdir(exist_ok=True)
DEFAULT_PHOTO_STORE = DEFAULT_DATA_STORE / "photos"
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)
DEFAULT_DATABASE = DEFAULT_DATA_STORE / CONFIG["database"]
DEFAULT_MODELS_PATH = DEFAULT_DATA_STORE / "models"
DEFAULT_DETECTOR_PATH = DEFAULT_MODELS_PATH / CONFIG["detector"]
DEFAULT_CLASSIFIER_PATH = DEFAULT_MODELS_PATH / CONFIG["classifier"]


def export_data(assets, models):
    if assets:
        f = "./deertracker_data.tar.gz"
        with tarfile.open(f, "w:gz") as tarball:
            output = ".data" / DEFAULT_DATABASE.relative_to(DEFAULT_DATA_STORE)
            tarball.add(
                DEFAULT_DATABASE,
                output,
            )
            print(f"Added {output} to {f}")
            output = ".data" / DEFAULT_MODELS_PATH.relative_to(DEFAULT_DATA_STORE)
            tarball.add(
                DEFAULT_MODELS_PATH,
                output,
            )
            print(f"Added {output} to {f}")
            output = ".data" / DEFAULT_PHOTO_STORE.relative_to(DEFAULT_DATA_STORE)
            tarball.add(
                DEFAULT_PHOTO_STORE,
                output,
            )
            print(f"Added {output} to {f}")
    if models:
        f = "./deertracker_models.tar.gz"
        with tarfile.open(f, "w:gz") as tarball:
            output = ".data" / DEFAULT_MODELS_PATH.relative_to(DEFAULT_DATA_STORE)
            tarball.add(
                DEFAULT_MODELS_PATH,
                output,
            )
            print(f"Added {output} to {f}")
