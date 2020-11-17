import logging


def get_logger():
    logger = logging.getLogger("deertracker")
    handler = logging.FileHandler("deertracker.err")
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.ERROR)
    return logger