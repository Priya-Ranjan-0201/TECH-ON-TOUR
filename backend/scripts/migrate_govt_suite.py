"""
Migration script for Government Intelligence Suite.
Applies:
1. crowd_status and resource_recommendation columns to footfall_forecasts.
2. investment_recommendations table.
3. flow_redistribution table.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "travelsathi_dev.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Check footfall_forecasts columns
    cursor.execute("PRAGMA table_info(footfall_forecasts)")
    cols = [col[1] for col in cursor.fetchall()]

    if "crowd_status" not in cols:
        print("Adding column 'crowd_status' to footfall_forecasts...")
        cursor.execute("ALTER TABLE footfall_forecasts ADD COLUMN crowd_status VARCHAR(20)")
    else:
        print("Column 'crowd_status' already exists in footfall_forecasts.")

    if "resource_recommendation" not in cols:
        print("Adding column 'resource_recommendation' to footfall_forecasts...")
        cursor.execute("ALTER TABLE footfall_forecasts ADD COLUMN resource_recommendation JSON")
    else:
        print("Column 'resource_recommendation' already exists in footfall_forecasts.")

    # 2. investment_recommendations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investment_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_crore FLOAT NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        rank INTEGER NOT NULL,
        expected_tourist_increase_pct FLOAT NOT NULL,
        expected_spend_crore FLOAT NOT NULL,
        expected_jobs INTEGER NOT NULL,
        infra_priority VARCHAR(100) NOT NULL,
        tourism_potential FLOAT NOT NULL,
        roi_label VARCHAR(100) NOT NULL,
        top_factors JSON NOT NULL,
        recommended_actions JSON NOT NULL,
        data_label VARCHAR(50) DEFAULT 'AI Recommendation',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    print("Table 'investment_recommendations' verified/created.")

    # 3. flow_redistribution table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS flow_redistribution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        primary_destination_id INTEGER NOT NULL REFERENCES destinations_master(id),
        alternative_destination_id INTEGER NOT NULL REFERENCES destinations_master(id),
        current_flow_pct FLOAT NOT NULL,
        recommended_flow_pct FLOAT NOT NULL,
        distance_km FLOAT NOT NULL,
        expected_economic_impact_crore FLOAT NOT NULL,
        data_label VARCHAR(50) DEFAULT 'AI Recommendation',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    print("Table 'flow_redistribution' verified/created.")

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
