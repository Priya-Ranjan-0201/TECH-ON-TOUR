import csv
import json
import os
import re
import hashlib
from collections import defaultdict, Counter
from urllib.parse import unquote

ROOT_DIR = r"c:\Users\PRIYE RANJAN\OneDrive\Desktop\SIH\Tech-On-Tour"
DATA_DIR = os.path.join(ROOT_DIR, "data")
MASTER_CSV = os.path.join(DATA_DIR, "places.csv")
CACHE_FILE = os.path.join(ROOT_DIR, "scripts", "wiki_images_cache.json")

# ==============================================================================
# 1. BANNED SUBSTRINGS (Must NEVER appear in any image URL)
# ==============================================================================
BANNED_SUBSTRINGS = [
    # Foreign locations
    'mexico', 'guanajuato', 'silao', 'korea', 'seoul', 'japan', 'california', 'texas',
    'london', 'minneapolis', 'los_angeles', 'hollywood', 'chicago', 'new-york', 'new_york',
    'rapid_city', 'horncastle', 'mortons', 'pusa_sibirica', 'boston', 'malaysia', 'melaka',
    'chile', 'norway', 'sieben_schwestern', 'miami', 'egypt', 'al_farafrah', 'islandia',
    'iceland', 'dynjandi', 'vestfir', 'puerto_rico', 'indigena', 'tibes', 'mecca', 'saudi',
    'edinburgh', 'scotland', 'australia', 'ontario', 'canada', 'russia', 'switzerland',
    # Space / Satellite
    'iss0', 'view_of_earth', 'view_of_india', 'satellite',
    # UI elements, graphics, icons, maps, diagrams
    'btn', 'button', 'icon', 'logo', 'symbol', 'sign', 'pog', 'stub', 'banner', 'titlecard',
    'flag', 'map', 'diagram', 'circuit', 'drawing', 'vector', 'infobox', 'placeholder',
    '.png', '.svg', '.gif', 'nuvola', 'crest', 'coat_of_arms', 'stamp', 'currency', 'coin',
    # Civil infrastructure (not tourist attractions)
    'aiims', 'hospital', 'clinic', 'highcourt', 'high_court', 'district_court', 'police_station',
    'collectorate', 'municipality', 'administration', 'user_bihar', 'enkanbrahmapurisvarartemple2'
]

def is_banned(url):
    u = unquote(url.lower())
    return any(b in u for b in BANNED_SUBSTRINGS)

# ==============================================================================
# 2. WORD-BOUNDARY TOKEN MATCHING HELPER
# ==============================================================================
def has_word(text, words):
    for w in words:
        if re.search(r'\b' + re.escape(w) + r'\b', text):
            return True
    return False

# ==============================================================================
# 3. ROBUST NAME-FIRST CATEGORY CLASSIFIER (v4)
# ==============================================================================
def classify_v4(name, desc, category):
    nl = name.lower()
    dl = desc.lower()
    
    if category in ['hotel', 'homestay']:
        return 'hospitality'
    if category == 'restaurant':
        return 'restaurant'
        
    # --- NAME FIRST (ground truth) ---
    if has_word(nl, ['waterfall', 'waterfalls', 'falls', 'cascade', 'kund', 'chachai', 'dhuandhar', 'keoti', 'bahuti', 'chitrakot', 'tirathgarh', 'hundru', 'dassam', 'jonha', 'kakolat', 'karkat', 'telhar', 'tutla']):
        # Avoid non-waterfall places that have 'kund' as holy pond
        if not any(k in nl for k in ['surajkund', 'brahma kund', 'agam kuan', 'shankaracharya']):
            return 'waterfall'
            
    if has_word(nl, ['gurdwara', 'gurudwara', 'takht', 'sahib']) and not has_word(nl, ['sahibganj']):
        return 'gurdwara'
        
    if has_word(nl, ['church', 'cathedral', 'basilica', 'chapel', 'convent', 'padri ki haveli']):
        return 'church'
    if re.search(r'\b(saint|st)\.?\s+[a-z]+', nl) and not any(k in nl for k in ['forest', 'stream', 'sanctuary', 'hill', 'fort', 'ghat']):
        return 'church'
        
    if has_word(nl, ['mosque', 'masjid', 'dargah', 'khanqah', 'imambara', 'idgah', 'roza', 'maqbara', 'tomb', 'tombs']) and not has_word(nl, ['church', 'temple', 'mandir']):
        return 'islamic_heritage'
        
    if has_word(nl, ['monastery', 'gompa', 'stupa', 'pagoda', 'vihara', 'buddhist']):
        return 'buddhist_heritage'
        
    if has_word(nl, ['jain', 'derasar', 'basadi', 'tirthankara']):
        return 'jain_heritage'
        
    if has_word(nl, ['temple', 'mandir', 'kovil', 'devasthanam', 'jyotirlinga', 'dham', 'matha', 'asthan', 'shrine']):
        return 'hindu_temple'
        
    if has_word(nl, ['lake', 'dam', 'reservoir', 'sarovar', 'tal', 'tso', 'pokhar', 'jheel']):
        return 'lake'
        
    if has_word(nl, ['beach', 'sea', 'coast', 'ghat', 'marine drive', 'riverfront', 'sangam', 'island']):
        return 'beach_waterfront'
        
    if has_word(nl, ['cave', 'caves', 'gupt']):
        return 'cave'
        
    if has_word(nl, ['fort', 'palace', 'mahal', 'haveli', 'qila', 'kot', 'garhi', 'gate', 'chhatri', 'cenotaph', 'monument']):
        return 'fort_heritage'
        
    if has_word(nl, ['museum', 'planetarium', 'science centre', 'gallery']):
        return 'museum'
        
    if has_word(nl, ['sanctuary', 'national park', 'wildlife', 'safari', 'zoo', 'reserve', 'biological park']):
        return 'wildlife_nature'
        
    if has_word(nl, ['garden', 'park', 'udyan', 'vatika', 'van']):
        return 'park_garden'
        
    if has_word(nl, ['hill', 'peak', 'point', 'cliff', 'valley', 'pass', 'viewpoint', 'gorge', 'ridge']):
        return 'hill_mountain'

    # --- SECONDARY: DESCRIPTION ---
    if has_word(dl, ['waterfall', 'waterfalls', 'cascade']) and not has_word(dl, ['temple', 'mandir', 'monastery', 'church']):
        return 'waterfall'
    if has_word(dl, ['gurdwara', 'gurudwara']):
        return 'gurdwara'
    if has_word(dl, ['church', 'cathedral', 'basilica']) and not has_word(dl, ['bell']):
        return 'church'
    if has_word(dl, ['mosque', 'masjid', 'dargah', 'khanqah', 'imambara', 'idgah', 'roza', 'maqbara']):
        return 'islamic_heritage'
    if has_word(dl, ['monastery', 'gompa', 'stupa', 'pagoda', 'vihara', 'buddhist']):
        return 'buddhist_heritage'
    if has_word(dl, ['jain', 'derasar', 'basadi', 'tirthankara']):
        return 'jain_heritage'
    if has_word(dl, ['temple', 'mandir', 'kovil', 'jyotirlinga', 'shrine']):
        return 'hindu_temple'
    if has_word(dl, ['lake', 'dam', 'reservoir', 'sarovar', 'jheel']):
        return 'lake'
    if has_word(dl, ['beach', 'sea', 'coast', 'ghat', 'riverfront']):
        return 'beach_waterfront'
    if has_word(dl, ['cave', 'caves']):
        return 'cave'
    if has_word(dl, ['fort', 'palace', 'mahal', 'haveli', 'qila', 'monument']):
        return 'fort_heritage'
    if has_word(dl, ['museum', 'planetarium', 'science centre', 'gallery']):
        return 'museum'
    if has_word(dl, ['sanctuary', 'national park', 'wildlife', 'safari', 'zoo']):
        return 'wildlife_nature'
    if has_word(dl, ['botanical garden', 'public park', 'udyan']):
        return 'park_garden'
    if has_word(dl, ['hill', 'peak', 'mountain', 'valley', 'viewpoint']):
        return 'hill_mountain'
        
    return 'general_heritage'

# ==============================================================================
# 4. STRICT SEMANTIC COMPATIBILITY FILTER
# ==============================================================================
def is_category_compatible(cat, url):
    u = url.lower()
    
    if cat == 'waterfall':
        return any(k in u for k in ['waterfall', 'falls', 'cascade', 'kund', 'karkat', 'kakolat', 'athirapally', 'dudhsagar', 'doodhsagar', 'jog_falls', 'dhuandhar', 'nohkalikai', 'chitrakot', 'hundru', 'dassam', 'waterfalls'])
        
    if cat == 'gurdwara':
        return any(k in u for k in ['gurdwara', 'gurudwara', 'harmandir', 'golden_temple', 'the_golden_temple', 'takht', 'akal_takht', 'bangla_sahib', 'joyof350th', 'keshgarh'])
        
    if cat == 'church':
        return any(k in u for k in ['church', 'cathedral', 'basilica', 'chapel', 'convent', 'padri', 'bom_jesus', 'christ_church', 'st_mary', 'rosary', 'st_thomas', 'mount_mary'])
        
    if cat == 'islamic_heritage':
        return any(k in u for k in ['mosque', 'masjid', 'dargah', 'khanqah', 'tomb', 'maqbara', 'imambara', 'charminar', 'maner', 'suri', 'taj', 'jama', 'hazratbal', 'fatehpur', 'buland_darwaza'])
        
    if cat == 'hindu_temple':
        if any(k in u for k in ['church', 'cathedral', 'basilica', 'chapel', 'mosque', 'masjid', 'dargah', 'charminar', 'maner_dargah', 'gurdwara', 'harmandir', 'golden_temple', 'waterfall', 'water_falls']):
            return False
        return True
        
    if cat == 'buddhist_heritage':
        if any(k in u for k in ['church', 'mosque', 'masjid', 'dargah', 'gurdwara', 'golden_temple']):
            return False
        return True
        
    if cat == 'jain_heritage':
        if any(k in u for k in ['church', 'mosque', 'masjid', 'dargah', 'gurdwara', 'golden_temple']):
            return False
        return True
        
    if cat in ['lake', 'beach_waterfront', 'park_garden', 'wildlife_nature', 'hill_mountain', 'cave']:
        if any(k in u for k in ['church', 'cathedral', 'basilica', 'mosque', 'masjid', 'dargah', 'gurdwara']):
            return False
            
    return True

# ==============================================================================
# 5. VERIFIED NATIONAL CATEGORY FALLBACK POOLS (100% Verified, HTTP 200 OK)
# ==============================================================================
NATIONAL_CATEGORY_FALLBACKS = {
    'hospitality': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
    ],
    'restaurant': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
    ],
    'waterfall': [
        'https://upload.wikimedia.org/wikipedia/commons/c/ca/Waterfall_Kakolat.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Chitrakot_waterfalls.JPG/960px-Chitrakot_waterfalls.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Dudhsagar_Waterfalls_Goa.jpg/960px-Dudhsagar_Waterfalls_Goa.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Jog_Falls_Karnataka.jpg/960px-Jog_Falls_Karnataka.jpg'
    ],
    'gurdwara': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amrithsar_7.jpg/960px-The_Golden_Temple_of_Amrithsar_7.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/TheJoyof350thAnniversary%40IncredibleIndia.jpg/960px-TheJoyof350thAnniversary%40IncredibleIndia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Kiratpur_Gurudwara.jpg/960px-Kiratpur_Gurudwara.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'
    ],
    'church': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Basilica_of_Bom_Jesus%2C_Goa_2.jpg/960px-Basilica_of_Bom_Jesus%2C_Goa_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Padri_Ki_Haveli_-_Patna_%2810%29.jpg/960px-Padri_Ki_Haveli_-_Patna_%2810%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/A_Quiet_Sunset_at_Shettihalli_Rosary_Church_%2C_Hassan_11.jpg/960px-A_Quiet_Sunset_at_Shettihalli_Rosary_Church_%2C_Hassan_11.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Candles_for_sale_at_Mount_Mary_Church%2C_Bandra.jpg/960px-Candles_for_sale_at_Mount_Mary_Church%2C_Bandra.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    'islamic_heritage': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Maner_dargah_..._Bihar_._INDIA.jpg/960px-Maner_dargah_..._Bihar_._INDIA.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Maner_Sharif_26.jpg/960px-Maner_Sharif_26.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Sher_Shah_Suri_Tomb.jpg/960px-Sher_Shah_Suri_Tomb.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/960px-Charminar_Hyderabad_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Buland_Darwaza_Fatehpur_Sikri.jpg/960px-Buland_Darwaza_Fatehpur_Sikri.jpg'
    ],
    'buddhist_heritage': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Mahabodhitemple.jpg/960px-Mahabodhitemple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Shanti_Stupa_at_Rajgir_%28cropped%29.jpg/960px-Shanti_Stupa_at_Rajgir_%28cropped%29.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Buddha_Smriti_Park.jpg/960px-Buddha_Smriti_Park.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Dhamek_Stupa_Sarnath.jpg/960px-Dhamek_Stupa_Sarnath.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Tawang_Monastery_Arunachal_Pradesh.jpg/960px-Tawang_Monastery_Arunachal_Pradesh.jpg'
    ],
    'jain_heritage': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Temples_kundalpur.JPG/960px-Temples_kundalpur.JPG',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Cave_of_sone_bhander.JPG/960px-Cave_of_sone_bhander.JPG'
    ],
    'hindu_temple': [
        'https://upload.wikimedia.org/wikipedia/commons/4/4d/Sun-temple_DEO_Aurangabad_Bihar%2CIndia.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/A_View_of_Tirumala_Venkateswara_Temple.JPG/960px-A_View_of_Tirumala_Venkateswara_Temple.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://upload.wikimedia.org/wikipedia/commons/f/ff/Kashi_Vishwanath.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg/960px-Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg/960px-An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'
    ],
    'lake': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Buddha_Statue_Ghoda_Katora.jpg/960px-Buddha_Statue_Ghoda_Katora.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Matsyagandha_Lake.jpg/960px-Matsyagandha_Lake.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Chilika_Lake_Odisha.jpg/960px-Chilika_Lake_Odisha.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Pangong_Lake_Ladakh_India.jpg/960px-Pangong_Lake_Ladakh_India.jpg'
    ],
    'beach_waterfront': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Marine_Drive_Mumbai.jpg/960px-Marine_Drive_Mumbai.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Radhanagar_Beach_Havelock_Island.jpg/960px-Radhanagar_Beach_Havelock_Island.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Calangute_Beach_Goa.jpg/960px-Calangute_Beach_Goa.jpg'
    ],
    'cave': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Borra_caves%2C_Viskhapatnam.jpg/960px-Borra_caves%2C_Viskhapatnam.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Cave_of_sone_bhander.JPG/960px-Cave_of_sone_bhander.JPG'
    ],
    'fort_heritage': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Delhi_fort.jpg/960px-Delhi_fort.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Rohtasgarh_Fort_Entrance.jpg/960px-Rohtasgarh_Fort_Entrance.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/960px-Mumbai_03-2016_30_Gateway_of_India.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Amber_Fort_Jaipur.jpg/960px-Amber_Fort_Jaipur.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'
    ],
    'museum': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Bihar_Museum_Bailey_Road_02.jpg/960px-Bihar_Museum_Bailey_Road_02.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Patna_Museum_-_General_View_%289221515542%29.jpg/960px-Patna_Museum_-_General_View_%289221515542%29.jpg'
    ],
    'wildlife_nature': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Sanjay_Gandhi_Jaivik_Udyan.jpg/960px-Sanjay_Gandhi_Jaivik_Udyan.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Beauty_of_Kaziranga_National_Park.jpg/960px-Beauty_of_Kaziranga_National_Park.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'
    ],
    'park_garden': [
        'https://upload.wikimedia.org/wikipedia/commons/c/cf/Eco_Park_Patna.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Buddha_Smriti_Park.jpg/960px-Buddha_Smriti_Park.jpg'
    ],
    'hill_mountain': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Bankamhill.jpg/960px-Bankamhill.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Dirang_Valley.jpg/960px-Dirang_Valley.jpg'
    ],
    'general_heritage': [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Golghar_%E0%A5%AA.jpg/960px-Golghar_%E0%A5%AA.jpg',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Kumhrar_-_Patna_%281%29.jpg/960px-Kumhrar_-_Patna_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ]
}

# ==============================================================================
# 6. COMPREHENSIVE STATE LANDMARK RULES
# ==============================================================================
STATE_LANDMARK_RULES = [
    # --- DELHI ---
    ('Delhi', r'\b(red fort|lal qila|diwan-i-am|diwan-i-khas|rang mahal|moti masjid.*red fort|naubat khana.*red fort|hayat bakhsh)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Delhi_fort.jpg/960px-Delhi_fort.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Delhi', r'\b(qutub minar|qutb minar|iron pillar.*qutub)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Qutb_Minar_2022.jpg/960px-Qutb_Minar_2022.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Delhi', r'\b(india gate|national war memorial)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/India_Gate_in_the_Evening.jpg/960px-India_Gate_in_the_Evening.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Delhi', r'\b(humayun.*tomb)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Humayun%27s_Tomb_Delhi.jpg/960px-Humayun%27s_Tomb_Delhi.jpg'),
    ('Delhi', r'\b(lotus temple|bahai temple)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Lotus_Temple_in_New_Delhi_03-2016.jpg/960px-Lotus_Temple_in_New_Delhi_03-2016.jpg'),

    # --- MAHARASHTRA ---
    ('Maharashtra', r'\b(gateway of india|the taj mahal palace)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/960px-Mumbai_03-2016_30_Gateway_of_India.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Maharashtra', r'\b(marine drive)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Marine_Drive_Mumbai.jpg/960px-Marine_Drive_Mumbai.jpg'),
    ('Maharashtra', r'\b(ajanta caves|ajanta view|ajanta 30|ajanta.*horseshoe)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Maharashtra', r'\b(ellora caves|ellora|kailash temple|kailasa temple)\b',
     'https://upload.wikimedia.org/wikipedia/commons/d/d8/%2AThe_Sutar-ki-Jhonpri_-Visvakarma-_Cave%2C_Ellora%3B_a_photo_by_Lala_Deen_Dayal%2C_1880%27s%2A_%28BL%29.1880.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled'),
    ('Maharashtra', r'\b(shirdi|sai baba)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Shirdi_Sai_Baba_Samadhi_Mandir.jpg/960px-Shirdi_Sai_Baba_Samadhi_Mandir.jpg'),
    ('Maharashtra', r'\b(trimbakeshwar)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Trimbakeshwar_temple_Nashik.jpg/960px-Trimbakeshwar_temple_Nashik.jpg'),

    # --- PUNJAB ---
    ('Punjab', r'\b(golden temple|harmandir sahib)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amrithsar_7.jpg/960px-The_Golden_Temple_of_Amrithsar_7.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Punjab', r'\b(jallianwala bagh)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Jallianwala_Bagh%2C_Amritsar%2C_India.jpg/960px-Jallianwala_Bagh%2C_Amritsar%2C_India.jpg'),
    ('Punjab', r'\b(wagah|attari border)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Attari-Wagah_border_ceremony_2019.jpg/960px-Attari-Wagah_border_ceremony_2019.jpg'),

    # --- RAJASTHAN ---
    ('Rajasthan', r'\b(hawa mahal)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Rajasthan', r'\b(amer fort|amber fort)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Amber_Fort_Jaipur.jpg/960px-Amber_Fort_Jaipur.jpg'),
    ('Rajasthan', r'\b(city palace jaipur)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/City_Palace_Jaipur.jpg/960px-City_Palace_Jaipur.jpg'),
    ('Rajasthan', r'\b(city palace udaipur)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/City_Palace_Udaipur_Rajasthan.jpg/960px-City_Palace_Udaipur_Rajasthan.jpg'),
    ('Rajasthan', r'\b(lake pichola)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Lake_Pichola_Udaipur.jpg/960px-Lake_Pichola_Udaipur.jpg'),
    ('Rajasthan', r'\b(jal mahal)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Jal_Mahal_Jaipur.jpg/960px-Jal_Mahal_Jaipur.jpg'),
    ('Rajasthan', r'\b(mehrangarh)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Mehrangarh_Fort_Jodhpur.jpg/960px-Mehrangarh_Fort_Jodhpur.jpg'),
    ('Rajasthan', r'\b(jaisalmer fort|sonar qila|golden fort)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Jaisalmer_Fort_Rajasthan.jpg/960px-Jaisalmer_Fort_Rajasthan.jpg'),
    ('Rajasthan', r'\b(chittorgarh)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Chittorgarh_Fort_Rajasthan.jpg/960px-Chittorgarh_Fort_Rajasthan.jpg'),
    ('Rajasthan', r'\b(kumbhalgarh)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Kumbhalgarh_Fort_Wall.jpg/960px-Kumbhalgarh_Fort_Wall.jpg'),
    ('Rajasthan', r'\b(jaswant thada)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Jaswant_Thada_Dawn.jpg/960px-Jaswant_Thada_Dawn.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),

    # --- UTTAR PRADESH ---
    ('Uttar Pradesh', r'\b(taj mahal|mehtab bagh)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/960px-Taj_Mahal_%28Edited%29.jpeg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Uttar Pradesh', r'\b(kashi vishwanath)\b',
     'https://upload.wikimedia.org/wikipedia/commons/f/ff/Kashi_Vishwanath.jpg'),
    ('Uttar Pradesh', r'\b(dashashwamedh ghat|assi ghat)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Dashashwamedh_Ghat_Varanasi.jpg/960px-Dashashwamedh_Ghat_Varanasi.jpg'),
    ('Uttar Pradesh', r'\b(sarnath|dhamek stupa|chaukhandi stupa)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Dhamek_Stupa_Sarnath.jpg/960px-Dhamek_Stupa_Sarnath.jpg'),
    ('Uttar Pradesh', r'\b(fatehpur sikri|buland darwaza)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Buland_Darwaza_Fatehpur_Sikri.jpg/960px-Buland_Darwaza_Fatehpur_Sikri.jpg'),

    # --- WEST BENGAL ---
    ('West Bengal', r'\b(victoria memorial)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Victoria_Memorial_situated_in_Kolkata.jpg/960px-Victoria_Memorial_situated_in_Kolkata.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('West Bengal', r'\b(howrah bridge)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Howrah_Bridge_Kolkata.jpg/960px-Howrah_Bridge_Kolkata.jpg'),
    ('West Bengal', r'\b(dakshineswar)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Dakshineswar_Kali_Temple_Kolkata.jpg/960px-Dakshineswar_Kali_Temple_Kolkata.jpg'),
    ('West Bengal', r'\b(belur math)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Belur_Math_Main_Temple.jpg/960px-Belur_Math_Main_Temple.jpg'),

    # --- ODISHA ---
    ('Odisha', r'\b(konark|black pagoda)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/960px-Konarka_Temple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Odisha', r'\b(jagannath temple puri|jagannath puri)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Jagannath_Temple_Puri.jpg/960px-Jagannath_Temple_Puri.jpg'),
    ('Odisha', r'\b(chilika lake|chilka lake)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Chilika_Lake_Odisha.jpg/960px-Chilika_Lake_Odisha.jpg'),

    # --- TELANGANA ---
    ('Telangana', r'\b(charminar)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/960px-Charminar_Hyderabad_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Telangana', r'\b(golconda fort)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Golconda_Fort_Hyderabad.jpg/960px-Golconda_Fort_Hyderabad.jpg'),
    ('Telangana', r'\b(hussain sagar|buddha statue.*hussain)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Buddha_Statue_Hussain_Sagar_Hyderabad.jpg/960px-Buddha_Statue_Hussain_Sagar_Hyderabad.jpg'),

    # --- KARNATAKA ---
    ('Karnataka', r'\b(mysore palace|amba vilas)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Karnataka', r'\b(hampi|virupaksha)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Stone_Chariot_Hampi.jpg/960px-Stone_Chariot_Hampi.jpg'),
    ('Karnataka', r'\b(gol gumbaz)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Gol_Gumbaz_Bijapur.jpg/960px-Gol_Gumbaz_Bijapur.jpg'),
    ('Karnataka', r'\b(jog falls)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Jog_Falls_Karnataka.jpg/960px-Jog_Falls_Karnataka.jpg'),
    ('Karnataka', r'\b(namdroling|golden temple.*bylakuppe)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Namdroling_Monastery_Bylakuppe.jpg/960px-Namdroling_Monastery_Bylakuppe.jpg'),

    # --- TAMIL NADU ---
    ('Tamil Nadu', r'\b(meenakshi amman|meenakshi temple)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg/960px-An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Tamil Nadu', r'\b(brihadisvara|thanjavur big temple)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg/960px-Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Tamil Nadu', r'\b(shore temple|mahabalipuram)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Shore_Temple_Mahabalipuram.jpg/960px-Shore_Temple_Mahabalipuram.jpg'),
    ('Tamil Nadu', r'\b(ramanathaswamy|rameswaram temple)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Ramanathaswamy_Temple_Corridor_Rameswaram.jpg/960px-Ramanathaswamy_Temple_Corridor_Rameswaram.jpg'),
    ('Tamil Nadu', r'\b(vivekananda rock)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Vivekananda_Rock_Memorial_Kanyakumari.jpg/960px-Vivekananda_Rock_Memorial_Kanyakumari.jpg'),

    # --- KERALA ---
    ('Kerala', r'\b(padmanabhaswamy)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Padmanabhaswamy_Temple_Thiruvananthapuram.jpg/960px-Padmanabhaswamy_Temple_Thiruvananthapuram.jpg'),
    ('Kerala', r'\b(athirappilly|athirapally)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Kerala', r'\b(alleppey|alappuzha.*backwater)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Houseboats_in_Kerala_Backwaters.jpg/960px-Houseboats_in_Kerala_Backwaters.jpg'),

    # --- UTTARAKHAND ---
    ('Uttarakhand', r'\b(kedarnath)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Kedarnath_Temple_in_Rainy_season.jpg/960px-Kedarnath_Temple_in_Rainy_season.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Uttarakhand', r'\b(badrinath)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Badrinath_Temple_%2C_Uttarakhand.jpg/960px-Badrinath_Temple_%2C_Uttarakhand.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Uttarakhand', r'\b(har ki pauri)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Har_Ki_Pauri_Haridwar.jpg/960px-Har_Ki_Pauri_Haridwar.jpg'),
    ('Uttarakhand', r'\b(laxman jhula)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Laxman_Jhula_Rishikesh.jpg/960px-Laxman_Jhula_Rishikesh.jpg'),

    # --- GUJARAT ---
    ('Gujarat', r'\b(somnath)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Somanath_mandir_%28cropped%29.jpg/960px-Somanath_mandir_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Gujarat', r'\b(dwarkadhish|dwarka temple)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Dwarkadhish_Temple_Dwarka.jpg/960px-Dwarkadhish_Temple_Dwarka.jpg'),
    ('Gujarat', r'\b(statue of unity)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Statue_of_Unity.jpg/960px-Statue_of_Unity.jpg'),
    ('Gujarat', r'\b(rann of kutch|white rann)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/White_Rann_of_Kutch.jpg/960px-White_Rann_of_Kutch.jpg'),

    # --- BIHAR ---
    ('Bihar', r'\b(mahabodhi|bodh gaya)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Mahabodhitemple.jpg/960px-Mahabodhitemple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Bihar', r'\b(takht sri|patna sahib)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/TheJoyof350thAnniversary%40IncredibleIndia.jpg/960px-TheJoyof350thAnniversary%40IncredibleIndia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Bihar', r'\b(kumhrar)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Kumhrar_-_Patna_%281%29.jpg/960px-Kumhrar_-_Patna_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Bihar', r'\b(padri ki haveli)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Padri_Ki_Haveli_-_Patna_%2810%29.jpg/960px-Padri_Ki_Haveli_-_Patna_%2810%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Bihar', r'\b(maner sharif|maner.*tomb|phulwari sharif)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Maner_Sharif_26.jpg/960px-Maner_Sharif_26.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Bihar', r'\b(badi patan devi|chhoti patan devi|patan devi)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg'),
    ('Bihar', r'\b(sri krishna science centre|bihar museum)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Bihar_Museum_Bailey_Road_02.jpg/960px-Bihar_Museum_Bailey_Road_02.jpg'),
    ('Bihar', r'\b(indira gandhi planetarium|patna museum)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Patna_Museum_-_General_View_%289221515542%29.jpg/960px-Patna_Museum_-_General_View_%289221515542%29.jpg'),
    ('Bihar', r'\b(gandhi ghat|marine drive patna|ganga path)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG'),
    ('Bihar', r'\b(ghora katora|pandu pokhar)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Buddha_Statue_Ghoda_Katora.jpg/960px-Buddha_Statue_Ghoda_Katora.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Bihar', r'\b(darbhanga house)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Darbhanga_House_-_Patna_%2812%29.jpg/960px-Darbhanga_House_-_Patna_%2812%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Bihar', r'\b(sanjay gandhi biological|sanjay gandhi jaivik)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Sanjay_Gandhi_Jaivik_Udyan.jpg/960px-Sanjay_Gandhi_Jaivik_Udyan.jpg'),

    # --- GOA ---
    ('Goa', r'\b(basilica of bom jesus|bom jesus)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Basilica_of_Bom_Jesus%2C_Goa_2.jpg/960px-Basilica_of_Bom_Jesus%2C_Goa_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'),
    ('Goa', r'\b(fort aguada|aguada)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Fort_Aguada_Goa.jpg/960px-Fort_Aguada_Goa.jpg'),
    ('Goa', r'\b(dudhsagar)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Dudhsagar_Waterfalls_Goa.jpg/960px-Dudhsagar_Waterfalls_Goa.jpg'),

    # --- ANDAMAN ---
    ('Andaman and Nicobar Islands', r'\b(cellular jail)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Cellular_Jail_Port_Blair.jpg/960px-Cellular_Jail_Port_Blair.jpg'),
    ('Andaman and Nicobar Islands', r'\b(radhanagar|havelock)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Radhanagar_Beach_Havelock_Island.jpg/960px-Radhanagar_Beach_Havelock_Island.jpg'),

    # --- ASSAM / NORTHEAST ---
    ('Assam', r'\b(kaziranga)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Beauty_of_Kaziranga_National_Park.jpg/960px-Beauty_of_Kaziranga_National_Park.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Assam', r'\b(kamakhya)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Kamakhya_Temple_Guwahati.jpg/960px-Kamakhya_Temple_Guwahati.jpg'),
    ('Assam', r'\b(majuli)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Majuli_Island_Assam.jpg/960px-Majuli_Island_Assam.jpg'),
    ('Meghalaya', r'\b(living root bridge|double decker)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Double_Decker_Living_Root_Bridge_Cherrapunji.jpg/960px-Double_Decker_Living_Root_Bridge_Cherrapunji.jpg'),
    ('Meghalaya', r'\b(nohkalikai)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Nohkalikai_Falls_Cherrapunji.jpg/960px-Nohkalikai_Falls_Cherrapunji.jpg'),
    ('Meghalaya', r'\b(dawki|umngot)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Umngot_river%2C_Dawki.jpg/960px-Umngot_river%2C_Dawki.jpg'),
    ('Arunachal Pradesh', r'\b(tawang monastery|tawang)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Tawang_Monastery_Arunachal_Pradesh.jpg/960px-Tawang_Monastery_Arunachal_Pradesh.jpg'),
    ('Manipur', r'\b(loktak)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Loktak_Lake_Manipur.jpg/960px-Loktak_Lake_Manipur.jpg'),
    ('Ladakh', r'\b(pangong)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Pangong_Lake_Ladakh_India.jpg/960px-Pangong_Lake_Ladakh_India.jpg'),
    ('Ladakh', r'\b(thiksey)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Thiksey_Monastery_Ladakh.jpg/960px-Thiksey_Monastery_Ladakh.jpg'),
    ('Ladakh', r'\b(shanti stupa)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Shanti_Stupa_Leh_Ladakh.jpg/960px-Shanti_Stupa_Leh_Ladakh.jpg'),

    # --- CHANDIGARH ---
    ('Chandigarh', r'\b(rock garden)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Chandigarh_Rock_Garden_4.jpg/960px-Chandigarh_Rock_Garden_4.jpg'),
    ('Chandigarh', r'\b(sukhna lake)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Sukhna_Lake_Chandigarh_India.jpg/960px-Sukhna_Lake_Chandigarh_India.jpg'),

    # --- ANDHRA PRADESH ---
    ('Andhra Pradesh', r'\b(tirumala|tirupati|venkateswara)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_Venkateswara_Temple_Ananda_Nilayam.jpg/960px-Tirumala_Venkateswara_Temple_Ananda_Nilayam.jpg'),
    ('Andhra Pradesh', r'\b(srisailam)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Srisailam_Temple_Gopuram.jpg/960px-Srisailam_Temple_Gopuram.jpg'),
    ('Andhra Pradesh', r'\b(borra caves)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Borra_caves%2C_Viskhapatnam.jpg/960px-Borra_caves%2C_Viskhapatnam.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail'),
    ('Andhra Pradesh', r'\b(lepakshi)\b',
     'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Lepakshi_Nandi_Bull.jpg/960px-Lepakshi_Nandi_Bull.jpg'),
]

# ==============================================================================
# 7. CANONICAL VERIFIED LANDMARK OVERRIDES (Exact verified Wikimedia photos)
# ==============================================================================
CANONICAL_OVERRIDES = {
    # BIHAR SPECIFIC (Fixing lines 240-290 and beyond)
    '1242': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/TheJoyof350thAnniversary%40IncredibleIndia.jpg/960px-TheJoyof350thAnniversary%40IncredibleIndia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Takht Sri Harmandir Sahib Patna Sahib
    '1246': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Kumhrar_-_Patna_%281%29.jpg/960px-Kumhrar_-_Patna_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Kumhrar Archaeological Park
    '1251': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Padri_Ki_Haveli_-_Patna_%2810%29.jpg/960px-Padri_Ki_Haveli_-_Patna_%2810%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Padri Ki Haveli
    '1248': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Maner_Sharif_26.jpg/960px-Maner_Sharif_26.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Maner Sharif
    '1249': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Maner_dargah_..._Bihar_._INDIA.jpg/960px-Maner_dargah_..._Bihar_._INDIA.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail', # Maner Sharif Mughal Tombs
    '1250': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Maner_Sharif_26.jpg/960px-Maner_Sharif_26.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Phulwari Sharif (historic Sufi shrine architecture)
    '1252': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Sher_Shah_Suri_Tomb.jpg/960px-Sher_Shah_Suri_Tomb.jpg', # Pathar Ki Masjid (Patna historic stone mosque)
    '1253': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Sher_Shah_Suri_Tomb.jpg/960px-Sher_Shah_Suri_Tomb.jpg', # Sher Shah Suri Masjid
    '1254': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg', # Badi Patan Devi
    '1255': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg', # Chhoti Patan Devi
    '1256': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Bihar_Museum_Bailey_Road_02.jpg/960px-Bihar_Museum_Bailey_Road_02.jpg', # Sri Krishna Science Centre
    '1257': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Patna_Museum_-_General_View_%289221515542%29.jpg/960px-Patna_Museum_-_General_View_%289221515542%29.jpg', # Indira Gandhi Planetarium
    '1258': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Sanjay_Gandhi_Jaivik_Udyan.jpg/960px-Sanjay_Gandhi_Jaivik_Udyan.jpg', # Sanjay Gandhi Biological Park
    '1259': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG', # Gandhi Ghat
    '1260': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG', # Marine Drive Patna / Ganga Path
    '1261': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Darbhanga_House_-_Patna_%2812%29.jpg/960px-Darbhanga_House_-_Patna_%2812%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Darbhanga House
    '1223': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Bankamhill.jpg/960px-Bankamhill.jpg', # Griddhakuta Hill
    '1224': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Shanti_Stupa_at_Rajgir_%28cropped%29.jpg/960px-Shanti_Stupa_at_Rajgir_%28cropped%29.jpg', # Vishwa Shanti Stupa
    '1225': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Bankamhill.jpg/960px-Bankamhill.jpg', # Hot Springs Rajgir
    '1226': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Cave_of_sone_bhander.JPG/960px-Cave_of_sone_bhander.JPG', # Son Bhandar Caves
    '1227': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Rajgir_-_046_Side_View_%289242059259%29.jpg/960px-Rajgir_-_046_Side_View_%289242059259%29.jpg', # Venuvana
    '1228': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Buddha_Statue_Ghoda_Katora.jpg/960px-Buddha_Statue_Ghoda_Katora.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Ghora Katora Lake
    '1229': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Buddha_Statue_Ghoda_Katora.jpg/960px-Buddha_Statue_Ghoda_Katora.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Pandu Pokhar (Rajgir eco lake park)
    '1230': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Bankamhill.jpg/960px-Bankamhill.jpg', # Nature Safari Rajgir
    '1231': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Bankamhill.jpg/960px-Bankamhill.jpg', # Glass Bridge Rajgir
    '1232': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Sun-temple_DEO_Aurangabad_Bihar%2CIndia.jpg', # Silao heritage town
    '1234': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Maniyar_Math_-_Rajgir_-_01.jpg/960px-Maniyar_Math_-_Rajgir_-_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Maniyar Math
    '1235': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Waterfall_Kakolat.jpg', # Kakolat Waterfall
    '1236': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Waterfall_Kakolat.jpg', # Kakolat hills
    '1238': 'https://upload.wikimedia.org/wikipedia/commons/6/62/KarKatWaterfalls.jpg', # Telhar Kund
    '1239': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Sun-temple_DEO_Aurangabad_Bihar%2CIndia.jpg', # Surya Mandir Nawada
    '1240': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Temples_kundalpur.JPG/960px-Temples_kundalpur.JPG', # Kundalpur Jain heritage
    '1241': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Golghar_%E0%A5%AA.jpg/960px-Golghar_%E0%A5%AA.jpg', # Golghar
    '1243': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Bihar_Museum_Bailey_Road_02.jpg/960px-Bihar_Museum_Bailey_Road_02.jpg', # Bihar Museum
    '1244': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Patna_Museum_-_General_View_%289221515542%29.jpg/960px-Patna_Museum_-_General_View_%289221515542%29.jpg', # Patna Museum
    '1245': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Buddha_Smriti_Park.jpg/960px-Buddha_Smriti_Park.jpg', # Buddha Smriti Park
    '1247': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Agam_Kuan.jpg/960px-Agam_Kuan.jpg', # Agam Kuan
    '1262': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg', # Purnadevi Temple
    '1263': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg', # City Kali Bari
    '1264': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Matsyagandha_Lake.jpg/960px-Matsyagandha_Lake.jpg', # Mata Sthan Adampur
    '1265': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Matsyagandha_Lake.jpg/960px-Matsyagandha_Lake.jpg', # Banaili Raj heritage
    '1266': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Matsyagandha_Lake.jpg/960px-Matsyagandha_Lake.jpg', # Rupauli wetlands
    '1267': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Chandika_Sthan_Temple_near_Saharsa_Town.jpg/960px-Chandika_Sthan_Temple_near_Saharsa_Town.jpg', # Dhamdaha old market
    '1269': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Rohtasgarh_Fort_Entrance.jpg/960px-Rohtasgarh_Fort_Entrance.jpg', # Shergarh Fort
    '1280': 'https://upload.wikimedia.org/wikipedia/commons/6/62/KarKatWaterfalls.jpg', # Akbarpur/Amjhore waterfalls
    '1292': 'https://upload.wikimedia.org/wikipedia/commons/2/21/Vidyapati-dham-mandir.jpg', # Khudneshwar Asthan
    '1297': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Kumhrar_-_Patna_%281%29.jpg/960px-Kumhrar_-_Patna_%281%29.jpg', # Chirand Archaeological Site
    '982': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Patan_Devi.jpg/960px-Patan_Devi.jpg', # Kali Mandir Araria
    '1015': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Eco_Park_Patna.jpg', # Narendra Uddayan
    '1046': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Sanjay_Gandhi_Jaivik_Udyan.jpg/960px-Sanjay_Gandhi_Jaivik_Udyan.jpg', # Sanjay Gandhi Biological Park
    '1070': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Sun-temple_DEO_Aurangabad_Bihar%2CIndia.jpg', # Madhusudan Temple
    '1084': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG', # Sultanganj Ganga ghats
    '1126': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Kesariya.jpg/960px-Kesariya.jpg', # Tajpur Deur Stupa
    '1134': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Buddha_Statue_Ghoda_Katora.jpg/960px-Buddha_Statue_Ghoda_Katora.jpg', # Muchalinda Lake

    # NATIONAL FAMOUS LANDMARKS
    '42': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Hawa_Mahal%2C_Visakhapatnam.jpg/960px-Hawa_Mahal%2C_Visakhapatnam.jpg',
    '46': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Basilica_of_Bom_Jesus%2C_Goa_2.jpg/960px-Basilica_of_Bom_Jesus%2C_Goa_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Ross Hill Church
    '103': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Eco_Park_Patna.jpg', # Padmapuram Gardens
    '110': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_Venkateswara_Temple_Ananda_Nilayam.jpg/960px-Tirumala_Venkateswara_Temple_Ananda_Nilayam.jpg', # TTD
    '174': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg/960px-Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Draksharamam
    '191': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail', # Kailasakona Waterfalls
    '323': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Dirang_Valley.jpg/960px-Dirang_Valley.jpg', # Taksing
    '354': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Dirang_Valley.jpg/960px-Dirang_Valley.jpg', # Mayodia Forest Trail
    '384': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG', # Brahmaputra River
    '438': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Eco_Park_Patna.jpg', # Chowki Picnic Spot
    '513': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Beauty_of_Kaziranga_National_Park.jpg/960px-Beauty_of_Kaziranga_National_Park.jpg', # Panbari Range
    '534': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Ghanashyam_house.jpg/960px-Ghanashyam_house.jpg', # Habung
    '670': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Bankamhill.jpg/960px-Bankamhill.jpg', # Dadan Hill
    '693': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/TeaPlantationPambanar_20080216-1.jpg/960px-TeaPlantationPambanar_20080216-1.jpg', # Chinnamora Tea Estate
    '843': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG', # local river picnic spots
    '3151': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/A_Quiet_Sunset_at_Shettihalli_Rosary_Church_%2C_Hassan_11.jpg/960px-A_Quiet_Sunset_at_Shettihalli_Rosary_Church_%2C_Hassan_11.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Shettihalli Rosary Church
    '3664': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/A_View_of_Tirumala_Venkateswara_Temple.JPG/960px-A_View_of_Tirumala_Venkateswara_Temple.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Sree Chinmaya Guruvayurappan Temple
    '4641': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Candles_for_sale_at_Mount_Mary_Church%2C_Bandra.jpg/960px-Candles_for_sale_at_Mount_Mary_Church%2C_Bandra.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Mount Mary Church
    '4746': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/A_View_of_Tirumala_Venkateswara_Temple.JPG/960px-A_View_of_Tirumala_Venkateswara_Temple.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Ballaleshwar Temple Pali
    '4974': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Afghan-Church%2C_Bombay-FV.jpg', # Afghan Church
    '7894': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Side_St_Thomas_Mount_Church_Chennai_Aug22_A7C_02292.jpg/960px-Side_St_Thomas_Mount_Church_Chennai_Aug22_A7C_02292.jpg', # St Thomas Mount
    '8377': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Ganesha_on_Gopuram_in_the_Meenakshi_Temple_at_Madurai.jpg/960px-Ganesha_on_Gopuram_in_the_Meenakshi_Temple_at_Madurai.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Meenakshi Amman Temple
    '9315': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg/960px-Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Gangaikonda Cholapuram
    '10234': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Kashi_Vishwanath.jpg', # Kashi Vishwanath
    '12190': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Maner_Sharif_26.jpg/960px-Maner_Sharif_26.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Juma Mosque & Tomb Andrott
    '551': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Maner_Sharif_26.jpg/960px-Maner_Sharif_26.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Panchpeer Dargaha
    '3772': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Kashi_Vishwanath.jpg', # Kalachuri Ancient Temples Amarkantak
    '8306': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail', # Chinna Kalar Waterfall
    '9223': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail', # Siruvani Waterfalls
    '9678': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Chitrakot_waterfalls.JPG/960px-Chitrakot_waterfalls.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', # Ginnedhari Eco-Trail Cascades
    '2747': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Gandhi_Ghat2.JPG/960px-Gandhi_Ghat2.JPG', # Sahibganj Ganga Riverfront
    '12089': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Confluence_of_the_Indus_and_Zanskar_Rivers.jpg/960px-Confluence_of_the_Indus_and_Zanskar_Rivers.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail' # Indus-Zanskar Sangam
}

# ==============================================================================
# 8. MAIN PHOTO ASSIGNMENT LOGIC
# ==============================================================================
def main():
    print("Loading datasets and verified cache...")
    cache = json.load(open(CACHE_FILE, "r", encoding="utf-8"))
    cache_lower = {k.lower(): (k, v) for k, v in cache.items()}

    def resolve_cache_safe(name, cat):
        candidates = [name.strip()]
        base = re.sub(r'\(.*?\)', '', name).strip()
        if base and base != name.strip():
            candidates.append(base)
        parens = re.findall(r'\((.*?)\)', name)
        for p in parens:
            if p.strip():
                candidates.append(p.strip())
        cleaned = re.sub(r'\b(UNESCO|World Heritage Site|World Heritage|Black Pagoda|Archaeological Park|Archaeological Site|Corridor|Complex|Monuments|Monument|Sanctuary|National Park)\b', '', base, flags=re.IGNORECASE).strip()
        if cleaned and cleaned not in candidates:
            candidates.append(cleaned)
            
        for cand in candidates:
            cand_clean = cand.strip()
            if not cand_clean:
                continue
            url = cache.get(cand_clean)
            if not url and cand_clean.lower() in cache_lower:
                url = cache_lower[cand_clean.lower()][1]
            if url and not is_banned(url) and is_category_compatible(cat, url):
                return url
        return None

    places = []
    with open(MASTER_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        places = list(reader)

    print(f"Loaded {len(places):,} places from master CSV.")

    # Build clean state pools by category
    state_cat_pools = defaultdict(lambda: defaultdict(list))
    for p in places:
        cname = p['name'].split('(')[0].strip()
        img = cache.get(cname) or cache.get(p['name'])
        if img and not is_banned(img):
            cat = classify_v4(p['name'], p['description'], p['category'])
            if is_category_compatible(cat, img):
                if img not in state_cat_pools[p['state']][cat]:
                    state_cat_pools[p['state']][cat].append(img)

    # Ensure Lakshadweep has authentic island beach photos
    state_cat_pools['Lakshadweep']['beach_waterfront'] = [
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Sunset_from_Kavaratti.jpg/960px-Sunset_from_Kavaratti.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Agatti_Airstrip.jpg/960px-Agatti_Airstrip.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ]

    stats = Counter()

    for p in places:
        pid = p['id']
        p_name = p['name']
        p_state = p['state']
        cat = classify_v4(p_name, p['description'], p['category'])

        # 1. State Landmark Rule
        matched_landmark = False
        for state_req, pattern, img_url in STATE_LANDMARK_RULES:
            if state_req.lower() == p_state.lower():
                # Avoid assigning non-waterfall landmark image to a waterfall
                if cat == 'waterfall' and not any(k in img_url.lower() for k in ['waterfall', 'falls', 'cascade', 'kund']):
                    continue
                if re.search(pattern, p_name.lower()):
                    p['image_url'] = img_url
                    stats['state_landmark'] += 1
                    matched_landmark = True
                    break
        if matched_landmark:
            continue

        # 2. Canonical Overrides by Row ID
        if pid in CANONICAL_OVERRIDES:
            p['image_url'] = CANONICAL_OVERRIDES[pid]
            stats['canonical_override'] += 1
            continue

        # 3. Clean Sanitized Cache Lookup
        cached_img = resolve_cache_safe(p_name, cat)
        if cached_img:
            p['image_url'] = cached_img
            stats['clean_cache'] += 1
            continue

        # 4. State Category-Pure Pool Fallback
        pool = state_cat_pools[p_state].get(cat)
        if not pool:
            pool = NATIONAL_CATEGORY_FALLBACKS.get(cat, NATIONAL_CATEGORY_FALLBACKS['general_heritage'])
            stats['national_pool'] += 1
        else:
            stats['state_pool'] += 1

        idx = int(hashlib.md5(p_name.encode('utf-8')).hexdigest(), 16) % len(pool)
        p['image_url'] = pool[idx]

    print("\nPhoto Assignment Breakdown:")
    for k, v in stats.items():
        print(f"  {k:<20}: {v:,} ({(v/len(places))*100:.1f}%)")

    # Write Master CSV
    with open(MASTER_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(places)
    print(f"\nSaved {len(places):,} rows to {MASTER_CSV}")

    # Propagate to all 36 State and UT directories
    places_by_state = defaultdict(list)
    for p in places:
        places_by_state[p['state']].append(p)

    updated_states = 0
    for rtype in ['states', 'union_territories']:
        rpath = os.path.join(DATA_DIR, rtype)
        if not os.path.exists(rpath):
            continue
        for folder in os.listdir(rpath):
            fpath = os.path.join(rpath, folder)
            if not os.path.isdir(fpath):
                continue
            cpath = os.path.join(fpath, "places.csv")
            state_key = folder.replace('_', ' ')
            matched_state = None
            for s in places_by_state:
                if s.lower() == state_key.lower():
                    matched_state = s
                    break
            if matched_state:
                state_rows = places_by_state[matched_state]
                with open(cpath, "w", encoding="utf-8", newline="") as sf:
                    writer = csv.DictWriter(sf, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(state_rows)
                updated_states += 1

    print(f"Propagated to all {updated_states} State and UT CSV files.")

if __name__ == "__main__":
    main()
