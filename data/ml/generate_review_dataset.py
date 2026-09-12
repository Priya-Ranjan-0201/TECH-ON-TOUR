"""
generate_review_dataset.py
Builds the 180-sample curated Indian travel review authenticity dataset with explicit ground-truth labels:
- is_genuine: 1 = genuine experiential review with concrete anchors, 0 = likely fake/generic/astroturfed
"""

import os
import pandas as pd

def get_labeled_reviews():
    # 1. Genuine Experiential Reviews (90 rich anchor + 18 borderline subtle) = 108
    genuine_samples = [
        # Rich Cultural & Heritage
        ("Amber Fort Sheesh Mahal mirror work was mesmerizing. Guide Ramesh explained the acoustic resonance of the royal courtyard.", 4.8, 1),
        ("Virupaksha Temple at 6am sunrise was ethereal. The Tungabhadra coracle ferry operator Suresh gave us fresh coconut water.", 4.9, 1),
        ("Kumbhalgarh fort wall walk is strenuous but worthwhile. Wear good hiking shoes as the ramparts get slippery after drizzle.", 4.5, 1),
        ("Meenakshi Temple thousand pillar hall has sublime stone acoustics. Strictly deposit mobile phones at the east tower locker.", 4.7, 1),
        ("Bundi stepwells are architectural marvels. Raniji ki Baori had intricate elephant carvings, though water levels were low in June.", 4.4, 1),
        ("Chittorgarh Vijay Stambh climb had narrow spiral stairs. The view of Rajputana plains from the 9th floor was unforgettable.", 4.6, 1),
        ("Gwalior Fort Mansingh Palace turquoise tiles are still vibrant after centuries. Sound and light show in evening was worth Rs 250.", 4.5, 1),
        ("Konark Sun Temple wheel stone carvings are exquisite sundials. Our ASI approved guide Manoranjan helped us read the solar time.", 4.8, 1),
        ("Orchha Jahangir Mahal cenotaphs overlooking the Betwa river at dusk were peaceful. Rent a bicycle from the square for Rs 100.", 4.6, 1),
        ("Fatehpur Sikri Buland Darwaza is colossal. Beware of unauthorized guides at the shoe stand; hire only ASI badge holders.", 4.2, 1),
        
        # Homestays & Eco-Tourism
        ("Stayed at Auntie Kamla's apple orchard cottage in Jibhi. Homemade Siddu with local ghee and walnut chutney was heaven.", 4.9, 1),
        ("PM-JUGA tribal eco-nest in Bastar was tranquil. Sukru showed us traditional Dhokra bell-metal casting over an open charcoal fire.", 5.0, 1),
        ("Cedarwood houseboat in Dal Lake Srinagar. Ghulam heated the Kangri basket for our bedroom and served cardamom-scented Kahwa.", 4.9, 1),
        ("Spiti valley homestay in Kaza run by Tenzin. Solar heated water worked well between 11am-2pm, and barley porridge was hearty.", 4.7, 1),
        ("Coffee plantation stay in Coorg. Host Bopanna took us on a 7am birding walk where we spotted Malabar grey hornbills.", 4.8, 1),
        ("Wayanad treehouse homestay amidst pepper vines. River stream was 50 meters away; peaceful sleep with sounds of cicadas.", 4.6, 1),
        ("Traditional Thar desert mud hut near Khuri village. No commercial DJs, just camel cart ride with Omji and folk songs under stars.", 4.8, 1),
        ("Dooars forest fringe cottage near Gorumara. Rhinoceros grazing near the watchtower at 6:30am was breathtaking.", 4.7, 1),
        ("Tirthan valley riverside homestay. Rajender arranged our Great Himalayan National Park day permit for the waterfall hike.", 4.9, 1),
        ("Ziro valley Apatani homestay in Hong village. Grandma Yamang shared smoked pork with bamboo shoot and demonstrated handloom weaving.", 4.8, 1),
        
        # Nuanced & Realistic Reviews with Critical Feedback
        ("Room 302 had a brilliant view of Kanchenjunga sunrise, but the geyser took 20 minutes to heat up in Darjeeling winter.", 4.0, 1),
        ("Food at the rooftop cafe overlooking Varanasi ghats was delicious (try the apple crumble), but lane access is narrow for luggage.", 4.1, 1),
        ("Alleppey backwater cruise was relaxing with fresh pearl spot fish curry, though evening mosquitoes near paddy fields were annoying.", 4.2, 1),
        ("Rishikesh yoga ashram stay on Laxman Jhula road. Clean satvik thali meals, but morning gong rings sharp at 5:30am.", 4.3, 1),
        ("Pondicherry French quarter villa. Loved the high ceilings and filter coffee, but parking a four-wheeler on Rue Suffren was tough.", 4.0, 1),
        ("Gokarna Kudle beach shack. Hammock and wood-fired pizza were great, though Wi-Fi was spotty during evening power cuts.", 3.9, 1),
        ("Shillong Police Bazar heritage lodge. Cozy pine wood paneling, but city traffic noise reached room 104 during rush hours.", 3.8, 1),
        ("Udaipur Pichola view haveli. Courtyard dinner was romantic with sitar performance, but bathroom tiles needed regrouting.", 3.9, 1),
        ("Munnar tea estate bungalow. Walking through tea bushes with manager Thomas was fantastic, but cellular network had zero signal.", 4.0, 1),
        ("Mahabalipuram shore temple trip. Stone chariot carvings are magnificent, but afternoon coastal humidity was exhausting. Carry water.", 4.2, 1),
    ]

    # Anchored regional samples
    cities_anchors = [
        ("Pushkar", "Brahma temple lake stairs", "sweet rabdi malpua at Halwai Gali", 4.6),
        ("Majuli", "Kamalabari Satra monk dance", "earthen pottery workshop with local artisans", 4.8),
        ("Chettinad", "100-year-old teak wood mansion", "spicy pepper chicken served on plantain leaf", 4.7),
        ("Kutch", "White Rann salt desert at full moon", "Rogan art demonstration in Nirona village", 4.9),
        ("Almora", "Binsar wildlife sanctuary ridge walk", "traditional Bal Mithai from Mohan Singh sweet shop", 4.5),
        ("Varkala", "North cliff sunset walk", "grilled red snapper at Tibetan cafe", 4.4),
        ("Dharamsala", "Norbulingka institute thangka painting", "steamed momos at McLeod Ganj square", 4.7),
        ("Bishnupur", "terracotta carvings at Rasmancha", "Baluchari silk saree weaving demonstration", 4.6),
        ("Mandu", "Jahaz Mahal floating palace architecture", "baobab fruit sherbet near Delhi gate", 4.5),
        ("Pelling", "Pemayangtse monastery butter lamps", "panoramic view of Mt Pandim from hotel terrace", 4.8),
        ("Kumbakonam", "Airavatesvara temple musical stairs", "brass vessel market and degree filter coffee", 4.7),
        ("Chopta", "Tungnath temple trek through rhododendron forest", "camping under clear Milky Way sky", 4.9),
        ("Kumarakom", "Vembanad lake bird sanctuary canoe ride", "Karimeen pollichathu with red rice", 4.6),
        ("Shekhawati", "fresco havelis in Mandawa", "camel ride along sandy village lanes", 4.4),
        ("Dhanushkodi", "ghost town church ruins", "meeting sea shell craftsmen at Ram Setu point", 4.5),
        ("Kinnaur", "Kalpa Apple orchards facing Kinner Kailash", "wooden pagoda temple architecture", 4.8),
        ("Lonar", "meteorite impact crater lake walk", "peacock sightings along saline lake rim", 4.4),
        ("Badami", "cave temple monolithic rock carvings", "sunset over Agastya lake and Bhutanatha temple", 4.7),
        ("Lepakshi", "hanging pillar architectural mystery", "massive Nandi bull monolithic granite statue", 4.6),
        ("Panchmarhi", "Bee falls cascading water pool", "Dhoopgarh sunset view point over Satpura forest", 4.5),
    ]

    for city, f1, f2, r in cities_anchors:
        genuine_samples.append((
            f"Our visit to {city} was deeply enriching. We spent hours experiencing the {f1}, followed by {f2}. Highly authentic local hospitality.",
            r, 1
        ))
        genuine_samples.append((
            f"Staying near {city} was peaceful. We particularly appreciated the {f1}. Road connectivity had potholes, but the {f2} made it worthwhile.",
            round(r - 0.3, 1), 1
        ))
        genuine_samples.append((
            f"Room 201 had a direct view of {city} surroundings. Mohan arranged our excursion to {f1}. Breakfast featured fresh {f2}.",
            round(r + 0.1, 1), 1
        ))

    # Borderline short genuine reviews (natural noisy user writing)
    short_genuine = [
        ("Clean room and comfortable bed. Ramesh was helpful.", 4.5, 1),
        ("Great stay at the tea estate. Beautiful morning mist.", 4.5, 1),
        ("Good heritage haveli. Sitar music in evening was lovely.", 4.0, 1),
        ("Loved our stay! The orchard was blooming and peaceful!", 4.8, 1),
        ("Nice quiet place near the waterfall. Host was kind.", 4.2, 1),
        ("Authentic tribal village feel. Very simple food.", 4.0, 1),
        ("Peaceful temple darshan at 7am. Clean premises.", 4.5, 1),
        ("Good view of the river from our balcony.", 4.0, 1),
        ("Friendly homestay family and tasty home cooked thali.", 4.5, 1),
        ("Quiet retreat away from the crowds. Good library.", 4.2, 1),
        ("Nice hot water and cozy blankets for mountain winter.", 4.0, 1),
        ("Simple clean place. Guide Sunita was very polite.", 4.3, 1),
        ("Lovely courtyard dinner with folk dance. Nice tea.", 4.4, 1),
        ("Scenic location by the pine woods. Reasonable rates.", 4.1, 1),
        ("Clean linen, good breakfast, easy check-in process.", 4.2, 1),
        ("Calm atmosphere and great view of the valley at sunset.", 4.6, 1),
        ("Homestay owner helped with cab booking. Good stay.", 4.0, 1),
        ("Historic property with lots of character. Decent food.", 4.1, 1),
    ]
    genuine_samples.extend(short_genuine)
    genuine_samples = genuine_samples[:108]

    # 2. Fake / Generic / Astroturfed Reviews (72 samples)
    fake_samples = [
        # Stock promotional clichés
        ("Great place! Highly recommend to everyone. Will visit again for sure! Awesome experience!", 5.0, 0),
        ("Best hotel ever! Five stars! Value for money and superb hospitality! Loved it!", 5.0, 0),
        ("Nice stay. Good hotel. Friendly staff and clean rooms. Definitely recommend.", 5.0, 0),
        ("Awesome place to stay! Superb hospitality and great food. Must visit place with family!", 5.0, 0),
        ("Very nice location and friendly staff. Clean rooms and worth every penny. Five stars!", 5.0, 0),
        ("Had a great time! Loved it! Best experience ever in India! Superb hotel!", 5.0, 0),
        ("Excellent service, good hotel, nice stay, definitely recommend to all tourists!", 5.0, 0),
        ("Best stay of my life! Value for money! Clean rooms and friendly staff! Must visit!", 5.0, 0),
        ("Awesome place! Great hospitality! Will visit again next year! Highly recommend!", 5.0, 0),
        ("Nice location, good food, superb rooms, very friendly staff. 5/5 stars!", 5.0, 0),
        
        # Rating-Sentiment Mismatches
        ("The room was smelling like sewage and AC was leaking on the bed all night. Bedbugs everywhere.", 5.0, 0),
        ("Worst experience of my life. Manager shouted at us and demanded extra cash at checkout. Complete scam.", 5.0, 0),
        ("No running water in bathroom for 12 hours. Bed sheets had yellow stains and food was stale.", 5.0, 0),
        ("Terrible hotel, noisy road, broken furniture and unhygienic kitchen. Avoid at all costs.", 5.0, 0),
        ("Absolutely magical stay! The heritage rooms and morning flute music were heavenly. Loved every second.", 1.0, 0),
        ("Unbelievable mountain views, delicious organic food, and warm hospitable family. A true paradise on earth.", 1.0, 0),
        ("The sunrise over the temple towers was divine. Clean and peaceful ambiance, will cherish forever.", 1.0, 0),
        
        # Promotional / Astroturfing Links & Phones
        ("Contact Ramesh on 9876543210 on WhatsApp for 40% discount on luxury palace bookings! Click link!", 5.0, 0),
        ("Best homestay deal in town! Call now on 9123456789 or visit bit.ly/cheap-homestay for promo code!", 5.0, 0),
        ("Earn crypto while traveling in India! Download app from bit.ly/travel-coin and get free Rs 500!", 5.0, 0),
        ("Call Rohit travel agency for best rates on taxi and hotel! Lowest prices guaranteed in North India!", 5.0, 0),
        
        # Astroturfing attempts that mimic specificity
        ("Very good stay in room 101. Best hotel in town! Highly recommend.", 5.0, 0),
        ("Manager Suresh is great. Best place ever in the city! Must visit!", 5.0, 0),
        ("Loved the tea and breakfast. Superb hospitality and awesome stay!", 5.0, 0),
        ("Nice haveli stay. Clean room, friendly staff, definitely recommend.", 5.0, 0),
        ("Great hotel near temple. Value for money and superb experience!", 5.0, 0),
        ("Room was clean and spacious. Good food and nice staff. Five stars!", 5.0, 0),
        ("Beautiful mountain view! Great place to stay with family! Superb!", 5.0, 0),
        ("Nice location near lake. Clean rooms and friendly service. Loved it!", 5.0, 0),
        ("Room was decent. Good hotel, definitely recommend for value for money.", 5.0, 0),
        ("Nice view of the lake. Best stay ever! Clean rooms and friendly staff.", 5.0, 0),
        
        # Excessive Punctuation / Low Effort Shouts
        ("VERY VERY GOOD PLACE!!!!!!!! BEST EVER IN INDIA!!!!!!!! FIVE STARS!!!!!!!!", 5.0, 0),
        ("WOW WOW WOW!!!!!!!! AMAZING EXPERIENCE!!!!!!!! VISIT VISIT VISIT!!!!!!!!", 5.0, 0),
        ("SUPERB!!!!!!!! SUPERB!!!!!!!! BEST STAY EVER!!!!!!!!", 5.0, 0),
        ("Good.", 5.0, 0),
        ("Nice.", 5.0, 0),
        ("Super.", 5.0, 0),
        ("Ok ok.", 3.0, 0),
        ("Fine place.", 4.0, 0),
        ("Average.", 3.0, 0),
    ]

    # Remaining generic fillers
    generic_templates = [
        "Great place to visit. Friendly staff and good food. Value for money. Highly recommend.",
        "Very nice hotel. Clean rooms and superb hospitality. Will visit again for sure.",
        "Awesome stay with family. Best hotel in the area. Superb location and nice ambiance.",
        "Loved the experience! Highly recommend to everyone looking for value for money.",
        "Good hotel, good staff, good location, good food. Five stars all the way.",
        "Best ever experience! Everything was top notch and superb. Must visit!",
        "Definitely recommend this place. Friendly staff, nice rooms, good amenities.",
        "Had a wonderful time. Superb hospitality and awesome food. Will visit again.",
        "Nice stay with friends. Clean rooms and helpful staff. Worth every penny.",
        "Very good hotel. Value for money and great location. Definitely recommend.",
        "Superb place! Loved it! Best hospitality and clean rooms! Must visit!",
        "Awesome location, friendly staff, great food. Had a great time here."
    ]

    for t in generic_templates:
        fake_samples.append((t, 5.0, 0))
        fake_samples.append((t.replace("hotel", "homestay").replace("rooms", "cottages"), 5.0, 0))
        fake_samples.append((t.replace("Five stars", "Loved it") + " Highly recommend!", 4.5, 0))

    fake_samples = fake_samples[:72]

    # Combine all 180 reviews
    all_data = []
    for text, rating, is_gen in genuine_samples:
        all_data.append({
            "review_text": text,
            "rating": float(rating),
            "is_genuine": int(is_gen)
        })
    for text, rating, is_gen in fake_samples:
        all_data.append({
            "review_text": text,
            "rating": float(rating),
            "is_genuine": int(is_gen)
        })

    df = pd.DataFrame(all_data)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(current_dir, "review_authenticity_dataset.csv")
    df = get_labeled_reviews()
    df.to_csv(out_path, index=False)
    print(f"[✓] Successfully generated {len(df)} labeled reviews saved to: {out_path}")
    print(f"    Genuine reviews (1): {(df['is_genuine'] == 1).sum()} ({(df['is_genuine'] == 1).mean()*100:.1f}%)")
    print(f"    Fake/generic reviews (0): {(df['is_genuine'] == 0).sum()} ({(df['is_genuine'] == 0).mean()*100:.1f}%)")
