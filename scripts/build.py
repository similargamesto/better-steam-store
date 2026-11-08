"""Builds every extension into dist/ and zips it for the stores.

The three standalone extensions are copied as they are (without README and images).
Better Steam Store gets its own manifest, background and icons, plus the files of the
three extensions in subfolders, so each file has a single source in extensions/.

Usage: python scripts/build.py
"""
import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "extensions"
DIST = ROOT / "dist"
MODULES = ["recommendations", "also-play", "clean-interface"]
SKIP = {"README.md", "images", "manifest.json", "icons"}
PACKAGE = {
    "recommendations": "better-steam-recommendations",
    "also-play": "better-steam-also-play",
    "clean-interface": "better-steam-clean-interface",
    "store": "better-steam-store",
}


def copy_tree(src, dst, skip):
    dst.mkdir(parents=True, exist_ok=True)
    for item in src.iterdir():
        if item.name in skip:
            continue
        target = dst / item.name
        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)


def referenced_files(manifest):
    files = list(manifest.get("icons", {}).values())
    background = manifest.get("background", {})
    if "service_worker" in background:
        files.append(background["service_worker"])
    files += background.get("scripts", [])
    for script in manifest.get("content_scripts", []):
        files += script.get("js", []) + script.get("css", [])
    return files


def check(folder):
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    missing = [f for f in referenced_files(manifest) if not (folder / f).is_file()]
    if missing:
        sys.exit(f"{folder.name}: missing files: {', '.join(missing)}")
    return manifest["version"]


def zip_folder(folder, name):
    path = DIST / f"{name}.zip"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for file in sorted(folder.rglob("*")):
            if file.is_file():
                z.write(file, file.relative_to(folder).as_posix())
    return path


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    for module in MODULES:
        copy_tree(SRC / module, DIST / module, {"README.md", "images"})

    store = DIST / "store"
    copy_tree(SRC / "store", store, {"README.md", "images"})
    for module in MODULES:
        copy_tree(SRC / module, store / module, SKIP)

    for folder in MODULES + ["store"]:
        version = check(DIST / folder)
        path = zip_folder(DIST / folder, f"{PACKAGE[folder]}-{version}")
        print(f"{path.name} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
