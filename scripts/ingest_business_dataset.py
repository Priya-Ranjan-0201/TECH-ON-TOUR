"""
TravelSathi — Ingest Tourism Business & Proximity Datasets into SQLite Database
Uses dynamic schema-aware mapping to guarantee 100% column parity.
"""

import os
import csv
import sqlite3
from pathlib import Path

DB_PATH = Path("backend/travelsathi_dev.db")
if not DB_PATH.exists():
    DB_PATH = Path("travelsathi_dev.db")

CSV_BUSINESSES = Path("data/business/TRAVELSATHI_TOURISM_BUSINESSES_INDIA.csv")
CSV_MAPPINGS = Path("data/business/TRAVELSATHI_DESTINATION_BUSINESS_MAPPING.csv")

def ingest():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("PRAGMA journal_mode = WAL;")
    c.execute("PRAGMA synchronous = NORMAL;")

    # 1. Read Businesses CSV and create table dynamically matching header
    c.execute("DROP TABLE IF EXISTS tourism_businesses;")
    with open(CSV_BUSINESSES, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        b_header = next(reader)
    
    col_defs = []
    for col in b_header:
        if col in ("latitude", "longitude", "distance_from_tourist_place_km", "rating", "price_min_inr", "price_max_inr"):
            col_defs.append(f'"{col}" FLOAT')
        elif col in ("estimated_travel_time_minutes", "review_count"):
            col_defs.append(f'"{col}" INTEGER')
        elif col in ("24_hours", "vegetarian", "vegan", "jain_food", "halal_food", "family_friendly", "couple_friendly", "solo_friendly", "children_friendly", "elderly_friendly", "wheelchair_accessible", "parking", "wifi", "air_conditioning", "restaurant_available", "room_service", "breakfast", "pet_friendly", "laundry", "airport_transfer", "eco_friendly", "local_owned", "verified_business"):
            col_defs.append(f'"{col}" BOOLEAN')
        elif col == "business_id":
            col_defs.append(f'"{col}" VARCHAR(36) PRIMARY KEY')
        else:
            col_defs.append(f'"{col}" TEXT')

    c.execute(f"CREATE TABLE IF NOT EXISTS tourism_businesses ({', '.join(col_defs)});")

    c.execute("CREATE INDEX IF NOT EXISTS idx_tb_place ON tourism_businesses(tourist_place_id);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tb_type ON tourism_businesses(business_type);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tb_cat ON tourism_businesses(business_category);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tb_state ON tourism_businesses(state);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tb_dist ON tourism_businesses(distance_from_tourist_place_km);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tb_rating ON tourism_businesses(rating);")

    # Ingest businesses
    print(f"Reading businesses from {CSV_BUSINESSES}...")
    with open(CSV_BUSINESSES, "r", encoding="utf-8") as f:
        dict_reader = csv.DictReader(f)
        b_rows = []
        for r in dict_reader:
            row_vals = []
            for col in b_header:
                val = r[col]
                if val == "TRUE":
                    row_vals.append(1)
                elif val == "FALSE":
                    row_vals.append(0)
                elif col in ("latitude", "longitude", "distance_from_tourist_place_km", "rating", "price_min_inr", "price_max_inr"):
                    row_vals.append(float(val) if val not in ("Not Available", "") else 0.0)
                elif col in ("estimated_travel_time_minutes", "review_count"):
                    row_vals.append(int(val) if val not in ("Not Available", "") else 0)
                else:
                    row_vals.append(val)
            b_rows.append(row_vals)

    c.execute("DELETE FROM tourism_businesses;")
    q_marks = ",".join(["?"] * len(b_header))
    quoted_cols = [f'"{col}"' for col in b_header]
    c.executemany(f"INSERT OR REPLACE INTO tourism_businesses ({','.join(quoted_cols)}) VALUES ({q_marks});", b_rows)
    print(f"Ingested {len(b_rows):,} tourism businesses into SQLite database.")

    # 2. Ingest mappings
    c.execute("""
    CREATE TABLE IF NOT EXISTS destination_business_mappings (
        mapping_id VARCHAR(36) PRIMARY KEY,
        tourist_place_id VARCHAR(36) NOT NULL,
        business_id VARCHAR(36) NOT NULL,
        business_type VARCHAR(50) NOT NULL,
        distance_km FLOAT NOT NULL,
        estimated_travel_time_minutes INTEGER DEFAULT 10,
        relationship_type VARCHAR(30) NOT NULL,
        priority INTEGER DEFAULT 3
    );
    """)

    c.execute("CREATE INDEX IF NOT EXISTS idx_map_dest ON destination_business_mappings(tourist_place_id);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_map_biz ON destination_business_mappings(business_id);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_map_dist ON destination_business_mappings(distance_km);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_map_prio ON destination_business_mappings(priority);")

    print(f"Reading mappings from {CSV_MAPPINGS}...")
    with open(CSV_MAPPINGS, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        m_rows = []
        for r in reader:
            m_rows.append((
                r["mapping_id"], r["tourist_place_id"], r["business_id"], r["business_type"],
                float(r["distance_km"]), int(r["estimated_travel_time_minutes"]),
                r["relationship_type"], int(r["priority"])
            ))

    c.execute("DELETE FROM destination_business_mappings;")
    c.executemany("""
        INSERT OR REPLACE INTO destination_business_mappings VALUES (?,?,?,?,?,?,?,?);
    """, m_rows)
    print(f"Ingested {len(m_rows):,} proximity mappings into SQLite database.")

    conn.commit()
    conn.close()
    print("Database Ingestion & Indexing Complete!")

if __name__ == "__main__":
    ingest()
