import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_initial_prompts_multilingual():
    """Verify localized initial prompt chips for all supported Indic languages."""
    languages = ["en", "hi", "bn", "ta", "te", "mr"]
    for lang in languages:
        res = client.get(f"/api/chat/prompts?language={lang}")
        assert res.status_code == 200
        prompts = res.json()
        assert len(prompts) >= 3
        first = prompts[0]
        assert "id" in first
        assert "label" in first
        assert "query" in first


def test_chat_message_pmjuga_tribal_english():
    """Verify RAG response and referenced POIs for PM-JUGA tribal homestay query in English."""
    payload = {
        "message": "Tell me about PM-JUGA certified tribal homestays in Bastar and how to book them.",
        "language": "en",
    }
    res = client.post("/api/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "response_text" in data
    assert "PM-JUGA" in data["response_text"]
    assert "Bastar" in data["response_text"] or "tribal" in data["response_text"].lower()
    assert "session_id" in data
    assert len(data["suggested_prompts"]) > 0

    # Verify referenced POI cards
    if data["referenced_pois"]:
        poi = data["referenced_pois"][0]
        assert "name" in poi
        assert "rating" in poi
        assert poi["action_type"] in ["explore", "book_homestay"]


def test_chat_message_pmjuga_tribal_hindi():
    """Verify Indic language handling for Hindi queries."""
    payload = {
        "message": "बस्तर में पीएम-जुगा प्रमाणित जनजातीय होमस्टे के बारे में बताएं",
        "language": "hi",
    }
    res = client.post("/api/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    assert "नमस्ते" in data["response_text"] or "पीएम-जुगा" in data["response_text"] or "बस्तर" in data["response_text"]


def test_chat_message_anti_overtourism():
    """Verify diversion recommendation for congested destinations."""
    payload = {
        "message": "I want to avoid the crowd in Manali. What are the best alternative places?",
        "language": "en",
    }
    res = client.post("/api/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Tirthan" in data["response_text"] or "alternative" in data["response_text"].lower()


def test_chat_message_dpi_commission():
    """Verify explanation of zero-commission DPI economics."""
    payload = {
        "message": "How does TravelSathi save OTA commission for local homestays?",
        "language": "en",
    }
    res = client.post("/api/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "97%" in data["response_text"] or "commission" in data["response_text"].lower() or "0" in data["response_text"]


def test_chat_message_amber_fort_details():
    """Verify heritage grounding for specific monument queries."""
    payload = {
        "message": "What are the ticket fees and opening hours for Amber Fort in Jaipur?",
        "language": "en",
    }
    res = client.post("/api/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Amber Fort" in data["response_text"] or "100" in data["response_text"]
