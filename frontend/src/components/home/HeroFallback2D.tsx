import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  TreePine, 
  Home, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import axios from 'axios';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function HeroFallback2D() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredAlternative, setFeaturedAlternative] = useState(null);

  useEffect(() => {
    // Fetch distinct states from backend
    const fetchStates = async () => {
      try {
        const res = await axios.get('/api/destinations/states', { timeout: 3000 });
        if (res.data && res.data.states) {
          setStates(res.data.states);
        }
      } catch (err) {
        // Fallback common states if backend disconnected
        setStates([
          { state: 'Himachal Pradesh', destination_count: 245 },
          { state: 'Kerala', destination_count: 231 },
          { state: 'Karnataka', destination_count: 312 },
          { state: 'Chhattisgarh', destination_count: 140 },
          { state: 'Rajasthan', destination_count: 280 },
          { state: 'Uttarakhand', destination_count: 195 },
        ]);
      }
    };

    // Fetch anti-overtourism alternative
    const fetchAlternative = async () => {
      try {
        const res = await axios.get('/api/overtourism/pairs', { timeout: 3000 });
        if (res.data && (Array.isArray(res.data) ? res.data.length > 0 : res.data.circuits?.length > 0)) {
          const circuits = Array.isArray(res.data) ? res.data : res.data.circuits;
          setFeaturedAlternative(circuits[0]);
        }
      } catch (err) {
        setFeaturedAlternative({
          popular_name: "Manali",
          alternative_name: "Tirthan Valley",
          crowd_reduction_pct: 65,
          reason: "UNESCO Great Himalayan National Park gateway, pristine trout rivers, uncommercialized wooden homestays."
        });
      }
    };

    fetchStates();
    fetchAlternative();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedState) params.append('state', selectedState);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 text-ivory pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-900">
      {/* Decorative Traditional Motif Backdrop */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E5A93C_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-400/20 text-accent-50 border border-accent-400/40 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span>Smart India Hackathon 2026 Grand Finale Prototype</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-ivory leading-tight">
              Discover India <br className="hidden sm:inline" />
              <span className="text-accent-400 underline decoration-accent-400/50 decoration-wavy decoration-2">
                Beyond the Crowd.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-ivory/85 max-w-2xl leading-relaxed font-light">
              Zero-commission rural tribal homestays (PM-JUGA), certified local tour guides, and anti-overtourism circuits grounded in <strong>12,293 verified Indian heritage destinations</strong>.
            </p>

            {/* 🔍 Master Search Pill Form */}
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-ivory/95 p-2 rounded-ts shadow-2xl border border-accent-400/30 text-neutral-900 max-w-2xl backdrop-blur-md"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* State Select */}
                <div className="sm:col-span-4 flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-ts border border-neutral-200">
                  <MapPin className="w-4 h-4 text-primary-800 shrink-0" />
                  <select 
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">All States & UTs (36)</option>
                    {states.map((s) => (
                      <option key={s.state} value={s.state}>
                        {s.state} ({s.destination_count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Text Input */}
                <div className="sm:col-span-5 flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-ts border border-neutral-200">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Forts, waterfalls, temples..."
                    className="w-full bg-transparent text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none font-medium"
                  />
                </div>

                {/* Submit Action */}
                <div className="sm:col-span-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full h-full text-xs font-bold shadow-md bg-primary-800 hover:bg-primary-900"
                    icon={Compass}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Quick Category Filter Pills */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-200/60 overflow-x-auto text-xs px-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Filter:</span>
                {[
                  { id: 'all', label: 'All Catalog' },
                  { id: 'attraction', label: 'Monuments & Heritage' },
                  { id: 'homestay', label: 'PM-JUGA Tribal Stays' },
                  { id: 'hotel', label: 'Verified Hotels' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-primary-800 text-ivory'
                        : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </form>

            {/* Metric Counters Strip */}
            <div className="grid grid-cols-3 gap-4 pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="border-l-2 border-accent-400 pl-3">
                <div className="text-xl font-bold font-display text-accent-400">12,293</div>
                <div className="text-[11px] text-ivory/80">Verified POIs Grounded</div>
              </div>
              <div className="border-l-2 border-secondary-400 pl-3">
                <div className="text-xl font-bold font-display text-secondary-400">0%</div>
                <div className="text-[11px] text-ivory/80">Platform Commission</div>
              </div>
              <div className="border-l-2 border-accent-400 pl-3">
                <div className="text-xl font-bold font-display text-accent-400">&lt; 25ms</div>
                <div className="text-[11px] text-ivory/80">Spatial Search Speed</div>
              </div>
            </div>
          </div>

          {/* Right Hero Cards & Spotlight Showcase */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Featured Anti-Overtourism Spotlight Card */}
            {featuredAlternative && (
              <div className="card-ts bg-ivory text-neutral-900 p-5 shadow-2xl border-l-4 border-l-secondary-800 relative group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge-gem-ts inline-flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Anti-Overtourism Circuit</span>
                  </span>
                  <span className="text-[11px] font-bold text-secondary-800 bg-secondary-50 px-2 py-0.5 rounded-full border border-secondary-800/20">
                    -{featuredAlternative.crowd_reduction_pct}% Congestion
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-1">
                  <span>Instead of crowded <strong>{featuredAlternative.popular_name}</strong></span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary-800" />
                  <span className="text-primary-800 font-bold">Discover {featuredAlternative.alternative_name}</span>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed mt-2">
                  {featuredAlternative.reason}
                </p>

                <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary-800">Himachal Heritage Circuit</span>
                  <button 
                    onClick={() => navigate('/explore?search=Tirthan')}
                    className="text-primary-800 hover:text-primary-900 inline-flex items-center gap-1 font-bold"
                  >
                    View Alternates <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PM-JUGA Tribal Homestay Card Spotlight */}
            <div className="card-ts bg-ivory text-neutral-900 p-5 shadow-2xl border-l-4 border-l-primary-800 relative group hover:scale-[1.01] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="badge-verified-ts inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PM-JUGA Tribal Homestay</span>
                </span>
                <span className="text-[11px] font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-800/20">
                  94/100 Sanitation Score
                </span>
              </div>

              <h3 className="text-sm font-bold text-primary-900">
                Bastar Dhokra Craft & Forest Homestay
              </h3>
              <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                Live with indigenous Maria artisans in Chhattisgarh. Hands-on bell-metal craft casting, organic forest meals, and zero-commission direct bookings.
              </p>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-primary-800">₹1,250</span>
                  <span className="text-[10px] text-neutral-500"> / night (0% commission)</span>
                </div>
                <button 
                  onClick={() => navigate('/host')}
                  className="btn-primary-ts text-xs py-1.5 px-3"
                >
                  Explore Host Hub
                </button>
              </div>
            </div>

            {/* Travel Twin AI Banner Pill */}
            <div 
              onClick={() => navigate('/plan')}
              className="p-4 rounded-ts bg-accent-400 text-neutral-900 flex items-center justify-between shadow-lg cursor-pointer hover:bg-accent-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-accent-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Generate AI Travel Twin Plan</h4>
                  <p className="text-[11px] text-neutral-800">Weather-adaptive, multi-day itinerary in &lt; 3.5s</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-900" />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
