from PIL import Image
import pathlib
import shutil
import imagehash


def sim_hash_sort(userpaths, hashfunc):
    def is_image(filename):
        f = filename.lower()
        return (
            f.endswith(".png")
            or f.endswith(".jpg")
            or f.endswith(".jpeg")
            or f.endswith(".bmp")
            or f.endswith(".gif")
            or ".jpg" in f
            or f.endswith(".svg")
        )

    image_filenames = []
    for userpath in userpaths:
        image_filenames += [
            os.path.join(userpath, path)
            for path in os.listdir(userpath)
            if is_image(path)
        ]
    for img in sorted(image_filenames):
        try:
            hash = hashfunc(Image.open(img))
        except Exception as e:
            print("Problem:", e, "with", img)
            continue
        src = pathlib.Path(img)
        if src.name.rfind("-") >= 0:
            dest = src.name[src.name.rfind("-") + 1 :]
        else:
            dest = src.name
        dest = src.parent / f"{hash}-{dest}"
        shutil.move(src, dest)


if __name__ == "__main__":
    import sys, os

    def usage():
        sys.stderr.write(
            """SYNOPSIS: %s [ahash|phash|dhash|...] [<directory>]

Identifies similar images in the directory.

Method: 
  ahash:          Average hash
  phash:          Perceptual hash
  dhash:          Difference hash
  whash-haar:     Haar wavelet hash
  whash-db4:      Daubechies wavelet hash
  colorhash:      HSV color hash
  crop-resistant: Crop-resistant hash

(C) Johannes Buchner, 2013-2017
"""
            % sys.argv[0]
        )
        sys.exit(1)

    hashmethod = sys.argv[1] if len(sys.argv) > 1 else usage()
    if hashmethod == "ahash":
        hashfunc = imagehash.average_hash
    elif hashmethod == "phash":
        hashfunc = imagehash.phash
    elif hashmethod == "dhash":
        hashfunc = imagehash.dhash
    elif hashmethod == "whash-haar":
        hashfunc = imagehash.whash
    elif hashmethod == "whash-db4":
        hashfunc = lambda img: imagehash.whash(img, mode="db4")
    elif hashmethod == "colorhash":
        hashfunc = imagehash.colorhash
    elif hashmethod == "crop-resistant":
        hashfunc = imagehash.crop_resistant_hash
    else:
        usage()
    userpaths = sys.argv[2:] if len(sys.argv) > 2 else "."
    sim_hash_sort(userpaths=userpaths, hashfunc=hashfunc)
