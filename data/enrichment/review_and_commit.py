import csv
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

csv_path = Path("data/enrichment/manual_review_enrichment.csv")
db_path = Path("backend/travelsathi_dev.db")

with open(csv_path, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

# Spot-check & manual curation corrections
for r in rows:
    # 1. Fix Charminar (row id 9400)
    if r["id"] == "9400":
        r["matched_wiki_title"] = "Charminar"
        r["image_url"] = "https://upload.wikimedia.org/wikipedia/commons/7/71/Charminar_Hyderabad_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original"
        r["image_source"] = "wikipedia"
        r["summary_preview"] = "The Charminar (lit. four minarets) is a monument located in Hyderabad, Telangana, India. Constructed in 1591..."
        r["verified"] = "True"
        r["needs_manual_photo"] = "False"
        r["verification_reason"] = "Curated direct monument match"

    # 2. Reject diagrams / maps / non-photo svgs
    img = r.get("image_url", "").lower()
    if ".svg" in img or "map" in img or "drawing" in img:
        r["image_url"] = ""
        r["image_source"] = "placeholder"
        r["needs_manual_photo"] = "True"
        r["verification_reason"] = "Diagram/map rejected in favor of Theme 1 placeholder"

# Write back curated CSV
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

# Commit to DB
conn = sqlite3.connect(db_path)
c = conn.cursor()
now_iso = datetime.now(timezone.utc).isoformat()

for r in rows:
    dest_id = int(r["id"])
    is_verified = r["verified"] == "True"
    needs_manual = r["needs_manual_photo"] == "True"
    img_url = r["image_url"]
    img_source = r["image_source"]

    if is_verified and not needs_manual and img_url:
        c.execute("""
            UPDATE destinations_master
            SET image_url = ?,
                image_source = ?,
                needs_manual_photo = 0,
                photo_verified_at = ?
            WHERE id = ?
        """, (img_url, img_source, now_iso, dest_id))
    else:
        c.execute("""
            UPDATE destinations_master
            SET image_source = 'placeholder',
                needs_manual_photo = 1,
                photo_verified_at = NULL
            WHERE id = ?
        """, (dest_id,))

# Ensure all other unverified places in the database are set to placeholder
c.execute("""
    UPDATE destinations_master
    SET image_source = 'placeholder',
        needs_manual_photo = 1
    WHERE photo_verified_at IS NULL
""")

conn.commit()

c.execute("SELECT count(*) FROM destinations_master WHERE image_source = 'wikipedia'")
wiki_count = c.fetchone()[0]
c.execute("SELECT count(*) FROM destinations_master WHERE image_source = 'wikimedia_commons'")
commons_count = c.fetchone()[0]
c.execute("SELECT count(*) FROM destinations_master WHERE needs_manual_photo = 1")
placeholder_count = c.fetchone()[0]
conn.close()

print(f"Manual review pass committed! Wikipedia verified photos: {wiki_count}, Commons verified: {commons_count}, Placeholder/Manual photo rows: {placeholder_count}")
