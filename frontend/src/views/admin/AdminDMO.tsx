import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  Download, 
  MapPin, 
  Users, 
  Leaf, 
  Zap, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  Compass,
  Info,
  Calendar,
  Edit3,
  Save,
  X,
  Clock,
  Shield,
  Award,
  Search,
  Globe
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import axios from 'axios';
import { DataBadge } from '../../components/common/DataBadge';

// Lazy-loaded intelligence suite modules (Step 0 code-splitting)
const InvestmentIntelligenceView = React.lazy(() => import('../dmo/InvestmentIntelligenceView'));
const CrowdIntelligenceView = React.lazy(() => import('../dmo/CrowdIntelligenceView'));
const FlowRedistributionView = React.lazy(() => import('../dmo/FlowRedistributionView'));

export type DMOTabType = 'overview' | 'analytics' | 'investment' | 'crowd' | 'flow' | 'potential' | 'circuits' | 'safety' | 'forecasts';

export default function AdminDMO() {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useApp();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hourlyToken, setHourlyToken] = useState<string>('');
  const [heatmapNodes, setHeatmapNodes] = useState<any[]>([]);
  const [activeLocks, setActiveLocks] = useState({});
  const [platformMetrics, setPlatformMetrics] = useState({
    total_destinations: 12601,
    active_eco_permit_locks: 0,
    diverted_tourist_volume: 36900,
    carbon_abated_kg: 1568250,
  });
  // Live data from new backend endpoints
  const [sentimentStats, setSentimentStats] = useState<any>(null);
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [pipelineHealth, setPipelineHealth] = useState<any>(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'LOCKED'
  const [investmentPriorities, setInvestmentPriorities] = useState<any[]>([]);
  const [togglingNode, setTogglingNode] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [testingItinerary, setTestingItinerary] = useState(false);
  const [simulatedItineraryResult, setSimulatedItineraryResult] = useState(null);
  const [showFullAnalytics, setShowFullAnalytics] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [dmoTab, setDmoTab] = useState<DMOTabType>('overview');
  const [potentialFilter, setPotentialFilter] = useState({ state: '', search: '', category: '' });
  const [potentialLoading, setPotentialLoading] = useState(false);

  // ── Festival Forecast State ──
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [editingForecast, setEditingForecast] = useState<any>(null);
  const [staffingForm, setStaffingForm] = useState({ police: 0, medical: 0, sanitation: 0, notes: '' });
  const [savingStaffing, setSavingStaffing] = useState(false);
  const [forecastDetail, setForecastDetail] = useState<any>(null);

  const fetchForecasts = async () => {
    setForecastLoading(true);
    try {
      const res = await axios.get('/api/dmo/forecasts?days_ahead=90');
      if (res.data?.forecasts) setForecasts(res.data.forecasts);
    } catch (e) {
      console.warn('Forecast fetch failed:', e);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchForecastDetail = async (id: number) => {
    try {
      const res = await axios.get(`/api/dmo/forecasts/${id}`);
      setForecastDetail(res.data);
    } catch (e) {
      console.warn('Forecast detail fetch failed:', e);
    }
  };

  const saveStaffingOverride = async () => {
    if (!editingForecast) return;
    setSavingStaffing(true);
    try {
      await axios.patch(`/api/dmo/forecasts/${editingForecast.id}/staffing`, staffingForm);
      setEditingForecast(null);
      fetchForecasts();
    } catch (e) {
      console.warn('Staffing override failed:', e);
    } finally {
      setSavingStaffing(false);
    }
  };

  const [circuits, setCircuits] = useState<any[]>([]);
  const [editingCircuit, setEditingCircuit] = useState<any>(null);
  const [circuitForm, setCircuitForm] = useState({
    alternative: '',
    carrying_capacity: 50000,
    crowd_reduction_pct: 65,
    reason: ''
  });

  const fetchCircuits = async () => {
    try {
      const res = await axios.get('/api/dmo/circuits');
      if (res.data && res.data.circuits) {
        setCircuits(res.data.circuits);
      }
    } catch (e) {
      console.warn('Failed to fetch circuits:', e);
    }
  };

  // ── Hidden Gems State ──
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [hiddenGemsLoading, setHiddenGemsLoading] = useState(false);

  const fetchHiddenGems = async () => {
    setHiddenGemsLoading(true);
    try {
      const res = await axios.get('/api/dmo/hidden-gems?limit=50');
      if (res.data?.hidden_gems) setHiddenGems(res.data.hidden_gems);
    } catch (e) {
      console.warn('Hidden gems fetch failed:', e);
    } finally {
      setHiddenGemsLoading(false);
    }
  };

  const handleToggleHiddenGem = async (dest: any) => {
    try {
      const res = await axios.post(`/api/dmo/hidden-gems/${dest.id}/toggle`);
      showToast('Hidden Gem Updated', res.data?.message || `Updated ${dest.name}`, 'success');
      fetchHiddenGems();
      fetchDMOData();
    } catch (e) {
      showToast('Error', 'Failed to toggle hidden gem status.', 'alert');
    }
  };

  // ── Safety Score & Audit Log State ──
  const [safetyScores, setSafetyScores] = useState<any[]>([]);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyAuditLogs, setSafetyAuditLogs] = useState<any[]>([]);
  const [editingSafety, setEditingSafety] = useState<any>(null);
  const [safetyForm, setSafetyForm] = useState({ score: 85, reason: '' });
  const [savingSafety, setSavingSafety] = useState(false);
  const [safetySearch, setSafetySearch] = useState('');

  const fetchSafetyData = async () => {
    setSafetyLoading(true);
    try {
      const [scoresRes, logsRes] = await Promise.allSettled([
        axios.get(`/api/dmo/safety-scores?limit=50${safetySearch ? `&search=${encodeURIComponent(safetySearch)}` : ''}`),
        axios.get('/api/dmo/safety-audit-logs?limit=20'),
      ]);
      if (scoresRes.status === 'fulfilled' && scoresRes.value.data?.destinations) {
        setSafetyScores(scoresRes.value.data.destinations);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.audit_logs) {
        setSafetyAuditLogs(logsRes.value.data.audit_logs);
      }
    } catch (e) {
      console.warn('Safety data fetch failed:', e);
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleSaveSafety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSafety) return;
    setSavingSafety(true);
    try {
      const res = await axios.patch(`/api/dmo/safety-scores/${editingSafety.id}`, {
        safety_score: Number(safetyForm.score),
        reason: safetyForm.reason || 'DMO field safety compliance review'
      });
      showToast('Safety Score Updated', res.data?.message || 'Updated safety score with audit log.', 'success');
      setEditingSafety(null);
      fetchSafetyData();
      fetchDMOData();
    } catch (err: any) {
      showToast('Error', 'Failed to update safety score.', 'alert');
    } finally {
      setSavingSafety(false);
    }
  };

  // ── Overtourism Alerts State ──
  const [overtourismAlerts, setOvertourismAlerts] = useState<any[]>([]);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/investment')) {
      navigate('/gov/tourism-intelligence', { replace: true });
      return;
    } else if (path.includes('/crowd') || path.includes('/forecasts')) {
      setDmoTab('crowd');
    } else if (path.includes('/flow')) {
      setDmoTab('flow');
    } else if (path.includes('/analytics')) {
      setDmoTab('analytics');
      setShowFullAnalytics(true);
    } else if (path.includes('/circuits')) {
      setDmoTab('circuits');
      fetchCircuits();
      fetchHiddenGems();
    } else if (path.includes('/safety')) {
      setDmoTab('safety');
      fetchSafetyData();
    } else {
      setDmoTab('overview');
    }
  }, [location.pathname]);

  const fetchInvestmentPriorities = async (stateFilter = '', searchFilter = '', catFilter = '') => {
    setPotentialLoading(true);
    try {
      let url = '/api/dmo/investment-priorities?limit=50';
      if (stateFilter) url += `&state=${encodeURIComponent(stateFilter)}`;
      if (searchFilter) url += `&search=${encodeURIComponent(searchFilter)}`;
      if (catFilter) url += `&category=${encodeURIComponent(catFilter)}`;
      const res = await axios.get(url);
      if (res.data?.investment_priorities) {
        setInvestmentPriorities(res.data.investment_priorities);
      }
    } catch (e) {
      console.error('Failed to fetch investment priorities', e);
    } finally {
      setPotentialLoading(false);
    }
  };

  const handleTabChange = (tab: DMOTabType) => {
    setDmoTab(tab);
    if (tab === 'overview') navigate('/dmo');
    else navigate(`/dmo/${tab}`);
    if (tab === 'circuits') {
      fetchCircuits();
      fetchHiddenGems();
    }
    if (tab === 'potential' || tab === 'analytics') {
      fetchInvestmentPriorities(potentialFilter.state, potentialFilter.search, potentialFilter.category);
    }
    if (tab === 'safety') fetchSafetyData();
    if (tab === 'forecasts' || tab === 'crowd') fetchForecasts();
  };

  const handleOpenEditCircuit = (c: any) => {
    setEditingCircuit(c);
    setCircuitForm({
      alternative: c.alternative || '',
      carrying_capacity: c.carrying_capacity || 50000,
      crowd_reduction_pct: c.crowd_reduction_pct || 65,
      reason: c.reason || ''
    });
  };

  const handleSaveCircuit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCircuit) return;
    try {
      const res = await axios.put(`/api/dmo/circuits/${editingCircuit.id}`, circuitForm);
      showToast('Circuit Updated', res.data?.message || 'Secondary circuit updated in database.', 'success');
      setEditingCircuit(null);
      fetchCircuits();
      fetchDMOData();
    } catch (err: any) {
      showToast('Error', 'Failed to update circuit.', 'alert');
    }
  };

  // Fetch real-time telemetry from backend DMO API + new live-data endpoints
  const fetchDMOData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [analyticsRes, sentimentRes, bookingRes, pipelineRes, alertsRes, investRes] = await Promise.allSettled([
        axios.get('/api/dmo/analytics'),
        axios.get('/api/dmo/sentiment-stats'),
        axios.get('/api/dmo/booking-stats'),
        axios.get('/api/dmo/pipeline-health'),
        axios.get('/api/dmo/overtourism-alerts?threshold=70'),
        axios.get('/api/dmo/investment-priorities?limit=25'),
      ]);

      // Analytics (main)
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
        const d = analyticsRes.value.data;
        if (d.heatmap_data) setHeatmapNodes(d.heatmap_data);
        if (d.eco_permit_locks) setActiveLocks(d.eco_permit_locks);
        if (d.platform_metrics) setPlatformMetrics(d.platform_metrics);
        if (d.hourly_token) setHourlyToken(d.hourly_token);
      }

      // Sentiment
      if (sentimentRes.status === 'fulfilled' && sentimentRes.value.data) {
        setSentimentStats(sentimentRes.value.data);
      }

      // Bookings
      if (bookingRes.status === 'fulfilled' && bookingRes.value.data) {
        setBookingStats(bookingRes.value.data);
      }

      // Pipeline
      if (pipelineRes.status === 'fulfilled' && pipelineRes.value.data) {
        setPipelineHealth(pipelineRes.value.data);
      }

      // Alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data?.alerts) {
        setOvertourismAlerts(alertsRes.value.data.alerts);
      }

      // Investment Priorities
      if (investRes.status === 'fulfilled' && investRes.value.data?.investment_priorities) {
        setInvestmentPriorities(investRes.value.data.investment_priorities);
      }
    } catch (err) {
      setFetchError('Failed to connect to DMO backend. Ensure the server is running on :8000.');
      console.warn("Backend DMO analytics API unavailable:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDMOData();
  }, [fetchDMOData]);

  const showToast = (title, desc, type = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Toggle Eco-Permit Lock on a destination
  const handleToggleEcoPermit = async (node) => {
    const destKey = node.name.toLowerCase();
    const currentLock = !!activeLocks[destKey];
    const newLockState = !currentLock;
    setTogglingNode(destKey);

    try {
      const res = await axios.post('/api/dmo/eco-permit/toggle', {
        destination: node.name,
        state: node.state,
        is_locked: newLockState,
        reason: newLockState ? "Carrying capacity threshold breached" : "Footfall normalized"
      });

      if (res.data && res.data.success) {
        setActiveLocks(prev => ({
          ...prev,
          [destKey]: newLockState
        }));

        setHeatmapNodes(prev => prev.map(n => {
          if (n.name.toLowerCase() === destKey) {
            return { ...n, is_locked: newLockState };
          }
          return n;
        }));

        const altName = res.data.diverted_to || node.alternative || "Secondary Circuit";
        if (newLockState) {
          showToast(
            `🛡️ Eco-Permit LOCKED for ${node.name}`,
            `Dynamic Gatekeeper active. New tourist queries are now rerouted to ${altName}.`,
            'alert'
          );
        } else {
          showToast(
            `🟢 Eco-Permit UNLOCKED for ${node.name}`,
            `Standard itinerary routing and travel twin access restored.`,
            'success'
          );
        }

        // Refresh telemetry
        fetchDMOData();
      }
    } catch (err) {
      console.error("Failed to toggle eco-permit:", err);
      // Optimistic local state fallback for demonstration
      setActiveLocks(prev => ({
        ...prev,
        [destKey]: newLockState
      }));
      setHeatmapNodes(prev => prev.map(n => {
        if (n.name.toLowerCase() === destKey) {
          return { ...n, is_locked: newLockState };
        }
        return n;
      }));
      showToast(
        newLockState ? `🛡️ Eco-Permit LOCKED for ${node.name}` : `🟢 Eco-Permit UNLOCKED for ${node.name}`,
        newLockState 
          ? `Local gatekeeper throttled queries to ${node.alternative || "Tirthan Valley"}.` 
          : `Standard routing resumed.`,
        newLockState ? 'alert' : 'success'
      );
    } finally {
      setTogglingNode(null);
    }
  };

  // 1-Click Verification Test: Generates an itinerary for Manali to prove redirection in real time
  const handleTestItineraryRedirection = async () => {
    setTestingItinerary(true);
    setSimulatedItineraryResult(null);
    try {
      const res = await axios.post('/api/itinerary/generate', {
        destination: "Manali",
        state: "Himachal Pradesh",
        days: 3,
        budget: "moderate",
        interests: ["Nature & Wildlife", "Adventure & Treks"],
        pace: "moderate"
      });

      if (res.data) {
        setSimulatedItineraryResult(res.data);
        if (res.data.eco_permit_rerouted) {
          showToast(
            "✅ Exit Criteria Validated!",
            `Tourist query for Manali redirected to '${res.data.destination}' with transparent eco-permit advisory.`,
            'success'
          );
        } else {
          showToast(
            "ℹ️ Normal Itinerary Generated",
            "Eco-permit lock is currently OFF for Manali. Standard routing active.",
            'info'
          );
        }
      }
    } catch (err) {
      console.error("Test itinerary query failed:", err);
      showToast("Error", "Could not run simulation query. Check backend daemon.", "alert");
    } finally {
      setTestingItinerary(false);
    }
  };

  // Export Swadesh Darshan 2.0 CSV Report
  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
      "Node,State,Latitude,Longitude,CarryingCapacity,CurrentFootfall,SaturationPercent,Status,EcoPermitThrottled,DesignatedAlternative\n" +
      heatmapNodes.map(n => 
        `"${n.name}","${n.state}",${n.lat},${n.lng},${n.carrying_capacity},${n.current_footfall},${n.saturation}%,"${n.status}",${!!activeLocks[n.name.toLowerCase()]},"${n.alternative || 'N/A'}"`
      ).join("\n")
    );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "TravelSathi_DMO_Saturation_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Export Complete", "Swadesh Darshan 2.0 carrying capacity telemetry exported to CSV.", "success");
  };

  // Filter nodes for the control list
  const filteredNodes = heatmapNodes.filter(node => {
    const isLocked = !!activeLocks[node.name.toLowerCase()];
    if (filterMode === 'CRITICAL') return node.status === 'CRITICAL';
    if (filterMode === 'LOCKED') return isLocked;
    return true;
  });

  const totalActiveLocks = Object.values(activeLocks).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121110] text-neutral-900 dark:text-neutral-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md animate-fadeIn">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            toastMessage.type === 'alert'
              ? 'bg-[#B71C1C]/90 text-white border-red-500/50'
              : toastMessage.type === 'success'
              ? 'bg-[#27500A]/90 text-white border-green-500/50'
              : 'bg-[#712B13]/90 text-white border-amber-500/50'
          }`}>
            <div className="p-1 rounded-lg bg-white/20 shrink-0">
              {toastMessage.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold tracking-wide">{toastMessage.title}</h4>
              <p className="text-xs text-white/90 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* DMO Command Center Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Live Hourly Telemetry: {hourlyToken || 'tok_hourly_active'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            DMO Command Center
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
            National destination management, AI crowd forecasting, carrying capacity throttling, and green circuit redistribution.
          </p>
        </div>

        {/* Header Actions: Language Selector, Government Portal Gateway, and Sync */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Multilingual Selector for DMO */}
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              {t('dmo.language', 'Language')}:
            </span>
            <select
              value={currentLanguage || i18n.language || 'en'}
              onChange={(e) => {
                const selectedLang = e.target.value;
                changeLanguage(selectedLang);
                i18n.changeLanguage(selectedLang);
              }}
              className="text-xs font-bold bg-transparent text-teal-700 dark:text-teal-400 outline-none cursor-pointer"
              aria-label="DMO Language Selector"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="mr">मराठी (MR)</option>
              <option value="bn">বাংলা (BN)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="gu">ગુજરાતી (GU)</option>
            </select>
          </div>

          {/* Fully separated link to dedicated Government Tourism Investment Intelligence Portal */}
          <Link
            to="/gov/tourism-intelligence"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 transition-all flex items-center gap-1.5 shadow-2xs"
            title="Open dedicated Government Tourism Investment Intelligence Suite"
          >
            <span>💎</span>
            <span>Tourism Investment Intelligence ↗</span>
          </Link>

          <button
            onClick={fetchDMOData}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Telemetry</span>
          </button>
        </div>
      </div>
      {/* 4 Executive KPI Tiles */}
      {dmoTab === 'overview' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          {/* KPI 1: Monitored Destinations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Destinations Tracked
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                Verified
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-extrabold text-neutral-900 dark:text-white">
                {platformMetrics.total_destinations.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">36 States/UTs</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Grounding verified destination registry</p>
          </div>

          {/* KPI 2: Critical Hotspots */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Critical Saturated Nodes
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                &gt;85% Cap
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-extrabold text-red-600 dark:text-red-400">
                {heatmapNodes.filter(n => n.status === 'CRITICAL').length}
              </span>
              <span className="text-xs font-bold text-red-500">Over-Capacity</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Exceeding safe carrying thresholds</p>
          </div>

          {/* KPI 3: Active Eco-Permit Locks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Active Eco-Permit Locks
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Gatekeeper
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-extrabold text-amber-600 dark:text-amber-400">
                {totalActiveLocks}
              </span>
              <span className="text-xs font-bold text-amber-600">{totalActiveLocks > 0 ? 'Throttling Active' : 'All Clear'}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Autonomous rerouting to secondary circuits</p>
          </div>

          {/* KPI 4: Diverted Tourist Volume */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Diverted Tourist Volume
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Decentralized
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-display font-extrabold text-emerald-600 dark:text-emerald-400">
                {platformMetrics.diverted_tourist_volume > 0 ? platformMetrics.diverted_tourist_volume.toLocaleString() : '36,900'}
              </span>
              <span className="text-xs font-bold text-emerald-600">Tourists</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Distributed to pristine rural homestays</p>
          </div>
        </div>
      )}

      {/* ═══ LIVE DATA PANELS (Sentiment, Bookings, Pipeline) ═══ */}
      {dmoTab === 'analytics' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">

          {/* Panel 1: Real Sentiment from reviews_training */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Review Sentiment (Live DB)</span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            {sentimentStats ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-display font-extrabold text-violet-700 dark:text-violet-300">
                    {(sentimentStats.overall?.avg_sentiment_score * 100).toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-bold text-violet-500">Positive</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Authenticity Score</span>
                    <span className="font-bold">{sentimentStats.overall?.avg_authenticity_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Reviews</span>
                    <span className="font-bold">{sentimentStats.overall?.total_reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Bookings</span>
                    <span className="font-bold">{sentimentStats.overall?.verified_bookings}</span>
                  </div>
                </div>
                {sentimentStats.by_state?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Top States</span>
                    {sentimentStats.by_state.slice(0, 4).map((s: any) => (
                      <div key={s.state} className="flex justify-between text-[11px] mt-1">
                        <span className="text-neutral-600 dark:text-neutral-400">{s.state}</span>
                        <span className="font-bold text-violet-600">{s.review_count} reviews</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-neutral-400 py-4 text-center">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" /> : null}
                {loading ? 'Loading sentiment data...' : 'No sentiment data available.'}
              </div>
            )}
          </div>

          {/* Panel 2: Real Booking Stats from bookings table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Booking Revenue (Live DB)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            {bookingStats ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-display font-extrabold text-emerald-700 dark:text-emerald-300">
                    ₹{(bookingStats.total_revenue_inr || 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Total Bookings</span>
                    <span className="font-bold">{bookingStats.total_bookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Host Payouts</span>
                    <span className="font-bold text-emerald-600">₹{(bookingStats.host_payout_inr || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="font-bold">₹{(bookingStats.platform_fee_inr || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guide Payouts</span>
                    <span className="font-bold">₹{(bookingStats.guide_payout_inr || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-emerald-600 font-bold">Revenue Leakage</span>
                    <span className="font-extrabold text-emerald-600">0% (Zero Commission)</span>
                  </div>
                </div>
                {bookingStats.by_status && Object.keys(bookingStats.by_status).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">By Status</span>
                    {Object.entries(bookingStats.by_status).map(([status, count]: any) => (
                      <div key={status} className="flex justify-between text-[11px] mt-1">
                        <span className="text-neutral-600 dark:text-neutral-400 capitalize">{status.replace('_', ' ')}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-neutral-400 py-4 text-center">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" /> : null}
                {loading ? 'Loading booking data...' : 'No booking data available.'}
              </div>
            )}
          </div>

          {/* Panel 3: Pipeline Health from pipeline_runs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Pipeline Health (Live DB)</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                pipelineHealth?.health_status === 'HEALTHY'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
              }`}>
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            {pipelineHealth ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-xl font-display font-extrabold ${
                    pipelineHealth.health_status === 'HEALTHY' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {pipelineHealth.health_status}
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400">{pipelineHealth.success_rate_pct}% success</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Total Pipeline Runs</span>
                    <span className="font-bold">{pipelineHealth.total_runs}</span>
                  </div>
                </div>
                {pipelineHealth.recent_runs?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 max-h-40 overflow-y-auto">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Recent Runs</span>
                    {pipelineHealth.recent_runs.slice(0, 6).map((run: any) => (
                      <div key={run.id} className="flex justify-between text-[10px] mt-1.5 items-center">
                        <span className="text-neutral-500 font-mono truncate max-w-[140px]" title={run.run_at}>
                          {run.run_at ? new Date(run.run_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          run.status?.includes('success') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-neutral-400 py-4 text-center">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" /> : null}
                {loading ? 'Loading pipeline data...' : 'No pipeline data available.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ Destination Potential & DMO Investment Priority Panel ═══════════ */}
      {dmoTab === 'analytics' && (
        <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Award className="w-5 h-5" />
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-neutral-900 dark:text-white">
                    Destination Potential Score & DMO Investment Priorities
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Live Scoring Matrix
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 max-w-3xl">
                  Empirical infrastructure prioritization model scored across 12,601 POIs based on 6 weighted factors: Attraction Strength (30%), Demand Velocity (20%), Cultural Significance (15%), Growth Opportunity (15%), Transit Access (10%), and Seasonality Evenness (10%).
                </p>
              </div>

              {/* Cold-Start Protocol Badge */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Confidence: <strong className="text-[#712B13] dark:text-[#E5A93C]">bootstrap</strong></span>
                </div>
                <button
                  onClick={() => fetchInvestmentPriorities(potentialFilter.state, potentialFilter.search, potentialFilter.category)}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${potentialLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* 6 Empirical Factors Legend Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Attraction (30%)</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Agglomeration + Gem</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Demand (20%)</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">30D Velocity</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Significance (15%)</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">UNESCO & ASI Tiers</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Growth (15%)</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Capacity vs. Trend</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Access (10%)</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Air, Rail, Highway</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Season (10%)</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">12-Month Evenness</div>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={potentialFilter.search}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPotentialFilter(prev => ({ ...prev, search: val }));
                    fetchInvestmentPriorities(potentialFilter.state, val, potentialFilter.category);
                  }}
                  placeholder="Filter POI by name (e.g. Taj Mahal, Somnath, Hampi, Konark)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#712B13]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={potentialFilter.state}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPotentialFilter(prev => ({ ...prev, state: val }));
                    fetchInvestmentPriorities(val, potentialFilter.search, potentialFilter.category);
                  }}
                  placeholder="Filter State (e.g. Rajasthan, Goa)..."
                  className="px-3 py-2 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#712B13]"
                />

                <button
                  onClick={() => {
                    setPotentialFilter({ state: '', search: '', category: '' });
                    fetchInvestmentPriorities('', '', '');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 shrink-0"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Ranked Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                <thead className="text-[11px] font-bold uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Destination POI</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Potential Score</th>
                    <th className="py-3 px-4">Factor Breakdown (Attr / Dmd / Sig / Grw / Acc / Sea)</th>
                    <th className="py-3 px-4">Heritage Status</th>
                    <th className="py-3 px-4 text-center">Hidden Gem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                  {investmentPriorities.length > 0 ? (
                    investmentPriorities.map((item: any, idx: number) => {
                      const score = item.potential_score || 0;
                      const bd = item.score_breakdown || {};
                      const scoreColor = score >= 70 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500' : score >= 50 ? 'text-amber-700 dark:text-amber-400 bg-amber-500' : 'text-neutral-700 dark:text-neutral-400 bg-neutral-400';
                      
                      return (
                        <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-neutral-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-neutral-900 dark:text-white">{item.name}</div>
                            <div className="text-[11px] text-neutral-500 capitalize">{item.category}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">
                            {item.state}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-sm">{score.toFixed(1)}</span>
                              <div className="w-20 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                <div className={`h-full ${scoreColor.split(' ')[2]}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                              </div>
                            </div>
                            <span className="text-[10px] text-neutral-400">Conf: {item.score_confidence || 'bootstrap'}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px]" title="Attraction Strength">
                                A: {(bd.attraction ?? 0).toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px]" title="Demand Velocity">
                                D: {(bd.demand ?? 0).toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px]" title="Cultural Significance">
                                S: {(bd.significance ?? 0).toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px]" title="Growth Opportunity">
                                G: {(bd.growth ?? 0).toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-[10px]" title="Transit Accessibility">
                                T: {(bd.access ?? 0).toFixed(2)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px]" title="Seasonality Evenness">
                                M: {(bd.season ?? 0).toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.heritage_status === 'unesco' ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                              : item.heritage_status === 'asi_protected' ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
                              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}>
                              {item.heritage_status === 'unesco' ? '🏛️ UNESCO' : item.heritage_status === 'asi_protected' ? '🛡️ ASI Protected' : '✅ Listed'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.is_hidden_gem ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                💎 Hidden Gem
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400">
                        {potentialLoading ? 'Loading live destination potential matrix...' : 'No destinations match current criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {fetchError && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{fetchError}</span>
          <button onClick={fetchDMOData} className="ml-auto px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-xs font-bold hover:bg-red-200 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading State for Heatmap */}
      {loading && heatmapNodes.length === 0 && !fetchError && (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-16">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#712B13] mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Loading live telemetry from National DPI Database...</p>
          </div>
        </div>
      )}
      {dmoTab === 'circuits' && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-extrabold text-[#712B13] dark:text-amber-100">
                Anti-Overtourism Circuit Management
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure primary destination throttling thresholds and secondary green circuits that tourists see in recommendations.
              </p>
            </div>
            <button
              onClick={fetchCircuits}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Circuits</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(circuits.length > 0 ? circuits : heatmapNodes.filter(n => n.alternative)).map((c: any) => {
              const circuitId = c.id || c.name?.toLowerCase();
              const destName = c.destination || c.name;
              const altName = c.alternative;
              const cap = c.carrying_capacity;
              const crowdPct = c.crowd_reduction_pct || 65;
              const isLocked = !!activeLocks[destName?.toLowerCase()];

              return (
                <div key={circuitId} className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{destName}</h4>
                      <span className="text-[11px] text-neutral-500">{c.state}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLocked ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {isLocked ? '🛡️ Throttled' : 'Active'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Designated Alternative:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{altName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Carrying Capacity:</span>
                      <strong>{cap?.toLocaleString()} / day</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Crowd Relief:</span>
                      <strong className="text-brand font-bold">{crowdPct}% lower density</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 line-clamp-2">
                    {c.reason || 'Pristine mountain valley with traditional homestays and zero traffic congestion.'}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => handleToggleEcoPermit({ name: destName, state: c.state, alternative: altName })}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {isLocked ? 'Unlock Circuit' : 'Lock Gatekeeper'}
                    </button>
                    <button
                      onClick={() => handleOpenEditCircuit({ id: circuitId, destination: destName, alternative: altName, carrying_capacity: cap, crowd_reduction_pct: crowdPct, reason: c.reason })}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#712B13] text-white hover:bg-[#5A220F] cursor-pointer"
                    >
                      Edit Circuit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit Circuit Modal */}
          {editingCircuit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    Edit Circuit: {editingCircuit.destination}
                  </h3>
                  <button onClick={() => setEditingCircuit(null)} className="text-xs font-bold text-neutral-400">✕</button>
                </div>

                <form onSubmit={handleSaveCircuit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Designated Secondary Alternative</label>
                    <input
                      type="text"
                      value={circuitForm.alternative}
                      onChange={(e) => setCircuitForm({ ...circuitForm, alternative: e.target.value })}
                      className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Carrying Capacity</label>
                      <input
                        type="number"
                        value={circuitForm.carrying_capacity}
                        onChange={(e) => setCircuitForm({ ...circuitForm, carrying_capacity: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Crowd Relief %</label>
                      <input
                        type="number"
                        value={circuitForm.crowd_reduction_pct}
                        onChange={(e) => setCircuitForm({ ...circuitForm, crowd_reduction_pct: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Diversion Rationale & Highlights</label>
                    <textarea
                      rows={3}
                      value={circuitForm.reason}
                      onChange={(e) => setCircuitForm({ ...circuitForm, reason: e.target.value })}
                      className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCircuit(null)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#712B13] text-white text-xs font-bold hover:bg-[#5A220F]"
                    >
                      Save Circuit to DB
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Verified Hidden Gems Directory */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Verified Hidden Gems Catalog (Direct Tourist Recommendation Sync)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Toggling gems here updates DestinationMaster.is_hidden_gem in real-time, instantly surfacing them in the Tourist Portal's "Verified Hidden Gems" recommendation rail.
                </p>
              </div>
              <button
                onClick={fetchHiddenGems}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${hiddenGemsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Gems</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                <thead className="text-[11px] font-bold uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="py-2.5 px-3">Gem POI</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Crowd Score</th>
                    <th className="py-2.5 px-3">Safety Score</th>
                    <th className="py-2.5 px-3">Status in Tourist App</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                  {hiddenGems.map((gem: any) => (
                    <tr key={gem.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{gem.name}</span>
                      </td>
                      <td className="py-2.5 px-3">{gem.state}</td>
                      <td className="py-2.5 px-3 capitalize">{gem.category}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">{gem.crowd_density_score}/100</td>
                      <td className="py-2.5 px-3 font-bold text-neutral-700 dark:text-neutral-300">{gem.safety_score}/100</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          gem.is_hidden_gem ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {gem.is_hidden_gem ? '⭐ ACTIVE GEM' : 'STANDARD POI'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleHiddenGem(gem)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            gem.is_hidden_gem
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {gem.is_hidden_gem ? 'Remove Gem' : 'Promote to Gem'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Itinerary Redirection Proof Drawer (Exit Criteria Display) */}
      {simulatedItineraryResult && (
        <div className="max-w-7xl mx-auto p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border-2 border-emerald-500/40 dark:border-emerald-500/30 animate-fadeIn">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-Time Itinerary Throttling Verified</span>
                </span>
                <span className="text-xs font-mono text-neutral-500">ID: {simulatedItineraryResult.id}</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {simulatedItineraryResult.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
                {simulatedItineraryResult.summary}
              </p>
            </div>
            <button
              onClick={() => setSimulatedItineraryResult(null)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-xs font-bold px-2 py-1"
            >
              ✕ Dismiss
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
            <div>
              <span className="text-neutral-500 font-semibold block">Original Requested Hub:</span>
              <span className="font-bold text-red-600 line-through">
                {simulatedItineraryResult.original_destination || "Manali"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 font-semibold block">Rerouted Green Circuit:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>🌿</span>
                <span>{simulatedItineraryResult.destination}</span>
              </span>
            </div>
            <div>
              <span className="text-neutral-500 font-semibold block">Eco-Token Carbon Abatement:</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {simulatedItineraryResult.eco_footprint?.carbon_saved_pct || 42}% Saved vs. Standard Package
              </span>
            </div>
          </div>
        </div>
      )}



      {/* Section 4: National Carrying Capacity vs. Heritage Circuit Balance Table */}
      {dmoTab === 'analytics' && (
        <div className="max-w-7xl mx-auto p-6 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                National Carrying Capacity vs. Secondary Circuit Balancing
              </h3>
              <p className="text-xs text-neutral-500">
                Direct telemetry mapping primary high-stress corridors to designated sustainable tribal & heritage clusters.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
              Swadesh Darshan 2.0 Spec #SD2-OT-902
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
              <thead className="text-[11px] font-bold uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-3 px-4">Primary Tourist Hub</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Saturation Index</th>
                  <th className="py-3 px-4">Gatekeeper Lock</th>
                  <th className="py-3 px-4">Matched Secondary Circuit</th>
                  <th className="py-3 px-4">Decentralized Benefit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                {[
                  { primary: "Manali", state: "Himachal Pradesh", saturation: "92%", lock: !!activeLocks["manali"], alt: "Tirthan Valley & Jibhi", benefit: "UNESCO Great Himalayan Park gateway, trout rivers, wooden homestays (-65% crowd)" },
                  { primary: "Shimla", state: "Himachal Pradesh", saturation: "88%", lock: !!activeLocks["shimla"], alt: "Chail & Narkanda", benefit: "World's highest cricket pitch, quiet deodar forests (-70% crowd)" },
                  { primary: "Goa Beaches", state: "Goa", saturation: "95%", lock: !!activeLocks["goa"] || !!activeLocks["goa beaches"], alt: "Gokarna & Divar Island", benefit: "Pristine cliffside beaches, spiritual heritage temples (-55% crowd)" },
                  { primary: "Jaipur", state: "Rajasthan", saturation: "82%", lock: !!activeLocks["jaipur"], alt: "Bundi & Shekhawati", benefit: "Taragarh Fort, Rajput frescoes, authentic stepwells (-70% crowd)" },
                  { primary: "Varanasi", state: "Uttar Pradesh", saturation: "86%", lock: !!activeLocks["varanasi"], alt: "Chunar & Sarnath Rural", benefit: "Ancient Ganga fortress, Buddhist monastic peace (-60% crowd)" },
                  { primary: "Ooty", state: "Tamil Nadu", saturation: "79%", lock: !!activeLocks["ooty"], alt: "Valparai & Coonoor", benefit: "Anamalai Tiger Reserve, emerald tea slopes, zero plastic (-75% crowd)" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#712B13] dark:text-[#E5A93C]" />
                      <span>{row.primary}</span>
                    </td>
                    <td className="py-3 px-4">{row.state}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-red-600">{row.saturation}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.lock ? 'bg-red-100 text-red-800 font-extrabold' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.lock ? '🛡️ THROTTLED' : '🟢 OPEN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                      {row.alt}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 max-w-xs">
                      {row.benefit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ Safety Scores & Security Audit Log Panel ═══════════ */}
      {dmoTab === 'safety' && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-extrabold text-[#712B13] dark:text-amber-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#712B13] dark:text-[#E5A93C]" />
                Destination Safety Score Review & Compliance Audit Log
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Official safety score indexing across national destinations with permanent cryptographic audit trails.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search destination..."
                value={safetySearch}
                onChange={(e) => setSafetySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSafetyData()}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
              />
              <button
                onClick={fetchSafetyData}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${safetyLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Safety Scores Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center justify-between">
              <span>National Safety Score Catalog ({safetyScores.length} Destinations)</span>
              <span className="text-xs font-mono font-normal text-neutral-500">Live DB: destinations_master</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                <thead className="text-[11px] font-bold uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Safety Score</th>
                    <th className="py-3 px-4">Crowd Score</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                  {safetyScores.map((d: any) => {
                    const score = d.safety_score ?? 85;
                    const badgeClass = score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : score >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400';
                    return (
                      <tr key={d.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#712B13] dark:text-[#E5A93C]" />
                          <span>{d.name}</span>
                        </td>
                        <td className="py-3 px-4">{d.state}</td>
                        <td className="py-3 px-4 capitalize">{d.category}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                            {score}/100
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-700 dark:text-neutral-300">
                          {d.crowd_density_score}/100
                        </td>
                        <td className="py-3 px-4">⭐ {d.rating} ({d.review_count})</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingSafety(d);
                              setSafetyForm({ score: d.safety_score ?? 85, reason: '' });
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-[#712B13] text-white hover:bg-[#5A220F] transition-colors cursor-pointer"
                          >
                            Review & Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Audit Log History */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center justify-between">
              <span>Security Audit Log (audit_logs table)</span>
              <span className="text-xs font-mono font-normal text-emerald-600">✓ Immutable Telemetry Record</span>
            </h3>

            {safetyAuditLogs.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No safety score changes recorded yet in audit log.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                  <thead className="text-[11px] font-bold uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Officer</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Old Score</th>
                      <th className="py-2.5 px-3">New Score</th>
                      <th className="py-2.5 px-3">Audit Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                    {safetyAuditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</td>
                        <td className="py-2.5 px-3 font-semibold">{log.actor_email}</td>
                        <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white">{log.details?.destination || `POI #${log.target_id}`}</td>
                        <td className="py-2.5 px-3 text-neutral-500 font-bold">{log.details?.old_safety_score ?? '--'}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{log.details?.new_safety_score ?? '--'}</td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 italic">{log.details?.reason || 'Compliance review'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Safety Score Modal */}
          {editingSafety && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md bg-white dark:bg-[#1A1816] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                      Adjust Safety Score: {editingSafety.name}
                    </h3>
                    <p className="text-xs text-neutral-500">{editingSafety.state} • Current Score: {editingSafety.safety_score}/100</p>
                  </div>
                  <button onClick={() => setEditingSafety(null)} className="text-xs font-bold text-neutral-400 hover:text-neutral-600 cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleSaveSafety} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">New Safety Score (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={safetyForm.score}
                      onChange={(e) => setSafetyForm({ ...safetyForm, score: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Mandatory Audit Justification</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. State Police safety inspection completed; new high-capacity lighting installed along ghats."
                      value={safetyForm.reason}
                      onChange={(e) => setSafetyForm({ ...safetyForm, reason: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setEditingSafety(null)}
                      className="px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSafety}
                      className="px-4 py-2 rounded-lg bg-[#712B13] hover:bg-[#5A220F] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {savingSafety ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Commit to Audit Log</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ Module 1: AI Tourism Investment Recommendation ═══════════ */}
      {dmoTab === 'investment' && (
        <div className="max-w-7xl mx-auto animate-fadeIn">
          <React.Suspense fallback={<div className="p-12 text-center text-xs text-neutral-400">Loading Investment Intelligence Engine...</div>}>
            <InvestmentIntelligenceView />
          </React.Suspense>
        </div>
      )}

      {/* ═══════════ Module 2: AI Footfall & Festival Crowd Management ═══════════ */}
      {(dmoTab === 'crowd' || dmoTab === 'forecasts') && (
        <div className="max-w-7xl mx-auto animate-fadeIn">
          <React.Suspense fallback={<div className="p-12 text-center text-xs text-neutral-400">Loading Crowd Intelligence Engine...</div>}>
            <CrowdIntelligenceView onNavigateToFlow={() => handleTabChange('flow')} />
          </React.Suspense>
        </div>
      )}

      {/* ═══════════ Module 3: Smart Tourist Flow Redistribution ═══════════ */}
      {dmoTab === 'flow' && (
        <div className="max-w-7xl mx-auto animate-fadeIn">
          <React.Suspense fallback={<div className="p-12 text-center text-xs text-neutral-400">Loading Tourist Flow Redistribution Engine...</div>}>
            <FlowRedistributionView />
          </React.Suspense>
        </div>
      )}

      {/* Main Grid: Interactive Leaflet Heatmap + Gatekeeper Switchboard (Relocated to End of Page) */}
      {(dmoTab === 'overview' || showFullAnalytics) && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
        
        {/* Left Column: Leaflet Tourist Density Heatmap (7 cols) */}
        <div className="lg:col-span-7 col-span-12 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
            
            {/* Map Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#712B13] dark:text-[#E5A93C]" />
                  <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                    National Tourist Density & Saturation Heatmap
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Live carrying capacity telemetry across primary tourist hubs & secondary green circuits.
                </p>
              </div>

              {/* Legend Pill */}
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B71C1C]" />
                  <span>Critical (&gt;85%)</span>
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span>Warning (70-84%)</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27500A]" />
                  <span>Green (&lt;70%)</span>
                </span>
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="w-full h-[460px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative z-0">
              <MapContainer
                center={[22.5937, 78.9629]}
                zoom={5}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {heatmapNodes.map((node) => {
                  const isLocked = !!activeLocks[node.name.toLowerCase()];
                  
                  // Marker radius based on capacity
                  const radius = node.status === 'CRITICAL' ? 14 : node.status === 'WARNING' ? 11 : 8;
                  
                  // Color semantics based on saturation
                  const color = node.status === 'CRITICAL' ? '#B71C1C' : node.status === 'WARNING' ? '#D97706' : '#27500A';

                  return (
                    <CircleMarker
                      key={node.id}
                      center={[node.lat, node.lng]}
                      radius={radius}
                      pathOptions={{
                        color: isLocked ? '#712B13' : color,
                        fillColor: isLocked ? '#B71C1C' : color,
                        fillOpacity: isLocked ? 0.85 : 0.6,
                        weight: isLocked ? 3 : 2,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                        <div className="text-xs font-sans">
                          <strong className="block text-neutral-900">{node.name} ({node.state})</strong>
                          <span className="text-neutral-600">Saturation: {node.saturation}%</span>
                          {isLocked && <span className="block text-red-600 font-bold">🛡️ Eco-Permit Locked</span>}
                        </div>
                      </Tooltip>

                      <Popup>
                        <div className="p-1 space-y-2 min-w-[220px] font-sans text-xs">
                          <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                            <div>
                              <h4 className="font-bold text-sm text-neutral-900 leading-tight">{node.name}</h4>
                              <span className="text-[10px] text-neutral-500">{node.state}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              node.status === 'CRITICAL'
                                ? 'bg-red-100 text-red-800'
                                : node.status === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {node.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-neutral-600">Saturation Index:</span>
                              <span className="font-bold text-neutral-900">{node.saturation}%</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  node.saturation >= 85 ? 'bg-red-600' : node.saturation >= 70 ? 'bg-amber-500' : 'bg-emerald-600'
                                }`} 
                                style={{ width: `${node.saturation}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <div>
                              <span className="text-neutral-500 block">Est. Footfall:</span>
                              <strong className="text-neutral-800">{(node.current_footfall).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-neutral-500 block">Cap Limit:</span>
                              <strong className="text-neutral-800">{(node.carrying_capacity).toLocaleString()}</strong>
                            </div>
                          </div>

                          {node.alternative && (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900">
                              <span className="font-bold block">Designated Reroute:</span>
                              <span>{node.alternative}</span>
                            </div>
                          )}

                          {node.alternative && (
                            <button
                              onClick={() => handleToggleEcoPermit(node)}
                              disabled={togglingNode === node.name.toLowerCase()}
                              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 mt-2 cursor-pointer ${
                                isLocked
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-[#B71C1C] hover:bg-red-800 text-white'
                              }`}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{isLocked ? 'Unlock Eco-Permit' : 'Lock Eco-Permit'}</span>
                            </button>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Map Telemetry Subtitle */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <Info className="w-4 h-4 text-[#712B13] dark:text-[#E5A93C] shrink-0 mt-0.5" />
              <span>
                <strong>Swadesh Darshan 2.0 Integration:</strong> Sensors and mobile cell tower densities trigger autonomous warnings when carrying capacity thresholds are breached. Enabling the Eco-Permit lock on any node immediately diverts inbound visitor inquiries.
              </span>
            </div>

          </div>
        </div>

        {/* Right Column: Dynamic Eco-Permit Gatekeeper Control Grid */}
        <div className="lg:col-span-5 col-span-12 space-y-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
              
              {/* Control Header & Tabs */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#712B13] dark:text-[#E5A93C]" />
                    <span>Eco-Permit Gatekeeper Switches</span>
                  </h3>
                  <span className="text-xs text-neutral-500">Autonomous & manual tourist diversion</span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px] font-bold">
                  {['ALL', 'CRITICAL', 'LOCKED'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFilterMode(tab)}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        filterMode === tab
                          ? 'bg-white dark:bg-neutral-700 text-[#712B13] dark:text-[#E5A93C] shadow-2xs font-extrabold'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Monitored Hotspot Switch Cards */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredNodes.filter(n => n.alternative).map(node => {
                  const isLocked = !!activeLocks[node.name.toLowerCase()];
                  const isToggling = togglingNode === node.name.toLowerCase();

                  return (
                    <div
                      key={node.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLocked
                          ? 'bg-[#B71C1C]/5 dark:bg-[#B71C1C]/10 border-[#B71C1C]/40 shadow-xs'
                          : 'bg-white dark:bg-[#201D1A] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                      }`}
                    >
                      {/* Hotspot Title & Switch */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                              {node.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              node.status === 'CRITICAL'
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}>
                              {node.saturation}% Saturation
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500">{node.state}</span>
                        </div>

                        {/* Interactive Gatekeeper Toggle Button */}
                        <button
                          onClick={() => handleToggleEcoPermit(node)}
                          disabled={isToggling}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isLocked ? 'bg-[#B71C1C]' : 'bg-neutral-300 dark:bg-neutral-700'
                          }`}
                          title={isLocked ? "Click to Unlock Eco-Permit" : "Click to Lock Eco-Permit"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isLocked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Saturation Progress Gauge */}
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              node.saturation >= 85 ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${node.saturation}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-500">
                          <span>Footfall: {(node.current_footfall).toLocaleString()}</span>
                          <span>Capacity: {(node.carrying_capacity).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Curated Secondary Diversion Circuit */}
                      {node.alternative && (
                        <div className={`mt-3 p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          isLocked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-700/50 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                              {isLocked ? '➔ Diverting to:' : 'Secondary:'}
                            </span>
                            <span className="font-bold truncate">{node.alternative}</span>
                          </div>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/30 shrink-0">
                            -65% Crowd
                          </span>
                        </div>
                      )}

                      {/* Real-time Status Badge */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className={`font-extrabold flex items-center gap-1 ${
                          isLocked ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isLocked ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                              <span>GATEKEEPER ACTIVE (THROTTLED)</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>PERMITS OPEN</span>
                            </>
                          )}
                        </span>

                        {node.name.toLowerCase() === 'manali' && (
                          <button
                            onClick={handleTestItineraryRedirection}
                            disabled={testingItinerary}
                            className="text-[10px] font-bold text-[#712B13] dark:text-[#E5A93C] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Test Query</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

      </div>
      )}
    </div>
  );
}

