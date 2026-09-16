import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sliders,
  CheckCircle2,
  Building,
  Car,
  Wifi,
  Utensils,
  ShieldAlert,
  Sparkles,
  Search,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MapPin,
  Award,
  Clock,
  RotateCcw,
  Zap
} from 'lucide-react';

export interface DistrictOption {
  destination_id: string;
  district: string;
  state: string;
  rank?: number;
  tourism_potential?: number;
  investment_priority?: number;
  scores?: {
    tourism_potential: number;
    tourism_opportunity: number;
    investment_priority: number;
    readiness_score?: number;
    infrastructure_readiness?: number;
  };
  factor_scores?: {
    attraction_strength: number;
    tourism_demand: number | null;
    cultural_natural_significance: number;
    growth_opportunity: number;
    accessibility_potential: number;
    seasonality: number;
  };
  readiness_factors?: {
    accommodation: number;
    transport: number;
    connectivity: number;
    food_hospitality: number;
    medical_safety: number;
    other_amenities: number;
  };
}

interface ReadinessInputViewProps {
  initialDistricts?: DistrictOption[] | any[];
  onRankingsUpdated?: () => void;
  initialSelectedDistrictId?: string;
}

const READINESS_FACTORS = [
  { key: 'accommodation', label: 'Accommodation', weight: '25%', numWeight: 0.25, icon: Building, color: 'bg-[#2F80C0]', hexColor: '#2F80C0', desc: 'Hotels, homestays, licensed rooms, inventory quality' },
  { key: 'transport', label: 'Transport & Accessibility', weight: '20%', numWeight: 0.20, icon: Car, color: 'bg-teal-500', hexColor: '#14B8A6', desc: 'All-weather roads, last-mile transit, highway/rail links' },
  { key: 'connectivity', label: 'Connectivity', weight: '15%', numWeight: 0.15, icon: Wifi, color: 'bg-cyan-500', hexColor: '#06B6D4', desc: 'High-speed 4G/5G coverage, public Wi-Fi, digital payments' },
  { key: 'food_hospitality', label: 'Food & Hospitality', weight: '15%', numWeight: 0.15, icon: Utensils, color: 'bg-amber-500', hexColor: '#F59E0B', desc: 'FSSAI hygienic eateries, dining density, guide hospitality' },
  { key: 'medical_safety', label: 'Medical & Safety', weight: '15%', numWeight: 0.15, icon: ShieldAlert, color: 'bg-rose-500', hexColor: '#F43F5E', desc: 'PHCs, emergency response, tourist police, disaster readiness' },
  { key: 'other_amenities', label: 'Other Amenities', weight: '10%', numWeight: 0.10, icon: Sparkles, color: 'bg-purple-500', hexColor: '#A855F7', desc: 'Public restrooms, drinking water, waste management, parking' },
] as const;

type ReadinessKey = (typeof READINESS_FACTORS)[number]['key'];

export default function ReadinessInputView({
  initialDistricts,
  onRankingsUpdated,
  initialSelectedDistrictId,
}: ReadinessInputViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [districts, setDistricts] = useState<DistrictOption[]>(initialDistricts || []);
  const [districtsLoading, setDistrictsLoading] = useState(!initialDistricts || initialDistricts.length === 0);
  const [districtSearch, setDistrictSearch] = useState('');

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    initialSelectedDistrictId || searchParams.get('destination_id') || 'CT0055' // Default to Samastipur or URL query
  );

  const [readinessValues, setReadinessValues] = useState<Record<ReadinessKey, number>>({
    accommodation: 61.4,
    transport: 47.0,
    connectivity: 42.5,
    food_hospitality: 62.7,
    medical_safety: 83.0,
    other_amenities: 51.2,
  });

  const [factorScores, setFactorScores] = useState({
    attraction_strength: 59.2,
    tourism_demand: 72.2,
    cultural_natural_significance: 68.2,
    growth_opportunity: 78.2,
    accessibility_potential: 43.2,
    seasonality: 83.5,
  });

  const [computedPriority, setComputedPriority] = useState<number>(68.5);
  const [currentRank, setCurrentRank] = useState<number>(491);
  const [tourismPotential, setTourismPotential] = useState<number>(55.0);
  const [hourlyToken, setHourlyToken] = useState<string>(() => {
    const d = new Date();
    const YYYY = d.getUTCFullYear();
    const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const DD = String(d.getUTCDate()).padStart(2, '0');
    const HH = String(d.getUTCHours()).padStart(2, '0');
    return `tok_hourly_${YYYY}${MM}${DD}_${HH}00`;
  });

  const [isPersisted, setIsPersisted] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Synchronize initialDistricts prop if parent loads them asynchronously
  useEffect(() => {
    if (initialDistricts && initialDistricts.length > 0) {
      setDistricts(initialDistricts);
      setDistrictsLoading(false);
      if (!selectedDistrictId) {
        setSelectedDistrictId(initialDistricts[0].destination_id);
      }
    }
  }, [initialDistricts]);

  // Synchronize target district ID if changed via URL params or parent prop
  useEffect(() => {
    const fromUrl = searchParams.get('destination_id');
    const target = initialSelectedDistrictId || fromUrl;
    if (target && target !== selectedDistrictId) {
      setSelectedDistrictId(target);
    }
  }, [searchParams, initialSelectedDistrictId]);

  // Fetch districts list if not provided by parent
  useEffect(() => {
    if (initialDistricts && initialDistricts.length > 0) return;

    async function loadDistricts() {
      setDistrictsLoading(true);
      try {
        // Ensure auth header is present
        if (!axios.defaults.headers.common['Authorization']) {
          const saved = localStorage.getItem('travelsathi_token');
          if (saved) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
          } else {
            const authRes = await axios.post('/api/auth/switch-token', { role: 'gov' });
            if (authRes.data?.token) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${authRes.data.token}`;
              localStorage.setItem('travelsathi_token', authRes.data.token);
            }
          }
        }

        const res = await axios.get('/api/government/tourism/rankings?limit=508');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDistricts(res.data);
          // If no selected district, default to Samastipur (CT0055) or first district
          const samastipur = res.data.find((d: any) => d.district?.toLowerCase() === 'samastipur');
          if (samastipur && !searchParams.get('destination_id')) {
            setSelectedDistrictId(samastipur.destination_id);
          } else if (!selectedDistrictId) {
            setSelectedDistrictId(res.data[0].destination_id);
          }
        }
      } catch (e) {
        console.warn('Fallback: loading via /api/gov/rankings:', e);
        try {
          const fallbackRes = await axios.get('/api/gov/rankings?limit=508');
          if (Array.isArray(fallbackRes.data)) {
            setDistricts(fallbackRes.data);
          }
        } catch (err) {
          console.error('Failed to load district rankings:', err);
        }
      } finally {
        setDistrictsLoading(false);
      }
    }

    loadDistricts();
  }, [initialDistricts]);

  // Find active district metadata
  const selectedDistrictInfo = useMemo(() => {
    return districts.find((d) => d.destination_id === selectedDistrictId);
  }, [districts, selectedDistrictId]);

  // Load district's potential factor scores and persisted readiness values
  useEffect(() => {
    if (!selectedDistrictId) return;

    if (selectedDistrictInfo) {
      if (selectedDistrictInfo.rank) setCurrentRank(selectedDistrictInfo.rank);
      if (selectedDistrictInfo.scores?.investment_priority) {
        setComputedPriority(selectedDistrictInfo.scores.investment_priority);
      }
      if (selectedDistrictInfo.scores?.tourism_potential) {
        setTourismPotential(selectedDistrictInfo.scores.tourism_potential);
      }
      if (selectedDistrictInfo.factor_scores) {
        setFactorScores({
          attraction_strength: selectedDistrictInfo.factor_scores.attraction_strength ?? 50,
          tourism_demand: selectedDistrictInfo.factor_scores.tourism_demand ?? selectedDistrictInfo.scores?.tourism_opportunity ?? 50,
          cultural_natural_significance: selectedDistrictInfo.factor_scores.cultural_natural_significance ?? 50,
          growth_opportunity: selectedDistrictInfo.factor_scores.growth_opportunity ?? 50,
          accessibility_potential: selectedDistrictInfo.factor_scores.accessibility_potential ?? 50,
          seasonality: selectedDistrictInfo.factor_scores.seasonality ?? 50,
        });
      }
    }

    async function loadReadinessForDistrict() {
      setLoadingValues(true);
      try {
        const res = await axios.get(`/api/dmo/readiness-input/${selectedDistrictId}`);
        if (res.data?.inputs) {
          setReadinessValues({
            accommodation: Math.round((res.data.inputs.accommodation ?? 50) * 10) / 10,
            transport: Math.round((res.data.inputs.transport ?? 50) * 10) / 10,
            connectivity: Math.round((res.data.inputs.connectivity ?? 50) * 10) / 10,
            food_hospitality: Math.round((res.data.inputs.food_hospitality ?? 50) * 10) / 10,
            medical_safety: Math.round((res.data.inputs.medical_safety ?? 50) * 10) / 10,
            other_amenities: Math.round((res.data.inputs.other_amenities ?? 50) * 10) / 10,
          });
          setIsPersisted(Boolean(res.data.is_persisted));
        }
      } catch (e) {
        console.warn('Failed to load readiness inputs:', e);
      } finally {
        setLoadingValues(false);
      }
    }

    loadReadinessForDistrict();
    setSearchParams({ destination_id: selectedDistrictId }, { replace: true });
  }, [selectedDistrictId, selectedDistrictInfo]);

  // Real-time calculation of weighted readiness score
  const computedReadinessScore = useMemo(() => {
    const score =
      0.25 * readinessValues.accommodation +
      0.20 * readinessValues.transport +
      0.15 * readinessValues.connectivity +
      0.15 * readinessValues.food_hospitality +
      0.15 * readinessValues.medical_safety +
      0.10 * readinessValues.other_amenities;
    return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
  }, [readinessValues]);

  const badgeTier =
    computedReadinessScore >= 70 ? 'High' : computedReadinessScore >= 45 ? 'Medium' : 'Low';

  const badgeColor =
    badgeTier === 'High'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
      : badgeTier === 'Medium'
      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300';

  // Search filter across districts
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return districts;
    const q = districtSearch.toLowerCase().trim();
    return districts.filter(
      (d) =>
        d.district?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q) ||
        d.state?.toLowerCase().includes(q) ||
        d.destination_id?.toLowerCase().includes(q)
    );
  }, [districts, districtSearch]);

  const handleFieldChange = (field: ReadinessKey, value: number) => {
    const clamped = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
    setReadinessValues((prev) => ({ ...prev, [field]: clamped }));
  };

  // Preview priority score as user moves sliders
  const calculatePriorityPreview = useCallback(async () => {
    try {
      const payload = {
        destination_id: selectedDistrictId,
        accommodation: readinessValues.accommodation,
        transport: readinessValues.transport,
        connectivity: readinessValues.connectivity,
        food_hospitality: readinessValues.food_hospitality,
        medical_safety: readinessValues.medical_safety,
        other_amenities: readinessValues.other_amenities,
      };
      const res = await axios.post('/api/dmo/calculate-priority', payload);
      if (res.data?.computed_priority_score) {
        setComputedPriority(res.data.computed_priority_score);
      }
      if (res.data?.hourly_token) {
        setHourlyToken(res.data.hourly_token);
      }
      if (res.data?.potential_score) {
        setTourismPotential(res.data.potential_score);
      }
    } catch (e) {
      // Fallback local heuristic
      const heuristic = Math.round((tourismPotential * 0.70 + computedReadinessScore * 0.30) * 10) / 10;
      setComputedPriority(heuristic);
    }
  }, [selectedDistrictId, readinessValues, tourismPotential, computedReadinessScore]);

  // Recalculate preview on readiness change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePriorityPreview();
    }, 250);
    return () => clearTimeout(timer);
  }, [calculatePriorityPreview]);

  // Submit and retrain ML model
  const handleSubmitAndRetrain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDistrictId) return;

    setSubmitting(true);
    setToast(null);

    try {
      const payload = {
        destination_id: selectedDistrictId,
        accommodation: readinessValues.accommodation,
        transport: readinessValues.transport,
        connectivity: readinessValues.connectivity,
        food_hospitality: readinessValues.food_hospitality,
        medical_safety: readinessValues.medical_safety,
        other_amenities: readinessValues.other_amenities,
        updated_by: 'gov_authority_session',
      };

      const res = await axios.post('/api/dmo/readiness-input', payload);
      if (res.data?.success) {
        setIsPersisted(true);
        if (res.data.computed_priority_score) {
          setComputedPriority(res.data.computed_priority_score);
        }
        if (res.data.national_rank) {
          setCurrentRank(res.data.national_rank);
        }
        if (res.data.hourly_token) {
          setHourlyToken(res.data.hourly_token);
        }

        setToast({
          message: `Ground data persisted & Priority Model retrained for ${selectedDistrictInfo?.district || selectedDistrictId}! Updated Priority: ${res.data.computed_priority_score ?? computedPriority}/100 [${res.data.hourly_token || hourlyToken}].`,
          type: 'success',
        });

        // Notify parent to refresh rankings cache
        if (onRankingsUpdated) {
          onRankingsUpdated();
        }
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.detail || 'Failed to retrain priority model.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const potentialGap = Math.round((tourismPotential - computedReadinessScore) * 10) / 10;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#121E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#EFF9F8] text-[#087F8C] border border-[#087F8C]/20">
              Gov / DMO Authority Panel
            </span>
            <span className="text-xs text-neutral-400 font-mono">Module 4 • Dual-Pillar Telemetry</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#087F8C]" />
              {hourlyToken}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#102A2E] dark:text-white">
            District Readiness Input &amp; ML Compute
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl">
            Input verified infrastructure &amp; readiness metrics across 6 statutory dimensions (0–100 each).
            Persisted inputs dynamically feed into the retrained priority ranking model.
          </p>
        </div>

        <button
          onClick={() => navigate('/gov/tourism-intelligence?tab=rankings')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EFF9F8] dark:bg-[#0A2624] text-[#087F8C] hover:bg-[#087F8C] hover:text-white border border-[#087F8C]/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>View 508 District Rankings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer ml-3">✕</button>
        </div>
      )}

      {/* Main Grid: Control Deck (Left) & Side-by-Side Dual-Pillar Factor Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: DISTRICT SELECTOR + LIVE SCORES DECK                         */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          
          {/* 1. Target District Selector Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E3] dark:border-neutral-800">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#087F8C]" />
                Target District
              </label>
              <span className="text-[10px] font-mono text-neutral-400 font-bold">
                {districts.length > 0 ? `${districts.length} Districts` : 'Loading...'}
              </span>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-1">
              {['Samastipur', 'Varanasi', 'Manali', 'Jaipur', 'Hampi', 'Leh'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setDistrictSearch(name);
                    const match =
                      districts.find((d) => d.city?.toLowerCase() === name.toLowerCase()) ||
                      districts.find((d) => d.district?.toLowerCase() === name.toLowerCase());
                    if (match) setSelectedDistrictId(match.destination_id);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F7F6] dark:bg-neutral-800 text-[#087F8C] hover:bg-[#087F8C] hover:text-white transition-colors cursor-pointer border border-[#087F8C]/15"
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={districtSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setDistrictSearch(val);
                  if (val.trim()) {
                    const q = val.toLowerCase().trim();
                    const match =
                      districts.find((d) => d.city?.toLowerCase() === q) ||
                      districts.find((d) => d.district?.toLowerCase() === q) ||
                      districts.find((d) => d.city?.toLowerCase().includes(q)) ||
                      districts.find((d) => d.district?.toLowerCase().includes(q));
                    if (match) setSelectedDistrictId(match.destination_id);
                  }
                }}
                placeholder="Search city, district or state (e.g. Samastipur)..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAF9] dark:bg-neutral-900 border border-[#DCE5E3] dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#087F8C] text-[#102A2E] dark:text-white"
              />
            </div>

            {/* Dropdown Selector */}
            <div>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                disabled={districtsLoading}
                className="w-full py-2.5 px-3 text-xs font-semibold bg-white dark:bg-neutral-900 border border-[#DCE5E3] dark:border-neutral-700 rounded-xl focus:outline-none focus:border-[#087F8C] text-[#102A2E] dark:text-white cursor-pointer shadow-2xs"
              >
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map((d) => {
                    const isCityDiff = d.city && d.city.toLowerCase() !== d.district.toLowerCase();
                    const label = isCityDiff ? `${d.city} (${d.district})` : d.district;
                    return (
                      <option key={d.destination_id} value={d.destination_id}>
                        {label}, {d.state} {d.rank ? `• Rank #${d.rank}` : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>
                    {districtsLoading ? 'Loading 508 districts...' : 'No matching districts found'}
                  </option>
                )}
              </select>
            </div>

            {/* Selected District Snapshot */}
            {selectedDistrictInfo && (
              <div className="p-3 bg-[#EFF9F8] dark:bg-[#0E2926] rounded-xl border border-[#087F8C]/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#102A2E] dark:text-white">
                    {selectedDistrictInfo.city && selectedDistrictInfo.city.toLowerCase() !== selectedDistrictInfo.district.toLowerCase()
                      ? `${selectedDistrictInfo.city} (${selectedDistrictInfo.district})`
                      : selectedDistrictInfo.district}
                  </span>
                  <span className="font-mono text-[#087F8C] font-bold text-xs">
                    National Rank #{currentRank}
                  </span>
                </div>
                <p className="text-neutral-500 text-[11px]">
                  {selectedDistrictInfo.city && selectedDistrictInfo.city.toLowerCase() !== selectedDistrictInfo.district.toLowerCase()
                    ? `${selectedDistrictInfo.district}, ${selectedDistrictInfo.state}`
                    : selectedDistrictInfo.state}
                </p>
                <div className="flex justify-between pt-1 border-t border-[#087F8C]/15 text-[11px]">
                  <span>Underlying Potential:</span>
                  <span className="font-bold text-[#087F8C]">{tourismPotential}/100</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Persisted Status:</span>
                  <span className={`font-bold ${isPersisted ? 'text-emerald-600' : 'text-neutral-400'}`}>
                    {isPersisted ? 'Verified Ground Data Saved' : 'Default Telemetry Baseline'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Live Readiness Score Card (Matching Photo 1) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E3] dark:border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#087F8C]" />
                Live Readiness Score
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                {badgeTier}
              </span>
            </div>

            <div className="text-center py-2 space-y-1">
              <div className="text-4xl font-extrabold font-display text-[#102A2E] dark:text-white">
                {computedReadinessScore}
                <span className="text-base text-neutral-400 font-normal"> / 100</span>
              </div>
              <p className="text-xs text-neutral-500">
                Composite weighted formula across all 6 readiness dimensions
              </p>
            </div>

            {/* Weight Contribution Breakdown */}
            <div className="space-y-1.5 text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
              {READINESS_FACTORS.map((f) => (
                <div key={f.key} className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{f.label} ({f.weight}):</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {(readinessValues[f.key] * f.numWeight).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Live ML Priority Model Output Card */}
          <div className="p-5 rounded-2xl bg-[#0F2220] border border-[#087F8C]/40 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#087F8C] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Retrained ML Priority Score
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#087F8C]/20 text-emerald-300 font-bold border border-[#087F8C]/40">
                7 Features Active
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-extrabold font-display text-white">
                  {computedPriority}
                </span>
                <span className="text-xs text-neutral-400"> / 100</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Projected Rank</span>
                <span className="text-sm font-mono font-extrabold text-emerald-400">
                  #{currentRank} of 508
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#087F8C]/20 flex justify-between items-center text-xs">
              <span className="text-neutral-300">Infrastructure Gap:</span>
              <span className={`font-mono font-bold ${potentialGap > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {potentialGap > 0 ? `+${potentialGap} pts (Deficit)` : `${potentialGap} pts (Surplus)`}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: DUAL-PILLAR SIDE-BY-SIDE CARDS (MATCHING PHOTO 2)           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-2 space-y-4">
          
          {loadingValues && (
            <div className="py-2 px-4 rounded-xl bg-[#EFF9F8] dark:bg-[#0A2624] border border-[#087F8C]/20 flex items-center justify-center gap-2 text-xs text-[#087F8C]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synchronizing district baseline telemetry...</span>
            </div>
          )}

          {/* TWO-COLUMN GRID MATCHING PHOTO 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* --------------------------------------------------------------------- */}
            {/* CARD 1 (LEFT): 6 POTENTIAL FACTORS (MODEL CORE) (100% Weight)         */}
            {/* --------------------------------------------------------------------- */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#141E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E3] dark:border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A2E] dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#087F8C]" />
                  6 Potential Factors (Model Core)
                </h3>
                <span className="text-[10px] font-mono text-[#087F8C] font-bold">100% Weight</span>
              </div>

              <div className="space-y-4 text-xs">
                {[
                  { label: 'Attraction Strength', weight: '30%', score: factorScores.attraction_strength, color: 'bg-[#087F8C]' },
                  { label: 'Tourism Demand Proxy', weight: '20%', score: factorScores.tourism_demand ?? 50.0, color: 'bg-emerald-500' },
                  { label: 'Cultural & Natural Significance', weight: '15%', score: factorScores.cultural_natural_significance, color: 'bg-[#3A8F5C]' },
                  { label: 'Growth Opportunity', weight: '15%', score: factorScores.growth_opportunity, color: 'bg-[#2F80C0]' },
                  { label: 'Accessibility Potential', weight: '10%', score: factorScores.accessibility_potential, color: 'bg-indigo-500' },
                  { label: 'Seasonality Index', weight: '10%', score: factorScores.seasonality, color: 'bg-amber-500' },
                ].map((f) => (
                  <div key={f.label} className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                        {f.label} <span className="text-neutral-400 text-[10px]">({f.weight})</span>
                      </span>
                      <span className="font-bold font-mono text-[#102A2E] dark:text-white">{f.score}/100</span>
                    </div>
                    {/* Sleek colored progress bar matching Photo 2 */}
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${f.color} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(0, f.score))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-card summary footer */}
              <div className="pt-3 border-t border-[#DCE5E3] dark:border-neutral-800 flex justify-between text-[11px] text-neutral-500">
                <span>Model Baseline:</span>
                <span className="font-mono font-bold text-[#087F8C]">
                  Tourism Potential: {tourismPotential}/100
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* CARD 2 (RIGHT): 6 INFRASTRUCTURE READINESS FACTORS (100% Weight)      */}
            {/* --------------------------------------------------------------------- */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#141E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E3] dark:border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A2E] dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#2F80C0]" />
                  6 Infrastructure Readiness Factors
                </h3>
                <span className="text-[10px] font-mono text-[#2F80C0] font-bold">100% Weight</span>
              </div>

              <div className="space-y-4 text-xs">
                {READINESS_FACTORS.map((f) => {
                  const val = readinessValues[f.key];
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                          {f.label} <span className="text-neutral-400 text-[10px]">({f.weight})</span>
                        </span>
                        
                        {/* Interactive numeric input */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={val}
                            onChange={(e) => handleFieldChange(f.key, parseFloat(e.target.value))}
                            className="w-14 px-1.5 py-0.5 bg-[#F8FAF9] dark:bg-neutral-900 border border-[#DCE5E3] dark:border-neutral-700 rounded-md text-xs font-bold font-mono text-center text-[#102A2E] dark:text-white focus:outline-none focus:border-[#087F8C]"
                          />
                          <span className="text-[11px] font-mono font-bold text-neutral-400">/100</span>
                        </div>
                      </div>

                      {/* Colored Progress Bar + Interactive Slider Matching Photo 2 */}
                      <div className="relative pt-0.5">
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden pointer-events-none">
                          <div
                            className={`h-full ${f.color} rounded-full transition-all duration-150`}
                            style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                          ></div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={val}
                          onChange={(e) => handleFieldChange(f.key, parseFloat(e.target.value))}
                          className="w-full mt-1.5 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: f.hexColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Exact Matching Button from Photo 2 + Retrain ML */}
              <div className="pt-3 border-t border-[#DCE5E3] dark:border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubmitAndRetrain()}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#087F8C] hover:bg-[#066570] text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Retraining ML Model with New Inputs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ Calculate Priority &amp; Retrain ML Model</span>
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setReadinessValues({
                        accommodation: 50,
                        transport: 50,
                        connectivity: 50,
                        food_hospitality: 50,
                        medical_safety: 50,
                        other_amenities: 50,
                      })
                    }
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to 50s</span>
                  </button>

                  <span className="text-[10px] font-mono text-neutral-400">
                    Live Telemetry Sync • {hourlyToken}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Analytical Footnote Card */}
          <div className="p-4 rounded-xl bg-[#F8FAF9] dark:bg-[#0E1B19] border border-[#DCE5E3] dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            <div className="font-bold text-[#102A2E] dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#087F8C]" />
              Multi-Factor Empirical Priority Model Protocol
            </div>
            <p className="text-[11px] leading-relaxed">
              When ground readiness inputs are persisted, the 7-feature GradientBoostingRegressor updates the district priority score
              and synchronizes national rankings across all 508 districts. Infrastructure bottlenecks are weighted against tourism demand
              headroom, ensuring public capital is directed where intervention unlocks the highest marginal visitor absorption.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
