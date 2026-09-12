import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  CloudRain, 
  Calendar, 
  Bookmark, 
  ShieldCheck, 
  Check, 
  CheckCheck, 
  ExternalLink,
  Info,
  Clock
} from 'lucide-react';

export default function NotificationsView() {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'weather_warning',
      title: 'Monsoon Alert: Western Ghats',
      message: 'Active rainfall projected in Munnar & Idukki for the next 48 hours. Indoor cultural museums and spice plantation tours are recommended.',
      timestamp: '2 hours ago',
      read: false,
      priority: 'high',
      actionUrl: '/weather?destination=Munnar',
      actionLabel: 'View Weather Advisory'
    },
    {
      id: 2,
      type: 'trip_reminder',
      title: 'Upcoming Expedition: Himachal Circuit',
      message: 'Your 5-day itinerary begins in 4 days. Remember to download offline GPS maps and verify Rohtang pass permit requirements.',
      timestamp: 'Yesterday',
      read: false,
      priority: 'medium',
      actionUrl: '/trips',
      actionLabel: 'Open Itinerary'
    },
    {
      id: 3,
      type: 'destination_alert',
      title: 'High Crowd Density Warning: Virupaksha Temple',
      message: 'Live footfall index at Hampi indicates 85% capacity. Visit between 06:00 - 08:30 AM for peaceful exploration and heritage photography.',
      timestamp: '2 days ago',
      read: true,
      priority: 'medium',
      actionUrl: '/destinations/2',
      actionLabel: 'View Destination'
    },
    {
      id: 4,
      type: 'safety_advisory',
      title: 'DPI Verified Safe Corridor',
      message: 'Himachal Pradesh Police verified SOS telemetry is actively operational across NH-3 with 8 rapid response centers on standby.',
      timestamp: '3 days ago',
      read: true,
      priority: 'low',
      actionUrl: '/safety',
      actionLabel: 'Safety Hub'
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markSingleRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'weather_warning':
        return <CloudRain className="w-5 h-5 text-amber-500" />;
      case 'trip_reminder':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'destination_alert':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'safety_advisory':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'alerts') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-neutral-bg dark:bg-darkmode-bg text-neutral-text-primary dark:text-darkmode-text-primary pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-6 border-b border-neutral-border dark:border-darkmode-border gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand font-semibold text-sm tracking-wide uppercase mb-1">
            <Bell className="w-4 h-4" />
            Travel Intelligence Alerts
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
            Notifications & Advisories
          </h1>
          <p className="mt-2 text-sm text-neutral-text-secondary dark:text-darkmode-text-secondary">
            Verified meteorological alerts, itinerary time triggers, and crowd-density warnings for your travels.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-surface dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border hover:border-brand/40 transition-colors self-start sm:self-auto shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-brand" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'alerts', label: 'High Priority' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeFilter === f.id
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-neutral-surface dark:bg-darkmode-surface border-neutral-border dark:border-darkmode-border text-neutral-text-secondary hover:border-brand/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-neutral-surface dark:bg-darkmode-surface rounded-3xl border border-dashed border-neutral-border dark:border-darkmode-border p-8">
          <Bell className="w-12 h-12 text-neutral-text-secondary mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold">You're all caught up</h3>
          <p className="text-xs text-neutral-text-secondary mt-1">No unread travel alerts or weather warnings right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.read 
                  ? 'bg-neutral-surface/60 dark:bg-darkmode-surface/60 border-neutral-border dark:border-darkmode-border opacity-85'
                  : 'bg-neutral-surface dark:bg-darkmode-surface border-brand/40 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  item.priority === 'high' ? 'bg-amber-500/10' : 'bg-neutral-bg dark:bg-darkmode-bg'
                }`}>
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-brand"></span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-text-secondary flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-text-secondary dark:text-darkmode-text-secondary mt-1.5 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                    {item.actionUrl && (
                      <button
                        onClick={() => {
                          markSingleRead(item.id);
                          navigate(item.actionUrl);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm"
                      >
                        {item.actionLabel}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {!item.read && (
                      <button
                        onClick={() => markSingleRead(item.id)}
                        className="text-xs text-neutral-text-secondary hover:text-brand font-medium"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
