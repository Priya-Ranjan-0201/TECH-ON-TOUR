import os
import csv
from collections import Counter

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATES_DIR = os.path.join(DATA_DIR, "states")
UTS_DIR = os.path.join(DATA_DIR, "union_territories")
MASTER_CSV = os.path.join(DATA_DIR, "places.csv")
SEARCH_CSV = os.path.join(DATA_DIR, "search_graph", "related_searches.csv")

HEADERS = ["place_name", "state_ut", "district", "city_or_town", "nearest_major_city", "category"]
HTML_ENTITIES = ['&amp;', '&#39;', '&quot;', '&nbsp;', '&lt;', '&gt;']

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
            seen_in_file = set()
            for idx, row in enumerate(reader, start=2):
                for h in HEADERS:
                    val = row.get(h)
                    if not val or not val.strip():
                        issues.append(f"{p}:{idx} - Missing/empty {h}")
                    elif val != val.strip():
                        issues.append(f"{p}:{idx} - Whitespace padding in {h}: '{val}'")
                    elif '&' in val and any(entity in val for entity in HTML_ENTITIES):
                        issues.append(f"{p}:{idx} - Unescaped HTML entity in {h}: '{val}'")
                        
                # Check state consistency
                expected_state = d.replace("_", " ").lower()
                actual_state = (row.get("state_ut") or "").strip().lower()
                if actual_state != expected_state:
                    issues.append(f"{d}/places.csv row {idx}: State mismatch: expected '{expected_state}', got '{actual_state}'")
                
                row_tuple = tuple((row.get(h) or "").strip() for h in HEADERS)
                if row_tuple in seen_in_file:
                    issues.append(f"{d}/places.csv row {idx}: Duplicate row in file: '{row.get('place_name')}'")
                seen_in_file.add(row_tuple)

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
            seen_in_file = set()
            for idx, row in enumerate(reader, start=2):
                for h in HEADERS:
                    val = row.get(h)
                    if not val or not val.strip():
                        issues.append(f"{p}:{idx} - Missing/empty {h}")
                    elif val != val.strip():
                        issues.append(f"{p}:{idx} - Whitespace padding in {h}: '{val}'")
                    elif '&' in val and any(entity in val for entity in HTML_ENTITIES):
                        issues.append(f"{p}:{idx} - Unescaped HTML entity in {h}: '{val}'")

                # Check UT consistency
                expected_ut = d.replace("_", " ").lower()
                actual_ut = (row.get("state_ut") or "").strip().lower()
                if actual_ut != expected_ut:
                    issues.append(f"{d}/places.csv row {idx}: UT mismatch: expected '{expected_ut}', got '{actual_ut}'")

                row_tuple = tuple((row.get(h) or "").strip() for h in HEADERS)
                if row_tuple in seen_in_file:
                    issues.append(f"{d}/places.csv row {idx}: Duplicate row in file: '{row.get('place_name')}'")
                seen_in_file.add(row_tuple)

    # 3. Audit Master places.csv
    with open(MASTER_CSV, encoding="utf-8") as f:
        master_rows = list(csv.DictReader(f))
        seen_master = set()
        for idx, row in enumerate(master_rows, start=2):
            for h in HEADERS:
                val = row.get(h)
                if not val or not val.strip():
                    issues.append(f"master places.csv:{idx} - Missing/empty {h}")
                elif val != val.strip():
                    issues.append(f"master places.csv:{idx} - Whitespace padding in {h}: '{val}'")
                elif '&' in val and any(entity in val for entity in HTML_ENTITIES):
                    issues.append(f"master places.csv:{idx} - Unescaped HTML entity in {h}: '{val}'")
            row_tuple = tuple((row.get(h) or "").strip() for h in HEADERS)
            if row_tuple in seen_master:
                issues.append(f"master places.csv row {idx}: Duplicate row in master: '{row.get('place_name')}'")
            seen_master.add(row_tuple)

    # 4. Bidirectional Parity Audit
    reg_set = set(tuple((r.get(h) or "").strip() for h in HEADERS) for r in all_state_places + all_ut_places)
    master_set = set(tuple((r.get(h) or "").strip() for h in HEADERS) for r in master_rows)
    
    diff_reg_minus_master = reg_set - master_set
    diff_master_minus_reg = master_set - reg_set
    if diff_reg_minus_master:
        issues.append(f"Parity Error: {len(diff_reg_minus_master)} records in regional files missing from master")
    if diff_master_minus_reg:
        issues.append(f"Parity Error: {len(diff_master_minus_reg)} records in master missing from regional files")

    # 5. Audit Search Graph
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

    unique_names = set(r["place_name"].strip().lower() for r in master_rows)
    print(f"Unique Destination Names: {len(unique_names):,}")
    
    unique_districts = set(r["district"].strip().lower() for r in master_rows)
    print(f"Unique Districts Covered: {len(unique_districts):,}")

    cat_counter = Counter(r["category"].strip() for r in master_rows)
    print("\n--- TOP DESTINATION CATEGORIES ACROSS INDIA ---")
    for cat, cnt in cat_counter.most_common(12):
        print(f"  {cat:<30}: {cnt:>5,}")

    print("==================================================================")
    return len(issues) == 0

if __name__ == "__main__":
    success = audit_all()
    exit(0 if success else 1)
