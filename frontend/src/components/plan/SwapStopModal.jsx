import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Sparkles,
  RefreshCw,
  Star,
  MapPin,
  Check,
  AlertCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function SwapStopModal({
  isOpen,
  onClose,
  itineraryId,
  dayNumber,
  stopIndex,
  currentStopName,
  onStopSwapped,
}) {
  const [alternatives, setAlternatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && itineraryId) {
      loadAlternatives();
    }
  }, [isOpen, itineraryId, dayNumber, stopIndex]);

  const loadAlternatives = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `/api/itinerary/${itineraryId}/alternatives?day_number=${dayNumber}&stop_index=${stopIndex}`
      );
      setAlternatives(res.data);
    } catch (err) {
      console.error('Failed to load stop alternatives:', err);
      setError('Could not retrieve alternative destinations in this region.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlternative = async (destinationId) => {
    setIsSwapping(true);
    setError(null);
    try {
      const res = await axios.post(`/api/itinerary/${itineraryId}/swap-stop`, {
        day_number: dayNumber,
        stop_index: stopIndex,
        new_destination_id: destinationId,
      });
      onStopSwapped(res.data);
      onClose();
    } catch (err) {
      console.error('Failed to swap stop:', err);
      setError(err.response?.data?.detail || 'Failed to replace activity.');
    } finally {
      setIsSwapping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-sand-50 to-ivory flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-600" />
              Customize Day {dayNumber} Activity
            </div>
            <h3 className="text-lg font-display font-bold text-neutral-900">
              Swap Stop: <span className="text-primary-900">{currentStopName}</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select an alternative verified destination in this circuit. Transit times and fare caps will update automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <LoadingSpinner size="md" message="Discovering regional alternative destinations..." />
            </div>
          ) : alternatives.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No additional alternatives found in this immediate circuit.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alternatives.map((alt) => (
                <div
                  key={alt.destination_id}
                  className="flex flex-col justify-between p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-primary-400 hover:shadow-md transition-all group"
                >
                  <div className="space-y-2">
                    {alt.image_url && (
                      <div className="w-full h-28 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200">
                        <img
                          src={alt.image_url}
                          alt={alt.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-sand-100 text-primary-900">
                        {alt.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{alt.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-primary-900 transition-colors">
                      {alt.name}
                    </h4>

                    <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                      {alt.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-neutral-100">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isSwapping}
                      onClick={() => handleSelectAlternative(alt.destination_id)}
                      className="w-full py-1.5 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Swap Into Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <span>Grounded in 12,293 verified destinations</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
