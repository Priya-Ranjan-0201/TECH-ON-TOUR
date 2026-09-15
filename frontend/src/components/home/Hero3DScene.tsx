import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Compass, MapPin, Star, Loader2, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function Hero3DScene() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [destinationQuery, setDestinationQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 300ms Debounced search
  useEffect(() => {
    const trimmed = destinationQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        console.log(`[SEARCH] query = "${trimmed}"`);
        const res = await axios.get(`/api/destinations/search?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.data?.success) {
          console.log(`[SEARCH] results = ${res.data.count}`);
          setSearchResults(res.data.results || []);
          setIsDropdownOpen(true);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        console.error('[SEARCH ERROR]', err);
        setSearchError('Search is temporarily unavailable. Please try again.');
        setIsDropdownOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destinationQuery]);

  const handleSelectDestination = (destId) => {
    console.log(`[DESTINATION CLICK] id = ${destId}`);
    setIsDropdownOpen(false);
    navigate(`/destination/${destId}`);
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    const destination = destinationQuery.trim();
    setIsDropdownOpen(false);
    if (destination) {
      navigate(`/explore?query=${encodeURIComponent(destination)}`);
    } else {
      navigate('/explore');
    }
  };

  const handleExploreAll = () => {
    setIsDropdownOpen(false);
    navigate('/explore', { state: { initialSearch: destinationQuery.trim() } });
  };

  return (
    <section className="theme1-hero-container relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center overflow-visible select-none">
      
      {/* Traditional Indian Architectural Jali Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-1"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(229, 169, 60, 0.18) 1px, transparent 1px), radial-gradient(circle at 0 0, rgba(229, 169, 60, 0.1) 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* Luminous Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-2"
        style={{
          background: 'radial-gradient(circle at center, rgba(34, 98, 73, 0.40) 0%, rgba(26, 78, 58, 0.65) 65%, rgba(18, 58, 42, 0.85) 100%)'
        }}
      />

      {/* Hero Content: Exactly 1 Input & 1 Primary Action Button */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6 w-full">
        
        {/* Clean Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
          {t('home.heroTitle', 'Where do you want to go?')}
        </h1>
        
        <p className="text-sm sm:text-base text-amber-100/90 max-w-xl mx-auto font-medium">
          {t('home.heroSubtitle', 'Personalized discovery and smart travel planning across 12,293 verified Indian destinations.')}
        </p>

        {/* The 1 Search Input + Dropdown Container */}
        <div ref={containerRef} className="relative max-w-2xl mx-auto text-left">
          <form 
            onSubmit={handlePlanSubmit}
            className="flex flex-col sm:flex-row items-center gap-2.5 bg-white/95 dark:bg-[#1C1A17]/95 p-2 rounded-2xl shadow-2xl border border-white/40 dark:border-neutral-700/80 backdrop-blur-md relative z-30"
          >
            <div className="flex-1 w-full flex items-center px-3">
              <Compass className="w-5 h-5 text-[#8C3618] dark:text-[#E5A93C] mr-2 shrink-0" />
              <input
                type="text"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                onFocus={() => {
                  if (destinationQuery.trim().length >= 2 && searchResults.length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder={t('home.searchPlaceholder', 'e.g. Manali, Punjab, mountain, temple, beach, Bastar...')}
                className="w-full py-3 bg-transparent text-sm sm:text-base text-neutral-900 dark:text-white outline-none placeholder-neutral-400 font-medium"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin mr-2 shrink-0" />
              )}
              {destinationQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setDestinationQuery('');
                    setSearchResults([]);
                    setIsDropdownOpen(false);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--ts-accent-600, #C97227) 0%, var(--ts-accent-700, #964A13) 100%)',
                boxShadow: '0 8px 20px -4px rgba(201, 114, 39, 0.4)'
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{t('home.startPlanning', 'Plan Your Journey')}</span>
            </button>
          </form>

          {/* Search Dropdown / Autocomplete Results */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1C1A17] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50 animate-fadeIn">
              {isSearching && searchResults.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>{t('home.searching', 'Searching 12,293 verified destinations...')}</span>
                </div>
              ) : searchError ? (
                <div className="p-5 text-center text-sm text-red-500 dark:text-red-400">
                  {searchError}
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    {t('home.matchingDestinations', 'Destinations matching')} "{destinationQuery}" ({searchResults.length})
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                    {searchResults.map((dest) => (
                      <div
                        key={dest.id}
                        onClick={() => handleSelectDestination(dest.id)}
                        className="p-3.5 hover:bg-amber-50/60 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors flex items-center gap-3.5"
                      >
                        <img
                          src={dest.image || dest.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=160&q=80'}
                          alt={dest.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-neutral-200 dark:bg-neutral-800"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement; target.onerror = null; target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=160&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                              {dest.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold shrink-0">
                              {dest.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{dest.state}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{dest.rating || 4.5}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 text-center">
                    <button
                      type="button"
                      onClick={handleExploreAll}
                      className="text-xs font-bold text-[#8C3618] dark:text-[#E5A93C] hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>{t('home.exploreAllMatching', 'Explore all matching destinations in catalog')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm space-y-1">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">
                    No destinations found for "{destinationQuery}"
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Try searching by state (e.g. Punjab, Kerala), activity (e.g. trekking, beach), or category (e.g. temple, nature).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </section>
  );
}
