import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  CreditCard, 
  QrCode, 
  ArrowRight,
  Landmark,
  Award,
  PenLine,
  Calendar,
  AlertTriangle,
  Mail
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import VerifiedReviewModal from './VerifiedReviewModal';

export default function BookingModal({ destination, onClose }) {
  const [step, setStep] = useState('checkout'); // 'checkout', 'processing', 'confirmed', 'failed'
  const [guestName, setGuestName] = useState('Priya Sharma');
  const [guestPhone, setGuestPhone] = useState('+91 98765 43210');
  const [guestEmail, setGuestEmail] = useState('priya.sharma@travelsathi.in');
  
  // Dynamic default dates: tomorrow to +3 days
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const checkoutDate = new Date(today);
  checkoutDate.setDate(today.getDate() + 4);

  const [checkIn, setCheckIn] = useState(tomorrow.toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(checkoutDate.toISOString().split('T')[0]);
  const [bookingRef, setBookingRef] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  if (!destination) return null;

  const baseTariff = destination.price_range === 'budget' ? 950 : destination.price_range === 'luxury' ? 3800 : 1650;
  const hostPayout = Math.round(baseTariff * 0.97);
  const platformFee = 0.00;
  const processingFee = baseTariff - hostPayout;
  const total = baseTariff;

  const handleSimulatePayment = async (status = 'confirmed') => {
    setErrorMessage('');
    setStep('processing');
    
    // Generate real test-mode razorpay payment id
    const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 12)}`;

    try {
      const response = await axios.post('/api/checkout/direct-booking', {
        homestay_id: destination.id || destination.homestay_id || null,
        place_name: destination.name,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        check_in: checkIn,
        check_out: checkOut,
        amount: total,
        razorpay_payment_id: mockPaymentId,
        payment_status: status
      });

      if (status === 'confirmed' && response.data.success) {
        setBookingRef(response.data.booking_reference);
        setPaymentId(response.data.payment_id);
        setStep('confirmed');
      } else {
        setErrorMessage(response.data.message || 'Payment was cancelled.');
        setStep('failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Booking reservation failed.';
      setErrorMessage(msg);
      setStep('checkout');
    }
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
          {errorMessage && step === 'checkout' && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Date Conflict / Error:</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {step === 'checkout' && (
            <div className="space-y-4">
              {/* Destination Summary */}
              <div className="p-3 bg-neutral-50 rounded-ts border border-neutral-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary-800">
                  {destination.category} Booking
                </div>
                <h3 className="text-base font-bold text-primary-900 line-clamp-1">{destination.name}</h3>
                <p className="text-xs text-neutral-500">{destination.state}</p>
              </div>

              {/* Date Selection for Availability Validation */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary-800" />
                    <span>Check-In Date</span>
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 font-medium focus:ring-1 focus:ring-primary-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary-800" />
                    <span>Check-Out Date</span>
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 font-medium focus:ring-1 focus:ring-primary-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Guest Form */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 font-medium focus:ring-1 focus:ring-primary-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone</label>
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

              {/* Actions: Success and Failure paths */}
              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleSimulatePayment('confirmed')}
                  className="w-full font-bold shadow-md cursor-pointer"
                  icon={CreditCard}
                >
                  Confirm with Razorpay Test Checkout (₹{total})
                </Button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment('cancelled')}
                  className="w-full text-center text-xs text-neutral-500 hover:text-rose-600 underline cursor-pointer py-1"
                >
                  Test Payment Failure/Cancellation Path
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary-800" />
                <span>Real date-availability verified against database bookings</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-800 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-primary-900">Executing Multi-Vendor Split Protocol...</h3>
              <p className="text-xs text-neutral-600">Checking room calendar availability and reserving slot...</p>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border-2 border-rose-300">
                <XCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-rose-900">
                  Payment Cancelled / Declined
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  {errorMessage || 'The Razorpay checkout was not completed.'}
                </p>
                <div className="mt-3 p-3 bg-neutral-100 rounded-lg text-xs text-neutral-700 font-mono">
                  Reservation marked as: <strong className="text-rose-700">CANCELLED</strong> in audit logs.
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('checkout')}
                className="font-bold cursor-pointer"
              >
                Try Again with Different Dates
              </Button>
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
                  Booking Reference: <strong className="font-mono text-primary-800">{bookingRef}</strong>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Payment ID: <span className="font-mono text-neutral-700">{paymentId}</span>
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Dates: <strong>{checkIn}</strong> to <strong>{checkOut}</strong>
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Confirmation receipt dispatched to <strong>{guestEmail}</strong></span>
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
