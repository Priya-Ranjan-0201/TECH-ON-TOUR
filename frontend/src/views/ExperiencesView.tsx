import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Star, 
  Calendar, 
  Sparkles, 
  Users, 
  Check, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/summaryTranslator';
import { useApp } from '../context/AppContext';

export default function ExperiencesView() {
  const { t, i18n } = useTranslation();
  const { experiences, setBookings } = useApp();
  const [liveExpList, setLiveExpList] = useState<any[]>([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    axios.get('/api/experiences')
      .then(res => {
        if (res.data?.results && res.data.results.length > 0) {
          setLiveExpList(res.data.results);
        }
      })
      .catch(() => {});
  }, []);

  const activeExperiences = liveExpList.length > 0 ? liveExpList : experiences;

  const handleOpenBooking = (exp) => {
    setSelectedExp(exp);
    setSelectedSlot(exp.scheduleSlots[0] || '10:00 AM');
    setBookingGuests(2);
    setBookingConfirmed(false);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedExp) return;

    const newBooking = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      type: 'Experience',
      title: selectedExp.title,
      host: selectedExp.hostName,
      dates: `Nov 08, 2026 @ ${selectedSlot}`,
      price: selectedExp.totalPrice * bookingGuests,
      taxes: 0,
      platformFee: 0,
      status: 'Confirmed',
      qrCode: `TS-EXP-${Date.now()}-VERIFIED`,
      location: selectedExp.location
    };

    setBookings(prev => [newBooking, ...prev]);
    setBookingConfirmed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nature-light text-nature text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('experiences.zeroCommission', 'Zero OTA Commission • 100% Direct Community Benefit')}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          {t('experiences.marketplaceTitle', 'Authentic Local Experience Marketplace')}
        </h1>

        <p className="text-sm sm:text-base text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
          {t('experiences.marketplaceSubtitle', 'Book authentic hands-on masterclasses, tribal craft workshops, and mountain heritage walks led by verified local hosts.')}
        </p>
      </div>

      {/* Experiences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {activeExperiences.map((exp) => (
          <div
            key={exp.id}
            className="ts-card overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="badge-nature shadow-sm">
                    {translateText(exp.category || exp.location || 'Heritage Immersion', i18n.language)}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-darkmode-surface/95 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-action fill-action" />
                  <span>{exp.rating}</span>
                  <span className="text-neutral-muted">({exp.reviewCount || exp.reviewsCount || 28})</span>
                </div>
              </div>

              <div className="p-5 space-y-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={exp.hostAvatar || exp.image}
                    alt={exp.hostName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-brand"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                      {translateText(exp.hostName, i18n.language)}
                    </h4>
                    <p className="text-[11px] text-neutral-muted">
                      {translateText(exp.hostRole || exp.hostTitle || 'Govt Certified Guide', i18n.language)}
                    </p>
                  </div>
                </div>

                <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary leading-snug">
                  {translateText(exp.title, i18n.language)}
                </h3>

                <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2">
                  {translateText(exp.description, i18n.language)}
                </p>

                <div className="flex items-center gap-4 text-xs text-neutral-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    {translateText(exp.duration, i18n.language)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    {translateText(exp.location, i18n.language)}
                  </span>
                </div>

                <div className="p-2.5 rounded-ts-sm bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-nature shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <strong className="text-neutral-text-primary dark:text-darkmode-text-primary">{t('experiences.whyVerified', 'Why Verified: ')}</strong>
                    {translateText(exp.verificationReason || exp.verificationBadge || 'Govt Certified Heritage Scout', i18n.language)}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="px-5 py-4 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between">
              <div>
                <p className="text-[11px] text-neutral-muted">{t('experiences.directPrice', 'Direct Host Price')}</p>
                <p className="text-lg font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                  ₹{exp.totalPrice} <span className="text-xs font-normal text-neutral-muted">{t('experiences.perPerson', '/ person')}</span>
                </p>
                <p className="text-[10px] text-nature font-bold">{t('experiences.zeroMiddleman', '0% Middleman Commission')}</p>
              </div>

              <button
                onClick={() => handleOpenBooking(exp)}
                className="btn-action !px-4 !py-2 !text-xs font-bold shadow-sm"
              >
                {t('experiences.bookExperience', 'Book Experience')}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Unified Booking Modal */}
      {bookingModalOpen && selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero shadow-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-darkmode-border">
              <div>
                <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {bookingConfirmed ? t('experiences.modalConfirmed', 'Booking Confirmed!') : t('experiences.modalTitle', 'Book Authentic Experience')}
                </h3>
                <p className="text-xs text-neutral-muted">
                  {translateText(selectedExp.title, i18n.language)}
                </p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-full text-neutral-muted hover:text-neutral-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!bookingConfirmed ? (
              <div className="space-y-4 text-xs">
                
                {/* Select Slot */}
                <div>
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1.5">
                    {t('experiences.selectSlot', 'Select Time Slot')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedExp.scheduleSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-ts-sm text-xs font-bold border transition-colors ${
                          selectedSlot === slot
                            ? 'bg-brand text-white border-brand'
                            : 'bg-neutral-bg dark:bg-darkmode-elevated border-neutral-border text-neutral-text-sec hover:border-brand'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1.5">
                    {t('experiences.numGuests', 'Number of Guests')}
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setBookingGuests(num)}
                        className={`w-9 h-9 rounded-ts-sm text-xs font-bold border ${
                          bookingGuests === num
                            ? 'bg-brand text-white border-brand'
                            : 'bg-neutral-bg dark:bg-darkmode-elevated border-neutral-border text-neutral-text-sec'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparent Price Breakdown (Section 41) */}
                <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-2">
                  <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {t('experiences.priceBreakdown', 'Transparent Price Breakdown')}
                  </p>
                  <div className="flex justify-between text-neutral-muted">
                    <span>{t('experiences.baseFee', 'Base Fee')} (₹{selectedExp.pricePerPerson} × {bookingGuests}):</span>
                    <span>₹{selectedExp.pricePerPerson * bookingGuests}</span>
                  </div>
                  <div className="flex justify-between text-nature font-medium">
                    <span>{t('experiences.taxes', 'Taxes & Local Cess:')}</span>
                    <span>{t('experiences.taxExempt', '₹0 (Under Micro-Artisan Exemption)')}</span>
                  </div>
                  <div className="flex justify-between text-nature font-bold">
                    <span>{t('experiences.platformCommission', 'Platform Commission:')}</span>
                    <span>{t('experiences.platformDpi', '₹0 (National DPI Guarantee)')}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border flex justify-between font-extrabold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                    <span>{t('experiences.totalPayable', 'Total Amount Payable:')}</span>
                    <span className="text-brand">₹{selectedExp.totalPrice * bookingGuests}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="btn-action w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('experiences.confirmUpi', 'Confirm Booking via Split-UPI')}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-nature-light text-nature flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3px]" />
                </div>
                <h4 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {t('experiences.modalConfirmed', 'Booking Confirmed!')}
                </h4>
                <p className="text-xs text-neutral-muted max-w-sm mx-auto leading-relaxed">
                  {t('experiences.confirmedMsg', 'Your reservation is confirmed. Your digital pass and QR code have been saved to your Trip Wallet for offline access.')}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setBookingModalOpen(false)}
                    className="btn-brand px-6 py-2 text-xs font-bold"
                  >
                    {t('experiences.doneWallet', 'Done / View in Wallet')}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
