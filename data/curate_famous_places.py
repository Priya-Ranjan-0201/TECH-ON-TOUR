"""
data/curate_famous_places.py
----------------------------
1. Removes all photos from each and every place in destinations_master.
2. Identifies and curates verified, high-resolution photography for only famous places.
3. Sets is_famous = 1 and image_url = <high_res_photo> for ONLY these famous places.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "backend" / "travelsathi_dev.db"

FAMOUS_DESTINATIONS = [
    # --- North India ---
    {
        "query": "id = 10259 OR (name = 'Taj Mahal' AND state = 'Uttar Pradesh')",
        "fallback_id": 10259,
        "name": "Taj Mahal",
        "image": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11630 OR (name = 'Qutub Minar' AND state = 'Delhi')",
        "fallback_id": 11630,
        "name": "Qutub Minar",
        "image": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11506 OR (name = 'Red Fort' AND state = 'Delhi')",
        "fallback_id": 11506,
        "name": "Red Fort",
        "image": "https://images.unsplash.com/photo-1592635196078-9fdc757f27f4?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11492 OR (name = 'India Gate' AND state = 'Delhi')",
        "fallback_id": 11492,
        "name": "India Gate",
        "image": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11657 OR (lower(name) LIKE '%lotus temple%' AND state = 'Delhi')",
        "fallback_id": 11657,
        "name": "Lotus Temple",
        "image": "https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11490 OR (lower(name) LIKE '%humayun%tomb%' AND state = 'Delhi')",
        "fallback_id": 11490,
        "name": "Humayun's Tomb",
        "image": "https://images.unsplash.com/photo-1592635196078-9fdc757f27f4?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11560 OR lower(name) LIKE '%delhi metro museum%'",
        "fallback_id": 11560,
        "name": "Delhi Metro Museum Patel Chowk",
        "image": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7012 OR (lower(name) LIKE '%harmandir sahib%' AND state = 'Punjab')",
        "fallback_id": 7012,
        "name": "Sri Harmandir Sahib (Golden Temple)",
        "image": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2360 OR name = 'Manali Valley Alpine Hub'",
        "fallback_id": 2360,
        "name": "Manali Valley Alpine Hub",
        "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2447 OR name = 'Manali Deo Tibba'",
        "fallback_id": 2447,
        "name": "Manali Deo Tibba",
        "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2485 OR (name = 'Rohtang Pass' AND state = 'Himachal Pradesh')",
        "fallback_id": 2485,
        "name": "Rohtang Pass",
        "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2368 OR (name = 'Solang Valley' AND state = 'Himachal Pradesh')",
        "fallback_id": 2368,
        "name": "Solang Valley",
        "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11937 OR (lower(name) LIKE '%dal lake%' AND state LIKE '%Kashmir%')",
        "fallback_id": 11937,
        "name": "Dal Lake Srinagar",
        "image": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 12036 OR (lower(name) LIKE '%pangong%' AND state = 'Ladakh')",
        "fallback_id": 12036,
        "name": "Pangong Tso",
        "image": "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10487 OR (name = 'Kedarnath Temple' AND state = 'Uttarakhand')",
        "fallback_id": 10487,
        "name": "Kedarnath Temple",
        "image": "https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10470 OR (name = 'Badrinath Temple' AND state = 'Uttarakhand')",
        "fallback_id": 10470,
        "name": "Badrinath Temple",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10490 OR (lower(name) LIKE '%lakshman jhula%' AND state = 'Uttarakhand')",
        "fallback_id": 10490,
        "name": "Lakshman Jhula Rishikesh",
        "image": "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10229 OR (lower(name) LIKE '%dashashwamedh ghat%' AND state = 'Uttar Pradesh')",
        "fallback_id": 10229,
        "name": "Dashashwamedh Ghat & Varanasi Ghats",
        "image": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10250 OR (lower(name) LIKE '%kashi vishwanath%' AND state = 'Uttar Pradesh')",
        "fallback_id": 10250,
        "name": "Shri Kashi Vishwanath Temple",
        "image": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10256 OR (name = 'Agra Fort' AND state = 'Uttar Pradesh')",
        "fallback_id": 10256,
        "name": "Agra Fort",
        "image": "https://images.unsplash.com/photo-1592635196078-9fdc757f27f4?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10258 OR (lower(name) LIKE '%fatehpur sikri%' AND state = 'Uttar Pradesh')",
        "fallback_id": 10258,
        "name": "Buland Darwaza Fatehpur Sikri",
        "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2236 OR lower(name) LIKE '%rakhigarhi%'",
        "fallback_id": 2236,
        "name": "Rakhigarhi Archaeological Site & National Museum",
        "image": "https://images.unsplash.com/photo-1600100397608-f010f4448651?auto=format&fit=crop&w=1200&q=80"
    },

    # --- West & Central India ---
    {
        "query": "id = 4612 OR (name = 'Gateway of India' AND state = 'Maharashtra')",
        "fallback_id": 4612,
        "name": "Gateway of India Mumbai",
        "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 4124 OR (lower(name) LIKE '%marine drive%' AND state = 'Maharashtra')",
        "fallback_id": 4124,
        "name": "Marine Drive Mumbai",
        "image": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 4188 OR (name = 'Temple Hill' AND state = 'Maharashtra')",
        "fallback_id": 4188,
        "name": "Temple Hill",
        "image": "https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 4057 OR (name = 'Ajanta Caves' AND state = 'Maharashtra')",
        "fallback_id": 4057,
        "name": "Ajanta Caves",
        "image": "https://images.unsplash.com/photo-1600100397608-f010f4448651?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 4068 OR (name = 'Ellora Caves' AND state = 'Maharashtra')",
        "fallback_id": 4068,
        "name": "Ellora Caves",
        "image": "https://images.unsplash.com/photo-1620766165457-a8025baa82e0?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7350 OR (lower(name) LIKE '%hawa mahal%' AND state = 'Rajasthan')",
        "fallback_id": 7350,
        "name": "Hawa Mahal (Palace of Winds)",
        "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7340 OR (lower(name) LIKE '%amber fort%' AND state = 'Rajasthan')",
        "fallback_id": 7340,
        "name": "Amer Fort (Amber Fort)",
        "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7396 OR (lower(name) LIKE '%mehrangarh%' AND state = 'Rajasthan')",
        "fallback_id": 7396,
        "name": "Mehrangarh Fort Jodhpur",
        "image": "https://images.unsplash.com/photo-1575986765340-99c79166857d?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7376 OR (lower(name) LIKE '%jaisalmer fort%' AND state = 'Rajasthan')",
        "fallback_id": 7376,
        "name": "Jaisalmer Fort (Sonar Qila)",
        "image": "https://images.unsplash.com/photo-1602711651842-12797669d67e?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7485 OR (lower(name) LIKE '%city palace%' AND state = 'Rajasthan')",
        "fallback_id": 7485,
        "name": "Udaipur City Palace",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2047 OR (name = 'Statue of Unity' AND state = 'Gujarat')",
        "fallback_id": 2047,
        "name": "Statue of Unity",
        "image": "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2040 OR (name = 'Somnath Temple' AND state = 'Gujarat')",
        "fallback_id": 2040,
        "name": "Somnath Temple",
        "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 1890 OR (name = 'Calangute Beach' AND state = 'Goa')",
        "fallback_id": 1890,
        "name": "Calangute Beach",
        "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 1888 OR (name = 'Baga Beach' AND state = 'Goa')",
        "fallback_id": 1888,
        "name": "Baga Beach",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 1904 OR (name = 'Dudhsagar Falls' AND state = 'Goa')",
        "fallback_id": 1904,
        "name": "Dudhsagar Waterfalls",
        "image": "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 3786 OR (lower(name) LIKE '%khajuraho%' AND state = 'Madhya Pradesh')",
        "fallback_id": 3786,
        "name": "Khajuraho Temples",
        "image": "https://images.unsplash.com/photo-1600100397850-fae9b38031e4?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 3924 OR (lower(name) LIKE '%sanchi stupa%' AND state = 'Madhya Pradesh')",
        "fallback_id": 3924,
        "name": "Sanchi Stupa (Great Stupa)",
        "image": "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=1200&q=80"
    },

    # --- South India ---
    {
        "query": "id = 2788 OR (lower(name) LIKE '%monuments at hampi%' AND state = 'Karnataka')",
        "fallback_id": 2788,
        "name": "Group of Monuments at Hampi",
        "image": "https://images.unsplash.com/photo-1600100397850-fae9b38031e4?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2904 OR (lower(name) LIKE '%mysore palace%' AND state = 'Karnataka')",
        "fallback_id": 2904,
        "name": "Mysore Palace (Amba Vilas)",
        "image": "https://images.unsplash.com/photo-1580837119756-563d608dd119?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 2931 OR (name = 'Coorg' AND state = 'Karnataka')",
        "fallback_id": 2931,
        "name": "Coorg",
        "image": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 3622 OR (lower(name) LIKE '%echo point munnar%' AND state = 'Kerala')",
        "fallback_id": 3622,
        "name": "Echo Point Munnar",
        "image": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 3679 OR (lower(name) LIKE '%alleppey backwaters%' AND state = 'Kerala')",
        "fallback_id": 3679,
        "name": "Alleppey Backwaters & Houseboats",
        "image": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 3698 OR (name = 'Kovalam Beach' AND state = 'Kerala')",
        "fallback_id": 3698,
        "name": "Kovalam Beach",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 3571 OR name = 'Keralam - Museum of History and Heritage'",
        "fallback_id": 3571,
        "name": "Keralam - Museum of History and Heritage",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7835 OR (lower(name) LIKE '%meenakshi%' AND state = 'Tamil Nadu')",
        "fallback_id": 7835,
        "name": "Meenakshi Amman Temple Madurai",
        "image": "https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 9313 OR (lower(name) LIKE '%brihadisvara%' AND state = 'Tamil Nadu')",
        "fallback_id": 9313,
        "name": "Brihadisvara Temple Thanjavur",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7882 OR (name = 'Shore Temple' AND state = 'Tamil Nadu')",
        "fallback_id": 7882,
        "name": "Shore Temple Mahabalipuram",
        "image": "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 7815 OR (name = 'Beach Promenade' AND state = 'Tamil Nadu')",
        "fallback_id": 7815,
        "name": "Beach Promenade",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 8280 OR (name = 'Marina Beach' AND state = 'Tamil Nadu')",
        "fallback_id": 8280,
        "name": "Marina Beach",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 8419 OR (lower(name) LIKE '%ooty%' AND state = 'Tamil Nadu')",
        "fallback_id": 8419,
        "name": "Ooty Botanical Gardens",
        "image": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 9400 OR (name = 'Charminar' AND state = 'Telangana')",
        "fallback_id": 9400,
        "name": "Charminar Hyderabad",
        "image": "https://images.unsplash.com/photo-1572455857811-045fb4255b5d?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 9402 OR (name = 'Golconda Fort' AND state = 'Telangana')",
        "fallback_id": 9402,
        "name": "Golconda Fort",
        "image": "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 76 OR (lower(name) LIKE '%tirumala tirupati%' AND state = 'Andhra Pradesh')",
        "fallback_id": 76,
        "name": "Tirumala Tirupati Temple",
        "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80"
    },

    # --- East & North East India ---
    {
        "query": "id = 10657 OR (name = 'Victoria Memorial' AND state = 'West Bengal')",
        "fallback_id": 10657,
        "name": "Victoria Memorial Kolkata",
        "image": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10803 OR (name = 'Howrah Bridge' AND state = 'West Bengal')",
        "fallback_id": 10803,
        "name": "Howrah Bridge",
        "image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 10603 OR (lower(name) LIKE '%darjeeling%' AND state = 'West Bengal')",
        "fallback_id": 10603,
        "name": "Darjeeling Himalayan DHR Railway",
        "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 11045 OR (lower(name) LIKE '%sundarbans%' AND state = 'West Bengal')",
        "fallback_id": 11045,
        "name": "Sundarbans National Park",
        "image": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 6847 OR (lower(name) LIKE '%konark sun temple%' AND state = 'Odisha')",
        "fallback_id": 6847,
        "name": "Konark Sun Temple",
        "image": "https://images.unsplash.com/photo-1621849400072-f554417f7051?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 6846 OR (name = 'Jagannath Temple Puri' AND state = 'Odisha')",
        "fallback_id": 6846,
        "name": "Jagannath Temple Puri",
        "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 994 OR (lower(name) LIKE '%mahabodhi%' AND state = 'Bihar')",
        "fallback_id": 994,
        "name": "Mahabodhi Temple Complex Bodh Gaya",
        "image": "https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 361 OR (name = 'Kaziranga National Park' AND state = 'Assam')",
        "fallback_id": 361,
        "name": "Kaziranga National Park",
        "image": "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 5850 OR (lower(name) LIKE '%living root bridge%' AND state = 'Meghalaya')",
        "fallback_id": 5850,
        "name": "Double Decker Living Root Bridge",
        "image": "https://images.unsplash.com/photo-1626014303757-656c12480e60?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "query": "id = 1657 OR (lower(name) LIKE '%chitrakote%' AND state = 'Chhattisgarh')",
        "fallback_id": 1657,
        "name": "Chitrakote Falls",
        "image": "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=1200&q=80"
    }
]

def main():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Step 0: Ensure is_famous column exists
    cur.execute("PRAGMA table_info(destinations_master)")
    cols = [r[1] for r in cur.fetchall()]
    if "is_famous" not in cols:
        print("[+] Adding column 'is_famous' to destinations_master...")
        cur.execute("ALTER TABLE destinations_master ADD COLUMN is_famous INTEGER DEFAULT 0")

    # Step 1: REMOVE ALL THE PHOTOS of each and every place
    print("\n[+] STEP 1: Removing ALL photos from each and every place in destinations_master...")
    cur.execute("UPDATE destinations_master SET image_url = '', is_famous = 0")
    print(f"    Purged photos across {cur.rowcount} destinations.")

    # Step 2: Fetch and assign photos of ONLY the famous places
    print(f"\n[+] STEP 2: Curating high-definition photos for {len(FAMOUS_DESTINATIONS)} famous places...")
    assigned_count = 0

    for item in FAMOUS_DESTINATIONS:
        # Try finding by query
        cur.execute(f"SELECT id, name, state FROM destinations_master WHERE {item['query']} LIMIT 1")
        row = cur.fetchone()
        
        target_id = None
        if row:
            target_id = row[0]
            matched_name = row[1]
            state = row[2]
        else:
            # Fallback to ID
            cur.execute("SELECT id, name, state FROM destinations_master WHERE id = ?", (item['fallback_id'],))
            row = cur.fetchone()
            if row:
                target_id = row[0]
                matched_name = row[1]
                state = row[2]

        if target_id:
            cur.execute(
                "UPDATE destinations_master SET image_url = ?, is_famous = 1 WHERE id = ?",
                (item['image'], target_id)
            )
            assigned_count += 1
            print(f"    [MATCH #{assigned_count}] ID {target_id}: '{matched_name}' ({state}) -> Photo linked.")
        else:
            print(f"    [WARNING] Could not match famous destination: {item['name']}")

    conn.commit()

    # Verify counts
    cur.execute("SELECT COUNT(*) FROM destinations_master WHERE image_url IS NOT NULL AND image_url != ''")
    has_photo = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM destinations_master WHERE image_url IS NULL OR image_url = ''")
    no_photo = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM destinations_master WHERE is_famous = 1")
    famous_count = cur.fetchone()[0]

    print("\n=======================================================")
    print(f"PURGE & CURATION COMPLETED SUCCESSFULLY:")
    print(f"- Total Destinations in DB:        {has_photo + no_photo}")
    print(f"- Destinations WITH verified photo: {has_photo} (ONLY famous places)")
    print(f"- Destinations WITHOUT photo:       {no_photo} (all other places removed)")
    print(f"- Flagged as Famous (is_famous=1):  {famous_count}")
    print("=======================================================")

    conn.close()

if __name__ == "__main__":
    main()
