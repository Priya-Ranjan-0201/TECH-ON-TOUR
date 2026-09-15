import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Shield,
  HeartPulse,
  Trash2,
  Bus,
  Ambulance,
  Bath,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { DataBadge } from '../../components/common/DataBadge';
import Badge from '../../components/ui/Badge';

interface CrowdIntelligenceViewProps {
  onNavigateToFlow?: (destinationId?: number) => void;
}

export default function CrowdIntelligenceView({ onNavigateToFlow }: CrowdIntelligenceViewProps) {
  const { t } = useTranslation();
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedForecast, setSelectedForecast] = useState<any>(null);
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [hourlyToken, setHourlyToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/dmo/crowd-forecast?days_ahead=120';
      if (regionFilter) url += `&region=${encodeURIComponent(regionFilter)}`;
      const res = await axios.get(url);
      if (res.data && res.data.status === 'success') {
        setForecasts(res.data.forecasts || []);
        setHourlyToken(res.data.hourly_token || '');
        if (res.data.forecasts?.length > 0 && !selectedForecast) {
          setSelectedForecast(res.data.forecasts[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch crowd forecasts:', err);
      setError('Unable to load crowd forecasts. Ensure backend server is active.');
    } finally {
      setLoading(false);
    }
  }, [regionFilter, selectedForecast]);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
            🟢 {t('dmo.crowd.sustainable', 'Sustainable / Normal')}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
            🟡 {t('dmo.crowd.high', 'High Traffic')}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300">
            🟠 {t('dmo.crowd.near_capacity', 'Near Capacity Alert')}
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 animate-pulse">
            🔴 {t('dmo.crowd.critical', 'Critical Overcapacity')}
          </span>
        );
      default:
        return null;
    }
  };

  const levelColor = (lvl: string) => {
    const l = (lvl || '').toLowerCase();
    if (l === 'critical') return 'critical';
    if (l === 'high') return 'high';
    if (l === 'moderate') return 'moderate';
    return 'low';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 dark:border-amber-400/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-600 text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Module 2 • {t('dmo.tabs.crowd', 'Crowd & Festival AI')}
            </span>
            {hourlyToken && (
              <span className="text-[11px] font-mono text-neutral-500 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                Hourly Token: {hourlyToken}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#712B13] dark:text-amber-200">
            {t('dmo.crowd.title', 'AI Footfall & Festival Crowd Command')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {t('dmo.crowd.subtitle', '45-day predictive surge forecasting with dynamic resource pre-positioning')}
          </p>
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
            <Badge color="amber" size="sm">
              Live Stream Signal
            </Badge>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              TravelSathi Crowd Index — derived from platform activity + search trend data, refreshed hourly
            </p>
          </div>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search region/event..."
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* Main Grid: Forecast List + Selected Forecast Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Forecast Timeline Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Upcoming Events & Regional Spikes ({forecasts.length})
            </h3>
            <DataBadge label="Predicted Data" size="xs" />
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {forecasts.map((fc: any) => {
              const isSelected = selectedForecast?.id === fc.id;
              return (
                <div
                  key={fc.id}
                  onClick={() => setSelectedForecast(fc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-[#1A1816] border-neutral-200 dark:border-neutral-800 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-neutral-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {fc.forecast_date}
                    </span>
                    {getStatusBadge(fc.crowd_status)}
                  </div>

                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {fc.festival_name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Region: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{fc.region}</span> ({fc.festival_scale} scale)
                  </p>

                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-400 text-[11px] block">Predicted Footfall</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {fc.predicted_footfall_index} Index
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-[11px] block">Capacity Threshold</span>
                      <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {fc.capacity_estimate} Index
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Intelligence Detail Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedForecast ? (
            <>
              {/* Event Header & Status Banner */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {selectedForecast.festival_name}
                      </h3>
                      {getStatusBadge(selectedForecast.crowd_status)}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {selectedForecast.region} • Date: {selectedForecast.forecast_date} • Scale: {selectedForecast.festival_scale}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">Saturation Ratio</span>
                    <span className="font-mono font-extrabold text-base text-neutral-900 dark:text-white">
                      {Math.round(selectedForecast.saturation_ratio * 100)}%
                    </span>
                  </div>
                </div>

                {/* Capacity vs Predicted Bar */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Predicted ({selectedForecast.predicted_footfall_index}) vs Capacity ({selectedForecast.capacity_estimate})</span>
                    <DataBadge label="Predicted Data" size="xs" />
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedForecast.crowd_status === 'critical'
                          ? 'bg-red-600'
                          : selectedForecast.crowd_status === 'high'
                          ? 'bg-orange-500'
                          : selectedForecast.crowd_status === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, selectedForecast.saturation_ratio * 100)}%` }}
                    />
                  </div>
                </div>

                {/* TravelSathi Crowd Index — Verbatim Exact Copy */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                  <Badge color={levelColor(selectedForecast.crowd_status)}>
                    Crowd Index: {selectedForecast.crowd_status} ({Math.round(selectedForecast.saturation_ratio * 100)}/100)
                  </Badge>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    TravelSathi Crowd Index — derived from platform activity + search trend data, refreshed hourly
                  </p>
                </div>
              </div>

              {/* Resource Requirements Cards */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      Automated Resource Requirements (Baseline Ratios)
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Ratios per 1,000 visitors: Police 20 • Medical 8 • Sanitation 15 • Buses 5 • Ambulances 2 • Toilets 10
                    </p>
                  </div>
                  <DataBadge label="AI Recommendation" size="xs" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Police */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Police Force</span>
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedForecast.resource_recommendation?.police?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Medical */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Medical Crew</span>
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedForecast.resource_recommendation?.medical?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Sanitation */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Sanitation Crew</span>
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedForecast.resource_recommendation?.sanitation?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Buses */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 flex items-center justify-center shrink-0">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Feeder Buses</span>
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedForecast.resource_recommendation?.buses?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Ambulances */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 flex items-center justify-center shrink-0">
                      <Ambulance className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Ambulances</span>
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedForecast.resource_recommendation?.ambulances?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Toilets */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 flex items-center justify-center shrink-0">
                      <Bath className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Mobile Toilets</span>
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {selectedForecast.resource_recommendation?.toilets?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Peak Hours Timeline */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Daily Peak Influx Timeline
                  </h4>
                  <DataBadge label="Estimated Data" size="xs" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(selectedForecast.peak_timeline || []).map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 text-center"
                    >
                      <span className="text-[10px] text-neutral-400 block">{t.time}</span>
                      <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white block mt-1">
                        {t.expected_density_pct}%
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        t.status === 'critical' ? 'text-red-600' : t.status === 'high' ? 'text-orange-500' : 'text-emerald-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-Recommendations (Triggered on High / Critical) */}
              {selectedForecast.auto_recommendations?.length > 0 && (
                <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900/60 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 dark:text-red-200">
                        Triggered Capacity Action Protocols ({selectedForecast.auto_recommendations.length})
                      </h4>
                    </div>
                    <DataBadge label="AI Recommendation" size="xs" />
                  </div>

                  <div className="space-y-2">
                    {selectedForecast.auto_recommendations.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white dark:bg-[#1A1816] border border-red-200 dark:border-red-900/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {rec.action}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 shrink-0">
                          {rec.priority}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Flow Redistribution Link CTA */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onNavigateToFlow && onNavigateToFlow(selectedForecast.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Activate Tourist Flow Redistribution (Module 3)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Explainability (Top 3 Contributing Factors) */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Why this forecast? Top 3 Contributing Factors (Explainability)
                  </span>
                  <DataBadge label="AI Recommendation" size="xs" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(selectedForecast.top_factors || []).map((tf: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-700 text-xs">
                      <div className="font-bold text-neutral-900 dark:text-white">{idx + 1}. {tf.factor}</div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{tf.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-neutral-400">
              Select an event or festival from the list to inspect crowd capacity intelligence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
