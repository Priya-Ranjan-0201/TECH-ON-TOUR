"""
PyTest Suite for Phase 7 Split-UPI Transaction Engine.
Tests multi-VPA split calculations, deep link intent formatting,
API checkout creation, and bank nodal settlement verification.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.upi_service import UPIService

client = TestClient(app)


def test_split_calculation_97_3():
    """Verify standard 97% host and 3% platform calculation on Rs 3000 booking."""
    splits = UPIService.calculate_splits(base_tariff=3000.0, guide_fee=0.0, driver_fee=0.0)
    
    assert splits["base_tariff"] == 3000.0
    assert splits["host_net_payout"] == 2910.0  # 97% of 3000
    assert splits["platform_fee"] == 90.0       # 3% of 3000
    assert splits["total_payable"] == 3000.0
    assert splits["traditional_ota_cut"] == 600.0  # 20% OTA cut
    assert splits["host_savings_vs_ota"] == 510.0  # Saved Rs 510 vs OTA


def test_split_calculation_with_guide_and_driver():
    """Verify add-ons (guide + driver) pass 100% directly to local service providers."""
    splits = UPIService.calculate_splits(
        base_tariff=4000.0,
        guide_fee=1200.0,
        driver_fee=800.0
    )
    
    assert splits["base_tariff"] == 4000.0
    assert splits["host_net_payout"] == 3880.0  # 97% of 4000
    assert splits["platform_fee"] == 120.0      # 3% of 4000
    assert splits["guide_payout"] == 1200.0     # 100% of guide fee
    assert splits["driver_payout"] == 800.0      # 100% of driver fee
    assert splits["total_payable"] == 6000.0    # 4000 + 1200 + 800


def test_generate_upi_intent_url():
    """Verify RFC-compliant UPI deep link string structure."""
    url = UPIService.generate_upi_intent_url(
        payee_vpa="ramesh.gond@sbi",
        payee_name="Ramesh Gond",
        amount=2910.0,
        transaction_ref="TS-TX-1001",
        note="Homestay Stay"
    )
    
    assert url.startswith("upi://pay?")
    assert "pa=ramesh.gond%40sbi" in url or "pa=ramesh.gond@sbi" in url
    assert "am=2910.00" in url
    assert "tr=TS-TX-1001" in url
    assert "cu=INR" in url


def test_api_checkout_split_upi():
    """Verify POST /api/checkout/split-upi returns valid intent with itemized recipients."""
    payload = {
        "place_name": "Tirthan Eco Sanctuary",
        "base_tariff": 3500.0,
        "host_name": "Ramesh Gond",
        "host_vpa": "ramesh.gond@sbi",
        "include_guide": True,
        "guide_fee": 1000.0,
        "include_driver": False,
        "guests": 2,
        "nights": 2
    }
    response = client.post("/api/checkout/split-upi", json=payload)
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert "transaction_id" in data
    assert "booking_id" in data
    assert data["booking_id"].startswith("TS-UPI-")
    assert "primary_upi_intent" in data
    assert "splits" in data
    assert data["splits"]["total_payable"] == 4500.0  # 3500 + 1000
    assert len(data["vpa_recipients"]) >= 3  # Host, Platform, Guide


def test_api_verify_transaction():
    """Verify GET /api/checkout/verify/{tx_id} confirms payment settlement."""
    response = client.get("/api/checkout/verify/TS-TX-TEST-001?simulated_status=success")
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["status"] == "confirmed"
    assert "bank_rrn" in data
    assert "digital_credential" in data


def test_api_protocol_info():
    """Verify GET /api/checkout/protocol-info returns public DPI fee structure."""
    response = client.get("/api/checkout/protocol-info")
    assert response.status_code == 200
    data = response.json()
    
    assert "UPI" in data["settlement_rail"]
    assert "0%" in data["host_commission"]
    assert "3.0%" in data["platform_network_fee"]
