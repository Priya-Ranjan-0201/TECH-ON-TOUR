"""
backend/scripts/migrate_readiness_schema.py
-------------------------------------------
Migrates the database schema for the Readiness Scoring pipeline:
- Adds readiness_score FLOAT column to destinations_master
- Creates readiness_inputs table with destination_id (FK), 6 factor columns, updated_by, and updated_at
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "travelsathi_dev.db"

def migrate():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Add readiness_score to destinations_master if not exists
    cur.execute("PRAGMA table_info(destinations_master)")
    cols = [r[1] for r in cur.fetchall()]
    if "readiness_score" not in cols:
        print("Adding column 'readiness_score' to destinations_master...")
        cur.execute("ALTER TABLE destinations_master ADD COLUMN readiness_score FLOAT")
    else:
        print("Column 'readiness_score' already exists in destinations_master.")

    # 2. Create readiness_inputs table
    print("Creating table 'readiness_inputs' if not exists...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS readiness_inputs (
        destination_id INT PRIMARY KEY REFERENCES destinations_master(id),
        accommodation FLOAT NOT NULL DEFAULT 0.0,
        transport FLOAT NOT NULL DEFAULT 0.0,
        connectivity FLOAT NOT NULL DEFAULT 0.0,
        food_hospitality FLOAT NOT NULL DEFAULT 0.0,
        medical_safety FLOAT NOT NULL DEFAULT 0.0,
        other_amenities FLOAT NOT NULL DEFAULT 0.0,
        updated_by VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    print("Schema migration completed successfully.")

    # Verify
    cur.execute("PRAGMA table_info(destinations_master)")
    cols = [r[1] for r in cur.fetchall()]
    assert "readiness_score" in cols, "readiness_score column verification failed"

    cur.execute("PRAGMA table_info(readiness_inputs)")
    r_cols = [r[1] for r in cur.fetchall()]
    print(f"Verified readiness_inputs columns: {r_cols}")
    assert "destination_id" in r_cols and "accommodation" in r_cols

    conn.close()

if __name__ == "__main__":
    migrate()
