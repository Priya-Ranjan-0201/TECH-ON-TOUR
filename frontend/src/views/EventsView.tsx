import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Sparkles, Hotel, Utensils,
  Search, Info, Compass, ShieldCheck, ArrowRight, X, Clock,
  CheckCircle2, AlertTriangle, ChevronRight, Layers, Eye, Share2
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { getLocalizedCategory, getLocalizedEventField, translateText } from '../utils/summaryTranslator';

const MONTHS = [
  "All", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CATEGORIES = [
  "All", "CULTURAL", "RELIGIOUS / SPIRITUAL", "TRIBAL", "HARVEST",
  "HERITAGE", "LIVESTOCK / MELAS", "FOOD", "MUSIC", "ARTS & CRAFTS"
];

// Color-coding strictly following prompt specifications:
// Teal: Cultural, Green: Nature/harvest, Orange: Mela/Fair, Blue: Heritage, Purple: Music/Arts, Red: Important advisory
const getCategoryColor = (category: string) => {
  const cat = (category || "").toUpperCase();
  if (cat.includes("CULTURAL")) return { bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30", hex: "#14b8a6", label: "Cultural" };
  if (cat.includes("HARVEST") || cat.includes("NATURE")) return { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", hex: "#10b981", label: "Harvest / Seasonal" };
  if (cat.includes("MELA") || cat.includes("LIVESTOCK")) return { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", hex: "#f59e0b", label: "Mela / Traditional Fair" };
  if (cat.includes("HERITAGE")) return { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", hex: "#3b82f6", label: "Heritage / Historical" };
  if (cat.includes("MUSIC") || cat.includes("ART") || cat.includes("TRIBAL")) return { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", hex: "#a855f7", label: "Music & Indigenous Arts" };
  return { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30", hex: "#f43f5e", label: "Sacred Celebration" };
};

export default function EventsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Filters & State
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [unescoOnly, setUnescoOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

  // User Trip Context Bar State
  const [tripDestination, setTripDestination] = useState("Kolkata");
  const [tripStartDate, setTripStartDate] = useState("2026-10-01");
  const [tripEndDate, setTripEndDate] = useState("2026-10-07");
  const [tripInterest, setTripInterest] = useState("Culture, Heritage");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Events Catalog State
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Detailed Modal State
  const [activeModalEvent, setActiveModalEvent] = useState<any | null>(null);
  const [activeModalLoading, setActiveModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "experience" | "advisory" | "stays" | "food">("about");

  // Fetch Recommended Events based on Trip Context
  const fetchRecommendations = async () => {
    if (!tripDestination && !tripStartDate) return;
    setIsLoadingRecs(true);
    try {
      const params = new URLSearchParams({
        destination: tripDestination,
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
        interests: tripInterest
      });
      const res = await fetch(`/api/events/recommend?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error("Failed to fetch recommendations", e);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // Fetch Events Catalog with Filters
  const fetchCatalog = async () => {
    setIsLoadingEvents(true);
    try {
      const params = new URLSearchParams({ limit: "150" });
      if (selectedMonth !== "All") params.append("month", selectedMonth);
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (unescoOnly) params.append("unesco_only", "true");
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to fetch events catalog", e);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [selectedMonth, selectedCategory, unescoOnly]);

  const openEventDetails = async (eventId: string) => {
    setActiveModalLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveModalEvent(data);
        setActiveTab("about");
      }
    } catch (e) {
      console.error("Failed to load event details", e);
    } finally {
      setActiveModalLoading(false);
    }
  };

  const handleBuildTripAroundEvent = (event: any) => {
    navigate('/plan', {
      state: {
        prefilledDestination: event.city || event.state,
        prefilledStartDate: event.event_start_date || tripStartDate,
        prefilledEndDate: event.event_end_date || tripEndDate,
        prefilledNotes: `Anchor Trip: Attend ${event.event_name} at ${event.venue || event.city}. Experience local rituals, regional food specialties, and verified stays.`
      }
    });
  };

  const handleApplyShiftDates = (suggested: any) => {
    if (suggested?.start_date && suggested?.end_date) {
      setTripStartDate(suggested.start_date);
      setTripEndDate(suggested.end_date);
      // Re-trigger recommendation check with new shifted dates
      setTimeout(() => {
        fetchRecommendations();
      }, 50);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. Header Banner */}
      <div className="text-center max-w-4xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-action/10 text-action dark:bg-action/20 border border-action/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('events.badge', 'Cultural Calendars & Melas')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary tracking-tight">
          {t('events.title', 'Events & Festivals of India')}
        </h1>
        <p className="text-sm sm:text-base text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed max-w-2xl mx-auto">
          {t('events.subtitle', 'Explore verified historical festivals, tribal gatherings, sacred ceremonies, and seasonal melas with verified dates, crowd density advisories, and nearby local stays.')}
        </p>
      </div>

      {/* 2. Date-Aware & Location-Aware Trip Intelligence Bar */}
      <div className="ts-card p-5 sm:p-6 bg-gradient-to-br from-neutral-card to-neutral-bg-secondary dark:from-darkmode-card dark:to-darkmode-elevated border border-neutral-border dark:border-darkmode-border shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-border/60 dark:border-darkmode-border/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-action" />
            <h2 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary uppercase tracking-wider">
              {t('events.checkTrip', 'Check Cultural Events For Your Planned Trip')}
            </h2>
          </div>
          <span className="text-[11px] text-neutral-muted">{t('events.relevanceEngine', 'Date & Proximity Relevance Engine')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-neutral-text-sec dark:text-darkmode-text-secondary mb-1">
              {t('events.plannedDest', 'Planned Destination')}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-neutral-muted" />
              <input
                type="text"
                value={tripDestination}
                onChange={(e) => setTripDestination(e.target.value)}
                placeholder="e.g. Kolkata, Jaipur, Kohima"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-border dark:border-darkmode-border bg-neutral-card dark:bg-darkmode-card text-neutral-text-primary dark:text-darkmode-text-primary focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-text-sec dark:text-darkmode-text-secondary mb-1">
              {t('events.startDate', 'Trip Start Date')}
            </label>
            <input
              type="date"
              value={tripStartDate}
              onChange={(e) => setTripStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-border dark:border-darkmode-border bg-neutral-card dark:bg-darkmode-card text-neutral-text-primary dark:text-darkmode-text-primary focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-text-sec dark:text-darkmode-text-secondary mb-1">
              {t('events.endDate', 'Trip End Date')}
            </label>
            <input
              type="date"
              value={tripEndDate}
              onChange={(e) => setTripEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-border dark:border-darkmode-border bg-neutral-card dark:bg-darkmode-card text-neutral-text-primary dark:text-darkmode-text-primary focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchRecommendations}
              disabled={isLoadingRecs}
              className="w-full py-2.5 px-4 rounded-lg bg-action hover:bg-action-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isLoadingRecs ? <span className="animate-pulse">{t('events.evaluating', 'Checking...')}</span> : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('events.evaluateBtn', 'Evaluate Trip Events')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Recommendations Carousel / Grid */}
        {recommendations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-neutral-border/60 dark:border-darkmode-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {t('events.findingsTitle', { dest: translateText(tripDestination, i18n.language), start: tripStartDate, end: tripEndDate })}
              </span>
              <span className="text-[11px] text-neutral-muted">{t('events.topRecs', { count: recommendations.length })}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => {
                const color = getCategoryColor(rec.event_category);
                const isComingSoon = rec.match_type === "COMING_SOON_AFTER";
                const isPerfect = rec.match_type === "PERFECT_MATCH" || rec.match_type === "HAPPENING_DURING_TRIP";

                return (
                  <div
                    key={rec.event_id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isComingSoon
                        ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10"
                        : isPerfect
                        ? "bg-teal-500/5 border-teal-500/30 dark:bg-teal-500/10"
                        : "bg-neutral-card dark:bg-darkmode-card border-neutral-border dark:border-darkmode-border"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-bg-secondary dark:bg-darkmode-elevated text-neutral-text-sec">
                          {translateText(rec.badge_label, i18n.language)}
                        </span>
                        {isComingSoon && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t('events.comingSoon', 'Coming Soon')}
                          </span>
                        )}
                        {isPerfect && (
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t('events.duringTrip', 'During Your Trip')}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary line-clamp-1">
                        {translateText(rec.event_name, i18n.language)}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary">
                        <Calendar className="w-3 h-3 text-action" />
                        <span>{rec.event_start_date} to {rec.event_end_date}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary">
                        <MapPin className="w-3 h-3 text-brand" />
                        <span>{translateText(rec.city, i18n.language)}, {translateText(rec.state, i18n.language)} ({translateText(`${rec.distance_km} km away`, i18n.language)})</span>
                      </div>

                      <p className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed bg-neutral-bg-secondary/70 dark:bg-darkmode-elevated/70 p-2 rounded-lg border border-neutral-border/40">
                        <strong>{t('events.reason', 'Reason: ')}</strong>{translateText(rec.recommendation_reason, i18n.language)}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-neutral-border/40 flex flex-col gap-1.5">
                      {rec.can_adjust_dates && rec.suggested_dates && (
                        <button
                          onClick={() => handleApplyShiftDates(rec.suggested_dates)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{t('events.adjustDates', { dates: rec.suggested_dates.start_date.slice(5) })}</span>
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEventDetails(rec.event_id)}
                          className="flex-1 py-1.5 px-2 rounded-lg border border-neutral-border dark:border-darkmode-border text-neutral-text-primary dark:text-darkmode-text-primary text-[11px] font-semibold hover:bg-neutral-bg-secondary dark:hover:bg-darkmode-elevated"
                        >
                          {t('events.viewDetails', 'View Details')}
                        </button>
                        <button
                          onClick={() => handleBuildTripAroundEvent(rec)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-action/10 hover:bg-action/20 text-action font-bold text-[11px]"
                        >
                          {t('events.buildAroundEvent', 'Build Around Event')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter Matrix (Months, Categories, Search, UNESCO) */}
      <div className="space-y-4">
        
        {/* Month Selector Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
          {MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedMonth === m
                  ? "bg-action text-white shadow-sm"
                  : "bg-neutral-bg-secondary dark:bg-darkmode-card text-neutral-text-sec dark:text-darkmode-text-secondary hover:bg-neutral-border/50"
              }`}
            >
              {translateText(m, i18n.language)}
            </button>
          ))}
        </div>

        {/* Category Pills & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                  selectedCategory === c
                    ? "bg-neutral-text-primary text-white dark:bg-darkmode-text-primary dark:text-neutral-bg"
                    : "bg-neutral-bg-secondary dark:bg-darkmode-elevated text-neutral-muted hover:text-neutral-text-primary"
                }`}
              >
                {c === 'All' ? translateText('All', i18n.language) : getLocalizedCategory(c, i18n.language)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setUnescoOnly(!unescoOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                unescoOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "border-neutral-border dark:border-darkmode-border text-neutral-text-sec hover:bg-neutral-bg-secondary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('events.unescoOnly', 'UNESCO Only')}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-bg-secondary dark:bg-darkmode-elevated rounded-lg p-0.5 border border-neutral-border dark:border-darkmode-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2 py-1 rounded text-xs font-semibold ${viewMode === "grid" ? "bg-neutral-card dark:bg-darkmode-card shadow-xs text-action" : "text-neutral-muted"}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-2 py-1 rounded text-xs font-semibold ${viewMode === "map" ? "bg-neutral-card dark:bg-darkmode-card shadow-xs text-action" : "text-neutral-muted"}`}
              >
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Search Filter input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCatalog()}
            placeholder={t('events.searchPlaceholder', 'Search festivals by name, city, state, or keywords (e.g. Durga Puja, Camel Fair, Hornbill)...')}
            className="w-full pl-9 pr-24 py-2 text-xs rounded-xl border border-neutral-border dark:border-darkmode-border bg-neutral-card dark:bg-darkmode-card text-neutral-text-primary dark:text-darkmode-text-primary focus:outline-none focus:ring-1 focus:ring-action"
          />
          <button
            onClick={fetchCatalog}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-neutral-bg-secondary dark:bg-darkmode-elevated text-neutral-text-primary text-[11px] font-bold hover:bg-action hover:text-white transition-all"
          >
            {t('events.searchBtn', 'Search')}
          </button>
        </div>
      </div>

      {/* 4. Main Event View (Grid or Map) */}
      {viewMode === "map" ? (
        <div className="h-[550px] w-full rounded-2xl overflow-hidden border border-neutral-border dark:border-darkmode-border relative shadow-sm">
          <MapContainer
            center={[22.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {events.map((ev) => {
              const colorInfo = getCategoryColor(ev.event_category);
              return (
                <CircleMarker
                  key={ev.event_id}
                  center={[parseFloat(ev.latitude), parseFloat(ev.longitude)]}
                  radius={ev.importance_tier === "TIER 1" ? 9 : 6}
                  pathOptions={{
                    color: colorInfo.hex,
                    fillColor: colorInfo.hex,
                    fillOpacity: 0.85,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 max-w-[200px]">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800">
                        {ev.event_category}
                      </span>
                      <h4 className="text-xs font-bold">{translateText(ev.event_name, i18n.language)}</h4>
                      <p className="text-[11px] text-neutral-600">{translateText(ev.city, i18n.language)}, {translateText(ev.state, i18n.language)}</p>
                      <p className="text-[10px] text-neutral-500 font-semibold">{ev.event_start_date} to {ev.event_end_date}</p>
                      <button
                        onClick={() => openEventDetails(ev.event_id)}
                        className="w-full mt-2 py-1 px-2 text-[10px] font-bold bg-teal-600 text-white rounded"
                      >
                        Explore Event
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm p-2.5 rounded-xl border border-neutral-border dark:border-darkmode-border shadow-md text-[10px] space-y-1">
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{t('events.festivalCategories', 'Festival Categories')}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]"></span> {t('events.cultural', 'Cultural')}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> {t('events.harvestSeasonal', 'Harvest / Seasonal')}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> {t('events.melaLivestock', 'Mela / Traditional Fair')}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> {t('events.heritageHistorical', 'Heritage / Historical')}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span> {t('events.musicTribal', 'Music & Indigenous Arts')}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingEvents ? (
            <div className="col-span-full py-16 text-center text-neutral-muted">
              <span className="animate-pulse">{t('events.loadingFestivals', "Loading India's cultural festival catalog...")}</span>
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-muted space-y-2">
              <p className="text-sm font-semibold">{t('events.noFestivalsMatch', 'No festivals match your current filter selection.')}</p>
              <button
                onClick={() => { setSelectedMonth("All"); setSelectedCategory("All"); setSearchQuery(""); setUnescoOnly(false); }}
                className="text-xs text-action font-bold hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            events.map((event) => {
              const color = getCategoryColor(event.event_category);

              return (
                <div
                  key={event.event_id}
                  className="ts-card overflow-hidden flex flex-col justify-between border border-neutral-border dark:border-darkmode-border hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Hero Thumbnail */}
                    <div className="relative h-48 w-full overflow-hidden bg-neutral-bg-secondary dark:bg-darkmode-elevated">
                      <img
                        src={event.hero_image_url || "https://images.unsplash.com/photo-1598890777032-bde835ba27c2"}
                        alt={event.event_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${color.bg}`}>
                          {getLocalizedCategory(event.event_category, i18n.language)}
                        </span>
                        {event.unesco_status && event.unesco_status.includes("UNESCO") && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/90 text-white backdrop-blur-md">
                            UNESCO
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand" />
                          <span>{translateText(event.city, i18n.language)}, {translateText(event.state, i18n.language)}</span>
                        </div>
                        <h3 className="text-base font-bold leading-snug line-clamp-1 text-white drop-shadow-sm">
                          {translateText(event.event_name, i18n.language)}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-text-primary dark:text-darkmode-text-primary font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-action" />
                          {event.event_start_date} to {event.event_end_date}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated text-neutral-muted">
                          {translateText(`${event.date_confidence} CONFIDENCE`, i18n.language)}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2 leading-relaxed">
                        {getLocalizedEventField(event.short_description || event.cultural_significance, i18n.language)}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-1.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border/50 text-neutral-text-sec dark:text-darkmode-text-secondary">
                          <span className="text-neutral-muted block text-[10px]">{t('events.crowdForecast', 'Crowd Volume')}</span>
                          <strong className="text-neutral-text-primary dark:text-darkmode-text-primary">{translateText(event.crowd_level || "Normal", i18n.language)}</strong>
                        </div>
                        <div className="p-1.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border/50 text-neutral-text-sec dark:text-darkmode-text-secondary">
                          <span className="text-neutral-muted block text-[10px]">Tier</span>
                          <strong className="text-neutral-text-primary dark:text-darkmode-text-primary">{translateText(event.importance_tier, i18n.language)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      onClick={() => openEventDetails(event.event_id)}
                      className="flex-1 py-2 px-3 rounded-lg border border-neutral-border dark:border-darkmode-border text-neutral-text-primary dark:text-darkmode-text-primary font-bold text-xs hover:bg-neutral-bg-secondary dark:hover:bg-darkmode-elevated transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('events.detailsAndStays', 'Details & Stays')}</span>
                    </button>
                    <button
                      onClick={() => handleBuildTripAroundEvent(event)}
                      className="py-2 px-3 rounded-lg bg-action hover:bg-action-hover text-white font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      title="Build My Trip Around This Event"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('events.planTrip', 'Plan Trip')}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Comprehensive Event Dossier Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-card dark:bg-darkmode-card border border-neutral-border dark:border-darkmode-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            {/* Modal Header / Hero */}
            <div className="relative h-56 w-full">
              <img
                src={activeModalEvent.hero_image_url || "https://images.unsplash.com/photo-1598890777032-bde835ba27c2"}
                alt={activeModalEvent.event_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              
              <button
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-action font-bold uppercase text-[10px]">
                    {getLocalizedCategory(activeModalEvent.event_category, i18n.language)}
                  </span>
                  {activeModalEvent.unesco_status && activeModalEvent.unesco_status.includes("UNESCO") && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 font-bold uppercase text-[10px]">
                      {activeModalEvent.unesco_status}
                    </span>
                  )}
                  <span className="text-neutral-300 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-brand" />
                    {translateText(activeModalEvent.venue || activeModalEvent.city, i18n.language)}, {translateText(activeModalEvent.state, i18n.language)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{translateText(activeModalEvent.event_name, i18n.language)}</h2>
                <p className="text-xs text-neutral-300 font-medium">{translateText(activeModalEvent.official_name, i18n.language)}</p>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-neutral-border dark:border-darkmode-border px-5 bg-neutral-bg-secondary/40 dark:bg-darkmode-elevated/40 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveTab("about")}
                className={`py-3 px-3 border-b-2 whitespace-nowrap ${activeTab === "about" ? "border-action text-action" : "border-transparent text-neutral-muted hover:text-neutral-text-primary"}`}
              >
                {t('events.tabOverview', 'Overview & Heritage')}
              </button>
              <button
                onClick={() => setActiveTab("experience")}
                className={`py-3 px-3 border-b-2 whitespace-nowrap ${activeTab === "experience" ? "border-action text-action" : "border-transparent text-neutral-muted hover:text-neutral-text-primary"}`}
              >
                {t('events.tabExperience', 'What to Experience')}
              </button>
              <button
                onClick={() => setActiveTab("advisory")}
                className={`py-3 px-3 border-b-2 whitespace-nowrap ${activeTab === "advisory" ? "border-action text-action" : "border-transparent text-neutral-muted hover:text-neutral-text-primary"}`}
              >
                {t('events.tabAdvisory', 'Crowd & Transit Advisory')}
              </button>
              <button
                onClick={() => setActiveTab("stays")}
                className={`py-3 px-3 border-b-2 whitespace-nowrap ${activeTab === "stays" ? "border-action text-action" : "border-transparent text-neutral-muted hover:text-neutral-text-primary"}`}
              >
                {t('events.tabStays', 'Nearby Stays')} ({activeModalEvent.nearby_stay_options?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("food")}
                className={`py-3 px-3 border-b-2 whitespace-nowrap ${activeTab === "food" ? "border-action text-action" : "border-transparent text-neutral-muted hover:text-neutral-text-primary"}`}
              >
                {t('events.tabFood', 'Eat Nearby')} ({activeModalEvent.nearby_food_options?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 space-y-6 text-xs text-neutral-text-primary dark:text-darkmode-text-primary">
              
              {activeTab === "about" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-1">{t('events.aboutFestival', 'About the Festival')}</h4>
                    <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                      {getLocalizedEventField(activeModalEvent.full_description || activeModalEvent.short_description, i18n.language, '', {
                        event_name: activeModalEvent.event_name,
                        city: activeModalEvent.city,
                        state: activeModalEvent.state,
                        event_category: activeModalEvent.event_category,
                        fieldType: 'description'
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border/60">
                      <h4 className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary mb-1">
                        🏛️ {t('events.historicalSig', 'Historical Significance')}
                      </h4>
                      <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed text-[11px]">
                        {getLocalizedEventField(activeModalEvent.historical_significance, i18n.language, "Not Available", {
                          event_name: activeModalEvent.event_name,
                          city: activeModalEvent.city,
                          state: activeModalEvent.state,
                          event_category: activeModalEvent.event_category,
                          fieldType: 'historical'
                        })}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border/60">
                      <h4 className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary mb-1">
                        🌺 {t('events.culturalSig', 'Cultural Importance')}
                      </h4>
                      <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed text-[11px]">
                        {getLocalizedEventField(activeModalEvent.cultural_significance, i18n.language, "Not Available", {
                          event_name: activeModalEvent.event_name,
                          city: activeModalEvent.city,
                          state: activeModalEvent.state,
                          event_category: activeModalEvent.event_category,
                          fieldType: 'cultural'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Multi-Year Dates */}
                  {activeModalEvent.occurrences && activeModalEvent.occurrences.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-2">
                        📅 {t('events.multiYear', 'Multi-Year Annual Calendar (2025–2028)')}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {activeModalEvent.occurrences.map((occ: any) => (
                          <div key={occ.occurrence_id} className="p-2.5 rounded-lg border border-neutral-border/60 dark:border-darkmode-border text-center">
                            <span className="block font-bold text-action text-xs">{occ.year}</span>
                            <span className="block text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary">{occ.start_date.slice(5)} to {occ.end_date.slice(5)}</span>
                            <span className="text-[10px] text-neutral-muted block">
                              {occ.date_status === 'Confirmed' ? t('events.confirmed', 'Confirmed') : (occ.date_status === 'Completed' ? t('events.completed', 'Completed') : t('events.projected', 'Projected'))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "experience" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-neutral-border dark:border-darkmode-border space-y-1">
                      <span className="font-bold text-action block text-xs">🎭 {t('events.activities', 'Major Activities & Performances')}</span>
                      <p className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                        {translateText(activeModalEvent.major_activities || "Folk dances, musical recitals, ceremonial processions, artisan exhibitions.", i18n.language)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-neutral-border dark:border-darkmode-border space-y-1">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block text-xs">🍛 {t('events.foodSpecialties', 'Traditional Food Specialties')}</span>
                      <p className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                        {translateText(activeModalEvent.local_food || "Authentic festive dishes prepared by community cooks and heritage stalls.", i18n.language)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-neutral-border dark:border-darkmode-border space-y-1">
                      <span className="font-bold text-blue-600 dark:text-blue-400 block text-xs">🎨 {t('events.crafts', 'Local Crafts & Artisans')}</span>
                      <p className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                        {translateText(activeModalEvent.local_crafts || "Indigenous handloom, terracotta pottery, brasswork, and tribal textiles.", i18n.language)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-neutral-border dark:border-darkmode-border space-y-1">
                      <span className="font-bold text-purple-600 dark:text-purple-400 block text-xs">🙏 {t('events.etiquette', 'Cultural Etiquette & Dress')}</span>
                      <p className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                        {translateText(activeModalEvent.cultural_etiquette || activeModalEvent.dress_code || "Modest attire respectful of sacred grounds. Photography allowed in designated areas.", i18n.language)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "advisory" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border/60">
                      <span className="text-[10px] text-neutral-muted block">{t('events.footfall', 'Expected Footfall')}</span>
                      <strong className="text-sm">{translateText(activeModalEvent.expected_footfall || "High", i18n.language)}</strong>
                      <p className="text-[11px] text-neutral-muted mt-1">{t('safety.source', 'Source')}: {translateText(activeModalEvent.footfall_source || "State Tourism Board", i18n.language)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border/60">
                      <span className="text-[10px] text-neutral-muted block">{t('events.crowdForecast', 'Crowd Density Forecast')}</span>
                      <strong className="text-sm">{translateText(activeModalEvent.crowd_level || "Congested", i18n.language)}</strong>
                      <p className="text-[11px] text-neutral-muted mt-1">{translateText("Special traffic corridors enforced", i18n.language)}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-border dark:border-darkmode-border space-y-2">
                    <h4 className="font-bold text-xs">{t('events.transitGuidance', 'Transit & Connectivity Guidance')}</h4>
                    <ul className="space-y-1.5 text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary">
                      <li><strong>Road: </strong>{translateText(activeModalEvent.road_advisory || activeModalEvent.transport_advisory, i18n.language)}</li>
                      <li><strong>Rail: </strong>{translateText(activeModalEvent.rail_advisory || `Nearest railhead is ${activeModalEvent.nearest_railway_station}`, i18n.language)}</li>
                      <li><strong>Airport: </strong>{translateText(activeModalEvent.airport_advisory || `Nearest airport is ${activeModalEvent.nearest_airport}`, i18n.language)}</li>
                      <li><strong>Public Transit: </strong>{translateText(activeModalEvent.public_transport || "Dedicated bus shuttles and auto-rickshaws operational throughout festive days.", i18n.language)}</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "stays" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs">{t('events.tabStays', 'Nearby Stays')} ({translateText(activeModalEvent.city, i18n.language)})</h4>
                    <span className="text-[11px] text-neutral-muted">{t('events.realVerifiedListings', 'Real Verified Listings')}</span>
                  </div>

                  {activeModalEvent.nearby_stay_options && activeModalEvent.nearby_stay_options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeModalEvent.nearby_stay_options.map((stay: any) => (
                        <div key={stay.business_id} className="p-3 rounded-xl border border-neutral-border dark:border-darkmode-border flex gap-3 items-start bg-neutral-card dark:bg-darkmode-card">
                          <Hotel className="w-5 h-5 text-action shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary line-clamp-1">{stay.business_name}</h5>
                              <span className="text-[10px] font-bold text-amber-500">★ {stay.rating || 4.2}</span>
                            </div>
                            <p className="text-[11px] text-neutral-text-sec line-clamp-1">{stay.full_address || `${stay.city}, ${stay.state}`}</p>
                            <div className="flex items-center justify-between text-[10px] text-neutral-muted pt-1">
                              <span>{translateText(stay.business_type, i18n.language)}</span>
                              <span className="font-bold text-action">{translateText(`${stay.distance_km} km to venue`, i18n.language)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-muted text-xs">{t('events.accommodationsFallback', { city: translateText(activeModalEvent.city, i18n.language) })}</p>
                  )}
                </div>
              )}

              {activeTab === "food" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs">{t('events.tabFood', 'Eat Nearby')} ({translateText(activeModalEvent.city, i18n.language)})</h4>
                    <span className="text-[11px] text-neutral-muted">{t('events.curatedDining', 'Curated Dining & Regional Cuisines')}</span>
                  </div>

                  {activeModalEvent.nearby_food_options && activeModalEvent.nearby_food_options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeModalEvent.nearby_food_options.map((food: any) => (
                        <div key={food.business_id} className="p-3 rounded-xl border border-neutral-border dark:border-darkmode-border flex gap-3 items-start bg-neutral-card dark:bg-darkmode-card">
                          <Utensils className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-neutral-text-primary dark:text-darkmode-text-primary line-clamp-1">{food.business_name}</h5>
                              <span className="text-[10px] font-bold text-amber-500">★ {food.rating || 4.3}</span>
                            </div>
                            <p className="text-[11px] text-neutral-text-sec line-clamp-1">{food.full_address || `${food.city}, ${food.state}`}</p>
                            <div className="flex items-center justify-between text-[10px] text-neutral-muted pt-1">
                              <span>{translateText(food.category_type || 'Regional Dining', i18n.language)}</span>
                              <span className="font-bold text-action">{translateText(`${food.distance_km} km to venue`, i18n.language)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-muted text-xs">{t('events.foodFallback', { venue: translateText(activeModalEvent.venue || activeModalEvent.city, i18n.language) })}</p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Sticky Footer CTA */}
            <div className="p-4 border-t border-neutral-border dark:border-darkmode-border bg-neutral-bg-secondary/70 dark:bg-darkmode-elevated/70 flex items-center justify-between gap-3">
              <div className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary">
                <span>{t('events.verifiedBy', { name: translateText(activeModalEvent.source_name || "Ministry of Tourism", i18n.language) })}</span>
                <span className="block text-[10px] text-neutral-muted">{t('events.lastAudit', 'Last audit')}: {activeModalEvent.last_verified || "2026-09"}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="py-2 px-3 text-xs font-semibold rounded-lg border border-neutral-border dark:border-darkmode-border hover:bg-neutral-card cursor-pointer"
                >
                  {t('events.close', 'Close')}
                </button>
                <button
                  onClick={() => {
                    const ev = activeModalEvent;
                    setActiveModalEvent(null);
                    handleBuildTripAroundEvent(ev);
                  }}
                  className="py-2 px-4 text-xs font-bold rounded-lg bg-action hover:bg-action-hover text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('events.buildTrip', 'Build My Trip Around This Event')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
