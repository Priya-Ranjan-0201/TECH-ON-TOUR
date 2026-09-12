import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Sparkles, 
  Brain, 
  MapPin, 
  Star, 
  ArrowRight, 
  Sliders, 
  CheckCircle2,
  RefreshCw,
  Zap,
  Bookmark
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function RecommendationsView() {
  const navigate = useNavigate();
  const { currentUser, travelTwin } = useApp();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('all');

  const styles = [
    { id: 'all', label: 'All Tailored Picks' },
    { id: 'nature', label: 'Nature & Slow Corridors' },
    { id: 'heritage', label: 'Living Heritage & Architecture' },
    { id: 'adventure', label: 'High Altitude & Adventure' },
  ];

  const fetchRecommendations = async (style = selectedStyle) => {
    setLoading(true);
    setError(null);
    const userId = currentUser?.id || 'usr-901';
    try {
      let url = `/api/recommendations?user_id=${encodeURIComponent(userId)}&top_k=16`;
      if (style !== 'all') {
        url += `&travel_style=${encodeURIComponent(style)}`;
      }
      const res = await axios.get(url);
      const raw = res.data?.recommendations || [];
      const withPhotos = raw.filter(item => (item.image_url || item.image) && (item.image_url || item.image).trim() !== '');
      setRecommendations(withPhotos);
    } catch (err) {
      setError('Recommendation engine temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser?.id, selectedStyle]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-darkmode-elevated text-brand border border-brand/20 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span>Multi-Model AI Recommendation Pipeline</span>
            </span>
            <span className="text-xs text-neutral-muted">• Models 1 & 4 Feature Fusion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Curated For Your Travel Style
          </h1>
          <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Grounded predictions synthesized from your Travel Twin preferences, interaction history, and seasonal climate conditions.
          </p>
        </div>

        <Link
          to="/travel-twin"
          className="btn-secondary !text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Sliders className="w-3.5 h-3.5 text-brand" />
          <span>Adjust Calibration</span>
        </Link>
      </div>

      {/* Style Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {styles.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedStyle(st.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              selectedStyle === st.id
                ? 'bg-brand text-white shadow-xs'
                : 'bg-neutral-card dark:bg-darkmode-surface border border-neutral-border text-neutral-text-sec hover:text-neutral-text-primary'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ts-card p-4 space-y-3">
              <div className="w-full h-48 bg-neutral-200 dark:bg-darkmode-border rounded-lg" />
              <div className="w-3/4 h-4 bg-neutral-200 dark:bg-darkmode-border rounded" />
              <div className="w-full h-8 bg-neutral-200 dark:bg-darkmode-border rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="ts-card p-10 text-center space-y-3 max-w-md mx-auto">
          <p className="text-rose-600 font-bold text-sm">{error}</p>
          <button onClick={() => fetchRecommendations()} className="btn-brand text-xs font-bold py-2 px-4 cursor-pointer">
            Retry Generating Recommendations
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="ts-card p-12 text-center space-y-3 max-w-md mx-auto">
          <Sparkles className="w-12 h-12 text-brand mx-auto opacity-50" />
          <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            No recommendations generated
          </h3>
          <p className="text-xs text-neutral-muted">
            Calibrate your Travel Twin or explore a few destinations to build your personal recommendation model.
          </p>
          <Link to="/travel-twin" className="btn-brand text-xs font-bold py-2 px-4 mt-2 inline-block">
            Calibrate Preferences
          </Link>
        </div>
      )}

      {/* Recommendations Cards with Explainable AI Reasons */}
      {!loading && !error && recommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((item, idx) => {
            const scorePct = Math.round((item.score || 0.85) * 100);
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/destination/${item.id}`)}
                className="ts-card overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-neutral-200">
                    <img
                      src={item.image || item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Model Ranking Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand text-white shadow-md flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>{scorePct}% Persona Match</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{item.rating || 4.7}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-muted">
                        <span className="font-bold text-brand uppercase tracking-wider text-[10px]">{item.category || 'Sightseeing'}</span>
                        <span>{item.state}</span>
                      </div>
                      <h3 className="font-bold text-lg text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1 mt-0.5">
                        {item.name}
                      </h3>
                    </div>

                    {/* Explainable AI Reasoning Pill */}
                    <div className="p-2.5 rounded-lg bg-nature-light text-nature border border-nature/20 text-xs font-semibold space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-nature">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Why This Is Recommended</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-nature">
                        {item.reason || `Matches your ${travelTwin?.travelStyle || 'Nature & Slow Travel'} style with optimal seasonal climate in ${item.state}.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-neutral-border flex items-center justify-between text-xs font-bold text-brand">
                    <span>Explore Itinerary & Stay</span>
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
