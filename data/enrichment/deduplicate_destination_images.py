import sqlite3
import requests
import time
import re
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent.parent / "backend" / "travelsathi_dev.db"
HEADERS = {"User-Agent": "TravelSathiResearch/1.0 (contact@travelsathi.in)"}

def search_unique(query: str, used_urls: set):
    time.sleep(0.5)
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": 6,
        "prop": "imageinfo",
        "iiprop": "url|mime"
    }
    try:
        r = requests.get("https://commons.wikimedia.org/w/api.php", params=params, headers=HEADERS, timeout=8)
        if r.status_code == 200:
            pages = r.json().get("query", {}).get("pages", {})
            for _, p in pages.items():
                infos = p.get("imageinfo", [])
                if infos:
                    url = infos[0].get("url", "")
                    mime = infos[0].get("mime", "")
                    if url and "svg" not in mime and "pdf" not in mime and url not in used_urls:
                        return url
    except Exception:
        pass
    return None

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, image_url FROM destinations_master WHERE image_url IS NOT NULL AND image_url != '' AND image_source != 'placeholder'")
    all_rows = c.fetchall()
    
    url_to_ids = {}
    for dest_id, url in all_rows:
        url_to_ids.setdefault(url, []).append(dest_id)

    dup_urls = {u: ids for u, ids in url_to_ids.items() if len(ids) > 1}
    print(f"Found {len(dup_urls)} duplicate URLs across {sum(len(ids) for ids in dup_urls.values())} destinations.")
    used_urls = set(url_to_ids.keys())

    fixed = 0
    placeholders = 0

    for url, ids in dup_urls.items():
        primary_id = min(ids)
        secondary_ids = [i for i in ids if i != primary_id]
        
        c.execute("SELECT name, state FROM destinations_master WHERE id = ?", (primary_id,))
        p_row = c.fetchone()
        print(f"Primary ID {primary_id} ({p_row[0]}) retains verified image.")

        for s_id in secondary_ids:
            c.execute("SELECT name, state FROM destinations_master WHERE id = ?", (s_id,))
            s_name, s_state = c.fetchone()
            clean_name = re.sub(r'\(.*?\)', '', s_name).strip()
            unique_url = search_unique(f"{clean_name} {s_state}", used_urls)
            
            if unique_url and unique_url not in used_urls:
                used_urls.add(unique_url)
                c.execute("""
                    UPDATE destinations_master
                    SET image_url = ?, image_source = 'wikimedia_commons', needs_manual_photo = 0, photo_verified_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (unique_url, s_id))
                print(f"  -> ID {s_id} ({s_name}): assigned new unique image.")
                fixed += 1
            else:
                c.execute("""
                    UPDATE destinations_master
                    SET image_url = '', image_source = 'placeholder', needs_manual_photo = 1
                    WHERE id = ?
                """, (s_id,))
                print(f"  -> ID {s_id} ({s_name}): set to Theme 1 placeholder.")
                placeholders += 1

    conn.commit()
    c.execute("""
        SELECT image_url, COUNT(DISTINCT id)
        FROM destinations_master
        WHERE image_url IS NOT NULL AND image_url != '' AND image_source != 'placeholder'
        GROUP BY image_url
        HAVING COUNT(DISTINCT id) > 1
    """)
    dups = c.fetchall()
    conn.close()

    print(f"Finished. Reassigned: {fixed}, Placeholders: {placeholders}, Remaining duplicate URLs: {len(dups)}")
    assert len(dups) == 0, f"Found {len(dups)} remaining duplicates!"
    print("SUCCESS: 0 duplicate non-placeholder images in destinations_master.")

if __name__ == "__main__":
    main()
