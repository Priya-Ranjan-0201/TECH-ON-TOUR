#!/usr/bin/env python3
"""
Interactive Search & Exploration CLI for Tech On Tour.
Query 12,293+ verified destinations across India using the normalized schema.

Usage examples:
    python scripts/search.py --state Bihar --category attraction
    python scripts/search.py --price-range budget --min-rating 4.5 --limit 10
    python scripts/search.py --query "fort" --state Rajasthan
    python scripts/search.py --category hotel --limit 5
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

def search_places(records, state=None, category=None, price_range=None, min_rating=None, best_season=None, query=None):
    results = []
    for r in records:
        if state and r["state"].strip().lower() != state.strip().lower():
            continue
        if category and category.strip().lower() != r["category"].strip().lower():
            continue
        if price_range and price_range.strip().lower() != r["price_range"].strip().lower():
            continue
        if min_rating is not None:
            try:
                if float(r["rating"]) < float(min_rating):
                    continue
            except ValueError:
                continue
        if best_season and best_season.strip().lower() not in r["best_season"].strip().lower():
            continue
        if query:
            q = query.strip().lower()
            match = (
                q in r["name"].lower() or
                q in r["description"].lower() or
                q in r["state"].lower()
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
    print(f"\n{'='*60}")
    print(f"  [DATA] EXPLORATION STATISTICS (Total Matches: {total:,})")
    print(f"{'='*60}")
    
    # State distribution
    states = Counter(r["state"] for r in results)
    print("\n--- States / UTs Breakdown ---")
    for st, cnt in states.most_common(8):
        print(f"  {st:<30}: {cnt:>5,} destinations")
        
    # Category distribution
    categories = Counter(r["category"] for r in results)
    print("\n--- Category Breakdown ---")
    for cat, cnt in categories.most_common():
        print(f"  {cat:<30}: {cnt:>5,} destinations")

    # Price range distribution
    prices = Counter(r["price_range"] for r in results)
    print("\n--- Price Range Breakdown ---")
    for pr, cnt in prices.most_common():
        print(f"  {pr:<30}: {cnt:>5,} destinations")
    print(f"{'='*60}\n")

def print_table(results, limit=20):
    to_show = results[:limit]
    print(f"\nShowing {len(to_show)} of {len(results):,} destinations:")
    print("-" * 105)
    print(f"{'ID':<6} {'Destination Name':<34} {'State/UT':<16} {'Category':<12} {'Price':<8} {'Rating':<7} {'Season':<10}")
    print("-" * 105)
    for r in to_show:
        p_id = r["id"]
        name = (r["name"][:31] + "..") if len(r["name"]) > 33 else r["name"]
        st = (r["state"][:14] + "..") if len(r["state"]) > 16 else r["state"]
        cat = r["category"]
        price = r["price_range"]
        rating = r["rating"]
        season = r["best_season"]
        print(f"{p_id:<6} {name:<34} {st:<16} {cat:<12} {price:<8} {rating:<7} {season:<10}")
    print("-" * 105)
    if len(results) > limit:
        print(f"... and {len(results) - limit:,} more destinations. Use --limit to show more or refine filters.")

def main():
    parser = argparse.ArgumentParser(description="Search and explore Tech On Tour destinations across India.")
    parser.add_argument("--state", "-s", help="Filter by State or Union Territory name")
    parser.add_argument("--category", "-c", choices=["attraction", "hotel", "homestay", "restaurant"], help="Filter by Category")
    parser.add_argument("--price-range", "-p", choices=["budget", "mid", "luxury"], help="Filter by Price Range")
    parser.add_argument("--min-rating", "-r", type=float, help="Filter by minimum rating (e.g. 4.5)")
    parser.add_argument("--best-season", help="Filter by best season (e.g. Oct-Feb)")
    parser.add_argument("--query", "-q", help="Free-text search keyword across name, description, and state")
    parser.add_argument("--limit", "-l", type=int, default=20, help="Maximum records to display (default: 20)")
    parser.add_argument("--stats", action="store_true", help="Display summary statistics and breakdown")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")

    args = parser.parse_args()

    records = load_destinations()
    results = search_places(
        records,
        state=args.state,
        category=args.category,
        price_range=args.price_range,
        min_rating=args.min_rating,
        best_season=args.best_season,
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
