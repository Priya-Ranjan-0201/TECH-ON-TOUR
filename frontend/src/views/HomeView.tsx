import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  Leaf, 
  Users, 
  Clock, 
  Calendar, 
  Sun, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  BarChart3, 
  HeartHandshake, 
  PhoneCall, 
  ChevronRight,
  TrendingDown,
  Navigation,
  Eye,
  Award,
  Building2,
  Hotel,
  Star,
  Bed,
  Wifi,
  Coffee
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Hero3DScene from '../components/home/Hero3DScene';
import ExplorerBadgesModal from '../components/gamification/ExplorerBadgesModal';
import GrandFinalePitchModal from '../components/common/GrandFinalePitchModal';
import { useGeolocation } from '../hooks/useGeolocation';
import GPSTrackerBar from '../components/location/GPSTrackerBar';
import RecommendationRail from '../components/home/RecommendationRail';
import OnboardingSpotlight from '../components/common/OnboardingSpotlight';
import { useTranslation } from 'react-i18next';

const FALLBACK_HOTELS = [
  {
    id: "BUS000001",
    name: "Archaeological Museum Grand Heritage Palace Hotel",
    type: "hotel",
    category_badge: "Luxury & Heritage",
    city: "Tirupati",
    tourist_place: "Archaeological Museum",
    state: "Andhra Pradesh",
    rating: 4.9,
    review_count: 1200,
    price_per_night: 6500,
    sanitation_score: 98,
    amenities: ["Free Wi-Fi", "Palace Courtyard", "Royal Spa", "Breakfast Included"],
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "BUS000009",
    name: "Chakra Teertham Grand Heritage Palace Hotel",
    type: "hotel",
    category_badge: "5-Star Luxury",
    city: "Tirupati",
    tourist_place: "Chakra Teertham",
    state: "Andhra Pradesh",
    rating: 4.8,
    review_count: 850,
    price_per_night: 5800,
    sanitation_score: 97,
    amenities: ["Infinity Pool", "Room Service", "Airport Shuttle", "Air Conditioning"],
    image_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "BUS000021",
    name: "Tirthan River Pine Boutique Lodge",
    type: "resort",
    category_badge: "Eco Mountain Retreat",
    city: "Kullu",
    tourist_place: "Great Himalayan National Park",
    state: "Himachal Pradesh",
    rating: 4.9,
    review_count: 640,
    price_per_night: 4200,
    sanitation_score: 96,
    amenities: ["River View Balcony", "Trout Angling", "Fireplace", "Organic Dining"],
    image_url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "BUS000035",
    name: "Fateh Sagar Royal Haveli & Spa",
    type: "hotel",
    category_badge: "Heritage Palace",
    city: "Udaipur",
    tourist_place: "Lake Pichola",
    state: "Rajasthan",
    rating: 4.9,
    review_count: 1450,
    price_per_night: 7200,
    sanitation_score: 99,
    amenities: ["Lake View Suite", "Rooftop Restaurant", "Cultural Folk Music", "Butler Service"],
    image_url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "BUS000042",
    name: "Munnar Tea Plantation Mist Resort",
    type: "resort",
    category_badge: "Wellness Retreat",
    city: "Munnar",
    tourist_place: "Eravikulam",
    state: "Kerala",
    rating: 4.8,
    review_count: 920,
    price_per_night: 4900,
    sanitation_score: 95,
    amenities: ["Tea Garden Walks", "Ayurvedic Spa", "Mountain View", "Eco Certified"],
    image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "BUS000055",
    name: "Goa Coastal Palms Boutique Villa",
    type: "hotel",
    category_badge: "Beachfront Boutique",
    city: "North Goa",
    tourist_place: "Anjuna Beach",
    state: "Goa",
    rating: 4.7,
    review_count: 1100,
    price_per_night: 5400,
    sanitation_score: 94,
    amenities: ["Private Beach Access", "Swimming Pool", "Seafood Dining", "High-speed Wi-Fi"],
    image_url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80"
  }
];

export default function HomeView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    destinations, 
    experiences, 
    homestays, 
    setIsSosModalOpen, 
    setArHeritageItem, 
    setCulturalEtiquetteItem,
    switchRole,
    setIsConciergeOpen,
    currentUser
  } = useApp();

  const geo = useGeolocation();
  const [recommendationRails, setRecommendationRails] = useState([]);
  const [seasonName, setSeasonName] = useState('Monsoon');
  const [isLoadingRails, setIsLoadingRails] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [plannerDestination, setPlannerDestination] = useState('Tirthan Valley, Himachal Pradesh');
  const [plannerDays, setPlannerDays] = useState('4');
  const [plannerBudget, setPlannerBudget] = useState('Moderate');
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [totalDestinationCount, setTotalDestinationCount] = useState(12293);

  const [liveTrending, setLiveTrending] = useState<any[]>([]);
  const [liveGems, setLiveGems] = useState<any[]>([]);
  const [liveExperiences, setLiveExperiences] = useState<any[]>([]);
  const [featuredHotels, setFeaturedHotels] = useState<any[]>(FALLBACK_HOTELS);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<'all' | 'hotel' | 'homestay' | 'resort'>('all');

  // Fetch verified destination count, trending, gems, and rails concurrently in parallel
  useEffect(() => {
    let isMounted = true;
    const fetchStatsAndRails = async () => {
      setIsLoadingRails(true);
      const params = [];
      if (geo.coordinates?.latitude && geo.coordinates?.longitude) {
        params.push(`lat=${geo.coordinates.latitude}`);
        params.push(`lng=${geo.coordinates.longitude}`);
      }
      if (currentUser?.id) {
        params.push(`user_id=${currentUser.id}`);
      }
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';

      try {
        const [statsRes, trendRes, gemsRes, expRes, railsRes, hotelsRes] = await Promise.allSettled([
          axios.get('/api/destinations?limit=1', { timeout: 3000 }),
          axios.get('/api/trending?limit=3', { timeout: 3000 }),
          axios.get('/api/destinations?is_hidden_gem=true&limit=2', { timeout: 3000 }),
          axios.get('/api/experiences?limit=3', { timeout: 3000 }),
          axios.get(`/api/recommendations/rails${queryStr}`, { timeout: 4000 }),
          axios.get('/api/hotels?limit=8', { timeout: 3500 })
        ]);

        if (!isMounted) return;

        if (statsRes.status === 'fulfilled' && statsRes.value.data?.total) {
          setTotalDestinationCount(statsRes.value.data.total);
        }

        if (trendRes.status === 'fulfilled' && trendRes.value.data?.results?.length) {
          setLiveTrending(trendRes.value.data.results.map((t: any) => ({
            id: t.id || t.destination_id,
            name: t.name || t.destination,
            state: t.state,
            category: t.category,
            image: t.image || t.image_url,
            rating: t.rating,
            crowdDensityScore: t.crowd_density_score || 50,
            crowdLevel: (t.crowd_density_score || 50) > 70 ? 'High' : ((t.crowd_density_score || 50) > 40 ? 'Moderate' : 'Low'),
            safetyScore: t.safety_score || 88,
            weather: { temp: '26°C', condition: 'Clear Sky & Crisp Breeze' },
            idealDuration: '2-3 Days',
            overview: `Trending high-velocity Indian destination with verified traveler interest (${t.growth_rate || '14%'} 7-day velocity).`
          })));
        }

        if (gemsRes.status === 'fulfilled' && gemsRes.value.data?.results?.length) {
          setLiveGems(gemsRes.value.data.results.map((g: any) => ({
            id: g.id,
            name: g.name,
            state: g.state,
            image: g.image_url || g.image,
            crowdCapacityPct: g.crowd_density_score || 35,
            hiddenGemReason: 'Preserved regional heritage with low crowd congestion and direct host community benefit.'
          })));
        }

        if (expRes.status === 'fulfilled' && expRes.value.data?.results?.length) {
          setLiveExperiences(expRes.value.data.results);
        }

        if (railsRes.status === 'fulfilled' && railsRes.value.data?.rails) {
          setRecommendationRails(railsRes.value.data.rails);
          if (railsRes.value.data.season) setSeasonName(railsRes.value.data.season);
        }

        if (hotelsRes.status === 'fulfilled' && hotelsRes.value.data?.hotels?.length) {
          setFeaturedHotels(hotelsRes.value.data.hotels);
        }
      } catch (err) {
        console.warn('Concurrent fetch error in HomeView:', err);
      } finally {
        if (isMounted) setIsLoadingRails(false);
      }
    };
    fetchStatsAndRails();
    return () => { isMounted = false; };
  }, [geo.coordinates?.latitude, geo.coordinates?.longitude, currentUser?.id]);

  const sampleSearchPills = [
    "Hidden places near Manali",
    "5 days in Kerala",
    "Heritage trip in Rajasthan",
    "Budget trip from Delhi",
    "Quiet beaches in India"
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/explore?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleQuickPlan = (e) => {
    e.preventDefault();
    navigate('/plan', {
      state: {
        prefilledDestination: plannerDestination,
        prefilledDays: plannerDays,
        prefilledBudget: plannerBudget
      }
    });
  };

  const travelStyles = [
    { name: 'Nature & Valleys', count: '140+ circuits', icon: '🌲', category: 'Nature' },
    { name: 'Living Heritage', count: '85+ monuments', icon: '🛕', category: 'Heritage' },
    { name: 'Tribal & Rural', count: '60+ PM-JUGA clusters', icon: '🌾', category: 'Rural' },
    { name: 'Culinary & Spices', count: '45+ food trails', icon: '🥘', category: 'Food' },
    { name: 'Spiritual Walks', count: '70+ sacred ghats', icon: '🪔', category: 'Spiritual' },
    { name: 'High Himalayan', count: '35+ alpine passes', icon: '🏔️', category: 'Adventure' },
  ];

  const trendingDestinations = liveTrending.length > 0 ? liveTrending : destinations.slice(0, 3);
  const hiddenGems = liveGems.length > 0 ? liveGems : destinations.filter(d => d.isHiddenGem).slice(0, 2);
  const displayExperiences = liveExperiences.length > 0 ? liveExperiences : experiences.slice(0, 3);

  const [showMoreTools, setShowMoreTools] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">

      {/* 1 & 2: HERO WITH EXACTLY 1 SEARCH INPUT + 1 "PLAN MY TRIP" BUTTON */}
      <Hero3DScene />

      {/* 3: RECOMMENDATION ROWS (EXACTLY 4 CARDS VISIBLE PER ROW) */}
      <section className="bg-neutral-bg dark:bg-darkmode-bg py-4">
        {isLoadingRails ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-6 w-56 bg-neutral-200 dark:bg-darkmode-elevated rounded"></div>
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="w-72 h-72 bg-neutral-200 dark:bg-darkmode-elevated rounded-ts-lg flex-shrink-0"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          recommendationRails.map((rail, idx) => (
            <RecommendationRail key={rail.id || idx} rail={rail} isCinematic={false} />
          ))
        )}
      </section>

      {/* ONE UNOBTRUSIVE ENTRY POINT TO ALL ADVANCED/EXPANDED TOOLS */}
      <div className="max-w-7xl mx-auto px-4 py-8 text-center border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setShowMoreTools(!showMoreTools)}
          className="text-xs font-bold text-neutral-500 hover:text-primary-800 dark:hover:text-amber-300 underline inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>{showMoreTools ? t('home.hideExtraTools', '▲ Hide extra travel tools') : t('home.seeMoreTools', '▼ See more travel tools (Live GPS, Travel Styles, Crowd Index, Pitch Studio)')}</span>
        </button>
      </div>

      {/* COLLAPSED ADVANCED TOOLS & SECTIONS */}
      {showMoreTools && (
        <div className="space-y-12 animate-fadeIn">
          {/* GPS Tracker Bar */}
          <GPSTrackerBar geo={geo} />

          {/* Greeting & Weather */}
          <section className="bg-neutral-card dark:bg-darkmode-surface border-b border-neutral-border dark:border-darkmode-border py-4 px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-50 dark:bg-darkmode-elevated flex items-center justify-center text-primary-800 dark:text-accent-400 font-bold border border-primary-200 dark:border-darkmode-border shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-display font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {t('home.whereToGoNext', { name: currentUser?.name || 'Aarav' })}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-neutral-text-secondary dark:text-darkmode-text-secondary mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-primary-800 dark:text-accent-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {geo.coordinates ? `Near ${geo.coordinates.latitude.toFixed(2)}°N, ${geo.coordinates.longitude.toFixed(2)}°E` : 'Near Patna, Bihar'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      28°C {t('home.pleasant', 'Pleasant')}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-50 dark:bg-darkmode-elevated text-secondary-800 dark:text-secondary-400 font-semibold text-[11px] border border-secondary-200 dark:border-darkmode-border">
                      {t('home.season', 'Season')}: {seasonName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsBadgesModalOpen(true)}
                  className="px-3.5 py-2 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated text-xs font-semibold flex items-center gap-1.5 border border-neutral-border hover:border-brand"
                >
                  <Award className="w-3.5 h-3.5 text-accent-500" />
                  <span>{t('home.explorerBadges', 'Explorer Badges')}</span>
                </button>
                <button
                  onClick={() => setIsPitchModalOpen(true)}
                  className="px-3.5 py-2 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated text-xs font-semibold flex items-center gap-1.5 border border-neutral-border hover:border-brand"
                >
                  <span>{t('home.pitchStudio', 'Pitch Studio')}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Multi-field Quick Generator */}
          <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="ts-card-light p-6 sm:p-8 bg-[#FFFDF8] dark:bg-darkmode-surface border-2 border-primary-800/20 shadow-xl rounded-ts-hero">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-darkmode-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-ts-md bg-primary-50 dark:bg-darkmode-elevated text-primary-800 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-800" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-darkmode-text-primary">
                      {t('home.plannerTitle', 'AI Travel Planner Quick Generator')}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {t('home.plannerSubtitle', 'Generates full multi-day itinerary with routes, crowd forecast, and verified homestays')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-secondary-800 bg-secondary-50 px-3 py-1 rounded-full w-fit border border-secondary-800/20">
                  <CheckCircle2 className="w-4 h-4 text-secondary-800" />
                  <span>{t('home.groundedIn', 'Grounded in {{count}} Verified Indian POIs', { count: totalDestinationCount })}</span>
                </div>
              </div>

              <form onSubmit={handleQuickPlan} className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-darkmode-text-secondary uppercase tracking-wider mb-1.5">
                    {t('home.destination', 'Destination')}
                  </label>
                  <input
                    type="text"
                    value={plannerDestination}
                    onChange={(e) => setPlannerDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-ts-sm bg-white dark:bg-darkmode-elevated border border-neutral-300 dark:border-darkmode-border text-xs sm:text-sm font-semibold text-neutral-900 dark:text-darkmode-text-primary outline-none focus:border-primary-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-text-sec dark:text-darkmode-text-secondary uppercase tracking-wider mb-1.5">
                    {t('home.duration', 'Duration')}
                  </label>
                  <select
                    value={plannerDays}
                    onChange={(e) => setPlannerDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border text-xs sm:text-sm font-semibold text-neutral-text-primary dark:text-darkmode-text-primary outline-none focus:border-brand"
                  >
                    <option value="3">{t('home.days3', '3 Days (Long Weekend)')}</option>
                    <option value="4">{t('home.days4', '4 Days (Recommended)')}</option>
                    <option value="5">{t('home.days5', '5 Days (Full Circuit)')}</option>
                    <option value="7">{t('home.days7', '7 Days (Slow Travel)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-text-sec dark:text-darkmode-text-secondary uppercase tracking-wider mb-1.5">
                    {t('home.budgetTier', 'Budget Tier')}
                  </label>
                  <select
                    value={plannerBudget}
                    onChange={(e) => setPlannerBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border text-xs sm:text-sm font-semibold text-neutral-text-primary dark:text-darkmode-text-primary outline-none focus:border-brand"
                  >
                    <option value="Budget">{t('home.budgetLow', 'Budget (₹1,500 - ₹2,500/day)')}</option>
                    <option value="Moderate">{t('home.budgetMod', 'Moderate (₹2,500 - ₹4,500/day)')}</option>
                    <option value="Premium">{t('home.budgetPrem', 'Premium (₹5,000+/day)')}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="btn-action w-full py-2.5 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('home.generateItinerary', 'Generate Itinerary')}</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        




      {/* ========================================================
          SECTION 4: TRENDING DESTINATIONS WITH LIVE CONTEXT
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4" />
              <span>{t('home.realtimeCompanionTag', 'Real-Time Travel Context')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
              {t('home.trendingSectionTitle', 'Trending Destinations & Crowd Status')}
            </h2>
            <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
              {t('home.trendingSectionSubtitle', 'Explore famous Indian hubs with live visitor volume and alternate timings.')}
            </p>
          </div>

          <Link
            to="/explore"
            className="mt-4 md:mt-0 text-sm font-bold text-brand hover:text-brand-hover flex items-center gap-1 group"
          >
            <span>{t('home.viewAllDestinations', 'View All Destinations')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trendingDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => navigate(`/destination/${dest.id}`)}
              className="ts-card overflow-hidden group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Crowd Level Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
                    dest.crowdLevel === 'Low' ? 'bg-nature text-white' :
                    dest.crowdLevel === 'Moderate' ? 'bg-trust text-white' :
                    'bg-semantic-warning text-neutral-900'
                  }`}>
                    {dest.crowdLevel} Density
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 dark:bg-darkmode-surface/90 text-neutral-text-primary dark:text-darkmode-text-primary backdrop-blur-sm">
                    {dest.weather.temp} • {dest.weather.condition}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-muted mb-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-brand" />
                      {dest.state}
                    </span>
                    <span className="font-bold text-neutral-text-sec dark:text-darkmode-text-secondary">
                      {dest.idealDuration}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors">
                    {dest.name}
                  </h3>

                  <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2 mt-2">
                    {dest.overview}
                  </p>
                </div>

                {/* Intelligence context line */}
                <div className="pt-3 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between text-xs">
                  <span className="text-neutral-muted font-medium">
                    Safety: <strong className="text-nature">{dest.safetyScore}/100</strong>
                  </span>
                  <span className="text-action font-bold flex items-center gap-1">
                    <span>Explore Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ========================================================
          SECTION 4.5: VERIFIED HOTELS & STAYS (DPI REGISTRY)
          ======================================================== */}
      <section className="py-20 bg-gradient-to-b from-white to-neutral-bg-secondary dark:from-darkmode-bg dark:to-darkmode-surface/40 border-b border-neutral-border dark:border-darkmode-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-2">
                <Hotel className="w-4 h-4 text-brand" />
                <span>Verified Accommodations • 0% Middleman Surge</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                Verified Hotels, Heritage Palaces & Stays
              </h2>
              <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1 max-w-2xl">
                Explore 1,800+ national registry hotels, 5-star royal palaces, and tranquil mountain retreats with verified sanitation certificates and direct host pricing.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/stays"
                className="btn-brand px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-2"
              >
                <span>View All 4,500+ Stays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {[
              { id: 'all', label: 'All Accommodations', icon: Building2 },
              { id: 'hotel', label: 'Luxury & Heritage Hotels', icon: Hotel },
              { id: 'resort', label: 'Boutique Resorts', icon: Bed },
              { id: 'homestay', label: 'Community Homestays', icon: Leaf },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedHotelFilter(f.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedHotelFilter === f.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-white dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border text-neutral-text-sec dark:text-darkmode-text-secondary hover:border-brand/40'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredHotels.filter(h => {
              if (selectedHotelFilter === 'all') return true;
              if (selectedHotelFilter === 'hotel') return h.type === 'hotel' || (h.category_badge && h.category_badge.toLowerCase().includes('hotel')) || (h.category_badge && h.category_badge.toLowerCase().includes('luxury'));
              if (selectedHotelFilter === 'resort') return h.type === 'resort' || (h.category_badge && h.category_badge.toLowerCase().includes('resort')) || (h.category_badge && h.category_badge.toLowerCase().includes('retreat'));
              if (selectedHotelFilter === 'homestay') return h.type === 'homestay' || (h.category_badge && h.category_badge.toLowerCase().includes('homestay'));
              return true;
            })).slice(0, 6).map((hotel) => (
              <div
                key={hotel.id}
                onClick={() => navigate('/stays', { state: { selectedHotelId: hotel.id } })}
                className="ts-card overflow-hidden group cursor-pointer flex flex-col justify-between hover:border-brand/50 transition-all hover:shadow-xl duration-300"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={hotel.image_url || hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-darkmode-surface/95 text-brand shadow-sm backdrop-blur-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-trust" />
                        <span>{hotel.category_badge || 'Verified Stay'}</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{hotel.rating || 4.8}</span>
                      </span>
                    </div>

                    {/* Proximity / Location Bottom-left on image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="flex items-center gap-1 font-medium truncate drop-shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{hotel.tourist_place || hotel.city}, {hotel.state}</span>
                      </span>
                      <span className="bg-emerald-600/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                        {hotel.sanitation_score || 95}% Trust
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1">
                        {hotel.name}
                      </h3>
                      <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2 mt-1">
                        {hotel.description || `Certified comfortable accommodation property located near ${hotel.tourist_place || hotel.city}. Verified sanitation standards and verified host registration.`}
                      </p>
                    </div>

                    {/* Amenities chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(hotel.amenities || ['Wifi', 'Air Conditioning', 'Room Service']).slice(0, 3).map((amenity: string, i: number) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-darkmode-elevated text-neutral-600 dark:text-neutral-300 font-medium">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & Action */}
                <div className="p-5 pt-3 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-muted block uppercase tracking-wider font-semibold">Starting from</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-brand">
                        ₹{(hotel.price_per_night || hotel.price_min_inr || 3500).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-neutral-muted font-medium">/ night</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/stays', { state: { selectedHotelId: hotel.id } });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand text-brand hover:text-white dark:bg-brand/20 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <span>Book Stay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Value proposition ribbon */}
          <div className="mt-12 p-6 rounded-2xl bg-neutral-bg-secondary dark:bg-darkmode-surface/70 border border-neutral-border dark:border-darkmode-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary">DPI Verified Sanitation</h4>
                <p className="text-xs text-neutral-muted mt-0.5">Every property undergoes state hygiene audits and biometric host verification.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary">0% Commission Surcharge</h4>
                <p className="text-xs text-neutral-muted mt-0.5">100% of room tariff goes directly to Indian hoteliers & community hosts.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary">Free Cancellation Guarantee</h4>
                <p className="text-xs text-neutral-muted mt-0.5">Flexible cancellation on all verified bookings with instant UPI refunds.</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 5: HIDDEN GEMS ENGINE (ANTI-OVERTOURISM)
          ======================================================== */}
      <section className="py-20 bg-neutral-bg-secondary dark:bg-darkmode-surface/50 border-y border-neutral-border dark:border-darkmode-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-nature font-bold text-xs uppercase tracking-wider mb-2">
                <Leaf className="w-4 h-4" />
                <span>{t('home.hiddenGemsTitle', 'Verified Hidden Gems')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.hiddenGemsTitle', 'Curated Hidden Gems: Why We Recommend Them')}
              </h2>
              <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
                {t('home.hiddenGemsSubtitle', 'Low crowd density, pristine biodiversity, and verified local hosts.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hiddenGems.map((gem) => (
              <div
                key={gem.id}
                onClick={() => navigate(`/destination/${gem.id}`)}
                className="ts-card p-6 cursor-pointer group hover:border-nature transition-all flex flex-col sm:flex-row gap-6 items-start"
              >
                <img
                  src={gem.image}
                  alt={gem.name}
                  className="w-full sm:w-44 h-44 rounded-ts-md object-cover shrink-0 group-hover:scale-105 transition-transform"
                />

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="badge-nature">
                      🌿 Verified Hidden Gem
                    </span>
                    <span className="text-xs font-bold text-nature">
                      {gem.crowdCapacityPct}% Capacity
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-nature transition-colors">
                    {gem.name}
                  </h3>

                  <div className="p-3 rounded-ts-sm bg-nature-light/50 dark:bg-darkmode-elevated border border-nature/20 text-xs">
                    <p className="font-bold text-nature mb-1">{t('home.whyRecommendation', 'Why this recommendation?')}</p>
                    <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                      {gem.hiddenGemReason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-neutral-muted">
                      Avg: ₹{gem.costAvgDay}/day • Eco Score: {gem.sustainability.ecoScore}/100
                    </span>
                    <span className="text-nature font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>{t('home.viewCircuit', 'View Circuit')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 6: EXPLORE BY TRAVEL STYLE
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            {t('home.travelStylesTitle', 'Explore India by Travel Style')}
          </h2>
          <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary">
            {t('home.travelStylesSubtitle', 'Match your personality with tailored itineraries, accessible routes, and verified homestays.')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {travelStyles.map((style) => (
            <div
              key={style.name}
              onClick={() => navigate('/explore', { state: { category: style.category } })}
              className="ts-card p-5 text-center cursor-pointer hover:border-brand hover:-translate-y-1 transition-all group"
            >
              <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
                {style.icon}
              </div>
              <h4 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors">
                {style.name}
              </h4>
              <p className="text-[11px] text-neutral-muted mt-1">
                {style.count}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ========================================================
          SECTION 7: INTERACTIVE INDIA MAP PREVIEW
          ======================================================== */}
      <section className="py-20 bg-neutral-bg-secondary dark:bg-darkmode-surface/40 border-y border-neutral-border dark:border-darkmode-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-trust-light text-trust text-xs font-bold">
                <Navigation className="w-3.5 h-3.5" />
                <span>{t('home.spatialIntelligence', 'Spatial Intelligence Engine')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.smartMapTitle', 'Smart Semantic Map of India')}
              </h2>

              <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {t('home.smartMapSubtitle', 'Color-coded navigation that shows recommended routes in teal, uncrowded safe zones in green, and real-time congestion warnings in amber.')}
              </p>

              <div className="space-y-3 text-xs text-neutral-text-sec dark:text-darkmode-text-secondary">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-brand"></span>
                  <span><strong>Teal Routes:</strong> Optimized itinerary paths balancing travel time & scenic beauty</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-nature"></span>
                  <span><strong>Green Zones:</strong> Eco-verified homestays, nature reserves & safe corridors</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-action"></span>
                  <span><strong>Orange Markers:</strong> Recommended authentic local experiences & artisans</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-semantic-warning"></span>
                  <span><strong>Amber Alerts:</strong> Active crowd warnings with automated alternate route suggestions</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/map"
                  className="btn-brand px-6 py-3 text-sm font-bold shadow-md inline-flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t('home.openMap', 'Open Interactive Smart Map')}</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div
                onClick={() => navigate('/map')}
                className="ts-card overflow-hidden cursor-pointer relative aspect-video border-2 border-brand/20 group shadow-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"
                  alt="India Map Interactive Representation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-brand-deep/30 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="px-6 py-3 rounded-full bg-white/95 dark:bg-darkmode-surface/95 text-neutral-text-primary dark:text-darkmode-text-primary shadow-2xl font-bold text-sm flex items-center gap-2 group-hover:bg-brand group-hover:text-white transition-colors">
                    <Compass className="w-4 h-4 text-brand group-hover:text-white" />
                    <span>Explore India Live on Map (Click to Open)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 8: LOCAL EXPERIENCE MARKETPLACE
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-action font-bold text-xs uppercase tracking-wider mb-2">
              <HeartHandshake className="w-4 h-4" />
              <span>{t('home.communitySupportTag', 'Direct Community Support • 0% OTA Commission')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
              {t('home.authenticExperiencesTitle', 'Authentic Local Experiences & Artisans')}
            </h2>
            <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
              {t('home.authenticExperiencesSubtitle', 'Engage with master craftsmen, mountain elders, and organic farmers with complete price transparency.')}
            </p>
          </div>

          <Link
            to="/experiences"
            className="mt-4 md:mt-0 text-sm font-bold text-action hover:text-action-hover flex items-center gap-1 group"
          >
            <span>{t('home.browseAllExperiences', 'Browse All Experiences')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayExperiences.map((exp) => (
            <div
              key={exp.id}
              onClick={() => navigate('/experiences')}
              className="ts-card overflow-hidden group cursor-pointer flex flex-col justify-between"
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
                      {exp.category || exp.location || 'Cultural Immersion'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={exp.hostAvatar || exp.image}
                      alt={exp.hostName}
                      className="w-8 h-8 rounded-full object-cover border border-brand"
                    />
                    <div>
                      <p className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                        {exp.hostName}
                      </p>
                      <p className="text-[11px] text-neutral-muted">
                        {exp.hostRole || exp.hostTitle || 'Govt Certified Guide'}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors leading-snug">
                    {exp.title}
                  </h3>

                  <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2">
                    {exp.description}
                  </p>

                  <div className="p-2 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated text-[11px] text-neutral-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-nature shrink-0" />
                    <span className="truncate">{exp.verificationReason || exp.verificationBadge || 'PM-JUGA Verified Guide'}</span>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown bar */}
              <div className="px-5 py-3.5 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-muted">{t('common.total', 'Total')}: </span>
                  <strong className="text-base font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                    ₹{exp.totalPrice}
                  </strong>
                  <span className="text-[10px] text-nature font-semibold ml-1.5">{t('common.zeroPlatformFee', '(0% Platform Fee)')}</span>
                </div>

                <span className="btn-action !px-3 !py-1.5 !text-xs font-bold">
                  {t('home.bookSlot', 'Book Slot')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ========================================================
          SECTION 9: HOW TRAVELSATHI HELPS DURING A TRIP
          ======================================================== */}
      <section className="py-20 bg-neutral-bg-secondary dark:bg-darkmode-surface/50 border-y border-neutral-border dark:border-darkmode-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('home.realtimeCompanionTag', 'Real-Time Travel Companion')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
              {t('home.howHelpsTitle', 'How TravelSathi Empowers Your Live Journey')}
            </h2>
            <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary">
              {t('home.howHelpsSubtitle', 'TravelSathi does not abandon you after you book. It adapts continuously during your trip.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Live Trip Mode */}
            <div className="ts-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-ts-md bg-brand-50 text-brand flex items-center justify-center">
                <Navigation className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.liveTripModeTitle', '1. Live Trip Mode')}
              </h3>
              <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {t('home.liveTripModeDesc', 'Changes from planning into active travel-assistance. Displays your current activity, next stop, local weather, crowd density, and safe walking route with zero cognitive friction.')}
              </p>
              <div className="text-xs font-bold text-brand flex items-center gap-1 pt-2">
                <span>{t('home.liveTripDemo', 'View Live Mode Demo')}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Smart Delay Handling */}
            <div className="ts-card p-6 space-y-4 border-2 border-action/30">
              <div className="w-12 h-12 rounded-ts-md bg-action-light text-action flex items-center justify-center">
                <Clock className="w-6 h-6 text-action" />
              </div>
              <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.smartDelayTitle', '2. Smart Delay Handling')}
              </h3>
              <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {t('home.smartDelayDesc', "Stuck in mountain traffic or lingering at a tea stall? One tap dynamically recalculates the rest of your day, shifts dining reservations, and ensures a relaxed evening return.")}
              </p>
              <div className="text-xs font-bold text-action flex items-center gap-1 pt-2">
                <span>{t('home.autoScheduleAdjustment', 'Automatic Schedule Adjustment')}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Weather-Aware Adaptation */}
            <div className="ts-card p-6 space-y-4">
              <div className="w-12 h-12 rounded-ts-md bg-trust-light text-trust flex items-center justify-center">
                <Sun className="w-6 h-6 text-trust" />
              </div>
              <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.weatherAwareTitle', '3. Weather-Aware Itinerary')}
              </h3>
              <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {t('home.weatherAwareDesc', 'If unseasonal afternoon rain is predicted, outdoor hikes automatically swap with indoor craft workshops, museums, and cozy cafes, returning outdoor trails once the skies clear.')}
              </p>
              <div className="text-xs font-bold text-trust flex items-center gap-1 pt-2">
                <span>{t('home.intelligentSwapping', 'Intelligent Activity Swapping')}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 10: SAFETY & SMART TRAVEL
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-deep to-brand text-white rounded-ts-hero p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-semantic-sos text-white text-xs font-bold tracking-wider uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('home.safetyTag', 'Dedicated Safety & Emergency Infrastructure')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                {t('home.safetyTitle', 'Travel Safely Across Any Indian Region')}
              </h2>

              <p className="text-sm text-white/90 leading-relaxed max-w-2xl">
                {t('home.safetySubtitle', 'TravelSathi integrates certified 24/7 tourist helplines (1363), National Emergency (112), Women Safety (1091), live weather advisories, and single-tap Emergency Mode with GPS coordinate sharing.')}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => setIsSosModalOpen(true)}
                  className="btn-sos px-6 py-3 text-sm font-extrabold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  <span>{t('home.openSosCenter', 'Open Emergency SOS Center')}</span>
                </button>

                <Link
                  to="/safety"
                  className="btn-secondary px-6 py-3 text-sm font-bold bg-white text-neutral-text-primary hover:bg-neutral-bg"
                >
                  {t('home.viewSafetyAlerts', 'View Live Regional Safety Alerts')}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-ts-md p-5 border border-white/20 space-y-3 text-xs">
              <p className="font-bold text-white text-sm">{t('home.emergencyHelplines', 'Emergency Helplines (Direct 24x7):')}</p>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>{t('home.natEmergency', 'National Emergency:')}</span>
                  <strong className="text-action">112</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('home.touristPolice', 'Tourist Police:')}</span>
                  <strong className="text-action">1363</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('home.womenHelpline', 'Women Helpline:')}</span>
                  <strong className="text-action">1091</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('home.ambulance', 'Ambulance:')}</span>
                  <strong className="text-action">108</strong>
                </div>
              </div>
              <p className="text-[11px] text-white/70 pt-1 border-t border-white/20">
                Offline emergency medical profile saved locally in your Trip Wallet.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================
          SECTION 11: SUSTAINABLE TOURISM & COMMUNITY IMPACT
          ======================================================== */}
      <section className="py-20 bg-neutral-bg-secondary dark:bg-darkmode-surface/50 border-t border-neutral-border dark:border-darkmode-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="badge-nature">
              🌱 {t('home.impactMetricsTag', 'National DPI Impact Metrics')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
              {t('home.empoweringCommunitiesTitle', 'Empowering Communities • Protecting Fragile Ecology')}
            </h2>
            <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary">
              {t('home.empoweringCommunitiesSubtitle', 'TravelSathi is designed to divert tourist footfall from over-saturated hotspots into thriving local community economies.')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="ts-card p-6 space-y-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-nature">
                ₹0
              </span>
              <p className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.statOtaCommission', 'OTA Commission Charged')}
              </p>
              <p className="text-[11px] text-neutral-muted">
                {t('home.statOtaDesc', '100% of tariff goes directly to verified rural hosts.')}
              </p>
            </div>

            <div className="ts-card p-6 space-y-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-brand">
                {totalDestinationCount.toLocaleString('en-IN')}
              </span>
              <p className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.statVerifiedPois', 'Verified Indian POIs')}
              </p>
              <p className="text-[11px] text-neutral-muted">
                {t('home.statPoisDesc', 'Covering 28 States and 8 Union Territories.')}
              </p>
            </div>

            <div className="ts-card p-6 space-y-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-trust">
                65%
              </span>
              <p className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.statCrowdDiversion', 'Hotspot Crowd Diversion')}
              </p>
              <p className="text-[11px] text-neutral-muted">
                {t('home.statCrowdDesc', 'Via intelligent hidden-gem route optimization.')}
              </p>
            </div>

            <div className="ts-card p-6 space-y-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-action">
                18,400 T
              </span>
              <p className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.statCarbonMitigated', 'Carbon Footprint Mitigated')}
              </p>
              <p className="text-[11px] text-neutral-muted">
                {t('home.statCarbonDesc', 'Through electric mountain shuttles and slow travel.')}
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 12 & 13: FOR HOSTS & GOVERNMENT INTELLIGENCE
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* For Local Hosts */}
          <div className="ts-card p-8 space-y-5 border-l-4 border-l-nature flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge-nature">
                  {t('home.forHostsTag', '🏡 For Homestay Hosts & Guides')}
                </span>
                <span className="text-xs font-bold text-neutral-muted">PM-JUGA Aligned</span>
              </div>

              <h3 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.forHostsTitle', 'Zero Commission. Direct UPI. AI Pricing Co-Pilot.')}
              </h3>

              <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {t('home.forHostsDesc', 'Connect your tribal homestay or local guiding business directly to travelers across India. Access automated dynamic pricing suggestions based on upcoming festivals without tech barriers.')}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between">
              <button
                onClick={() => { switchRole('host'); navigate('/host/dashboard'); }}
                className="btn-brand !px-4 !py-2.5 !text-xs font-bold"
              >
                {t('home.accessHostDashboard', 'Access Host Dashboard')}
              </button>
              <span className="text-xs font-bold text-nature">DigiLocker eKYC Ready</span>
            </div>
          </div>

          {/* For Government & Tourism Authorities */}
          <div className="ts-card p-8 space-y-5 border-l-4 border-l-trust flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge-trust">
                  {t('home.forGovTag', '🏛️ For Tourism Authorities (DMO)')}
                </span>
                <span className="text-xs font-bold text-neutral-muted">Swadesh Darshan 2.0</span>
              </div>

              <h3 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {t('home.forGovTitle', 'Destination Pressure Index & Forecasting')}
              </h3>

              <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {t('home.forGovDesc', 'Empower state tourism departments with predictive visitor flow heatmaps, infrastructure gap detection, and automated crowd diversion to prevent ecological degradation.')}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between">
              <button
                onClick={() => { switchRole('dmo'); navigate('/dmo'); }}
                className="btn-brand !bg-trust hover:!bg-trust-hover !px-4 !py-2.5 !text-xs font-bold"
              >
                {t('home.launchDmoCenter', 'Launch DMO Intelligence Center')}
              </button>
              <span className="text-xs font-bold text-trust">Real-Time Data Feed</span>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 14: REAL TRAVELER TESTIMONIALS
          ======================================================== */}
      <section className="py-20 bg-neutral-bg-secondary dark:bg-darkmode-surface/50 border-t border-neutral-border dark:border-darkmode-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-3xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
              {t('home.testimonialsTitle', 'What Travelers Say About TravelSathi')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary">
              {t('home.testimonialsSubtitle', 'Real journeys made simpler, unhurried, and deeply rooted in authentic culture.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ts-card p-6 space-y-4 text-xs">
              <div className="flex text-action font-bold">★★★★★</div>
              <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed italic">
                "Instead of spending 3 hours stuck in Manali traffic, TravelSathi suggested Tirthan Valley. We stayed in an authentic Kathkuni wooden homestay, met local carpenters, and paid 40% less."
              </p>
              <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border">
                <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">Sneha Kulkarni</p>
                <p className="text-[11px] text-neutral-muted">Solo Trekker • Pune</p>
              </div>
            </div>

            <div className="ts-card p-6 space-y-4 text-xs">
              <div className="flex text-action font-bold">★★★★★</div>
              <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed italic">
                "The Smart Delay feature is a lifesaver. Our train into Jagdalpur was 90 minutes late. TravelSathi automatically adjusted our village Dhokra craft schedule so we missed nothing!"
              </p>
              <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border">
                <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">Vikramaditya Sengupta</p>
                <p className="text-[11px] text-neutral-muted">Cultural Explorer • Kolkata</p>
              </div>
            </div>

            <div className="ts-card p-6 space-y-4 text-xs">
              <div className="flex text-action font-bold">★★★★★</div>
              <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed italic">
                "Knowing our homestay payment went 100% directly to our Gond tribal host through UPI without middleman OTA commission made the trip feel genuinely respectful and meaningful."
              </p>
              <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border">
                <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">Ananya & David</p>
                <p className="text-[11px] text-neutral-muted">Eco-Tourists • Bengaluru</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          SECTION 15: FINAL CALL TO ACTION
          ======================================================== */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary tracking-tight">
          {t('home.ctaTitle', 'Ready to Experience Authentic India?')}
        </h2>
        
        <p className="text-base sm:text-lg text-neutral-text-sec dark:text-darkmode-text-secondary max-w-xl mx-auto leading-relaxed">
          {t('home.ctaSubtitle', 'Start your journey today with AI-crafted personalized itineraries, verified stays, and real-time safety.')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/plan"
            className="btn-action px-8 py-4 text-base font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            <span>{t('home.startNow', 'Get Started Now')}</span>
          </Link>

          <Link
            to="/explore"
            className="btn-secondary px-8 py-4 text-base font-bold flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5" />
            <span>{t('home.exploreCatalog', 'Explore Verified Destinations')}</span>
          </Link>
        </div>
      </section>

      {/* Floating Pitch Rehearsal Studio Trigger (Dev-only, inside showMoreTools) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-6 left-6 z-40 hidden md:block animate-fadeIn">
          <button
            onClick={() => setIsPitchModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-950 text-white border border-[#E5A93C]/50 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
            title="Smart India Hackathon 2026 — 5-Minute Pitch Rehearsal Studio"
          >
            <Award className="w-4 h-4 text-[#E5A93C]" />
            <span>Pitch Studio (04:30)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </div>
      )}

      </div>
      )}

      {/* Explorer Badges Modal */}
      <ExplorerBadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
      />

      {/* Phase 11: Grand Finale Pitch & Stress Testing Modal */}
      <GrandFinalePitchModal
        isOpen={isPitchModalOpen}
        onClose={() => setIsPitchModalOpen(false)}
      />

    </div>
  );
}
