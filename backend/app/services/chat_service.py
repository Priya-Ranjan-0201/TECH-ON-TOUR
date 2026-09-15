import asyncio
import json
import logging
import math
import uuid
from typing import Dict, List, Optional, Tuple

import httpx
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.models import AntiOvertourismPair, DestinationMaster, Homestay
from app.schemas.chat import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ReferencedPOI,
    SuggestedPrompt,
)

logger = logging.getLogger(__name__)

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

CITY_COORDINATES = {
    "delhi": (28.6139, 77.2090), "new delhi": (28.6139, 77.2090), "ncr": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777), "bombay": (19.0760, 72.8777),
    "bengaluru": (12.9716, 77.5946), "bangalore": (12.9716, 77.5946),
    "kolkata": (22.5726, 88.3639), "calcutta": (22.5726, 88.3639),
    "chennai": (13.0827, 80.2707), "madras": (13.0827, 80.2707),
    "hyderabad": (17.3850, 78.4867),
    "jaipur": (26.9124, 75.7873),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "chandigarh": (30.7333, 76.7794),
    "shimla": (31.1048, 77.1734),
    "manali": (32.2432, 77.1892),
    "kochi": (9.9312, 76.2673), "cochin": (9.9312, 76.2673),
    "goa": (15.2993, 74.1240),
    "varanasi": (25.3176, 82.9739),
    "lucknow": (26.8467, 80.9462),
    "dehradun": (30.3165, 78.0322),
    "rishikesh": (30.0869, 78.2676),
    "guwahati": (26.1445, 91.7362),
    "bhubaneswar": (20.2961, 85.8245),
}

# Pre-compiled multi-lingual prompts and responses
LOCALIZED_INITIAL_PROMPTS = {
    "en": [
        {
            "id": "p1",
            "label": "🏡 Verified Community Homestays",
            "query": "Tell me about verified community homestays in Bastar and how to book them.",
        },
        {
            "id": "p2",
            "label": "🌲 Anti-Overtourism Gems",
            "query": "Suggest peaceful hidden gem alternatives to congested Manali and Shimla.",
        },
        {
            "id": "p3",
            "label": "💳 Zero-Commission DPI",
            "query": "How does TravelSathi save 18% to 30% OTA commissions for travelers and local hosts?",
        },
        {
            "id": "p4",
            "label": "🏰 Amber Fort Timings & Fees",
            "query": "What are the entry timings, ticket fees, and local tips for Amber Fort in Jaipur?",
        },
    ],
    "hi": [
        {
            "id": "p1",
            "label": "🏡 प्रमाणित समुदाय होमस्टे",
            "query": "बस्तर में प्रमाणित समुदाय होमस्टे के बारे में बताएं और बुकिंग कैसे करें?",
        },
        {
            "id": "p2",
            "label": "🌲 शांतिपूर्ण छिपे हुए स्थल",
            "query": "मनाली और शिमला की भीड़भाड़ से दूर शांत और खूबसूरत पर्यटन स्थल सुझाएं।",
        },
        {
            "id": "p3",
            "label": "💳 शून्य कमीशन डीपीआई प्रणाली",
            "query": "ट्रैवल्सार्थी 18% से 30% ओटीए कमीशन कैसे बचाता है और स्थानीय लोगों को लाभ कैसे देता है?",
        },
        {
            "id": "p4",
            "label": "🏰 आमेर किला समय व टिकट",
            "query": "जयपुर के आमेर किले के खुलने का समय, टिकट शुल्क और स्थानीय सुझाव क्या हैं?",
        },
    ],
    "bn": [
        {
            "id": "p1",
            "label": "🏡 প্রত্যয়িত সম্প্রদায়ের হোমস্টে",
            "query": "বস্তারের প্রত্যয়িত সম্প্রদায়ের হোমস্টে সম্পর্কে তথ্য দিন।",
        },
        {
            "id": "p2",
            "label": "🌲 ভিড়মুক্ত লুকানো পর্যটন কেন্দ্র",
            "query": "মানালির ভিড় এড়িয়ে মনোরম শান্ত বিকল্প গন্তব্য জানান।",
        },
        {
            "id": "p3",
            "label": "💳 শূন্য কমিশন সিস্টেম",
            "query": "ট্রাভেলসাথী কীভাবে ১৮% থেকে ৩০% ওটিএ কমিশন সাশ্রয় করে?",
        },
    ],
    "ta": [
        {
            "id": "p1",
            "label": "🏡 சரிபார்க்கப்பட்ட சமூக தங்குமிடம்",
            "query": "பஸ்தாரில் உள்ள பழங்குடியினர் நல்வாழ்வு தங்குமிடங்கள் பற்றி கூறவும்.",
        },
        {
            "id": "p2",
            "label": "🌲 அமைதியான மாற்று சுற்றுலா இடங்கள்",
            "query": "மணாலிக்கு மாற்றாக அமைதியான மலைப்பகுதி தலங்களை பரிந்துரைக்கவும்.",
        },
        {
            "id": "p3",
            "label": "💳 பூஜ்ஜிய கமிஷன் அமைப்பு",
            "query": "ட்ராவல்சாதி எவ்வாறு 18% கமிஷனை சேமிக்கிறது?",
        },
    ],
    "te": [
        {
            "id": "p1",
            "label": "🏡 ధృవీకరించబడిన కమ్యూనిటీ హోమ్‌స్టేలు",
            "query": "బస్తర్‌లోని గిరిజన హోమ్‌స్టేల వివరాలు మరియు బుకింగ్ విధానం తెలపండి.",
        },
        {
            "id": "p2",
            "label": "🌲 ప్రశాంతమైన ప్రత్యామ్నాయ ప్రదేశాలు",
            "query": "మనాలీ మరియు సిమ్లాకు ప్రత్యామ్నాయంగా ప్రశాంత పర్యాటక ప్రాంతాలను సూచించండి.",
        },
        {
            "id": "p3",
            "label": "💳 జీరో కమీషన్ విధానం",
            "query": "ట్రావెల్సాథీ 18% కమీషన్‌ను ఎలా ఆదా చేస్తుంది?",
        },
    ],
    "mr": [
        {
            "id": "p1",
            "label": "🏡 प्रमाणित समुदाय होमस्टे",
            "query": "बस्तरमधील प्रमाणित समुदाय होमस्टेबद्दल माहिती द्या.",
        },
        {
            "id": "p2",
            "label": "🌲 गर्दी नसलेली छुपी पर्यटन स्थळे",
            "query": "मनाली आणि शिमलाच्या गर्दीपासून दूर शांत पर्यटन पर्याय सुचवा.",
        },
        {
            "id": "p3",
            "label": "💳 शून्य कमिशन डीपीआई मॉडेल",
            "query": "ट्रॅव्हलसाथी १८% ते ३०% ओटीए कमिशन कसे वाचवते?",
        },
    ],
}


class ChatService:
    """
    AI Multilingual Concierge Engine:
    Handles multi-turn conversational assistance in 6 Indic languages
    grounded in 12,293 verified destinations and PM-JUGA tribal homestays.
    """

    CIRCUIT_BREAKER_TIMEOUT = 3.5  # Max seconds before failing over to RAG knowledge engine

    @classmethod
    async def process_message(cls, db: AsyncSession, request: ChatRequest) -> ChatResponse:
        """Process tourist message and return localized response with grounded POI cards."""
        lang = request.language.lower() if request.language else "en"
        session_id = request.session_id or str(uuid.uuid4())
        msg = request.message.strip()
        logger.info(
            "AI Concierge Query: '%s...' with %d history turns (Session: %s, Lang: %s, Lat: %s, Lon: %s)",
            msg[:50], len(request.history or []), session_id, lang, request.latitude, request.longitude
        )

        # 1. Retrieve candidate POIs / homestays based on keyword intent, coordinates, or city
        referenced_pois, context_summary = await cls._retrieve_rag_context(
            db=db,
            message=msg,
            latitude=request.latitude,
            longitude=request.longitude,
            city=request.city
        )

        # 2. Try Gemini 1.5 Flash structured multilingual chat call
        response_text = None
        source = "rag-knowledge-engine"

        if settings.gemini_api_key and settings.gemini_api_key not in ("mock-gemini-key", "", "none"):
            try:
                response_text = await asyncio.wait_for(
                    cls._call_gemini_multilingual(msg, lang, context_summary, request.history),
                    timeout=cls.CIRCUIT_BREAKER_TIMEOUT,
                )
                if response_text:
                    source = "gemini-1.5-flash"
            except (asyncio.TimeoutError, Exception) as exc:
                logger.warning(
                    f"Gemini chat timed out or failed ({exc}). Failing over to Deterministic RAG Knowledge Engine."
                )

        # 3. If Gemini failed or was skipped, use Deterministic RAG Knowledge Engine
        if not response_text:
            response_text = cls._deterministic_knowledge_response(msg, lang, referenced_pois)

        # 4. Generate contextual follow-up prompts
        follow_ups = cls._generate_follow_up_prompts(msg, lang)

        return ChatResponse(
            response_text=response_text,
            language=lang,
            referenced_pois=referenced_pois,
            suggested_prompts=follow_ups,
            session_id=session_id,
            source=source,
        )

    @classmethod
    async def stream_concierge_response(cls, db: AsyncSession, request: ChatRequest):
        """Server-Sent Events (SSE) token stream for conversational concierge."""
        response = await cls.process_message(db, request)
        words = response.response_text.split(" ")
        for word in words:
            yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            await asyncio.sleep(0.012)

        final_meta = {
            "done": True,
            "response_text": response.response_text,
            "referenced_pois": [p.model_dump() for p in response.referenced_pois],
            "suggested_prompts": [p.model_dump() for p in response.suggested_prompts],
            "session_id": response.session_id,
            "source": response.source,
        }
        yield f"data: {json.dumps(final_meta)}\n\n"

    @classmethod
    def get_initial_prompts(cls, language: str = "en") -> List[SuggestedPrompt]:
        """Return localized initial prompt chips for the concierge drawer."""
        lang = language.lower() if language else "en"
        prompts = LOCALIZED_INITIAL_PROMPTS.get(lang, LOCALIZED_INITIAL_PROMPTS["en"])
        return [SuggestedPrompt(**p) for p in prompts]

    @classmethod
    async def _retrieve_rag_context(
        cls,
        db: AsyncSession,
        message: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        city: Optional[str] = None,
    ) -> Tuple[List[ReferencedPOI], str]:
        """Query database for destinations, homestays, and overtourism pairs relevant to query."""
        msg_lower = message.lower()
        referenced_pois: List[ReferencedPOI] = []
        context_parts: List[str] = []

        is_near_intent = any(w in msg_lower for w in [
            "near me", "nearby", "close to me", "around me", "close by", "in my area",
            "मेरे पास", "कास्ट", "काछे", "কাছে", "அருகில்", "దగ్గర", "जवळ"
        ])
        is_hidden_intent = any(w in msg_lower for w in [
            "hidden", "offbeat", "secret", "peaceful", "quiet", "crowdless", "untouched",
            "छिपा", "छिपे", "अज्ञात", "गुप्त", "অচেনা", "লুকানো", "மறைந்த", "దాగివున్న", "गुपित"
        ])

        # Intent 0: Proximity & Hidden Gems Nearest to User Location or Requested City
        if is_near_intent or is_hidden_intent:
            # 1. Determine geographic anchor point
            center_lat, center_lon = latitude, longitude

            # If no GPS provided, check if user specified city or if city parameter exists
            if center_lat is None or center_lon is None:
                user_city_str = (city or "").lower()
                for c_name, (c_lat, c_lon) in CITY_COORDINATES.items():
                    if c_name in msg_lower or c_name in user_city_str:
                        center_lat, center_lon = c_lat, c_lon
                        break

            # 2. If center coordinates exist, execute spatial Haversine search
            if center_lat is not None and center_lon is not None:
                lat_min, lat_max = center_lat - 1.6, center_lat + 1.6
                lon_min, lon_max = center_lon - 1.6, center_lon + 1.6
                spatial_stmt = (
                    select(DestinationMaster)
                    .where(
                        and_(
                            DestinationMaster.latitude.between(lat_min, lat_max),
                            DestinationMaster.longitude.between(lon_min, lon_max)
                        )
                    )
                )
                res = await db.execute(spatial_stmt)
                candidates = res.scalars().all()

                scored = []
                for p in candidates:
                    dist = haversine_km(center_lat, center_lon, p.latitude, p.longitude)
                    # Score favoring authentic hidden gems and high ratings while penalizing excessive distance
                    pref_score = 1.0 if p.is_hidden_gem else 0.4
                    score = (pref_score * 0.45) + ((p.rating / 5.0) * 0.35) + (max(0.0, 1.0 - (dist / 120.0)) * 0.20)
                    scored.append((score, dist, p))

                scored.sort(key=lambda x: x[0], reverse=True)
                for score, dist, p in scored[:3]:
                    referenced_pois.append(
                        ReferencedPOI(
                            id=p.id,
                            name=p.name,
                            category=p.category or "attraction",
                            state=p.state,
                            rating=p.rating,
                            price_range=p.price_range or "₹2,000/day",
                            image_url=p.image_url,
                            action_type="explore",
                            distance_km=round(dist, 1)
                        )
                    )
                    context_parts.append(
                        f"Nearby Hidden Gem: {p.name} ({p.state}) is located only {round(dist, 1)} km away. "
                        f"Rating: {p.rating}★. Category: {p.category}. Verified peaceful atmosphere."
                    )

            # 3. If no coordinates known and user asked for hidden places near them:
            # Query top authentic national hidden gems across diverse states from destinations_master
            elif is_hidden_intent or is_near_intent:
                hidden_stmt = (
                    select(DestinationMaster)
                    .where(DestinationMaster.is_hidden_gem.is_(True))
                    .order_by(DestinationMaster.rating.desc())
                    .limit(25)
                )
                hidden_res = await db.execute(hidden_stmt)
                all_hidden = hidden_res.scalars().all()
                distinct_states = set()
                diverse_hidden = []
                for p in all_hidden:
                    if p.state not in distinct_states:
                        distinct_states.add(p.state)
                        diverse_hidden.append(p)
                    if len(diverse_hidden) >= 3:
                        break

                for p in diverse_hidden:
                    referenced_pois.append(
                        ReferencedPOI(
                            id=p.id,
                            name=p.name,
                            category=p.category or "attraction",
                            state=p.state,
                            rating=p.rating,
                            price_range=p.price_range or "₹2,000/day",
                            image_url=p.image_url,
                            action_type="explore",
                        )
                    )
                    context_parts.append(
                        f"National Hidden Gem: {p.name} ({p.state}). Rating: {p.rating}★. "
                        f"Authentic offbeat destination with verified zero-commission homestays and low crowd footfall."
                    )

        # Intent A: Verified Community Homestays
        if any(w in msg_lower for w in ["tribal", "homestay", "juga", "bastar", "dhokra", "maria", "stay"]):
            stmt = select(Homestay).where(Homestay.is_tribal_pmjuga.is_(True)).limit(3)
            res = await db.execute(stmt)
            homestays = res.scalars().all()
            for h in homestays:
                referenced_pois.append(
                    ReferencedPOI(
                        id=None,
                        name=h.title,
                        category="Verified Community Homestay",
                        state=h.state,
                        rating=round(float(h.sanitation_trust_score) / 20.0, 1),
                        price_range=f"₹{int(h.base_price_inr)}/night",
                        image_url=h.image_url,
                        action_type="book_homestay",
                    )
                )
                context_parts.append(
                    f"Homestay: {h.title} in {h.district}, {h.state}. Price: ₹{h.base_price_inr}. "
                    f"Features: {h.amenities}. Host: {h.host_name} (Sanitation Trust Score: {h.sanitation_trust_score}/100)."
                )

        # Intent B: Anti-Overtourism & Alternative circuits
        if any(w in msg_lower for w in ["overtourism", "crowd", "manali", "shimla", "ooty", "alternative", "peaceful"]):
            pair_stmt = select(AntiOvertourismPair).limit(2)
            pair_res = await db.execute(pair_stmt)
            pairs = pair_res.scalars().all()
            for p in pairs:
                context_parts.append(
                    f"Diversion Circuit: Popular '{p.popular_name}' ({p.popular_state}) has high congestion ({p.popular_footfall_annual}). "
                    f"Recommended Hidden Gem: '{p.alternative_name}' ({p.alternative_state}) offers {p.reason} "
                    f"with {p.crowd_reduction_pct}% lower footfall and scenic river/forest tranquility."
                )

        # Intent C: Specific Destination or Regional lookup
        keywords = [
            "amber fort", "hampi", "konark", "jaipur", "tirthan", "manali", "kochi", "varanasi", "mysore",
            "himachal", "goa", "kerala", "spiti", "jibhi", "bastar", "ooty", "shimla", "ladakh", "kashmir"
        ]
        found_kw = next((k for k in keywords if k in msg_lower), None)

        if found_kw and not referenced_pois:
            dest_stmt = (
                select(DestinationMaster)
                .where(
                    or_(
                        DestinationMaster.name.ilike(f"%{found_kw}%"),
                        DestinationMaster.state.ilike(f"%{found_kw}%"),
                        DestinationMaster.description.ilike(f"%{found_kw}%")
                    )
                )
                .order_by(DestinationMaster.rating.desc())
                .limit(3)
            )
            dest_res = await db.execute(dest_stmt)
            places = dest_res.scalars().all()
            for p in places:
                referenced_pois.append(
                    ReferencedPOI(
                        id=p.id,
                        name=p.name,
                        category=p.category,
                        state=p.state,
                        rating=p.rating,
                        price_range=p.price_range,
                        image_url=p.image_url,
                        action_type="explore",
                    )
                )
                context_parts.append(
                    f"Destination: {p.name} ({p.state}). Category: {p.category}. Rating: {p.rating}★. "
                    f"Best Season: {p.best_season}. Description: {p.description[:180]}."
                )

        # Default regional fallback: ONLY if explicit state named (strictly no generic 'place' match)
        if not referenced_pois:
            state_keywords = {
                "rajasthan": "Rajasthan", "kerala": "Kerala", "himachal": "Himachal Pradesh",
                "goa": "Goa", "uttarakhand": "Uttarakhand", "kashmir": "Jammu and Kashmir",
                "assam": "Assam", "karnataka": "Karnataka", "tamil nadu": "Tamil Nadu",
                "maharashtra": "Maharashtra", "meghalaya": "Meghalaya", "sikkim": "Sikkim"
            }
            matched_state = next((v for k, v in state_keywords.items() if k in msg_lower), None)
            if matched_state:
                anchor_stmt = (
                    select(DestinationMaster)
                    .where(DestinationMaster.state.ilike(f"%{matched_state}%"))
                    .order_by(DestinationMaster.rating.desc())
                    .limit(2)
                )
                anchor_res = await db.execute(anchor_stmt)
                for p in anchor_res.scalars().all():
                    referenced_pois.append(
                        ReferencedPOI(
                            id=p.id,
                            name=p.name,
                            category=p.category,
                            state=p.state,
                            rating=p.rating,
                            price_range=p.price_range,
                            image_url=p.image_url,
                            action_type="explore",
                        )
                    )

        return referenced_pois, "\n".join(context_parts)

    @classmethod
    async def _call_gemini_multilingual(
        cls, message: str, language: str, context: str, history: List[ChatMessage]
    ) -> Optional[str]:
        """Call Gemini 1.5 Flash for conversational Indic assistance."""
        api_key = settings.gemini_api_key
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

        lang_names = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
            "mr": "Marathi (मराठी)",
        }
        target_lang = lang_names.get(language, "English")

        system_instruction = (
            f"You are TravelSathi AI Concierge, the official digital public infrastructure assistant for Indian tourism.\n"
            f"Respond in {target_lang}. Be polite, culturally appreciative, authentic, and informative.\n"
            f"Promote zero-commission verified community homestays, certified local guides, and peaceful alternatives to congested overtourism spots.\n"
            f"Grounded Context Information:\n{context}\n"
            f"Keep your response concise (2-4 paragraphs max) with practical details such as entry fees, optimal timing, and cultural tips."
        )

        conversation_turns = [{"parts": [{"text": system_instruction}]}]
        for turn in history[-6:]:
            role = "user" if turn.sender == "user" else "model"
            conversation_turns.append({"role": role, "parts": [{"text": turn.text}]})
        conversation_turns.append({"role": "user", "parts": [{"text": message}]})

        payload = {
            "contents": conversation_turns,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 600,
            },
        }

        async with httpx.AsyncClient() as client:
            resp = None
            for model_name in ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"]:
                req_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                try:
                    resp = await client.post(req_url, json=payload, timeout=cls.CIRCUIT_BREAKER_TIMEOUT)
                    if resp.status_code == 200:
                        break
                except Exception:
                    continue

            if not resp or resp.status_code != 200:
                logger.warning(f"Gemini chat API error {resp.status_code if resp else 'error'}: {resp.text if resp else ''}")
                return None

            data = resp.json()
            return (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )

    @classmethod
    def _deterministic_knowledge_response(
        cls, message: str, language: str, referenced_pois: List[ReferencedPOI]
    ) -> str:
        """
        Deterministic RAG Knowledge Engine (Zero-Latency Offline Fallback):
        Provides authentic, accurate multilingual answers matching user intent.
        """
        msg_lower = message.lower()

        # Intent 1: Verified Community Homestays
        if any(w in msg_lower for w in ["tribal", "homestay", "juga", "bastar", "dhokra", "maria", "जनजातीय", "होमस्टे"]):
            if language == "hi":
                return (
                    "नमस्ते! प्रमाणित समुदाय होमस्टे (Verified community homestay) बस्तर, छत्तीसगढ़ में अत्यंत अनूठे और प्रामाणिक सांस्कृतिक अनुभव प्रदान करते हैं। "
                    "यहाँ आपको पारंपरिक मारिया और मुरिया जनजातीय वास्तुकला, ढोकरा बेल-मेटल हस्तशिल्प और जैविक स्थानीय खान-पान का आनंद मिलता है।\n\n"
                    "ट्रैवल्सार्थी (TravelSathi) के डिजिटल पब्लिक इंफ्रास्ट्रक्चर के माध्यम से आपकी बुकिंग राशि का 97% सीधे स्थानीय जनजातीय परिवारों के बैंक खाते में बिना किसी बिचौलिए या कमीशन के पहुँचता है। आप नीचे दिए गए कार्ड से सीधे बुकिंग कर सकते हैं।"
                )
            elif language == "bn":
                return (
                    "নমস্কার! প্রধানমন্ত্রী জনজাতীয় উন্নত গ্রাম অভিযান (PM-JUGA)-এর অধীনে বাস্তার, ছত্তিশগড়ের প্রত্যয়িত উপজাতীয় হোমস্টেগুলি ভারতের আদিবাসী ঐতিহ্য ও ঢোকরা হস্তশিল্পের নিখুঁত অভিজ্ঞতা প্রদান করে। "
                    "ট্রাভেলসাথী জিরো-কমিশন মডেলের মাধ্যমে আপনার ব্যয়ের ৯৭% অর্থ সরাসরি স্থানীয় আদিবাসী পরিবারের ইউপিআই অ্যাকাউন্টে পৌঁছায়।"
                )
            elif language == "ta":
                return (
                    "வணக்கம்! பஸ்தாரில் உள்ள பிரதமரின் பிஎம்-ஜுகா (PM-JUGA) பழங்குடியினர் தங்குமிடங்கள் பழங்குடி கலாச்சாரம் மற்றும் பாரம்பரிய உணவுகளை நேரடியாக அனுபவிக்க சிறந்த வாய்ப்பாகும். "
                    "ட்ராவல்சாதி டிபிஐ தளம் மூலம் எந்தவொரு இடைத்தரகர் கமிஷனும் இன்றி, 97% கட்டணம் நேரடியாக உள்ளூர் குடும்பங்களுக்கு வழங்கப்படுகிறது."
                )
            elif language == "te":
                return (
                    "నమస్కారం! ఛత్తీస్‌గఢ్‌లోని బస్తర్‌లో పీఎం-జుగా (PM-JUGA) గుర్తింపు పొందిన గిరిజన హోమ్‌స్టేలు ప్రాచీన సంస్కృతి, డోక్రా హస్తకళలను అనుభవించడానికి అద్భుతమైన అవకాశం. "
                    "ట్రావెల్సాథీ ద్వారా 18% కమీషన్ లేకుండా మీ డబ్బు నేరుగా గిరిజన కుటుంబాల ఖాతాకే చేరుతుంది."
                )
            elif language == "mr":
                return (
                    "नमस्कार! छत्तीसगडमधील बस्तर येथील पीएम-जुगा (PM-JUGA) प्रमाणित आदिवासी होमस्टेमध्ये स्थानिक मारिया संस्कृती आणि ढोकरा हस्तकलेचा अस्सल अनुभव मिळतो. "
                    "ट्रॅव्हलसाथीच्या शून्य-कमिशन मॉडेलमुळे आपल्या बुकिंगचे ९७% थेट स्थानिक कुटुंबांना विना-मध्यस्थ मिळतात."
                )
            else:
                return (
                    "Welcome! Verified community homestays in Bastar, Chhattisgarh provide an authentic immersion into indigenous Maria traditions, Dhokra lost-wax bell metal art, and organic forest dining.\n\n"
                    "Through the TravelSathi Digital Public Infrastructure, 100% of the commercial OTA commission (15% to 30%) is eliminated, delivering 97% of your booking funds directly to indigenous hosts via instant UPI split-settlement."
                )

        # Intent 2: Anti-Overtourism & Hidden Gems
        if any(w in msg_lower for w in ["overtourism", "crowd", "manali", "shimla", "ooty", "alternative", "भीड़", "विकल्प"]):
            if language == "hi":
                return (
                    "मनाली और शिमला जैसे अत्यधिक भीड़भाड़ वाले पर्यटन स्थलों के स्थान पर ट्रैवल्सार्थी आपको शांत, सुरम्य और सांस्कृतिक रूप से समृद्ध विकल्पों की अनुशंसा करता है:\n\n"
                    "• मनाली के स्थान पर: तीर्थन घाटी (Tirthan Valley) — यहाँ ग्रेट हिमालयन नेशनल पार्क, क्रिस्टल-क्लीयर ट्राउट नदियाँ और देवदार के वनों से घिरे शांत काष्ठ होमस्टे हैं, जहाँ 65% कम भीड़ होती है।\n"
                    "• शिमला के स्थान पर: जिभी (Jibhi) और शोजा — शांतिपूर्ण पाइन वन, झरने और प्रामाणिक हिमाचली आतिथ्य।"
                )
            elif language == "bn":
                return (
                    "মানালি বা সিমলার ভিড় এড়িয়ে ট্রাভেলসাথী আপনাকে শান্ত ও মনোরম তীর্থন ভ্যালি (Tirthan Valley) অথবা জিভির কাঠের ঐতিহ্যবাহী হোমস্টে বেছে নেওয়ার পরামর্শ দেয়। "
                    "এখানে ৬৫% কম ভিড় থাকে এবং গ্রেট হিমালয়ান ন্যাশনাল পার্কের অপূর্ব সৌন্দর্য উপভোগ করা যায়।"
                )
            elif language == "ta":
                return (
                    "நெரிசலான மணாலிக்கு மாற்றாக, கிரேட் ஹிமாலயன் தேசிய பூங்காவை ஒட்டியுள்ள 'தீர்த்தன் பள்ளத்தாக்கு' (Tirthan Valley) அமைதியான மாற்று இடமாகும். இங்கு 65% குறைவான கூட்ட நெரிசலுடன் இயற்கை அழகை ரசிக்கலாம்."
                )
            elif language == "te":
                return (
                    "రద్దీగా ఉండే మనాలీకి బదులుగా, 'తీర్థన్ వ్యాలీ' (Tirthan Valley) అత్యంత ప్రశాంతమైన ప్రత్యామ్నాయం. ఇక్కడ 65% తక్కువ రద్దీతో దేవదారు అడవులు మరియు సహజ నదుల అందాలను ఆస్వాదించవచ్చు."
                )
            elif language == "mr":
                return (
                    "गर्दीच्या मनालीऐवजी ट्रॅव्हलसाथी तुम्हाला 'तीर्थन व्हॅली'ची (Tirthan Valley) शिफारस करते. येथे ६५% कमी गर्दीसह हिमालयीन शांतता आणि अस्सल लाकडी होमस्टेचा अनुभव मिळतो."
                )
            else:
                return (
                    "To mitigate the 80/20 overtourism congestion paradox, TravelSathi actively diverts traveler footfall to serene, community-run alternatives:\n\n"
                    "• Instead of Manali: Tirthan Valley — Pristine glacial trout streams, cedar-scented homestays, and the UNESCO Great Himalayan National Park with 65% lower crowd density.\n"
                    "• Instead of Shimla: Jibhi & Shoja — Tranquil pine trails and traditional vernacular Kathkuni wooden architecture."
                )

        # Intent 3: Zero-Commission DPI & Commission Savings
        if any(w in msg_lower for w in ["commission", "ota", "dpi", "save", "saving", "ondc", "कमीशन", "बचत"]):
            if language == "hi":
                return (
                    "पारंपरिक ओटीए (MakeMyTrip, Booking.com आदि) छोटे होमस्टे संचालकों और स्थानीय गाइडों से 15% से 30% तक भारी कमीशन वसूलते हैं।\n\n"
                    "ट्रैवल्सार्थी भारत के डिजिटल पब्लिक इंफ्रास्ट्रक्चर (DPI), ONDC और UPI प्रोटोकॉल पर आधारित है। यहाँ प्लेटफार्म कमीशन बिल्कुल शून्य (₹0.00) है। "
                    "आपकी भुगतान राशि का 97% सीधे स्थानीय होमस्टे मालिक को मिलता है और 3% सुरक्षित बैंक गेटवे को जाता है। इससे पर्यटकों को भी उचित मूल्य मिलता है और ग्रामीण अर्थव्यवस्था सशक्त होती है।"
                )
            elif language == "bn":
                return (
                    "বাণিজ্যিক ওটিএ সংস্থাগুলি ১৫% থেকে ৩০% কমিশন কেটে নেয়। কিন্তু ট্রাভেলসাথী ডিপিআই মডেলে প্ল্যাটফর্ম ফি সম্পূর্ণ শূন্য (₹০.০০)। "
                    "আপনার টাকার ৯৭% সরাসরি স্থানীয় হোমস্টে মালিক এবং প্রত্যয়িত গাইডদের অ্যাকাউন্টে পৌঁছায়।"
                )
            elif language == "ta":
                return (
                    "வணிக தளங்கள் 15% முதல் 30% வரை கமிஷன் வசூலிக்கின்றன. ட்ராவல்சாதி டிபிஐ கட்டமைப்பில் இயங்குவதால், தள கமிஷன் ₹0.00 ஆகும். உங்கள் கட்டணத்தில் 97% நேரடியாக உள்ளூர் உரிமையாளர்களுக்கு செல்கிறது."
                )
            elif language == "te":
                return (
                    "కమర్షియల్ ట్రావెల్ యాప్‌లు 15% నుండి 30% వరకు భారీ కమీషన్ తీసుకుంటాయి. ట్రావెల్సాథీ ద్వారా ప్లాట్‌ఫామ్ కమీషన్ పూర్తిగా సున్నా (₹0.00). మీ చెల్లింపులో 97% నేరుగా స్థానిక ఆతిథ్య దాతలకే చేరుతుంది."
                )
            elif language == "mr":
                return (
                    "व्यावसायिक प्लॅटफॉर्म्स १५% ते ३०% कमिशन घेतात. ट्रॅव्हलसाथीच्या डिजिटल पब्लिक इन्फ्रास्ट्रक्चरमुळे कमिशन पूर्णपणे शून्य (₹०.००) आहे आणि ९७% रक्कम थेट स्थानिक होमस्टे चालकांना मिळते."
                )
            else:
                return (
                    "Dominant commercial OTAs levy 15% to 30% commission on small homestay hosts and local tour guides, eroding their livelihoods.\n\n"
                    "TravelSathi operates as open Digital Public Infrastructure (DPI) aligned with ONDC and UPI. Platform commission is strictly ₹0.00. "
                    "97% of your booking amount goes directly to the local host's bank account, with 3% covering direct payment gateway processing. This saves tourists hundreds of rupees while empowering rural and tribal communities."
                )

        # Intent 4: Amber Fort / Heritage & Monuments
        if any(w in msg_lower for w in ["amber fort", "jaipur", "fort", "ticket", "timing", "fee", "आमेर", "किला"]):
            if language == "hi":
                return (
                    "आमेर किला (Amber Fort), जयपुर, राजस्थान:\n\n"
                    "• समय: प्रातः 08:00 से सायं 17:30 तक (दिन का भ्रमण) और सायं 18:30 से 21:15 तक (आमेर बाय नाइट व लाइट एंड साउंड शो)।\n"
                    "• टिकट: भारतीय नागरिकों के लिए ₹100, विदेशी पर्यटकों के लिए ₹500, और छात्र टिकट ₹10 है।\n"
                    "• स्थानीय टिप: सुबह 10:00 बजे से पहले पहुँचें ताकि पूर्वी अग्रभाग पर सूर्य के प्रकाश में शीश महल और दीवान-ए-आम की बेहतरीन तस्वीरें ली जा सकें। मुख्य प्रवेश द्वार के पास स्थानीय शिल्पकारों से हस्तशिल्प सीधे खरीदें।"
                )
            else:
                return (
                    "Amber Fort (Amer Fort), Jaipur, Rajasthan:\n\n"
                    "• Timings: 08:00 AM – 05:30 PM (Day visits) and 06:30 PM – 09:15 PM (Amer by Night & Light-and-Sound Show).\n"
                    "• Entry Fees: ₹100 for Indian nationals, ₹500 for international tourists, ₹10 for students with ID.\n"
                    "• Local Insider Tip: Arrive before 10:00 AM to beat midday heat and capture soft natural lighting across the Sheesh Mahal (Mirror Palace) and Ganesh Pol. Engage a certified TravelSathi guide at the Lion Gate for authentic Rajput lore."
                )

        # Intent 5: Himachal Pradesh / Mountain Quiet Escapes
        if any(w in msg_lower for w in ["himachal", "quiet", "peaceful", "mountain", "hill station"]):
            if language == "hi":
                return (
                    "हिमाचल प्रदेश में शांत और भीड़मुक्त अनुभव के लिए हम तीर्थन घाटी (Tirthan Valley), जिभी (Jibhi) और शोजा की अनुशंसा करते हैं। "
                    "यहाँ मनाली की तुलना में 65% कम भीड़ होती है। यहाँ आप ग्रेट हिमालयन नेशनल पार्क के निकट पारंपरिक काष्ठ होमस्टे, शुद्ध ट्राउट नदियाँ और देवदार के वनों का आनंद ले सकते हैं।"
                )
            elif language == "mr":
                return (
                    "हिमाचल प्रदेशातील शांत आणि निसर्गरम्य प्रवासासाठी आम्ही 'तीर्थन व्हॅली' आणि 'जिभी'ची शिफारस करतो. "
                    "मनालीच्या गर्दीपासून दूर येथे अस्सल स्थानिक काष्ठ होमस्टे आणि ग्रेट हिमालयन राष्ट्रीय उद्यानाचे सौंदर्य अनुभवता येते."
                )
            else:
                return (
                    "For a peaceful, uncrowded escape in Himachal Pradesh, we strongly recommend Tirthan Valley, Jibhi, and Shoja bordering the UNESCO Great Himalayan National Park.\n\n"
                    "• Tirthan Valley: Pristine glacial rivers, eco-friendly wooden Kathkuni homestays, and 65% lower tourist footfall than Manali.\n"
                    "• Jibhi & Jalori Pass: Serene pine forests, waterfall trails, and direct contact with verified local mountain guides on zero-commission pricing."
                )

        # Intent 6: Goa / Coastal Beaches & Seafood
        if any(w in msg_lower for w in ["goa", "beach", "seafood", "coastal"]):
            if language == "hi":
                return (
                    "गोवा में प्रामाणिक तटीय और स्थानीय खान-पान के लिए दक्षिण गोवा के पालोलेम (Palolem), अगोंडा (Agonda) और बेनाउलिम की यात्रा करें। "
                    "यहाँ आपको शांत समुद्र तट, पारंपरिक कोंकणी समुद्री भोजन (ताज़ा फिश करी, रवा फ्राई) और स्थानीय मछुआरों द्वारा संचालित प्रमाणित होमस्टे मिलते हैं।"
                )
            elif language == "mr":
                return (
                    "गोव्यात निसर्गरम्य समुद्रकिनारे आणि अस्सल मालवणी/कोंकणी सीफूडसाठी दक्षिण गोव्यातील पालोलेम, अगोंडा आणि बाणावली सर्वोत्तम पर्याय आहेत. "
                    "येथे शांत समुद्रकिनारे आणि शून्य-कमिशन थेट बुकिंगसह स्थानिक होमस्टे उपलब्ध आहेत."
                )
            else:
                return (
                    "For coastal serenity and authentic local seafood in Goa, head towards South Goa's uncrowded shores:\n\n"
                    "• Best Beaches: Palolem, Agonda, and Cola Beach offer tranquil sands far away from congested northern commercial strips.\n"
                    "• Authentic Coastal Fare: Savor fresh kingfish rava fry, Goan prawn curry with red rice, and crab xec-xec at community-run coastal shacks.\n"
                    "• Verified Homestays: Book heritage Portuguese-Goan village homes directly without intermediary commissions."
                )

        # Intent 7: Nearby / Hidden Places & Proximity Queries
        if any(w in msg_lower for w in [
            "near me", "nearby", "close to me", "around me", "hidden place", "hidden gem",
            "offbeat", "peaceful place", "quiet place", "मेरे पास", "छिपा", "छिपे", "कास्ट",
            "কাছে", "அருகில்", "దగ్గర", "जवळ"
        ]):
            has_distances = any(p.distance_km is not None for p in referenced_pois)
            if has_distances:
                poi_lines = "\n".join([
                    f"• {p.name} ({p.state}) — {p.distance_km} km away | Rating: {p.rating}★ | {p.category}"
                    for p in referenced_pois[:3]
                ])
                if language == "hi":
                    return (
                        f"आपके स्थान के निकटतम सत्यापित और शांत पर्यटन स्थल:\n\n{poi_lines}\n\n"
                        "इन सभी स्थलों पर भीड़ कम होती है और प्रमाणित स्थानीय समुदाय गाइड तथा शून्य-कमीशन होमस्टे उपलब्ध हैं।"
                    )
                elif language == "bn":
                    return (
                        f"আপনার নিকটবর্তী যাচাইকৃত শান্ত ও অনাবিল পর্যটন কেন্দ্র:\n\n{poi_lines}\n\n"
                        "এই স্থানগুলিতে পর্যটকদের ভিড় কম এবং সরাসরি নির্ভরযোগ্য হোমস্টে বুকিং সুবিধা রয়েছে।"
                    )
                elif language == "ta":
                    return (
                        f"உங்கள் இருப்பிடத்திற்கு அருகிலுள்ள அமைதியான சுற்றுலா இடங்கள்:\n\n{poi_lines}\n\n"
                        "இங்கு குறைவான கூட்ட நெரிசல் மற்றும் சான்றளிக்கப்பட்ட உள்ளூர் வழிகாட்டிகள் உள்ளனர்."
                    )
                elif language == "te":
                    return (
                        f"మీ స్థానానికి సమీపంలో ఉన్న ప్రశాంతమైన మరియు దాగివున్న పర్యాటక ప్రాంతాలు:\n\n{poi_lines}\n\n"
                        "ఇక్కడ తక్కువ రద్దీ మరియు జీరో కమీషన్ హోమ్‌స్టేలు అందుబాటులో ఉన్నాయి."
                    )
                elif language == "mr":
                    return (
                        f"आपल्या स्थानाजवळील प्रमाणित आणि शांत छुपी पर्यटन स्थळे:\n\n{poi_lines}\n\n"
                        "येथे कमी गर्दी असून थेट शून्य-कमिशन बुकिंगसह स्थानिक मार्गदर्शक उपलब्ध आहेत."
                    )
                else:
                    return (
                        f"Here are verified tranquil hidden spots closest to your location:\n\n{poi_lines}\n\n"
                        "All of these spots feature low crowd footfall, verified local community guides, and zero-commission bookings."
                    )
            else:
                poi_lines = "\n".join([
                    f"• {p.name} ({p.state}) — Rating: {p.rating}★ | Verified Low-Crowd Gem"
                    for p in referenced_pois[:3]
                ])
                if language == "hi":
                    return (
                        "सटीक निकटवर्ती छिपे स्थल खोजने के लिए कृपया ब्राउज़र लोकेशन सक्षम करें या अपने वर्तमान शहर का नाम बताएं (जैसे *'दिल्ली के पास छिपी जगहें'* या *'जयपुर के पास'* )।\n\n"
                        f"इस बीच, भारत के राष्ट्रीय कैटलॉग से शीर्ष सत्यापित छिपे हुए शांत स्थल:\n\n{poi_lines}\n\n"
                        "ये सभी स्थल भीड़भाड़ से दूर हैं और शून्य-कमीशन स्थानीय आतिथ्य प्रदान करते हैं।"
                    )
                elif language == "bn":
                    return (
                        "আপনার সঠিক অবস্থান অনুযায়ী লুকানো জায়গা খুঁজতে অনুগ্রহ করে ব্রাউজার লোকেশন দিন অথবা শহরের নাম বলুন (যেমন *'কলকাতার কাছে অচেনা জায়গা'* )।\n\n"
                        f"ইতিমধ্যে, জাতীয় ক্যাটালগ থেকে শীর্ষ যাচাইকৃত শান্ত ও নির্জন গন্তব্য:\n\n{poi_lines}\n\n"
                        "এই স্থানগুলিতে বাণিজ্যিক ভিড় এড়িয়ে প্রাকৃতিক শান্তি উপভোগ করা যায়।"
                    )
                elif language == "ta":
                    return (
                        "உங்கள் அருகிலுள்ள மறைந்த இடங்களை அறிய உங்கள் நகரத்தின் பெயரை குறிப்பிடவும் (எ.கா: *'சென்னை அருகில் உள்ள அமைதியான இடங்கள்'*).\n\n"
                        f"தேசிய பட்டியலிலிருந்து சிறந்த சரிபார்க்கப்பட்ட அமைதியான சுற்றுலா தலங்கள்:\n\n{poi_lines}\n\n"
                        "இங்கு வணிக இடைத்தரகர்கள் இன்றி அமைதியான இயற்கை சூழலை அனுபவிக்கலாம்."
                    )
                elif language == "te":
                    return (
                        "మీ పరిసరాల్లోని దాగివున్న ప్రదేశాలను ఖచ్చితంగా తెలుసుకోవడానికి మీ నగరం పేరు తెలపండి (ఉదా: *'హైదరాబాద్ దగ్గర ప్రశాంతమైన ప్రదేశాలు'*).\n\n"
                        f"ఈలోగా, భారతదేశంలోని అగ్రశ్రేణి ప్రశాంతమైన దాగివున్న పర్యాటక ప్రాంతాలు:\n\n{poi_lines}\n\n"
                        "ఇవి రద్దీ లేని మరియు సహజ సౌందర్యం కలిగిన స్థలాలు."
                    )
                elif language == "mr":
                    return (
                        "आपल्या परिसरातील छुपी ठिकाणे अचूक शोधण्यासाठी कृपया शहराचे नाव सांगा (उदा. *'पुण्याजवळील शांत ठिकाणे'*).\n\n"
                        f"तोपर्यंत, राष्ट्रीय कॅटलॉगमधील शीर्ष प्रमाणित शांत व गर्दीमुक्त ठिकाणे:\n\n{poi_lines}\n\n"
                        "येथे शून्य-कमिशन मॉडेलसह अस्सल स्थानिक अनुभव मिळतो."
                    )
                else:
                    return (
                        "To discover hidden gems right around your immediate vicinity, please enable browser location or mention your city/state (e.g., *'hidden places near Delhi'* or *'near Bangalore'*).\n\n"
                        f"In the meantime, here are India's top verified, low-footfall hidden gems from our national catalog:\n\n{poi_lines}\n\n"
                        "These destinations offer tranquil environments far away from congested tourist traps, with transparent entry timings and zero-commission local homestays."
                    )

        # Contextual summary if candidate POIs were retrieved
        if referenced_pois:
            names = ", ".join([f"{p.name} ({p.state})" for p in referenced_pois[:3]])
            return (
                f"Based on your query regarding '{message.strip()}', here are top verified destinations from our catalog: {names}.\n\n"
                f"These feature certified local community guides, transparent entry timings, and zero-commission bookings."
            )

        # Generic / Multi-purpose Greeting Fallback
        if language == "hi":
            return (
                "नमस्ते! मैं आपका ट्रैवल्सार्थी एआई टूरिज़्म कॉन्सिअर्ज हूँ। "
                "मैं आपको भारत के 12,293 प्रमाणित पर्यटन स्थलों, प्रमाणित समुदाय होमस्टे, शून्य-कमिशन डायरेक्ट बुकिंग और भीड़मुक्त विकल्पों के बारे में सम्पूर्ण जानकारी दे सकता हूँ। "
                "आप मुझसे यात्रा योजना, टिकट, मौसम या किसी भी स्थल के बारे में पूछ सकते हैं!"
            )
        elif language == "bn":
            return (
                "নমস্কার! আমি আপনার ট্রাভেলসাথী এআই পর্যটন সহকারী। "
                "ভারতের ১২,২৯৩টি যাচাইকৃত গন্তব্য, উপজাতীয় হোমস্টে এবং শূন্য-কমিশন ভ্রমণ সংক্রান্ত যেকোনো তথ্য জানতে আমাকে প্রশ্ন করুন।"
            )
        elif language == "ta":
            return (
                "வணக்கம்! நான் உங்கள் ட்ராவல்சாதி ஏஐ சுற்றுலா உதவியாளர். "
                "இந்தியாவின் 12,293 சுற்றுலா தளங்கள், பழங்குடியினர் தங்குமிடங்கள் மற்றும் நேரடி முன்பதிவு பற்றி என்னிடம் கேட்கலாம்."
            )
        elif language == "te":
            return (
                "నమస్కారం! నేను మీ ట్రావెల్సాథీ ఏఐ టూరిజం అసిస్టెంట్‌ని. "
                "భారతదేశంలోని 12,293 పర్యాటక ప్రాంతాలు, గిరిజన హోమ్‌స్టేలు మరియు జీరో-కమీషన్ బుకింగ్ వివరాల గురించి అడగండి."
            )
        elif language == "mr":
            return (
                "नमस्कार! मी तुमचा ट्रॅव्हलसाथी एआय सहाय्यक आहे. "
                "भारतातील १२,२९३ प्रमाणित पर्यटन स्थळे, आदिवासी होमस्टे आणि शून्य-कमिशन बुकिंगबाबत मी आपल्याला मदत करू शकतो."
            )
        else:
            return (
                "Namaste! I am your TravelSathi AI Concierge, grounded in 12,293 verified Indian destinations across all 36 States/UTs.\n\n"
                "I can assist you with:\n"
                "• Discovering verified community homestays in Bastar and beyond.\n"
                "• Uncovering peaceful anti-overtourism hidden gems (e.g. Tirthan Valley instead of Manali).\n"
                "• Explaining zero-commission direct bookings and local certified guide hiring.\n"
                "• Real-time monument timings, ticket fees, and heritage insider tips.\n\n"
                "How may I assist your journey across India today?"
            )

    @classmethod
    def _generate_follow_up_prompts(cls, message: str, language: str) -> List[SuggestedPrompt]:
        """Generate smart follow-up suggestions in the user's language."""
        lang = language.lower() if language else "en"
        msg_lower = message.lower()

        if any(w in msg_lower for w in ["tribal", "homestay", "juga", "bastar", "जनजातीय"]):
            if lang == "hi":
                return [
                    SuggestedPrompt(id="f1", label="📍 बस्तर होमस्टे देखें", query="बस्तर में उपलब्ध सभी होमस्टे की सूची दिखाएं"),
                    SuggestedPrompt(id="f2", label="💳 बुकिंग प्रक्रिया", query="ट्रैवल्सार्थी पर जनजातीय होमस्टे कैसे बुक करें?"),
                ]
            return [
                SuggestedPrompt(id="f1", label="📍 View Bastar Stays", query="List all certified PM-JUGA homestays in Bastar"),
                SuggestedPrompt(id="f2", label="💳 How Payment Works", query="Explain the zero-commission split payment process"),
            ]

        if any(w in msg_lower for w in ["overtourism", "manali", "crowd", "भीड़"]):
            if lang == "hi":
                return [
                    SuggestedPrompt(id="f1", label="🏞️ तीर्थन घाटी यात्रा", query="तीर्थन घाटी का 3-दिवसीय यात्रा कार्यक्रम बनाएं"),
                    SuggestedPrompt(id="f2", label="🌲 अन्य छिपे हुए स्थल", query="उत्तराखंड और हिमाचल के अन्य शांत स्थल बताएं"),
                ]
            return [
                SuggestedPrompt(id="f1", label="🏞️ Plan Tirthan Valley", query="Generate a 3-day itinerary for Tirthan Valley"),
                SuggestedPrompt(id="f2", label="🌲 More Hidden Circuits", query="Show all anti-overtourism diversion pairs"),
            ]

        # Default follow-ups
        if lang == "hi":
            return [
                SuggestedPrompt(id="f1", label="🏡 जनजातीय होमस्टे", query="प्रमाणित समुदाय होमस्टे के बारे में बताएं"),
                SuggestedPrompt(id="f2", label="🌲 भीड़मुक्त स्थल", query="मनाली के शांत विकल्प सुझाएं"),
                SuggestedPrompt(id="f3", label="💳 शून्य कमीशन", query="ओटीए कमीशन की बचत कैसे होती है?"),
            ]

        return [
            SuggestedPrompt(id="f1", label="🏡 PM-JUGA Tribal Stays", query="Tell me about PM-JUGA tribal homestays in Bastar"),
            SuggestedPrompt(id="f2", label="🌲 Hidden Gem Alternatives", query="Suggest peaceful alternatives to Manali"),
            SuggestedPrompt(id="f3", label="💳 Zero Commission DPI", query="How does TravelSathi save 18% OTA commission?"),
        ]
