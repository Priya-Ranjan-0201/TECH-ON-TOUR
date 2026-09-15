import os
import sys
import re
import csv
import pandas as pd

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PLACES_CSV = os.path.join(ROOT_DIR, "data", "places.csv")
OUTPUT_CSV = os.path.join(ROOT_DIR, "cities.csv")

def clean_token(val):
    if not isinstance(val, str):
        return ""
    val = val.strip().strip("'\"")
    # If there's a sentence end (period followed by space and capital letter), take the first sentence
    val = re.split(r'\.\s+(?=[A-Z])', val)[0].strip()
    if "\n" in val:
        val = val.split("\n")[0].strip()
    # Strip leading words
    val = re.sub(r'^(?:the|in|of|near|at|to|a|an|from)\s+', '', val, flags=re.I).strip()
    # Strip trailing district or dist
    val = re.sub(r'\s+(?:district|dist\.?)(?:\s+of\s+.*)?$', '', val, flags=re.I).strip()
    # Clean whitespace
    val = re.sub(r'\s+', ' ', val).strip()
    return val

# Regex patterns for places dataset
p_situated = re.compile(
    r'(?:situated|located)\s+in\s+([A-Za-z\s\.\'-]+?),\s*([A-Za-z\s\.\'-]+?)\s+district(?:\s+of\s+([A-Za-z\s\.\'-]+?))?\.',
    re.IGNORECASE
)
p_premier = re.compile(
    r'(?:premier|authentic|renowned|important)?\s*[\w\s]*\s*(?:destination|attraction)\s+in\s+([A-Za-z\s\.\'-]+?),\s*([A-Za-z\s\.\'-]+?)\.',
    re.IGNORECASE
)
p_dist_only = re.compile(
    r'(?:destination|attraction|landmark|monument|temple|park|site|lake|sanctuary|resort|hills?|fort|caves?|beach|museum)\s+in\s+([A-Za-z\s\.\'-]+?)\s+district',
    re.IGNORECASE
)

# Bad tokens to discard
INVALID_TOKENS = {
    "western ghats", "eastern ghats", "remote", "town center",
    "eastern part", "easternmost", "this", "each", "every", "all",
    "dense", "forested", "densely forested", "lush green", "quiet"
}

def extract_and_generate():
    print(f"Reading tourist places dataset: {PLACES_CSV}")
    df = pd.read_csv(PLACES_CSV)
    print(f"Total tourist places loaded: {len(df)}")

    extracted = []

    for idx, row in df.iterrows():
        name = str(row.get("name", "")).strip()
        desc = str(row.get("description", "")).strip()
        state = str(row.get("state", "")).strip()

        # Handle Delhi / New Delhi
        if state.lower() in ["delhi", "new delhi"]:
            extracted.append({"city_name": "New Delhi", "district": "New Delhi", "state": "Delhi"})
            continue

        # Pattern 1: situated/located in City, District district
        m1 = p_situated.search(desc)
        if m1:
            c = clean_token(m1.group(1))
            d = clean_token(m1.group(2))
            st = clean_token(m1.group(3)) if m1.group(3) else state
            if c and d and len(c) >= 2 and len(d) >= 2:
                if not any(bad in c.lower() for bad in INVALID_TOKENS):
                    extracted.append({"city_name": c, "district": d, "state": st or state})
                    continue

        # Pattern 2: premier destination in location, state
        m2 = p_premier.search(desc)
        if m2:
            loc = clean_token(m2.group(1))
            if loc and len(loc) >= 2 and loc.lower() != state.lower():
                if not any(bad in loc.lower() for bad in INVALID_TOKENS):
                    extracted.append({"city_name": loc, "district": loc, "state": state})
                    continue

        # Pattern 3: destination/attraction in District district
        m3 = p_dist_only.search(desc)
        if m3:
            dist = clean_token(m3.group(1))
            if dist and len(dist) >= 2 and dist.lower() != state.lower():
                if not any(bad in dist.lower() for bad in INVALID_TOKENS):
                    extracted.append({"city_name": dist, "district": dist, "state": state})
                    continue

    df_ext = pd.DataFrame(extracted)
    df_ext["city_name"] = df_ext["city_name"].str.title()
    df_ext["district"] = df_ext["district"].str.title()
    df_ext["state"] = df_ext["state"].str.title()

    # Specific normalization fixes
    replacements = {
        "Kasaragod District Of Kerala": "Kasaragod",
        "Ntr District": "NTR",
        "Ntr": "NTR",
        "Dr": "Konaseema",
        "Dr. B. R. Ambedkar Konaseema": "Konaseema",
        "Bengaluru Urban": "Bengaluru",
    }
    df_ext["city_name"] = df_ext["city_name"].replace(replacements)
    df_ext["district"] = df_ext["district"].replace(replacements)

    # Discard any single-character or invalid leftovers
    df_ext = df_ext[df_ext["city_name"].str.len() > 1]
    df_ext = df_ext[df_ext["district"].str.len() > 1]

    # Deduplicate strictly on (city_name, district, state)
    df_dedup = df_ext.drop_duplicates(subset=["city_name", "district", "state"]).copy()

    # Sort deterministically
    df_dedup = df_dedup.sort_values(by=["state", "district", "city_name"]).reset_index(drop=True)

    # Insert id as the first column (1-indexed)
    df_dedup.insert(0, "id", range(1, len(df_dedup) + 1))

    # Save to root folder
    df_dedup.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    print(f"Successfully generated separate CSV file at: {OUTPUT_CSV}")
    print(f"Total unique cities/districts: {len(df_dedup)}")

if __name__ == "__main__":
    extract_and_generate()
