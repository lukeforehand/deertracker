import os
import pathlib

from setuptools import setup
from setuptools.command.develop import develop
from setuptools.command.install import install


DATA_DIR = pathlib.Path(__file__).parent.absolute() / ".data"
DATA_DIR.mkdir(exist_ok=True)


def auto_complete():

    if "zsh" in os.environ["SHELL"]:
        os.system(
            f"_DEERTRACKER_COMPLETE=source_zsh deertracker > {DATA_DIR}/autocomplete.source"
        )
        os.system(f"echo '. {DATA_DIR}/autocomplete.source' >> ~/.zshrc")
    elif "bash" in os.environ["SHELL"]:
        os.system(
            f"_DEERTRACKER_COMPLETE=source_bash deertracker > {DATA_DIR}/autocomplete.source"
        )
        os.system(f"echo '. {DATA_DIR}/autocomplete.source' >> ~/.bashrc")


class PostDevelopCommand(develop):
    def run(self):
        develop.run(self)
        auto_complete()


class PostInstallCommand(install):
    def run(self):
        install.run(self)
        auto_complete()


setup(
    name="deertracker",
    version="1.0",
    py_modules=["deertracker"],
    install_requires=[
        "Click",
    ],
    entry_points="""
        [console_scripts]
        deertracker=deertracker.main:main
    """,
    cmdclass={
        "develop": PostDevelopCommand,
        "install": PostInstallCommand,
    },
)
