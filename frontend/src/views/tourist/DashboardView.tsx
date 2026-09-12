import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Compass, 
  Sparkles, 
  Calendar, 
  Bookmark, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Clock, 
  Search,
  Star,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function DashboardView() {
  const navigate = useNavigate();
  const { currentUser, travelTwin, activeTrip } = useApp();
  const { t } = useTranslation();

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [famousPlaces, setFamousPlaces] = useState([]);
  const [userTrips, setUserTrips] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback verified famous places in case user has zero saved places
  const fallbackFamousPlaces = [
    {
      id: 10382,
      destination_id: 10382,
      name: 'Taj Mahal (UNESCO World Wonder)',
      state: 'Uttar Pradesh',
      category: 'Heritage',
      image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      id: 7350,
      destination_id: 7350,
      name: 'Hawa Mahal (Palace of Winds)',
      state: 'Rajasthan',
      category: 'Heritage',
      image_url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      id: 2842,
      destination_id: 2842,
      name: 'Pangong Tso (Pangong Lake)',
      state: 'Ladakh',
      category: 'Nature',
      image_url: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    }
  ];

  useEffect(() => {
    const userId = currentUser?.id || 'usr-901';
    
    // Load parallel data for personalized command center
    Promise.all([
      axios.get(`/api/user/saved?user_id=${encodeURIComponent(userId)}`).catch(() => ({ data: { saved_places: [] } })),
      axios.get(`/api/itinerary/user/${encodeURIComponent(userId)}`).catch(() => ({ data: { trips: [] } })),
      axios.get(`/api/recommendations?user_id=${encodeURIComponent(userId)}&top_k=6`).catch(() => ({ data: { recommendations: [] } })),
      axios.get(`/api/user/history?user_id=${encodeURIComponent(userId)}&limit=6`).catch(() => ({ data: { history: [] } })),
      axios.get('/api/destinations?limit=8').catch(() => ({ data: { results: [] } })),
    ]).then(([savedRes, tripsRes, recsRes, histRes, destsRes]) => {
      const validSaved = (savedRes.data?.saved_places || []).filter(s => (s.image_url || s.image) && (s.image_url || s.image).trim() !== '');
      setSavedPlaces(validSaved);
      setUserTrips(tripsRes.data?.trips || []);

      const catalogPlaces = (destsRes.data?.results || []).filter(d => (d.image_url || d.image) && (d.image_url || d.image).trim() !== '');
      setFamousPlaces(catalogPlaces.length > 0 ? catalogPlaces : fallbackFamousPlaces);

      let validRecs = (recsRes.data?.recommendations || []).filter(r => (r.image_url || r.image) && (r.image_url || r.image).trim() !== '');
      if (validRecs.length === 0) {
        validRecs = catalogPlaces.length > 0 ? catalogPlaces.slice(0, 6) : fallbackFamousPlaces;
      }
      setRecommendations(validRecs);

      const validHist = (histRes.data?.history || []).filter(h => (h.image_url || h.image) && (h.image_url || h.image).trim() !== '');
      setRecentSearches(validHist);
    }).finally(() => {
      setLoading(false);
    });
  }, [currentUser?.id]);

  const displaySaved = savedPlaces.length > 0 ? savedPlaces : fallbackFamousPlaces;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Welcome & Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-darkmode-elevated text-brand border border-brand/20">
              {t('profile.title', 'Personal Travel Command Center')}
            </span>
            <span className="text-xs text-neutral-muted">• {currentUser?.name || 'Aarav Sharma'} ({t('profile.verifiedStatus', 'DigiLocker Verified')})</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Traveler'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            {t('profile.subtitle', 'Manage your travel preferences, verified credentials, and saved journeys')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/travel-twin" className="btn-secondary !text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>{t('profile.editProfile', 'Calibrate Travel Twin')}</span>
          </Link>
          <Link to="/plan" className="btn-brand !text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('home.startPlanning', 'Plan New Circuit')}</span>
          </Link>
        </div>
      </div>

      {/* Row 1: Live Trip Status & Quick Metric Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Active / Next Trip Highlight Card with Destination Photo */}
        <div className="lg:col-span-8 ts-card overflow-hidden p-0 border-l-4 border-l-brand flex flex-col sm:flex-row items-stretch">
          <div className="relative w-full sm:w-56 h-48 sm:h-auto overflow-hidden shrink-0 bg-neutral-200">
            <img
              src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80"
              alt={activeTrip?.destination || 'Tirthan Valley, Himachal Pradesh'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-brand text-white shadow-xs">
              {activeTrip?.status || 'Trip In Progress'}
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between gap-4 bg-gradient-to-r from-brand-50/20 via-transparent to-nature/5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {activeTrip?.title || 'Tirthan Valley & Great Himalayan National Park Trail'}
              </h2>
              <p className="text-xs text-neutral-muted flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span>{activeTrip?.destination || 'Himachal Pradesh'}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5" />
                <span>{activeTrip?.dates || 'Active Live Navigation'}</span>
              </p>
              <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2">
                Pristine Himalayan UNESCO valley trail, Serolsar Lake trek, and traditional wood-and-stone Kathkuni village architecture.
              </p>
            </div>

            <button
              onClick={() => navigate('/trips/live')}
              className="btn-action !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-md w-fit cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Enter Live Trip HUD</span>
            </button>
          </div>
        </div>

        {/* Quick Travel Persona Card */}
        <div className="lg:col-span-4 ts-card p-6 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-muted uppercase">Twin Persona Match</span>
              <span className="font-mono text-brand font-bold">96% Aligned</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-darkmode-border h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-brand h-full rounded-full" style={{ width: '96%' }} />
            </div>
          </div>
          <div className="text-xs space-y-1.5 pt-2 text-neutral-text-sec dark:text-darkmode-text-secondary border-t border-neutral-border/50">
            <p>• Preferred Stay: <strong>{travelTwin?.preferredStay || 'Eco-Homestay'}</strong></p>
            <p>• Budget Tier: <strong>{travelTwin?.budgetTier || 'Moderate'}</strong></p>
            <p>• Pacing: <strong>{travelTwin?.pace || 'Unrushed / Mindful'}</strong></p>
          </div>
        </div>
      </div>

      {/* Row 2: Deeply Personalized Recommendations Feed with Photos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              <span>Recommended For You</span>
            </h2>
            <p className="text-xs text-neutral-muted">
              Model 1 & 4 fused rankings based on your slow travel preference and uncrowded destination profile.
            </p>
          </div>
          <Link to="/recommendations" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
            <span>View All AI Picks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recommendations.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/destination/${item.id}`)}
              className="ts-card overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-neutral-200 overflow-hidden">
                  <img
                    src={item.image || item.image_url || 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{item.rating || 4.7}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white shadow-xs">
                    {item.category || 'Sightseeing'}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-base text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand" />
                    <span>{item.state}</span>
                  </p>
                  {item.reason && (
                    <p className="text-[11px] text-nature font-semibold bg-nature-light p-2 rounded">
                      💡 {item.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-2 border-t border-neutral-border flex items-center justify-between text-xs font-bold text-brand">
                  <span>Explore Itinerary</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Visual Showcase of Famous Indian Landmarks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand" />
              <span>Iconic Famous Places Across India</span>
            </h2>
            <p className="text-xs text-neutral-muted">
              National heritage wonders, sacred temples, and alpine lakes with verified high-definition photographs.
            </p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
            <span>Explore All Places</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {famousPlaces.slice(0, 4).map((place) => (
            <div
              key={place.id}
              onClick={() => navigate(`/destination/${place.id}`)}
              className="ts-card overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200">
                <img
                  src={place.image_url || place.image || 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80'}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement; target.onerror = null; target.src = 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{place.rating || 4.8}</span>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-brand text-white shadow-xs">
                  {place.category || 'Attraction'}
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <h4 className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors truncate">
                  {place.name}
                </h4>
                <p className="text-[11px] text-neutral-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand" />
                  <span>{place.state}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Saved Places Library & Recent Search History (All with Photos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Saved Places Library with Verified Photos */}
        <div className="ts-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-brand" />
              <span>Saved Places ({savedPlaces.length})</span>
            </h3>
            <Link to="/saved" className="text-xs font-bold text-brand hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {displaySaved.slice(0, 3).map((sp) => (
              <div
                key={sp.destination_id || sp.id}
                onClick={() => navigate(`/destination/${sp.destination_id || sp.id}`)}
                className="p-3 rounded-xl bg-neutral-bg dark:bg-darkmode-elevated flex items-center justify-between gap-3 hover:bg-neutral-bg/70 cursor-pointer transition-all border border-neutral-border/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={sp.image_url || sp.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=300&q=80'}
                    alt={sp.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-xs"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary block truncate">
                      {sp.name}
                    </span>
                    <span className="text-[11px] text-neutral-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand" />
                      <span>{sp.state} • {sp.category}</span>
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand shrink-0">Explore →</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Search & Explorations with Photos */}
        <div className="ts-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
              <Search className="w-4 h-4 text-brand" />
              <span>Recent Explorations</span>
            </h3>
            <Link to="/history" className="text-xs font-bold text-brand hover:underline">
              Full History
            </Link>
          </div>

          {recentSearches.length === 0 ? (
            <div className="space-y-3">
              {fallbackFamousPlaces.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/destination/${f.id}`)}
                  className="p-2.5 rounded-xl bg-neutral-bg dark:bg-darkmode-elevated flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-bg/70 transition-all border border-neutral-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={f.image_url}
                      alt={f.name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary block truncate">
                        {f.name}
                      </span>
                      <span className="text-neutral-muted text-[11px]">{f.state}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand font-bold uppercase shrink-0">
                    DISCOVER
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSearches.slice(0, 4).map((h) => (
                <div
                  key={h.interaction_id}
                  onClick={() => navigate(`/destination/${h.destination_id}`)}
                  className="p-2.5 rounded-xl bg-neutral-bg dark:bg-darkmode-elevated flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-bg/70 transition-all border border-neutral-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={h.image_url || 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=200&q=80'}
                      alt={h.destination_name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement; target.onerror = null; target.src = 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary block truncate">
                        {h.destination_name}
                      </span>
                      <span className="text-neutral-muted text-[11px] block">{h.state}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand font-bold uppercase shrink-0">
                    {h.action_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
