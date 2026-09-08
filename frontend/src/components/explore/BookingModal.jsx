import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  ArrowRight,
  Landmark,
  Award,
  PenLine
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import VerifiedReviewModal from './VerifiedReviewModal';

export default function BookingModal({ destination, onClose }) {
  const [step, setStep] = useState('checkout'); // 'checkout', 'processing', 'confirmed'
  const [guestName, setGuestName] = useState('Priya Sharma');
  const [guestPhone, setGuestPhone] = useState('+91 98765 43210');
  const [bookingRef, setBookingRef] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  if (!destination) return null;

  const baseTariff = destination.price_range === 'budget' ? 950 : destination.price_range === 'luxury' ? 3800 : 1650;
  const hostPayout = Math.round(baseTariff * 0.97);
  const platformFee = 0.00;
  const processingFee = baseTariff - hostPayout;
  const total = baseTariff;

  const handleSimulatePayment = () => {
    setStep('processing');
    setTimeout(() => {
      const generatedRef = `TS-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingRef(generatedRef);
      setStep('confirmed');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-ivory rounded-ts shadow-2xl border border-neutral-300 w-full max-w-lg overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-primary-800 text-ivory px-6 py-4 flex items-center justify-between border-b border-primary-900/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary-400" />
            <span className="font-display font-bold text-base text-ivory">
              Zero-Commission Direct Checkout
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-primary-900 text-ivory/80 hover:text-ivory transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'checkout' && (
            <div className="space-y-5">
              {/* Destination Summary */}
              <div className="p-3 bg-neutral-50 rounded-ts border border-neutral-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary-800">
                  {destination.category} Booking
                </div>
                <h3 className="text-base font-bold text-primary-900 line-clamp-1">{destination.name}</h3>
                <p className="text-xs text-neutral-500">{destination.state}</p>
              </div>

              {/* Guest Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Primary Guest Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 font-medium focus:ring-1 focus:ring-primary-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone Number (UPI Verified)</label>
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 font-medium focus:ring-1 focus:ring-primary-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Zero-Commission Split Breakdown */}
              <div className="p-4 bg-primary-50/40 rounded-ts border border-primary-800/15 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-neutral-700">
                  <span>Standard Room Tariff:</span>
                  <span>₹{baseTariff}.00</span>
                </div>
                <div className="flex items-center justify-between text-secondary-800 font-bold">
                  <span>Host Direct Payout (97%):</span>
                  <span>₹{hostPayout}.00</span>
                </div>
                <div className="flex items-center justify-between text-accent-900 font-bold">
                  <span>Platform Fee (TravelSathi DPI):</span>
                  <span className="bg-secondary-50 text-secondary-800 px-1.5 py-0.5 rounded border border-secondary-800/20">
                    ₹0.00 (0% Commission)
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                  <span>Payment Gateway & Taxes (3%):</span>
                  <span>₹{processingFee}.00</span>
                </div>
                <div className="pt-2 border-t border-primary-800/20 flex items-center justify-between text-sm font-bold text-primary-900">
                  <span>Total Amount:</span>
                  <span>₹{total}.00</span>
                </div>
              </div>

              {/* Action */}
              <Button
                variant="primary"
                size="md"
                onClick={handleSimulatePayment}
                className="w-full font-bold shadow-md"
                icon={CreditCard}
              >
                Simulate Razorpay Test Checkout (₹{total})
              </Button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary-800" />
                <span>Test sandbox mode • Zero real money charged</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-800 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-primary-900">Executing Multi-Vendor Split Protocol...</h3>
              <p className="text-xs text-neutral-600">Routing 97% directly to local host escrow and 0% platform fee.</p>
            </div>
          )}

          {step === 'confirmed' && (
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-secondary-50 text-secondary-800 flex items-center justify-center mx-auto border-2 border-secondary-800/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-display font-bold text-primary-900">
                  Direct Booking Confirmed!
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Reference: <strong className="font-mono text-primary-800">{bookingRef}</strong>
                </p>
              </div>

              <div className="p-3.5 bg-secondary-50 border border-secondary-800/20 rounded-ts text-xs text-secondary-900 text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-secondary-800 mb-1">
                  <Award className="w-4 h-4 text-secondary-800" />
                  <span>Achievement Unlocked: Heritage Explorer Badge!</span>
                </div>
                <p className="text-[11px] text-secondary-800">
                  You saved the local host ₹{(baseTariff * 0.25).toFixed(0)} in OTA commission. 50 Eco-Tokens awarded to your profile!
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="md" 
                  onClick={onClose} 
                  className="w-full font-bold"
                >
                  Return to Catalog
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => setShowReviewModal(true)} 
                  className="w-full font-bold shadow-sm"
                  icon={PenLine}
                >
                  Leave Verified Review
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Verified Review Modal from Confirmed Booking */}
        {showReviewModal && (
          <VerifiedReviewModal
            destination={destination}
            initialBookingId={bookingRef}
            onClose={() => setShowReviewModal(false)}
            onReviewSubmitted={() => {
              setShowReviewModal(false);
              onClose();
            }}
          />
        )}

      </div>
    </div>
  );
}
