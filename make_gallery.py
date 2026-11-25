"""Resizes your photos and lists the carousel photos.

Put ORIGINAL photos (any size, jpg/png/webp/...) in:
  assets/                 portrait, traffic, facecheck, puppetry, floodguard, starting-blocks
  assets/carousel/        any number of activity photos (file name = caption)
Then run:  python make_gallery.py
The website only loads the small copies it makes in assets/web/.
Needs Pillow once:  pip install pillow
"""
import json, pathlib, re, sys
try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is missing. Run:  pip install pillow")

ROOT = pathlib.Path(__file__).parent / "assets"
OUT = ROOT / "web"
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".tif", ".tiff"}
MAX = 1600  # longest side in px; plenty for a full-width photo on a laptop

def shrink(src, dst):
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return False  # already up to date
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src))  # fixes phone photos that come out sideways
    im.thumbnail((MAX, MAX), Image.LANCZOS)
    im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB").save(dst, "WEBP", quality=82, method=6)
    return True

def sources(folder):
    return sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in EXT)

done = 0
for p in sources(ROOT):
    done += shrink(p, OUT / (p.stem + ".webp"))

cdir = ROOT / "carousel"; cdir.mkdir(exist_ok=True)
(OUT / "carousel").mkdir(parents=True, exist_ok=True)
keep, photos = set(), []
for p in sources(cdir):
    out = OUT / "carousel" / (p.stem + ".webp")
    done += shrink(p, out); keep.add(out.name)
    photos.append({"file": out.name, "caption": re.sub(r"[-_]+", " ", p.stem).strip()})
for old in (OUT / "carousel").glob("*.webp"):  # drop copies whose original was deleted
    if old.name not in keep: old.unlink()

(OUT / "carousel" / "photos.js").write_text("window.PHOTOS = " + json.dumps(photos, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
print(f"Resized {done} image(s). Carousel has {len(photos)} photo(s).")