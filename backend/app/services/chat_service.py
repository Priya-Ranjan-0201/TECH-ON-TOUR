import asyncio
import json
import logging
import uuid
from typing import Dict, List, Optional, Tuple

import httpx
from sqlalchemy import or_, select
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

# Pre-compiled multi-lingual prompts and responses
LOCALIZED_INITIAL_PROMPTS = {
    "en": [
        {
            "id": "p1",
            "label": "🏡 PM-JUGA Tribal Homestays",
            "query": "Tell me about PM-JUGA certified tribal homestays in Bastar and how to book them.",
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
            "label": "🏡 पीएम-जुगा जनजातीय होमस्टे",
            "query": "बस्तर में पीएम-जुगा प्रमाणित जनजातीय होमस्टे के बारे में बताएं और बुकिंग कैसे करें?",
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
            "label": "🏡 পিএম-জুগা উপজাতীয় হোমস্টে",
            "query": "বস্তারের পিএম-জুগা প্রত্যয়িত আদিবাসী হোমস্টে সম্পর্কে তথ্য দিন।",
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
            "label": "🏡 பிஎம்-ஜுகா பழங்குடியினர் தங்குமிடம்",
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
            "label": "🏡 పీఎం-జుగా గిరిజన హోమ్‌స్టేలు",
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
            "label": "🏡 पीएम-जुगा आदिवासी होमस्टे",
            "query": "बस्तरमधील पीएम-जुगा प्रमाणित आदिवासी होमस्टेबद्दल माहिती द्या.",
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

        # 1. Retrieve candidate POIs / homestays based on keyword intent
        referenced_pois, context_summary = await cls._retrieve_rag_context(db, msg)

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
    def get_initial_prompts(cls, language: str = "en") -> List[SuggestedPrompt]:
        """Return localized initial prompt chips for the concierge drawer."""
        lang = language.lower() if language else "en"
        prompts = LOCALIZED_INITIAL_PROMPTS.get(lang, LOCALIZED_INITIAL_PROMPTS["en"])
        return [SuggestedPrompt(**p) for p in prompts]

    @classmethod
    async def _retrieve_rag_context(
        cls, db: AsyncSession, message: str
    ) -> Tuple[List[ReferencedPOI], str]:
        """Query database for destinations, homestays, and overtourism pairs relevant to query."""
        msg_lower = message.lower()
        referenced_pois: List[ReferencedPOI] = []
        context_parts: List[str] = []

        # Intent A: PM-JUGA Tribal Homestays
        if any(w in msg_lower for w in ["tribal", "homestay", "juga", "bastar", "dhokra", "maria", "stay"]):
            stmt = select(Homestay).where(Homestay.is_tribal_pmjuga.is_(True)).limit(3)
            res = await db.execute(stmt)
            homestays = res.scalars().all()
            for h in homestays:
                referenced_pois.append(
                    ReferencedPOI(
                        id=None,
                        name=h.title,
                        category="PM-JUGA Tribal Homestay",
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

        # Intent C: Specific Destination lookup (e.g. Amber Fort, Hampi, Konark, Jaipur)
        keywords = ["amber fort", "hampi", "konark", "jaipur", "tirthan", "manali", "kochi", "varanasi", "mysore"]
        found_kw = next((k for k in keywords if k in msg_lower), None)

        if found_kw:
            dest_stmt = (
                select(DestinationMaster)
                .where(DestinationMaster.name.ilike(f"%{found_kw}%"))
                .order_by(DestinationMaster.rating.desc())
                .limit(2)
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

        # Default fallback: add top-rated regional anchor if none matched
        if not referenced_pois and any(w in msg_lower for w in ["rajasthan", "kerala", "himachal", "place", "suggest"]):
            anchor_stmt = (
                select(DestinationMaster)
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
            f"Promote zero-commission rural and tribal homestays (PM-JUGA), certified local guides, and peaceful alternatives to congested overtourism spots.\n"
            f"Grounded Context Information:\n{context}\n"
            f"Keep your response concise (2-4 paragraphs max) with practical details such as entry fees, optimal timing, and cultural tips."
        )

        conversation_turns = [{"parts": [{"text": system_instruction}]}]
        for turn in history[-4:]:
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
            resp = await client.post(url, json=payload, timeout=cls.CIRCUIT_BREAKER_TIMEOUT)
            if resp.status_code != 200:
                logger.warning(f"Gemini chat API error {resp.status_code}: {resp.text}")
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

        # Intent 1: PM-JUGA Tribal Homestays
        if any(w in msg_lower for w in ["tribal", "homestay", "juga", "bastar", "dhokra", "maria", "जनजातीय", "होमस्टे"]):
            if language == "hi":
                return (
                    "नमस्ते! पीएम-जुगा (PM-JUGA) योजना के तहत बस्तर, छत्तीसगढ़ में प्रमाणित जनजातीय होमस्टे अत्यंत अनूठे और प्रामाणिक सांस्कृतिक अनुभव प्रदान करते हैं। "
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
                    "Welcome! Under the Pradhan Mantri Janjatiya Unnat Gram Abhiyan (PM-JUGA), certified tribal homestays in Bastar, Chhattisgarh provide an authentic immersion into indigenous Maria traditions, Dhokra lost-wax bell metal art, and organic forest dining.\n\n"
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

        # Generic / Multi-purpose Greeting Fallback
        if language == "hi":
            return (
                "नमस्ते! मैं आपका ट्रैवल्सार्थी एआई टूरिज़्म कॉन्सिअर्ज हूँ। "
                "मैं आपको भारत के 12,293 प्रमाणित पर्यटन स्थलों, पीएम-जुगा जनजातीय होमस्टे, शून्य-कमिशन डायरेक्ट बुकिंग और भीड़मुक्त विकल्पों के बारे में सम्पूर्ण जानकारी दे सकता हूँ। "
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
                "• Discovering PM-JUGA certified tribal homestays in Bastar and beyond.\n"
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
                SuggestedPrompt(id="f1", label="🏡 जनजातीय होमस्टे", query="पीएम-जुगा जनजातीय होमस्टे के बारे में बताएं"),
                SuggestedPrompt(id="f2", label="🌲 भीड़मुक्त स्थल", query="मनाली के शांत विकल्प सुझाएं"),
                SuggestedPrompt(id="f3", label="💳 शून्य कमीशन", query="ओटीए कमीशन की बचत कैसे होती है?"),
            ]

        return [
            SuggestedPrompt(id="f1", label="🏡 PM-JUGA Tribal Stays", query="Tell me about PM-JUGA tribal homestays in Bastar"),
            SuggestedPrompt(id="f2", label="🌲 Hidden Gem Alternatives", query="Suggest peaceful alternatives to Manali"),
            SuggestedPrompt(id="f3", label="💳 Zero Commission DPI", query="How does TravelSathi save 18% OTA commission?"),
        ]
