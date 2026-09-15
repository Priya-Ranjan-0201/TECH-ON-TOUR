import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  MapPin,
  HelpCircle,
  Building2,
  RefreshCw,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { DataBadge } from '../../components/common/DataBadge';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '../../lib/mapConstants';

export default function InvestmentIntelligenceView() {
  const [budget, setBudget] = useState<number>(25.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (currentBudget: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/dmo/investment-recommend', {
        budget_crore: Number(currentBudget),
      });
      if (res.data && res.data.status === 'success') {
        setData(res.data);
        if (res.data.top_10_recommendations?.length > 0 && !selectedDistrict) {
          setSelectedDistrict(res.data.top_10_recommendations[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch investment recommendations:', err);
      setError('Unable to load investment recommendations. Ensure backend server is active.');
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    fetchRecommendations(budget);
  }, []);

  const handleBudgetChange = (newBudget: number) => {
    setBudget(newBudget);
    fetchRecommendations(newBudget);
  };

  const filteredDistricts = (data?.all_districts || []).filter((d: any) =>
    (d.district || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (d.state || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#712B13]/10 via-[#8C3618]/5 to-transparent border border-[#712B13]/20 dark:border-[#E5A93C]/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#712B13] text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Module 1 • Capital Allocation Engine
            </span>
            {data?.hourly_token && (
              <span className="text-[11px] font-mono text-neutral-500 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                Hourly Token: {data.hourly_token}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#712B13] dark:text-amber-200">
            AI Tourism Investment Prioritization
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Simulates capital deployment across districts combining the 6-factor Tourism Potential score with infrastructure gap multipliers to optimize ROI.
          </p>
        </div>

        {/* Budget Controller */}
        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2 shrink-0 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Capital Allocation</span>
            <DataBadge label="Estimated Data" size="xs" />
          </div>
          <div className="flex items-baseline gap-1 text-2xl font-extrabold font-display text-[#712B13] dark:text-[#E5A93C]">
            <span>₹</span>
            <span>{budget}</span>
            <span className="text-xs font-semibold text-neutral-500">Crore INR</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[5, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => handleBudgetChange(amount)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  budget === amount
                    ? 'bg-[#712B13] text-white shadow-2xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
              >
                ₹{amount} Cr
              </button>
            ))}
          </div>

          <input
            type="range"
            min="2"
            max="150"
            step="1"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            onMouseUp={() => fetchRecommendations(budget)}
            onTouchEnd={() => fetchRecommendations(budget)}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#712B13]"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Expected Visitor Lift</span>
            <DataBadge label="Estimated Data" size="xs" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-white">
            +{selectedDistrict ? selectedDistrict.expected_tourist_increase_pct : 28.5}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Capped at 40% linear absorption ceiling</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Projected Tourist Spend</span>
            <DataBadge label="Predicted Data" size="xs" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₹{selectedDistrict ? selectedDistrict.expected_spend_crore : 58.2} Cr
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Local economic multiplier on ₹{budget} Cr outlay</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Direct & Indirect Jobs</span>
            <DataBadge label="Estimated Data" size="xs" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {selectedDistrict ? selectedDistrict.expected_jobs?.toLocaleString() : '4,850'}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Hospitality, transport, and artisan employment</p>
        </div>
      </div>

      {/* Main Grid: Choropleth Map + Ranked Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Panel (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                National Investment Score Map
              </h3>
              <p className="text-[11px] text-neutral-500">Color indicates investment_score (Potential × Infra Gap)</p>
            </div>
            <DataBadge label="AI Recommendation" size="xs" />
          </div>

          <div className="w-full h-[440px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 relative">
            <MapContainer
              center={[22.5, 78.9]}
              zoom={4}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
              {(data?.all_districts || []).map((d: any) => {
                const isSelected = selectedDistrict?.district === d.district;
                const score = d.investment_score || 50;
                const color = score > 80 ? '#712B13' : score > 65 ? '#D97706' : '#2563EB';

                return (
                  <CircleMarker
                    key={d.district}
                    center={[d.latitude || 22.0, d.longitude || 78.0]}
                    radius={isSelected ? 10 : 6}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: isSelected ? 0.95 : 0.7,
                      color: isSelected ? '#FFFFFF' : color,
                      weight: isSelected ? 3 : 1,
                    }}
                    eventHandlers={{
                      click: () => setSelectedDistrict(d),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                      <div className="text-xs">
                        <p className="font-bold">{d.district}</p>
                        <p>Investment Score: <span className="font-mono font-bold">{score}</span></p>
                        <p>Base Potential: {d.tourism_potential}/100</p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-md p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] space-y-1 z-[1000]">
              <div className="font-bold text-neutral-700 dark:text-neutral-300">Investment Score Tier</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#712B13]" /> High Priority (&gt; 80)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /> Moderate Priority (65-80)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Steady Growth (&lt; 65)</div>
            </div>
          </div>
        </div>

        {/* Comparison Table Panel (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Ranked Priority Districts ({filteredDistricts.length})
                </h3>
                <p className="text-[11px] text-neutral-500">Formula: investment_score = potential_score × (1 + (1 - infra_index))</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter district..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 sticky top-0 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">District / State</th>
                    <th className="py-2.5 px-3">
                      <span>Potential</span>
                      <DataBadge label="Actual Data" size="xs" className="ml-1" />
                    </th>
                    <th className="py-2.5 px-3">
                      <span>Score</span>
                      <DataBadge label="AI Recommendation" size="xs" className="ml-1" />
                    </th>
                    <th className="py-2.5 px-3">
                      <span>Tourist Lift</span>
                      <DataBadge label="Estimated Data" size="xs" className="ml-1" />
                    </th>
                    <th className="py-2.5 px-3">Infra Priority</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredDistricts.slice(0, 15).map((d: any) => {
                    const isSelected = selectedDistrict?.district === d.district;
                    return (
                      <tr
                        key={d.district}
                        onClick={() => setSelectedDistrict(d)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#712B13]/10 dark:bg-[#712B13]/20 font-bold'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono">#{d.rank}</td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white">
                          {d.district}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{d.tourism_potential}/100</td>
                        <td className="py-2.5 px-3 font-mono text-[#712B13] dark:text-[#E5A93C] font-bold">
                          {d.investment_score}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600">
                          +{d.expected_tourist_increase_pct}%
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-neutral-500 truncate max-w-[140px]">
                          {d.infra_priority}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDistrict(d);
                            }}
                            className="text-[#712B13] dark:text-[#E5A93C] hover:underline text-[11px]"
                          >
                            Drill-Down
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* District Drill-Down & Explainability Panel */}
      {selectedDistrict && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-[#712B13]/30 dark:border-[#E5A93C]/30 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#712B13] text-white">
                  Rank #{selectedDistrict.rank}
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {selectedDistrict.district} — Explainability & Capital Action Plan
                </h3>
                <DataBadge label="AI Recommendation" size="sm" />
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {selectedDistrict.poi_count} catalog POIs • Tourism Potential: {selectedDistrict.tourism_potential}/100 • {selectedDistrict.roi_label}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 3 Contributing Factors (Explainability) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Top 3 Contributing Factors (Explainability)
                </h4>
                <DataBadge label="AI Recommendation" size="xs" />
              </div>

              <div className="space-y-2.5">
                {(selectedDistrict.top_factors || []).map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex flex-col space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {idx + 1}. {f.name}
                      </span>
                      <span className="font-mono text-[#712B13] dark:text-[#E5A93C] font-bold">
                        Contribution: {f.contribution} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">{f.reason}</p>
                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-[#712B13] dark:bg-[#E5A93C] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, f.contribution * 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Capital Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Recommended Action Plan
                </h4>
                <DataBadge label="AI Recommendation" size="xs" />
              </div>

              <div className="space-y-2.5">
                {(selectedDistrict.recommended_actions || []).map((act: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                          {act.action}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1">
                          <span className="font-mono bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800">
                            Dept: {act.department}
                          </span>
                          <span className="font-mono text-emerald-600 font-bold">
                            Impact: {act.expected_impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
