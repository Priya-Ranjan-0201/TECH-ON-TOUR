import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Navigation, Sparkles, Clock, Users, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TripsView() {
  const navigate = useNavigate();
  const { activeTrip, currentUser } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const defaultTrips = [
    {
      id: 'trip-1',
      title: 'Tirthan Valley & Great Himalayan National Park Trail',
      destination: 'Himachal Pradesh',
      dates: 'Oct 14 – Oct 17, 2026',
      status: 'In Progress',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
      days: 4,
      isActive: true
    },
    {
      id: 'trip-2',
      title: 'Bastar Tribal Crafts & Chitrakote Waterfalls',
      destination: 'Chhattisgarh',
      dates: 'Dec 02 – Dec 06, 2026',
      status: 'Upcoming',
      image: 'https://images.unsplash.com/photo-1609137144822-4a0b2308cf26?auto=format&fit=crop&w=800&q=80',
      days: 5,
      isActive: false
    },
    {
      id: 'trip-3',
      title: 'Hampi Ancient Vijayanagara Citadels & Coracle Boats',
      destination: 'Karnataka',
      dates: 'Jan 10 – Jan 13, 2026',
      status: 'Completed',
      image: 'https://images.unsplash.com/photo-1600100397608-f010e42e4e8a?auto=format&fit=crop&w=800&q=80',
      days: 3,
      isActive: false
    }
  ];

  const fetchTrips = async () => {
    setLoading(true);
    const userId = currentUser?.id || 'usr-901';
    try {
      const res = await axios.get(`/api/itinerary/user/${encodeURIComponent(userId)}`);
      if (res.data && res.data.trips && res.data.trips.length > 0) {
        const mapped = res.data.trips.map((t, idx) => ({
          id: t.id,
          title: t.title,
          destination: t.destination,
          dates: t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible Dates',
          status: idx === 0 ? 'In Progress' : 'Upcoming',
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          days: t.days,
          budget: t.budget,
          isActive: idx === 0,
          isUserCreated: true
        }));
        setTrips(mapped);
      } else {
        setTrips(defaultTrips);
      }
    } catch (err: any) {
      console.warn('Could not fetch user trips:', err?.message);
      setTrips(defaultTrips);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [currentUser?.id]);

  const handleDeleteTrip = async (tripId) => {
    try {
      await axios.delete(`/api/itinerary/${tripId}`);
      setToast('Itinerary removed successfully');
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setTrips(prev => prev.filter(t => t.id !== tripId));
    }
  };

  const filteredTrips = trips.filter(t => {
    if (filter === 'active') return t.status === 'In Progress';
    if (filter === 'completed') return t.status === 'Completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>My Travel Journey</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            My Trips & Circuits
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Access active live navigation, past travel memories, and upcoming group plans.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/trips/group"
            className="btn-secondary !text-xs font-bold flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Travel & Expense Split</span>
          </Link>

          <Link
            to="/plan"
            className="btn-action !text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan New Trip</span>
          </Link>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="p-3 bg-nature-light text-nature border border-nature/30 rounded-ts-md text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Trips Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="ts-card p-12 text-center text-xs text-neutral-muted animate-pulse">
            Loading your travel circuits...
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="ts-card p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-brand mx-auto opacity-50" />
            <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              No itineraries found
            </h3>
            <p className="text-xs text-neutral-muted max-w-sm mx-auto">
              Plan your first AI travel twin circuit tailored to your pace and budget preferences.
            </p>
            <Link to="/plan" className="btn-action inline-flex items-center gap-2 text-xs font-bold mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create First Itinerary</span>
            </Link>
          </div>
        ) : (
          filteredTrips.map((t) => (
            <div
              key={t.id}
              className={`ts-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                t.isActive ? 'border-2 border-brand bg-brand-50/20' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <img
                  src={t.image}
                  alt={t.title}
                  className="w-full sm:w-36 h-28 rounded-ts-md object-cover shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'In Progress' ? 'bg-brand text-white' :
                      t.status === 'Upcoming' ? 'bg-action-light text-action' :
                      'bg-neutral-bg text-neutral-muted'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-neutral-muted flex items-center gap-1 font-semibold">
                      <MapPin className="w-3 h-3 text-brand" />
                      {t.destination}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {t.title}
                  </h3>

                  <p className="text-xs text-neutral-muted flex items-center gap-2">
                    <span>{t.dates}</span>
                    <span>•</span>
                    <span>{t.days} Days Schedule</span>
                    {t.budget && (
                      <>
                        <span>•</span>
                        <span>₹{Number(t.budget).toLocaleString('en-IN')} Budget</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {t.isActive ? (
                  <button
                    onClick={() => navigate('/trips/live')}
                    className="btn-action !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 shadow-md w-full sm:w-auto cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Resume Live Trip Mode</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/plan', { state: { prefilledDestination: t.destination } })}
                    className="btn-brand !py-2 !px-4 text-xs font-bold w-full sm:w-auto cursor-pointer"
                  >
                    View Itinerary
                  </button>
                )}

                {t.isUserCreated && (
                  <button
                    onClick={() => handleDeleteTrip(t.id)}
                    className="p-2 text-neutral-muted hover:text-rose-500 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Itinerary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
