import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Filter, 
  Map, 
  Grid, 
  ChevronLeft, 
  ChevronRight,
  Compass,
  Sparkles,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import DestinationCard from '../components/explore/DestinationCard';
import DestinationDetailModal from '../components/explore/DestinationDetailModal';
import BookingModal from '../components/explore/BookingModal';
import CatalogMap from '../components/explore/CatalogMap';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function ExploreView() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State initialized from URL query params
  const [state, setState] = useState(searchParams.get('state') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('price_range') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  
  // UI State
  const [viewMode, setViewMode] = useState('split'); // 'grid' or 'split'
  const [statesList, setStatesList] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [queryLatency, setQueryLatency] = useState(0);

  // Modals State
  const [selectedDestinationId, setSelectedDestinationId] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);

  // 1. Fetch States List
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/destinations/states');
        if (res.data && res.data.states) {
          setStatesList(res.data.states);
        }
      } catch (err) {
        console.warn('Failed to load states list', err);
      }
    };
    fetchStates();
  }, []);

  // 2. Fetch Filtered Destinations
  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const params = new URLSearchParams();
      if (state && state !== 'all') params.append('state', state);
      if (category && category !== 'all') params.append('category', category);
      if (priceRange && priceRange !== 'all') params.append('price_range', priceRange);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page.toString());
      params.append('limit', '18');

      const res = await axios.get(`http://localhost:8000/api/destinations?${params.toString()}`);
      setDestinations(res.data.results || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
      setQueryLatency(Math.round(performance.now() - startTime));
    } catch (err) {
      console.error('Failed to fetch destinations', err);
      setDestinations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [state, category, priceRange, search, page]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  // Handle Filter Change
  const handleStateChange = (e) => {
    setState(e.target.value);
    setPage(1);
  };

  const handleCategoryClick = (cat) => {
    setCategory(cat === category ? '' : cat);
    setPage(1);
  };

  const handlePriceClick = (price) => {
    setPriceRange(price === priceRange ? '' : price);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDestinations();
  };

  const handleResetFilters = () => {
    setState('');
    setCategory('');
    setPriceRange('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {/* Search & Filter Header Strip */}
      <div className="bg-ivory border-b border-neutral-200 sticky top-16 z-40 shadow-sm py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Keyword Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search among 12,293 temples, forts, waterfalls, homestays..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-800"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                Search
              </Button>
            </form>

            {/* View Mode Toggle & Benchmark Badge */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-ts border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-secondary-800" />
                <span>Latency: <strong>{queryLatency}ms</strong></span>
              </div>

              <div className="flex items-center bg-neutral-200 p-0.5 rounded-ts border border-neutral-300">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-ts text-xs font-semibold flex items-center gap-1 transition-colors ${
                    viewMode === 'grid' ? 'bg-ivory text-primary-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`p-1.5 rounded-ts text-xs font-semibold flex items-center gap-1 transition-colors ${
                    viewMode === 'split' ? 'bg-ivory text-primary-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Map & Grid Split View"
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Split Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Filter Bar: State Select, Category Pills, Price Tiers */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200/60 text-xs">
            {/* State Select Dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-ts border border-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-primary-800 shrink-0" />
              <select
                value={state}
                onChange={handleStateChange}
                className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="">All States & UTs (36)</option>
                {statesList.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state} ({s.destination_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: '', label: 'All Categories' },
                { id: 'attraction', label: 'Attractions' },
                { id: 'homestay', label: 'Homestays' },
                { id: 'hotel', label: 'Hotels' },
                { id: 'restaurant', label: 'Restaurants' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryClick(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                    category === c.id
                      ? 'bg-primary-800 text-ivory'
                      : 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Price Tiers */}
            <div className="hidden lg:flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-semibold text-neutral-500">Tier:</span>
              {['budget', 'mid', 'luxury'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriceClick(p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize transition-all ${
                    priceRange === p
                      ? 'bg-accent-400 text-neutral-900 shadow-sm'
                      : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Reset Filter Button */}
            {(state || category || priceRange || search) && (
              <button
                onClick={handleResetFilters}
                className="ml-auto text-[11px] text-primary-800 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Explorer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col">
        
        {/* Results Counter Bar */}
        <div className="flex items-center justify-between mb-4 text-xs text-neutral-600">
          <div>
            Showing <strong className="text-primary-900">{destinations.length}</strong> of{' '}
            <strong className="text-primary-900">{total.toLocaleString()}</strong> verified places
            {state && <span> in <strong className="text-primary-800">{state}</strong></span>}
            {category && <span> ({category})</span>}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Page {page} of {totalPages}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <LoadingSpinner message="Filtering 12,293 destinations from Tech-On-Tour knowledge graph..." />
          </div>
        ) : destinations.length === 0 ? (
          <EmptyState
            title="No destinations match your criteria"
            description={`We couldn't find any destination in ${state || 'India'} matching "${search}". Try selecting a different state or category.`}
            onAction={handleResetFilters}
          />
        ) : viewMode === 'split' ? (
          /* 🗺️ Split View: Cards Left (7 cols), Leaflet Map Right (5 cols) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Cards Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destinations.map((dest) => (
                  <DestinationCard
                    key={dest.id}
                    destination={dest}
                    onViewDetails={() => setSelectedDestinationId(dest.id)}
                    onDirectBook={() => setBookingTarget(dest)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    icon={ChevronLeft}
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-neutral-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    icon={ChevronRight}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Sticky Interactive Map Column */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-44 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 px-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-800" />
                    <span>Spatial Map View</span>
                  </span>
                  <span className="text-[11px] text-secondary-800 font-bold">
                    {destinations.length} Pins Rendered
                  </span>
                </div>
                <CatalogMap
                  places={destinations}
                  onSelectPlace={(p) => setSelectedDestinationId(p.id)}
                  height="640px"
                />
              </div>
            </div>
          </div>
        ) : (
          /* 📱 Full Grid View */
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  onViewDetails={() => setSelectedDestinationId(dest.id)}
                  onDirectBook={() => setBookingTarget(dest)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-neutral-200 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Previous Page
                </Button>
                <span className="font-semibold text-neutral-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  icon={ChevronRight}
                >
                  Next Page
                </Button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Destination Detail Modal */}
      {selectedDestinationId && (
        <DestinationDetailModal
          destinationId={selectedDestinationId}
          onClose={() => setSelectedDestinationId(null)}
          onDirectBook={(dest) => {
            setSelectedDestinationId(null);
            setBookingTarget(dest);
          }}
        />
      )}

      {/* Zero-Commission Direct Booking Checkout Modal */}
      {bookingTarget && (
        <BookingModal
          destination={bookingTarget}
          onClose={() => setBookingTarget(null)}
        />
      )}
    </div>
  );
}
