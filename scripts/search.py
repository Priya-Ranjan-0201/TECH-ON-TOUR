#!/usr/bin/env python3
"""
Interactive Search & Exploration CLI for Tech On Tour.
Query 12,293+ verified Indian tourist destinations across 737 districts.

Usage examples:
    python scripts/search.py --state Bihar --district Patna
    python scripts/search.py --category Waterfall --limit 10
    python scripts/search.py --query "fort" --state Rajasthan
    python scripts/search.py --state Kerala --stats
"""

import os
import csv
import sys
import json
import argparse
from collections import Counter

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MASTER_CSV = os.path.join(BASE_DIR, "data", "places.csv")

def load_destinations():
    if not os.path.exists(MASTER_CSV):
        print(f"Error: Dataset not found at '{MASTER_CSV}'", file=sys.stderr)
        sys.exit(1)
        
    with open(MASTER_CSV, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def search_places(records, state=None, district=None, category=None, query=None):
    results = []
    for r in records:
        if state and r["state_ut"].strip().lower() != state.strip().lower():
            continue
        if district and district.strip().lower() not in r["district"].strip().lower():
            continue
        if category and category.strip().lower() not in r["category"].strip().lower():
            continue
        if query:
            q = query.strip().lower()
            match = (
                q in r["place_name"].lower() or
                q in r["city_or_town"].lower() or
                q in r["district"].lower() or
                q in r["category"].lower()
            )
            if not match:
                continue
        results.append(r)
    return results

# Configure UTF-8 encoding for standard outputs
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def print_stats(results):
    total = len(results)
    print(f"\n{'='*55}")
    print(f"  [DATA] EXPLORATION STATISTICS (Total Matches: {total:,})")
    print(f"{'='*55}")
    
    # State distribution
    states = Counter(r["state_ut"] for r in results)
    print("\n--- States / UTs Breakdown ---")
    for st, cnt in states.most_common(10):
        print(f"  {st:<30}: {cnt:>5,} destinations")
        
    # District distribution
    districts = Counter(f"{r['district']} ({r['state_ut']})" for r in results)
    print("\n--- Top Districts ---")
    for dist, cnt in districts.most_common(8):
        print(f"  {dist:<35}: {cnt:>5,} destinations")

    # Category distribution
    categories = Counter(r["category"] for r in results)
    print("\n--- Category Breakdown ---")
    for cat, cnt in categories.most_common(10):
        print(f"  {cat:<30}: {cnt:>5,} destinations")
    print(f"{'='*55}\n")

def print_table(results, limit=20):
    to_show = results[:limit]
    print(f"\nShowing {len(to_show)} of {len(results):,} destinations:")
    print("-" * 95)
    print(f"{'#':<4} {'Destination Name':<38} {'State/UT':<16} {'District':<16} {'Category':<15}")
    print("-" * 95)
    for idx, r in enumerate(to_show, 1):
        name = (r["place_name"][:35] + "..") if len(r["place_name"]) > 37 else r["place_name"]
        st = (r["state_ut"][:14] + "..") if len(r["state_ut"]) > 16 else r["state_ut"]
        dist = (r["district"][:14] + "..") if len(r["district"]) > 16 else r["district"]
        cat = (r["category"][:13] + "..") if len(r["category"]) > 15 else r["category"]
        print(f"{idx:<4} {name:<38} {st:<16} {dist:<16} {cat:<15}")
    print("-" * 95)
    if len(results) > limit:
        print(f"... and {len(results) - limit:,} more destinations. Use --limit to show more or refine filters.")

def main():
    parser = argparse.ArgumentParser(description="Search and explore Tech On Tour destinations across India.")
    parser.add_argument("--state", "-s", help="Filter by State or Union Territory name")
    parser.add_argument("--district", "-d", help="Filter by District name")
    parser.add_argument("--category", "-c", help="Filter by Category (e.g. Waterfall, Fort, Temple, Lake)")
    parser.add_argument("--query", "-q", help="Free-text search keyword across name, town, district, or category")
    parser.add_argument("--limit", "-l", type=int, default=20, help="Maximum records to display (default: 20)")
    parser.add_argument("--stats", action="store_true", help="Display summary statistics and breakdown")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")

    args = parser.parse_args()

    records = load_destinations()
    results = search_places(
        records,
        state=args.state,
        district=args.district,
        category=args.category,
        query=args.query
    )

    if args.json:
        print(json.dumps(results[:args.limit], indent=2, ensure_ascii=False))
        return

    if not results:
        print("No destinations found matching the specified criteria.", file=sys.stderr)
        return

    if args.stats:
        print_stats(results)

    print_table(results, limit=args.limit)

if __name__ == "__main__":
    main()
