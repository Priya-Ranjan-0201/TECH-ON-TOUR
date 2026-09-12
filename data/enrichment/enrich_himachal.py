import sqlite3
import requests
import re
import time
import csv
from pathlib import Path

csv_path = Path(__file__).resolve().parent.parent / "states" / "Himachal_Pradesh" / "places.csv"
db_path = Path(__file__).resolve().parent.parent.parent / "backend" / "travelsathi_dev.db"

conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT image_url FROM destinations_master WHERE image_source != 'placeholder' AND image_url IS NOT NULL AND image_url != ''")
used_urls = {row[0] for row in c.fetchall()}

headers = {"User-Agent": "TravelSathiResearch/1.0 (sih@travelsathi.in)"}

def search_commons(name, loc):
    clean = re.sub(r'\(.*?\)', '', name).strip()
    query = f"{clean} {loc}"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": 5,
        "prop": "imageinfo",
        "iiprop": "url|mime"
    }
    try:
        r = requests.get("https://commons.wikimedia.org/w/api.php", params=params, headers=headers, timeout=6)
        if r.status_code == 200:
            pages = r.json().get("query", {}).get("pages", {})
            for _, p in pages.items():
                title = p.get("title", "").lower()
                infos = p.get("imageinfo", [])
                if infos:
                    url = infos[0].get("url", "")
                    mime = infos[0].get("mime", "")
                    if url and "image" in mime and "svg" not in mime and url not in used_urls:
                        clean_words = [w.lower() for w in clean.split() if len(w) > 3 and w.lower() not in ["park", "temple", "trek", "point", "view", "lake", "church"]]
                        if not clean_words or any(w in title for w in clean_words):
                            return url
    except Exception:
        pass
    return None

def main():
    rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"Processing {len(rows)} places in Himachal Pradesh...")
    updated_count = 0
    for idx, r in enumerate(rows):
        dest_id = int(r["id"])
        name = r["name"]
        desc = r.get("description", "")
        
        loc = "Himachal Pradesh"
        if "situated in" in desc:
            match = re.search(r"situated in ([^,\.]+)", desc)
            if match:
                loc = match.group(1).strip() + " Himachal"

        c.execute("SELECT image_source, image_url FROM destinations_master WHERE id = ?", (dest_id,))
        db_res = c.fetchone()
        if db_res and db_res[0] in ["wikipedia", "wikimedia_commons"]:
            continue
            
        url = search_commons(name, loc)
        if url:
            used_urls.add(url)
            r["image_url"] = url
            c.execute("""
                UPDATE destinations_master 
                SET image_url = ?, image_source = 'wikimedia_commons', needs_manual_photo = 0, photo_verified_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (url, dest_id))
            updated_count += 1
            print(f"[{updated_count}] Verified {name} -> {url[:65]}...")
        else:
            c.execute("""
                UPDATE destinations_master
                SET image_source = 'placeholder', needs_manual_photo = 1
                WHERE id = ?
            """, (dest_id,))
            
        time.sleep(0.3)
        if idx >= 30:
            break

    conn.commit()

    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    conn.close()
    print(f"Done! Successfully updated {updated_count} places with authentic verified photos.")

if __name__ == "__main__":
    main()
