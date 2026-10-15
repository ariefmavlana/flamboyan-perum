import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "apps/web/public"
PRIVATE = ROOT / ".tools/real-flamboyan-assets"
SOURCE_INDEX = ROOT / "scripts/flamboyan-source-assets.json"
WIDTHS = (640, 1280, 1920)
PHOTO_COUNTS = {"36/60": 9, "36/90": 8, "56/90": 10, "62/70": 14, "69/80": 9}

# Small scene-specific corrections preserve photographed materials and lighting.
# Values are exposure, gamma, contrast, saturation, and RGB white balance.
GRADES = {
    "20261011_133109": (1.025, 0.985, 1.015, 0.985, (1.014, 1.000, 0.989)),
    "20261011_133601": (1.035, 0.970, 0.990, 0.990, (1.006, 1.000, 0.998)),
    "20261011_133631": (1.050, 0.965, 0.990, 0.985, (1.008, 1.000, 0.997)),
    "20261011_133657": (1.015, 0.990, 1.000, 0.985, (1.004, 1.000, 1.002)),
    "20261011_133703": (1.035, 0.975, 0.990, 0.985, (1.005, 1.000, 0.998)),
    "20261011_133720": (1.040, 0.975, 1.005, 0.990, (1.008, 1.000, 0.996)),
    "20261011_133735": (1.010, 0.990, 1.005, 0.995, (1.006, 1.000, 0.998)),
    "20261011_133805": (1.020, 0.985, 1.005, 0.985, (1.005, 1.000, 1.002)),
    "20261011_133822": (1.035, 0.975, 0.995, 0.985, (1.006, 1.000, 0.999)),
    "20261011_133900": (1.030, 0.980, 1.010, 0.985, (1.010, 1.000, 0.993)),
    "20261011_133933": (1.035, 0.975, 0.990, 0.985, (1.006, 1.000, 0.998)),
    "20261011_133952": (1.045, 0.965, 0.990, 0.990, (1.007, 1.000, 0.997)),
    "20261011_134002": (1.035, 0.975, 0.995, 0.990, (1.006, 1.000, 0.998)),
    "20261011_134100": (1.025, 0.985, 0.995, 0.985, (1.003, 1.000, 1.003)),
    "20261011_140924": (1.015, 0.990, 1.015, 0.985, (1.012, 1.000, 0.991)),
    "20261011_141058": (1.025, 0.985, 1.015, 0.985, (1.011, 1.000, 0.992)),
    "20261011_141126": (1.020, 0.985, 1.010, 0.985, (1.011, 1.000, 0.992)),
}


def digest(file):
    checksum = hashlib.sha256()
    with file.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            checksum.update(block)
    return checksum.hexdigest()


def record(file, image=None):
    metadata = {
        "file": file.relative_to(ROOT).as_posix(),
        "bytes": file.stat().st_size,
        "sha256": digest(file),
    }
    if image is not None:
        metadata.update(width=image.width, height=image.height)
    return metadata


def resize(image, width):
    width = min(width, image.width)
    height = max(1, round(image.height * width / image.width))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def grade(image, stem):
    exposure, gamma, contrast, saturation, balance = GRADES[stem]
    channels = []
    for channel, multiplier in zip(image.split(), balance):
        curve = [
            round(255 * min(1, (value / 255 * exposure * multiplier) ** gamma))
            for value in range(256)
        ]
        channels.append(channel.point(curve))
    edited = Image.merge("RGB", channels)
    edited = ImageEnhance.Contrast(edited).enhance(contrast)
    return ImageEnhance.Color(edited).enhance(saturation)


def write_webp(image, file, quality):
    file.parent.mkdir(parents=True, exist_ok=True)
    image.save(file, "WEBP", quality=quality, method=6, exif=b"", icc_profile=b"")
    with Image.open(file) as saved:
        if saved.size != image.size or saved.getexif():
            raise ValueError(f"Output dimensions/metadata mismatch: {file}")
    return record(file, image)


def editorial_image(asset, source_root):
    with Image.open(source_root / asset["path"]) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
    if asset["kind"] == "ACTUAL_PHOTO":
        stem = Path(asset["path"]).stem
        upright_size = image.size
        image = grade(image, stem)
        if image.size != upright_size:
            raise ValueError("Photo grading changed the full-frame geometry")
        graded = PRIVATE / "graded" / f"{asset['key']}.jpg"
        graded.parent.mkdir(parents=True, exist_ok=True)
        image.save(graded, "JPEG", quality=94, subsampling=0, exif=b"")
        asset["graded"] = record(graded, image)
        asset["grade"] = dict(zip(
            ("exposure", "gamma", "contrast", "saturation", "white_balance_rgb"),
            GRADES[stem],
        ))
    outputs = []
    sources = []
    for width in WIDTHS:
        variant = resize(image, width)
        destination = PUBLIC / "images/flamboyan-indah-2" / f"{asset['key']}-{width}.webp"
        quality = 94 if asset["kind"] == "MASTERPLAN" else 82
        outputs.append(write_webp(variant, destination, quality))
        sources.append({
            "url": "/" + destination.relative_to(PUBLIC).as_posix(),
            "width": variant.width,
            "height": variant.height,
        })
    asset["outputs"] = outputs
    if asset["kind"] == "ACTUAL_PHOTO":
        category = "actual"
        caption = asset["caption"] + ". Dokumentasi aktual; tipe rumah belum dipastikan."
    elif asset["kind"] == "MASTERPLAN":
        category = "siteplan"
        caption = "Rencana siteplan dari sumber pemilik; warna dan legenda dipertahankan."
    else:
        category = "illustration"
        caption = asset["caption"] + "; bukan dokumentasi gerbang terbangun."
    return {
        "key": asset["key"],
        "src": sources[1]["url"],
        "width": sources[1]["width"],
        "height": sources[1]["height"],
        "sources": sources,
        "alt": asset["caption"].split(";")[0] + " Bukit Flamboyan Indah 2",
        "caption": caption,
        "category": category,
    }


def write_shared(images, brand):
    target = ROOT / "apps/web/shared/content/flamboyan-assets.ts"
    target.parent.mkdir(parents=True, exist_ok=True)
    contract = """export interface DevelopmentImage {
  key: string
  src: string
  width: number
  height: number
  sources: { url: string; width: number; height: number }[]
  alt: string
  caption: string
  category: 'actual' | 'illustration' | 'siteplan'
}

"""
    actual = [image for image in images if image["category"] == "actual"]
    code = contract + "export const developmentPhotos: DevelopmentImage[] = " + json.dumps(actual, ensure_ascii=False, indent=2) + "\n\n"
    for name, key in (("gateDay", "gate-day"), ("gateDusk", "gate-dusk"), ("siteplan", "siteplan")):
        image = next(image for image in images if image["key"] == key)
        code += f"export const {name}: DevelopmentImage = " + json.dumps(image, ensure_ascii=False, indent=2) + "\n\n"
    for name in ("logo", "logoMark"):
        code += f"export const {name} = " + json.dumps(brand[name], ensure_ascii=False, indent=2) + "\n\n"
    target.write_text(code, encoding="utf-8")


def contact_sheet(images, file):
    columns = 4
    cell_width, cell_height = 340, 340
    rows = (len(images) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "#eeebe2")
    draw = ImageDraw.Draw(sheet)
    for index, entry in enumerate(images):
        with Image.open(PUBLIC / entry["src"].lstrip("/")) as image:
            thumbnail = ImageOps.contain(image.convert("RGB"), (316, 278))
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        sheet.paste(thumbnail, (x + (cell_width - thumbnail.width) // 2, y + 10))
        draw.text((x + 12, y + 294), entry["key"], fill="#292823")
        draw.text((x + 12, y + 312), entry["category"], fill="#706e65")
    file.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(file, "JPEG", quality=92)


def prepare_brand(asset):
    brand, outputs = {}, []
    for name, filename, width in (("logo", "logo", 1200), ("logoMark", "mark", 256)):
        artwork = PRIVATE / "artwork" / f"{filename}.png"
        with Image.open(artwork) as image:
            image = image.convert("RGBA")
            if image.getextrema()[3][0] == 255:
                raise ValueError(f"Brand artwork must have transparent pixels: {artwork}")
            image = resize(image, width)
            output = PUBLIC / "images/brand" / f"flamboyan-{filename}.webp"
            outputs.append(write_webp(image, output, 94))
            brand[name] = {"src": "/" + output.relative_to(PUBLIC).as_posix(), "width": image.width, "height": image.height}
            if filename == "mark":
                favicon = PUBLIC / "images/brand/flamboyan-mark.png"
                image.save(favicon, "PNG", optimize=True)
                outputs.append(record(favicon, image))
        asset.setdefault("artwork", {})[filename] = record(artwork)
    asset["outputs"] = outputs
    return brand, outputs


def format_metadata(include_import):
    node = ROOT / ".tools/node/node-v24.21.0-win-x64/node.exe"
    files = [ROOT / "apps/web/shared/content/flamboyan-assets.ts", SOURCE_INDEX]
    if include_import:
        files.append(ROOT / "scripts/flamboyan-house-assets.json")
    subprocess.run(
        [str(node) if node.exists() else "node", str(ROOT / "apps/web/node_modules/prettier/bin/prettier.cjs"), "--write", *map(str, files)],
        check=True,
    )


def main():
    parser = argparse.ArgumentParser(description="Prepare verified Flamboyan source assets without publishing or deleting originals.")
    parser.add_argument("--source-root", type=Path, default=PRIVATE / "sources")
    parser.add_argument("--editorial-only", action="store_true", help="Prepare editorial and brand assets; skip private type-import files")
    args = parser.parse_args()
    source_root = args.source_root.resolve()
    index = json.loads(SOURCE_INDEX.read_text(encoding="utf-8"))
    assets = index["assets"]
    if len(assets) != 98 or len({asset["key"] for asset in assets}) != 98 or any(not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", asset["key"]) for asset in assets):
        raise ValueError("Expected 76 source images and 22 deferred videos with unique keys")
    if sum(asset["kind"] == "ACTUAL_PHOTO" for asset in assets) != 17 or sum(asset["path"].startswith("EDITED/") and asset["kind"] != "DEFERRED_VIDEO" for asset in assets) != 58:
        raise ValueError("Incomplete actual or EDITED source coverage")
    for asset in assets:
        file = (source_root / asset["path"]).resolve()
        if not file.is_relative_to(source_root) or file.stat().st_size != asset["bytes"] or digest(file) != asset["sha256"]:
            raise ValueError(f"Original source changed: {asset['path']}")
        if asset["kind"] == "DEFERRED_VIDEO":
            asset["status"] = "DEFERRED_BY_USER"
            asset["outputs"] = []
    logo_source = next(asset for asset in assets if asset["kind"] == "BRAND")
    brand, brand_outputs = prepare_brand(logo_source)
    editorial = [asset for asset in assets if asset["kind"] in ("ACTUAL_PHOTO", "PROJECT_ILLUSTRATION", "MASTERPLAN")]
    images = [editorial_image(asset, source_root) for asset in editorial]
    if len(images) != 20 or images[0]["key"] != "actual-20261011-133109":
        raise ValueError("Unexpected editorial image set or first cover")
    write_shared(images, brand)
    contact_sheet(images, PRIVATE / "review/editorial-contact-sheet.jpg")
    SOURCE_INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Prepared 20 editorial images (60 responsive variants) and shared content.", flush=True)
    if args.editorial_only:
        format_metadata(False)
        return
    properties = [{"house_type": house_type, "slug": "bukit-flamboyan-indah-2-" + house_type.replace("/", "-")} for house_type in PHOTO_COUNTS]
    imports = []
    for house_type, count in PHOTO_COUNTS.items():
        typed = sorted((asset for asset in assets if asset["house_type"] == house_type and asset["kind"] != "DEFERRED_VIDEO"), key=lambda asset: asset["position"])
        if len(typed) != count + 1 or [asset["kind"] for asset in typed] != ["PHOTO"] * count + ["FLOOR_PLAN"] or [asset["position"] for asset in typed] != list(range(count + 1)):
            raise ValueError(f"Incorrect photo/floor-plan mapping: {house_type}")
        for asset in typed:
            source = source_root / asset["path"]
            if asset["path"] == "EDITED/69-80/69-80-1.jpg":
                source = PRIVATE / "artwork/cover-69-80.png"
                asset["artwork"] = record(source)
            with Image.open(source) as original:
                image = resize(ImageOps.exif_transpose(original).convert("RGB"), 1920)
            output = PRIVATE / "import" / f"{asset['key']}.webp"
            processed = write_webp(image, output, 92)
            asset["outputs"] = [processed]
            caption = asset["caption"].split(";")[0]
            alt = (f"Denah tipe {house_type} Bukit Flamboyan Indah 2" if asset["kind"] == "FLOOR_PLAN" else f"Ilustrasi tipe {house_type} - {caption}") + f" [BFI2:{asset['key']}]"
            imports.append({"key": asset["key"], "house_type": house_type, "kind": asset["kind"], **processed, "alt": alt, "position": asset["position"]})
    if len(imports) != 55 or len({asset["sha256"] for asset in imports}) != 55:
        raise ValueError("Expected 55 distinct type asset outputs")
    source_bytes = sum(asset["bytes"] for asset in imports)
    reserved = source_bytes * 4
    if reserved > 100 * 1024 * 1024:
        raise ValueError(f"R2 import reserve exceeds 100 MiB: {reserved} bytes")
    manifest = {"schema_version": 1, "properties": properties, "assets": imports}
    (ROOT / "scripts/flamboyan-house-assets.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    index["recipe"] = {
        "actual_photos": "EXIF transpose; per-scene tonal LUT, gentle contrast and saturation; full frame preserved",
        "edited": "No color grading; width-limited WebP; selected 69/80 label correction only",
        "siteplan": "Original colors, labels and full frame; WebP quality 94",
        "public_webp_quality": 82,
        "import_webp_quality": 92,
        "responsive_widths": WIDTHS,
    }
    SOURCE_INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    format_metadata(True)
    stats = {
        "source_images": 76,
        "edited_images_mapped": 58,
        "actual_photos_graded": 17,
        "deferred_videos": 22,
        "editorial_images": 20,
        "public_variants": 60,
        "import_images": 55,
        "import_bytes": source_bytes,
        "r2_reserved_bytes": reserved,
        "public_bytes": sum(output["bytes"] for asset in editorial for output in asset["outputs"]) + sum(output["bytes"] for output in brand_outputs),
    }
    (PRIVATE / "preparation-stats.json").write_text(json.dumps(stats, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
