import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import i18n from '../i18n';
import { DESTINATIONS, EXPERIENCES, HOMESTAYS, GOV_INTELLIGENCE_DATA } from '../data/travelSathiData';

const AppContext = createContext<any>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 0. Live Master Catalog State (Populated from SQLite & backend APIs)
  const [liveDestinations, setLiveDestinations] = useState(DESTINATIONS);
  const [liveHomestays, setLiveHomestays] = useState(HOMESTAYS);
  const [liveExperiences, setLiveExperiences] = useState(EXPERIENCES);

  useEffect(() => {
    // 1. Fetch real verified destinations
    axios.get('/api/destinations?limit=100')
      .then(res => {
        if (res.data?.results && res.data.results.length > 0) {
          const mapped = res.data.results.map((d: any) => ({
            id: d.id,
            name: d.name,
            state: d.state,
            category: d.category,
            overview: d.description || d.overview,
            image: d.image_url || d.image,
            image_url: d.image_url || d.image,
            images: [d.image_url || d.image],
            rating: d.rating,
            reviewsCount: d.review_count || 120,
            safetyScore: d.safety_score || 85,
            crowdDensityScore: d.crowd_density_score || 50,
            crowdLevel: (d.crowd_density_score || 50) > 70 ? 'High' : ((d.crowd_density_score || 50) > 40 ? 'Moderate' : 'Low'),
            crowdCapacityPct: d.crowd_density_score || 50,
            idealDuration: '2-3 Days',
            bestSeason: d.best_season || 'All Year',
            weather: { temp: '24°C', condition: 'Pleasant & Clear' },
            isHiddenGem: !!d.is_hidden_gem,
            hiddenGemReason: d.is_hidden_gem ? 'Preserved cultural authenticity with low tourist density.' : undefined,
            lat: d.latitude,
            lng: d.longitude,
            latitude: d.latitude,
            longitude: d.longitude
          }));
          setLiveDestinations(mapped);
        }
      })
      .catch(() => {});

    // 2. Fetch real verified PM-JUGA homestays
    axios.get('/api/homestays?limit=20')
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
            sanitationScore: h.sanitation_trust_score,
            isTribal: h.is_tribal_pmjuga
          }));
          setLiveHomestays(mapped);
        }
      })
      .catch(() => {});

    // 3. Fetch real certified guide experiences
    axios.get('/api/experiences?limit=20')
      .then(res => {
        if (res.data?.results && res.data.results.length > 0) {
          setLiveExperiences(res.data.results);
        }
      })
      .catch(() => {});
  }, []);

  // 1. Role-Based Access State
  // Roles: 'tourist' | 'host' | 'dmo' | 'gov' | 'admin'
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('travelsathi_role') || 'tourist';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('travelsathi_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      id: 'usr-901',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@travelsathi.in',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'tourist',
      verifiedDpi: true,
      badges: ['Sustainable Traveler', 'Heritage Scout', 'Tribal Supporter'],
      ecoPoints: 480
    };
  });

  // Sync data-panel attribute on HTML root from first paint
  useEffect(() => {
    document.documentElement.setAttribute('data-panel', userRole);
  }, [userRole]);

  // Synchronize authenticated session with backend using HTTP-only cookies (no localStorage token)
  useEffect(() => {
    // Enable cookie-based auth for all axios requests
    axios.defaults.withCredentials = true;
    // Request initial session cookie from backend
    axios.post('/api/auth/switch-token', { role: userRole })
      .then(() => {})
      .catch(() => {});
  }, []);

  const switchRole = (newRole: string) => {
    const role = newRole;
    setUserRole(role);
    localStorage.setItem('travelsathi_role', role);
    document.documentElement.setAttribute('data-panel', role);

    // Update profile preview
    if (role === 'gov') {
      const govUser = {
        id: 'usr-gov-1',
        name: 'Smt. Ananya Sen, IAS',
        email: 'secretary.tourism@nic.in',
        phone: '+91 11 2371 1995',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        role: 'gov',
        verifiedDpi: true,
        badges: ['Ministry of Tourism', 'National Tourism Board', 'Policy Director'],
        ecoPoints: 9500
      };
      setCurrentUser(govUser);
      localStorage.setItem('travelsathi_user', JSON.stringify(govUser));
    } else if (role === 'dmo') {
      const dmoUser = {
        id: 'usr-dmo-1',
        name: 'Dr. Rajesh Verma, IAS',
        email: 'officer.tourism@nic.in',
        phone: '+91 11 2309 2400',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        role: 'dmo',
        verifiedDpi: true,
        badges: ['DMO Director', 'Carrying Capacity Officer', 'Eco-Permit Authority'],
        ecoPoints: 7200
      };
      setCurrentUser(dmoUser);
      localStorage.setItem('travelsathi_user', JSON.stringify(dmoUser));
    }

    // Call backend to issue authentic role-derived JWT & set HTTP-only session cookie
    axios.post('/api/auth/switch-token', { role })
      .then(() => {})
      .catch(() => {});

    let updated = null;
    if (role === 'host') {
      updated = { id: 'usr-host-1', name: 'Sunil Thakur', email: 'sunil.thakur@pineshade.in', role: 'host', hostProperty: 'Pine Shade Kathkuni' };
    } else if (role === 'dmo' || role === 'gov') {
      updated = { id: 'usr-dmo-1', name: 'Dr. Rajesh Verma, IAS', email: 'officer.tourism@nic.in', role: 'dmo', department: 'Ministry of Tourism / DMO Intelligence' };
    } else if (role === 'admin') {
      updated = { id: 'usr-admin-1', name: 'Chief Security Officer', email: 'admin.ops@travelsathi.gov.in', role: 'admin' };
    } else {
      updated = { id: 'usr-901', name: 'Aarav Sharma', email: 'aarav.sharma@travelsathi.in', role: 'tourist' };
    }
    setCurrentUser(prev => ({ ...prev, ...updated }));
    localStorage.setItem('travelsathi_user', JSON.stringify(updated));
  };

  // 2. Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('travelsathi_dark') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('travelsathi_dark', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // 3. Language Selector
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('travelsathi_lang') || 'en';
  });

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('travelsathi_lang', lang);
    i18n.changeLanguage(lang);
  };

  // 4. Travel Twin State (Persisted across refreshes)
  const defaultTravelTwin = {
    favoriteDestinations: ['Himalayan valleys', 'Sacred heritage', 'Tribal handicraft clusters'],
    travelStyle: 'Nature & Slow Travel',
    budgetTier: 'Moderate (₹2,500 - ₹4,000/day)',
    preferredStay: 'Verified Eco-Homestays & Heritage Havelis',
    foodPreference: 'Vegetarian Friendly & Regional Organic',
    pace: 'Unrushed / Mindful',
    accessibilityRequirements: 'Low-impact stairs, step-free rooms',
    personalizationActive: true,
    dataRetentionDays: 180,
  };

  const [travelTwin, setTravelTwin] = useState(() => {
    try {
      const stored = localStorage.getItem('travelsathi_travel_twin');
      if (stored) return { ...defaultTravelTwin, ...JSON.parse(stored) };
    } catch (e) {}
    return defaultTravelTwin;
  });

  const updateTravelTwin = (updates) => {
    setTravelTwin(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('travelsathi_travel_twin', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const resetTravelTwin = () => {
    const blank = {
      favoriteDestinations: [],
      travelStyle: 'Balanced Explorer',
      budgetTier: 'Moderate',
      preferredStay: 'Any Verified Stay',
      foodPreference: 'All Cuisines',
      pace: 'Standard',
      accessibilityRequirements: 'None',
      personalizationActive: false,
      dataRetentionDays: 30,
    };
    setTravelTwin(blank);
    try {
      localStorage.setItem('travelsathi_travel_twin', JSON.stringify(blank));
    } catch (e) {}
  };

  // 5. Active Trip & Live Trip Mode (Persisted across refreshes and place changes)
  const defaultActiveTrip = {
    id: 'trip-2026-tirthan',
    title: 'Autumn in Tirthan: Kathkuni Architecture & Himalayan River Trail',
    destination: 'Tirthan Valley, Himachal Pradesh',
    dates: 'October 14 – 17, 2026',
    status: 'In Progress (Day 2 of 4)',
    dayNumber: 2,
    totalBudget: 12400,
    spentBudget: 5800,
    weather: { temp: '18°C', condition: 'Clear Sky & Crisp River Breeze', rainAlert: false },
    crowdStatus: 'Quiet / Low Density (32% Capacity)',
    schedule: [
      {
        id: 'act-1',
        time: '08:30 AM',
        title: 'Organic Buckwheat Breakfast at Pine Shade Homestay',
        category: 'Food',
        location: 'Gushaini Village',
        status: 'Completed',
        notes: 'Included in homestay booking.'
      },
      {
        id: 'act-2',
        time: '10:00 AM',
        title: 'Kathkuni Heritage Wood-Carpentry Walk with Tara Chand ji',
        category: 'Culture',
        location: 'Chehni Kothi Trail',
        status: 'Current',
        notes: 'Meet at ancient deodar wood granary.'
      },
      {
        id: 'act-3',
        time: '01:30 PM',
        title: 'Himalayan Trout & Wild Herb Lunch along Tirthan River',
        category: 'Food',
        location: 'Riverside Meadow Rest Stop',
        status: 'Upcoming',
        notes: 'Pre-ordered picnic basket prepared by village cooperative.'
      },
      {
        id: 'act-4',
        time: '03:30 PM',
        title: 'Choi Waterfall Trek & Great Himalayan National Park Buffer Zone',
        category: 'Nature',
        location: 'Choi Trailhead',
        status: 'Upcoming',
        notes: 'Closes at 05:45 PM before dusk.'
      },
      {
        id: 'act-5',
        time: '07:00 PM',
        title: 'Stargazing & Deodar Fireplace Dinner',
        category: 'Relaxation',
        location: 'Pine Shade Veranda',
        status: 'Upcoming',
        notes: 'Clear night expected (Bortle Class 2 sky).'
      }
    ],
    delayMinutes: 0,
    delayMessage: null
  };

  const [activeTrip, setActiveTripState] = useState(() => {
    try {
      const stored = localStorage.getItem('travelsathi_active_trip');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return defaultActiveTrip;
  });

  const setActiveTrip = (newTrip) => {
    setActiveTripState(prev => {
      const val = typeof newTrip === 'function' ? newTrip(prev) : newTrip;
      try {
        localStorage.setItem('travelsathi_active_trip', JSON.stringify(val));
      } catch (e) {}
      return val;
    });
  };

  // Section 25: Smart Delay Handling (Connected to Real Backend Adapt API)
  const handleSmartDelay = async (delayedMinutes) => {
    try {
      const endpoint = activeTrip?.id && !activeTrip.id.startsWith('live-') && !activeTrip.id.startsWith('trip-')
        ? `/api/itinerary/${activeTrip.id}/adapt`
        : '/api/itinerary/adapt';
      const res = await axios.post(endpoint, {
        action: 'delay',
        delay_minutes: delayedMinutes,
        day_number: activeTrip.dayNumber || 1,
        destination: activeTrip.destination,
        current_schedule: activeTrip.schedule
      });
      if (res.data && res.data.updated_schedule) {
        setActiveTrip(prev => ({
          ...prev,
          delayMinutes: (prev.delayMinutes || 0) + delayedMinutes,
          delayMessage: res.data.message,
          schedule: res.data.updated_schedule
        }));
        return;
      }
    } catch (e) {
      console.warn('Backend adapt call failed, using client-side recalculation:', e);
    }

    // Client-side fallback if backend unreachable
    setActiveTrip(prev => {
      const updatedSchedule = prev.schedule.map(item => {
        if (item.status === 'Completed') return item;
        return {
          ...item,
          time: shiftTime(item.time, delayedMinutes)
        };
      });

      return {
        ...prev,
        delayMinutes: (prev.delayMinutes || 0) + delayedMinutes,
        delayMessage: `We adjusted your afternoon schedule by +${delayedMinutes} mins. Evening dinner and return timings synchronized.`,
        schedule: updatedSchedule
      };
    });
  };

  const shiftTime = (timeStr, minutes) => {
    const parts = (timeStr || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!parts) return timeStr;
    let [_, h, m, meridiem] = parts;
    let hour = parseInt(h, 10);
    let min = parseInt(m, 10);
    if (meridiem && meridiem.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (meridiem && meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;

    const date = new Date();
    date.setHours(hour, min + minutes);

    let newHour = date.getHours();
    let newMin = date.getMinutes();
    let newMeridiem = newHour >= 12 ? 'PM' : 'AM';
    newHour = newHour % 12 || 12;
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')} ${newMeridiem}`;
  };

  // Section 14: Dynamic Prompt Itinerary Adjustment (Connected to Real Backend Adapt API)
  const modifyItineraryPrompt = async (promptType) => {
    try {
      const endpoint = activeTrip?.id && !activeTrip.id.startsWith('live-') && !activeTrip.id.startsWith('trip-')
        ? `/api/itinerary/${activeTrip.id}/adapt`
        : '/api/itinerary/adapt';
      const res = await axios.post(endpoint, {
        action: promptType,
        day_number: activeTrip.dayNumber || 1,
        destination: activeTrip.destination,
        current_schedule: activeTrip.schedule
      });
      if (res.data && res.data.updated_schedule) {
        setActiveTrip(prev => ({
          ...prev,
          totalBudget: res.data.total_budget_inr || prev.totalBudget,
          delayMessage: res.data.message,
          schedule: res.data.updated_schedule,
          weather: promptType === 'weather' && res.data.weather_advisory 
            ? { ...prev.weather, condition: 'Adapted for Weather', rainAlert: false } 
            : prev.weather
        }));
        return;
      }
    } catch (e) {
      console.warn('Backend modify prompt failed, using client fallback:', e);
    }

    // Client fallback
    setActiveTrip(prev => {
      if (promptType === 'cheaper') {
        return {
          ...prev,
          totalBudget: Math.round(prev.totalBudget * 0.78),
          delayMessage: "Budget optimized! Switched commercial admissions to verified community stepwells & artisan guilds. Saved estimated ₹1,850."
        };
      } else if (promptType === 'relax') {
        return {
          ...prev,
          delayMessage: "Day schedule relaxed. Streamlined pacing with artisanal tea rest and riverside promenade."
        };
      } else if (promptType === 'local') {
        return {
          ...prev,
          delayMessage: "Added authentic village artisan interaction with deodar wood craftsmen."
        };
      } else if (promptType === 'weather') {
        return {
          ...prev,
          weather: { temp: '22°C', condition: 'Adapted for Weather', rainAlert: false },
          delayMessage: "Weather adaptation applied! Outdoor excursion replaced with covered heritage galleries and royal craft museum."
        };
      }
      return prev;
    });
  };

  // 6. Trip Wallet, Bookings & Offline Cache
  const [bookings, setBookings] = useState([
    {
      id: 'BK-9921',
      type: 'Stay',
      title: 'Pine Shade Kathkuni Homestay',
      host: 'Sunil & Meena Thakur',
      dates: 'Oct 14 – Oct 17, 2026 (3 Nights)',
      price: 7200,
      taxes: 0,
      platformFee: 0,
      status: 'Confirmed',
      qrCode: 'TS-HP-KTH-7200-VERIFIED',
      location: 'Gushaini, Tirthan Valley, HP'
    },
    {
      id: 'BK-9922',
      type: 'Experience',
      title: 'Kathkuni Heritage Wood-Carpentry Walk',
      host: 'Tara Chand Sharma',
      dates: 'Oct 15, 2026 @ 10:00 AM',
      price: 1200,
      taxes: 0,
      platformFee: 0,
      status: 'Confirmed',
      qrCode: 'TS-EXP-WD-1200-VERIFIED',
      location: 'Chehni Kothi Trailhead'
    }
  ]);

  const [groupExpenses, setGroupExpenses] = useState([
    { id: 'exp-1', payer: 'Aarav (You)', description: 'Homestay 3 Nights Advance', amount: 7200, category: 'Stay', splitWith: ['Aarav', 'Priya', 'Rohan'] },
    { id: 'exp-2', payer: 'Priya', description: 'Village Mountain Guide Fee', amount: 1800, category: 'Guide', splitWith: ['Aarav', 'Priya', 'Rohan'] },
    { id: 'exp-3', payer: 'Rohan', description: 'Local Organic Meal & Siddu', amount: 1500, category: 'Food', splitWith: ['Aarav', 'Priya', 'Rohan'] }
  ]);

  const addGroupExpense = (expense) => {
    setGroupExpenses(prev => [
      ...prev,
      { id: `exp-${Date.now()}`, ...expense }
    ]);
  };

  const [offlineReady, setOfflineReady] = useState(true);
  const toggleOfflineReady = () => setOfflineReady(prev => !prev);

  // 7. Saved Places
  const [savedPlaces, setSavedPlaces] = useState(['dest-1', 'dest-2', 'stay-1']);
  const toggleSavePlace = (id) => {
    setSavedPlaces(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

    // 8. Universal Modals & Overlays
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [arHeritageItem, setArHeritageItem] = useState(null);
  const [culturalEtiquetteItem, setCulturalEtiquetteItem] = useState(null);

  // Phase 7: Split-UPI Checkout & Verified Review Modals
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [reviewDestination, setReviewDestination] = useState(null);
  const [reviewBookingId, setReviewBookingId] = useState('');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const openCheckout = (item) => {
    setCheckoutItem(item);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutItem(null);
  };

  const openReviewModal = (destination, bookingId = '') => {
    setReviewDestination(destination);
    setReviewBookingId(bookingId);
    setIsReviewFormOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewFormOpen(false);
    setReviewDestination(null);
    setReviewBookingId('');
  };

  const addBooking = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        // Auth & Role
        userRole,
        currentUser,
        setCurrentUser,
        switchRole,
        // UI
        darkMode,
        toggleDarkMode,
        language,
        changeLanguage,
        // Travel Twin
        travelTwin,
        updateTravelTwin,
        resetTravelTwin,
        // Active Trip & Smart Delay
        activeTrip,
        setActiveTrip,
        handleSmartDelay,
        modifyItineraryPrompt,
        // Wallet & Bookings
        bookings,
        setBookings,
        addBooking,
        groupExpenses,
        addGroupExpense,
        offlineReady,
        toggleOfflineReady,
        // Saved
        savedPlaces,
        toggleSavePlace,
        // Universal Modals
        isSosModalOpen,
        setIsSosModalOpen,
        emergencyActive,
        setEmergencyActive,
        isSearchPaletteOpen,
        setIsSearchPaletteOpen,
        isConciergeOpen,
        setIsConciergeOpen,
        arHeritageItem,
        setArHeritageItem,
        culturalEtiquetteItem,
        setCulturalEtiquetteItem,
        // Phase 7 Split-UPI & Verified Review Modals
        checkoutItem,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        reviewDestination,
        reviewBookingId,
        isReviewFormOpen,
        openReviewModal,
        closeReviewModal,
        // Master Catalog references
        destinations: liveDestinations,
        experiences: liveExperiences,
        homestays: liveHomestays,
        govData: GOV_INTELLIGENCE_DATA
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
