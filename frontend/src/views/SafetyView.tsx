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
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAFETY_ALERTS, EMERGENCY_NUMBERS } from '../data/travelSathiData';

export default function SafetyView() {
  const { setIsSosModalOpen } = useApp();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [helplines, setHelplines] = useState<any[]>(EMERGENCY_NUMBERS);
  const [fetchTime, setFetchTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch live hourly weather caution cards
  useEffect(() => {
    axios.get('/api/safety/alerts')
      .then(res => {
        if (res.data && res.data.alerts && res.data.alerts.length > 0) {
          setAlerts(res.data.alerts);
          setFetchTime(res.data.fetch_time || '');
          if (res.data.official_helplines && res.data.official_helplines.length > 0) {
            setHelplines(res.data.official_helplines);
          }
        } else {
          setAlerts(SAFETY_ALERTS);
        }
      })
      .catch(err => {
        console.warn('Using static safety data:', err.message);
        setAlerts(SAFETY_ALERTS);
      })
      .finally(() => setLoading(false));
  }, []);

  // Travel Check-In state (Section 35)
  const [trustedName, setTrustedName] = useState('Priya Sharma (Sister)');
  const [trustedPhone, setTrustedPhone] = useState('+91 98765 12345');
  const [expectedArrival, setExpectedArrival] = useState('07:30 PM');
  const [checkInScheduled, setCheckInScheduled] = useState(false);

  const handleScheduleCheckIn = (e) => {
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
            <span>24/7 National Emergency Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold">
            TravelSathi Safety Center
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            Real-time regional advisories, direct integration with India’s 112 Unified Emergency Helpline, and automated location check-ins.
          </p>
        </div>

        <button
          onClick={() => setIsSosModalOpen(true)}
          className="btn-secondary !bg-white !text-semantic-sos hover:!bg-white/90 px-8 py-4 text-sm font-black shadow-2xl shrink-0 flex items-center gap-2 tracking-wider"
        >
          <AlertTriangle className="w-5 h-5 text-semantic-sos" />
          <span>TRIGGER EMERGENCY SOS</span>
        </button>
      </div>

      {/* Grid: Live Alerts & Direct Helplines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: Regional Safety & Weather Alerts */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-nature" />
              <span>Live Regional Travel Advisories</span>
            </h2>
            {fetchTime && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-nature/10 text-nature flex items-center gap-1.5 border border-nature/20 w-fit">
                <Clock className="w-3.5 h-3.5 text-nature" />
                <span>Live Refreshed: {fetchTime}</span>
              </span>
            )}
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
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {alert.region}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                    alert.level === 'Caution' ? 'bg-semantic-warning text-neutral-900' :
                    alert.level === 'High Alert' ? 'bg-semantic-sos text-white' :
                    'bg-nature text-white'
                  }`}>
                    {alert.level}
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {alert.headline}
                </h3>

                <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                  {alert.details}
                </p>

                <div className="pt-2 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between text-[11px] text-neutral-muted">
                  <span>Source: {alert.source}</span>
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">
                    {alert.fetch_time ? `Fetched: ${alert.fetch_time}` : (alert.lastUpdated || 'Hourly Sensor')}
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
                <span>Travel Check-In ("Let Someone Know I'm Safe")</span>
              </div>
              <span className="text-[10px] font-bold text-nature bg-nature-light px-2.5 py-1 rounded-full">
                Consent-Based & Private
              </span>
            </div>

            <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              Set an expected arrival time for your mountain trek or evening highway drive. If you don't confirm safe arrival within 30 minutes, an automated SMS alert with your last GPS ping is sent to your trusted contact.
            </p>

            {!checkInScheduled ? (
              <form onSubmit={handleScheduleCheckIn} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div>
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary block mb-1">
                    Trusted Contact
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
                    Phone Number
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
                    Expected Arrival
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
                    <span>Set Safety Check-In Reminder</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-ts-md bg-nature-light text-nature text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check-In Active: Expected at {expectedArrival}</span>
                </p>
                <p>
                  We will ping your phone at {expectedArrival}. If unconfirmed, notification dispatch to {trustedName} ({trustedPhone}) will trigger at {expectedArrival} + 30 mins.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right 5 Cols: Emergency Helplines & Facilities */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-semantic-sos" />
            <span>24x7 Emergency Hotlines</span>
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
                    {item.service}
                  </p>
                  <p className="text-[11px] text-neutral-muted">
                    {item.description}
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
              <span>Offline Traveler Emergency Profile</span>
            </div>
            <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              Your blood group (O+), primary emergency contact, and homestay address are cached in your local <strong>Trip Wallet</strong> for instant display even when internet connectivity drops to zero.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
