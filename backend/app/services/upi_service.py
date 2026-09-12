"""
Unified Split-UPI Payment Service.
Generates multi-VPA UPI Deep Link URLs and QR payloads for the TravelSathi
Zero-Middleman Digital Public Infrastructure (DPI) ecosystem.
Splits transactions transparently:
- Host / Artisan / Homestay: 97% direct payout (0% OTA commission)
- Platform DPI Network Fee: 3% operational sustainability
- Certified Local Guide (Optional): 100% direct payout
- Green Transit Driver (Optional): 100% direct payout
"""

import time
import uuid
from typing import Dict, Any, Optional
from urllib.parse import quote_plus


class UPIService:
    """Core UPI payment orchestration service."""

    PLATFORM_VPA = "travelsathi.dpi@sbi"
    PLATFORM_NAME = "TravelSathi DPI Network"
    PLATFORM_FEE_PCT = 0.03  # 3% transparent infrastructure maintenance fee

    @classmethod
    def calculate_splits(
        cls,
        base_tariff: float,
        guide_fee: float = 0.0,
        driver_fee: float = 0.0,
        custom_platform_pct: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculate transparent split breakdown.
        - Host receives base_tariff * (1 - platform_pct)
        - Platform receives base_tariff * platform_pct
        - Guide receives 100% of guide_fee
        - Driver receives 100% of driver_fee
        """
        pct = custom_platform_pct if custom_platform_pct is not None else cls.PLATFORM_FEE_PCT
        platform_fee = round(base_tariff * pct, 2)
        host_net = round(base_tariff - platform_fee, 2)
        
        guide_payout = round(guide_fee, 2)
        driver_payout = round(driver_fee, 2)
        total_payable = round(base_tariff + guide_payout + driver_payout, 2)

        # Estimate OTA commission savings (OTAs typically charge 18-25%)
        traditional_ota_cut = round(base_tariff * 0.20, 2)
        host_savings = round(traditional_ota_cut - platform_fee, 2)

        return {
            "base_tariff": base_tariff,
            "host_net_payout": host_net,
            "host_share_pct": round((1 - pct) * 100, 1),
            "platform_fee": platform_fee,
            "platform_fee_pct": round(pct * 100, 1),
            "guide_payout": guide_payout,
            "driver_payout": driver_payout,
            "total_payable": total_payable,
            "traditional_ota_cut": traditional_ota_cut,
            "host_savings_vs_ota": host_savings,
        }

    @classmethod
    def generate_upi_intent_url(
        cls,
        payee_vpa: str,
        payee_name: str,
        amount: float,
        transaction_ref: str,
        note: str = "TravelSathi Verified Booking"
    ) -> str:
        """
        Generates standard RFC-compliant UPI deep link URL.
        Format: upi://pay?pa={VPA}&pn={NAME}&am={AMOUNT}&tr={REF}&tn={NOTE}&cu=INR
        """
        encoded_name = quote_plus(payee_name)
        encoded_note = quote_plus(note)
        formatted_amount = f"{amount:.2f}"
        
        return (
            f"upi://pay?pa={payee_vpa}&pn={encoded_name}"
            f"&am={formatted_amount}&tr={transaction_ref}&tn={encoded_note}&cu=INR"
        )

    @classmethod
    def create_split_checkout_intent(
        cls,
        booking_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a split-UPI checkout intent payload with multi-VPA breakdown,
        UPI deep links, and demo QR code simulation data.
        """
        base_tariff = float(booking_data.get("base_tariff", 2500.0))
        guide_fee = float(booking_data.get("guide_fee", 0.0))
        driver_fee = float(booking_data.get("driver_fee", 0.0))

        host_vpa = booking_data.get("host_vpa", "ramesh.gond.homestay@sbi")
        host_name = booking_data.get("host_name", "Ramesh Gond (PM-JUGA Host)")
        guide_vpa = booking_data.get("guide_vpa", "tashi.certified.guide@okhdfcbank")
        guide_name = booking_data.get("guide_name", "Tashi Dorje (Certified Guide)")
        driver_vpa = booking_data.get("driver_vpa", "kullu.greentransit@paytm")
        driver_name = booking_data.get("driver_name", "Green Valley EV Cabs")

        splits = cls.calculate_splits(
            base_tariff=base_tariff,
            guide_fee=guide_fee,
            driver_fee=driver_fee
        )

        tx_id = f"TS-TX-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
        booking_id = f"TS-UPI-{uuid.uuid4().hex[:6].upper()}"

        # Primary payment intent (Total amount routed through UPI instant nodal split)
        primary_upi_intent = cls.generate_upi_intent_url(
            payee_vpa=host_vpa,
            payee_name=host_name,
            amount=splits["total_payable"],
            transaction_ref=tx_id,
            note=f"TravelSathi Stay #{booking_id}"
        )

        # Micro-intents for direct P2P split visualization
        host_split_intent = cls.generate_upi_intent_url(
            payee_vpa=host_vpa,
            payee_name=host_name,
            amount=splits["host_net_payout"],
            transaction_ref=f"{tx_id}-HST",
            note=f"Host 97% Payout: {booking_id}"
        )

        platform_split_intent = cls.generate_upi_intent_url(
            payee_vpa=cls.PLATFORM_VPA,
            payee_name=cls.PLATFORM_NAME,
            amount=splits["platform_fee"],
            transaction_ref=f"{tx_id}-DPI",
            note=f"Platform 3% Network Fee: {booking_id}"
        )

        vpa_recipients = [
            {
                "recipient_role": "Host / Homestay Owner",
                "name": host_name,
                "vpa": host_vpa,
                "amount": splits["host_net_payout"],
                "percentage": "97.0%",
                "description": "Direct payout (0% OTA commission deducted)",
                "upi_url": host_split_intent
            },
            {
                "recipient_role": "TravelSathi DPI Platform",
                "name": cls.PLATFORM_NAME,
                "vpa": cls.PLATFORM_VPA,
                "amount": splits["platform_fee"],
                "percentage": "3.0%",
                "description": "Transparent Digital Public Good maintenance fee",
                "upi_url": platform_split_intent
            }
        ]

        if guide_fee > 0:
            guide_intent = cls.generate_upi_intent_url(
                payee_vpa=guide_vpa,
                payee_name=guide_name,
                amount=splits["guide_payout"],
                transaction_ref=f"{tx_id}-GDE",
                note=f"Guide Direct Payout: {booking_id}"
            )
            vpa_recipients.append({
                "recipient_role": "Certified Local Guide",
                "name": guide_name,
                "vpa": guide_vpa,
                "amount": splits["guide_payout"],
                "percentage": "100% of guide fee",
                "description": "Direct payout to verified local cultural guide",
                "upi_url": guide_intent
            })

        if driver_fee > 0:
            driver_intent = cls.generate_upi_intent_url(
                payee_vpa=driver_vpa,
                payee_name=driver_name,
                amount=splits["driver_payout"],
                transaction_ref=f"{tx_id}-DRV",
                note=f"Driver Direct Payout: {booking_id}"
            )
            vpa_recipients.append({
                "recipient_role": "Green Transit Driver",
                "name": driver_name,
                "vpa": driver_vpa,
                "amount": splits["driver_payout"],
                "percentage": "100% of transit fee",
                "description": "Direct payout to eco-transit mobility partner",
                "upi_url": driver_intent
            })

        return {
            "success": True,
            "transaction_id": tx_id,
            "booking_id": booking_id,
            "status": "pending",
            "created_at": time.time(),
            "currency": "INR",
            "splits": splits,
            "primary_upi_intent": primary_upi_intent,
            "qr_payload": primary_upi_intent,
            "vpa_recipients": vpa_recipients,
            "booking_details": {
                "place_name": booking_data.get("place_name", "Tirthan Eco Sanctuary"),
                "check_in": booking_data.get("check_in", "2026-10-15"),
                "check_out": booking_data.get("check_out", "2026-10-18"),
                "guests": booking_data.get("guests", 2),
                "nights": booking_data.get("nights", 3),
            }
        }

    @classmethod
    def verify_transaction(
        cls,
        transaction_id: str,
        simulated_status: str = "success"
    ) -> Dict[str, Any]:
        """
        Verify payment completion on the UPI / bank nodal rail.
        Issues confirmed booking credential.
        """
        if simulated_status == "failure":
            return {
                "success": False,
                "transaction_id": transaction_id,
                "status": "failed",
                "message": "Payment timed out or declined by issuing bank UPI rail."
            }

        return {
            "success": True,
            "transaction_id": transaction_id,
            "status": "confirmed",
            "bank_rrn": f"RRN{int(time.time())}{uuid.uuid4().hex[:4].upper()}",
            "verified_at": time.time(),
            "digital_credential": {
                "issued_by": "TravelSathi National DPI Ledger",
                "protocol": "UPI 2.0 Auto-Nodal Escrow",
                "settlement": "Instant Direct-to-Host NEFT/IMPS",
                "message": "Payment confirmed. Booking reference is unlocked for verified reviews."
            }
        }
