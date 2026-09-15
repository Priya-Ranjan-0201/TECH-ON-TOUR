import os
import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "backend" / "travelsathi_dev.db"
EVENTS_DIR = ROOT / "data" / "TRAVELSATHI_EVENTS"

def ingest():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Connecting to database: {DB_PATH}")

    # Create cultural_events table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cultural_events (
        event_id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        official_name TEXT,
        event_type TEXT NOT NULL,
        event_category TEXT NOT NULL,
        sub_category TEXT,
        short_description TEXT,
        full_description TEXT,
        historical_significance TEXT,
        cultural_significance TEXT,
        religious_significance TEXT,
        heritage_status TEXT,
        unesco_status TEXT,
        importance_tier TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT,
        city TEXT NOT NULL,
        venue TEXT,
        locality TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        nearest_major_city TEXT,
        nearest_airport TEXT,
        nearest_railway_station TEXT,
        event_start_date TEXT,
        event_end_date TEXT,
        date_type TEXT,
        recurrence TEXT,
        annual_event INTEGER DEFAULT 1,
        typical_month TEXT,
        typical_start_month TEXT,
        typical_end_month TEXT,
        date_confidence TEXT DEFAULT 'HIGH',
        date_source TEXT,
        official_website TEXT,
        official_source TEXT,
        government_source TEXT,
        source_url TEXT,
        source_name TEXT,
        source_type TEXT,
        data_confidence TEXT DEFAULT 'VERIFIED',
        last_verified TEXT,
        expected_footfall TEXT,
        footfall_source TEXT,
        crowd_level TEXT,
        crowd_forecast_available INTEGER DEFAULT 1,
        transport_advisory TEXT,
        road_advisory TEXT,
        rail_advisory TEXT,
        airport_advisory TEXT,
        public_transport TEXT,
        special_transport TEXT,
        entry_type TEXT DEFAULT 'Free Entry',
        ticket_required INTEGER DEFAULT 0,
        ticket_price TEXT DEFAULT 'Free',
        booking_required INTEGER DEFAULT 0,
        booking_url TEXT,
        best_for TEXT,
        tourist_interests TEXT,
        family_friendly INTEGER DEFAULT 1,
        solo_friendly INTEGER DEFAULT 1,
        senior_friendly INTEGER DEFAULT 1,
        accessibility TEXT,
        photography_allowed INTEGER DEFAULT 1,
        dress_code TEXT,
        cultural_etiquette TEXT,
        local_food TEXT,
        local_crafts TEXT,
        major_activities TEXT,
        event_highlights TEXT,
        nearby_attractions TEXT,
        nearby_hotels TEXT,
        nearby_homestays TEXT,
        nearby_rest_houses TEXT,
        nearby_restaurants TEXT,
        distance_from_major_destination_km REAL DEFAULT 0.0,
        status TEXT DEFAULT 'Active',
        hero_image_url TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_occurrences (
        occurrence_id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        date_status TEXT DEFAULT 'Confirmed',
        official_date INTEGER DEFAULT 1,
        source_url TEXT,
        source_name TEXT,
        last_verified TEXT,
        FOREIGN KEY (event_id) REFERENCES cultural_events(event_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_sources (
        source_id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_url TEXT,
        publication_date TEXT,
        last_checked TEXT,
        source_reliability TEXT DEFAULT 'HIGH',
        information_supported TEXT,
        FOREIGN KEY (event_id) REFERENCES cultural_events(event_id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_state_city ON cultural_events(state, city);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_category ON cultural_events(event_category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_month ON cultural_events(typical_month);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_occurrences_event ON event_occurrences(event_id, year);")

    # Ingest master_events.csv
    master_csv = EVENTS_DIR / "master_events.csv"
    with open(master_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        events_rows = []
        for r in reader:
            events_rows.append((
                r.get("event_id"), r.get("event_name"), r.get("official_name"), r.get("event_type"),
                r.get("event_category"), r.get("sub_category"), r.get("short_description"), r.get("full_description"),
                r.get("historical_significance"), r.get("cultural_significance"), r.get("religious_significance"),
                r.get("heritage_status"), r.get("unesco_status"), r.get("importance_tier"), r.get("state"),
                r.get("district"), r.get("city"), r.get("venue"), r.get("locality"),
                float(r.get("latitude") or 0.0), float(r.get("longitude") or 0.0),
                r.get("nearest_major_city"), r.get("nearest_airport"), r.get("nearest_railway_station"),
                r.get("event_start_date"), r.get("event_end_date"), r.get("date_type"), r.get("recurrence"),
                1 if str(r.get("annual_event")).lower() in ("true", "1") else 0,
                r.get("typical_month"), r.get("typical_start_month"), r.get("typical_end_month"),
                r.get("date_confidence"), r.get("date_source"), r.get("official_website"), r.get("official_source"),
                r.get("government_source"), r.get("source_url"), r.get("source_name"), r.get("source_type"),
                r.get("data_confidence"), r.get("last_verified"), r.get("expected_footfall"), r.get("footfall_source"),
                r.get("crowd_level"), 1 if str(r.get("crowd_forecast_available")).lower() in ("true", "1") else 0,
                r.get("transport_advisory"), r.get("road_advisory"), r.get("rail_advisory"), r.get("airport_advisory"),
                r.get("public_transport"), r.get("special_transport"), r.get("entry_type"),
                1 if str(r.get("ticket_required")).lower() in ("true", "1") else 0,
                r.get("ticket_price"), 1 if str(r.get("booking_required")).lower() in ("true", "1") else 0,
                r.get("booking_url"), r.get("best_for"), r.get("tourist_interests"),
                1 if str(r.get("family_friendly")).lower() in ("true", "1") else 0,
                1 if str(r.get("solo_friendly")).lower() in ("true", "1") else 0,
                1 if str(r.get("senior_friendly")).lower() in ("true", "1") else 0,
                r.get("accessibility"), 1 if str(r.get("photography_allowed")).lower() in ("true", "1") else 0,
                r.get("dress_code"), r.get("cultural_etiquette"), r.get("local_food"), r.get("local_crafts"),
                r.get("major_activities"), r.get("event_highlights"), r.get("nearby_attractions"),
                r.get("nearby_hotels"), r.get("nearby_homestays"), r.get("nearby_rest_houses"), r.get("nearby_restaurants"),
                float(r.get("distance_from_major_destination_km") or 0.0), r.get("status"), r.get("hero_image_url")
            ))

        cursor.executemany("""
        INSERT OR REPLACE INTO cultural_events VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """, events_rows)
        print(f"Ingested {len(events_rows)} cultural events.")

    # Ingest event_occurrences.csv
    occurrences_csv = EVENTS_DIR / "event_occurrences.csv"
    with open(occurrences_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        occ_rows = []
        for r in reader:
            occ_rows.append((
                r.get("occurrence_id"), r.get("event_id"), int(r.get("year")),
                r.get("start_date"), r.get("end_date"), r.get("date_status"),
                1 if str(r.get("official_date")).lower() in ("true", "1") else 0,
                r.get("source_url"), r.get("source_name"), r.get("last_verified")
            ))
        cursor.executemany("""
        INSERT OR REPLACE INTO event_occurrences VALUES (?,?,?,?,?,?,?,?,?,?)
        """, occ_rows)
        print(f"Ingested {len(occ_rows)} event occurrences.")

    # Ingest event_sources.csv
    sources_csv = EVENTS_DIR / "event_sources.csv"
    with open(sources_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        src_rows = []
        for r in reader:
            src_rows.append((
                r.get("source_id"), r.get("event_id"), r.get("source_name"),
                r.get("source_type"), r.get("source_url"), r.get("publication_date"),
                r.get("last_checked"), r.get("source_reliability"), r.get("information_supported")
            ))
        cursor.executemany("""
        INSERT OR REPLACE INTO event_sources VALUES (?,?,?,?,?,?,?,?,?)
        """, src_rows)
        print(f"Ingested {len(src_rows)} event sources.")

    conn.commit()
    conn.close()
    print("Ingestion completed successfully.")

if __name__ == "__main__":
    ingest()
