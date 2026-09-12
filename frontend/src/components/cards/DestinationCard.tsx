import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, MapPin, Clock, Bookmark, Compass, Navigation, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getLocalizedHiddenGemReason } from '../../utils/summaryTranslator';
import axios from 'axios';

export default function DestinationCard({ item, isCinematic = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedPlaces, toggleSavePlace, currentUser, language } = useApp();
  const [isSaved, setIsSaved] = useState(() => {
    const destId = item.destination?.id || item.id;
    return savedPlaces ? savedPlaces.some(p => p.id === destId || p.id === `dest-${destId}`) : false;
  });

  const dest = item.destination || item;
  const destId = dest.id;
  const distanceKm = item.distance_km ?? (dest.distanceKm || null);
  const driveTimeMin = item.drive_time_min ?? (distanceKm ? Math.max(5, Math.round(distanceKm * 1.5)) : null);
  const defaultReason = dest.isHiddenGem ? t('common.curatedHiddenGem', 'Curated peaceful hidden gem') : t('common.verifiedHeritage', 'Verified national heritage destination');
  const rawReason = item.hook || dest.hook || item.reason || dest.recommendationReason;
  let reason = rawReason || defaultReason;
  if (!rawReason || rawReason === "Curated peaceful hidden gem" || (typeof rawReason === 'string' && rawReason.toLowerCase().includes("peaceful hidden gem"))) {
    reason = t('common.curatedHiddenGem', 'Curated peaceful hidden gem');
  } else if (rawReason === "Verified national heritage destination" || (typeof rawReason === 'string' && rawReason.toLowerCase().includes("national heritage"))) {
    reason = t('common.verifiedHeritage', 'Verified national heritage destination');
  } else if (dest.isHiddenGem) {
    reason = getLocalizedHiddenGemReason(dest, language);
  }

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    setIsSaved(prev => !prev);
    if (toggleSavePlace) {
      toggleSavePlace(dest);
    }
    // Record feedback signal to ML engine
    try {
      await axios.post('/api/recommendations/feedback', {
        user_id: currentUser?.id || 'usr-901',
        destination_id: typeof destId === 'number' ? destId : parseInt(String(destId).replace(/\D/g, '') || '1', 10),
        action_type: isSaved ? 'unsave' : 'save'
      });
    } catch {
      // Safe non-blocking feedback
    }
  };

  const handleCardClick = async () => {
    // Record click interaction signal
    try {
      await axios.post('/api/recommendations/feedback', {
        user_id: currentUser?.id || 'usr-901',
        destination_id: typeof destId === 'number' ? destId : parseInt(String(destId).replace(/\D/g, '') || '1', 10),
        action_type: 'click'
      });
    } catch {
      // Safe non-blocking
    }
    navigate(`/destination/${destId}`);
  };

  const handleQuickMap = (e) => {
    e.stopPropagation();
    navigate('/map', { state: { centerDest: dest } });
  };

  const isPlaceholder = dest.image_source === 'placeholder' || Boolean(dest.needs_manual_photo) || (!dest.image_url && !dest.image);
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-neutral-card dark:bg-darkmode-surface rounded-ts-lg border border-neutral-border dark:border-darkmode-border overflow-hidden transition-all duration-300 hover:shadow-ts-hover hover:-translate-y-1 cursor-pointer select-none h-[380px] ${
        isCinematic ? 'w-80 sm:w-96 flex-shrink-0' : 'w-72 sm:w-80 flex-shrink-0'
      }`}
    >
      {/* Media & Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-100 dark:bg-darkmode-elevated shrink-0">
        {isPlaceholder || imageError ? (
          <div className="w-full h-full bg-gradient-to-br from-[#1E5C43] via-[#2A805E] to-[#19523B] flex flex-col items-center justify-center p-4 text-center text-white relative">
            <Compass className="w-8 h-8 text-emerald-200/50 mb-1" />
            <span className="text-xs font-bold font-display text-white/95 line-clamp-1">{dest.name}</span>
            <span className="text-[10px] text-emerald-100/70 font-medium">{dest.state}</span>
            <span className="mt-2 text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 font-mono">
              Theme 1 Grounded
            </span>
          </div>
        ) : (
          <img 
            src={dest.image_url || dest.image} 
            alt={dest.name} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Source Attribution Tag */}
        {!isPlaceholder && !imageError && (dest.image_source === 'wikipedia' || dest.image_source === 'wikimedia_commons') && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-xs text-white/80 font-mono">
              {dest.image_source === 'wikipedia' ? 'Wiki' : 'Commons'}
            </span>
          </div>
        )}

        {/* Top Badges & Actions (Bookmark action only - secondary badges moved to detail page) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleQuickMap}
            title="View on Map"
            aria-label="View on map"
            className="p-1.5 rounded-full backdrop-blur-md bg-black/30 hover:bg-black/50 text-white transition-colors shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSaveToggle}
            aria-label={isSaved ? "Saved" : "Save destination"}
            className={`p-1.5 rounded-full backdrop-blur-md transition-colors shadow-sm ${
              isSaved 
                ? 'bg-accent-600 text-white' 
                : 'bg-black/30 hover:bg-black/50 text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Image Overlay: EXACTLY 2 DECISION-RELEVANT BADGES (Distance + Rating) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/95 font-medium">
          {/* Badge 1: Proximity */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 text-[11px]">
            <MapPin className="w-3 h-3 text-accent-400" />
            <span>{distanceKm !== null && distanceKm !== undefined ? `${Math.round(distanceKm)} km` : (dest.region || dest.state)}</span>
          </div>

          {/* Badge 2: Rating */}
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 text-xs">
            <Star className="w-3 h-3 text-accent-400 fill-accent-400" />
            <span className="font-semibold">{Number(dest.rating || 4.5).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3 className="text-sm font-display font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-primary-800 dark:group-hover:text-accent-400 transition-colors line-clamp-1">
            {dest.name}
          </h3>
          <p className="text-xs text-neutral-text-secondary dark:text-darkmode-text-secondary line-clamp-1 mt-0.5">
            {dest.state}
          </p>

          {/* Explainable Recommendation Reason (One Clean Supporting Signal) */}
          <div className="mt-2 py-1 px-2 rounded-ts-sm bg-primary-50/70 dark:bg-darkmode-elevated/60 text-primary-900 dark:text-primary-100 text-[11px] flex items-center gap-1.5 line-clamp-1">
            <span className="text-accent-600 font-bold">“</span>
            <span className="italic truncate font-medium">{reason}</span>
            <span className="text-accent-600 font-bold">”</span>
          </div>
        </div>

        {/* Text Link Action (Not a competing filled button) */}
        <div className="pt-2 border-t border-neutral-border/60 dark:border-darkmode-border/60 flex items-center justify-between">
          <span className="text-xs font-bold text-primary-800 dark:text-accent-400 group-hover:underline flex items-center gap-1">
            <span>{t('common.viewDetails', 'View details')}</span>
            <Compass className="w-3.5 h-3.5" />
          </span>
          {dest.price_per_night && (
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              ₹{dest.price_per_night}/{t('common.night', 'night')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
