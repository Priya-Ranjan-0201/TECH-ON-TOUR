import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, 
  CloudSun, 
  Sun, 
  CloudRain, 
  Snowflake, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  AlertCircle,
  Thermometer,
  Wind
} from 'lucide-react';

export default function SeasonalView() {
  const navigate = useNavigate();

  const currentMonthIdx = new Date().getMonth() + 1; // 1 - 12
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const months = [
    { num: 1, name: 'January', season: 'Winter', icon: Snowflake },
    { num: 2, name: 'February', season: 'Winter / Spring', icon: Snowflake },
    { num: 3, name: 'March', season: 'Spring', icon: Sun },
    { num: 4, name: 'April', season: 'Summer', icon: Sun },
    { num: 5, name: 'May', season: 'Summer', icon: Sun },
    { num: 6, name: 'June', season: 'Monsoon Onset', icon: CloudRain },
    { num: 7, name: 'July', season: 'Peak Monsoon', icon: CloudRain },
    { num: 8, name: 'August', season: 'Monsoon', icon: CloudRain },
    { num: 9, name: 'September', season: 'Autumn / Post-Monsoon', icon: CloudSun },
    { num: 10, name: 'October', season: 'Autumn', icon: CloudSun },
    { num: 11, name: 'November', season: 'Pre-Winter', icon: CloudSun },
    { num: 12, name: 'December', season: 'Winter', icon: Snowflake },
  ];

  const activeMonthInfo = months.find(m => m.num === selectedMonth) || months[currentMonthIdx - 1];

  const onMonthSelect = (monthNum: number) => {
    setSelectedMonth(monthNum);
  };

  const fetchSeasonalData = async (monthNum = selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      const monthObj = months.find(m => m.num === monthNum) || months[0];
      const res = await axios.get(`/api/destinations/by-month?month=${encodeURIComponent(monthObj.name)}`);
      const raw = Array.isArray(res.data) ? res.data : (res.data?.destinations || res.data?.recommendations || []);
      const withPhotos = raw.filter((item: any) => (item.image_url || item.image) && (item.image_url || item.image).trim() !== '');
      setDestinations(withPhotos);
    } catch (err) {
      setError('Could not retrieve seasonal climate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonalData(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-darkmode-elevated text-brand border border-brand/20 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Model 2 Meteorological Climate Classifier</span>
            </span>
            <span className="text-xs font-mono text-neutral-muted">Temporal Suitability Matrix</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Where to Travel by Month & Season
          </h1>
          <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Historical climate normals, monsoon alerts, and temperature suitability scores to avoid seasonal disruptions.
          </p>
        </div>

        {/* Selected Month Status Card */}
        <div className="ts-card p-4 flex items-center gap-3 bg-gradient-to-r from-brand-50/40 to-nature/5">
          <activeMonthInfo.icon className="w-8 h-8 text-brand" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-muted">Selected Travel Window</span>
            <p className="font-extrabold text-base text-neutral-text-primary dark:text-darkmode-text-primary">
              {activeMonthInfo.name} ({activeMonthInfo.season})
            </p>
          </div>
        </div>
      </div>

      {/* 12-Month Temporal Slider Strip */}
      <div className="ts-card p-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {months.map((m) => {
            const IconComponent = m.icon;
            const isSelected = m.num === selectedMonth;
            const isCurrent = m.num === currentMonthIdx;
            return (
              <button
                key={m.num}
                onClick={() => onMonthSelect(m.num)}
                className={`px-4 py-2.5 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-brand text-white shadow-md scale-105'
                    : 'bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border text-neutral-text-sec hover:border-brand'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <IconComponent className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">{m.name.slice(0, 3)}</span>
                </div>
                {isCurrent && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/30 text-white' : 'bg-brand/10 text-brand'}`}>
                    Now
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ts-card p-4 space-y-3">
              <div className="w-full h-44 bg-neutral-200 dark:bg-darkmode-border rounded-lg" />
              <div className="w-3/4 h-4 bg-neutral-200 dark:bg-darkmode-border rounded" />
              <div className="w-1/2 h-3 bg-neutral-200 dark:bg-darkmode-border rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="ts-card p-10 text-center space-y-3 max-w-md mx-auto">
          <p className="text-rose-600 font-bold text-sm">{error}</p>
          <button onClick={() => fetchSeasonalData()} className="btn-brand text-xs font-bold py-2 px-4 cursor-pointer">
            Retry Loading Seasonal Data
          </button>
        </div>
      )}

      {/* Seasonal Destination Cards */}
      {!loading && !error && destinations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => {
            return (
              <div
                key={dest.id}
                onClick={() => navigate(`/destination/${dest.id}`)}
                className="ts-card overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-neutral-200">
                    <img
                      src={dest.image || dest.image_url}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1 ${
                      dest.in_season !== false ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{dest.seasonal_badge || `Optimal Season: ${activeMonthInfo.name}`}</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{dest.rating || 4.7}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand">{dest.category || 'Sightseeing'}</span>
                        {dest.climate_suitability && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            dest.climate_suitability === 'Excellent' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : dest.climate_suitability === 'Good'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}>
                            {dest.climate_suitability} Climate
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1">
                        {dest.name}
                      </h3>
                      <p className="text-xs text-neutral-muted">{dest.state}</p>
                    </div>

                    {/* Climate Telemetry */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-border dark:border-darkmode-border">
                      <div className="flex items-center gap-1.5 text-neutral-text-sec dark:text-darkmode-text-secondary">
                        <Thermometer className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span className="truncate">{dest.temperature ? `Est: ${dest.temperature} • ${dest.weather_condition || 'Clear'}` : 'Est: ~24°C • Pleasant'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-text-sec dark:text-darkmode-text-secondary">
                        <Wind className="w-3.5 h-3.5 text-nature shrink-0" />
                        <span className="truncate">{dest.rain_risk || 'Low Rain Risk'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-neutral-border flex items-center justify-between text-xs font-bold text-brand">
                    <span>Explore Seasonal Guide</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
