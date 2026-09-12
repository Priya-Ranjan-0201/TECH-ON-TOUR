import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Sparkles, ArrowRight, Trash2, Compass, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import axios from 'axios';

export default function SavedPlacesView() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const userId = currentUser?.id || 'usr-901';

  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPlaces = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/user/saved?user_id=${userId}`);
      if (res.data?.saved_places) {
        setSavedList(res.data.saved_places.filter(p => (p.image_url || p.image) && (p.image_url || p.image).trim() !== ''));
      }
    } catch (err) {
      console.warn('Failed to load saved places:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPlaces();
  }, [userId]);

  const handleRemove = async (e, destId) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/user/saved/${destId}?user_id=${userId}`);
      setSavedList(prev => prev.filter(p => p.destination_id !== destId && p.id !== destId));
    } catch (err) {
      console.error('Failed to remove saved destination:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>My Curated Collections</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-900 dark:text-white">
            Saved Destinations & Circuits ({savedList.length})
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Persisted in SQLite database for {currentUser?.name || 'Aarav Sharma'}.
          </p>
        </div>

        <button
          onClick={() => navigate('/explore')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          Explore More POIs
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1A17] p-16 text-center space-y-4 rounded-3xl border border-neutral-200 dark:border-neutral-800">
          <Compass className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            "Your next favorite place could start here."
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Browse through our 12,293 verified POIs and click the bookmark icon on any destination.
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 cursor-pointer"
          >
            Explore Destinations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {savedList.map((d) => (
            <div
              key={d.destination_id || d.id}
              className="bg-white dark:bg-[#1C1A17] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col justify-between group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
              onClick={() => navigate(`/destination/${d.destination_id || d.id}`)}
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img 
                    src={d.image_url || d.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'} 
                    alt={d.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => handleRemove(e, d.destination_id || d.id)}
                      className="p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 text-red-600 hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {d.state}
                    </span>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {d.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {d.name}
                  </h3>

                  {d.notes && (
                    <p className="text-xs text-neutral-500 italic">
                      "{d.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs bg-neutral-50/50 dark:bg-neutral-900/30">
                <span className="text-neutral-500 font-medium">Verified National POI</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
