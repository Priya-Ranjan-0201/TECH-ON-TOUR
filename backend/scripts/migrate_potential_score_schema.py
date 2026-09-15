import sqlite3

def run_migration():
    conn = sqlite3.connect('travelsathi_dev.db')
    c = conn.cursor()

    c.execute('PRAGMA table_info(destinations_master)')
    cols = {row[1] for row in c.fetchall()}

    if 'potential_score' not in cols:
        c.execute('ALTER TABLE destinations_master ADD COLUMN potential_score FLOAT')
    if 'score_breakdown' not in cols:
        c.execute('ALTER TABLE destinations_master ADD COLUMN score_breakdown JSON')
    if 'score_confidence' not in cols:
        c.execute("ALTER TABLE destinations_master ADD COLUMN score_confidence VARCHAR DEFAULT 'full'")
    if 'score_computed_at' not in cols:
        c.execute('ALTER TABLE destinations_master ADD COLUMN score_computed_at TIMESTAMP')
    if 'heritage_status' not in cols:
        c.execute("ALTER TABLE destinations_master ADD COLUMN heritage_status VARCHAR DEFAULT 'unlisted'")

    c.execute('''
    CREATE TABLE IF NOT EXISTS destination_transport (
      destination_id INT PRIMARY KEY REFERENCES destinations_master(id),
      nearest_airport_km FLOAT,
      nearest_railway_km FLOAT,
      nearest_highway_km FLOAT,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    c.execute('''
    CREATE TABLE IF NOT EXISTS destination_monthly_visits (
      destination_id INT REFERENCES destinations_master(id),
      month INT CHECK (month BETWEEN 1 AND 12),
      visit_index FLOAT,
      source VARCHAR,
      PRIMARY KEY (destination_id, month)
    )
    ''')

    conn.commit()
    c.execute('PRAGMA table_info(destinations_master)')
    new_cols = {r[1] for r in c.fetchall()}
    verified = [col for col in ['potential_score', 'score_breakdown', 'score_confidence', 'score_computed_at', 'heritage_status'] if col in new_cols]
    print(f"Migration successful! Verified columns: {verified}")

if __name__ == '__main__':
    run_migration()
