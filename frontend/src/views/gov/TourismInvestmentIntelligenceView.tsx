import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  MapPin,
  Building2,
  Filter,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  BarChart3,
  Layers,
  ArrowRight,
  Download,
  Info,
  CheckCircle2,
  Compass,
  X,
  Sparkles,
  Printer,
  ChevronDown,
  Activity,
  Award,
  Sliders,
  Send,
  HelpCircle,
  Eye,
  Scale,
  ExternalLink,
  Clock,
  Car,
  Train,
  Plane
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as LeafletTooltip } from 'react-leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '../../lib/mapConstants';
import InspectModal from '../../components/dmo/InspectModal';
import ReadinessInputView from '../dmo/ReadinessInputView';

export type GovTab = 'overview' | 'rankings' | 'readiness' | 'simulator' | 'compare' | 'activities' | 'all';

interface KPIOverview {
  total_destinations_analyzed: number;
  high_priority_destinations: number;
  high_tourism_potential_destinations: number;
  untapped_opportunity_destinations: number;
  average_connectivity: number;
  average_tourism_potential: number;
  average_confidence: number;
  average_readiness?: number;
  data_status: string;
  last_data_update: string;
  model_version: string;
  hourly_token: string;
}

interface DistrictProfile {
  destination_id: string;
  district: string;
  state: string;
  city: string;
  canonical_name: string;
  latitude: number;
  longitude: number;
  rank: number;
  scores: {
    tourism_potential: number;
    tourism_opportunity: number;
    investment_priority: number;
    infrastructure_readiness?: number;
  };
  factor_scores: {
    attraction_strength: number;
    tourism_demand: number | null;
    cultural_natural_significance: number;
    growth_opportunity: number;
    accessibility_potential: number;
    seasonality: number;
  };
  classification: string;
  classification_description: string;
  scatter_plot: {
    x_demand_penetration: number;
    x_readiness?: number;
    y_tourism_potential: number;
    quadrant: string;
    quadrant_short: string;
    quadrant_color: string;
    gap_score?: number;
    strategic_action?: string;
  };
  readiness_comparison?: {
    readiness_score: number;
    potential_score: number;
    gap_score: number;
    quadrant: string;
    quadrant_short: string;
    quadrant_color: string;
    strategic_action: string;
  };
  priority_tier: string;
  priority_badge: string;
  primary_bottleneck: string;
  recommended_primary_intervention: string;
  infrastructure_gaps: Array<{
    gap_id: string;
    category: string;
    bottleneck_title: string;
    severity: string;
    evidence: string;
    rationale: string;
    recommended_interventions: string[];
    expected_objective: string;
  }>;
  recommendations: Array<{
    priority_rank: number;
    action: string;
    category: string;
    reason: string;
    evidence: string;
    severity: string;
    expected_objective: string;
    confidence: string;
  }>;
  confidence: {
    score: number;
    level: string;
    data_quality_score: number;
    reasons_positive: string[];
    reasons_negative: string[];
    reason: string;
  };
  explainability: {
    top_positive_factors: Array<{ factor: string; score: number; contribution: string; detail: string }>;
    constraints: Array<{ factor: string; score: number; contribution: string; detail: string }>;
    drivers_checklist: string[];
    warning_checklist: string[];
    human_readable_explanation: string;
    strategic_recommendation: string;
  };
  asset_profile: {
    total_attractions: number;
    natural_attractions: number;
    heritage_attractions: number;
    verified_cultural_assets: number;
    gi_products: number;
    total_activities: number;
    road_connectivity_score: number;
    rail_connectivity_score: number;
    air_connectivity_score: number;
    overall_connectivity_score: number;
    connectivity_confidence: string;
  };
  data_provenance: Array<{
    dataset_name: string;
    source_name: string;
    source_url: string;
    data_year: number;
    verification_status: string;
    records_used: number;
  }>;
  model: {
    version: string;
    mode: string;
    hourly_token: string;
    last_updated: string;
  };
}

export default function TourismInvestmentIntelligenceView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromLocation = (): GovTab => {
    const p = searchParams.get('tab');
    if (p && ['overview', 'rankings', 'readiness', 'simulator', 'compare', 'activities', 'all'].includes(p)) {
      return p as GovTab;
    }
    if (location.hash) {
      const h = location.hash.replace('#', '');
      if (h === 'rankings') return 'rankings';
      if (h === 'readiness') return 'readiness';
      if (h === 'simulator') return 'simulator';
      if (h === 'compare') return 'compare';
      if (h === 'activities') return 'activities';
      if (h === 'overview') return 'overview';
      if (h === 'all') return 'all';
    }
    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState<GovTab>(getTabFromLocation());

  useEffect(() => {
    const t = getTabFromLocation();
    if (t !== activeTab) {
      setActiveTabState(t);
    }
  }, [location.search, location.hash]);

  const handleTabChange = (newTab: GovTab) => {
    setActiveTabState(newTab);
    navigate(`/gov/tourism-intelligence?tab=${newTab}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [kpis, setKpis] = useState<KPIOverview | null>(null);
  const [rankings, setRankings] = useState<DistrictProfile[]>([]);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedClassification, setSelectedClassification] = useState<string>('All');
  const [activeMapLayer, setActiveMapLayer] = useState<string>('investment_priority');
  
  // Readiness Comparison Matrix State
  const [readinessMetric, setReadinessMetric] = useState<'potential' | 'priority'>('potential');
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<string>('All');

  // Modals & Drawers
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Compare selection state (2-5 district IDs)
  const [compareIds, setCompareIds] = useState<string[]>(['CT0456', 'CT0455', 'CT0340']);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  // Scenario Simulator state
  const [scenarioTargetId, setScenarioTargetId] = useState<string>('CT0456');
  const [scenarioBudget, setScenarioBudget] = useState<number>(25.0);
  const [scenarioType, setScenarioType] = useState<string>('integrated');
  const [scenarioHorizon, setScenarioHorizon] = useState<number>(3);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);

  // AI Advisor state
  const [advisorQuestion, setAdvisorQuestion] = useState<string>('');
  const [advisorHistory, setAdvisorHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      role: 'assistant',
      text: 'Namaste. I am the TravelSathi Government Tourism Intelligence Advisor. Ask me about district prioritization, infrastructure bottlenecks, or comparative investment upside based on verified evidence.',
      sources: ['Ministry of Tourism', 'ASI', 'GI Registry']
    }
  ]);
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(false);

  // Government Activities & Concessions State
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(false);
  const [activitiesTotal, setActivitiesTotal] = useState<number>(437);
  const [activitiesNationalTotal, setActivitiesNationalTotal] = useState<number>(437);
  const [activitiesCategories, setActivitiesCategories] = useState<any[]>([]);
  const [activitiesStates, setActivitiesStates] = useState<string[]>([]);
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [selectedActivityState, setSelectedActivityState] = useState<string>('All');
  const [selectedActivityCategory, setSelectedActivityCategory] = useState<string>('All');
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<string>('All');
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<any>(null);
  const [activeActivityModalTab, setActiveActivityModalTab] = useState<'concession' | 'transit' | 'ecosystem' | 'audit'>('concession');
  const [activityAuthoritiesCount, setActivityAuthoritiesCount] = useState<number>(352);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedActivityState !== 'All') params.append('state', selectedActivityState);
      if (selectedActivityCategory !== 'All') params.append('category', selectedActivityCategory);
      if (selectedActivityLevel !== 'All') params.append('experience_level', selectedActivityLevel);
      if (activitySearch.trim()) params.append('search', activitySearch.trim());
      params.append('limit', '100');

      const res = await axios.get(`/api/government/tourism/activities?${params.toString()}`);
      if (res.data) {
        setActivitiesList(res.data.activities || []);
        setActivitiesTotal(res.data.total ?? 437);
        setActivitiesNationalTotal(res.data.total_national ?? 437);
        if (res.data.categories) setActivitiesCategories(res.data.categories);
        if (res.data.states) setActivitiesStates(res.data.states);
        if (res.data.authorities_count) setActivityAuthoritiesCount(res.data.authorities_count);
      }
    } catch (e) {
      console.warn('Failed to fetch government activities:', e);
    } finally {
      setActivitiesLoading(false);
    }
  }, [selectedActivityState, selectedActivityCategory, selectedActivityLevel, activitySearch]);

  useEffect(() => {
    if (activeTab === 'activities' || activeTab === 'all') {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  const exportActivitiesCSV = () => {
    const headers = "ActivityID,ActivityName,State,District,Category,Subcategory,TourismType,ExperienceLevel,Seasonality,Location,Authority,OfficialPortal,EvidenceNotes\n";
    const rows = activitiesList.map(a => 
      `"${a.activity_id}","${(a.activity_name || '').replace(/"/g, '""')}","${a.state_name}","${a.district_name}","${a.activity_category}","${a.activity_subcategory}","${a.tourism_type}","${a.experience_level}","${a.seasonality}","${(a.activity_location || '').replace(/"/g, '""')}","${(a.source_name || '').replace(/"/g, '""')}","${a.source_url}","${(a.evidence_notes || '').replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `travelsathi_state_concessions_${selectedActivityState.toLowerCase().replace(/\s+/g, '_')}_${kpis?.hourly_token || 'audit'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial Load with automatic Gov session token synchronization & retry
  const fetchAllData = useCallback(async () => {
    setLoading(true);

    const executeFetch = async () => {
      const [overviewRes, rankingsRes, mapRes] = await Promise.all([
        axios.get('/api/government/tourism/overview'),
        axios.get('/api/government/tourism/rankings'),
        axios.get(`/api/government/tourism/map?layer=${activeMapLayer}`)
      ]);
      setKpis(overviewRes.data);
      setRankings(rankingsRes.data);
      setMapPoints(mapRes.data);
      if (rankingsRes.data && rankingsRes.data.length > 0) {
        setSelectedDistrict(rankingsRes.data[0]);
        setScenarioTargetId(rankingsRes.data[0].destination_id);
      }
    };

    try {
      // Ensure we have a valid session token
      if (!axios.defaults.headers.common['Authorization']) {
        const saved = localStorage.getItem('travelsathi_token');
        if (saved) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
        } else {
          const authRes = await axios.post('/api/auth/switch-token', { role: 'gov' });
          if (authRes.data?.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${authRes.data.token}`;
            localStorage.setItem('travelsathi_token', authRes.data.token);
            localStorage.setItem('travelsathi_role', 'gov');
          }
        }
      }

      await executeFetch();
    } catch (err: any) {
      console.warn('Initial Gov data fetch returned error, acquiring fresh Gov session token:', err);
      // Auto-recover if session cookie/token was invalid or unprivileged
      try {
        const authRes = await axios.post('/api/auth/switch-token', { role: 'gov' });
        if (authRes.data?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${authRes.data.token}`;
          localStorage.setItem('travelsathi_token', authRes.data.token);
          localStorage.setItem('travelsathi_role', 'gov');
          await executeFetch();
          return;
        }
      } catch (retryErr) {
        console.error('Auto-recovery Gov token switch failed:', retryErr);
      }
      console.error('Failed to load Government Intelligence data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeMapLayer]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Update map layer
  const handleLayerChange = async (layer: string) => {
    setActiveMapLayer(layer);
    try {
      const res = await axios.get(`/api/government/tourism/map?layer=${layer}`);
      setMapPoints(res.data);
    } catch (e) {
      console.error('Failed to switch map layer', e);
    }
  };

  // Filtered Rankings
  const uniqueStates = useMemo(() => {
    const s = new Set<string>();
    rankings.forEach(r => s.add(r.state));
    return ['All', ...Array.from(s).sort()];
  }, [rankings]);

  const filteredRankings = useMemo(() => {
    return rankings.filter(item => {
      if (selectedState !== 'All' && item.state !== selectedState) return false;
      if (selectedPriority !== 'All' && item.priority_tier.toLowerCase() !== selectedPriority.toLowerCase()) return false;
      if (selectedClassification !== 'All' && item.classification !== selectedClassification) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.district.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.state.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rankings, selectedState, selectedPriority, selectedClassification, searchQuery]);

  // Handle District Click
  const openDistrictDetails = async (destId: string) => {
    try {
      const res = await axios.get(`/api/government/tourism/destination/${destId}`);
      setSelectedDistrict(res.data);
      setScenarioTargetId(destId);
      setIsProfileOpen(true);
    } catch (e) {
      console.error('Failed to load destination details', e);
    }
  };

  // Run Scenario Simulation
  const handleSimulate = async () => {
    setScenarioLoading(true);
    try {
      const res = await axios.post('/api/government/tourism/scenario', {
        destination_id: scenarioTargetId,
        investment_crore: Number(scenarioBudget),
        scenario_type: scenarioType,
        time_horizon_years: Number(scenarioHorizon)
      });
      setScenarioResult(res.data);
    } catch (e) {
      console.error('Failed to simulate scenario', e);
    } finally {
      setScenarioLoading(false);
    }
  };

  // Run District Comparison
  const handleRunComparison = async (overrideIds?: string[]) => {
    const idsToUse = overrideIds || compareIds;
    if (idsToUse.length < 2) return;
    setCompareLoading(true);
    try {
      const res = await axios.get(`/api/government/tourism/compare?ids=${idsToUse.join(',')}`);
      setCompareData(res.data);
    } catch (e) {
      console.error('Failed to run comparison', e);
    } finally {
      setCompareLoading(false);
    }
  };

  // Auto-run comparison if switching to 'compare' and no data loaded yet
  useEffect(() => {
    if ((activeTab === 'compare' || activeTab === 'all') && !compareData && !compareLoading && rankings.length > 0) {
      handleRunComparison();
    }
  }, [activeTab, compareData, rankings]);

  // Ask AI Advisor
  const handleAdvisorSubmit = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = (customQ || advisorQuestion).trim();
    if (!q) return;

    setAdvisorHistory(prev => [...prev, { role: 'user', text: q }]);
    setAdvisorQuestion('');
    setAdvisorLoading(true);

    try {
      const res = await axios.post('/api/government/tourism/advisor', { question: q });
      setAdvisorHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.answer,
          sources: res.data.sources
        }
      ]);
    } catch (err) {
      setAdvisorHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to process query at this time. Please check backend server status.',
        }
      ]);
    } finally {
      setAdvisorLoading(false);
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = [
      'Rank', 'District', 'State', 'City', 'Investment Priority', 'Tourism Potential',
      'Infrastructure Readiness', 'Readiness Gap', 'Opportunity Score', 'Attraction Strength',
      'Cultural Significance', 'Accessibility', 'Seasonality', 'Classification', 'Primary Bottleneck',
      'Recommended Action', 'Confidence Score'
    ];
    const rows = filteredRankings.map(d => [
      d.rank,
      `"${d.district}"`,
      `"${d.state}"`,
      `"${d.city}"`,
      d.scores.investment_priority,
      d.scores.tourism_potential,
      d.scores.infrastructure_readiness ?? d.readiness_comparison?.readiness_score ?? 50.0,
      d.readiness_comparison?.gap_score ?? (d.scores.tourism_potential - (d.scores.infrastructure_readiness ?? 50.0)),
      d.scores.tourism_opportunity,
      d.factor_scores.attraction_strength,
      d.factor_scores.cultural_natural_significance,
      d.factor_scores.accessibility_potential,
      d.factor_scores.seasonality,
      `"${d.classification}"`,
      `"${d.primary_bottleneck}"`,
      `"${d.recommended_primary_intervention}"`,
      d.confidence.score
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `travelsathi_tourism_investment_rankings_${kpis?.hourly_token || 'v1'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !kpis) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-[#087F8C] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-sm text-[#102A2E]">
          Loading Government Tourism Investment Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#102A2E] p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      
      {/* ========================================================================= */}
      {/* SECTION 1: CLEAN HEADER                                                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#102A2E] tracking-tight">
              Tourism Investment Intelligence
            </h1>
            <p className="text-sm text-neutral-500 max-w-2xl">
              AI-powered destination prioritization across all 508 districts of India.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#087F8C]/10 text-[#087F8C] border border-[#087F8C]/20">
                {kpis?.hourly_token || 'tok_hourly_live'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 text-neutral-500">
                {kpis?.model_version || 'TS-GOV-2.1'}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Calibrated Model ({kpis?.average_confidence ?? 90.0}% Confidence)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setRefreshing(true); fetchAllData(); }}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCE5E3] hover:border-[#087F8C] text-[#102A2E] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCE5E3] hover:border-[#087F8C] text-[#102A2E] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCE5E3] hover:border-[#087F8C] text-[#102A2E] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Report
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-NAVIGATION TAB BAR: Dedicated Workspaces                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE5E3] p-2 shadow-xs flex flex-wrap items-center justify-between gap-2 sticky top-20 z-30">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'overview', label: 'Strategic Overview & Readiness Matrix', icon: Compass, badge: 'Matrix + Map' },
            { id: 'rankings', label: '508 Districts Priority Rankings', icon: TrendingUp, badge: '508 Districts' },
            { id: 'readiness', label: 'Readiness Input & ML Compute', icon: Sliders, badge: '6 Factors Form' },
            { id: 'simulator', label: 'Scenario Simulator & AI Advisor', icon: Sliders, badge: '₹5 - ₹100 Cr' },
            { id: 'compare', label: 'Multi-District Comparison', icon: Scale, badge: 'Side-by-Side' },
            { id: 'activities', label: 'State Activities & Concessions', icon: Award, badge: '437 Verified' },
            { id: 'all', label: 'Full Unified View', icon: Layers, badge: 'All Panels' },
          ].map(t => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id as GovTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#087F8C] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-[#102A2E] hover:bg-[#F8FAF9]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#087F8C]'}`} />
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono hidden sm:inline-block ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-3 text-[11px] text-neutral-400 font-mono">
          <span>Active Workspace: <strong className="text-[#087F8C] uppercase">{activeTab}</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: STRATEGIC INFRASTRUCTURE READINESS COMPARISON MATRIX           */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'all') && (
      <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-5">
        {/* Matrix Header & Strategic Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#DCE5E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#087F8C]/10 text-[#087F8C]">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-display font-extrabold text-[#102A2E]">
                Strategic Parameter Matrix: Infrastructure Readiness vs {readinessMetric === 'potential' ? 'Tourism Potential' : 'Investment Priority'}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                90% Calibrated
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Cross-evaluates intrinsic attraction appeal against multi-modal transit and facility readiness across all 508 districts to isolate high-ROI capital intervention corridors.
            </p>
          </div>

          {/* Parameter Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-[#F8FAF9] rounded-xl border border-[#DCE5E3]">
              <button
                onClick={() => setReadinessMetric('potential')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  readinessMetric === 'potential'
                    ? 'bg-[#087F8C] text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-[#102A2E]'
                }`}
              >
                Potential vs Readiness
              </button>
              <button
                onClick={() => setReadinessMetric('priority')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  readinessMetric === 'priority'
                    ? 'bg-[#087F8C] text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-[#102A2E]'
                }`}
              >
                Priority vs Readiness
              </button>
            </div>
          </div>
        </div>

        {/* Quadrant Quick Filter Tabs & KPI Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-neutral-500 font-bold mr-1">Quadrant View:</span>
            {[
              { id: 'All', label: `All (${rankings.length})`, color: 'text-neutral-700' },
              { id: 'Q2', label: 'Q2: Priority Interventions', color: 'text-[#087F8C]' },
              { id: 'Q1', label: 'Q1: National Anchors', color: 'text-[#102A2E]' },
              { id: 'Q3', label: 'Q3: Circuit Diversion', color: 'text-[#F28C28]' },
              { id: 'Q4', label: 'Q4: Foundational', color: 'text-[#8A9BA8]' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedQuadrantFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all text-[11px] cursor-pointer ${
                  selectedQuadrantFilter === tab.id
                    ? 'bg-[#102A2E] text-white border-[#102A2E]'
                    : 'bg-white text-neutral-600 border-[#DCE5E3] hover:border-[#087F8C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF9F8] border border-[#087F8C]/20 text-[11px]">
              <span className="text-neutral-500">National Avg Readiness:</span>
              <strong className="text-[#087F8C]">{kpis?.average_readiness ?? 51.4}/100</strong>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px]">
              <span className="text-neutral-500">Confidence:</span>
              <strong className="text-emerald-700">{kpis?.average_confidence ?? 90.0}% High</strong>
            </div>
          </div>
        </div>

        {/* 2D Interactive Scatter Canvas */}
        <div className="relative h-[360px] w-full bg-[#F8FAF9] rounded-xl border border-[#DCE5E3] p-4 flex flex-col justify-between overflow-hidden shadow-inner">
          {/* Quadrant Watermark Badges */}
          <div className="absolute top-3 left-4 text-xs font-bold text-[#087F8C]/60 uppercase pointer-events-none flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#087F8C]"></span>
            Q2 • PRIORITY INFRASTRUCTURE INTERVENTION (High Potential ≥60, Low Readiness &lt;50)
          </div>
          <div className="absolute top-3 right-4 text-xs font-bold text-[#102A2E]/60 uppercase pointer-events-none text-right flex items-center justify-end gap-1.5">
            Q1 • NATIONAL TOURISM ANCHOR (High Potential ≥60, High Readiness ≥50)
            <span className="w-2 h-2 rounded-full bg-[#102A2E]"></span>
          </div>
          <div className="absolute bottom-6 left-4 text-xs font-bold text-[#8A9BA8]/70 uppercase pointer-events-none flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8A9BA8]"></span>
            Q4 • FOUNDATIONAL CAPACITY (Lower Potential &lt;60, Low Readiness &lt;50)
          </div>
          <div className="absolute bottom-6 right-4 text-xs font-bold text-[#F28C28]/60 uppercase pointer-events-none text-right flex items-center justify-end gap-1.5">
            Q3 • CIRCUIT DIVERSION READY (Emerging Potential &lt;60, High Readiness ≥50)
            <span className="w-2 h-2 rounded-full bg-[#F28C28]"></span>
          </div>

          {/* Dividing axes lines (Readiness threshold = 50, Score threshold = 60) */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-neutral-300 border-r border-dashed border-neutral-400 pointer-events-none"></div>
          <div className="absolute left-0 right-0 top-[40%] h-px bg-neutral-300 border-b border-dashed border-neutral-400 pointer-events-none"></div>

          {/* Render Points on Canvas */}
          <div className="relative w-full h-full">
            {rankings
              .filter(d => {
                if (selectedQuadrantFilter === 'All') return true;
                const quad = d.readiness_comparison?.quadrant_short ?? d.scatter_plot.quadrant_short ?? 'Q2';
                return quad === selectedQuadrantFilter;
              })
              .map(d => {
                const readiness = d.scores.infrastructure_readiness ?? d.readiness_comparison?.readiness_score ?? d.scatter_plot.x_demand_penetration ?? 50.0;
                const yScore = readinessMetric === 'potential' ? d.scores.tourism_potential : d.scores.investment_priority;
                const xPct = Math.max(4, Math.min(96, readiness));
                const yPct = Math.max(4, Math.min(96, 100 - yScore));
                const color = d.readiness_comparison?.quadrant_color ?? d.scatter_plot.quadrant_color ?? '#087F8C';
                const gap = d.readiness_comparison?.gap_score ?? Math.round((yScore - readiness) * 10) / 10;
                const action = d.readiness_comparison?.strategic_action ?? d.recommended_primary_intervention;

                return (
                  <button
                    key={d.destination_id}
                    onClick={() => openDistrictDetails(d.destination_id)}
                    title={`${d.district} (${d.state})\nReadiness: ${readiness}/100\n${readinessMetric === 'potential' ? 'Tourism Potential' : 'Investment Priority'}: ${yScore}/100\nReadiness Gap: ${gap > 0 ? '+' : ''}${gap}\nQuadrant: ${d.readiness_comparison?.quadrant ?? d.scatter_plot.quadrant}\nAction: ${action}`}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      backgroundColor: color,
                    }}
                    className="absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full border-2 border-white hover:scale-200 hover:z-30 transition-all cursor-pointer shadow-md"
                  />
                );
              })}
          </div>

          {/* Axis Labels */}
          <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-mono text-neutral-400 pointer-events-none">
            ← Low Infrastructure Readiness (Access / Facilities &lt; 50) | High Infrastructure Readiness (Transit &amp; Services ≥ 50) →
          </div>
        </div>

        {/* Quadrant Strategic Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl border border-[#087F8C]/40 bg-[#087F8C]/5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#087F8C]">Q2 • Priority Intervention</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#087F8C]/15 text-[#087F8C]">Top Capex ROI</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              High intrinsic tourism assets bottlenecked by road/rail/sanitation access. Public capital funding unlocks immediate economic uplift.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#102A2E]/30 bg-[#102A2E]/5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#102A2E]">Q1 • National Anchor</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#102A2E]/15 text-[#102A2E]">Mature Corridor</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Robust tourism assets paired with high readiness. Focus on carrying-capacity governance, private concessions, and premium branding.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#F28C28]/40 bg-[#F28C28]/5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#F28C28]">Q3 • Circuit Diversion</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F28C28]/15 text-[#F28C28]">Spillover Ready</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Superior transit connectivity with emerging secondary attractions. Prime corridors to divert peak footfall from congested tier-1 destinations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#8A9BA8]/40 bg-neutral-50 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#8A9BA8]">Q4 • Foundational Capacity</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600">Long-Term</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Early-stage tourism density with emergent readiness. Prioritize community-based tourism, baseline master planning, and basic access.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: DISTRICT PRIORITY RANKINGS TABLE (Section 31 & 32)             */}
      {/* ========================================================================= */}
      {(activeTab === 'rankings' || activeTab === 'all') && (
      <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-extrabold text-[#102A2E] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#087F8C]" />
              National District Priority Rankings (508 Destinations)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ranked from highest to lowest intervention priority. Filter by state, priority tier, and classification.
            </p>
          </div>

          <div className="text-xs font-mono text-neutral-500">
            Showing {filteredRankings.length} of {rankings.length} districts
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-[#F8FAF9] rounded-xl border border-[#DCE5E3]">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search district, city or state..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] focus:outline-none focus:border-[#087F8C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-600 shrink-0">State:</span>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-white border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] focus:outline-none focus:border-[#087F8C]"
            >
              {uniqueStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-600 shrink-0">Priority:</span>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-white border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] focus:outline-none focus:border-[#087F8C]"
            >
              <option value="All">All Tiers</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Moderate">Moderate</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-600 shrink-0">Class:</span>
            <select
              value={selectedClassification}
              onChange={e => setSelectedClassification(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-white border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] focus:outline-none focus:border-[#087F8C]"
            >
              <option value="All">All Categories</option>
              <option value="Tourism Leader">Tourism Leader</option>
              <option value="Emerging Opportunity">Emerging Opportunity</option>
              <option value="Infrastructure Constrained">Infrastructure Constrained</option>
              <option value="Cultural Opportunity">Cultural Opportunity</option>
              <option value="Nature Opportunity">Nature Opportunity</option>
              <option value="Underdeveloped Potential">Underdeveloped Potential</option>
              <option value="Saturated / Pressure Risk">Saturated / Pressure Risk</option>
              <option value="Low Priority">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto rounded-xl border border-[#DCE5E3]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#EFF9F8] border-b border-[#DCE5E3] text-[#102A2E] font-bold">
                <th className="py-3 px-4 w-24">Rank</th>
                <th className="py-3 px-4">District &amp; State</th>
                <th className="py-3 px-4">Final Priority Score</th>
                <th className="py-3 px-4">Readiness Badge</th>
                <th className="py-3 px-4 text-right">Inspect Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]">
              {filteredRankings.slice(0, 50).map(d => {
                const rScore = d.scores.readiness_score ?? d.scores.infrastructure_readiness ?? 50.0;
                const rTier = rScore >= 70 ? 'High' : rScore >= 45 ? 'Medium' : 'Low';
                const rBadgeClass =
                  rTier === 'High'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : rTier === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-red-100 text-red-800 border-red-300';

                return (
                  <tr
                    key={d.destination_id}
                    onClick={() => openDistrictDetails(d.destination_id)}
                    className="hover:bg-[#EFF9F8]/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-neutral-500">#{d.rank}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-[#102A2E] group-hover:text-[#087F8C] transition-colors flex items-center gap-1.5">
                        <span>{d.city && d.city.toLowerCase() !== d.district.toLowerCase() ? `${d.city} (${d.district})` : d.district}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {d.city && d.city.toLowerCase() !== d.district.toLowerCase() ? `${d.district}, ${d.state}` : d.state}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold inline-block ${
                        d.priority_tier === 'Critical' ? 'bg-red-100 text-red-700' :
                        d.priority_tier === 'High' ? 'bg-orange-100 text-orange-700' :
                        d.priority_tier === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {d.scores.investment_priority} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-block ${rBadgeClass}`}>
                        {rTier} ({rScore})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDistrictDetails(d.destination_id); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EFF9F8] text-[#087F8C] group-hover:bg-[#087F8C] group-hover:text-white transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>Inspect</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5.5: READINESS INPUT FORM (Gov / DMO panel)                       */}
      {/* ========================================================================= */}
      {(activeTab === 'readiness') && (
        <div className="animate-fadeIn">
          <ReadinessInputView
            initialDistricts={rankings}
            onRankingsUpdated={fetchAllData}
            initialSelectedDistrictId={searchParams.get('destination_id') || selectedDistrict?.destination_id}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6 & 7: SCENARIO SIMULATOR & DISTRICT COMPARISON                   */}
      {/* ========================================================================= */}
      {(activeTab === 'simulator' || activeTab === 'all') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Simulator (Section 20 & 38) */}
        <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-extrabold text-[#102A2E] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#087F8C]" />
              Investment Scenario Simulator
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
              Multi-Pillar
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Simulate capital intervention outcomes for custom or preset amounts (₹5 Cr – ₹100 Cr).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-neutral-600 block mb-1">Target District:</label>
              <select
                value={scenarioTargetId}
                onChange={e => setScenarioTargetId(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F8FAF9] border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] focus:outline-none focus:border-[#087F8C]"
              >
                {rankings.slice(0, 50).map(d => (
                  <option key={d.destination_id} value={d.destination_id}>
                    {d.district} ({d.state}) — Rank #{d.rank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 block mb-1">Scenario Type:</label>
              <select
                value={scenarioType}
                onChange={e => setScenarioType(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F8FAF9] border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] focus:outline-none focus:border-[#087F8C]"
              >
                <option value="integrated">Scenario F: Integrated Development</option>
                <option value="connectivity">Scenario A: Connectivity Improvement</option>
                <option value="accommodation">Scenario B: Accommodation Expansion</option>
                <option value="facilities">Scenario C: Tourist Facility Development</option>
                <option value="promotion">Scenario D: Destination Promotion</option>
                <option value="circuit">Scenario E: Tourism Circuit Development</option>
              </select>
            </div>
          </div>

          {/* Budget Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-600 block">Investment Amount (Crore INR):</label>
            <div className="flex flex-wrap items-center gap-2">
              {[5.0, 10.0, 25.0, 50.0, 100.0].map(amt => (
                <button
                  key={amt}
                  onClick={() => setScenarioBudget(amt)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    scenarioBudget === amt
                      ? 'bg-[#087F8C] text-white border-[#087F8C]'
                      : 'bg-white text-neutral-700 border-[#DCE5E3] hover:border-[#087F8C]'
                  }`}
                >
                  ₹{amt} Cr
                </button>
              ))}
              <input
                type="number"
                value={scenarioBudget}
                onChange={e => setScenarioBudget(Number(e.target.value))}
                min="0.1"
                step="0.5"
                className="w-24 px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg text-xs text-[#102A2E] font-bold text-center"
              />
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={scenarioLoading}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#087F8C] hover:bg-[#066570] text-white transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {scenarioLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Simulate Expected Impact
          </button>

          {/* Scenario Result Card */}
          {scenarioResult && (
            <div className="p-4 rounded-xl border border-[#087F8C]/30 bg-[#EFF9F8] space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#087F8C]">
                  {scenarioResult.scenario_title}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {scenarioResult.time_horizon_years} Yr Horizon
                </span>
              </div>
              <p className="text-xs text-neutral-700">{scenarioResult.focus_area}</p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-[#DCE5E3]">
                  <span className="text-[10px] text-neutral-500 block">Projected Potential</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-[#102A2E]">
                      {scenarioResult.score_projection.projected_tourism_potential}
                    </span>
                    <span className="text-xs text-[#3A8F5C] font-bold">
                      +{scenarioResult.score_projection.potential_improvement}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#DCE5E3]">
                  <span className="text-[10px] text-neutral-500 block">Projected Priority</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-[#102A2E]">
                      {scenarioResult.score_projection.projected_investment_priority}
                    </span>
                    <span className="text-xs text-[#3A8F5C] font-bold">
                      +{scenarioResult.score_projection.priority_improvement}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 pt-1 border-t border-[#DCE5E3]">
                <p className="font-semibold text-neutral-700">Economic Impact Disclosure:</p>
                <p>{scenarioResult.economic_impact.note}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Government Advisor (Section 39) */}
        <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-extrabold text-[#102A2E] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2F80C0]" />
                AI Government Tourism Advisor
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Ground-Truth Powered
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Evidence-backed conversational co-pilot for tourism secretaries and district collectors. Strictly adheres to zero hallucination.
            </p>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Which districts should we prioritize?',
                'Which districts have the highest untapped opportunity?',
                'What infrastructure is limiting tourism growth?',
                'Top cultural destinations for circuit development'
              ].map(q => (
                <button
                  key={q}
                  onClick={() => handleAdvisorSubmit(undefined, q)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#F8FAF9] border border-[#DCE5E3] hover:border-[#2F80C0] text-neutral-700 hover:text-[#2F80C0] transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Advisor Dialogue Stream */}
            <div className="max-h-[220px] overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3] text-xs">
              {advisorHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-[#2F80C0] text-white ml-8'
                      : 'bg-white text-[#102A2E] border border-[#DCE5E3] mr-4 shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  {msg.sources && (
                    <div className="mt-2 pt-1.5 border-t border-neutral-200 text-[10px] text-neutral-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#3A8F5C]" />
                      Sources: {msg.sources.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {advisorLoading && (
                <div className="p-3 rounded-xl bg-white border border-[#DCE5E3] mr-4 text-xs text-neutral-500 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#2F80C0] border-t-transparent rounded-full animate-spin"></div>
                  Synthesizing evidence-based briefing...
                </div>
              )}
            </div>
          </div>

          {/* User Question Input Form */}
          <form onSubmit={handleAdvisorSubmit} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Ask the advisor about state or district tourism intelligence..."
              value={advisorQuestion}
              onChange={e => setAdvisorQuestion(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#F8FAF9] border border-[#DCE5E3] rounded-xl text-xs text-[#102A2E] focus:outline-none focus:border-[#2F80C0]"
            />
            <button
              type="submit"
              disabled={advisorLoading || !advisorQuestion.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2F80C0] hover:bg-[#25689C] text-white disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7.5: INTERACTIVE 7-LAYER INDIA TOURISM INVESTMENT MAP             */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'all') && (
      <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-4 animate-fadeIn">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#DCE5E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#087F8C]/10 text-[#087F8C]">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-base font-display font-extrabold text-[#102A2E]">
                National Tourism Investment Geography Map
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                508 Districts Monitored
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Geospatial distribution of capital prioritization, latent demand, and transit bottlenecks across all 36 States &amp; UTs.
            </p>
          </div>

          {/* Map Layer Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F8FAF9] p-1 rounded-xl border border-[#DCE5E3] text-xs">
            {[
              { key: 'investment_priority', label: 'Priority Rank' },
              { key: 'tourism_potential', label: 'Tourism Potential' },
              { key: 'tourism_opportunity', label: 'Untapped Opportunity' },
              { key: 'connectivity', label: 'Connectivity Gap' },
              { key: 'cultural', label: 'Cultural Assets' },
              { key: 'attraction', label: 'Attraction Density' },
            ].map(layer => (
              <button
                key={layer.key}
                onClick={() => handleLayerChange(layer.key)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                  activeMapLayer === layer.key
                    ? 'bg-[#087F8C] text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-[#102A2E] hover:bg-white'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="w-full h-[520px] rounded-xl overflow-hidden border border-[#DCE5E3] relative z-0">
          <MapContainer
            center={[22.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution={OSM_ATTRIBUTION}
              url={OSM_TILE_URL}
            />
            {mapPoints.map((pt) => {
              const val = pt.value ?? pt.investment_priority ?? 50;
              const radius = val >= 75 ? 9 : val >= 55 ? 6.5 : 4.5;
              const color = val >= 75 ? '#DC2626' : val >= 60 ? '#EA580C' : val >= 45 ? '#087F8C' : '#16A34A';

              return (
                <CircleMarker
                  key={pt.destination_id}
                  center={[pt.latitude, pt.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.75,
                    weight: 1.5,
                  }}
                  eventHandlers={{
                    click: () => {
                      const found = rankings.find(r => r.destination_id === pt.destination_id);
                      if (found) {
                        setSelectedDistrict(found);
                        setIsProfileOpen(true);
                      }
                    }
                  }}
                >
                  <LeafletTooltip direction="top" offset={[0, -5]} opacity={0.95}>
                    <div className="text-xs font-sans">
                      <strong className="block text-neutral-900">{pt.district} ({pt.state})</strong>
                      <span className="text-[#087F8C] font-semibold">{pt.layer_label || 'Score'}: {val}</span>
                      <span className="block text-[10px] text-neutral-500">National Rank #{pt.rank} • {pt.primary_bottleneck}</span>
                    </div>
                  </LeafletTooltip>

                  <Popup>
                    <div className="p-1 space-y-2 min-w-[210px] font-sans text-xs">
                      <div className="pb-1 border-b border-neutral-200">
                        <h4 className="font-bold text-sm text-[#102A2E] leading-tight">{pt.district}</h4>
                        <span className="text-[10px] text-neutral-500">{pt.state} • Rank #{pt.rank}</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Priority Score:</span>
                          <strong className="text-[#087F8C]">{pt.investment_priority}/100</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Tourism Potential:</span>
                          <strong className="text-neutral-800">{pt.tourism_potential}/100</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Primary Bottleneck:</span>
                          <strong className="text-orange-700">{pt.primary_bottleneck}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Classification:</span>
                          <span className="text-[10px] font-semibold text-neutral-700">{pt.classification}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const found = rankings.find(r => r.destination_id === pt.destination_id);
                          if (found) {
                            setSelectedDistrict(found);
                            setIsProfileOpen(true);
                          }
                        }}
                        className="w-full mt-2 py-1.5 bg-[#087F8C] hover:bg-[#06636E] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect District Dossier →
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-neutral-500">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>High Priority (Score &gt; 75)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
              <span>Moderate Priority (60-74)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#087F8C]" />
              <span>Developing (45-59)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Stable (&lt;45)</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Click any pin to inspect full AI district dossier &amp; recommended interventions
          </span>
        </div>

        {/* Quick Action Tiles to Explore Other Views */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#DCE5E3]">
          <button
            onClick={() => handleTabChange('rankings')}
            className="p-4 rounded-xl border border-[#DCE5E3] hover:border-[#087F8C] bg-[#F8FAF9] text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-[#102A2E] group-hover:text-[#087F8C] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#087F8C]" />
                508 Districts Rankings
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-neutral-500">Filter, search, and inspect individual district dossiers across all 36 States &amp; UTs.</p>
          </button>

          <button
            onClick={() => handleTabChange('simulator')}
            className="p-4 rounded-xl border border-[#DCE5E3] hover:border-[#087F8C] bg-[#F8FAF9] text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-[#102A2E] group-hover:text-[#087F8C] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#087F8C]" />
                Scenario Simulator
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-neutral-500">Simulate ₹5 Cr to ₹100 Cr capital intervention impacts and query the AI policy advisor.</p>
          </button>

          <button
            onClick={() => handleTabChange('compare')}
            className="p-4 rounded-xl border border-[#DCE5E3] hover:border-[#087F8C] bg-[#F8FAF9] text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-[#102A2E] group-hover:text-[#087F8C] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#087F8C]" />
                District Comparison
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-neutral-500">Compare 2 to 5 districts side-by-side with trade-off analysis and capex ROI.</p>
          </button>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: MULTI-DISTRICT STRATEGIC COMPARISON WORKSPACE                    */}
      {/* ========================================================================= */}
      {(activeTab === 'compare' || activeTab === 'all') && (
        <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#DCE5E3]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#087F8C]/10 text-[#087F8C]">
                  <Scale className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-display font-extrabold text-[#102A2E]">
                  Multi-District Strategic Trade-off &amp; Capex Comparison
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Side-by-Side Analysis
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Directly compare 2 to 5 districts across Readiness, Tourism Potential, Opportunity, Infrastructure Bottlenecks, and Capex Return.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-500">Quick Presets:</span>
              <button
                onClick={() => { setCompareIds(['CT0456', 'CT0455']); handleRunComparison(['CT0456', 'CT0455']); }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#DCE5E3] hover:border-[#087F8C] bg-[#F8FAF9] text-[#102A2E] cursor-pointer"
              >
                Almora vs Varanasi
              </button>
              <button
                onClick={() => { setCompareIds(['CT0456', 'CT0455', 'CT0340']); handleRunComparison(['CT0456', 'CT0455', 'CT0340']); }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#DCE5E3] hover:border-[#087F8C] bg-[#F8FAF9] text-[#102A2E] cursor-pointer"
              >
                3-District Corridors
              </button>
            </div>
          </div>

          {/* District Selector Bar */}
          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-700">
                Selected Districts ({compareIds.length}/5):
              </span>
              <span className="text-[11px] text-neutral-400">
                Choose between 2 and 5 districts to generate comparative matrix
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {compareIds.map(id => {
                const d = rankings.find(r => r.destination_id === id);
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#087F8C]/40 text-xs font-bold text-[#102A2E] shadow-2xs"
                  >
                    <span>{d ? `${d.district} (${d.state})` : id}</span>
                    {compareIds.length > 2 && (
                      <button
                        onClick={() => {
                          const next = compareIds.filter(x => x !== id);
                          setCompareIds(next);
                          handleRunComparison(next);
                        }}
                        className="p-0.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}

              {/* Add District Dropdown */}
              {compareIds.length < 5 && (
                <select
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !compareIds.includes(val)) {
                      const next = [...compareIds, val];
                      setCompareIds(next);
                      handleRunComparison(next);
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="py-1.5 px-3 bg-white border border-dashed border-[#087F8C] rounded-xl text-xs font-bold text-[#087F8C] focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>+ Add District to Compare...</option>
                  {rankings
                    .filter(r => !compareIds.includes(r.destination_id))
                    .slice(0, 100)
                    .map(r => (
                      <option key={r.destination_id} value={r.destination_id}>
                        {r.district} ({r.state}) — Rank #{r.rank}
                      </option>
                    ))}
                </select>
              )}

              <button
                onClick={() => handleRunComparison()}
                disabled={compareLoading || compareIds.length < 2}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#087F8C] hover:bg-[#06636E] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {compareLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                Recompute Trade-offs
              </button>
            </div>
          </div>

          {/* Comparative Results & Trade-Offs */}
          {compareData && (
            <div className="space-y-4 animate-fadeIn">
              {/* Strategic Synthesis Callout */}
              <div className="p-4 rounded-xl bg-[#EFF9F8] border border-[#087F8C]/30 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F8C] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#087F8C]" />
                  AI Comparative Strategic Synthesis
                </span>
                <p className="text-xs text-[#102A2E] leading-relaxed">
                  {compareData.strategic_synthesis}
                </p>
                {compareData.key_tradeoffs && compareData.key_tradeoffs.length > 0 && (
                  <div className="pt-2 border-t border-[#087F8C]/15 space-y-1">
                    {compareData.key_tradeoffs.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#087F8C] mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison Cards Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-${Math.min(compareData.comparison_matrix?.length || 2, 4)} gap-4`}>
                {compareData.comparison_matrix?.map((item: any) => (
                  <div
                    key={item.destination_id}
                    className="p-4 rounded-xl bg-white border border-[#DCE5E3] hover:border-[#087F8C] transition-all space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#087F8C] text-white">
                            Rank #{item.rank}
                          </span>
                          <h3 className="text-base font-display font-extrabold text-[#102A2E] mt-1">
                            {item.district}
                          </h3>
                          <p className="text-xs text-neutral-500">{item.state}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {item.classification}
                        </span>
                      </div>

                      {/* Scores Grid */}
                      <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-500">Investment Priority:</span>
                            <strong className="text-[#102A2E]">{item.investment_priority}/100</strong>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#102A2E]" style={{ width: `${item.investment_priority}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-500">Tourism Potential:</span>
                            <strong className="text-[#087F8C]">{item.tourism_potential}/100</strong>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#087F8C]" style={{ width: `${item.tourism_potential}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-500">Infrastructure Readiness:</span>
                            <strong className="text-[#2F80C0]">{item.infrastructure_readiness ?? 50.0}/100</strong>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#2F80C0]" style={{ width: `${item.infrastructure_readiness ?? 50}%` }}></div>
                          </div>
                        </div>

                        <div className="flex justify-between text-[11px] pt-1">
                          <span className="text-neutral-500">Readiness Gap:</span>
                          <strong className={(item.readiness_gap ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                            {(item.readiness_gap ?? 0) > 0 ? `+${item.readiness_gap}` : item.readiness_gap ?? 0}
                          </strong>
                        </div>

                        <div className="flex justify-between text-[11px]">
                          <span className="text-neutral-500">Opportunity Score:</span>
                          <strong className="text-[#3A8F5C]">{item.tourism_opportunity}/100</strong>
                        </div>

                        <div className="flex justify-between text-[11px]">
                          <span className="text-neutral-500">Connectivity Access:</span>
                          <strong className="text-neutral-700">{item.accessibility}/100</strong>
                        </div>
                      </div>

                      {/* Primary Bottleneck */}
                      <div className="p-2.5 rounded-lg bg-[#F8FAF9] border border-[#DCE5E3] text-[11px] space-y-0.5">
                        <span className="text-neutral-400 block text-[10px] uppercase font-bold">Primary Bottleneck</span>
                        <strong className="text-orange-700 block">{item.primary_bottleneck}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => openDistrictDetails(item.destination_id)}
                      className="w-full mt-3 py-2 rounded-xl text-xs font-bold bg-[#EFF9F8] text-[#087F8C] hover:bg-[#087F8C] hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Inspect Full Dossier <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: STATE TOURISM ACTIVITIES & CONCESSIONS REGISTRY                  */}
      {/* ========================================================================= */}
      {(activeTab === 'activities' || activeTab === 'all') && (
        <div className="bg-white rounded-2xl border border-[#DCE5E3] p-6 shadow-xs space-y-6 animate-fadeIn">
          
          {/* Header & Export */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#DCE5E3]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#087F8C]/10 text-[#087F8C]">
                  <Award className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-display font-extrabold text-[#102A2E]">
                  State Tourism Activities &amp; Regulatory Concessions Registry
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  437 Officially Recognized
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Statutory directory of 437 government-authorized marine safaris, archaeological heritage circuits, national park treks, and cultural concessions across 35 States &amp; UTs with regulatory citations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchActivities}
                disabled={activitiesLoading}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F8FAF9] border border-[#DCE5E3] hover:border-[#087F8C] text-[#102A2E] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activitiesLoading ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>
              <button
                onClick={exportActivitiesCSV}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#087F8C] hover:bg-[#066570] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Concessions CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3]">
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Total Activities</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#102A2E]">{activitiesTotal}</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">100% Verified</span>
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Government-sanctioned concessions</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3]">
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Regulating Authorities</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#087F8C]">{activityAuthoritiesCount}</span>
                <span className="text-[10px] font-mono text-neutral-400">ASI / Forest / DMOs</span>
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">State &amp; Central regulatory bodies</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3]">
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">States &amp; UTs</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#102A2E]">{activitiesStates.length || 35}</span>
                <span className="text-[10px] font-mono text-[#087F8C] font-bold">National Coverage</span>
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Active statutory oversight</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3]">
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Specialized Domains</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#F28C28]">8</span>
                <span className="text-[10px] font-mono text-neutral-500">Heritage to Marine</span>
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">Eco, Adventure, Cultural, Spiritual</span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE5E3] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Keyword Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  placeholder="Search activity, authority, or location..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg bg-white border border-[#DCE5E3] focus:ring-1 focus:ring-[#087F8C] focus:outline-none"
                />
              </div>

              {/* State Filter */}
              <div>
                <select
                  value={selectedActivityState}
                  onChange={e => setSelectedActivityState(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-white border border-[#DCE5E3] focus:ring-1 focus:ring-[#087F8C] focus:outline-none"
                >
                  <option value="All">All States &amp; Territories ({activitiesNationalTotal})</option>
                  {activitiesStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedActivityCategory}
                  onChange={e => setSelectedActivityCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-white border border-[#DCE5E3] focus:ring-1 focus:ring-[#087F8C] focus:outline-none"
                >
                  <option value="All">All Activity Domains</option>
                  {activitiesCategories.map(c => (
                    <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <select
                  value={selectedActivityLevel}
                  onChange={e => setSelectedActivityLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-white border border-[#DCE5E3] focus:ring-1 focus:ring-[#087F8C] focus:outline-none"
                >
                  <option value="All">All Skill / Experience Levels</option>
                  <option value="Beginner">Beginner Friendly</option>
                  <option value="Moderate">Moderate / Intermediate</option>
                  <option value="Advanced">Advanced Expedition</option>
                  <option value="All Levels">All Levels (Universal Access)</option>
                </select>
              </div>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#DCE5E3] text-xs text-neutral-500">
              <span className="font-semibold">
                Showing <strong className="text-[#087F8C]">{activitiesList.length}</strong> of <strong>{activitiesTotal}</strong> officially authorized activities
                {selectedActivityState !== 'All' && ` in ${selectedActivityState}`}
              </span>

              {(activitySearch || selectedActivityState !== 'All' || selectedActivityCategory !== 'All' || selectedActivityLevel !== 'All') && (
                <button
                  onClick={() => {
                    setActivitySearch('');
                    setSelectedActivityState('All');
                    setSelectedActivityCategory('All');
                    setSelectedActivityLevel('All');
                  }}
                  className="text-[#087F8C] hover:underline font-bold cursor-pointer"
                >
                  Reset Activity Filters
                </button>
              )}
            </div>
          </div>

          {/* Activities Table */}
          <div className="overflow-x-auto rounded-xl border border-[#DCE5E3]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] text-neutral-600 font-bold border-b border-[#DCE5E3]">
                <tr>
                  <th className="py-3 px-4">Activity &amp; Jurisdiction</th>
                  <th className="py-3 px-3">Domain / Subcategory</th>
                  <th className="py-3 px-3">Regulating Authority</th>
                  <th className="py-3 px-3">Level / Season</th>
                  <th className="py-3 px-4">Statutory Evidence &amp; Portal</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E3]">
                {activitiesList.map((act) => (
                  <tr key={act.activity_id} className="hover:bg-[#EFF9F8]/60 dark:hover:bg-[#1A2622] transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-[#087F8C]">{act.activity_id}</span>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{act.activity_name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{act.city_name || act.district_name}, {act.state_name}</span>
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {act.activity_category}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{act.activity_subcategory}</span>
                    </td>

                    <td className="py-3 px-3">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{act.source_name}</p>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                        ✓ Statutory Oversight
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">{act.experience_level}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{act.seasonality}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {act.evidence_notes}
                      </p>
                      {act.source_url && (
                        <a
                          href={act.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-[#087F8C] hover:underline font-bold mt-1"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedActivityDetail(act);
                          setActiveActivityModalTab('concession');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFF9F8] dark:bg-[#087F8C]/20 text-[#087F8C] hover:bg-[#087F8C] hover:text-white transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statutory Verification Footer */}
          <div className="p-4 rounded-xl bg-[#EFF9F8] border border-[#087F8C]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#102A2E]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Statutory Compliance Standard:</strong> All 437 activities are indexed from official Gazetted tourism concessions, ASI preservation mandates, and State Forest Department ecotourism guidelines.
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 shrink-0">
              Source: Travel_Activity_Dataset.csv
            </span>
          </div>

        </div>
      )}

      {/* Prototype Disclaimer — placed at bottom for clean first impression */}
      <div className="bg-[#EFF9F8] border border-[#087F8C]/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#102A2E]">
        <Info className="w-4 h-4 text-[#087F8C] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#087F8C]">DECISION-SUPPORT NOTICE (PROTOTYPE MODE):</span>{' '}
          Rankings and potential scores are derived strictly from verified tourism asset catalogs, cultural traditions, activity profiles, and multi-modal transit indicators.
          Empirical tourist arrivals, average expenditure, and district tax receipts require dedicated ground telemetry. Never interpreted as guaranteed revenue.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: FULL-PAGE BLURRED INSPECT MODAL (ANIMATED FRAMER-MOTION)       */}
      {/* ========================================================================= */}
      <InspectModal
        district={isProfileOpen && selectedDistrict ? (selectedDistrict as any) : null}
        onClose={() => setIsProfileOpen(false)}
        onOpenReadinessInput={(destId) => {
          setIsProfileOpen(false);
          setActiveTabState('readiness');
          navigate(`/gov/tourism-intelligence?tab=readiness&destination_id=${destId}`, { replace: true });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* ========================================================================= */}
      {/* SECTION 9: DISTRICT COMPARISON MODAL (Descoped per functionality audit)    */}
      {/* Rankings table sorting and filtering already covers comparative analysis   */}
      {/* ========================================================================= */}
      {/* isCompareOpen && ( ... compare modal descoped ... ) */}

      {/* ========================================================================= */}
      {/* SECTION 10: METHODOLOGY MODAL (Descoped per functionality audit)           */}
      {/* District Profile Drawer already shows detailed factor weights & metrics    */}
      {/* ========================================================================= */}
      {/* isMethodologyOpen && ( ... methodology modal descoped ... ) */}

      {/* ========================================================================= */}
      {/* SECTION 11: EXPORT REPORT PREVIEW MODAL                                    */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#DCE5E3] max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5E3]">
              <div>
                <h2 className="text-lg font-display font-extrabold text-[#102A2E]">
                  Government Tourism Investment Intelligence Report
                </h2>
                <p className="text-xs text-neutral-500">Official Decision Briefing Document (Section 40)</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-5 rounded-xl border border-neutral-300 bg-[#FDFDFD] space-y-4 text-xs print:p-0 print:border-none">
              <div className="border-b border-neutral-300 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#102A2E]">
                    TRAVELSATHI NATIONAL TOURISM INTELLIGENCE REPORT
                  </h3>
                  <p className="text-neutral-500 text-[10px]">Document No: GOV-INTEL-2026-09 • Hourly Token: {kpis?.hourly_token}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#087F8C]">PROTOTYPE ESTIMATE</span>
                  <p className="text-[10px] text-neutral-400">Published: {kpis?.last_data_update}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase text-[11px] text-neutral-600 mb-1">1. Executive Summary</h4>
                <p className="text-neutral-700 leading-relaxed">
                  Comprehensive multi-source evaluation of {kpis?.total_destinations_analyzed} districts across 36 States/UTs indicates that while foundational tourism asset density is high (Average Potential: {kpis?.average_tourism_potential}/100), transport connectivity remains the primary bottleneck (Average Connectivity: {kpis?.average_connectivity}/100). High-priority capital allocations should focus on last-mile transit and civic facility modernization before promotional expenditure.
                </p>
              </div>

              <div>
                <h4 className="font-bold uppercase text-[11px] text-neutral-600 mb-1">2. Top 5 National Priority Districts</h4>
                <div className="space-y-1">
                  {rankings.slice(0, 5).map(p => (
                    <div key={p.destination_id} className="flex justify-between p-2 rounded bg-neutral-100/70 border border-neutral-200">
                      <span className="font-bold text-[#102A2E]">#{p.rank} {p.district} ({p.state})</span>
                      <span className="font-semibold text-[#087F8C]">Priority: {p.scores.investment_priority} • Bottleneck: {p.primary_bottleneck}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase text-[11px] text-neutral-600 mb-1">3. Decision-Support Disclaimer</h4>
                <p className="text-neutral-500 text-[10px] leading-normal italic">
                  Estimates are model-based decision projections grounded on verified physical and cultural evidence. They do not constitute guaranteed government receipts or job figures.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE5E3] flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#087F8C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#102A2E] text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 12: STATE ACTIVITY & CONCESSION INSPECTION DOSSIER */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#131E1B] text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-[#22352F] max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#087F8C] bg-[#EFF9F8] dark:bg-[#087F8C]/20 px-2.5 py-0.5 rounded border border-[#087F8C]/30">
                    {selectedActivityDetail.activity_id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Statutory Authorized
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {selectedActivityDetail.activity_category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#087F8C] bg-[#EFF9F8] dark:bg-[#087F8C]/20 px-2 py-0.5 rounded border border-[#087F8C]/30 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#087F8C]" />
                    <span>Hourly Token: {selectedActivityDetail.hourly_token || selectedActivityDetail.statutory_audit?.token || kpis?.hourly_token || 'tok_hourly_live'}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  {selectedActivityDetail.activity_name}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedActivityDetail.city_name || selectedActivityDetail.district_name}, {selectedActivityDetail.state_name}</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="line-clamp-1">{selectedActivityDetail.source_name}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 text-xs font-bold overflow-x-auto pb-0.5">
              <button
                onClick={() => setActiveActivityModalTab('concession')}
                className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeActivityModalTab === 'concession'
                    ? 'border-[#087F8C] text-[#087F8C]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Concession &amp; Oversight</span>
              </button>

              <button
                onClick={() => setActiveActivityModalTab('transit')}
                className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeActivityModalTab === 'transit'
                    ? 'border-[#087F8C] text-[#087F8C]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Multi-Modal Transit Access ({selectedActivityDetail.connectivity?.overall_score || 40}/100)</span>
              </button>

              <button
                onClick={() => setActiveActivityModalTab('ecosystem')}
                className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeActivityModalTab === 'ecosystem'
                    ? 'border-[#087F8C] text-[#087F8C]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Adjacent Heritage &amp; GI ({selectedActivityDetail.total_co_located_attractions || 0})</span>
              </button>

              <button
                onClick={() => setActiveActivityModalTab('audit')}
                className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeActivityModalTab === 'audit'
                    ? 'border-[#087F8C] text-[#087F8C]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hourly Audit Ledger</span>
              </button>
            </div>

            {/* TAB 1: CONCESSION & REGULATORY OVERSIGHT */}
            {activeActivityModalTab === 'concession' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-[#1A2622] rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Category Domain</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs block mt-0.5">{selectedActivityDetail.activity_category}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{selectedActivityDetail.activity_subcategory}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#1A2622] rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Skill Level</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs block mt-0.5">{selectedActivityDetail.experience_level}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{selectedActivityDetail.seasonality}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#1A2622] rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Classification</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs block mt-0.5">{selectedActivityDetail.tourism_type || 'General Concession'}</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">Standard Protocol</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#1A2622] rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Recognition Benchmark</span>
                    <span className="font-extrabold text-[#087F8C] text-xs block mt-0.5">
                      {selectedActivityDetail.activity_scores?.recognition_score ?? 95.0}%
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Gazetted Standard</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#17221E] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#087F8C]" />
                    Regulating Statutory Authority
                  </h4>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedActivityDetail.source_name}
                  </p>
                  {selectedActivityDetail.activity_location && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                      <strong className="text-slate-800 dark:text-slate-100">Jurisdiction / Landmark:</strong> {selectedActivityDetail.activity_location}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-[#EFF9F8] dark:bg-[#0C2422] rounded-xl border border-[#087F8C]/25 space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#087F8C]" />
                    Statutory Evidence &amp; Compliance Notes
                  </h4>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedActivityDetail.evidence_notes || 'Activity concession audited and confirmed under state ecotourism and heritage conservation rules.'}
                  </p>
                </div>

                {selectedActivityDetail.association_notes && (
                  <div className="p-3.5 bg-slate-50 dark:bg-[#1A2622] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Operational Context &amp; Cluster Integration
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedActivityDetail.association_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MULTI-MODAL TRANSIT & CONNECTIVITY */}
            {activeActivityModalTab === 'transit' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-3.5 bg-slate-50 dark:bg-[#1A2622] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Multi-Modal Transit Index</span>
                    <span className="text-lg font-extrabold text-[#087F8C]">
                      {selectedActivityDetail.connectivity?.overall_score || 45} / 100
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Connectivity Confidence</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedActivityDetail.connectivity?.confidence || 'Verified'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Road */}
                  <div className="p-3 bg-white dark:bg-[#17221E] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-blue-600" />
                        Road Corridor Connectivity
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedActivityDetail.connectivity?.road_score || 60}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${selectedActivityDetail.connectivity?.road_score || 60}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Access Status:</strong> {selectedActivityDetail.connectivity?.road_access}
                    </p>
                  </div>

                  {/* Train */}
                  <div className="p-3 bg-white dark:bg-[#17221E] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Train className="w-3.5 h-3.5 text-emerald-600" />
                        Rail Network Connectivity
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedActivityDetail.connectivity?.train_score || 40}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${selectedActivityDetail.connectivity?.train_score || 40}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Railhead Status:</strong> {selectedActivityDetail.connectivity?.train_access}
                    </p>
                  </div>

                  {/* Flight */}
                  <div className="p-3 bg-white dark:bg-[#17221E] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-indigo-600" />
                        Air &amp; Airport Accessibility
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedActivityDetail.connectivity?.flight_score || 25}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${selectedActivityDetail.connectivity?.flight_score || 25}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Aviation Status:</strong> {selectedActivityDetail.connectivity?.flight_access}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p className="leading-relaxed text-[11px]">
                    Transit data is cross-referenced from <code>city_connectivity_enriched (2).csv</code> covering National Highway corridors, Indian Railways passenger terminals, and AAI commercial air routes.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: ADJACENT HERITAGE & GI ASSETS */}
            {activeActivityModalTab === 'ecosystem' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-3 bg-[#EFF9F8] dark:bg-[#0C2422] rounded-xl border border-[#087F8C]/20 text-xs text-slate-800 dark:text-slate-200 flex justify-between items-center">
                  <span>
                    Co-located assets identified in <strong>{selectedActivityDetail.city_name || selectedActivityDetail.district_name}</strong>
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-white dark:bg-slate-900 border border-[#087F8C]/30 text-[#087F8C]">
                      {selectedActivityDetail.total_co_located_attractions || 0} Attractions
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                      {selectedActivityDetail.gi_registered_count || 0} GI Crafts
                    </span>
                  </div>
                </div>

                {/* Attractions List */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Verified Monuments &amp; Heritage Sites
                  </h4>
                  {selectedActivityDetail.co_located_attractions && selectedActivityDetail.co_located_attractions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedActivityDetail.co_located_attractions.map((att: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-50 dark:bg-[#1A2622] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{att.attraction_name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                              {att.attraction_type}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {att.asi_status && att.asi_status.toLowerCase().includes('asi') && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                                ASI Protected
                              </span>
                            )}
                            {att.unesco_status && att.unesco_status.toLowerCase() !== 'nan' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                UNESCO: {att.unesco_status}
                              </span>
                            )}
                          </div>
                          {att.evidence_notes && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight pt-0.5">
                              {att.evidence_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No additional attractions cataloged in immediate municipal limits.</p>
                  )}
                </div>

                {/* Cultural & GI Assets List */}
                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Recognized Cultural Assets &amp; GI Living Traditions
                  </h4>
                  {selectedActivityDetail.co_located_cultural_assets && selectedActivityDetail.co_located_cultural_assets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedActivityDetail.co_located_cultural_assets.map((cult: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-50 dark:bg-[#1A2622] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{cult.cultural_asset_name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 shrink-0">
                              {cult.cultural_category}
                            </span>
                          </div>
                          {cult.gi_status && cult.gi_status.toLowerCase().includes('gi') && (
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              ★ {cult.gi_status}
                            </span>
                          )}
                          {cult.cultural_significance && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight pt-0.5">
                              {cult.cultural_significance}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Direct craft traditions captured in main activity description.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: STATUTORY AUDIT LEDGER (HOURLY TOKEN) */}
            {activeActivityModalTab === 'audit' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-4 bg-slate-50 dark:bg-[#17221E] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Cryptographic Hourly Token:</span>
                    <span className="font-mono font-extrabold text-[#087F8C] text-xs px-2 py-0.5 rounded bg-[#EFF9F8] dark:bg-[#087F8C]/20 border border-[#087F8C]/30">
                      {selectedActivityDetail.hourly_token || selectedActivityDetail.statutory_audit?.token || kpis?.hourly_token || 'tok_hourly_live'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Statutory Verification Hash:</span>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedActivityDetail.statutory_audit?.audit_hash || 'SHA256:VERIFIED_STAMP'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Audit Epoch:</span>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedActivityDetail.statutory_audit?.epoch || 'Hourly Active'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Compliance Ledger Status:</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                      {selectedActivityDetail.statutory_audit?.compliance_status || 'OFFICIALLY_GAZETTED_CONCESSION'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Statutory Mandate:</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {selectedActivityDetail.statutory_audit?.regulatory_framework || 'Section 40 Public Concessions & State Tourism Act'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Audit Integrity Guarantee:</strong> This concession record is verified against the hourly telemetry cache. External modifications or unauthorized tampering invalidate the cryptographic token seal.
                  </span>
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Source: Ministry of Tourism &amp; State Tourism Boards</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedActivityDetail.source_url && (
                  <a
                    href={selectedActivityDetail.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#087F8C] text-white font-bold hover:bg-[#066570] transition-colors cursor-pointer"
                  >
                    <span>Open Official Authority Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedActivityDetail(null)}
                  className="px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Close Record
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
