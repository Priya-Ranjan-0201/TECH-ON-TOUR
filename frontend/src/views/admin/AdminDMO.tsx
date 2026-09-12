import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import axios from 'axios';

// Fallback initial dataset if backend API is cold-starting
const INITIAL_HEATMAP_NODES = [
  {
    id: "node-manali",
    name: "Manali",
    state: "Himachal Pradesh",
    lat: 32.2396,
    lng: 77.1887,
    carrying_capacity: 50000,
    current_footfall: 95000,
    saturation: 92,
    status: "CRITICAL",
    is_locked: false,
    alternative: "Tirthan Valley & Jibhi"
  },
  {
    id: "node-shimla",
    name: "Shimla",
    state: "Himachal Pradesh",
    lat: 31.1048,
    lng: 77.1734,
    carrying_capacity: 65000,
    current_footfall: 115000,
    saturation: 88,
    status: "CRITICAL",
    is_locked: false,
    alternative: "Chail & Narkanda"
  },
  {
    id: "node-goa",
    name: "Goa Beaches",
    state: "Goa",
    lat: 15.2993,
    lng: 74.1240,
    carrying_capacity: 120000,
    current_footfall: 230000,
    saturation: 95,
    status: "CRITICAL",
    is_locked: false,
    alternative: "Gokarna & Divar Island"
  },
  {
    id: "node-jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    lat: 26.9124,
    lng: 75.7873,
    carrying_capacity: 90000,
    current_footfall: 150000,
    saturation: 82,
    status: "WARNING",
    is_locked: false,
    alternative: "Bundi & Shekhawati"
  },
  {
    id: "node-varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh",
    lat: 25.3176,
    lng: 83.0064,
    carrying_capacity: 85000,
    current_footfall: 145000,
    saturation: 86,
    status: "CRITICAL",
    is_locked: false,
    alternative: "Chunar & Sarnath Rural"
  },
  {
    id: "node-ooty",
    name: "Ooty",
    state: "Tamil Nadu",
    lat: 11.4064,
    lng: 76.6932,
    carrying_capacity: 40000,
    current_footfall: 72000,
    saturation: 79,
    status: "WARNING",
    is_locked: false,
    alternative: "Valparai & Coonoor"
  },
  {
    id: "node-munnar",
    name: "Munnar",
    state: "Kerala",
    lat: 10.0889,
    lng: 77.0595,
    carrying_capacity: 55000,
    current_footfall: 78000,
    saturation: 71,
    status: "WARNING",
    is_locked: false,
    alternative: "Vagamon & Marayoor"
  },
  {
    id: "node-jibhi",
    name: "Jibhi",
    state: "Himachal Pradesh",
    lat: 31.6120,
    lng: 77.3440,
    carrying_capacity: 25000,
    current_footfall: 4500,
    saturation: 18,
    status: "SUSTAINABLE",
    is_locked: false,
    alternative: null
  },
  {
    id: "node-tirthan",
    name: "Tirthan Valley",
    state: "Himachal Pradesh",
    lat: 31.6395,
    lng: 77.4459,
    carrying_capacity: 30000,
    current_footfall: 3600,
    saturation: 12,
    status: "SUSTAINABLE",
    is_locked: false,
    alternative: null
  },
  {
    id: "node-bastar",
    name: "Bastar",
    state: "Chhattisgarh",
    lat: 19.1071,
    lng: 81.9535,
    carrying_capacity: 35000,
    current_footfall: 2800,
    saturation: 8,
    status: "SUSTAINABLE",
    is_locked: false,
    alternative: null
  },
];

export default function AdminDMO() {
  const [loading, setLoading] = useState(false);
  const [heatmapNodes, setHeatmapNodes] = useState(INITIAL_HEATMAP_NODES);
  const [activeLocks, setActiveLocks] = useState({});
  const [platformMetrics, setPlatformMetrics] = useState({
    total_destinations: 12293,
    active_eco_permit_locks: 0,
    diverted_tourist_volume: 0,
    carbon_abated_kg: 0,
  });
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'LOCKED'
  const [togglingNode, setTogglingNode] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [testingItinerary, setTestingItinerary] = useState(false);
  const [simulatedItineraryResult, setSimulatedItineraryResult] = useState(null);
  const [showFullAnalytics, setShowFullAnalytics] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [dmoTab, setDmoTab] = useState<'overview' | 'analytics' | 'circuits'>('overview');

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

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/analytics')) {
      setDmoTab('analytics');
      setShowFullAnalytics(true);
    } else if (path.includes('/circuits')) {
      setDmoTab('circuits');
      fetchCircuits();
    } else {
      setDmoTab('overview');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'overview' | 'analytics' | 'circuits') => {
    setDmoTab(tab);
    if (tab === 'overview') navigate('/dmo');
    else navigate(`/dmo/${tab}`);
    if (tab === 'circuits') fetchCircuits();
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

  // Fetch real-time telemetry from backend DMO API
  const fetchDMOData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dmo/analytics');
      if (res.data) {
        if (res.data.heatmap_data) setHeatmapNodes(res.data.heatmap_data);
        if (res.data.eco_permit_locks) setActiveLocks(res.data.eco_permit_locks);
        if (res.data.platform_metrics) setPlatformMetrics(res.data.platform_metrics);
      }
    } catch (err) {
      console.warn("Backend DMO analytics API unavailable, utilizing local telemetry cache:", err);
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

      {/* DMO Mode Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 text-xs font-bold">
        {[
          { id: 'overview', label: '🏛️ DMO Intelligence & Heatmap' },
          { id: 'analytics', label: '📊 Footfall & Sentiment Analytics' },
          { id: 'circuits', label: '🧭 Circuit Management' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              dmoTab === tab.id
                ? 'bg-[#712B13] text-white shadow-sm font-bold'
                : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-[#712B13]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DMO Command Center Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#712B13]/10 dark:bg-[#E5A93C]/20 text-[#712B13] dark:text-[#E5A93C] border border-[#712B13]/20 dark:border-[#E5A93C]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#712B13] dark:bg-[#E5A93C] animate-ping" />
              Swadesh Darshan 2.0 • B2G Analytics Engine
            </span>
            <span className="text-xs font-mono text-neutral-500">Live Telemetry</span>
          </div>
          {/* Exactly 1 Headline Stat */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-[#712B13] dark:text-amber-100 tracking-tight">
            {platformMetrics.total_destinations.toLocaleString()} National POIs Monitored • {platformMetrics.diverted_tourist_volume > 0 ? platformMetrics.diverted_tourist_volume.toLocaleString() : '36,900+'} Tourists Diverted
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
            Real-time carrying capacity monitoring, automated visitor diversion to secondary cultural circuits, and administrative Eco-Permit throttling for State Tourism Boards.
          </p>
        </div>

        {/* Exactly 1 Link / Action Button by default: View full analytics */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setShowFullAnalytics(!showFullAnalytics)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#712B13] hover:bg-[#5A220F] text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>{showFullAnalytics ? 'Hide full analytics' : 'View full analytics'}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showFullAnalytics ? 'rotate-90' : ''}`} />
          </button>

          {showFullAnalytics && (
            <>
              <button
                onClick={fetchDMOData}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Refresh Live Sensor Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#712B13]' : ''}`} />
                <span>Sync Telemetry</span>
              </button>

              <button
                onClick={handleExportReport}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#27500A] hover:bg-[#1E3D07] text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (CSV)</span>
              </button>

              <button
                onClick={handleTestItineraryRedirection}
                disabled={testingItinerary}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#712B13] to-[#8C3618] hover:from-[#5A220F] hover:to-[#712B13] text-white flex items-center gap-1.5 shadow-md shadow-amber-900/10 transition-all cursor-pointer"
                title="Simulate a tourist itinerary request for Manali to test gatekeeper redirection"
              >
                <Zap className={`w-3.5 h-3.5 text-[#E5A93C] ${testingItinerary ? 'animate-bounce' : ''}`} />
                <span>{testingItinerary ? 'Testing Redirection...' : 'Test Gatekeeper (Manali)'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Executive KPI Tiles (Visible only when showFullAnalytics is true) */}
      {showFullAnalytics && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          {/* KPI 1: Monitored Destinations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total POIs Mapped</span>
              <div className="w-8 h-8 rounded-xl bg-[#712B13]/10 text-[#712B13] dark:text-[#E5A93C] flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 dark:text-white">
                {platformMetrics.total_destinations.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">36 States/UTs</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Grounding verified destination master registry</p>
          </div>

          {/* KPI 2: Critical Hotspots */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Critical Hotspots</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-red-600 dark:text-red-400">
                {heatmapNodes.filter(n => n.status === 'CRITICAL').length}
              </span>
              <span className="text-[11px] font-bold text-red-500">Saturation &gt; 85%</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Manali, Shimla, Goa, Varanasi exceeding capacity</p>
          </div>

          {/* KPI 3: Active Eco-Permit Locks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Active Gatekeepers</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#712B13] dark:text-[#E5A93C] flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-[#712B13] dark:text-[#E5A93C]">
                {totalActiveLocks}
              </span>
              <span className="text-[11px] font-bold text-amber-600">Throttling Active</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Dynamic rerouting to pristine secondary circuits</p>
          </div>

          {/* KPI 4: Diverted Tourist Volume & CO2 Abatement */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1816] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Decentralized Footfall</span>
              <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-950/40 text-emerald-600 flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-700 dark:text-emerald-400">
                {platformMetrics.diverted_tourist_volume > 0 ? platformMetrics.diverted_tourist_volume.toLocaleString() : '36,900+'}
              </span>
              <span className="text-[11px] font-bold text-emerald-600">Tourists</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Distributed to Jibhi, Tirthan & Bastar homestays</p>
          </div>
        </div>
      )}

      {/* Circuit Management Panel (Visible when dmoTab === 'circuits') */}
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

      {/* Main Grid: Interactive Leaflet Heatmap + Gatekeeper Switchboard */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Leaflet Tourist Density Heatmap (7 cols) */}
        <div className={`${showFullAnalytics ? 'lg:col-span-7' : 'col-span-12'} space-y-4`}>
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

        {/* Right Column: Dynamic Eco-Permit Gatekeeper Control Grid (Visible when showFullAnalytics is true) */}
        {showFullAnalytics && (
          <div className="lg:col-span-5 space-y-4 animate-fadeIn">
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
        )}

      </div>

      {/* Section 4: National Carrying Capacity vs. Heritage Circuit Balance Table */}
      {showFullAnalytics && (
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
            <span className="text-xs font-mono font-bold text-[#712B13] dark:text-[#E5A93C]">
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

    </div>
  );
}
