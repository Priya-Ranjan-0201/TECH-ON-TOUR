import sqlite3
from pathlib import Path

DB_PATH = Path("backend/travelsathi_dev.db")

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        SELECT image_url, GROUP_CONCAT(id)
        FROM destinations_master
        WHERE image_url IS NOT NULL AND image_url != ''
        GROUP BY image_url
        HAVING count(DISTINCT id) > 1
    """)
    dup_rows = c.fetchall()
    print(f"Total duplicate groups: {len(dup_rows)}")

    secondary_ids_to_clear = []
    for url, id_str in dup_rows:
        ids = sorted([int(x) for x in id_str.split(',')])
        primary_id = ids[0]
        secondary = ids[1:]
        secondary_ids_to_clear.extend(secondary)

    print(f"Total secondary IDs to set to placeholder: {len(secondary_ids_to_clear)}")

    chunk_size = 500
    for i in range(0, len(secondary_ids_to_clear), chunk_size):
        chunk = secondary_ids_to_clear[i:i+chunk_size]
        placeholders = ','.join(['?'] * len(chunk))
        c.execute(f"""
            UPDATE destinations_master
            SET image_url = '', image_source = 'placeholder', needs_manual_photo = 1
            WHERE id IN ({placeholders})
        """, chunk)

    conn.commit()

    c.execute("""
        SELECT image_url, count(DISTINCT id)
        FROM destinations_master
        WHERE image_url IS NOT NULL AND image_url != ''
        GROUP BY image_url
        HAVING count(DISTINCT id) > 1
    """)
    remaining = c.fetchall()
    print(f"Remaining duplicates (image_url != ''): {len(remaining)}")
    conn.close()

if __name__ == "__main__":
    main()
