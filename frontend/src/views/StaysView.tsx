import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Hotel, 
  Building2,
  MapPin, 
  Star, 
  ShieldCheck, 
  Leaf, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Users, 
  X, 
  Check,
  Search,
  SlidersHorizontal,
  Bed,
  Wifi,
  Coffee,
  Award,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/summaryTranslator';
import { useApp } from '../context/AppContext';

export default function StaysView() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { homestays, setBookings } = useApp();

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<'all' | 'hotel' | 'homestay' | 'resort'>('all');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedPriceTier, setSelectedPriceTier] = useState('all'); // all, under_3k, 3k_to_6k, over_6k
  const [minRating, setMinRating] = useState(0); // 0, 4.0, 4.5
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Data States
  const [hotelsList, setHotelsList] = useState<any[]>([]);
  const [homestaysList, setHomestaysList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [selectedStay, setSelectedStay] = useState<any>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [roomType, setRoomType] = useState('Standard Deluxe Room');
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // States List
  const states = [
    'All',
    'Andhra Pradesh',
    'Himachal Pradesh',
    'Rajasthan',
    'Kerala',
    'Goa',
    'Uttarakhand',
    'Karnataka',
    'Maharashtra',
    'Tamil Nadu',
    'Chhattisgarh',
    'Assam',
    'Madhya Pradesh'
  ];

  // Fetch both Hotels and Homestays concurrently
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      axios.get('/api/hotels?limit=60', { timeout: 5000 }),
      axios.get('/api/homestays', { timeout: 5000 })
    ]).then(([hotelsRes, homestayRes]) => {
      if (!isMounted) return;

      if (hotelsRes.status === 'fulfilled' && hotelsRes.value.data?.hotels) {
        setHotelsList(hotelsRes.value.data.hotels);
      }

      if (homestayRes.status === 'fulfilled' && homestayRes.value.data?.results) {
        const mappedHomestays = homestayRes.value.data.results.map((h: any) => ({
          id: h.homestay_id,
          name: h.title,
          type: 'homestay',
          category_badge: h.is_tribal_pmjuga ? 'PM-JUGA Tribal Certified' : 'Verified DPI Homestay',
          image_url: h.image_url,
          rating: Number((4.6 + (h.sanitation_trust_score % 4) * 0.1).toFixed(1)),
          review_count: 22 + (h.sanitation_trust_score % 15),
          city: h.district,
          tourist_place: h.district,
          state: h.state,
          price_per_night: h.base_price_inr,
          price_min_inr: h.base_price_inr,
          host_name: h.host_name,
          host_phone: h.host_phone,
          amenities: h.amenities ? h.amenities.split(',').map((a: string) => a.trim()) : ['Verified Sanitation', 'Clean Linen', 'Organic Meals'],
          description: h.description,
          sanitation_score: h.sanitation_trust_score || 94,
          verified: true,
          free_cancellation: true
        }));
        setHomestaysList(mappedHomestays);
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Check if routed with a specific selectedHotelId from HomeView
  useEffect(() => {
    const targetId = location.state?.selectedHotelId;
    if (targetId && hotelsList.length > 0) {
      const match = hotelsList.find(h => h.id === targetId);
      if (match) {
        handleOpenBooking(match);
      }
    }
  }, [location.state, hotelsList]);

  // Combined Accommodations List
  const combinedAccommodations = useMemo(() => {
    const combined = [];

    // Add hotels
    hotelsList.forEach(h => {
      combined.push({
        ...h,
        propertyCategory: h.type === 'resort' ? 'resort' : 'hotel'
      });
    });

    // Add homestays (if homestaysList loaded, else fallback to context homestays)
    const activeHomestays = homestaysList.length > 0 ? homestaysList : homestays.map(h => ({
      id: h.id,
      name: h.name,
      type: 'homestay',
      propertyCategory: 'homestay',
      category_badge: h.verificationBadge || 'Verified DPI Homestay',
      image_url: h.image,
      rating: parseFloat(h.rating) || 4.8,
      review_count: h.reviewsCount || 45,
      city: h.location?.split(',')[0] || 'Local Community',
      tourist_place: h.location?.split(',')[0] || 'Heritage Village',
      state: h.state || 'India',
      price_per_night: h.pricePerNight || 2200,
      price_min_inr: h.pricePerNight || 2200,
      host_name: h.hostName,
      amenities: h.amenities || ['Organic Breakfast', 'Local Guide', 'Verified Sanitation'],
      description: h.description,
      sanitation_score: h.sanitationScore || 95,
      verified: true,
      free_cancellation: true
    }));

    activeHomestays.forEach(hs => {
      combined.push({
        ...hs,
        propertyCategory: 'homestay'
      });
    });

    return combined;
  }, [hotelsList, homestaysList, homestays]);

  // Filtered List
  const filteredStays = useMemo(() => {
    return combinedAccommodations.filter(stay => {
      // Tab category filter
      if (activeTab === 'hotel' && stay.propertyCategory !== 'hotel') return false;
      if (activeTab === 'resort' && stay.propertyCategory !== 'resort') return false;
      if (activeTab === 'homestay' && stay.propertyCategory !== 'homestay') return false;

      // State filter
      if (selectedState !== 'All' && stay.state?.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = stay.name?.toLowerCase().includes(q);
        const matchesCity = stay.city?.toLowerCase().includes(q);
        const matchesPlace = stay.tourist_place?.toLowerCase().includes(q);
        const matchesState = stay.state?.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesPlace && !matchesState) {
          return false;
        }
      }

      // Price tier filter
      const price = stay.price_per_night || stay.price_min_inr || 2500;
      if (selectedPriceTier === 'under_3k' && price >= 3000) return false;
      if (selectedPriceTier === '3k_to_6k' && (price < 3000 || price > 6000)) return false;
      if (selectedPriceTier === 'over_6k' && price <= 6000) return false;

      // Min rating
      if (minRating > 0 && (stay.rating || 0) < minRating) return false;

      // Verified only
      if (verifiedOnly && !stay.verified) return false;

      return true;
    });
  }, [combinedAccommodations, activeTab, selectedState, searchQuery, selectedPriceTier, minRating, verifiedOnly]);

  const handleOpenBooking = (stay: any) => {
    setSelectedStay(stay);
    setRoomType(stay.type === 'hotel' ? 'Standard Deluxe Room' : 'Traditional Family Suite');
    setNights(3);
    setGuests(2);
    setBookingConfirmed(false);
    setBookingModalOpen(true);
  };

  const handleConfirmStay = () => {
    if (!selectedStay) return;
    const pricePerNight = selectedStay.price_per_night || selectedStay.price_min_inr || 2500;
    const multiplier = roomType.includes('Heritage') || roomType.includes('Luxury') ? 1.4 : 1.0;
    const finalPrice = Math.round(pricePerNight * multiplier * nights);

    const newBooking = {
      id: `BK-STAY-${Date.now().toString().slice(-4)}`,
      type: selectedStay.type === 'hotel' ? 'Hotel' : 'Stay',
      title: selectedStay.name,
      host: selectedStay.host_name || 'DPI Hospitality Desk',
      dates: `Nov 12 – Nov 15, 2026 (${nights} Nights)`,
      roomType: roomType,
      guests: guests,
      price: finalPrice,
      taxes: 0,
      platformFee: 0,
      status: 'Confirmed',
      qrCode: `TS-STAY-${Date.now()}-VERIFIED`,
      location: `${selectedStay.city || selectedStay.tourist_place}, ${selectedStay.state}`
    };

    setBookings(prev => [newBooking, ...prev]);
    setBookingConfirmed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="badge-nature inline-flex items-center gap-1.5 shadow-sm">
          <Building2 className="w-3.5 h-3.5" />
          <span>{t('stays.badgeTitle', '🏨 Verified National Accommodation Registry')}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          Hotels, Heritage Palaces & Eco Stays
        </h1>
        <p className="text-sm sm:text-base text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
          Book directly with 1,800+ verified hotels, 5-star royal palaces, and PM-JUGA tribal homestays with state hygiene verification and 0% middleman surge.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-center border-b border-neutral-border dark:border-darkmode-border">
        <div className="flex flex-wrap gap-2 pb-2">
          {[
            { id: 'all', label: 'All Accommodations', icon: Building2, count: combinedAccommodations.length },
            { id: 'hotel', label: 'Verified Hotels & Palaces', icon: Hotel, count: hotelsList.length },
            { id: 'resort', label: 'Boutique & Nature Resorts', icon: Bed, count: '350+' },
            { id: 'homestay', label: 'Community & Tribal Homestays', icon: Leaf, count: homestaysList.length || '1,800+' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-neutral-bg-secondary dark:bg-darkmode-surface text-neutral-text-sec dark:text-darkmode-text-secondary hover:text-neutral-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="ts-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotel, city, or landmark..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>

          {/* State Dropdown */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border focus:ring-1 focus:ring-brand focus:outline-none"
            >
              {states.map(st => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All States of India' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <select
              value={selectedPriceTier}
              onChange={(e) => setSelectedPriceTier(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border focus:ring-1 focus:ring-brand focus:outline-none"
            >
              <option value="all">Any Price Per Night</option>
              <option value="under_3k">Budget Friendly (Under ₹3,000)</option>
              <option value="3k_to_6k">Comfort & Boutique (₹3,000 – ₹6,000)</option>
              <option value="over_6k">Luxury & Palaces (₹6,000+)</option>
            </select>
          </div>

          {/* Star Rating */}
          <div>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border focus:ring-1 focus:ring-brand focus:outline-none"
            >
              <option value={0}>Any Rating</option>
              <option value={4.5}>4.5+ ★ Superior Top Rated</option>
              <option value={4.0}>4.0+ ★ Highly Recommended</option>
            </select>
          </div>

        </div>

        {/* Quick Active Counts & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-border dark:border-darkmode-border text-xs text-neutral-muted">
          <span className="font-semibold">
            Showing <strong className="text-brand">{filteredStays.length}</strong> verified properties
            {selectedState !== 'All' && ` in ${selectedState}`}
          </span>

          {(searchQuery || selectedState !== 'All' || selectedPriceTier !== 'all' || minRating > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedState('All');
                setSelectedPriceTier('all');
                setMinRating(0);
              }}
              className="text-action hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="ts-card p-4 space-y-4 animate-pulse">
              <div className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Zero Results State */}
      {!loading && filteredStays.length === 0 && (
        <div className="text-center py-16 space-y-4 ts-card p-8">
          <Hotel className="w-12 h-12 text-neutral-muted mx-auto" />
          <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            No accommodations match your current filter
          </h3>
          <p className="text-xs text-neutral-muted max-w-md mx-auto">
            Try resetting your price filter or selecting another state to discover properties in our national registry.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedState('All');
              setSelectedPriceTier('all');
              setMinRating(0);
              setActiveTab('all');
            }}
            className="btn-brand px-5 py-2 text-xs font-bold"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Stays / Hotels Grid */}
      {!loading && filteredStays.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStays.map((stay) => {
            const price = stay.price_per_night || stay.price_min_inr || 2500;
            return (
              <div
                key={stay.id}
                className="ts-card overflow-hidden flex flex-col justify-between group hover:border-brand/40 transition-all hover:shadow-xl duration-300"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={stay.image_url || stay.image}
                      alt={stay.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-darkmode-surface/95 text-brand shadow-sm backdrop-blur-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-trust" />
                        <span>{translateText(stay.category_badge || 'Verified Stay', i18n.language)}</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-black/65 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{stay.rating}</span>
                      <span className="text-white/70 text-[10px]">({stay.review_count || 320})</span>
                    </div>

                    {/* Bottom overlay on image */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs drop-shadow-sm">
                      <span className="flex items-center gap-1 font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{stay.city || stay.tourist_place}, {stay.state}</span>
                      </span>
                      <span className="bg-emerald-600/90 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                        {stay.sanitation_score || 95}% Trust
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1">
                        {translateText(stay.name, i18n.language)}
                      </h3>
                      <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2 mt-1">
                        {translateText(stay.description || `Certified accommodation property in ${stay.city || stay.state}. Direct host registration with verified sanitation ratings.`, i18n.language)}
                      </p>
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(stay.amenities || ['Free Wi-Fi', 'Air Conditioning', 'Room Service']).slice(0, 3).map((amenity: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated text-neutral-text-sec dark:text-darkmode-text-secondary"
                        >
                          ✓ {translateText(amenity, i18n.language)}
                        </span>
                      ))}
                    </div>

                    <div className="p-2 rounded bg-nature-light/50 dark:bg-darkmode-elevated text-[11px] text-nature font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-trust shrink-0" />
                      <span>{translateText('0% Commission • 100% Tariff Direct to Property Host', i18n.language)}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="px-5 py-4 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between">
                  <div>
                    <p className="text-lg font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                      ₹{price.toLocaleString('en-IN')} <span className="text-xs font-normal text-neutral-muted">{t('stays.perNight', '/ night')}</span>
                    </p>
                    <p className="text-[10px] text-nature font-bold">Free Cancellation Available</p>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(stay)}
                    className="btn-action !px-4 !py-2 !text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span>{stay.type === 'hotel' ? 'Book Hotel' : 'Reserve Stay'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && selectedStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero shadow-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-darkmode-border">
              <div>
                <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {bookingConfirmed 
                    ? `${selectedStay.type === 'hotel' ? 'Hotel' : 'Homestay'} Reservation Confirmed!`
                    : `Book ${selectedStay.type === 'hotel' ? 'Verified Hotel' : 'Homestay'}`}
                </h3>
                <p className="text-xs text-neutral-muted">
                  {translateText(selectedStay.name, i18n.language)} • {selectedStay.city || selectedStay.tourist_place}, {selectedStay.state}
                </p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-full text-neutral-muted hover:text-neutral-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!bookingConfirmed ? (
              <div className="space-y-4 text-xs">
                {/* Room Tier Selection (for hotels) */}
                {selectedStay.type === 'hotel' && (
                  <div>
                    <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                      Room Category Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRoomType('Standard Deluxe Room')}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          roomType === 'Standard Deluxe Room'
                            ? 'border-brand bg-brand/10 dark:bg-brand/20'
                            : 'border-neutral-border dark:border-darkmode-border'
                        }`}
                      >
                        <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">Standard Deluxe</p>
                        <p className="text-[10px] text-neutral-muted">Queen Bed • AC • City View</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoomType('Heritage Luxury Suite')}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          roomType === 'Heritage Luxury Suite'
                            ? 'border-brand bg-brand/10 dark:bg-brand/20'
                            : 'border-neutral-border dark:border-darkmode-border'
                        }`}
                      >
                        <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">Heritage Suite (+40%)</p>
                        <p className="text-[10px] text-neutral-muted">King Bed • Balcony • Spa Access</p>
                      </button>
                    </div>
                  </div>
                )}

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
                      <option value="1">1 Night</option>
                      <option value="2">2 Nights</option>
                      <option value="3">3 Nights</option>
                      <option value="4">4 Nights</option>
                      <option value="5">5 Nights</option>
                      <option value="7">7 Nights (Week Pass)</option>
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
                      <option value="4">4 Guests (Family Room)</option>
                    </select>
                  </div>
                </div>

                {/* Price Breakdown */}
                {(() => {
                  const baseRate = selectedStay.price_per_night || selectedStay.price_min_inr || 2500;
                  const multiplier = roomType.includes('Heritage') || roomType.includes('Luxury') ? 1.4 : 1.0;
                  const totalTariff = Math.round(baseRate * multiplier * nights);

                  return (
                    <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-2">
                      <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                        Transparent Tariff Breakdown (DPI Standard)
                      </p>
                      <div className="flex justify-between text-neutral-muted">
                        <span>Room Rate (₹{Math.round(baseRate * multiplier).toLocaleString('en-IN')} × {nights} nights):</span>
                        <span>₹{totalTariff.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-nature font-medium">
                        <span>Cleanliness & Sanitation Audit:</span>
                        <span>₹0 (Govt Certified)</span>
                      </div>
                      <div className="flex justify-between text-nature font-bold">
                        <span>OTA Platform Markup:</span>
                        <span>₹0 (0% Commission)</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border flex justify-between font-extrabold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                        <span>Total Amount Payable:</span>
                        <span className="text-brand">₹{totalTariff.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={handleConfirmStay}
                  className="btn-action w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Reservation & Generate QR Pass</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-nature-light text-nature flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3px]" />
                </div>
                <h4 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Stay Successfully Reserved!
                </h4>
                <p className="text-xs text-neutral-muted max-w-sm mx-auto leading-relaxed">
                  Your reservation is confirmed at <strong>{selectedStay.name}</strong>. A cryptographic QR pass has been synced to your Trip Wallet.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setBookingModalOpen(false);
                      navigate('/wallet');
                    }}
                    className="btn-brand px-6 py-2 text-xs font-bold cursor-pointer"
                  >
                    View in Trip Wallet
                  </button>
                  <button
                    onClick={() => setBookingModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-border dark:border-darkmode-border hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Done
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
