import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Sparkles, X, ArrowRight, Compass, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import axios from 'axios';

export default function SearchCommandPalette() {
  const { isSearchPaletteOpen, setIsSearchPaletteOpen, destinations, homestays } = useApp();
  const [query, setQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchPaletteOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchPaletteOpen]);

  useEffect(() => {
    if (isSearchPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setApiResults([]);
    }
  }, [isSearchPaletteOpen]);

  // 300ms debounced live API search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/destinations/search?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.data?.results) {
          setApiResults(res.data.results);
        } else {
          setApiResults([]);
        }
      } catch (err: any) {
        console.warn('API search failed in Command Palette, using local fallback:', err);
        const q = trimmed.toLowerCase();
        const fallback = destinations.filter(d => 
          d.name.toLowerCase().includes(q) || 
          d.state.toLowerCase().includes(q) || 
          d.category.toLowerCase().includes(q)
        );
        setApiResults(fallback);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, destinations]);

  if (!isSearchPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredHomestays = homestays.filter(s => {
    return !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.state.toLowerCase().includes(q);
  });

  const samplePrompts = [
    "Manali",
    "Punjab",
    "Kerala",
    "Rajasthan",
    "mountain",
    "beach",
    "temple"
  ];

  const handleSelectDestination = (id) => {
    setIsSearchPaletteOpen(false);
    navigate(`/destination/${id}`);
  };

  const handleRunAiPlan = (destinationName) => {
    setIsSearchPaletteOpen(false);
    navigate('/plan', { state: { prefilledDestination: destinationName } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Search Input Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          {loading ? (
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 12,293 destinations: 'Manali', 'Punjab', 'mountain', 'beach'..."
            className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white text-sm sm:text-base placeholder-neutral-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchPaletteOpen(false)}
            className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        {!query && (
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Popular Search Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Destinations Results */}
          {apiResults.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Destinations & Heritage Sites ({apiResults.length})
              </h4>
              <div className="space-y-1.5">
                {apiResults.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDestination(d.id)}
                    className="p-3 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 flex items-center justify-between cursor-pointer group transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={d.image_url || d.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80'} 
                        alt={d.name} 
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement; target.onerror = null; target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
                            {d.name}
                          </span>
                          {d.rating && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0">
                              ★ {d.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{d.state} • {d.category || 'Attraction'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRunAiPlan(d.name); }}
                        className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Plan</span>
                      </button>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homestays Matches */}
          {filteredHomestays.length > 0 && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Verified Local Homestays ({filteredHomestays.length})
              </h4>
              <div className="space-y-1.5">
                {filteredHomestays.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { setIsSearchPaletteOpen(false); navigate('/stays'); }}
                    className="p-3 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.image} alt={s.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">
                          {s.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {s.location} • ₹{s.pricePerNight}/night • {s.verificationBadge}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:underline">
                      View Stay →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && query && apiResults.length === 0 && filteredHomestays.length === 0 && (
            <div className="py-8 text-center text-neutral-400">
              <Compass className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                No destinations found for "{query}"
              </p>
              <p className="text-xs mt-1 text-neutral-500">
                Try searching by state (e.g., "Himachal", "Punjab", "Kerala") or category (e.g., "mountain", "temple", "beach").
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Tip: Click any destination to view verified details and crowd metrics</span>
          <span className="hidden sm:inline">12,293 Grounded Destinations</span>
        </div>

      </div>
    </div>
  );
}
