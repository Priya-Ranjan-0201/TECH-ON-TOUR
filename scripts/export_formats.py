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

    # 2. Export State-District-Place Hierarchy
    print(f"Generating State -> District -> Places hierarchy to '{HIERARCHY_JSON}'...")
    hierarchy = defaultdict(lambda: defaultdict(list))
    for r in reader:
        st = r["state_ut"]
        dist = r["district"]
        place_info = {
            "name": r["place_name"],
            "city": r["city_or_town"],
            "transit": r["nearest_major_city"],
            "category": r["category"]
        }
        hierarchy[st][dist].append(place_info)

    # Convert to regular dict
    hierarchy_dict = {st: dict(dists) for st, dists in sorted(hierarchy.items())}

    with open(HIERARCHY_JSON, "w", encoding="utf-8") as f:
        json.dump(hierarchy_dict, f, indent=2, ensure_ascii=False)
    print(f"Hierarchy JSON created ({os.path.getsize(HIERARCHY_JSON):,} bytes).")
    print("Export complete successfully!")

if __name__ == "__main__":
    export_all()
