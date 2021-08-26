from setuptools import setup

setup(
    name='pixelmap',
    version='1.0',
    packages=[''],
    install_requires=[
        "web3==5.23.0",
        "gevent==21.8.0",
        "redis==3.5.3",
        "pillow==8.3.1",
        "jinja2==3.0.1"
    ],
    url='https://pixelmap.io',
    license='',
    author='Ken Erwin',
    author_email='ken@devopslibrary.com',
    description='PixelMap'
)
