import os
import csv
from collections import Counter

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = BASE_DIR
STATES_DIR = os.path.join(DATA_DIR, "states")
UTS_DIR = os.path.join(DATA_DIR, "union_territories")
MASTER_CSV = os.path.join(DATA_DIR, "places.csv")
SEARCH_CSV = os.path.join(DATA_DIR, "search_graph", "related_searches.csv")

HEADERS = [
    "id",
    "name",
    "state",
    "category",
    "latitude",
    "longitude",
    "price_range",
    "rating",
    "review_count",
    "description",
    "best_season",
    "image_url"
]

VALID_CATEGORIES = {"hotel", "attraction", "homestay", "restaurant"}
VALID_PRICE_RANGES = {"budget", "mid", "luxury"}
HTML_ENTITIES = ['&amp;', '&#39;', '&quot;', '&nbsp;', '&lt;', '&gt;']

def validate_row(p, idx, row, issues, expected_state=None):
    for h in HEADERS:
        val = row.get(h)
        if val is None or not str(val).strip():
            issues.append(f"{p}:{idx} - Missing/empty {h}")
        elif str(val) != str(val).strip():
            issues.append(f"{p}:{idx} - Whitespace padding in {h}: '{val}'")
        elif '&' in str(val) and any(entity in str(val) for entity in HTML_ENTITIES):
            issues.append(f"{p}:{idx} - Unescaped HTML entity in {h}: '{val}'")

    # ID validation
    try:
        id_val = int(row.get("id", 0))
        if id_val <= 0:
            issues.append(f"{p}:{idx} - Non-positive ID: {id_val}")
    except ValueError:
        issues.append(f"{p}:{idx} - Invalid integer ID: '{row.get('id')}'")

    # State validation
    if expected_state:
        actual_state = (row.get("state") or "").strip().lower()
        if actual_state != expected_state:
            issues.append(f"{p}:{idx} - State mismatch: expected '{expected_state}', got '{actual_state}'")

    # Category validation
    cat = (row.get("category") or "").strip().lower()
    if cat not in VALID_CATEGORIES:
        issues.append(f"{p}:{idx} - Invalid category: '{cat}' (must be one of {VALID_CATEGORIES})")

    # Price range validation
    price = (row.get("price_range") or "").strip().lower()
    if price not in VALID_PRICE_RANGES:
        issues.append(f"{p}:{idx} - Invalid price_range: '{price}' (must be one of {VALID_PRICE_RANGES})")

    # Latitude validation
    try:
        lat = float(row.get("latitude", 0))
        if not (6.0 <= lat <= 38.0):
            issues.append(f"{p}:{idx} - Out of range latitude: {lat}")
    except ValueError:
        issues.append(f"{p}:{idx} - Non-float latitude: '{row.get('latitude')}'")

    # Longitude validation
    try:
        lon = float(row.get("longitude", 0))
        if not (68.0 <= lon <= 98.5):
            issues.append(f"{p}:{idx} - Out of range longitude: {lon}")
    except ValueError:
        issues.append(f"{p}:{idx} - Non-float longitude: '{row.get('longitude')}'")

    # Rating validation
    try:
        rating = float(row.get("rating", 0))
        if not (1.0 <= rating <= 5.0):
            issues.append(f"{p}:{idx} - Out of range rating: {rating}")
    except ValueError:
        issues.append(f"{p}:{idx} - Non-float rating: '{row.get('rating')}'")

    # Review count validation
    try:
        reviews = int(row.get("review_count", -1))
        if reviews < 0:
            issues.append(f"{p}:{idx} - Negative review count: {reviews}")
    except ValueError:
        issues.append(f"{p}:{idx} - Non-integer review_count: '{row.get('review_count')}'")

    # Image URL validation
    img = (row.get("image_url") or "").strip()
    if not img.startswith("http://") and not img.startswith("https://"):
        issues.append(f"{p}:{idx} - Invalid image URL: '{img}'")

def audit_all():
    issues = []
    
    # 1. Audit States
    all_state_places = []
    state_breakdown = {}
    for d in sorted(os.listdir(STATES_DIR)):
        p = os.path.join(STATES_DIR, d, "places.csv")
        if not os.path.isfile(p):
            issues.append(f"Missing places.csv in states/{d}")
            continue
        with open(p, encoding="utf-8") as f:
            reader = list(csv.DictReader(f))
            state_breakdown[d] = len(reader)
            all_state_places.extend(reader)
            expected_state = d.replace("_", " ").lower()
            for idx, row in enumerate(reader, start=2):
                validate_row(p, idx, row, issues, expected_state)

    # 2. Audit UTs
    all_ut_places = []
    ut_breakdown = {}
    for d in sorted(os.listdir(UTS_DIR)):
        p = os.path.join(UTS_DIR, d, "places.csv")
        if not os.path.isfile(p):
            issues.append(f"Missing places.csv in union_territories/{d}")
            continue
        with open(p, encoding="utf-8") as f:
            reader = list(csv.DictReader(f))
            ut_breakdown[d] = len(reader)
            all_ut_places.extend(reader)
            expected_ut = d.replace("_", " ").lower()
            for idx, row in enumerate(reader, start=2):
                validate_row(p, idx, row, issues, expected_ut)

    # 3. Audit Master places.csv
    with open(MASTER_CSV, encoding="utf-8") as f:
        master_rows = list(csv.DictReader(f))
        for idx, row in enumerate(master_rows, start=2):
            validate_row(MASTER_CSV, idx, row, issues)

    # 4. Master ID uniqueness and ordering
    master_ids = [int(r["id"]) for r in master_rows]
    if len(master_ids) != len(set(master_ids)):
        issues.append(f"Master IDs not unique: {len(master_ids)} total vs {len(set(master_ids))} unique")
    if any(i <= 0 for i in master_ids):
        issues.append("Master IDs contain non-positive integers")
    if master_ids != sorted(master_ids):
        issues.append("Master IDs are not strictly ascending in order")

    # 5. Bidirectional Parity Audit
    reg_tuples = [tuple((r.get(h) or "").strip() for h in HEADERS) for r in all_state_places + all_ut_places]
    master_tuples = [tuple((r.get(h) or "").strip() for h in HEADERS) for r in master_rows]
    
    reg_set = set(reg_tuples)
    master_set = set(master_tuples)

    diff_reg_minus_master = reg_set - master_set
    diff_master_minus_reg = master_set - reg_set
    if diff_reg_minus_master:
        issues.append(f"Parity Error: {len(diff_reg_minus_master)} records in regional files missing from master")
    if diff_master_minus_reg:
        issues.append(f"Parity Error: {len(diff_master_minus_reg)} records in master missing from regional files")
    if reg_tuples != master_tuples:
        issues.append("Ordering Discrepancy: Regional concatenation does not match master row-by-row")

    # 6. Audit Search Graph
    with open(SEARCH_CSV, encoding="utf-8") as f:
        search_rows = list(csv.DictReader(f))
        search_headers = ["place_id", "associated_search_term", "search_weight"]
        for idx, row in enumerate(search_rows, start=2):
            for sh in search_headers:
                val = row.get(sh)
                if not val or not val.strip():
                    issues.append(f"search_graph/related_searches.csv:{idx} - Missing/empty {sh}")
                    break

    # Summary
    print("================ DATA AUDIT & VERIFICATION REPORT ================")
    print(f"Total Quality Issues Found: {len(issues)}")
    if issues:
        print(f"Listing first {min(15, len(issues))} issues:")
        for iss in issues[:15]:
            print(f"  [ISSUE] {iss}")
    else:
        print("PERFECT INTEGRITY: Zero missing values, zero formatting errors, 100% bidirectional parity across all files!")

    print("\n--- INVENTORY TOTALS ---")
    print(f"States Destination Count: {len(all_state_places):,}")
    print(f"UTs Destination Count: {len(all_ut_places):,}")
    print(f"Sum of Regional Files: {len(all_state_places) + len(all_ut_places):,}")
    print(f"Master places.csv Count: {len(master_rows):,}")
    print(f"Parity Match (Regional == Master): {len(all_state_places) + len(all_ut_places) == len(master_rows) and len(diff_reg_minus_master) == 0 and len(diff_master_minus_reg) == 0}")
    print(f"Search Graph Relations Count: {len(search_rows):,}")

    unique_names = set(r["name"].strip().lower() for r in master_rows)
    print(f"Unique Destination Names: {len(unique_names):,}")

    cat_counter = Counter(r["category"].strip() for r in master_rows)
    print("\n--- TOP DESTINATION CATEGORIES ACROSS INDIA ---")
    for cat, cnt in cat_counter.most_common():
        print(f"  {cat:<30}: {cnt:>5,}")

    price_counter = Counter(r["price_range"].strip() for r in master_rows)
    print("\n--- PRICE RANGE BREAKDOWN ---")
    for pr, cnt in price_counter.most_common():
        print(f"  {pr:<30}: {cnt:>5,}")

    print("==================================================================")
    return len(issues) == 0

if __name__ == "__main__":
    success = audit_all()
    exit(0 if success else 1)
