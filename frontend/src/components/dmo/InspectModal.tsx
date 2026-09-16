import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Car,
  Utensils,
  HeartPulse,
  Sparkles
} from 'lucide-react';

export interface DistrictProfileData {
  destination_id: string;
  district: string;
  state: string;
  city: string;
  canonical_name?: string;
  latitude: number;
  longitude: number;
  rank: number;
  scores: {
    tourism_potential: number;
    tourism_opportunity: number;
    investment_priority: number;
    infrastructure_readiness?: number;
    readiness_score?: number;
  };
  factor_scores: {
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
  readiness_badge?: {
    tier: string;
    label: string;
    badge: string;
    color: string;
    hex?: string;
  };
  classification: string;
  classification_description: string;
  priority_tier: string;
  priority_badge: string;
  primary_bottleneck: string;
  recommended_primary_intervention: string;
  readiness_comparison?: {
    readiness_score: number;
    potential_score: number;
    gap_score: number;
    quadrant?: string;
  };
  explainability: {
    top_positive_factors?: Array<{ factor: string; score: number; contribution: string; detail: string }>;
    constraints?: Array<{ factor: string; score: number; contribution: string; detail: string }>;
    drivers_checklist: string[];
    warning_checklist: string[];
    human_readable_explanation: string;
    strategic_recommendation: string;
  };
  asset_profile: {
    total_attractions: number;
    natural_attractions?: number;
    heritage_attractions?: number;
    verified_cultural_assets: number;
    gi_products?: number;
    total_activities: number;
    road_connectivity_score: number;
    rail_connectivity_score?: number;
    air_connectivity_score?: number;
    overall_connectivity_score?: number;
  };
  recommendations: Array<{
    priority_rank: number;
    action: string;
    category: string;
    reason: string;
    severity: string;
    expected_objective: string;
  }>;
  confidence: {
    score: number;
    level: string;
    reason: string;
  };
}

interface InspectModalProps {
  district: DistrictProfileData | null;
  onClose: () => void;
  onOpenReadinessInput?: (districtId: string) => void;
}

export default function InspectModal({ district, onClose, onOpenReadinessInput }: InspectModalProps) {
  if (!district) return null;

  const readinessScore =
    district.scores.readiness_score ??
    district.scores.infrastructure_readiness ??
    district.readiness_comparison?.readiness_score ??
    50.0;

  const readinessTier =
    readinessScore >= 70 ? 'High' : readinessScore >= 45 ? 'Medium' : 'Low';

  const readinessBadgeClass =
    readinessTier === 'High'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      : readinessTier === 'Medium'
      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';

  const readinessFactors = district.readiness_factors || {
    accommodation: Math.round(district.scores.tourism_opportunity * 0.85),
    transport: Math.round(district.asset_profile.road_connectivity_score || 60),
    connectivity: Math.round(district.asset_profile.road_connectivity_score || 60),
    food_hospitality: Math.round(district.factor_scores.attraction_strength * 0.75),
    medical_safety: 75,
    other_amenities: Math.round(district.factor_scores.accessibility_potential * 0.8),
  };

  const potentialGap = Math.round((district.scores.tourism_potential - readinessScore) * 10) / 10;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 backdrop-blur-md bg-black/50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-neutral-50 dark:bg-[#121A18] rounded-2xl max-w-4xl w-[94vw] sm:w-[90vw] max-h-[90vh] overflow-y-auto p-5 sm:p-8 border border-[#DCE5E3] dark:border-neutral-800 shadow-2xl text-[#102A2E] dark:text-neutral-100 relative"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#DCE5E3] dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#EFF9F8] text-[#087F8C] border border-[#087F8C]/20">
                  National Rank #{district.rank}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {district.destination_id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${readinessBadgeClass}`}>
                  {readinessTier} Readiness ({readinessScore}/100)
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#102A2E] dark:text-white mt-1">
                {district.city && district.city.toLowerCase() !== district.district.toLowerCase()
                  ? `${district.city} (${district.district})`
                  : district.district}
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#087F8C]" />
                <span>{district.city}, {district.state}</span>
                <span className="text-neutral-400">•</span>
                <span className="font-mono">{district.latitude.toFixed(4)}°N, {district.longitude.toFixed(4)}°E</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Close inspect view"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 pt-4">
            {/* Government Decision & Scoring Summary */}
            <div className="p-4 rounded-xl bg-[#EFF9F8] dark:bg-[#0A2624] border border-[#087F8C]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#087F8C] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Government Decision & Investment Metric Summary
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  district.priority_tier === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                  district.priority_tier === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {district.priority_badge}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-white dark:bg-[#142320] p-3 rounded-lg border border-[#DCE5E3] dark:border-neutral-700">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Final Priority Score</span>
                  <span className="font-extrabold text-xl text-[#102A2E] dark:text-white">
                    {district.scores.investment_priority}
                    <span className="text-xs font-normal text-neutral-400">/100</span>
                  </span>
                </div>

                <div className="bg-white dark:bg-[#142320] p-3 rounded-lg border border-[#DCE5E3] dark:border-neutral-700">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tourism Potential</span>
                  <span className="font-extrabold text-xl text-[#087F8C]">
                    {district.scores.tourism_potential}
                    <span className="text-xs font-normal text-neutral-400">/100</span>
                  </span>
                </div>

                <div className="bg-white dark:bg-[#142320] p-3 rounded-lg border border-[#DCE5E3] dark:border-neutral-700">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Readiness Score</span>
                  <span className="font-extrabold text-xl text-[#2F80C0]">
                    {readinessScore}
                    <span className="text-xs font-normal text-neutral-400">/100</span>
                  </span>
                </div>

                <div className="bg-white dark:bg-[#142320] p-3 rounded-lg border border-[#DCE5E3] dark:border-neutral-700">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Infrastructure Gap</span>
                  <span className={`font-extrabold text-xl ${potentialGap > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {potentialGap > 0 ? `+${potentialGap}` : potentialGap}
                    <span className="text-xs font-normal text-neutral-400"> pts</span>
                  </span>
                </div>
              </div>

              <div className="text-xs pt-2 border-t border-[#087F8C]/20 space-y-1">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Primary Bottleneck: <span className="text-[#087F8C] font-bold">{district.primary_bottleneck}</span>
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {district.recommended_primary_intervention}
                </p>
              </div>
            </div>

            {/* TWO-COLUMN GRID: 6 POTENTIAL FACTORS + 6 READINESS FACTORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1: All 6 Potential Factors */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#141E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E3] dark:border-neutral-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A2E] dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#087F8C]" />
                    6 Potential Factors (Model Core)
                  </h3>
                  <span className="text-[10px] font-mono text-[#087F8C] font-bold">100% Weight</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { label: 'Attraction Strength', weight: '30%', score: district.factor_scores.attraction_strength, color: 'bg-[#087F8C]' },
                    { label: 'Tourism Demand Proxy', weight: '20%', score: district.factor_scores.tourism_demand ?? district.scores.tourism_opportunity, color: 'bg-emerald-600' },
                    { label: 'Cultural & Natural Significance', weight: '15%', score: district.factor_scores.cultural_natural_significance, color: 'bg-[#3A8F5C]' },
                    { label: 'Growth Opportunity', weight: '15%', score: district.factor_scores.growth_opportunity, color: 'bg-[#2F80C0]' },
                    { label: 'Accessibility Potential', weight: '10%', score: district.factor_scores.accessibility_potential, color: 'bg-indigo-500' },
                    { label: 'Seasonality Index', weight: '10%', score: district.factor_scores.seasonality, color: 'bg-amber-500' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {f.label} <span className="text-neutral-400 text-[10px]">({f.weight})</span>
                        </span>
                        <span className="font-bold font-mono">{f.score}/100</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${f.color} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, f.score))}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: All 6 Readiness Factors */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#141E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E3] dark:border-neutral-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A2E] dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#2F80C0]" />
                    6 Infrastructure Readiness Factors
                  </h3>
                  <span className="text-[10px] font-mono text-[#2F80C0] font-bold">100% Weight</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { label: 'Accommodation', weight: '25%', score: readinessFactors.accommodation, color: 'bg-[#2F80C0]' },
                    { label: 'Transport & Accessibility', weight: '20%', score: readinessFactors.transport, color: 'bg-[#087F8C]' },
                    { label: 'Connectivity', weight: '15%', score: readinessFactors.connectivity, color: 'bg-teal-600' },
                    { label: 'Food & Hospitality', weight: '15%', score: readinessFactors.food_hospitality, color: 'bg-amber-500' },
                    { label: 'Medical & Safety', weight: '15%', score: readinessFactors.medical_safety, color: 'bg-rose-500' },
                    { label: 'Other Amenities', weight: '10%', score: readinessFactors.other_amenities, color: 'bg-purple-500' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {f.label} <span className="text-neutral-400 text-[10px]">({f.weight})</span>
                        </span>
                        <span className="font-bold font-mono">{f.score}/100</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${f.color} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, f.score))}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {onOpenReadinessInput && (
                  <div className="pt-2 border-t border-[#DCE5E3] dark:border-neutral-800">
                    <button
                      onClick={() => onOpenReadinessInput(district.destination_id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#EFF9F8] dark:bg-[#0E2926] text-[#087F8C] hover:bg-[#087F8C] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Adjust Readiness Inputs For This District
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI EXPLAINABILITY & TOP CONTRIBUTING FACTORS */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#141E1C] border border-[#DCE5E3] dark:border-neutral-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#087F8C]" />
                Top Contributing Drivers &amp; Decision Explainability
              </h3>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {district.explainability?.human_readable_explanation ||
                  `District ${district.district} ranks #${district.rank} nationally with an investment priority score of ${district.scores.investment_priority}/100.`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 block">Top Positive Drivers</span>
                  {district.explainability?.drivers_checklist?.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-orange-600 block">Constraints &amp; Bottlenecks</span>
                  {district.explainability?.warning_checklist?.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {district.explainability?.strategic_recommendation && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 mt-2">
                  <span className="font-bold text-[#087F8C]">AI Strategic Recommendation:</span>{' '}
                  {district.explainability.strategic_recommendation}
                </div>
              )}
            </div>

            {/* VERIFIED ASSET INVENTORY */}
            <div className="p-4 bg-white dark:bg-[#141E1C] rounded-xl border border-[#DCE5E3] dark:border-neutral-800 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Verified Ground-Truth Tourism Asset Inventory
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#F8FAF9] dark:bg-neutral-900 p-2.5 rounded-lg border border-[#DCE5E3] dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Total Catalog Attractions</span>
                  <span className="font-bold text-sm text-[#102A2E] dark:text-white">{district.asset_profile.total_attractions}</span>
                </div>
                <div className="bg-[#F8FAF9] dark:bg-neutral-900 p-2.5 rounded-lg border border-[#DCE5E3] dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Cultural &amp; Heritage Assets</span>
                  <span className="font-bold text-sm text-[#087F8C]">{district.asset_profile.verified_cultural_assets}</span>
                </div>
                <div className="bg-[#F8FAF9] dark:bg-neutral-900 p-2.5 rounded-lg border border-[#DCE5E3] dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Regulated Concession Activities</span>
                  <span className="font-bold text-sm text-[#3A8F5C]">{district.asset_profile.total_activities}</span>
                </div>
                <div className="bg-[#F8FAF9] dark:bg-neutral-900 p-2.5 rounded-lg border border-[#DCE5E3] dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Road Transit Telemetry</span>
                  <span className="font-bold text-sm text-[#2F80C0]">{district.asset_profile.road_connectivity_score}/100</span>
                </div>
              </div>
            </div>

            {/* RANKED GOVERNMENT ACTION PLAN */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Ranked Government Action Plan (Section 36)
              </h3>
              <div className="space-y-2 text-xs">
                {district.recommendations?.map((act) => (
                  <div
                    key={act.priority_rank}
                    className="p-3.5 bg-white dark:bg-[#141E1C] rounded-xl border border-[#DCE5E3] dark:border-neutral-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#087F8C]">
                        Priority {act.priority_rank}: {act.action}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {act.severity}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">{act.reason}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">Expected Objective: {act.expected_objective}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DATA CONFIDENCE AUDIT */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-700 dark:text-neutral-300">Data Confidence Audit: </span>
                <span className="text-neutral-600 dark:text-neutral-400">{district.confidence?.reason || 'Verified multi-source telemetry'}</span>
              </div>
              <span className="font-bold text-[#087F8C] font-mono">
                {district.confidence?.score}/100 ({district.confidence?.level})
              </span>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="pt-4 border-t border-[#DCE5E3] dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              {onOpenReadinessInput ? (
                <button
                  onClick={() => onOpenReadinessInput(district.destination_id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EFF9F8] text-[#087F8C] hover:bg-[#087F8C] hover:text-white border border-[#087F8C]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  Edit Readiness Input
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[#102A2E] dark:text-white transition-all cursor-pointer"
              >
                Close Full-Page Modal
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
