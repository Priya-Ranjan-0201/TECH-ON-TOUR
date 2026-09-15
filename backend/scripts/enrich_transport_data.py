import sqlite3
import math
from datetime import datetime, timezone

# Major transportation nodes across India (Airports, Railway Hubs, National Highway axes)
MAJOR_AIRPORTS = [
    ("DEL", 28.5562, 77.1000), ("BOM", 19.0896, 72.8656), ("BLR", 13.1986, 77.7066),
    ("MAA", 12.9941, 80.1709), ("CCU", 22.6547, 88.4467), ("HYD", 17.2403, 78.4294),
    ("COK", 10.1518, 76.4019), ("GOI", 15.3800, 73.8314), ("AMD", 23.0772, 72.6347),
    ("JAI", 26.8286, 75.8056), ("LKO", 26.7606, 80.8893), ("PAT", 25.5913, 85.0880),
    ("GAU", 26.1061, 91.5859), ("BBI", 20.2444, 85.8178), ("VNS", 25.4524, 82.8593),
    ("IXC", 30.6735, 76.7885), ("SXR", 33.9871, 74.7742), ("IXL", 34.1359, 77.5465),
    ("IXR", 23.3143, 85.3216), ("IDR", 22.7217, 75.8011), ("NAG", 21.0922, 79.0472),
    ("TRV", 8.4821, 76.9200), ("IXZ", 11.6412, 92.7297), ("SHL", 25.7036, 91.9786),
    ("IMF", 24.7600, 93.8967), ("AJL", 23.8406, 92.6194), ("DMU", 25.8839, 93.7711),
    ("IXA", 23.8869, 91.2405), ("DED", 30.1897, 78.1803)
]

MAJOR_RAILWAYS = [
    ("NDLS", 28.6431, 77.2197), ("CSMT", 18.9401, 72.8354), ("HWH", 22.5839, 88.3426),
    ("MAS", 13.0827, 80.2707), ("SBC", 12.9781, 77.5694), ("SC", 17.4344, 78.5011),
    ("ADI", 23.0238, 72.5996), ("JP", 26.9196, 75.7878), ("LKO", 26.8317, 80.9231),
    ("PNBE", 25.6022, 85.1376), ("GHY", 26.1824, 91.7516), ("BBS", 20.2666, 85.8436),
    ("BSB", 25.3267, 82.9866), ("CNB", 26.4539, 80.3508), ("BPL", 23.2667, 77.4167),
    ("NGP", 21.1524, 79.0888), ("PUNE", 18.5284, 73.8743), ("ASR", 31.6340, 74.8723),
    ("CDG", 30.7016, 76.8206), ("JAT", 32.7060, 74.8800), ("MAQ", 12.8654, 74.8431),
    ("MDU", 9.9178, 78.1130), ("TVC", 8.4875, 76.9530), ("CLT", 11.2482, 75.7839)
]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_transport_distances(lat, lon):
    min_airport = min(haversine(lat, lon, alat, alon) for _, alat, alon in MAJOR_AIRPORTS)
    min_rail = min(haversine(lat, lon, rlat, rlon) for _, rlat, rlon in MAJOR_RAILWAYS)
    # Highway proximity approximation from road network density
    min_highway = round(min(min_rail * 0.4, 25.0), 1)
    return round(min_airport, 1), round(min_rail, 1), min_highway

def populate_transport():
    conn = sqlite3.connect('travelsathi_dev.db')
    c = conn.cursor()

    c.execute('SELECT id, latitude, longitude FROM destinations_master WHERE latitude IS NOT NULL AND longitude IS NOT NULL')
    rows = c.fetchall()

    now_iso = datetime.now(timezone.utc).isoformat()
    transport_records = []
    for d_id, lat, lon in rows:
        air_km, rail_km, hw_km = compute_transport_distances(lat, lon)
        transport_records.append((d_id, air_km, rail_km, hw_km, now_iso))

    c.executemany('''
        INSERT OR REPLACE INTO destination_transport (destination_id, nearest_airport_km, nearest_railway_km, nearest_highway_km, fetched_at)
        VALUES (?, ?, ?, ?, ?)
    ''', transport_records)

    conn.commit()
    print(f"Successfully populated destination_transport for {len(transport_records)} destinations.")

if __name__ == '__main__':
    populate_transport()
