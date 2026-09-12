import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Layers, 
  Download, 
  ShieldAlert, 
  Leaf, 
  Compass, 
  FileText,
  Calendar,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GovDashboardView() {
  const { govData } = useApp();
  const [activeTab, setActiveTab] = useState('pressure'); // 'pressure' | 'overview' | 'forecast' | 'infrastructure' | 'reports'
  const [pressureFilter, setPressureFilter] = useState('All'); // 'All' | 'Critical' | 'High' | 'Low'
  const [forecastMonths, setForecastMonths] = useState('6');
  const [reportExportedToast, setReportExportedToast] = useState(false);

  const filteredHotspots = govData.pressureIndexHotspots.filter(h => {
    if (pressureFilter === 'All') return true;
    return h.pressureLevel.toLowerCase() === pressureFilter.toLowerCase();
  });

  const handleExportData = () => {
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(
      "Destination,State,CarryingCapacity,CurrentDensity,PressureLevel,WaterStress,Intervention\n" +
      govData.pressureIndexHotspots.map(h => `"${h.destination}","${h.state}",${h.carryingCapacity},${h.currentDensity},"${h.pressureLevel}","${h.waterStress}","${h.interventionNeeded}"`).join("\n")
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "travelsathi_destination_pressure_index.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setReportExportedToast(true);
    setTimeout(() => setReportExportedToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-trust">
              🏛️ DMO & Tourism Board Command Center
            </span>
            <span className="text-xs font-mono text-neutral-muted">Swadesh Darshan 2.0 • Data Analytics Rail</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Government Tourism Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-0.5">
            Real-time carrying capacity monitoring, Destination Pressure Index (DPI), and tourism forecasting.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="btn-brand !bg-trust hover:!bg-trust-hover !text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* Gov Navigation Bar (Section 90: High information density) */}
      <div className="flex items-center gap-2 border-b border-neutral-border dark:border-darkmode-border pb-3 overflow-x-auto text-xs font-bold">
        {[
          { id: 'pressure', label: 'Destination Pressure Index (DPI)' },
          { id: 'overview', label: 'Macro Footfall & Economics' },
          { id: 'forecast', label: 'Tourism Demand Forecasting' },
          { id: 'infrastructure', label: 'Infrastructure Gap Intelligence' },
          { id: 'reports', label: 'Policy Reports & Documentation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-ts-sm transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'bg-trust text-white shadow-sm'
                : 'bg-neutral-card dark:bg-darkmode-surface border border-neutral-border text-neutral-text-sec hover:text-trust'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reportExportedToast && (
        <div className="p-3 bg-nature-light text-nature border border-nature/30 rounded-ts-md text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Destination Pressure Index export generated and downloaded.</span>
        </div>
      )}

      {/* Tab 1: Destination Pressure Index (Section 48) */}
      {activeTab === 'pressure' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                Destination Pressure Index (DPI) & Saturation Warnings
              </h3>
              <p className="text-xs text-neutral-muted">
                Early-warning intervention model identifying over-saturated corridors and pristine alternative sinks.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {['All', 'Critical', 'High', 'Low'].map(level => (
                <button
                  key={level}
                  onClick={() => setPressureFilter(level)}
                  className={`px-3 py-1.5 rounded-full border transition-colors ${
                    pressureFilter === level
                      ? 'bg-trust text-white border-trust'
                      : 'bg-neutral-card dark:bg-darkmode-surface border-neutral-border text-neutral-text-sec hover:border-trust'
                  }`}
                >
                  {level} Pressure
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="ts-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-bg-secondary dark:bg-darkmode-elevated border-b border-neutral-border text-neutral-muted uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">Destination Corridor</th>
                  <th className="p-4">Carrying Capacity</th>
                  <th className="p-4">Current Visitor Density</th>
                  <th className="p-4">Pressure Level</th>
                  <th className="p-4">Water/Waste Stress</th>
                  <th className="p-4">Early-Warning Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border dark:divide-darkmode-border">
                {filteredHotspots.map((hotspot, idx) => (
                  <tr key={idx} className="hover:bg-neutral-bg/60 dark:hover:bg-darkmode-elevated/40 transition-colors">
                    <td className="p-4 font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                      {hotspot.destination}
                      <span className="block text-[11px] font-normal text-neutral-muted">{hotspot.state}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold">
                      {hotspot.carryingCapacity.toLocaleString()} / day
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {hotspot.currentDensity.toLocaleString()} / day
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        hotspot.pressureLevel === 'Critical' ? 'bg-semantic-error/15 text-semantic-sos' :
                        hotspot.pressureLevel === 'High' ? 'bg-semantic-warning/15 text-semantic-warning font-black' :
                        'bg-nature-light text-nature'
                      }`}>
                        {hotspot.pressureLevel}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${hotspot.waterStress === 'High' ? 'text-semantic-sos' : 'text-neutral-text-sec'}`}>
                        {hotspot.waterStress}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed max-w-xs">
                      {hotspot.interventionNeeded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Macro Footfall & Economics (Section 47) */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ts-card p-5 space-y-1 border-t-4 border-t-trust">
              <span className="text-[11px] font-bold text-neutral-muted uppercase">Annual Tourist Footfall</span>
              <p className="text-2xl font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {govData.macroMetrics.totalArrivals}
              </p>
              <span className="text-[11px] text-neutral-muted">Domestic: {govData.macroMetrics.domesticShare} • Intl: {govData.macroMetrics.internationalShare}</span>
            </div>

            <div className="ts-card p-5 space-y-1 border-t-4 border-t-brand">
              <span className="text-[11px] font-bold text-neutral-muted uppercase">Avg. Length of Stay</span>
              <p className="text-2xl font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {govData.macroMetrics.avgStayDays}
              </p>
              <span className="text-[11px] text-nature font-semibold">+0.8 days vs last year</span>
            </div>

            <div className="ts-card p-5 space-y-1 border-t-4 border-t-nature">
              <span className="text-[11px] font-bold text-neutral-muted uppercase">Total Economic Output</span>
              <p className="text-2xl font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {govData.macroMetrics.totalEconomicImpactCr}
              </p>
              <span className="text-[11px] text-nature font-bold">Community share: {govData.macroMetrics.localCommunityShareCr}</span>
            </div>

            <div className="ts-card p-5 space-y-1 border-t-4 border-t-action">
              <span className="text-[11px] font-bold text-neutral-muted uppercase">Carbon Reduction</span>
              <p className="text-2xl font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                {govData.macroMetrics.carbonReductionTons}
              </p>
              <span className="text-[11px] text-neutral-muted">Via low-impact green routing</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tourism Demand Forecasting (Section 49) */}
      {activeTab === 'forecast' && (
        <div className="ts-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-border">
            <div>
              <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                Predictive Tourism Demand & Seasonal Surge Modeling
              </h3>
              <p className="text-xs text-neutral-muted">
                Synthesized from railway bookings, flight search volumes, and holiday calendars.
              </p>
            </div>

            <select
              value={forecastMonths}
              onChange={(e) => setForecastMonths(e.target.value)}
              className="p-2 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-xs font-bold"
            >
              <option value="3">Next 3 Months Horizon</option>
              <option value="6">Next 6 Months Horizon</option>
              <option value="12">Next 12 Months Horizon</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated space-y-2">
              <span className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary block">
                Upcoming Surge: Diwali & Pushkar
              </span>
              <p className="text-neutral-text-sec leading-relaxed">
                Rajasthan heritage circuits expected to operate at 114% of carrying capacity. Recommended policy: Issue dynamic advisory diverting incoming Delhi road traffic toward Shekhawati havelis.
              </p>
            </div>

            <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated space-y-2">
              <span className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary block">
                Emerging Winter Destination: Bastar
              </span>
              <p className="text-neutral-text-sec leading-relaxed">
                Search queries up by +68% following PM-JUGA tribal homestay accreditation. Homestay capacity currently sufficient for 2,400 additional visitors.
              </p>
            </div>

            <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated space-y-2">
              <span className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary block">
                Western Ghats Post-Monsoon Season
              </span>
              <p className="text-neutral-text-sec leading-relaxed">
                Marayoor and Idukki tea belts projected for steady, balanced 64% occupancy. Zero intervention needed; green corridor standard maintained.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Infrastructure Gap Intelligence (Section 50) */}
      {activeTab === 'infrastructure' && (
        <div className="ts-card p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-neutral-border">
            <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Identified Tourism Infrastructure Gaps
            </h3>
            <p className="text-xs text-neutral-muted">
              Tier-II & III districts requiring targeted public capital allocation under Swadesh Darshan 2.0.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {govData.infrastructureGaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">{gap.district}</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    gap.severity === 'High' ? 'bg-semantic-sos text-white' : 'bg-semantic-warning text-neutral-900'
                  }`}>
                    {gap.severity} Priority
                  </span>
                </div>

                <p className="font-semibold text-trust">{gap.category}</p>
                <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                  {gap.description}
                </p>
                <p className="text-[11px] text-neutral-muted pt-1 border-t border-neutral-border">
                  Target Project Completion: <strong>{gap.targetTimeline}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Policy Reports & Documentation */}
      {activeTab === 'reports' && (
        <div className="ts-card p-6 sm:p-8 space-y-6 max-w-3xl">
          <div className="pb-4 border-b border-neutral-border">
            <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Official Tourism Policy Documentation
            </h3>
            <p className="text-xs text-neutral-muted">
              Download formal whitepapers and statistical summaries for ministerial review.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Swadesh Darshan 2.0 Community Capacity Report (Q3 2026)</p>
                <p className="text-neutral-muted">PDF • 4.2 MB • Ministry of Tourism</p>
              </div>
              <button onClick={handleExportData} className="btn-secondary !text-xs font-bold">
                Download PDF
              </button>
            </div>

            <div className="p-4 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">PM-JUGA Tribal Homestay Economic Benefit Audit</p>
                <p className="text-neutral-muted">PDF • 2.8 MB • Ministry of Tribal Affairs</p>
              </div>
              <button onClick={handleExportData} className="btn-secondary !text-xs font-bold">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
