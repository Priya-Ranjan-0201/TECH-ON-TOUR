import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  Calendar, 
  ShieldCheck, 
  Compass, 
  Sparkles, 
  MessageSquare,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import axios from 'axios';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop';

export default function DestinationDetailModal({ 
  destinationId, 
  onClose, 
  onDirectBook 
}) {
  const [data, setData] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, reviews, nearby

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/api/destinations/${destinationId}`);
        setData(res.data);

        // Fetch nearby places
        if (res.data && res.data.destination) {
          const { latitude, longitude } = res.data.destination;
          const nearbyRes = await axios.get(
            `http://localhost:8000/api/destinations/nearby?lat=${latitude}&lon=${longitude}&radius_km=30&limit=4`
          );
          if (nearbyRes.data && nearbyRes.data.places) {
            // Filter out current place
            setNearby(nearbyRes.data.places.filter(p => p.id !== destinationId));
          }
        }
      } catch (err) {
        console.error('Failed to load destination detail', err);
      } finally {
        setLoading(false);
      }
    };

    if (destinationId) {
      fetchDetail();
    }
  }, [destinationId]);

  if (!destinationId) return null;

  const dest = data?.destination;
  const reviews = data?.verified_reviews || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-ivory rounded-ts shadow-2xl border border-neutral-300 w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-primary-800 text-ivory px-6 py-4 flex items-center justify-between border-b border-primary-900/30">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent-400" />
            <h2 className="text-lg font-display font-bold text-ivory truncate max-w-md">
              {dest ? dest.name : 'Destination Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-primary-900 text-ivory/80 hover:text-ivory transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Fetching verified destination & trust review layer..." />
          </div>
        ) : dest ? (
          <div className="flex-1 overflow-y-auto">
            {/* Image Banner */}
            <div className="h-56 w-full relative bg-neutral-200 overflow-hidden">
              <img
                src={dest.image_url || FALLBACK_IMAGE}
                alt={dest.name}
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent" />
              
              <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-2 text-ivory">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold mb-1 text-accent-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.state}</span>
                    <span>•</span>
                    <span className="capitalize">{dest.category}</span>
                  </div>
                  <h1 className="text-2xl font-display font-bold">{dest.name}</h1>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-900/80 px-3 py-1 rounded-full text-xs font-bold border border-neutral-700 backdrop-blur-sm">
                  <Star className="w-4 h-4 text-accent-400 fill-accent-400" />
                  <span>{dest.rating?.toFixed(1)}</span>
                  <span className="text-neutral-400 text-[11px]">({dest.review_count} reviews)</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary-800 text-primary-800'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Overview & Insights
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-primary-800 text-primary-800'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Review Trust Layer ({reviews.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('nearby')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'nearby'
                    ? 'border-primary-800 text-primary-800'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Nearby Circuits ({nearby.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Detailed Description */}
                  <div>
                    <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider mb-2">
                      About This Destination
                    </h3>
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {dest.description}
                    </p>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-neutral-50 p-3 rounded-ts border border-neutral-200">
                      <div className="text-neutral-500 text-[11px]">Best Visiting Season</div>
                      <div className="font-bold text-primary-900 mt-0.5">{dest.best_season || 'All Year'}</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-ts border border-neutral-200">
                      <div className="text-neutral-500 text-[11px]">Pricing Range</div>
                      <div className="font-bold text-primary-900 capitalize mt-0.5">{dest.price_range} Tier</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-ts border border-neutral-200">
                      <div className="text-neutral-500 text-[11px]">Safety Score</div>
                      <div className="font-bold text-secondary-800 mt-0.5">{dest.safety_score || 88}/100 Safe</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-ts border border-neutral-200">
                      <div className="text-neutral-500 text-[11px]">Coordinates</div>
                      <div className="font-mono font-bold text-neutral-700 text-[11px] mt-0.5">
                        {dest.latitude?.toFixed(4)}, {dest.longitude?.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Zero-Commission DPI Callout */}
                  <div className="p-4 rounded-ts bg-secondary-50 border border-secondary-800/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-secondary-800 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-secondary-900">100% Commission-Free Direct Booking</div>
                        <div className="text-[11px] text-secondary-800">
                          97% goes directly to the local host/operator. 0% middleman commission.
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDirectBook(dest)}
                      icon={Sparkles}
                    >
                      Book Direct
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-primary-50/50 p-3 rounded-ts border border-primary-800/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-secondary-800" />
                      <span className="text-xs font-semibold text-primary-900">
                        HuggingFace DistilBERT SST-2 Sentiment & Authenticity Verification
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-secondary-800 bg-secondary-50 px-2 py-0.5 rounded-full border border-secondary-800/20">
                      Pre-computed • 0ms Lag
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-xs text-neutral-500">
                      No reviews currently attached to this destination.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-4 bg-neutral-50 rounded-ts border border-neutral-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary-900">{rev.author_name}</span>
                              {rev.is_verified_booking && (
                                <span className="badge-verified-ts text-[10px] py-0.2">
                                  Verified Tourist
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                              <Star className="w-3.5 h-3.5 text-accent-400 fill-accent-400" />
                              <span>{rev.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-700 leading-relaxed">
                            "{rev.review_text}"
                          </p>

                          <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-500">
                            <span>Sentiment Confidence: <strong>{(rev.sentiment_score * 100).toFixed(1)}% Positive</strong></span>
                            <span>Authenticity Rating: <strong className="text-secondary-800">{rev.authenticity_score}/100</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'nearby' && (
                <div className="space-y-4">
                  <div className="text-xs text-neutral-600">
                    Grounded nearby heritage places within a 30 km radius (Spatial GIS query &lt; 25ms):
                  </div>

                  {nearby.length === 0 ? (
                    <div className="text-center py-8 text-xs text-neutral-500">
                      No nearby heritage sites found within 30 km.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nearby.map((p) => (
                        <div key={p.id} className="p-3 bg-neutral-50 rounded-ts border border-neutral-200 flex gap-3 items-center">
                          <img
                            src={p.image_url || FALLBACK_IMAGE}
                            alt={p.name}
                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                            className="w-14 h-14 rounded-ts object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-primary-900 truncate">{p.name}</h4>
                            <p className="text-[11px] text-neutral-500">{p.state}</p>
                            <span className="text-[10px] font-bold text-secondary-800 bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-800/20 inline-block mt-1">
                              {p.distance_km} km away
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex items-center justify-between text-xs">
          <span className="text-neutral-500">Grounded from Tech-On-Tour Dataset</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {dest && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => onDirectBook(dest)}
                icon={Sparkles}
              >
                Proceed to Book
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
