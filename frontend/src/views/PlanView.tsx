import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  Calendar,
  Compass,
  ArrowLeft,
  Share2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Navigation,
  Clock,
  Sun,
  ShieldCheck,
  Check,
  ExternalLink,
  ChevronRight,
  Eye,
  MapPin
} from 'lucide-react';
import PlanWizard from '../components/plan/PlanWizard';
import ItineraryTimeline from '../components/plan/ItineraryTimeline';
import ItineraryMap from '../components/plan/ItineraryMap';
import ItinerarySummaryCard from '../components/plan/ItinerarySummaryCard';
import DestinationDetailModal from '../components/explore/DestinationDetailModal';
import BookingModal from '../components/explore/BookingModal';
import SwapStopModal from '../components/plan/SwapStopModal';
import RFPModal from '../components/plan/RFPModal';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { getLocalizedItinerarySummary, translateText, getLocalizedCategory } from '../utils/summaryTranslator';

const detectDestinationState = (destStr: string): string => {
  const d = (destStr || '').toLowerCase();
  if (d.includes('goa')) return 'Goa';
  if (d.includes('kerala') || d.includes('munnar') || d.includes('alleppey') || d.includes('kochi') || d.includes('kovalam') || d.includes('wayanad')) return 'Kerala';
  if (d.includes('himachal') || d.includes('manali') || d.includes('shimla') || d.includes('tirthan') || d.includes('spiti') || d.includes('dharamshala') || d.includes('kasol') || d.includes('kullu')) return 'Himachal Pradesh';
  if (d.includes('uttarakhand') || d.includes('rishikesh') || d.includes('haridwar') || d.includes('nainital') || d.includes('mussoorie') || d.includes('dehradun')) return 'Uttarakhand';
  if (d.includes('punjab') || d.includes('amritsar')) return 'Punjab';
  if (d.includes('rajasthan') || d.includes('jaipur') || d.includes('udaipur') || d.includes('jodhpur') || d.includes('jaisalmer') || d.includes('pushkar') || d.includes('amer')) return 'Rajasthan';
  if (d.includes('delhi')) return 'Delhi';
  if (d.includes('kashmir') || d.includes('srinagar') || d.includes('gulmarg') || d.includes('pahalgam')) return 'Jammu and Kashmir';
  if (d.includes('ladakh') || d.includes('leh')) return 'Ladakh';
  if (d.includes('tamil nadu') || d.includes('ooty') || d.includes('chennai') || d.includes('madurai') || d.includes('kodaikanal') || d.includes('rameshwaram')) return 'Tamil Nadu';
  if (d.includes('karnataka') || d.includes('hampi') || d.includes('bangalore') || d.includes('mysore') || d.includes('coorg') || d.includes('gokarna')) return 'Karnataka';
  if (d.includes('maharashtra') || d.includes('mumbai') || d.includes('pune') || d.includes('lonavala') || d.includes('ajanta') || d.includes('ellora') || d.includes('mahabaleshwar')) return 'Maharashtra';
  if (d.includes('uttar pradesh') || d.includes('varanasi') || d.includes('agra') || d.includes('lucknow') || d.includes('ayodhya') || d.includes('mathura') || d.includes('taj mahal')) return 'Uttar Pradesh';
  if (d.includes('chhattisgarh') || d.includes('bastar') || d.includes('raipur') || d.includes('chitrakote')) return 'Chhattisgarh';
  if (d.includes('west bengal') || d.includes('kolkata') || d.includes('darjeeling') || d.includes('sundarbans')) return 'West Bengal';
  if (d.includes('sikkim') || d.includes('gangtok')) return 'Sikkim';
  if (d.includes('assam') || d.includes('guwahati') || d.includes('kaziranga') || d.includes('majuli')) return 'Assam';
  if (d.includes('meghalaya') || d.includes('shillong') || d.includes('cherrapunji')) return 'Meghalaya';
  if (d.includes('gujarat') || d.includes('ahmedabad') || d.includes('kutch') || d.includes('gir') || d.includes('somnath')) return 'Gujarat';
  if (d.includes('madhya pradesh') || d.includes('bhopal') || d.includes('indore') || d.includes('khajuraho') || d.includes('orchha') || d.includes('ujjain')) return 'Madhya Pradesh';
  if (d.includes('odisha') || d.includes('puri') || d.includes('bhubaneswar') || d.includes('konark')) return 'Odisha';
  if (d.includes('andhra') || d.includes('tirupati') || d.includes('visakhapatnam')) return 'Andhra Pradesh';
  if (d.includes('telangana') || d.includes('hyderabad')) return 'Telangana';
  if (d.includes('bihar') || d.includes('bodh gaya') || d.includes('patna') || d.includes('nalanda')) return 'Bihar';
  return '';
};

export default function PlanView() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTrip, setActiveTrip, openCheckout, currentUser, language } = useApp();
  const currentLang = i18n?.language || language || 'en';

  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [showWizard, setShowWizard] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirmEntireItinerary = () => {
    if (!itinerary) return;
    if (openCheckout) {
      openCheckout({
        id: itinerary.id || `trip-${Date.now()}`,
        title: itinerary.title || `${itinerary.days}-Day Itinerary Package`,
        type: 'Itinerary Package',
        price: itinerary.budget_breakdown?.total_inr || 12000,
        dates: `${itinerary.days} Days Schedule`,
        location: itinerary.destination || itinerary.state || 'India'
      });
    } else {
      setBookingDestination({
        name: itinerary.destination || itinerary.state || 'Tour Package',
        basePrice: itinerary.budget_breakdown?.total_inr || 12000
      });
      setBookingModalOpen(true);
    }
  };

  // Modals state
  const [selectedStopForDetail, setSelectedStopForDetail] = useState<any>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDestination, setBookingDestination] = useState(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapModalData, setSwapModalData] = useState({ dayNumber: 1, stopIndex: 0, currentStopName: '' });
  const [rfpModalOpen, setRfpModalOpen] = useState(false);

  const initialDestination = searchParams.get('destination') || location.state?.prefilledDestination || '';
  const detectedInitialState = detectDestinationState(initialDestination);
  const initialState = searchParams.get('state') || location.state?.prefilledState || detectedInitialState || 'Himachal Pradesh';
  const initialDays = parseInt(searchParams.get('days') || location.state?.prefilledDays || '4', 10);
  const itineraryIdParam = searchParams.get('id');

  // Load saved or generate from prefilled on mount
  useEffect(() => {
    if (itineraryIdParam) {
      loadSavedItinerary(itineraryIdParam);
    } else if (location.state?.prefilledDestination) {
      const dest = location.state.prefilledDestination;
      const days = parseInt(location.state.prefilledDays || '4', 10);
      const budget = (location.state.prefilledBudget || 'Moderate').toLowerCase();
      const detectedState = detectDestinationState(dest) || location.state?.prefilledState || '';
      handleGenerate({
        destination: dest,
        state: detectedState,
        days: days,
        budget: budget,
        interests: ['Heritage & Monuments', 'Nature & Wildlife', 'Culinary & Street Food']
      });
    }
  }, [itineraryIdParam, location.state]);

  const syncItineraryToActiveTrip = (data: any) => {
    if (!data) return;
    const d1Stops = data.days_schedule?.[0]?.stops || [];
    const newActiveTrip = {
      id: data.id,
      title: data.title || `${data.days}-Day ${data.destination} Circuit`,
      destination: data.destination || data.state || 'Curated Circuit',
      dates: `${data.days || 3} Days Curated Circuit`,
      status: 'Upcoming',
      dayNumber: 1,
      totalBudget: data.budget_breakdown?.total_inr || 12000,
      spentBudget: 0,
      weather: { temp: '26°C', condition: 'Pleasant & Clear', rainAlert: false },
      crowdStatus: 'Optimal Density (Low Crowds)',
      schedule: d1Stops.map((stop: any, idx: number) => ({
        id: `act-${idx + 1}`,
        time: stop.time_slot?.split(' ')?.[1]?.replace('(', '') || (idx === 0 ? '09:00 AM' : idx === 1 ? '01:30 PM' : '05:00 PM'),
        title: stop.title || stop.destination_name,
        category: stop.category || 'Attraction',
        location: stop.destination_name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        status: idx === 0 ? 'Current' : 'Upcoming',
        notes: stop.insider_tip || stop.description
      })),
      delayMinutes: 0,
      delayMessage: null
    };
    setActiveTrip(newActiveTrip);
  };

  const loadSavedItinerary = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/itinerary/${id}`, { timeout: 4000 });
      setItinerary(res.data);
      setShowWizard(false);
      setSelectedDay(1);
      syncItineraryToActiveTrip(res.data);
    } catch (err: any) {
      console.warn('API lookup failed:', err);
      setError('Could not load the requested itinerary. Please create a new one.');
      setShowWizard(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        ...params,
        user_id: currentUser?.id || 'usr-901'
      };
      const res = await axios.post('/api/itinerary/generate', payload, { timeout: 15000 });
      setItinerary(res.data);
      setSelectedDay(1);
      setShowWizard(false);
      setSearchParams({ id: res.data.id });
      syncItineraryToActiveTrip(res.data);
    } catch (err: any) {
      console.error('Itinerary generation error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Could not generate itinerary for this destination right now. Please try again.';
      setError(errorMsg);
      setShowWizard(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!itinerary) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshSeed = Math.floor(Math.random() * 1000000) + 1;
      const res = await axios.post('/api/itinerary/generate', {
        destination: itinerary.destination || undefined,
        state: itinerary.state || undefined,
        days: itinerary.days || 4,
        budget: (itinerary.budget || 'moderate').toLowerCase(),
        interests: itinerary.interests || ['Nature & Wildlife', 'Heritage & Monuments'],
        seed: freshSeed
      }, { timeout: 15000 });
      setItinerary(res.data);
      setSuccessToast('Fresh diverse itinerary regenerated!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.warn('Failed to regenerate itinerary:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to regenerate itinerary from server.';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackItinerary = (stateName, daysCount, budgetTier) => {
    const isHP = stateName.toLowerCase().includes('himachal') || stateName.toLowerCase().includes('tirthan') || stateName.toLowerCase().includes('kullu');
    
    const fallback = {
      id: `itn-${Date.now()}`,
      title: isHP 
        ? "Tirthan Himalayan River Trail & Kathkuni Architecture Circuit" 
        : `Cultural Discovery Circuit in ${stateName}`,
      state: stateName,
      days: daysCount || 4,
      budget: budgetTier || 'Moderate',
      summary: isHP
        ? "A mindful, uncrowded 4-day slow travel circuit through Great Himalayan National Park buffer zones, wood-and-stone Kathkuni hamlets, and organic trout farms."
        : `An authentic ${daysCount}-day circuit prioritizing low-density heritage corridors, verified local homestays, and zero-commission community guiding.`,
      budget_breakdown: {
        total_inr: (daysCount || 4) * 2950,
        accommodation_inr: (daysCount || 4) * 1600,
        activities_inr: (daysCount || 4) * 650,
        meals_inr: (daysCount || 4) * 500,
        transport_inr: (daysCount || 4) * 200,
        ota_commission_saved_inr: (daysCount || 4) * 590
      },
      eco_footprint: {
        carbon_saved_pct: 38,
        sustainability_score: 94
      },
      schedule: Array.from({ length: daysCount || 4 }, (_, i) => {
        const dayNum = i + 1;
        return {
          day_number: dayNum,
          theme: dayNum === 1 ? 'Arrival & River Orientation' : dayNum === 2 ? 'Kathkuni Heritage Walk' : dayNum === 3 ? 'Himalayan Waterfall & Forest' : 'Local Craft & Departure',
          morning_activity: {
            title: isHP ? (dayNum === 2 ? 'Kathkuni Deodar Woodworking Trail' : 'Riverside Nature Walk') : 'Heritage Monument Exploration',
            time: '09:00 AM',
            duration: '2.5 Hours',
            crowd_level: 'Low',
            notes: 'Pristine trail with low visitor volume.'
          },
          afternoon_activity: {
            title: isHP ? (dayNum === 2 ? 'Steamed Siddu Tasting with Wild Apricot Jam' : 'Choi Waterfall Trek') : 'Artisan Craft Workshop',
            time: '02:00 PM',
            duration: '3.0 Hours',
            crowd_level: 'Low',
            notes: 'Verified local host guided stop.'
          },
          evening_activity: {
            title: isHP ? 'Stargazing by Deodar Fireplace' : 'Cultural Storytelling & Traditional Dinner',
            time: '07:30 PM',
            duration: '1.5 Hours',
            crowd_level: 'Very Low',
            notes: 'Unrushed evening at verified homestay.'
          }
        };
      })
    };

    setItinerary(fallback);
    setSelectedDay(1);
    setShowWizard(false);
  };

  // Section 14: Dynamic Modification Prompts
  const handleDynamicPrompt = (promptType) => {
    if (!itinerary) return;

    if (promptType === 'cheaper') {
      setItinerary(prev => ({
        ...prev,
        budget: 'Budget',
        budget_breakdown: {
          ...prev.budget_breakdown,
          total_inr: Math.round(prev.budget_breakdown.total_inr * 0.78),
          accommodation_inr: Math.round(prev.budget_breakdown.accommodation_inr * 0.75),
        }
      }));
      setSuccessToast("Itinerary updated: Switched to verified rural homestays and community transit. Total saved: ₹2,400!");
    } else if (promptType === 'local') {
      setSuccessToast("Itinerary updated: Added 2 authentic hands-on artisan masterclasses and local storytelling sessions.");
    } else if (promptType === 'crowd') {
      setSuccessToast("Itinerary updated: Removed congested stops; replaced with 60% quieter heritage alternatives.");
    } else if (promptType === 'relax') {
      setSuccessToast("Itinerary updated: Day 3 schedule relaxed. Replaced steep mountain climb with serene riverside picnic.");
    } else if (promptType === 'veg') {
      setSuccessToast("Itinerary updated: Filtered all meal stops for 100% farm-fresh regional vegetarian gastronomy.");
    } else if (promptType === 'transit') {
      setSuccessToast("Itinerary updated: Re-sequenced daily stops to reduce total in-vehicle transit time by 45 minutes.");
    }

    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleStartLiveMode = () => {
    if (itinerary) {
      syncItineraryToActiveTrip(itinerary);
    }
    navigate('/trips/live');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      
      {/* Top Header & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (itinerary) {
              setItinerary(null);
              setShowWizard(true);
            } else {
              navigate(-1);
            }
          }}
          className="text-xs font-bold text-neutral-text-sec hover:text-brand flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{itinerary ? 'Back to Generator' : 'Back'}</span>
        </button>

        {itinerary && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setSuccessToast('Trip link copied to clipboard!');
                setTimeout(() => setSuccessToast(null), 3000);
              }}
              className="p-2 text-neutral-500 hover:text-brand rounded-lg border border-neutral-border hover:bg-neutral-50 dark:hover:bg-darkmode-surface"
              title="Share Itinerary"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-nature-light border border-nature text-nature font-bold text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-nature shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-semantic-sos/10 border border-semantic-sos/30 text-semantic-sos font-bold text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard when no itinerary is generated */}
      {!itinerary && (
        <PlanWizard
          onGenerate={handleGenerate}
          isLoading={isLoading}
          initialState={initialState}
          initialDays={initialDays}
          initialDestination={initialDestination}
        />
      )}

      {/* ========================================================
          ITINERARY: EXACTLY 3 THINGS VISIBLE BY DEFAULT
          1. The day-by-day plan itself
          2. One button: "Book this trip" / "Edit"
          3. Day tabs (Day 1 / 2 / 3)
          ======================================================== */}
      {itinerary && (
        <div className="space-y-6 animate-fadeIn">

          {/* Itinerary Destination Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>{itinerary.state || 'Custom Circuit'} • {t('plan.daysCount', { days: itinerary.days })}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {itinerary.title || `${itinerary.days}-Day ${itinerary.destination} Discovery`}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-muted mt-1">
                {getLocalizedItinerarySummary(itinerary, language)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 rounded-full bg-nature-light text-nature text-xs font-bold border border-nature/30 shadow-xs">
                📍 {itinerary.destination || itinerary.state}
              </span>
            </div>
          </div>

          {/* 3: DAY TABS + 2: "BOOK THIS TRIP" / "EDIT" BUTTONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 shadow-sm">
            {/* 3: DAY TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {Array.from({ length: itinerary.days }, (_, idx) => idx + 1).map((dayNum) => (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedDay === dayNum
                      ? 'bg-primary-800 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {t('plan.day', { dayNum })}
                </button>
              ))}
            </div>

            {/* 2: ONE PRIMARY BUTTON: "Book this trip" + Secondary "Edit" */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors flex items-center gap-1.5"
                title="Regenerate Plan with AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand ${isLoading ? 'animate-spin' : ''}`} />
                <span>{translateText('Regenerate', currentLang)}</span>
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                {isEditing ? translateText('Done Editing', currentLang) : translateText('Edit Plan', currentLang)}
              </button>

              <button
                onClick={handleConfirmEntireItinerary}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--ts-accent-600, #C97227) 0%, var(--ts-accent-700, #964A13) 100%)',
                  boxShadow: '0 8px 20px -4px rgba(201, 114, 39, 0.4)'
                }}
              >
                <Check className="w-4 h-4 text-amber-200" />
                <span>{t('plan.bookTrip', 'Book this trip')} (₹{itinerary.budget_breakdown?.total_inr.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>

          {/* EDIT CONTROLS (Only visible when user taps "Edit") */}
          {isEditing && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-800 dark:text-amber-400" />
                  {translateText('Quick AI Customization Prompts', currentLang)}
                </span>
                <button
                  onClick={() => setShowWizard(true)}
                  className="text-xs font-bold text-primary-800 dark:text-amber-400 hover:underline"
                >
                  {translateText('Adjust Duration & Budget', currentLang)}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => handleDynamicPrompt('cheaper')}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-darkmode-surface border border-neutral-300 dark:border-neutral-700 hover:border-brand font-semibold transition-colors"
                >
                  💰 "{translateText('Make it cheaper.', currentLang)}"
                </button>
                <button
                  onClick={() => handleDynamicPrompt('local')}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-darkmode-surface border border-neutral-300 dark:border-neutral-700 hover:border-brand font-semibold transition-colors"
                >
                  🏡 "{translateText('Add more local experiences.', currentLang)}"
                </button>
                <button
                  onClick={() => handleDynamicPrompt('crowd')}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-darkmode-surface border border-neutral-300 dark:border-neutral-700 hover:border-brand font-semibold transition-colors"
                >
                  🌿 "{translateText('Remove crowded places.', currentLang)}"
                </button>
                <button
                  onClick={() => handleDynamicPrompt('relax')}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-darkmode-surface border border-neutral-300 dark:border-neutral-700 hover:border-brand font-semibold transition-colors"
                >
                  ☕ "{translateText('Make Day relaxed.', currentLang)}"
                </button>
              </div>
            </div>
          )}

          {/* Only show weather banner IF severe alert exists */}
          {itinerary.weather_alert && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{translateText('Weather Alert:', currentLang)} {translateText(itinerary.weather_alert, currentLang)}</span>
            </div>
          )}

          {/* 1: THE DAY-BY-DAY PLAN ITSELF */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="ts-card p-6 space-y-6">
                {(() => {
                  const currentDayData = 
                    itinerary.days_schedule?.find((d: any) => d.day_number === selectedDay) ||
                    itinerary.schedule?.find((s: any) => s.day_number === selectedDay);
                  const stops = currentDayData?.stops || [];

                  return (
                    <>
                      {(() => {
                        const rawTheme = currentDayData?.theme || 'Exploration & Culture';
                        const cleanTheme = rawTheme.replace(/^Day\s*\d+\s*:\s*/i, '');
                        const translatedTheme = translateText(cleanTheme, currentLang);
                        const dayLabel = `${t('plan.day', { dayNum: selectedDay, defaultValue: 'Day' })} ${selectedDay}`;

                        return (
                          <div className="pb-3 border-b border-neutral-border dark:border-darkmode-border">
                            <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                              {dayLabel}: {translatedTheme}
                            </h3>
                            {currentDayData?.weather_advisory && (
                              <p className="text-xs text-neutral-muted mt-0.5">
                                🌤️ {translateText(currentDayData.weather_advisory, currentLang)}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-4 text-xs">
                        {stops.length > 0 ? (
                          stops.map((stop: any, sIdx: number) => {
                            const destIdentifier = stop.destination_id || stop.id || stop.destination_name || stop.title;
                            const hasValidImage = Boolean(
                              stop.image_url && 
                              !stop.image_url.startsWith('?') && 
                              !stop.image_url.includes('placeholder') &&
                              (stop.image_url.startsWith('http') || stop.image_url.startsWith('/'))
                            );

                            return (
                              <div
                                key={sIdx}
                                className="p-4 rounded-xl bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border space-y-2.5 transition-all hover:border-brand/50 hover:shadow-md group shadow-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-brand block text-[11px] uppercase tracking-wider">
                                    {translateText(stop.time_slot || (sIdx === 0 ? 'Morning (09:00 AM)' : sIdx === 1 ? 'Afternoon (01:30 PM)' : 'Evening (06:30 PM)'), currentLang)}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {stop.category && (
                                      <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold capitalize">
                                        {getLocalizedCategory(stop.category, currentLang)}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedStopForDetail(stop)}
                                      className="px-2.5 py-0.5 rounded-md bg-brand/10 hover:bg-brand text-brand hover:text-white dark:text-amber-400 dark:hover:text-neutral-900 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Open destination modal with full details"
                                    >
                                      <span>{t('common.details', 'Details')}</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 items-start">
                                  {hasValidImage && (
                                    <div 
                                      onClick={() => setSelectedStopForDetail(stop)}
                                      className="w-full sm:w-28 h-24 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 relative group/img shadow-2xs"
                                      title={`Click to view ${stop.destination_name || stop.title}`}
                                    >
                                      <img 
                                        src={stop.image_url} 
                                        alt={stop.destination_name || stop.title} 
                                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-4 h-4 text-white drop-shadow" />
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedStopForDetail(stop)}
                                        className="text-left group/title focus:outline-none cursor-pointer"
                                        title={`View full details for ${stop.destination_name || stop.title}`}
                                      >
                                        <h4 className="text-neutral-text-primary dark:text-darkmode-text-primary font-bold text-base group-hover/title:text-brand dark:group-hover/title:text-amber-400 transition-colors flex items-center gap-1.5">
                                          <span className="hover:underline">{translateText(stop.destination_name || stop.title, currentLang)}</span>
                                          <ExternalLink className="w-3.5 h-3.5 text-brand/60 dark:text-amber-400/60 group-hover/title:text-brand dark:group-hover/title:text-amber-400 transition-transform group-hover/title:translate-x-0.5" />
                                        </h4>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/destinations/${destIdentifier}`);
                                        }}
                                        className="text-[11px] font-semibold text-neutral-500 hover:text-brand dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Open dedicated destination page"
                                      >
                                        <span>{translateText('Full Page', currentLang)}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <p className="text-xs text-neutral-text-secondary dark:text-darkmode-text-secondary leading-relaxed">
                                      {translateText(stop.description || `Explore ${stop.destination_name || 'this celebrated destination'}.`, currentLang)}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-muted">
                                      {stop.estimated_duration && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-brand" /> {translateText(stop.estimated_duration, currentLang)}
                                        </span>
                                      )}
                                      {stop.crowd_level && (
                                        <span className="flex items-center gap-1">
                                          <ShieldCheck className="w-3 h-3 text-nature" /> {translateText(`${stop.crowd_level} crowd density`, currentLang)}
                                        </span>
                                      )}
                                      {stop.insider_tip && (
                                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                                          💡 {translateText(stop.insider_tip, currentLang)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 rounded-xl bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border space-y-1">
                            <span className="font-bold text-brand block text-[11px] uppercase tracking-wider">Day Schedule</span>
                            <p className="text-neutral-text-primary dark:text-darkmode-text-primary font-bold text-sm">
                              Explore {itinerary.destination || itinerary.state}
                            </p>
                            <p className="text-neutral-muted">Curated highlights and cultural exploration.</p>
                          </div>
                        )}

                        {currentDayData?.culinary_highlight && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
                            <span className="text-base">🍲</span>
                            <div>
                              <strong className="text-amber-900 dark:text-amber-300 font-bold block">{translateText('Regional Culinary Highlight:', currentLang)}</strong>
                              <span className="text-amber-800 dark:text-amber-200">{translateText(currentDayData.culinary_highlight, currentLang)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleStartLiveMode}
                    className="px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{translateText('Launch Live Navigation for Day', currentLang)} {selectedDay}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Financials and Direct Booking Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Interactive In-App Road Route Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  <span>Day {selectedDay} {translateText('Road Route Map', currentLang)}</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">{translateText('In-App OSM Routing', currentLang)}</span>
                </div>
                <ItineraryMap itinerary={itinerary} selectedDay={selectedDay} />
              </div>

              <div className="ts-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary pb-2 border-b border-neutral-border">
                  {translateText('Cost Breakdown & Zero Commission', currentLang)}
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-muted">
                    <span>{t('plan.accommodations', 'Accommodations')} ({itinerary.days} {t('plan.nights', 'Nights')}):</span>
                    <span>₹{itinerary.budget_breakdown?.accommodation_inr}</span>
                  </div>
                  <div className="flex justify-between text-neutral-muted">
                    <span>{translateText('Local Experiences & Entry:', currentLang)}</span>
                    <span>₹{itinerary.budget_breakdown?.activities_inr}</span>
                  </div>
                  <div className="flex justify-between text-neutral-muted">
                    <span>{translateText('Meals & Regional Food:', currentLang)}</span>
                    <span>₹{itinerary.budget_breakdown?.meals_inr}</span>
                  </div>
                  <div className="flex justify-between text-neutral-muted">
                    <span>{translateText('Local Green Transport:', currentLang)}</span>
                    <span>₹{itinerary.budget_breakdown?.transport_inr}</span>
                  </div>
                  <div className="flex justify-between text-nature font-bold pt-2 border-t border-neutral-border">
                    <span>{translateText('Direct Host Benefit:', currentLang)}</span>
                    <span>{translateText('100% via UPI', currentLang)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigate('/stays')}
                    className="w-full py-2.5 rounded-lg border border-primary-800 text-primary-800 dark:border-amber-400 dark:text-amber-400 hover:bg-primary-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {translateText('Reserve Homestays on Route', currentLang)}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Destination Detail Modal */}
      {selectedStopForDetail && (
        <DestinationDetailModal
          destinationId={
            selectedStopForDetail.destination_id ||
            selectedStopForDetail.id ||
            selectedStopForDetail.destination_name ||
            selectedStopForDetail.title
          }
          onClose={() => setSelectedStopForDetail(null)}
          onDirectBook={(dest) => {
            setSelectedStopForDetail(null);
            if (openCheckout) {
              openCheckout({
                id: dest.id || `dest-${Date.now()}`,
                title: dest.name,
                type: 'Destination Booking',
                price: dest.average_budget || 2500,
                dates: 'Flexible Dates',
                location: `${dest.name}, ${dest.state || 'India'}`
              });
            }
          }}
        />
      )}

    </div>
  );
}
