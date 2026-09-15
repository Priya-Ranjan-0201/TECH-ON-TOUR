import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Share2,
  MapPin,
  ArrowRight,
  TrendingDown,
  Coins,
  Compass,
  AlertCircle,
  CheckCircle,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup } from 'react-leaflet';
import { DataBadge } from '../../components/common/DataBadge';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '../../lib/mapConstants';

interface FlowRedistributionViewProps {
  initialDestinationId?: number;
}

export default function FlowRedistributionView({ initialDestinationId = 1 }: FlowRedistributionViewProps) {
  const { t } = useTranslation();
  const [destinationId, setDestinationId] = useState<number>(initialDestinationId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlt, setSelectedAlt] = useState<any>(null);
  const [hourlyToken, setHourlyToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Preset popular destinations prone to high footfall
  const hotspotPresets = [
    { id: 1, name: 'Baratang Island & Caves', state: 'Andaman' },
    { id: 4038, name: 'Chhatrapati Sambhaji Park', state: 'Maharashtra' },
    { id: 2447, name: 'Red Fort & Chandni Chowk', state: 'Delhi' },
    { id: 7550, name: 'Hadimba Temple & Solang', state: 'Himachal' },
    { id: 12099, name: 'Varanasi Ghat Corridor', state: 'Uttar Pradesh' }
  ];

  const fetchRedistribution = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/dmo/flow-redistribution/${id}`);
      if (res.data && res.data.status === 'success') {
        setData(res.data);
        setHourlyToken(res.data.hourly_token || '');
        if (res.data.recommended_alternatives?.length > 0) {
          setSelectedAlt(res.data.recommended_alternatives[0]);
        } else {
          setSelectedAlt(null);
        }
      } else {
        setError(res.data?.message || 'Failed to calculate flow redistribution.');
      }
    } catch (err: any) {
      console.error('Flow redistribution error:', err);
      setError('Failed to reach flow redistribution engine. Ensure server is active.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRedistribution(destinationId);
  }, [destinationId, fetchRedistribution]);

  const primary = data?.primary_destination;
  const alternatives = data?.recommended_alternatives || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 dark:border-blue-400/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Module 3 • {t('dmo.tabs.flow', 'Smart Flow Redistribution')}
            </span>
            {hourlyToken && (
              <span className="text-[11px] font-mono text-neutral-500 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                Hourly Token: {hourlyToken}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#712B13] dark:text-amber-200">
            {t('dmo.flow.title', 'Smart Tourist Flow Diversion & Carrying Capacity Rebalance')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {t('dmo.flow.subtitle', 'Haversine 50km under-visited satellite dispersal to de-saturate critical hotspots')}
          </p>
        </div>

        {/* Hotspot Presets */}
        <div className="bg-white dark:bg-[#1A1816] p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1.5 shrink-0">
          <span className="text-[11px] font-bold text-neutral-500 block">Inspect High-Stress POI</span>
          <div className="flex flex-wrap gap-1.5">
            {hotspotPresets.map((hp) => (
              <button
                key={hp.id}
                onClick={() => setDestinationId(hp.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  destinationId === hp.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {hp.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* 3 Executive Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Excess Flow Diverted</span>
            <DataBadge label="AI Recommendation" size="xs" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {data?.total_diverted_pct || 0}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Redistributed to {alternatives.length} alternatives within 50km
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Decentralized Economic Impact</span>
            <DataBadge label="Predicted Data" size="xs" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₹{data?.expected_total_impact_crore || 0} Cr
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            New visitor spending channeled into secondary circuits
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Primary POI Rebalanced Load</span>
            <DataBadge label="Estimated Data" size="xs" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-white">
            {primary ? primary.recommended_flow_pct : 100}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Safe sustainable carrying capacity restoration
          </p>
        </div>
      </div>

      {/* Main Grid: Flow Comparison Bar + Map with Connecting Polylines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Panel with Primary + Alternatives & Connecting Lines (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                50km Redistribution Spatial Map
              </h3>
              <p className="text-[11px] text-neutral-500">
                Red lines connect congested hub to recommended nearby secondary destinations
              </p>
            </div>
            <DataBadge label="Actual Data" size="xs" />
          </div>

          <div className="w-full h-[460px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 relative">
            {primary && (
              <MapContainer
                center={[primary.latitude || 22.0, primary.longitude || 78.0]}
                zoom={10}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />

                {/* Primary Destination (Red Hub) */}
                <CircleMarker
                  center={[primary.latitude, primary.longitude]}
                  radius={12}
                  pathOptions={{
                    fillColor: '#DC2626',
                    fillOpacity: 0.9,
                    color: '#FFFFFF',
                    weight: 3,
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]}>
                    <div className="text-xs font-bold text-red-700">
                      🚨 Primary: {primary.name} ({primary.crowd_density_score}% Load)
                    </div>
                  </Tooltip>
                </CircleMarker>

                {/* Connecting Polylines and Alternative Markers */}
                {alternatives.map((alt: any) => {
                  const isSelected = selectedAlt?.destination_id === alt.destination_id;
                  return (
                    <React.Fragment key={alt.destination_id}>
                      {/* Line from Primary to Alternative */}
                      <Polyline
                        positions={[
                          [primary.latitude, primary.longitude],
                          [alt.latitude, alt.longitude]
                        ]}
                        pathOptions={{
                          color: isSelected ? '#2563EB' : '#93C5FD',
                          weight: isSelected ? 3.5 : 2,
                          dashArray: isSelected ? undefined : '6, 6',
                          opacity: isSelected ? 1.0 : 0.7,
                        }}
                      />

                      {/* Alternative Marker */}
                      <CircleMarker
                        center={[alt.latitude, alt.longitude]}
                        radius={isSelected ? 10 : 7}
                        pathOptions={{
                          fillColor: '#2563EB',
                          fillOpacity: isSelected ? 0.95 : 0.75,
                          color: '#FFFFFF',
                          weight: 2,
                        }}
                        eventHandlers={{
                          click: () => setSelectedAlt(alt),
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -6]}>
                          <div className="text-xs">
                            <p className="font-bold">{alt.name}</p>
                            <p>Distance: {alt.distance_km} km</p>
                            <p>Target Flow: +{alt.recommended_flow_pct}%</p>
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#1A1816]/95 backdrop-blur-md p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] space-y-1 z-[1000]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Congested Primary Destination</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Recommended Secondary Alternative</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block border-t border-dashed" /> 50km Diversion Corridor</div>
            </div>
          </div>
        </div>

        {/* Flow Redistribution Breakdown Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Before vs After Visual Distribution Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Visitor Flow Distribution Split
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Before (100% focused) vs Recommended Diversion Split
                </p>
              </div>
              <DataBadge label="AI Recommendation" size="xs" />
            </div>

            {/* Before Distribution Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-neutral-600 dark:text-neutral-400">Current Flow Concentration (Unbalanced)</span>
                <span className="font-mono text-red-600">100% Primary ({primary?.name})</span>
              </div>
              <div className="w-full bg-red-500 h-4 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-2xs">
                100% Saturation Focus (Overcrowded)
              </div>
            </div>

            {/* After Recommended Redistribution Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-neutral-600 dark:text-neutral-400">Recommended Balanced Flow (Dispersed)</span>
                <span className="font-mono text-emerald-600">Rebalanced to Safe Capacity</span>
              </div>
              <div className="w-full h-5 rounded-lg overflow-hidden flex shadow-2xs font-mono text-[10px] text-white font-bold">
                {/* Primary remaining flow */}
                <div
                  className="bg-red-500 flex items-center justify-center truncate px-1"
                  style={{ width: `${primary ? primary.recommended_flow_pct : 65}%` }}
                  title={`Primary: ${primary?.recommended_flow_pct}%`}
                >
                  Primary ({primary?.recommended_flow_pct}%)
                </div>
                {/* Alternatives split */}
                {alternatives.map((alt: any, idx: number) => {
                  const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600'];
                  return (
                    <div
                      key={alt.destination_id}
                      className={`${colors[idx % colors.length]} flex items-center justify-center truncate px-1`}
                      style={{ width: `${alt.recommended_flow_pct}%` }}
                      title={`${alt.name}: ${alt.recommended_flow_pct}%`}
                    >
                      +{alt.recommended_flow_pct}%
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alternatives Ranked Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Secondary Alternatives Ranked by: Potential × (1 - Popularity)
              </h4>
              <DataBadge label="Actual Data" size="xs" />
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {alternatives.map((alt: any) => {
                const isSelected = selectedAlt?.destination_id === alt.destination_id;
                return (
                  <div
                    key={alt.destination_id}
                    onClick={() => setSelectedAlt(alt)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-[#1A1816] border-neutral-200 dark:border-neutral-800 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">
                            {alt.name}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                            {alt.distance_km} km away
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {alt.category} • Heritage: {alt.heritage_status}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-neutral-400 block">Recommended Flow</span>
                        <span className="font-mono font-extrabold text-sm text-blue-700 dark:text-blue-300">
                          +{alt.recommended_flow_pct}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">
                        Potential: <strong className="text-neutral-700 dark:text-neutral-300">{alt.potential_score}/100</strong>
                      </span>
                      <span className="text-emerald-600 font-bold">
                        Expected Impact: ₹{alt.expected_economic_impact_crore} Cr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Alternative Explainability Modal/Card */}
      {selectedAlt && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-blue-500/30 dark:border-blue-400/30 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Why Divert To {selectedAlt.name}? Top 3 Contributing Factors
              </h4>
            </div>
            <DataBadge label="AI Recommendation" size="xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(selectedAlt.top_factors || []).map((tf: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 text-xs"
              >
                <span className="font-bold text-neutral-900 dark:text-white block">
                  {idx + 1}. {tf.factor}
                </span>
                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                  {tf.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
