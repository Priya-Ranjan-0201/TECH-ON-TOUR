import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Hotel, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Leaf, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Users, 
  X,
  Check
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/summaryTranslator';
import { useApp } from '../context/AppContext';

export default function StaysView() {
  const { t, i18n } = useTranslation();
  const { homestays, setBookings } = useApp();
  const [liveStays, setLiveStays] = useState<any[]>([]);
  const [selectedStay, setSelectedStay] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    axios.get('/api/homestays')
      .then(res => {
        if (res.data?.results && res.data.results.length > 0) {
          const mapped = res.data.results.map((h: any) => ({
            id: h.homestay_id,
            name: h.title,
            image: h.image_url,
            verificationBadge: h.is_tribal_pmjuga ? 'PM-JUGA Tribal Certified' : 'Verified DPI Homestay',
            rating: (4.6 + (h.sanitation_trust_score % 4) * 0.1).toFixed(1),
            reviewsCount: 22 + (h.sanitation_trust_score % 15),
            location: `${h.district}, ${h.state}`,
            state: h.state,
            pricePerNight: h.base_price_inr,
            hostName: h.host_name,
            hostPhone: h.host_phone,
            amenities: h.amenities ? h.amenities.split(',').map((a: string) => a.trim()) : ['Verified Sanitation', 'Clean Linen', 'Organic Meals'],
            description: h.description,
            ecoScore: h.sanitation_trust_score || 94,
            sanitationScore: h.sanitation_trust_score,
            isTribal: h.is_tribal_pmjuga
          }));
          setLiveStays(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const activeStays = liveStays.length > 0 ? liveStays : homestays;

  const handleOpenBooking = (stay) => {
    setSelectedStay(stay);
    setNights(3);
    setGuests(2);
    setBookingConfirmed(false);
    setBookingModalOpen(true);
  };

  const handleConfirmStay = () => {
    if (!selectedStay) return;
    const newBooking = {
      id: `BK-STAY-${Date.now().toString().slice(-4)}`,
      type: 'Stay',
      title: selectedStay.name,
      host: selectedStay.hostName,
      dates: `Nov 12 – Nov 15, 2026 (${nights} Nights)`,
      price: selectedStay.pricePerNight * nights,
      taxes: 0,
      platformFee: 0,
      status: 'Confirmed',
      qrCode: `TS-STAY-${Date.now()}-VERIFIED`,
      location: selectedStay.location
    };
    setBookings(prev => [newBooking, ...prev]);
    setBookingConfirmed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="badge-nature">
          {t('stays.badgeTitle', '🏡 PM-JUGA Tribal & Eco Homestays')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          {t('stays.pageTitle', 'Verified Community Stays & Havelis')}
        </h1>
        <p className="text-sm sm:text-base text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
          {t('stays.pageSubtitle', 'Stay directly with local families, traditional Kathkuni timber homes, and tribal heritage retreats with 100% tariff going to the hosts.')}
        </p>
      </div>

      {/* Homestays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {activeStays.map((stay) => (
          <div
            key={stay.id}
            className="ts-card overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={stay.image}
                  alt={stay.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="badge-nature shadow-sm">
                    {translateText(stay.verificationBadge, i18n.language)}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-darkmode-surface/95 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-action fill-action" />
                  <span>{stay.rating}</span>
                  <span className="text-neutral-muted">({stay.reviewsCount})</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-muted">
                  <span className="flex items-center gap-1 font-semibold text-brand">
                    <MapPin className="w-3.5 h-3.5" />
                    {translateText(stay.location, i18n.language)}
                  </span>
                  <span className="font-semibold text-nature">
                    {t('stays.ecoScore', 'Eco')}: {stay.ecoScore ?? stay.sanitationScore ?? 92}/100
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors">
                  {translateText(stay.name, i18n.language)}
                </h3>

                <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2">
                  {translateText(stay.description, i18n.language)}
                </p>

                {/* Amenities pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stay.amenities.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated text-neutral-text-sec dark:text-darkmode-text-secondary"
                    >
                      ✓ {translateText(amenity, i18n.language)}
                    </span>
                  ))}
                </div>

                <div className="p-2 rounded bg-nature-light/50 dark:bg-darkmode-elevated text-[11px] text-nature font-medium">
                  {translateText(stay.supportLocalNote || '100% of payment goes directly to verified host via UPI.', i18n.language)}
                </div>
              </div>
            </div>

            {/* Price & Book */}
            <div className="px-5 py-4 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                  ₹{stay.pricePerNight} <span className="text-xs font-normal text-neutral-muted">{t('stays.perNight', '/ night')}</span>
                </p>
                <p className="text-[10px] text-nature font-bold">{t('stays.zeroMiddleman', '0% Middleman Commission')}</p>
              </div>

              <button
                onClick={() => handleOpenBooking(stay)}
                className="btn-action !px-4 !py-2 !text-xs font-bold"
              >
                {t('stays.reserveStay', 'Reserve Homestay')}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && selectedStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero shadow-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-darkmode-border">
              <div>
                <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {bookingConfirmed ? t('stays.modalConfirmed', 'Homestay Reserved!') : t('stays.modalTitle', 'Book Verified Homestay')}
                </h3>
                <p className="text-xs text-neutral-muted">
                  {translateText(selectedStay.name, i18n.language)} • {translateText(selectedStay.location, i18n.language)}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                      {t('stays.stayDates', 'Stay Duration (Nights)')}
                    </label>
                    <select
                      value={nights}
                      onChange={(e) => setNights(Number(e.target.value))}
                      className="w-full p-2 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-xs font-bold"
                    >
                      <option value="2">2 Nights</option>
                      <option value="3">3 Nights</option>
                      <option value="4">4 Nights</option>
                      <option value="5">5 Nights</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                      {t('stays.numGuests', 'Number of Guests')}
                    </label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full p-2 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-xs font-bold"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-2">
                  <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {t('stays.priceBreakdown', 'Transparent Tariff Breakdown')}
                  </p>
                  <div className="flex justify-between text-neutral-muted">
                    <span>{t('stays.baseTariff', 'Base Tariff')} (₹{selectedStay.pricePerNight} × {nights} nights):</span>
                    <span>₹{selectedStay.pricePerNight * nights}</span>
                  </div>
                  <div className="flex justify-between text-nature font-medium">
                    <span>{t('stays.cleaningHygiene', 'Cleanliness & Sanitation:')}</span>
                    <span>{t('stays.inclusiveAudit', '₹0 (Govt Certified)')}</span>
                  </div>
                  <div className="flex justify-between text-nature font-bold">
                    <span>{t('stays.platformFee', 'Platform Fee:')}</span>
                    <span>₹0 (National DPI Standard)</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border flex justify-between font-extrabold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                    <span>{t('stays.totalPayable', 'Total Amount Payable:')}</span>
                    <span className="text-brand">₹{selectedStay.pricePerNight * nights}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmStay}
                  className="btn-action w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('stays.confirmStay', 'Confirm Homestay Reservation')}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-nature-light text-nature flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3px]" />
                </div>
                <h4 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {t('stays.modalConfirmed', 'Homestay Reserved!')}
                </h4>
                <p className="text-xs text-neutral-muted max-w-sm mx-auto leading-relaxed">
                  {t('stays.confirmedMsg', 'Your reservation is confirmed. Your host has received the notification and your stay pass is in your Trip Wallet.')}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setBookingModalOpen(false)}
                    className="btn-brand px-6 py-2 text-xs font-bold"
                  >
                    {t('stays.doneWallet', 'Done / View in Wallet')}
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
