import csv
import sys
import time
import asyncio
from pathlib import Path
from typing import List, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend root is on Python path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.database.connection import engine, async_session_maker, init_db
from app.database.models import (
    DestinationMaster, 
    Homestay, 
    Guide, 
    AntiOvertourismPair, 
    ReviewTraining
)
from sqlalchemy import select, func, delete


CSV_PATH = backend_root.parent / "data" / "places.csv"
if not CSV_PATH.exists():
    CSV_PATH = backend_root.parent / "Tech-On-Tour" / "data" / "places.csv"


# Curated Anti-Overtourism Alternate Circuits
ANTI_OVERTOURISM_DATA = [
    {
        "popular_name": "Manali",
        "popular_state": "Himachal Pradesh",
        "popular_footfall_annual": "High (3.8M+)",
        "alternative_name": "Tirthan Valley",
        "alternative_state": "Himachal Pradesh",
        "crowd_reduction_pct": 65,
        "reason": "UNESCO Great Himalayan National Park gateway, pristine trout rivers, uncommercialized wooden homestays, and zero traffic congestion."
    },
    {
        "popular_name": "Shimla",
        "popular_state": "Himachal Pradesh",
        "popular_footfall_annual": "High (4.2M+)",
        "alternative_name": "Chail",
        "alternative_state": "Himachal Pradesh",
        "crowd_reduction_pct": 70,
        "reason": "World's highest cricket ground, dense pine and deodar forests, peaceful heritage palace walks, 70% fewer tourists than Mall Road."
    },
    {
        "popular_name": "Ooty",
        "popular_state": "Tamil Nadu",
        "popular_footfall_annual": "High (3.5M+)",
        "alternative_name": "Valparai",
        "alternative_state": "Tamil Nadu",
        "crowd_reduction_pct": 75,
        "reason": "Anamalai Tiger Reserve circuit, endless emerald tea estates, lion-tailed macaque sightings, zero plastic pollution."
    },
    {
        "popular_name": "Munnar",
        "popular_state": "Kerala",
        "popular_footfall_annual": "High (2.9M+)",
        "alternative_name": "Vagamon",
        "alternative_state": "Kerala",
        "crowd_reduction_pct": 60,
        "reason": "Pine forests, misty meadows, green tea valleys with 60% less tourist traffic and authentic spice farm stays."
    },
    {
        "popular_name": "Goa (North)",
        "popular_state": "Goa",
        "popular_footfall_annual": "High (8.0M+)",
        "alternative_name": "Gokarna",
        "alternative_state": "Karnataka",
        "crowd_reduction_pct": 55,
        "reason": "Pristine cliffside beaches (Om Beach, Kudle), spiritual ancient temples, unpolluted waters, and community-run beach shacks."
    },
    {
        "popular_name": "Agra",
        "popular_state": "Uttar Pradesh",
        "popular_footfall_annual": "High (7.5M+)",
        "alternative_name": "Orchha",
        "alternative_state": "Madhya Pradesh",
        "crowd_reduction_pct": 80,
        "reason": "Magnificent 16th-century Bundela cenotaphs along Betwa River, zero touts, intact medieval murals, immersive rural culture."
    },
    {
        "popular_name": "Jaipur",
        "popular_state": "Rajasthan",
        "popular_footfall_annual": "High (5.1M+)",
        "alternative_name": "Bundi",
        "alternative_state": "Rajasthan",
        "crowd_reduction_pct": 70,
        "reason": "Stunning blue houses, intact Taragarh Fort with authentic Rajput miniature frescoes, stepwells, and zero commercial overcrowding."
    },
    {
        "popular_name": "Rishikesh",
        "popular_state": "Uttarakhand",
        "popular_footfall_annual": "High (4.0M+)",
        "alternative_name": "Chopta",
        "alternative_state": "Uttarakhand",
        "crowd_reduction_pct": 70,
        "reason": "Mini Switzerland of India, gateway to ancient Tungnath temple trek, alpine bugyals, and peaceful stargazing retreats."
    }
]

# PM-JUGA Tribal Homestays Seed Data
TRIBAL_HOMESTAYS_DATA = [
    {
        "host_id": "host-juga-001",
        "host_name": "Somaru Mandavi",
        "host_phone": "+91 94252 87101",
        "title": "Bastar Dhokra Craft & Forest Homestay",
        "description": "Authentic tribal homestay run by Maria artisans. Experience hands-on bell-metal (Dhokra) craft workshops, forest-foraged meals, and traditional bamboo cottage living under the PM-JUGA scheme.",
        "state": "Chhattisgarh",
        "district": "Bastar",
        "base_price_inr": 1250.00,
        "is_tribal_pmjuga": True,
        "sanitation_trust_score": 94,
        "is_verified": True,
        "latitude": 19.0748,
        "longitude": 81.9560,
        "amenities": "Solar Powered, Private Washroom, Traditional Bastar Thali, Artisan Workshop",
        "image_url": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&auto=format&fit=crop"
    },
    {
        "host_id": "host-juga-002",
        "host_name": "Bimla Bai",
        "host_phone": "+91 94252 87102",
        "title": "Chitrakote Falls Tribal Eco-Nest",
        "description": "Perched 2 km from India's Niagara (Chitrakote Falls). Enjoy night folk music (Gendi dance), organic millets (Kodo-Kutki), and zero-plastic eco-tourism.",
        "state": "Chhattisgarh",
        "district": "Bastar",
        "base_price_inr": 1400.00,
        "is_tribal_pmjuga": True,
        "sanitation_trust_score": 91,
        "is_verified": True,
        "latitude": 19.2014,
        "longitude": 81.7056,
        "amenities": "River View, Fresh Organic Meals, Local Guide Included, Solar Water Heater",
        "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop"
    },
    {
        "host_id": "host-juga-003",
        "host_name": "Mallikarjunppa K.",
        "host_phone": "+91 98451 23091",
        "title": "Anegundi Kishkindha Rural Heritage Stay",
        "description": "Ancient mythological monkey kingdom village across the Tungabhadra river from Hampi. Banana fiber craft immersion and farm-to-table Karnataka meals.",
        "state": "Karnataka",
        "district": "Koppal",
        "base_price_inr": 1600.00,
        "is_tribal_pmjuga": True,
        "sanitation_trust_score": 95,
        "is_verified": True,
        "latitude": 15.3486,
        "longitude": 76.4950,
        "amenities": "Bicycle Rental, Traditional Courtyard, Organic Mango Grove, Coracle Ride",
        "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop"
    },
    {
        "host_id": "host-juga-004",
        "host_name": "Tenzin Norbu",
        "host_phone": "+91 94180 77312",
        "title": "Spiti Valley High Altitude Mud Retreat",
        "description": "Traditional solar-passive mud architecture in Langza village beneath Chau Chau Kang Nilda peak. Warm bukhari heaters, seabuckthorn tea, and fossil expeditions.",
        "state": "Himachal Pradesh",
        "district": "Lahaul and Spiti",
        "base_price_inr": 1800.00,
        "is_tribal_pmjuga": True,
        "sanitation_trust_score": 89,
        "is_verified": True,
        "latitude": 32.2612,
        "longitude": 78.0772,
        "amenities": "Heated Bukhari, Traditional Tibetan Kitchen, Stargazing Telescope, Oxygen Kit",
        "image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"
    },
    {
        "host_id": "host-juga-005",
        "host_name": "Raman Kurichiya",
        "host_phone": "+91 94471 66205",
        "title": "Wayanad Kurichiya Tribal Sanctuary",
        "description": "Nestled in the misty Western Ghats. Discover indigenous archery, medicinal herb trails, stingless bee honey, and bamboo cottage stays.",
        "state": "Kerala",
        "district": "Wayanad",
        "base_price_inr": 1750.00,
        "is_tribal_pmjuga": True,
        "sanitation_trust_score": 96,
        "is_verified": True,
        "latitude": 11.6854,
        "longitude": 76.1320,
        "amenities": "Ayurvedic Garden, Forest Trek, Pure Spring Water, Fireplace",
        "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop"
    }
]

# Certified Vocal-for-Local Guides
LOCAL_GUIDES_DATA = [
    {
        "user_id": "guide-001",
        "full_name": "Suresh Kumar Baghel",
        "phone_number": "+91 94252 44310",
        "state": "Chhattisgarh",
        "district": "Bastar",
        "specialization_tags": "tribal_art,heritage,caves,forest_craft",
        "license_number": "CG-TOU-2024-819",
        "hourly_rate_inr": 250.00,
        "languages_spoken": "Hindi, Gondi, Halbi, English",
        "rating": 4.95,
        "latitude": 19.0748,
        "longitude": 81.9560,
        "is_available": True
    },
    {
        "user_id": "guide-002",
        "full_name": "Prakash Gowda",
        "phone_number": "+91 98451 99201",
        "state": "Karnataka",
        "district": "Bellary",
        "specialization_tags": "unesco_heritage,architecture,mythology",
        "license_number": "KA-TOU-2023-412",
        "hourly_rate_inr": 350.00,
        "languages_spoken": "Kannada, Hindi, English, Telugu",
        "rating": 4.90,
        "latitude": 15.3350,
        "longitude": 76.4600,
        "is_available": True
    },
    {
        "user_id": "guide-003",
        "full_name": "Dorje Tenzin",
        "phone_number": "+91 94180 33811",
        "state": "Himachal Pradesh",
        "district": "Lahaul and Spiti",
        "specialization_tags": "buddhist_monasteries,fossils,high_altitude_treks",
        "license_number": "HP-TOU-2022-105",
        "hourly_rate_inr": 400.00,
        "languages_spoken": "Hindi, Tibetan, English",
        "rating": 4.98,
        "latitude": 32.2461,
        "longitude": 78.0349,
        "is_available": True
    }
]

# Pre-computed Reviews (Trust Layer with DistilBERT Scores)
PRECOMPUTED_REVIEWS_DATA = [
    {
        "place_id": 1,
        "author_name": "Ananya Sen (Kolkata)",
        "rating": 5.0,
        "review_text": "An absolute treasure of Pallava and Chola sculptures! The curation is immaculate, with rich multilingual placards. Very peaceful and completely uncrowded in the morning.",
        "sentiment_score": 0.982,
        "authenticity_score": 96,
        "is_verified_booking": True
    },
    {
        "place_id": 1,
        "author_name": "Col. R. K. Nair",
        "rating": 4.5,
        "review_text": "A must-visit for students of Indian architecture. The bronze galleries are world-class. Well maintained by the state archaeological survey.",
        "sentiment_score": 0.924,
        "authenticity_score": 92,
        "is_verified_booking": True
    },
    {
        "place_id": 3,
        "author_name": "Deepak Patel (Ahmedabad)",
        "rating": 4.8,
        "review_text": "Chandragiri Fort offers an incredible evening light and sound show. The Indo-Saracenic Raja Mahal architecture is majestic. Superb views of the valley!",
        "sentiment_score": 0.965,
        "authenticity_score": 94,
        "is_verified_booking": True
    }
]


async def seed_all():
    print("=" * 65)
    print("🌿 TravelSathi Master Data Seeding Pipeline Starting...")
    print("=" * 65)

    if not CSV_PATH.exists():
        print(f"❌ Error: places.csv not found at {CSV_PATH}")
        sys.exit(1)

    # 1. Initialize Tables
    print("\n📦 Step 1: Initializing database tables...")
    await init_db()
    print("   ✓ All SQLAlchemy tables and spatial indexes initialized.")

    start_time = time.time()

    async with async_session_maker() as session:
        # Check if already seeded
        res = await session.execute(select(func.count()).select_from(DestinationMaster))
        existing_count = res.scalar() or 0

        if existing_count >= 12290:
            print(f"\n⚡ destinations_master already contains {existing_count} records. Skipping CSV re-import.")
        else:
            print(f"\n📂 Step 2: Reading {CSV_PATH}...")
            destinations: List[DestinationMaster] = []
            
            with open(CSV_PATH, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        dest = DestinationMaster(
                            id=int(row["id"]),
                            name=row["name"].strip(),
                            state=row["state"].strip(),
                            category=row["category"].strip().lower(),
                            latitude=float(row["latitude"]),
                            longitude=float(row["longitude"]),
                            price_range=row.get("price_range", "mid").strip().lower(),
                            rating=float(row.get("rating", 4.0)),
                            review_count=int(row.get("review_count", 0)),
                            description=row.get("description", "").strip(),
                            best_season=row.get("best_season", "All Year").strip(),
                            image_url=row.get("image_url", "").strip(),
                            is_hidden_gem=False,
                            crowd_density_score=50,
                            safety_score=85
                        )
                        destinations.append(dest)
                    except Exception as parse_err:
                        print(f"   ⚠️ Skipping invalid row {row.get('id')}: {parse_err}")

            print(f"   ✓ Read {len(destinations)} records from CSV.")
            print(f"\n🚀 Step 3: Batch ingesting {len(destinations)} records into destinations_master...")

            # Clean existing records if partial
            if existing_count > 0:
                await session.execute(delete(DestinationMaster))

            batch_size = 1000
            for i in range(0, len(destinations), batch_size):
                chunk = destinations[i:i + batch_size]
                session.add_all(chunk)
                await session.flush()
                print(f"   -> Inserted records {i+1} to {min(i + batch_size, len(destinations))}...")

            await session.commit()
            print(f"   ✓ Ingested all {len(destinations)} destinations in {time.time() - start_time:.2f}s.")

        # 4. Seed Anti-Overtourism Alternate Pairs
        print("\n🔀 Step 4: Seeding Anti-Overtourism Curated Pairs...")
        await session.execute(delete(AntiOvertourismPair))
        for pair in ANTI_OVERTOURISM_DATA:
            p = AntiOvertourismPair(**pair)
            session.add(p)
        await session.commit()
        print(f"   ✓ Seeded {len(ANTI_OVERTOURISM_DATA)} anti-overtourism alternative circuits.")

        # 5. Seed PM-JUGA Tribal Homestays
        print("\n🏡 Step 5: Seeding PM-JUGA Tribal Homestays...")
        await session.execute(delete(Homestay))
        for h in TRIBAL_HOMESTAYS_DATA:
            homestay = Homestay(**h)
            session.add(homestay)
        await session.commit()
        print(f"   ✓ Seeded {len(TRIBAL_HOMESTAYS_DATA)} PM-JUGA tribal certified homestays.")

        # 6. Seed Certified Local Guides
        print("\n🧭 Step 6: Seeding Vocal-for-Local Certified Tour Guides...")
        await session.execute(delete(Guide))
        for g in LOCAL_GUIDES_DATA:
            guide = Guide(**g)
            session.add(guide)
        await session.commit()
        print(f"   ✓ Seeded {len(LOCAL_GUIDES_DATA)} certified tour guides.")

        # 7. Seed Pre-Computed Reviews (Trust Layer)
        print("\n⭐ Step 7: Seeding Pre-Computed Review Sentiment Trust Layer...")
        await session.execute(delete(ReviewTraining))
        for r in PRECOMPUTED_REVIEWS_DATA:
            review = ReviewTraining(**r)
            session.add(review)
        await session.commit()
        print(f"   ✓ Seeded {len(PRECOMPUTED_REVIEWS_DATA)} pre-computed verified reviews.")

        # 8. Verification Checks
        print("\n" + "=" * 65)
        print("🔍 Step 8: Running Database Integrity Audit...")
        
        count_res = await session.execute(select(func.count()).select_from(DestinationMaster))
        total_dest = count_res.scalar()

        null_coords_res = await session.execute(
            select(func.count()).select_from(DestinationMaster).where(
                (DestinationMaster.latitude == None) | (DestinationMaster.longitude == None)
            )
        )
        null_coords = null_coords_res.scalar()

        homestay_count_res = await session.execute(select(func.count()).select_from(Homestay))
        total_homestays = homestay_count_res.scalar()

        guide_count_res = await session.execute(select(func.count()).select_from(Guide))
        total_guides = guide_count_res.scalar()

        print(f"   • Total Master Destinations: {total_dest} (Expected: 12,293+)")
        print(f"   • Records with Null Coordinates: {null_coords} (Expected: 0)")
        print(f"   • PM-JUGA Tribal Homestays: {total_homestays}")
        print(f"   • Certified Local Guides: {total_guides}")
        print("=" * 65)

        if total_dest >= 12290 and null_coords == 0:
            print("🎉 PHASE 1 DATABASE BOOTSTRAP & SEEDING COMPLETED SUCCESSFULLY!")
        else:
            print("⚠️ Warning: Seeding did not match expected counts.")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(seed_all())
