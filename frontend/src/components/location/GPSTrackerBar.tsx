import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, Compass, Shield, Users, Radio, AlertTriangle, X, ChevronRight, Check } from 'lucide-react';

export default function GPSTrackerBar({ geo }) {
  const { t } = useTranslation();
  const {
    isTracking,
    trackingMode,
    coordinates,
    accuracy,
    speed,
    lastUpdated,
    error,
    arrivalAlert,
    dismissArrivalAlert,
    startTracking,
    stopTracking,
    requestOneTimePosition
  } = geo;

  const [showModeSelector, setShowModeSelector] = useState(false);

  const getSecondsAgo = () => {
    if (!lastUpdated) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
    if (diff < 5) return 'Just now';
    return `${diff}s ago`;
  };

  const isLowAccuracy = accuracy && accuracy > 45;

  const handleModeSelect = (mode) => {
    setShowModeSelector(false);
    startTracking(mode);
  };

  return (
    <div className="w-full bg-neutral-card dark:bg-darkmode-surface border-b border-neutral-border dark:border-darkmode-border py-2 px-4 text-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold">
            {isTracking ? (
              <span className="flex items-center gap-1.5 text-secondary-600 dark:text-secondary-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-600"></span>
                </span>
                ● {t('common.liveLocationOn', 'LIVE LOCATION ON')}
              </span>
            ) : (
              <span className="text-neutral-text-secondary dark:text-darkmode-text-secondary flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full border border-neutral-400"></span>
                ○ {t('common.locationOff', 'LOCATION OFF')}
              </span>
            )}
          </div>

          {/* GPS Accuracy & Timestamp */}
          {coordinates && (
            <div className="hidden sm:flex items-center gap-3 text-neutral-text-secondary dark:text-darkmode-text-secondary pl-3 border-l border-neutral-border dark:border-darkmode-border">
              {accuracy && <span>{t('common.accuracy', 'Accuracy')}: ±{accuracy} m</span>}
              {speed !== null && speed > 0 && <span>{t('common.speed', 'Speed')}: {speed} km/h</span>}
              <span>{t('common.updated', 'Updated')}: {getSecondsAgo()}</span>
            </div>
          )}

          {/* Low Accuracy Warning */}
          {isLowAccuracy && (
            <span className="hidden md:flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('common.lowAccuracyWarning', 'Location accuracy is low. Move to an open area.')}
            </span>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 relative">
          {error && (
            <span className="text-danger dark:text-red-400 max-w-xs truncate hidden lg:inline">
              {error}
            </span>
          )}

          {isTracking ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-secondary-50 dark:bg-darkmode-elevated text-secondary-800 dark:text-secondary-400 font-medium capitalize border border-secondary-200 dark:border-darkmode-border">
                Mode: {trackingMode.replace('_', ' ')}
              </span>

              <button
                onClick={stopTracking}
                className="px-3 py-1 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated hover:bg-neutral-border text-neutral-text-primary dark:text-darkmode-text-primary font-medium transition-colors border border-neutral-border dark:border-darkmode-border"
              >
                {t('common.stopTracking', 'Stop Tracking')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={requestOneTimePosition}
                className="px-2.5 py-1 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated hover:bg-neutral-border text-neutral-text-primary dark:text-darkmode-text-primary font-medium transition-colors border border-neutral-border dark:border-darkmode-border flex items-center gap-1"
              >
                <Navigation className="w-3 h-3 text-primary-800 dark:text-accent-400" />
                {t('common.enableGps', 'Find Near Me')}
              </button>

              <button
                onClick={() => setShowModeSelector(prev => !prev)}
                className="px-3 py-1 rounded-ts-sm bg-primary-800 hover:bg-primary-900 text-primary-50 font-semibold transition-all shadow-sm flex items-center gap-1"
              >
                <Radio className="w-3 h-3 animate-pulse" />
                {t('common.liveLocationOn', 'Enable Live Location')}
              </button>
            </div>
          )}

          {/* Mode Selector Popover */}
          {showModeSelector && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-md shadow-ts-hover p-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-neutral-text-primary dark:text-darkmode-text-primary text-xs">
                  Select Location Tracking Mode
                </span>
                <button onClick={() => setShowModeSelector(false)} className="p-0.5 text-neutral-400 hover:text-neutral-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'one_time', label: 'Mode 1: Nearby Discovery', desc: 'One-time position for nearby recommendations' },
                  { id: 'live_navigation', label: 'Mode 2: Live Navigation', desc: 'Continuous route & geofence arrival detection' },
                  { id: 'group_sharing', label: 'Mode 3: Group Sharing', desc: 'Share position with authenticated trip members' },
                  { id: 'trip_track', label: 'Mode 4: Trip Track Record', desc: 'Save itinerary distance & visited points history' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleModeSelect(m.id)}
                    className="w-full text-left p-2 rounded hover:bg-neutral-bg dark:hover:bg-darkmode-elevated transition-colors text-xs flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-primary-800 dark:text-accent-400">{m.label}</span>
                    <span className="text-[11px] text-neutral-text-secondary dark:text-darkmode-text-secondary">{m.desc}</span>
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-neutral-muted mt-2 pt-2 border-t border-neutral-border dark:border-darkmode-border">
                Strict privacy: Location history is encrypted with an 8-hour auto-expire retention limit.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Geofence Arrival Alert Notification Banner */}
      {arrivalAlert && (
        <div className="max-w-7xl mx-auto mt-2 p-3 bg-primary-50 dark:bg-darkmode-elevated border border-primary-200 dark:border-darkmode-border rounded-ts-md flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-full bg-secondary-800 text-white">
              <Check className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-primary-900 dark:text-primary-100 text-xs">
                {arrivalAlert.message}
              </p>
              <p className="text-[11px] text-neutral-text-secondary dark:text-darkmode-text-secondary">
                Safety score {arrivalAlert.safety_score}% · Tap to view history, local culture & nearby services.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/destination/${arrivalAlert.destination_id}`}
              className="px-2.5 py-1 rounded bg-primary-800 text-primary-50 text-xs font-semibold hover:bg-primary-900 transition-colors"
            >
              View Guide
            </a>
            <button
              onClick={dismissArrivalAlert}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
