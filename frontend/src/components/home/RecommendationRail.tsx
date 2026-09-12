import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DestinationCard from '../cards/DestinationCard';

export default function RecommendationRail({ rail, isCinematic = false }) {
  const { t, i18n } = useTranslation();
  const scrollRef = useRef(null);

  const famousItems = (rail?.items || []).filter(item => {
    const d = item.destination || item;
    const img = d.image_url || d.image;
    return img && typeof img === 'string' && img.trim() !== '';
  });

  if (!rail || famousItems.length === 0) {
    return null;
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Map rail ID or keyword to localized translation
  const getLocalizedTitle = () => {
    const id = rail.id;
    if (id && i18n.exists(`rails.${id}.title`)) {
      return t(`rails.${id}.title`);
    }
    const lower = (rail.title || '').toLowerCase();
    if (lower.includes('calling')) return t('rails.recommended_for_you.title');
    if (lower.includes('season')) return t('rails.season.title');
    if (id === 'near_you' || lower === 'near your current location') return t('rails.near_you.title');
    if (lower.includes('because') || lower.includes('cultural')) return t('rails.because_you_liked.title');

    if (lower.includes('hidden')) return t('rails.hidden_gems.title');
    if (lower.includes('today')) return t('rails.perfect_for_today.title');
    if (lower.includes('trending') || lower.includes('travelers')) return t('rails.popular_nearby.title');
    return rail.title;

  };

  const getLocalizedSubtitle = () => {
    const id = rail.id;
    if (id && i18n.exists(`rails.${id}.subtitle`)) {
      return t(`rails.${id}.subtitle`);
    }
    const lower = (rail.subtitle || '').toLowerCase();
    if (lower.includes('personalized') || lower.includes('calling')) return t('rails.recommended_for_you.subtitle');
    if (lower.includes('flora') || lower.includes('prime')) return t('rails.season.subtitle');
    if (lower.includes('gps') || lower.includes('drive time')) return t('rails.near_you.subtitle');
    if (lower.includes('knowledge graph') || lower.includes('heritage')) return t('rails.because_you_liked.subtitle');
    if (lower.includes('crowd density') || lower.includes('60%')) return t('rails.hidden_gems.subtitle');
    if (lower.includes('weather-aware') || lower.includes('time-of-day')) return t('rails.perfect_for_today.subtitle');
    if (lower.includes('highest booked') || lower.includes('month')) return t('rails.popular_nearby.subtitle');
    return rail.subtitle;
  };

  return (
    <section className="py-6 border-b border-neutral-border/40 dark:border-darkmode-border/40 last:border-b-0">
      {/* Rail Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-neutral-text-primary dark:text-darkmode-text-primary tracking-tight">
                {getLocalizedTitle()}
              </h2>
            </div>
            {rail.subtitle && (
              <p className="text-xs sm:text-sm text-neutral-text-secondary dark:text-darkmode-text-secondary mt-0.5">
                {getLocalizedSubtitle()}
              </p>
            )}
          </div>

          {/* Desktop Chevron Navigation Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-2 rounded-full border border-neutral-border dark:border-darkmode-border bg-neutral-card dark:bg-darkmode-surface hover:bg-neutral-bg dark:hover:bg-darkmode-elevated text-neutral-text-primary dark:text-darkmode-text-primary shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-2 rounded-full border border-neutral-border dark:border-darkmode-border bg-neutral-card dark:bg-darkmode-surface hover:bg-neutral-bg dark:hover:bg-darkmode-elevated text-neutral-text-primary dark:text-darkmode-text-primary shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrolling Track - exactly 4 cards visible at once on desktop */}
      <div className="relative max-w-7xl mx-auto">
        <div 
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 py-2 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {famousItems.map((item, idx) => (
            <div 
              key={item.destination?.id || idx} 
              className="w-[280px] sm:w-[calc(25%-15px)] min-w-[260px] flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <DestinationCard item={item} isCinematic={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
