import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  SlidersHorizontal, 
  ArrowRight, 
  Compass, 
  Star, 
  Clock, 
  RefreshCw,
  X,
  TrendingUp,
  Tag
} from 'lucide-react';

export default function SearchPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [statesList, setStatesList] = useState([]);
  
  const popularKeywords = [
    'Manali', 'Amer Fort', 'Goa Beaches', 'Hampi Temples', 
    'Kerala Backwaters', 'Tirthan Valley', 'Kaziranga', 'Varanasi Ghats'
  ];

  const categories = [
    { id: 'all', label: 'All Results' },
    { id: 'attraction', label: 'Attractions & Forts' },
    { id: 'nature', label: 'Nature & Wildlife' },
    { id: 'heritage', label: 'Living Heritage' },
    { id: 'adventure', label: 'Adventure' },
  ];

  // Fetch states list for filter dropdown
  useEffect(() => {
    axios.get('/api/destinations/states')
      .then(res => {
        if (res.data && res.data.states) {
          setStatesList(res.data.states.map(s => s.state));
        }
      })
      .catch(() => {});
  }, []);

  const performSearch = async (searchTerm, category = categoryFilter, state = selectedState) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = [`q=${encodeURIComponent(searchTerm)}`, 'limit=24'];
      if (category && category !== 'all') params.push(`category=${encodeURIComponent(category)}`);
      if (state && state !== 'all') params.push(`state=${encodeURIComponent(state)}`);

      let url = `/api/destinations/search?${params.join('&')}`;
      const res = await axios.get(url);
      let items = (res.data.results || []).map(i => ({
        ...i,
        image: i.image || i.image_url || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
        image_url: i.image_url || i.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'
      }));
      if (category !== 'all') {
        items = items.filter(i => (i.category || '').toLowerCase().includes(category.toLowerCase()));
      }
      if (state !== 'all') {
        items = items.filter(i => (i.state || '').toLowerCase() === state.toLowerCase());
      }
      setResults(items);
      setSearchParams({ q: searchTerm });
    } catch (err: any) {
      setError('Search service encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleKeywordClick = (kw) => {
    setQuery(kw);
    performSearch(kw);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-darkmode-elevated text-brand text-xs font-bold border border-brand/20">
          <Search className="w-3.5 h-3.5" />
          <span>Curated National Heritage & Famous Landmarks</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          Search India's Famous Destinations
        </h1>
        <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary">
          Verified iconic monuments, UNESCO world heritage sites, and famous landmarks curated with high-definition photography.
        </p>
      </div>

      {/* Primary Query Bar */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleFormSubmit} className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border-2 border-brand/40 bg-neutral-card dark:bg-darkmode-surface">
          <div className="pl-4 text-brand">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by destination, state, district, or landmark (e.g. Manali, Amer Fort, Kerala)..."
            className="w-full px-4 py-4 text-sm font-semibold bg-transparent text-neutral-text-primary dark:text-darkmode-text-primary placeholder:text-neutral-muted outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="p-2 text-neutral-muted hover:text-neutral-text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-brand !rounded-none !py-4 !px-6 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Search</span>}
          </button>
        </form>

        {/* Quick Keyword Pills */}
        <div className="flex items-center gap-2 flex-wrap mt-3 text-xs text-neutral-muted">
          <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-brand" /> Popular:
          </span>
          {popularKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => handleKeywordClick(kw)}
              className="px-2.5 py-1 rounded-full bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-[11px] font-semibold text-neutral-text-sec hover:text-brand hover:border-brand transition-colors cursor-pointer"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-border dark:border-darkmode-border">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                performSearch(query, cat.id, selectedState);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-neutral-text-sec hover:text-neutral-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* State Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs font-bold text-neutral-muted uppercase">State:</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              performSearch(query, categoryFilter, e.target.value);
            }}
            className="p-2 rounded-lg bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="all">All States & UTs</option>
            {statesList.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ts-card overflow-hidden space-y-3 p-4">
              <div className="w-full h-40 bg-neutral-200 dark:bg-darkmode-border rounded-lg" />
              <div className="w-3/4 h-4 bg-neutral-200 dark:bg-darkmode-border rounded" />
              <div className="w-1/2 h-3 bg-neutral-200 dark:bg-darkmode-border rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="ts-card p-10 text-center space-y-3 max-w-md mx-auto border-rose-300">
          <p className="text-rose-600 font-bold text-sm">{error}</p>
          <button
            onClick={() => performSearch(query)}
            className="btn-brand text-xs font-bold py-2 px-4 cursor-pointer"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && query && results.length === 0 && (
        <div className="ts-card p-12 text-center space-y-3 max-w-lg mx-auto">
          <Compass className="w-12 h-12 text-brand mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            No destinations found for "{query}"
          </h3>
          <p className="text-xs text-neutral-muted">
            Try checking for spelling differences, searching for a state name like "Himachal" or "Rajasthan", or select one of the popular destinations above.
          </p>
        </div>
      )}

      {/* Search Results Grid */}
      {!loading && !error && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-muted font-semibold">
            <span>Found {results.length} destinations matching "{query}"</span>
            <span>Sorted by Query Relevance & Star Rating</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/destination/${item.id}`)}
                className="ts-card overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
              >
                <div className="relative h-44 overflow-hidden bg-neutral-200">
                  <img
                    src={item.image || item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement; target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{item.rating || 4.5}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                    {item.category || 'Attraction'}
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-brand shrink-0" />
                      <span>{item.state}</span>
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-neutral-text-sec dark:text-darkmode-text-secondary line-clamp-2 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-border flex items-center justify-between text-xs font-bold text-brand">
                    <span>View Destination</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
