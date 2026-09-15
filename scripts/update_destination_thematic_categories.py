"""
Update destinations_master.category with precise thematic categories
(Culture, Spiritual, Heritage, Nature, Mountains, Beaches, Wildlife, Adventure, Shopping, Food, Rural, Wellness, Festivals, Hospital, Hotel, Homestay, Restaurant)
"""
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "travelsathi_dev.db"))

def classify(name: str, desc: str, orig: str) -> str:
    orig_clean = (orig or "").lower().strip()
    if orig_clean in ('homestay', 'hotel', 'restaurant', 'hospital', 'clinic', 'resort', 'stay', 'rent_house', 'guest_house', 'lodge', 'cafe', 'dhaba'):
        if orig_clean in ('homestay', 'stay', 'rent_house', 'guest_house'): return 'Homestay'
        if orig_clean in ('hotel', 'resort', 'lodge'): return 'Hotel'
        if orig_clean in ('hospital', 'clinic'): return 'Hospital'
        if orig_clean in ('restaurant', 'cafe', 'dhaba'): return 'Restaurant'
        return orig_clean.capitalize()
    
    text = f"{name} {desc}".lower()
    
    # Essentials / Medical
    if any(k in text for k in ('hospital', 'emergency trauma', 'trauma center', 'medical college hospital', 'clinic', 'dispensary')):
        return 'Hospital'
    if any(k in text for k in ('homestay', 'rent house', 'vacation home', 'cottage stay', 'farmstay', 'eco stay', 'guest house')):
        return 'Homestay'
    if any(k in text for k in ('resort', 'hotel & spa', 'heritage hotel', 'palace hotel', 'tourist lodge', 'lodging')):
        return 'Hotel'
    if any(k in text for k in ('restaurant', 'dhaba', 'bistro', 'bhojanalaya', 'pure veg')):
        return 'Restaurant'
    
    # 1. Culture: Museums, Memorials, Science Cities, Planetariums, Art Galleries, Theatres, Cultural Centers
    if any(k in text for k in (
        'science city', 'planetarium', 'museum', 'gallery', 'memorial', 
        'cultural centre', 'cultural center', 'cultural complex', 'theatre', 'theater', 
        'amphitheatre', 'art centre', 'art gallery', 'tribal museum', 'craft museum', 
        'kala kendra', 'bhavan', 'auditorium', 'wax museum', 'folk museum', 'academy of art',
        'heritage museum', 'war memorial', 'smriti van', 'smarak'
    )):
        return 'Culture'
        
    # 2. Spiritual: Temples, Gurudwaras, Mosques, Churches, Ashrams, Monasteries, Stupas
    if any(k in text for k in (
        'temple', 'mandir', 'gurudwara', 'gurdwara', 'sahib', 'church', 'cathedral', 
        'mosque', 'masjid', 'dargah', 'shrine', 'monastery', 'gompa', 'ashram', 'ghat', 
        'stupa', 'basilica', 'synagogue', 'derasar', 'samadhi', 'matha', 'peeth', 'tirtha',
        'parasnath', 'jain temple', 'brahma temple', 'jyotirlinga', 'shakti peeth'
    )):
        return 'Spiritual'
        
    # 3. Wildlife: National Parks, Sanctuaries, Safari, Zoos, Biosphere Reserves
    if any(k in text for k in (
        'national park', 'wildlife sanctuary', 'wildlife', 'sanctuary', 'tiger reserve', 
        'bird sanctuary', 'safari', 'zoo', 'zoological', 'deer park', 'biosphere', 
        'elephant reserve', 'crocodile park'
    )):
        return 'Wildlife'
        
    # 4. Beaches: Coastal, Sea, Shore, Cove, Lighthouse, Island
    if any(k in text for k in (
        'beach', 'coast', 'coastal', 'cove', 'shoreline', 'ocean', 'lighthouse', 
        'island', 'promenade', 'sea view', 'bay ', 'sea walk'
    )):
        return 'Beaches'
        
    # 5. Adventure & Sports
    if any(k in text for k in (
        'trek', 'trekking', 'trail', 'cave', 'caverns', 'rafting', 'paragliding', 
        'rock climbing', 'climbing', 'bungee', 'kayaking', 'sports stadium', 'hockey stadium',
        'cricket ground', 'adventure park', 'ropeway'
    )):
        return 'Adventure'
        
    # 6. Mountains & Hill Stations
    if any(k in text for k in (
        'mountain', 'hill station', 'peak', 'pass', 'ridge', 'range', 'himalaya', 
        'valley', 'view point', 'viewpoint', 'cliff', 'sunset point', 'sunrise point'
    )):
        return 'Mountains'
        
    # 7. Nature & Waterbodies
    if any(k in text for k in (
        'waterfall', 'falls', 'lake', 'river', 'spring', 'gorge', 'canyon', 
        'botanical garden', 'scenic', 'bluff', 'dam ', 'reservoir', 'park ', 'garden', 
        'bagh', 'wetland', 'mangrove'
    )):
        return 'Nature'
        
    # 8. Shopping & Bazaars
    if any(k in text for k in (
        'bazaar', 'bazar', 'market', 'haat', 'shopping', 'emporium', 'mall', 
        'handicraft market', 'flea market', 'textile market'
    )):
        return 'Shopping'
        
    # 9. Food & Culinary
    if any(k in text for k in (
        'food walk', 'food street', 'street food', 'cuisine', 'culinary', 
        'khau galli', 'chatori', 'famous sweet', 'food core'
    )):
        return 'Food'
        
    # 10. Rural & Traditional Crafts
    if any(k in text for k in (
        'rural', 'artisan village', 'pottery', 'weaver', 'handloom', 'chaupal', 
        'panchayat', 'tribal village', 'heritage town'
    )):
        return 'Rural'
        
    # 11. Wellness & Yoga
    if any(k in text for k in (
        'wellness', 'yoga', 'ayurveda', 'meditation', 'retreat', 'hot spring', 'spa '
    )):
        return 'Wellness'
        
    # 12. Heritage: Forts, Palaces, Ruins, Monuments, Stepwells, Historical
    if any(k in text for k in (
        'fort', 'palace', 'mahal', 'haveli', 'monument', 'tomb', 'stepwell', 'baoli', 
        'qila', 'citadel', 'archaeological', 'ruins', 'historical', 'ancient', 'chhatri', 
        'cenotaph', 'unesco heritage', 'colonial', 'heritage'
    )):
        return 'Heritage'
        
    return 'Heritage' if 'heritage' in text else 'Culture' if 'history' in text else 'Attraction'

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, name, description, category FROM destinations_master')
    rows = c.fetchall()
    
    updated = 0
    updates = []
    dist = {}
    for r in rows:
        place_id, name, desc, orig = r
        cat = classify(name, desc or '', orig or '')
        updates.append((cat, place_id))
        dist[cat] = dist.get(cat, 0) + 1
        updated += 1
        
    c.executemany('UPDATE destinations_master SET category = ? WHERE id = ?', updates)
    conn.commit()
    conn.close()
    
    print(f"Successfully updated {updated} destinations in destinations_master with precise thematic categories!")
    for k, v in sorted(dist.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
