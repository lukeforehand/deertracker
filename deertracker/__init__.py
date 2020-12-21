import pathlib
import tarfile

ROOT = pathlib.Path(__file__).parent.parent.absolute()

DEFAULT_DATA_STORE = ROOT / ".data"
DEFAULT_DATA_STORE.mkdir(exist_ok=True)

DEFAULT_PHOTO_STORE = DEFAULT_DATA_STORE / "photos"
DEFAULT_PHOTO_STORE.mkdir(exist_ok=True)

DEFAULT_DATABASE = DEFAULT_DATA_STORE / "deertracker.db"

DEFAULT_MODELS_PATH = DEFAULT_DATA_STORE / "models"

DEFAULT_DETECTOR_PATH = DEFAULT_MODELS_PATH / "md_v4.1.0.pb"
DEFAULT_CLASSIFIER_PATH = DEFAULT_MODELS_PATH / "dt-0684"


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
