"""
Apex Cinema - Command Line Helper to Add Wallpapers
Usage:
  python add_wallpaper.py --image "C:\path\to\car.jpg" --category "Sports Cars" --name "Porsche GT3" --meta "4.0L Flat-6"
"""

import os
import sys
import shutil
import argparse
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP_DIR = os.path.join(BASE_DIR, "assets", "wallpapers")
DATA_FILE = os.path.join(BASE_DIR, "js", "wallpapers.js")

CATEGORIES_MAP = {
    "luxury": "Luxury Cars",
    "luxury cars": "Luxury Cars",
    "sports": "Sports Cars",
    "sports cars": "Sports Cars",
    "classic": "Classic Cars",
    "classic cars": "Classic Cars",
    "offroad": "Off-Road & SUVs",
    "off-road": "Off-Road & SUVs",
    "off-road & suvs": "Off-Road & SUVs",
    "suv": "Off-Road & SUVs",
    "suvs": "Off-Road & SUVs"
}

FORBIDDEN = ["jdm", "supercar", "supercars", "hypercar", "hypercars"]

def add_new_wallpaper(image_path, category, name, meta="", camera="", car_id=None):
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        return False

    cat_lower = category.lower().strip()
    if any(f in cat_lower for f in FORBIDDEN):
        print(f"Error: Category '{category}' is forbidden. JDM, Supercars, and Hypercars are strictly excluded.")
        return False

    normalized_cat = CATEGORIES_MAP.get(cat_lower)
    if not normalized_cat:
        print(f"Error: Unknown category '{category}'. Valid: Luxury Cars, Sports Cars, Classic Cars, Off-Road & SUVs.")
        return False

    # Target folder
    cat_folder = {
        "Luxury Cars": "luxury",
        "Sports Cars": "sports",
        "Classic Cars": "classic",
        "Off-Road & SUVs": "offroad"
    }[normalized_cat]

    target_dir = os.path.join(WP_DIR, cat_folder)
    mix_dir = os.path.join(WP_DIR, "mixup")
    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(mix_dir, exist_ok=True)

    filename = os.path.basename(image_path)
    clean_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)

    dest_cat_file = os.path.join(target_dir, clean_filename)
    dest_mix_file = os.path.join(mix_dir, clean_filename)

    # Copy to category folder
    shutil.copy2(image_path, dest_cat_file)
    print(f"Copied image to: assets/wallpapers/{cat_folder}/{clean_filename}")

    # Hard-link to mixup
    if os.path.exists(dest_mix_file):
        os.remove(dest_mix_file)
    os.link(dest_cat_file, dest_mix_file)
    print(f"Hard-linked to: assets/wallpapers/mixup/{clean_filename}")

    # Generate ID if not provided
    if not car_id:
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        car_id = f"custom-{cat_folder}-{slug}"

    rel_src = f"assets/wallpapers/{cat_folder}/{clean_filename}".replace("\\", "/")
    rel_mix = f"assets/wallpapers/mixup/{clean_filename}".replace("\\", "/")

    # Read wallpapers.js and append entry
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js_content = f.read()

    new_entry = f"""  {{
    id: '{car_id}',
    name: '{name}',
    category: '{normalized_cat}',
    src: '{rel_src}',
    mixSrc: '{rel_mix}',
    meta: '{meta}',
    camera: '{camera}',
    isBuiltin: true
  }},\n];"""

    if "];" in js_content:
        # Replace the last ]; before comments
        idx = js_content.rfind("];")
        updated_js = js_content[:idx] + new_entry + js_content[idx+2:]
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            f.write(updated_js)
        print(f"Successfully registered wallpaper '{name}' (ID: {car_id}) in js/wallpapers.js!")
        return True
    else:
        print("Warning: Could not automatically append to js/wallpapers.js. Please add manually.")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apex Cinema Wallpaper Registration CLI")
    parser.add_argument("--image", required=True, help="Path to image file")
    parser.add_argument("--category", required=True, help="Luxury Cars, Sports Cars, Classic Cars, or Off-Road & SUVs")
    parser.add_argument("--name", required=True, help="Car title/name")
    parser.add_argument("--meta", default="", help="Car specs (e.g. 4.0L V8)")
    parser.add_argument("--camera", default="", help="Camera specs")
    parser.add_argument("--id", default=None, help="Optional unique ID")

    args = parser.parse_args()
    add_new_wallpaper(args.image, args.category, args.name, args.meta, args.camera, args.id)
