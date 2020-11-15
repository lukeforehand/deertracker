import pathlib

DEFAULT_DATA_STORE = pathlib.Path(__file__).parent.absolute() / ".data"
DEFAULT_DATA_STORE.mkdir(exist_ok=True)
