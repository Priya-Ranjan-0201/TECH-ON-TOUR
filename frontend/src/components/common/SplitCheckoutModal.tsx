import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  ExternalLink, 
  ShieldCheck, 
  UserCheck, 
  Car, 
  Sparkles, 
  Percent, 
  ArrowRight,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SplitCheckoutModal({ isOpen, onClose, bookingItem, onBookingConfirmed }: { isOpen?: boolean; onClose?: any; bookingItem?: any; onBookingConfirmed?: any }) {
  const { addBooking } = useApp();

  const [includeGuide, setIncludeGuide] = useState(false);
  const [includeDriver, setIncludeDriver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Default values
  const baseTariff = bookingItem?.price ? Number(bookingItem.price) : 2800;
  const placeName = bookingItem?.title || bookingItem?.name || "Tirthan Valley Eco Sanctuary";
  const hostName = bookingItem?.host || "Ramesh Gond (PM-JUGA Host)";
  const hostVpa = bookingItem?.hostVpa || "ramesh.gond.homestay@sbi";

  const guideFee = 1000;
  const driverFee = 800;

  // Real-time calculation
  const platformFee = Math.round(baseTariff * 0.03);
  const hostNet = baseTariff - platformFee;
  const totalAmount = baseTariff + (includeGuide ? guideFee : 0) + (includeDriver ? driverFee : 0);

  // Estimated traditional OTA cut (20%)
  const traditionalOtaCut = Math.round(baseTariff * 0.20);
  const hostSavings = traditionalOtaCut - platformFee;

  useEffect(() => {
    if (isOpen) {
      setPaymentSuccess(false);
      setIsProcessing(false);
      setConfirmedData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(hostVpa)}&pn=${encodeURIComponent(hostName)}&am=${totalAmount.toFixed(2)}&tn=${encodeURIComponent(`TravelSathi Stay #${placeName}`)}&cu=INR`;

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText(hostVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const generatedBookingId = `TS-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
      const result = {
        id: generatedBookingId,
        booking_id: generatedBookingId,
        placeName: placeName,
        destination: placeName,
        state: bookingItem?.state || "Himachal Pradesh",
        hostName: hostName,
        checkIn: "2026-10-15",
        checkOut: "2026-10-18",
        guests: 2,
        totalPaid: totalAmount,
        hostNetPayout: hostNet,
        platformFee: platformFee,
        guideIncluded: includeGuide,
        driverIncluded: includeDriver,
        status: "confirmed",
        isVerified: true,
        bankRrn: `RRN${Date.now().toString().slice(-8)}`,
        bookedAt: new Date().toISOString()
      };

      if (addBooking) {
        addBooking(result);
      }

      setConfirmedData(result);
      setIsProcessing(false);
      setPaymentSuccess(true);

      if (onBookingConfirmed) {
        onBookingConfirmed(result);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar in Theme 1 Terracotta */}
        <div className="bg-brand text-primary-50 px-6 py-4 flex items-center justify-between border-b border-primary-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Unified Split-UPI Checkout
              </h3>
              <p className="text-xs text-primary-100">
                Zero-Middleman Digital Public Infrastructure (DPI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {paymentSuccess ? (
            /* Confirmed Booking State */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-secondary-50 text-secondary-800 border-2 border-secondary-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-secondary-800" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Payment Settled via Split-UPI!
                </h4>
                <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
                  Bank Reference: <span className="font-mono font-bold text-brand">{confirmedData?.bankRrn}</span>
                </p>
              </div>

              {/* Official Confirmed Credential Card */}
              <div className="p-4 rounded-ts-md bg-secondary-50 border border-secondary-400/40 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="badge-nature font-bold text-xs">
                    ✓ Verified Tourist Booking
                  </span>
                  <span className="font-mono text-xs font-bold text-brand bg-white px-2 py-0.5 rounded border border-neutral-border">
                    {confirmedData?.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-text-sec pt-1">
                  <div>
                    <span className="text-neutral-muted block text-[11px]">Destination</span>
                    <span className="font-semibold text-neutral-text-primary dark:text-darkmode-text-primary">{confirmedData?.placeName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-muted block text-[11px]">Host Net Direct Payout</span>
                    <span className="font-bold text-secondary-800">₹{confirmedData?.hostNetPayout?.toLocaleString('en-IN')} (97%)</span>
                  </div>
                </div>

                <p className="text-[11px] text-secondary-900 border-t border-secondary-400/30 pt-2">
                  🛡️ This confirmed reference unlocks your <strong>Verified Review</strong> badge, ensuring genuine community trust.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="btn-primary !px-6 !py-2.5 text-xs font-bold"
                >
                  Done & Return to Experience
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Configuration & Split Itemization */
            <>
              {/* Core Reservation Info: Dates, Guests, Total Price */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-darkmode-elevated border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                      {placeName}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Host: {hostName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-primary-900 dark:text-amber-300">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-neutral-400 block">Total Due</span>
                  </div>
                </div>

                {/* Dates & Guest Count Row */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Dates</span>
                    <span className="font-bold text-neutral-900 dark:text-white">15 Oct – 18 Oct 2026 (3 Nights)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Guests</span>
                    <span className="font-bold text-neutral-900 dark:text-white">2 Adults</span>
                  </div>
                </div>
              </div>

              {/* Single Prominent Pay Button */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, var(--ts-accent-600, #C97227) 0%, var(--ts-accent-700, #964A13) 100%)',
                    boxShadow: '0 8px 20px -4px rgba(201, 114, 39, 0.4)'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Verifying with Bank Rail...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pay now via UPI (₹{totalAmount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <a
                    href={upiIntentUrl}
                    className="text-xs text-neutral-500 hover:text-primary-800 underline inline-flex items-center gap-1"
                  >
                    <span>Open in installed UPI app</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-bg dark:bg-darkmode-elevated border-t border-neutral-border flex items-center justify-between text-xs text-neutral-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-secondary-800" />
            NPCI UPI 2.0 Auto-Nodal Escrow Protocol
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-neutral-text-sec hover:text-neutral-text-primary"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
