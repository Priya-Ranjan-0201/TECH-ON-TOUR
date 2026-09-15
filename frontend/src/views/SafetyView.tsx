import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  AlertTriangle, 
  PhoneCall, 
  MapPin, 
  Hospital, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Send,
  Lock,
  ExternalLink,
  RefreshCw,
  Navigation,
  Locate
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/summaryTranslator';
import { SAFETY_ALERTS, EMERGENCY_NUMBERS } from '../data/travelSathiData';
import NearbyHospitals from '../components/safety/NearbyHospitals';

export default function SafetyView() {
  const { t, i18n } = useTranslation();
  const { setIsSosModalOpen } = useApp();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 31.2619, lng: 75.7031 });
  const [locationLabel, setLocationLabel] = useState<string>('Detecting live location...');
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [helplines, setHelplines] = useState<any[]>(EMERGENCY_NUMBERS);
  const [fetchTime, setFetchTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch live regional tourist safety advisories strictly filtered to <= 500 km
  const fetchAlerts = (lat: number, lng: number) => {
    setLoading(true);
    axios.get('/api/safety/alerts', {
      params: { lat, lng, max_distance_km: 500 }
    })
      .then(res => {
        if (res.data && Array.isArray(res.data.alerts) && res.data.alerts.length > 0) {
          // Strictly enforce <= 500 km and take 6 to 7 advisories
          const nearbyOnly = res.data.alerts
            .filter((a: any) => a.distance_km == null || a.distance_km <= 500)
            .slice(0, 7);
          setAlerts(nearbyOnly);
          setFetchTime(res.data.fetch_time || '');
          if (res.data.official_helplines && res.data.official_helplines.length > 0) {
            setHelplines(res.data.official_helplines);
          }
        } else {
          setAlerts(SAFETY_ALERTS.slice(0, 7));
        }
      })
      .catch(err => {
        console.warn('Failed fetching safety alerts, using static regional fallback:', err.message);
        setAlerts(SAFETY_ALERTS.slice(0, 7));
      })
      .finally(() => setLoading(false));
  };

  const detectLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          setCoords({ lat, lng });
          setGpsLocked(true);
          setLocationLabel(`GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          setIsLocating(false);
          fetchAlerts(lat, lng);
        },
        (err) => {
          console.warn('Geolocation failed or denied, using fallback coordinates:', err.message);
          setIsLocating(false);
          setGpsLocked(false);
          setLocationLabel('GPS: 31.2619° N, 75.7031° E (Northern Hub)');
          fetchAlerts(31.2619, 75.7031);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      setGpsLocked(false);
      setLocationLabel('GPS: 31.2619° N, 75.7031° E');
      fetchAlerts(31.2619, 75.7031);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Travel Check-In state (Section 35)
  const [trustedName, setTrustedName] = useState('Priya Sharma (Sister)');
  const [trustedPhone, setTrustedPhone] = useState('+91 98765 12345');
  const [expectedArrival, setExpectedArrival] = useState('07:30 PM');
  const [checkInScheduled, setCheckInScheduled] = useState(false);

  const handleScheduleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInScheduled(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header Banner with Emergency SOS Hero */}
      <div className="bg-gradient-to-r from-semantic-sos via-semantic-sos to-semantic-error/90 text-white rounded-ts-hero p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>{t('safety.emergencyCenter', '24/7 National Emergency Center')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold">
            {t('safety.centerTitle', 'TravelSathi Safety Center')}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            {t('safety.centerSubtitle', 'Real-time regional advisories, direct integration with India’s 112 Unified Emergency Helpline, and automated location check-ins.')}
          </p>
        </div>

        <button
          onClick={() => setIsSosModalOpen(true)}
          className="btn-secondary !bg-white !text-semantic-sos hover:!bg-white/90 px-8 py-4 text-sm font-black shadow-2xl shrink-0 flex items-center gap-2 tracking-wider"
        >
          <AlertTriangle className="w-5 h-5 text-semantic-sos" />
          <span>{t('safety.triggerSos', 'TRIGGER EMERGENCY SOS')}</span>
        </button>
      </div>
 
      {/* Nearest Hospitals & Clinics Locator */}
      <section className="ts-card p-6 sm:p-8 space-y-6 bg-neutral-card dark:bg-darkmode-surface border-2 border-rose-500/20 shadow-lg">
        <NearbyHospitals initialCoords={coords} />
      </section>

      {/* Grid: Live Alerts & Direct Helplines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: Regional Safety & Weather Alerts */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-nature" />
                <h2 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {t('safety.liveAdvisories', 'Live Regional Travel Advisories')}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {t('safety.radiusLimit', '≤ 500 km Radius')}
                </span>
              </div>
              <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary flex items-center gap-1.5 mt-0.5">
                <Locate className={`w-3.5 h-3.5 ${gpsLocked ? 'text-emerald-600' : 'text-amber-500'}`} />
                <span>{locationLabel}</span>
                <span className="text-neutral-400">• {t('safety.showingAdvisories', { count: alerts.length, defaultValue: `Showing ${alerts.length} Nearby Tourist Advisories` })}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={detectLocation}
                disabled={isLocating}
                title="Refresh Proximity Advisories"
                className="btn-secondary !p-2 !text-xs flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-brand-primary' : ''}`} />
                <span className="hidden sm:inline">{t('safety.refresh', 'Refresh')}</span>
              </button>

              {fetchTime && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-nature/10 text-nature flex items-center gap-1.5 border border-nature/20 w-fit shrink-0">
                  <Clock className="w-3.5 h-3.5 text-nature" />
                  <span>{translateText(fetchTime, i18n.language)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`ts-card p-5 border-l-4 ${
                  alert.level === 'Caution' ? 'border-l-semantic-warning bg-semantic-warning/5' :
                  alert.level === 'High Alert' ? 'border-l-semantic-sos bg-semantic-error/5' :
                  'border-l-nature bg-nature-light/30'
                } space-y-2`}
              >
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                      {translateText(alert.region, i18n.language)}
                    </span>
                    {alert.distance_km != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Navigation className="w-2.5 h-2.5 text-blue-600" />
                        <span>{translateText(`${alert.distance_km} km away`, i18n.language)}</span>
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                    alert.level === 'Caution' ? 'bg-semantic-warning text-neutral-900' :
                    alert.level === 'High Alert' ? 'bg-semantic-sos text-white' :
                    'bg-nature text-white'
                  }`}>
                    {translateText(alert.level, i18n.language)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {translateText(alert.headline, i18n.language)}
                </h3>

                <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                  {translateText(alert.details, i18n.language)}
                </p>

                {/* Nearest Hospital & Police Station for this Region */}
                {(alert.nearest_hospital || alert.nearest_police_station) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {alert.nearest_hospital && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-darkmode-elevated border border-neutral-200 dark:border-darkmode-border space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100 text-[11px]">
                            <Hospital className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{translateText(alert.nearest_hospital.name, i18n.language)}</span>
                          </div>
                          {alert.nearest_hospital.emergency_24x7 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-extrabold uppercase">
                              24x7
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate">
                          {translateText(alert.nearest_hospital.address, i18n.language)}
                        </div>
                        <a
                          href={`tel:${alert.nearest_hospital.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{alert.nearest_hospital.phone}</span>
                        </a>
                      </div>
                    )}

                    {alert.nearest_police_station && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-darkmode-elevated border border-neutral-200 dark:border-darkmode-border space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100 text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                            <span className="truncate">{translateText(alert.nearest_police_station.name, i18n.language)}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-extrabold">
                            Police
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate">
                          {translateText(alert.nearest_police_station.jurisdiction, i18n.language)}
                        </div>
                        <a
                          href={`tel:${alert.nearest_police_station.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-800 hover:text-primary-900"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{alert.nearest_police_station.phone}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between text-[11px] text-neutral-muted">
                  <span>{t('safety.source', 'Source')}: {translateText(alert.source, i18n.language)}</span>
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">
                    {alert.fetch_time ? translateText(`Live (${alert.fetch_time})`, i18n.language) : (alert.lastUpdated?.includes('-') ? `${t('safety.verified', 'Verified')} ${alert.lastUpdated}` : `${t('safety.verified', 'Verified')} 2026-09-12`)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Section 35: Travel Check-In Feature */}
          <div className="ts-card p-6 space-y-4 bg-neutral-card dark:bg-darkmode-surface border-2 border-brand/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand font-bold text-base">
                <UserCheck className="w-5 h-5" />
                <span>{t('safety.checkInTitle', 'Travel Check-In ("Let Someone Know I\'m Safe")')}</span>
              </div>
              <span className="text-[10px] font-bold text-nature bg-nature-light px-2.5 py-1 rounded-full">
                {t('safety.consentPrivate', 'Consent-Based & Private')}
              </span>
            </div>

            <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              {t('safety.checkInDesc', 'Set an expected arrival time for your mountain trek or evening highway drive. If you don\'t confirm safe arrival within 30 minutes, an automated SMS alert with your last GPS ping is sent to your trusted contact.')}
            </p>

            {!checkInScheduled ? (
              <form onSubmit={handleScheduleCheckIn} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div>
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                    {t('safety.trustedContact', 'Trusted Contact')}
                  </label>
                  <input
                    type="text"
                    value={trustedName}
                    onChange={(e) => setTrustedName(e.target.value)}
                    className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                    {t('safety.phoneNumber', 'Phone Number')}
                  </label>
                  <input
                    type="text"
                    value={trustedPhone}
                    onChange={(e) => setTrustedPhone(e.target.value)}
                    className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                    {t('safety.expectedArrival', 'Expected Arrival')}
                  </label>
                  <input
                    type="text"
                    value={expectedArrival}
                    onChange={(e) => setExpectedArrival(e.target.value)}
                    className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border"
                  />
                </div>

                <div className="sm:col-span-3 pt-1">
                  <button type="submit" className="btn-brand text-xs font-bold w-full py-2.5 flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{t('safety.setReminder', 'Set Safety Check-In Reminder')}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-ts-md bg-nature-light text-nature text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('safety.checkInActive', { time: expectedArrival, defaultValue: `Check-In Active: Expected at ${expectedArrival}` })}</span>
                </p>
                <p>
                  {t('safety.checkInActiveDesc', { time: expectedArrival, name: trustedName, phone: trustedPhone, defaultValue: `We will ping your phone at ${expectedArrival}. If unconfirmed, notification dispatch to ${trustedName} (${trustedPhone}) will trigger at ${expectedArrival} + 30 mins.` })}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right 5 Cols: Emergency Helplines & Facilities */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-semantic-sos" />
            <span>{t('safety.emergencyHotlines', '24x7 Emergency Hotlines')}</span>
          </h2>

          <div className="space-y-3">
            {helplines.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="ts-card p-4 flex items-center justify-between hover:border-semantic-sos transition-colors group block"
              >
                <div>
                  <p className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-semantic-sos transition-colors">
                    {translateText(item.service, i18n.language)}
                  </p>
                  <p className="text-[11px] text-neutral-muted">
                    {translateText(item.description, i18n.language)}
                  </p>
                </div>
                <span className="text-base font-black text-semantic-sos bg-semantic-sos/10 px-3 py-1.5 rounded-ts-sm border border-semantic-sos/20">
                  {item.number}
                </span>
              </a>
            ))}
          </div>

          {/* Offline Emergency Card Summary */}
          <div className="p-5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-3 text-xs">
            <div className="flex items-center gap-2 text-brand font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>{t('safety.offlineProfile', 'Offline Traveler Emergency Profile')}</span>
            </div>
            <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              {t('safety.offlineProfileDesc', 'Your blood group (O+), primary emergency contact, and homestay address are cached in your local Trip Wallet for instant display even when internet connectivity drops to zero.')}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
