import sqlite3
from pathlib import Path

db_path = Path("travelsathi_dev.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("PRAGMA table_info(destinations_master)")
existing_cols = [col[1] for col in c.fetchall()]
print("Existing cols:", existing_cols)

cols_to_add = [
    ("summary", "TEXT"),
    ("image_source", "VARCHAR(50) DEFAULT 'placeholder'"),
    ("needs_manual_photo", "BOOLEAN DEFAULT 0"),
    ("photo_verified_at", "TIMESTAMP")
]

for col_name, col_def in cols_to_add:
    if col_name not in existing_cols:
        sql = f"ALTER TABLE destinations_master ADD COLUMN {col_name} {col_def}"
        print(f"Executing: {sql}")
        c.execute(sql)
    else:
        print(f"Column {col_name} already exists.")

conn.commit()

c.execute("PRAGMA table_info(destinations_master)")
final_cols = [col[1] for col in c.fetchall()]
print("Final cols:", final_cols)
conn.close()
print("Migration completed successfully.")
