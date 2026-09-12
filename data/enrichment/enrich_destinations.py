"""
data/enrichment/enrich_destinations.py
--------------------------------------
Semi-automated, verified place photo & summary enrichment pipeline.
Queries Wikipedia and Wikimedia Commons disambiguated by place name and state.
Enforces 0.5s rate-limiting, local JSON caching, manual verification CSV export,
and safe database committing with Theme 1 placeholder fallbacks.
"""

import os
import re
import csv
import json
import time
import sqlite3
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "backend" / "travelsathi_dev.db"
CACHE_FILE = Path(__file__).resolve().parent / "cache.json"
CSV_FILE = Path(__file__).resolve().parent / "manual_review_enrichment.csv"

HEADERS = {
    "User-Agent": "TravelSathiEnrichmentBot/1.0 (sih@travelsathi.gov.in; https://travelsathi.gov.in)"
}

def load_cache() -> Dict[str, Any]:
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load cache: {e}")
    return {}

def save_cache(cache: Dict[str, Any]) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)

def clean_place_name(name: str) -> str:
    """Strip parenthesis and extra descriptor tags for cleaner Wikipedia search."""
    cleaned = re.sub(r"\(.*?\)", "", name)
    cleaned = re.sub(r"\[.*?\]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def get_wikipedia_data(place_name: str, state: str) -> Optional[Dict[str, Any]]:
    """
    Search Wikipedia for the exact place, disambiguated by state, to avoid
    matching a same-named place in a different country/state.
    """
    cleaned_name = clean_place_name(place_name)
    query_str = f"{cleaned_name} {state} India"
    
    try:
        search_res = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": query_str,
                "format": "json"
            },
            headers=HEADERS,
            timeout=8
        ).json()
        
        search_results = search_res.get("query", {}).get("search", [])
        if not search_results:
            # Try without 'India' if state is distinctive
            search_res = requests.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": f"{cleaned_name} {state}",
                    "format": "json"
                },
                headers=HEADERS,
                timeout=8
            ).json()
            search_results = search_res.get("query", {}).get("search", [])
            
        if not search_results:
            return None

        # Pick best candidate: prioritize exact title matches & avoid constituency/district pages
        page_title = None
        clean_lower = cleaned_name.lower()
        skip_terms = ["constituency", "election", "legislative assembly", "lok sabha", "vidhan sabha", "district", "highway", "expressway"]
        
        # 1. Exact match check
        for cand in search_results[:5]:
            cand_title = cand["title"]
            if cand_title.lower() == clean_lower:
                page_title = cand_title
                break
        
        # 2. Filtered candidate check (avoiding political / administrative false matches)
        if not page_title:
            for cand in search_results[:5]:
                cand_title = cand["title"]
                if not any(st in cand_title.lower() for st in skip_terms):
                    page_title = cand_title
                    break

        if not page_title:
            page_title = search_results[0]["title"]
        time.sleep(0.5)  # Respect rate limit

        page_res = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "prop": "extracts|pageimages",
                "exintro": True,
                "explaintext": True,
                "piprop": "original",
                "titles": page_title,
                "format": "json"
            },
            headers=HEADERS,
            timeout=8
        ).json()

        pages = page_res.get("query", {}).get("pages", {})
        if not pages:
            return None

        p = list(pages.values())[0]
        if "missing" in p:
            return None

        raw_extract = p.get("extract", "")
        # Clean unwanted citation brackets like [1], [2]
        clean_extract = re.sub(r"\[\d+\]", "", raw_extract).strip()
        summary = clean_extract[:600]
        image_url = p.get("original", {}).get("source")

        return {
            "wiki_title": page_title,
            "summary": summary,
            "image_url": image_url,
            "source": "wikipedia" if image_url else None
        }
    except Exception as e:
        print(f"Error querying Wikipedia for {place_name} ({state}): {e}")
        return None

def get_wikimedia_commons_image(place_name: str, state: str) -> Optional[Dict[str, Any]]:
    """
    Fallback: search Wikimedia Commons files for this place.
    """
    cleaned_name = clean_place_name(place_name)
    queries = [f"{cleaned_name} {state}", cleaned_name]

    for q in queries:
        try:
            res = requests.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srnamespace": 6,
                    "srsearch": q,
                    "format": "json"
                },
                headers=HEADERS,
                timeout=8
            ).json()
            
            search_results = res.get("query", {}).get("search", [])
            if not search_results:
                continue

            file_title = search_results[0]["title"]
            time.sleep(0.5)

            img_res = requests.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": file_title,
                    "prop": "imageinfo",
                    "iiprop": "url",
                    "format": "json"
                },
                headers=HEADERS,
                timeout=8
            ).json()

            pages = img_res.get("query", {}).get("pages", {})
            for _, pdata in pages.items():
                imageinfo = pdata.get("imageinfo", [])
                if imageinfo and imageinfo[0].get("url"):
                    return {
                        "commons_title": file_title,
                        "image_url": imageinfo[0]["url"],
                        "source": "wikimedia_commons"
                    }
        except Exception as e:
            print(f"Error querying Wikimedia Commons for {q}: {e}")
    return None

def verify_title_match(place_name: str, state: str, matched_title: str) -> Tuple[bool, str]:
    """
    Validation heuristic to verify if the matched Wikipedia page title closely
    resembles the destination and avoids false cross-state matches.
    """
    if not matched_title:
        return False, "No title matched"
    
    clean_p = clean_place_name(place_name).lower()
    clean_t = matched_title.lower()
    clean_s = state.lower()

    # Explicit rejection rules for false positives
    reject_patterns = ["constituency", "election", "legislative assembly", "lok sabha", "vidhan sabha", "demographics"]
    if any(rp in clean_t for rp in reject_patterns):
        return False, f"Rejected political/administrative title: {matched_title}"

    # Extract meaningful keywords (length >= 4)
    p_tokens = [t for t in re.findall(r"\w+", clean_p) if len(t) >= 4 and t not in ["fort", "temple", "gate", "park", "lake", "view", "road", "hill", "hall"]]
    
    # 1. Exact or substring match
    if clean_p in clean_t or clean_t in clean_p:
        return True, "Direct name match"

    # 2. Token overlap check
    overlap = [t for t in p_tokens if t in clean_t]
    if len(overlap) >= 1:
        return True, f"Token overlap: {', '.join(overlap)}"

    # 3. State-level qualifier in title
    if clean_s in clean_t and any(t in clean_t for t in re.findall(r"\w+", clean_p)):
        return True, f"State-disambiguated match: {matched_title}"

    return False, f"Title mismatch: '{matched_title}' vs '{place_name}'"

def run_enrichment(limit_destinations: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Executes the enrichment pipeline across prioritized destinations.
    """
    cache = load_cache()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Priority selection:
    # 1. Famous destinations (is_famous = 1)
    # 2. Destinations with high review counts or featured in circuits
    # 3. Representative selection across Indian states
    query = """
    SELECT id, name, state, category, review_count, is_famous, image_url, summary
    FROM destinations_master
    WHERE (summary IS NULL OR summary = '')
    ORDER BY is_famous DESC, review_count DESC
    """
    if limit_destinations:
        query += f" LIMIT {limit_destinations}"

    c.execute(query)
    rows = c.fetchall()
    print(f"Selected {len(rows)} prioritized destinations for research & enrichment.")

    enrichment_records = []

    for idx, row in enumerate(rows):
        dest_id, name, state, category, review_count, is_famous, cur_img, cur_sum = row
        cache_key = f"{dest_id}_{name}_{state}"
        
        # Check Cache
        cached = cache.get(cache_key)
        if cached:
            wiki_data = cached
        else:
            print(f"[{idx+1}/{len(rows)}] Querying Wikipedia for: {name} ({state})...")
            wiki_data = get_wikipedia_data(name, state)
            time.sleep(0.5)

            # If no image found on Wikipedia page, try Commons search
            if wiki_data and not wiki_data.get("image_url"):
                print(f"   -> No page image on Wikipedia. Trying Wikimedia Commons...")
                commons_data = get_wikimedia_commons_image(name, state)
                time.sleep(0.5)
                if commons_data and commons_data.get("image_url"):
                    wiki_data["image_url"] = commons_data["image_url"]
                    wiki_data["source"] = "wikimedia_commons"
                    wiki_data["commons_title"] = commons_data.get("commons_title")

            if wiki_data:
                cache[cache_key] = wiki_data
                save_cache(cache)

        # Evaluate match
        matched_title = wiki_data.get("wiki_title", "") if wiki_data else ""
        summary = wiki_data.get("summary", "") if wiki_data else ""
        image_url = wiki_data.get("image_url", "") if wiki_data else ""
        source = wiki_data.get("source", "placeholder") if wiki_data and image_url else "placeholder"

        # Verification step
        is_verified, reason = verify_title_match(name, state, matched_title)
        
        # Manual known exception handling for famous monuments
        if not is_verified and is_famous:
            # If it's a known famous place, check if title is a legitimate alternate architectural name
            if any(term in matched_title.lower() for term in ["mahal", "fort", "temple", "minar", "palace", "memorial", "lake", "falls"]):
                is_verified = True
                reason = "Verified famous alternate architectural name"

        needs_manual = False if (is_verified and image_url) else True
        if needs_manual:
            source = "placeholder"
            image_url = ""

        record = {
            "id": dest_id,
            "place_name": name,
            "state": state,
            "matched_wiki_title": matched_title,
            "image_url": image_url,
            "image_source": source,
            "summary": summary if is_verified else "",
            "summary_preview": summary[:120] + "..." if len(summary) > 120 else summary,
            "verified": is_verified,
            "needs_manual_photo": needs_manual,
            "verification_reason": reason
        }
        enrichment_records.append(record)

    conn.close()

    # Write Review CSV
    CSV_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "id", "place_name", "state", "matched_wiki_title", "image_url",
            "image_source", "summary_preview", "verified", "needs_manual_photo", "verification_reason"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in enrichment_records:
            row_to_write = {k: r[k] for k in fieldnames}
            writer.writerow(row_to_write)

    print(f"\nWrote {len(enrichment_records)} records to manual verification CSV: {CSV_FILE}")
    return enrichment_records

def commit_verified_enrichment(records: List[Dict[str, Any]]) -> Tuple[int, int]:
    """
    Commits verified records to SQLite destinations_master.
    Also resets any non-verified destinations sharing duplicate bulk photos
    to 'placeholder' and needs_manual_photo = 1.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    now_iso = datetime.now(timezone.utc).isoformat()
    verified_count = 0
    placeholder_count = 0

    for r in records:
        dest_id = r["id"]
        if r["verified"] and r["image_url"]:
            # Commit verified authentic photo + summary
            c.execute("""
                UPDATE destinations_master
                SET summary = ?,
                    image_url = ?,
                    image_source = ?,
                    needs_manual_photo = 0,
                    photo_verified_at = ?
                WHERE id = ?
            """, (r["summary"], r["image_url"], r["image_source"], now_iso, dest_id))
            verified_count += 1
        else:
            # Clean placeholder fallback
            c.execute("""
                UPDATE destinations_master
                SET summary = ?,
                    image_source = 'placeholder',
                    needs_manual_photo = 1,
                    photo_verified_at = NULL
                WHERE id = ?
            """, (r["summary"] if r["verified"] else None, dest_id))
            placeholder_count += 1

    # Reset any unverified destinations with repetitive bulk images to placeholder
    c.execute("""
        UPDATE destinations_master
        SET image_source = 'placeholder',
            needs_manual_photo = 1
        WHERE photo_verified_at IS NULL
    """)

    conn.commit()
    conn.close()

    print(f"Database commit completed: {verified_count} verified photos updated, {placeholder_count} flagged for manual photo.")
    return verified_count, placeholder_count

if __name__ == "__main__":
    records = run_enrichment(limit_destinations=100)
    commit_verified_enrichment(records)
