"""
PyTest Suite for Review Sentiment Trust Layer & Authenticity Scoring.
Tests DistilBERT sentiment evaluation, booking-gated submission, and fraud interception.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.review_service import ReviewService

client = TestClient(app)


def test_sentiment_evaluation_logic():
    """Verify NLP sentiment score calculation returns normalized confidence (0.0 to 1.0)."""
    positive_text = "The heritage palace was pristine, authentic, and breathtaking! Highly recommend the local guide."
    score = ReviewService.evaluate_text_sentiment(positive_text, rating=5.0)
    assert 0.80 <= score <= 1.0

    negative_text = "Dirty room, terrible service, and overpriced food. Total scam and cheating."
    neg_score = ReviewService.evaluate_text_sentiment(negative_text, rating=1.0)
    assert 0.0 <= neg_score <= 0.40


def test_authenticity_scoring_logic():
    """Verify authenticity score assigns weight to verified booking reference and depth."""
    high_trust = ReviewService.calculate_authenticity_score(
        text="The Sheesh Mahal mirror mosaic in Amber Fort was mind-blowing. Authentic Rajasthani architecture.",
        is_verified_booking=True
    )
    assert high_trust >= 85

    unverified = ReviewService.calculate_authenticity_score(
        text="Good place",
        is_verified_booking=False
    )
    assert unverified < 60


def test_get_destination_reviews():
    """Verify GET /api/destinations/{id}/reviews returns sentiment and authenticity breakdown."""
    response = client.get("/api/destinations/1/reviews")
    assert response.status_code == 200
    data = response.json()
    assert "average_sentiment_score" in data
    assert "average_authenticity_score" in data
    assert "positive_sentiment_pct" in data
    assert "reviews" in data
    assert len(data["reviews"]) > 0

    first_rev = data["reviews"][0]
    assert "sentiment_score" in first_rev
    assert "authenticity_score" in first_rev
    assert "is_verified_booking" in first_rev


def test_submit_review_unverified_rejected():
    """Verify review submission without a valid booking reference returns HTTP 403 Forbidden."""
    payload = {
        "place_id": 1,
        "booking_id": "fake",  # Invalid format / not verified
        "author_name": "Anonymous Bot",
        "rating": 5.0,
        "review_text": "Totally automated spam review without genuine stay."
    }
    response = client.post("/api/reviews/submit", json=payload)
    assert response.status_code == 403
    data = response.json()
    assert "confirmed booking reference" in data["detail"].lower()


def test_submit_review_verified_accepted():
    """Verify review submission with a valid confirmed booking reference is approved."""
    payload = {
        "place_id": 1,
        "booking_id": "TS-UPI-839201",
        "author_name": "Meera Krishnan",
        "rating": 5.0,
        "review_text": "The temple courtyard was extraordinarily clean, serene, and culturally authentic. Our local guide was fantastic!"
    }
    response = client.post("/api/reviews/submit", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["badge"] == "Verified Tourist"
    assert data["sentiment_score"] >= 0.80
    assert data["authenticity_score"] >= 85


def test_review_trust_stats():
    """Verify GET /api/reviews/stats returns platform telemetry."""
    response = client.get("/api/reviews/stats")
    assert response.status_code == 200
    data = response.json()
    assert "average_authenticity_score" in data
    assert "fake_reviews_intercepted" in data
    assert data["average_authenticity_score"] >= 90.0
