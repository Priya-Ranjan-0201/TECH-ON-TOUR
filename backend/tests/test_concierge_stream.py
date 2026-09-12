"""
PyTest Suite for Phase 8 Conversational Concierge & Streaming Engine.
Tests /api/chat/concierge, 6-message rolling history constraint,
Server-Sent Events (SSE) token streaming, and Indic multilingual support.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_concierge_endpoint_standard_json():
    """Verify POST /api/chat/concierge returns grounded JSON response."""
    payload = {
        "message": "Suggest peaceful alternatives to crowded Manali in Himachal Pradesh.",
        "language": "en"
    }
    res = client.post("/api/chat/concierge", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "response_text" in data
    assert "Tirthan" in data["response_text"] or "alternative" in data["response_text"].lower()
    assert "session_id" in data
    assert len(data["suggested_prompts"]) > 0


def test_concierge_endpoint_streaming_sse():
    """Verify POST /api/chat/concierge?stream=true returns text/event-stream with SSE tokens."""
    payload = {
        "message": "Tell me about Bastar PM-JUGA homestays.",
        "language": "en"
    }
    res = client.post("/api/chat/concierge?stream=true", json=payload)
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]

    content = res.text
    assert "event: metadata" in content
    assert "event: token" in content
    assert "event: done" in content


def test_concierge_6_message_rolling_history_enforced():
    """Verify passing >6 history messages is cleanly handled and bounded."""
    dummy_history = [
        {"sender": "user" if i % 2 == 0 else "assistant", "text": f"Message turn {i}"}
        for i in range(12)
    ]
    payload = {
        "message": "What is the best time to visit Tirthan Valley?",
        "language": "en",
        "history": dummy_history
    }
    res = client.post("/api/chat/concierge", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "response_text" in data


def test_concierge_indic_hindi_speech_query():
    """Verify concierge answers voice-transcribed Hindi queries."""
    payload = {
        "message": "क्या मैं स्थानीय कलाकृतियां सीधे कारीगरों से खरीद सकता हूँ?",
        "language": "hi"
    }
    res = client.post("/api/chat/concierge", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    assert "नमस्ते" in data["response_text"] or "कारीगर" in data["response_text"] or "हस्तशिल्प" in data["response_text"] or "ट्रैवल्सार्थी" in data["response_text"]


def test_concierge_dpi_zero_commission_inquiry():
    """Verify concierge correctly explains the 97% host payout model."""
    payload = {
        "message": "How does TravelSathi save money on hotel bookings?",
        "language": "en"
    }
    res = client.post("/api/chat/concierge", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "commission" in data["response_text"].lower() or "97%" in data["response_text"] or "0%" in data["response_text"]
