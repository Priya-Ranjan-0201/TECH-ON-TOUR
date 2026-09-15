import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  Sun, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Coffee, 
  Utensils, 
  PhoneCall,
  RotateCcw,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/summaryTranslator';
import InAppNavigationModal from '../../components/common/InAppNavigationModal';

export default function LiveTripModeView() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { activeTrip, handleSmartDelay, modifyItineraryPrompt, setIsConciergeOpen, setIsSosModalOpen, language } = useApp();
  const currentLang = i18n?.language || language || 'en';

  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [selectedDelay, setSelectedDelay] = useState(60);
  const [isAdapting, setIsAdapting] = useState(false);

  // In-App Navigation Modal State
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [navDest, setNavDest] = useState<any>(null);
  const [navOrigin, setNavOrigin] = useState<any>(null);

  // Real-time Weather Telemetry (OpenWeatherMap)
  const [realWeather, setRealWeather] = useState<{
    temp_c: number;
    condition: string;
    rain_probability_pct: number;
    advisory: string;
    is_rainy: boolean;
  } | null>(null);

  // Real-time Crowd Density with Hourly Token
  const [liveCrowd, setLiveCrowd] = useState<{
    density_label: string;
    capacity_pct: number;
    hourly_token: string;
  } | null>(null);

  const currentStop = activeTrip?.schedule?.find((s: any) => s.status === 'Current') || activeTrip?.schedule?.find((s: any) => s.status === 'Upcoming') || activeTrip?.schedule?.[0];
  const nextDestinationName = currentStop?.title || currentStop?.location || activeTrip?.destination || 'Curated Stop';
  const nextEta = currentStop?.time ? `Scheduled: ${currentStop.time}` : 'ETA: 15 min • 3.8 km';

  // Fetch real OpenWeatherMap telemetry for destination / current stop
  useEffect(() => {
    const dest = activeTrip?.destination || 'Jaipur';
    const latParam = currentStop?.latitude ? `&lat=${currentStop.latitude}&lng=${currentStop.longitude}` : '';
    axios.get(`/api/weather?destination=${encodeURIComponent(dest)}${latParam}`)
      .then(res => {
        if (res.data) {
          setRealWeather({
            temp_c: Math.round(res.data.current_temp_c || 24),
            condition: res.data.condition || 'Pleasant & Clear',
            rain_probability_pct: res.data.rain_probability_pct || 10,
            advisory: res.data.advisory || '',
            is_rainy: !!res.data.is_rainy
          });
        }
      })
      .catch(err => console.warn('Live weather fetch failed:', err));
  }, [activeTrip?.destination, currentStop?.latitude]);

  // Fetch hourly crowd density
  useEffect(() => {
    const dest = activeTrip?.destination || '';
    axios.get(`/api/destinations/map-points?q=${encodeURIComponent(dest)}&limit=10`)
      .then(res => {
        const points = res.data?.points || [];
        const token = res.data?.hourly_token || `HT-${new Date().getHours()}:00-IST`;
        if (points.length > 0 && typeof points[0].crowd_density_score === 'number') {
          const score = points[0].crowd_density_score > 1 ? points[0].crowd_density_score : points[0].crowd_density_score * 100;
          const label = score > 65 ? 'High Density (Crowded)' : (score > 35 ? 'Moderate Density (Normal)' : 'Low Density (Uncrowded)');
          setLiveCrowd({
            density_label: label,
            capacity_pct: Math.round(score),
            hourly_token: token
          });
        } else {
          setLiveCrowd({
            density_label: 'Moderate Density (Normal)',
            capacity_pct: 42,
            hourly_token: token
          });
        }
      })
      .catch(() => {
        setLiveCrowd({
          density_label: 'Optimal Density (Low Crowds)',
          capacity_pct: 35,
          hourly_token: `HT-${new Date().getHours()}:00-IST`
        });
      });
  }, [activeTrip?.destination]);

  const onConfirmDelay = async () => {
    setIsAdapting(true);
    await handleSmartDelay(selectedDelay);
    setIsAdapting(false);
    setDelayModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Live Mode Top Banner */}
      <div className="bg-gradient-to-r from-brand via-brand-dark to-brand-deep text-white rounded-ts-hero p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-nature animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-100">
              LIVE TRIP MODE ACTIVE • {activeTrip.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {activeTrip.title}
          </h1>

          <p className="text-xs sm:text-sm text-white/85">
            📍 {activeTrip.destination} • Day {activeTrip.dayNumber} Timeline
          </p>
        </div>

        {/* Live Quick Actions */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => setDelayModalOpen(true)}
            className="btn-action !py-2.5 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105"
          >
            <Clock className="w-4 h-4" />
            <span>I'm Running Late</span>
          </button>

          <button
            onClick={() => setIsConciergeOpen(true)}
            className="btn-secondary !py-2.5 !px-4 text-xs font-bold bg-white text-neutral-text-primary hover:bg-neutral-bg flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Ask Concierge</span>
          </button>
        </div>
      </div>

      {/* Smart Delay Notification Banner if triggered */}
      {activeTrip.delayMessage && (
        <div className="p-4 rounded-ts-md bg-accent-50 dark:bg-darkmode-elevated border border-accent-400/40 text-xs font-semibold text-neutral-text-primary dark:text-darkmode-text-primary flex items-start gap-3 animate-fadeIn shadow-sm">
          <Clock className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-accent-800 dark:text-accent-400 text-sm block">Smart Delay Recalculation Applied:</strong>
            <p className="leading-relaxed">{activeTrip.delayMessage}</p>
          </div>
        </div>
      )}

      {/* Weather Adaptation Banner (Section 33: Weather-Aware Itinerary Adaptation) */}
      {activeTrip?.weather?.rainAlert && (
        <div className="p-4 rounded-ts-md bg-amber-50 dark:bg-darkmode-elevated border border-amber-300 dark:border-amber-700 text-xs font-medium text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-full bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <strong className="font-bold text-sm block text-amber-900 dark:text-amber-100">Weather Advisory Update</strong>
              <span>Rain forecast detected in {activeTrip.destination}. Outdoor activities may be affected.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => modifyItineraryPrompt('weather')}
              className="px-3 py-1.5 rounded-ts-sm bg-primary-800 hover:bg-primary-900 text-primary-50 font-semibold text-xs transition-colors"
            >
              Suggest Alternative
            </button>
            <button
              onClick={() => alert("Keeping existing plan despite weather warning.")}
              className="px-3 py-1.5 rounded-ts-sm bg-white dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border text-neutral-text-primary dark:text-darkmode-text-primary font-medium text-xs hover:bg-neutral-bg"
            >
              Keep Plan
            </button>
          </div>
        </div>
      )}

      {/* Live Conditions Overview: Weather, Crowd, Safety */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="ts-card p-4 space-y-1">
          <span className="text-neutral-muted block">Next Destination</span>
          <p className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-primary-800 dark:text-accent-400 shrink-0" />
            <span className="line-clamp-1">{nextDestinationName}</span>
          </p>
          <span className="text-[11px] text-neutral-muted">{nextEta}</span>
        </div>

        <div className="ts-card p-4 space-y-1">
          <span className="text-neutral-muted block">Current Weather</span>
          <p className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {realWeather?.temp_c ? `${realWeather.temp_c}°C` : (activeTrip.weather?.temp || '24°C')} • {realWeather?.condition || activeTrip.weather?.condition || 'Pleasant & Clear'}
            </span>
          </p>
          <span className="text-[11px] text-neutral-muted">
            Precipitation: {realWeather?.rain_probability_pct ?? (activeTrip.weather?.rainAlert ? 65 : 5)}% • OpenWeatherMap Live
          </span>
        </div>

        <div className="ts-card p-4 space-y-1">
          <span className="text-neutral-muted block">{translateText("Live Crowd Density", currentLang)}</span>
          <p className="text-sm font-bold text-secondary-800 dark:text-secondary-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{translateText(liveCrowd?.density_label || activeTrip.crowdStatus || 'Optimal Density (Low Crowds)', currentLang)}</span>
          </p>
          <span className="text-[11px] text-neutral-muted">
            {liveCrowd?.hourly_token ? `Hourly Job Refresh (${liveCrowd.hourly_token.slice(-12)})` : 'Hourly Refresh Active'}
          </span>
        </div>

        <div className="ts-card p-4 space-y-1">
          <span className="text-neutral-muted block">{translateText("Emergency & Safety", currentLang)}</span>
          <button
            onClick={() => setIsSosModalOpen(true)}
            className="mt-1 w-full py-1 px-2.5 rounded bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{translateText("Emergency SOS", currentLang)}</span>
          </button>
        </div>
      </div>

      {/* Today's Live Schedule Timeline */}
      <div className="ts-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-border dark:border-darkmode-border">
          <div>
            <h2 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Today's Live Itinerary
            </h2>
            <p className="text-xs text-neutral-muted">
              Auto-adapts to travel times, delays, and weather alerts
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => modifyItineraryPrompt('cheaper')}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-neutral-text-sec hover:border-brand"
            >
              Make It Cheaper
            </button>
            <button
              onClick={() => modifyItineraryPrompt('weather')}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-neutral-text-sec hover:border-brand"
            >
              Weather Adaptation
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          {activeTrip.schedule.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-ts-md border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                item.status === 'Current'
                  ? 'border-2 border-brand bg-brand-50/50 dark:bg-darkmode-elevated shadow-md'
                  : item.status === 'Completed'
                  ? 'border-neutral-border bg-neutral-bg-secondary/50 opacity-70'
                  : 'border-neutral-border bg-neutral-card dark:bg-darkmode-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  item.status === 'Current'
                    ? 'bg-brand text-white'
                    : item.status === 'Completed'
                    ? 'bg-nature text-white'
                    : 'bg-neutral-bg dark:bg-darkmode-elevated text-neutral-muted border border-neutral-border'
                }`}>
                  {item.status === 'Completed' ? '✓' : idx + 1}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand">
                      {item.time}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Current' ? 'bg-brand text-white' :
                      item.status === 'Completed' ? 'bg-nature-light text-nature' :
                      'bg-neutral-bg text-neutral-muted'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {translateText(item.title, currentLang)}
                  </h3>

                  <p className="text-xs text-neutral-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-muted" />
                    <span>{item.location} • {item.notes}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const prevStop = idx > 0 ? activeTrip.schedule[idx - 1] : null;
                    setNavOrigin(
                      prevStop && prevStop.latitude && prevStop.longitude
                        ? {
                            name: prevStop.title || prevStop.location,
                            latitude: prevStop.latitude,
                            longitude: prevStop.longitude,
                          }
                        : null
                    );
                    setNavDest({
                      name: item.title || item.location,
                      latitude: item.latitude || (currentStop?.latitude ?? 26.9124),
                      longitude: item.longitude || (currentStop?.longitude ?? 75.7873),
                    });
                    setNavModalOpen(true);
                  }}
                  className="btn-brand !py-1.5 !px-3 !text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Launch In-App Road Navigation"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </button>
                {item.latitude && item.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-neutral-border hover:bg-neutral-bg dark:hover:bg-darkmode-elevated text-neutral-muted hover:text-brand transition-colors"
                    title="Open in Google Maps (Fallback)"
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Delay Modal (Section 25) */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-card dark:bg-darkmode-surface border border-neutral-border rounded-ts-hero shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-action-light text-action flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Smart Delay Recalculation
                </h3>
                <p className="text-xs text-neutral-muted">
                  How much time behind schedule are you?
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              TravelSathi will automatically adjust your remaining activities, opening hours, dining reservations, and hotel return so you can travel without rushing.
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[30, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedDelay(mins)}
                  className={`py-3 rounded-ts-sm font-bold border transition-colors ${
                    selectedDelay === mins
                      ? 'bg-action text-white border-action'
                      : 'bg-neutral-bg border-neutral-border text-neutral-text-sec hover:border-action'
                  }`}
                >
                  +{mins} Mins Late
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={onConfirmDelay}
                className="btn-action flex-1 py-2.5 text-xs font-bold"
              >
                Recalculate Today's Schedule
              </button>
              <button
                onClick={() => setDelayModalOpen(false)}
                className="btn-secondary py-2.5 px-4 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Road Navigation Modal */}
      <InAppNavigationModal
        isOpen={navModalOpen}
        onClose={() => setNavModalOpen(false)}
        destination={navDest}
        origin={navOrigin}
      />

    </div>
  );
}
