import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Filter, 
  Map as MapIcon, 
  Grid, 
  Compass, 
  Sparkles, 
  Leaf, 
  ShieldCheck, 
  Sun, 
  Users, 
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  Eye,
  Check,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { getLocalizedDestinationSummary, getLocalizedCategory } from '../utils/summaryTranslator';
import axios from 'axios';

export default function ExploreView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { destinations: fallbackDestinations, language } = useApp();

  const initialCat = searchParams.get('cat') || searchParams.get('category') || location.state?.category || 'All';
  const initialSearch = searchParams.get('query') || searchParams.get('q') || searchParams.get('search') || location.state?.initialSearch || '';
  const initialState = searchParams.get('state') || 'All';

  // Filter States (Persisted in URL)
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const q = searchParams.get('query') || searchParams.get('q') || searchParams.get('search');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
      setPage(1);
    }
  }, [searchParams]);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [selectedCrowd, setSelectedCrowd] = useState('All');
  const [onlyHiddenGems, setOnlyHiddenGems] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyAccessible, setOnlyAccessible] = useState(false);
  const [onlySustainable, setOnlySustainable] = useState(false);

  // DB Data State
  const [destList, setDestList] = useState([]);
  const [totalCount, setTotalCount] = useState(12293);
  const [hourlyToken, setHourlyToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statesList, setStatesList] = useState([
    'All', 'Himachal Pradesh', 'Chhattisgarh', 'Rajasthan', 'Kerala', 
    'Arunachal Pradesh', 'Karnataka', 'Uttarakhand', 'Punjab', 'Goa', 
    'Maharashtra', 'Tamil Nadu', 'Assam', 'Madhya Pradesh'
  ]);

  // UI view mode
  const [viewMode, setViewMode] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef(null);

  // 13 Official Categories
  const categories = [
    'All', 'Nature', 'Heritage', 'Culture', 'Rural', 'Food', 
    'Spiritual', 'Adventure', 'Wellness', 'Beaches', 'Mountains', 
    'Shopping', 'Festivals', 'Wildlife'
  ];

  // Fetch all available states from backend
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get('/api/destinations/states');
        if (res.data?.states) {
          const names = ['All', ...res.data.states.map(s => s.state).filter(Boolean)];
          setStatesList(names);
        }
      } catch {
        // keep default states
      }
    };
    fetchStates();
  }, []);

  // Debounced fetch across 12,293 destinations
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const trimmed = searchQuery.trim();
        let url = '';
        if (trimmed) {
          // Use search endpoint with state and category query parameters
          const searchParams = [`q=${encodeURIComponent(trimmed)}`, 'limit=100'];
          if (selectedCategory !== 'All') searchParams.push(`category=${encodeURIComponent(selectedCategory)}`);
          if (selectedState !== 'All') searchParams.push(`state=${encodeURIComponent(selectedState)}`);
          if (onlyHiddenGems) searchParams.push('is_hidden_gem=true');

          url = `/api/destinations/search?${searchParams.join('&')}`;
          const res = await axios.get(url);
          if (res.data?.results) {
            const list = (res.data.results || []).map((d: any) => ({
              ...d,
              image: d.image || d.image_url || null,
              image_url: d.image_url || d.image || null
            }));
            setDestList(list);
            setTotalCount(res.data.count || list.length);
            if (res.data.hourly_token) {
              setHourlyToken(res.data.hourly_token);
            }
          }
        } else {
          // Use paginated list endpoint with filters
          const params = [`page=${page}`, 'limit=24'];
          if (selectedCategory !== 'All') params.push(`category=${encodeURIComponent(selectedCategory)}`);
          if (selectedState !== 'All') params.push(`state=${encodeURIComponent(selectedState)}`);
          if (onlyHiddenGems) params.push('is_hidden_gem=true');

          url = `/api/destinations?${params.join('&')}`;
          const res = await axios.get(url);
          if (res.data?.results) {
            setDestList(res.data.results || []);
            setTotalCount(res.data.total ?? (res.data.results || []).length);
            if (res.data.hourly_token) {
              setHourlyToken(res.data.hourly_token);
            }
          }
        }
      } catch (err: any) {
        console.warn('Backend destinations fetch failed, using fallback:', err);
        // Fallback to local data strictly with photos
        let filtered = (fallbackDestinations || []).filter(d => (d.image_url || d.image) && (d.image_url || d.image).trim() !== '');
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q));
        }
        if (selectedCategory !== 'All') {
          filtered = filtered.filter(d => (d.category || '').toLowerCase().includes(selectedCategory.toLowerCase()));
        }
        if (selectedState !== 'All') {
          filtered = filtered.filter(d => (d.state || '').toLowerCase() === selectedState.toLowerCase());
        }
        setDestList(filtered);
        setTotalCount(filtered.length);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCategory, selectedState, onlyHiddenGems, page, fallbackDestinations]);

  // Keep URL search params in sync so refreshing retains the current place and filters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedState && selectedState !== 'All') params.state = selectedState;
    if (selectedCategory && selectedCategory !== 'All') params.cat = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedState, selectedCategory]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedState('All');
    setSelectedBudget('All');
    setSelectedCrowd('All');
    setOnlyHiddenGems(false);
    setOnlyVerified(false);
    setOnlyAccessible(false);
    setOnlySustainable(false);
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-[#8C3618] dark:text-[#E5A93C] font-bold text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Intelligent Discovery Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            {t('explore.title', 'Explore Indian Destinations')}
          </h1>
          <p className="text-sm text-neutral-text-secondary dark:text-darkmode-text-secondary mt-1">
            {t('explore.subtitle', 'Browse 12,293 verified destinations with real-time crowd metrics, accessibility flags, and anti-overtourism routes.')}
          </p>
        </div>

        {/* View switcher & Filters Toggle (Mobile) */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="md:hidden btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters ({selectedCategory !== 'All' ? 1 : 0})</span>
          </button>
          
          <div className="flex items-center p-1 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-ts-xs transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-neutral-card dark:bg-darkmode-surface text-brand shadow-sm' 
                  : 'text-neutral-muted hover:text-neutral-text-primary'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/map')}
              className="p-1.5 rounded-ts-xs text-neutral-muted hover:text-neutral-text-primary transition-colors"
              title="Interactive GIS Map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Filter Sidebar */}
        <div className={`lg:col-span-3 space-y-6 bg-white dark:bg-[#1C1A17] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm ${
          filtersOpen ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Catalog Filters</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('explore.searchPlaceholder', 'Search destinations by name, state, or theme...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">
              Travel Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">
              State / Territory
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none cursor-pointer"
            >
              {statesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyHiddenGems}
                onChange={(e) => setOnlyHiddenGems(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
              />
              <span className="font-bold text-emerald-700 dark:text-emerald-400">🌿 {t('explore.antiOvertourism', 'Anti-Overtourism Hidden Gems')}</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={resetFilters}
              className="w-full py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t('explore.clearFilters', 'Clear All Filters')}
            </button>
          </div>
        </div>

        {/* Right Destination Results Grid */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
            <div className="flex flex-wrap items-center gap-3">
              <span>{t('explore.showing', 'Showing')} <strong>{destList.length}</strong> {t('explore.of', 'of')} <strong>{totalCount.toLocaleString()}</strong> {t('explore.verifiedDestinations', 'verified Indian destinations')}</span>
              {hourlyToken && (
                <div 
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs"
                  title={`Hourly Token Active: ${hourlyToken}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hourly Token: <strong className="font-mono text-[10px]">{hourlyToken}</strong></span>
                </div>
              )}
            </div>
            {loading && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('explore.updatingCatalog', 'Updating catalog...')}</span>
              </span>
            )}
          </div>

          {loading && destList.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-80 bg-neutral-100 dark:bg-neutral-800 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : destList.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1A17] p-12 text-center space-y-4 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              <Compass className="w-12 h-12 text-neutral-400 mx-auto" />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {t('explore.noMatch', 'No destinations matched these specific filters')}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {t('explore.noMatchSub', 'Try clearing your search query or selecting "All" categories to discover more destinations.')}
              </p>
              <button 
                onClick={resetFilters} 
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 cursor-pointer"
              >
                {t('explore.resetFilters', 'Reset All Filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {destList.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/destination/${d.id}`)}
                  className="bg-white dark:bg-[#1C1A17] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden group cursor-pointer flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      {d.image_source === 'placeholder' || d.needs_manual_photo || (!d.image_url && !d.image) ? (
                        <div className="w-full h-full bg-gradient-to-br from-[#1E5C43] via-[#2A805E] to-[#19523B] flex flex-col items-center justify-center p-4 text-center text-white relative">
                          <Compass className="w-8 h-8 text-emerald-200/50 mb-1" />
                          <span className="text-xs font-bold font-display text-white/95 line-clamp-1">{d.name}</span>
                          <span className="text-[10px] text-emerald-100/70 font-medium">{d.state}</span>
                          <span className="mt-2 text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 font-mono">
                            Theme 1 Grounded
                          </span>
                        </div>
                      ) : (
                        <img
                          src={d.image_url || d.image}
                          alt={d.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // Replace broken/unreachable image with Theme 1 solid-color placeholder
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const placeholderDiv = document.createElement('div');
                              placeholderDiv.className = 'w-full h-full bg-gradient-to-br from-[#1E5C43] via-[#2A805E] to-[#19523B] flex flex-col items-center justify-center p-4 text-center text-white';
                              const nameSpan = document.createElement('span');
                              nameSpan.className = 'text-xs font-bold font-display text-white/95';
                              nameSpan.textContent = d.name;
                              const stateSpan = document.createElement('span');
                              stateSpan.className = 'text-[10px] text-emerald-100/70 font-medium';
                              stateSpan.textContent = d.state;
                              const badgeSpan = document.createElement('span');
                              badgeSpan.className = 'mt-2 text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 font-mono';
                              badgeSpan.textContent = 'Theme 1 Grounded';
                              placeholderDiv.replaceChildren(nameSpan, stateSpan, badgeSpan);
                              parent.appendChild(placeholderDiv);
                            }
                          }}
                        />
                      )}
                      
                      {/* Attribution Tag */}
                      {(d.image_source === 'wikipedia' || d.image_source === 'wikimedia_commons') && (
                        <div className="absolute top-3 right-3 z-10 pointer-events-none">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white/80 font-mono">
                            {d.image_source === 'wikipedia' ? 'Wiki' : 'Commons'}
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-black/60 text-white backdrop-blur-md">
                          {getLocalizedCategory(d.category, language)}
                        </span>
                      </div>

                      {d.is_hidden_gem && (
                        <div className="absolute bottom-3 left-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-emerald-600 text-white backdrop-blur-md">
                            🌿 {t('detail.hiddenGem', 'Verified Hidden Gem')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                          <MapPin className="w-3.5 h-3.5" />
                          {d.state}
                        </span>
                        {d.rating && (
                          <span className="font-bold text-amber-600 flex items-center gap-1">
                            ★ {d.rating}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {d.name}
                      </h3>

                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                        {getLocalizedDestinationSummary(d, language)}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs bg-neutral-50/50 dark:bg-neutral-900/30">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-neutral-400">{t('explore.estDaily', 'Est. Daily:')} </span>
                        <strong className="text-neutral-900 dark:text-white font-bold">
                          ₹{d.average_budget || d.costAvgDay || 2500}
                        </strong>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.safety_score ? Math.round(d.safety_score * 100) : 94}/100 {t('explore.safe', 'Safe')}</span>
                      </span>
                    </div>

                    <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>{t('common.viewDetails', 'View Details')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
