#!/usr/bin/env python3
"""
Data Export Utility for Tech On Tour.
Converts master dataset to JSON formats for web and mobile application consumption.

Usage:
    python scripts/export_formats.py
"""

import os
import csv
import json
from collections import defaultdict

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
MASTER_CSV = os.path.join(DATA_DIR, "places.csv")
MIN_JSON = os.path.join(DATA_DIR, "places.min.json")
HIERARCHY_JSON = os.path.join(DATA_DIR, "hierarchy.json")

def export_all():
    print(f"Reading master dataset from '{MASTER_CSV}'...")
    with open(MASTER_CSV, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        
    print(f"Loaded {len(reader):,} destinations.")

    # 1. Export Minified JSON
    print(f"Exporting minified dataset to '{MIN_JSON}'...")
    with open(MIN_JSON, "w", encoding="utf-8") as f:
        json.dump(reader, f, separators=(',', ':'), ensure_ascii=False)
    print(f"Minified JSON created ({os.path.getsize(MIN_JSON):,} bytes).")

    # 2. Export State -> Category -> Places Hierarchy
    print(f"Generating State -> Category -> Places hierarchy to '{HIERARCHY_JSON}'...")
    hierarchy = defaultdict(lambda: defaultdict(list))
    for r in reader:
        st = r["state"]
        cat = r["category"]
        place_info = {
            "id": int(r["id"]),
            "name": r["name"],
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "price_range": r["price_range"],
            "rating": float(r["rating"]),
            "review_count": int(r["review_count"]),
            "best_season": r["best_season"],
            "image_url": r["image_url"]
        }
        hierarchy[st][cat].append(place_info)

    # Convert to regular dict
    hierarchy_dict = {st: dict(cats) for st, cats in sorted(hierarchy.items())}

    with open(HIERARCHY_JSON, "w", encoding="utf-8") as f:
        json.dump(hierarchy_dict, f, indent=2, ensure_ascii=False)
    print(f"Hierarchy JSON created ({os.path.getsize(HIERARCHY_JSON):,} bytes).")
    print("Export complete successfully!")

if __name__ == "__main__":
    export_all()
