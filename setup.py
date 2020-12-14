from setuptools import setup

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
)
