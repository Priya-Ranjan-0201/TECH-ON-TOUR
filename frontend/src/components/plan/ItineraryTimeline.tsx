import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Compass,
  Lightbulb,
  Sun,
  ShieldCheck,
  ChevronRight,
  IndianRupee,
  Utensils,
  Home,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Users,
  Navigation,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/summaryTranslator';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';
import InAppNavigationModal from '../common/InAppNavigationModal';

export default function ItineraryTimeline({

  itinerary,
  selectedDay,
  onSelectDay,
  onOpenBooking,
  onOpenSwapModal,
  onReorderStops,
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'en';
  const [visitedStops, setVisitedStops] = useState({});
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [navDestination, setNavDestination] = useState<any>(null);
  const [navOrigin, setNavOrigin] = useState<any>(null);

  if (!itinerary || !itinerary.days_schedule || itinerary.days_schedule.length === 0) {
    return null;
  }

  const activeDayIndex = Math.min(
    Math.max(selectedDay - 1, 0),
    itinerary.days_schedule.length - 1
  );
  const currentDay = itinerary.days_schedule[activeDayIndex];

  const toggleVisited = (stopKey) => {
    setVisitedStops((prev) => ({
      ...prev,
      [stopKey]: !prev[stopKey],
    }));
  };

  const handleMoveStop = (currentIndex, direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= currentDay.stops.length) return;

    // Construct new order array
    const originalOrder = currentDay.stops.map((_, i) => i);
    const temp = originalOrder[currentIndex];
    originalOrder[currentIndex] = originalOrder[newIndex];
    originalOrder[newIndex] = temp;

    if (onReorderStops) {
      onReorderStops(currentDay.day_number, originalOrder);
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Selector Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {itinerary.days_schedule.map((day, idx) => {
          const isCurrent = idx === activeDayIndex;
          return (
            <button
              key={day.day_number}
              type="button"
              onClick={() => onSelectDay(day.day_number)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                isCurrent
                  ? 'bg-primary-800 text-white border-primary-900 shadow-md scale-[1.02]'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>Day {day.day_number}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isCurrent ? 'bg-primary-700 text-accent-300' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  ₹{day.day_cost_inr.toLocaleString('en-IN')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Day Header Card */}
      <Card
        variant="default"
        className="p-5 bg-gradient-to-r from-surface to-ivory border-l-4 border-l-primary-700 shadow-sm space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-extrabold tracking-wider uppercase text-primary-700">
                Day {currentDay.day_number} Schedule
              </span>
              {currentDay.weather_advisory && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                  <Sun className="w-3 h-3 text-amber-600" />
                  {currentDay.weather_advisory}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-primary-950">
              {currentDay.theme}
            </h3>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-neutral-500 font-medium">Estimated Daily Budget</div>
            <div className="text-lg font-bold text-primary-900">
              ₹{currentDay.day_cost_inr.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Regional Culinary Delicacy Banner */}
        {currentDay.culinary_highlight && (
          <div className="p-3 rounded-xl bg-accent-50/70 border border-accent-200 flex items-start gap-2.5 text-xs text-accent-950">
            <Utensils className="w-4 h-4 text-accent-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-accent-900">Authentic Regional Culinary Highlight: </span>
              <span>{currentDay.culinary_highlight}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Stops Timeline for Current Day */}
      <div className="relative border-l-2 border-primary-200 ml-4 pl-6 space-y-6">
        {currentDay.stops.map((stop, idx) => {
          const stopKey = `d${currentDay.day_number}-s${idx}`;
          const isVisited = visitedStops[stopKey] || false;

          const isMorning = stop.time_slot.toLowerCase().includes('morning');
          const isAfternoon = stop.time_slot.toLowerCase().includes('afternoon');
          const isEvening = stop.time_slot.toLowerCase().includes('evening');

          let slotColor = 'bg-amber-100 text-amber-900 border-amber-300';
          let markerColor = 'bg-accent-500 ring-accent-100';

          if (isAfternoon) {
            slotColor = 'bg-forest-100 text-forest-900 border-forest-300';
            markerColor = 'bg-forest-700 ring-forest-100';
          } else if (isEvening) {
            slotColor = 'bg-primary-100 text-primary-900 border-primary-300';
            markerColor = 'bg-primary-800 ring-primary-100';
          }

          return (
            <div key={idx} className="relative group space-y-4">
              {/* Inter-Stop TransitGuard Commute Banner (Between stops) */}
              {idx > 0 && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Navigation className="w-4 h-4 text-primary-700" />
                    <span>
                      <strong className="font-semibold text-neutral-900">
                        {stop.transit_from_previous_km || '2.4'} km
                      </strong> ({stop.transit_time_minutes || '8'} mins) via{' '}
                      <span className="font-medium text-neutral-800">{stop.transit_mode || 'Driving/Cab'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {stop.transit_guard_fare_inr && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-forest-100 border border-forest-300 text-forest-900 text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
                        <span>TransitGuard Fare Cap: ₹{stop.transit_guard_fare_inr}</span>
                      </div>
                    )}
                    {currentDay.stops[idx - 1]?.latitude && stop.latitude && (
                      <button
                        type="button"
                        onClick={() => {
                          setNavOrigin({
                            name: currentDay.stops[idx - 1].destination_name || currentDay.stops[idx - 1].title,
                            latitude: currentDay.stops[idx - 1].latitude,
                            longitude: currentDay.stops[idx - 1].longitude,
                          });
                          setNavDestination({
                            name: stop.destination_name || stop.title,
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                          });
                          setNavModalOpen(true);
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-primary-800 bg-primary-50 border border-primary-200 hover:bg-primary-100 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-primary-700" />
                        <span>{translateText('Directions (In-App)', currentLang)}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bullet Node on Timeline */}
              <div
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-4 ${
                  isVisited ? 'bg-forest-600 ring-forest-100' : markerColor
                } transition-transform group-hover:scale-125`}
              />

              {/* Stop Card */}
              <Card
                variant="default"
                className={`p-4 sm:p-5 border transition-all shadow-xs hover:shadow-sm ${
                  isVisited
                    ? 'border-forest-300 bg-forest-50/20'
                    : 'border-neutral-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* POI Photo / Thumbnail */}
                  {stop.image_url && (
                    <div className="sm:w-36 h-28 sm:h-auto flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200">
                      <img
                        src={stop.image_url}
                        alt={stop.destination_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement; target.src =
                            'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                  )}

                  {/* Stop Content */}
                  <div className="flex-1 min-w-0">
                    {/* Time Slot, Duration & Interactive Reorder Tools */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${slotColor}`}
                        >
                          <Clock className="w-3 h-3 inline mr-1" />
                          {translateText(stop.time_slot, currentLang)}
                        </span>

                        {stop.crowd_level && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
                            <Users className="w-3 h-3 inline mr-1 text-neutral-500" />
                            {translateText(`${stop.crowd_level} crowd density`, currentLang)}
                          </span>
                        )}
                      </div>

                      {/* Reorder and Visited Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleVisited(stopKey)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                            isVisited
                              ? 'bg-forest-100 text-forest-900 border-forest-300'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                          }`}
                          title="Mark this stop as visited"
                        >
                          {isVisited ? (
                            <>
                              <CheckSquare className="w-3.5 h-3.5 text-forest-700" />
                              <span>{translateText('Visited', currentLang)}</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{translateText('Check In', currentLang)}</span>
                            </>
                          )}
                        </button>

                        {/* Move Up Button */}
                        {idx > 0 && onReorderStops && (
                          <button
                            type="button"
                            onClick={() => handleMoveStop(idx, -1)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                            title="Move stop earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Move Down Button */}
                        {idx < currentDay.stops.length - 1 && onReorderStops && (
                          <button
                            type="button"
                            onClick={() => handleMoveStop(idx, 1)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                            title="Move stop later"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stop Title */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/destinations/${stop.destination_id || encodeURIComponent(stop.destination_name || stop.title)}`)}
                        className="text-left group/title focus:outline-none cursor-pointer"
                        title={`View destination details for ${stop.destination_name || stop.title}`}
                      >
                        <h4 className={`text-base font-display font-bold text-neutral-900 group-hover/title:text-primary-800 transition-colors flex items-center gap-1.5 ${isVisited ? 'line-through text-neutral-500' : ''}`}>
                          <span className="hover:underline">{translateText(stop.title, currentLang)}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-primary-700 transition-opacity" />
                        </h4>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/destinations/${stop.destination_id || encodeURIComponent(stop.destination_name || stop.title)}`)}
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-primary-800 hover:text-white bg-primary-50 hover:bg-primary-800 border border-primary-200 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>{t('common.details', 'Details')}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Destination Name / Coordinates */}
                    <div className="flex items-center gap-1.5 text-xs text-primary-800 font-medium mt-0.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <button
                        type="button"
                        onClick={() => navigate(`/destinations/${stop.destination_id || encodeURIComponent(stop.destination_name || stop.title)}`)}
                        className="truncate hover:underline font-bold text-left cursor-pointer"
                      >
                        {stop.destination_name}
                      </button>
                      <span className="text-neutral-400 font-mono text-[10px]">
                        ({stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)})
                      </span>
                      {stop.best_time_to_visit && (
                        <span className="text-neutral-500 text-[11px] ml-1">
                          • {stop.best_time_to_visit}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-3">
                      {stop.description}
                    </p>

                    {/* TravelSathi Insider Tip Box */}
                    {stop.insider_tip && (
                      <div className="p-2.5 rounded-lg bg-accent-50/70 border border-accent-200/80 text-xs text-accent-950 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-accent-700 flex-shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <strong className="font-semibold text-accent-900">Local Insider Tip: </strong>
                          {stop.insider_tip}
                        </div>
                      </div>
                    )}

                    {/* Action Bar: Swap Stop + Direct Homestay Booking + Navigate */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        {stop.latitude && stop.longitude && (
                          <button
                            type="button"
                            onClick={() => {
                              const prevStop = idx > 0 ? currentDay.stops[idx - 1] : null;
                              setNavOrigin(
                                prevStop && prevStop.latitude && prevStop.longitude
                                  ? {
                                      name: prevStop.destination_name || prevStop.title,
                                      latitude: prevStop.latitude,
                                      longitude: prevStop.longitude,
                                    }
                                  : null
                              );
                              setNavDestination({
                                name: stop.destination_name || stop.title,
                                latitude: stop.latitude,
                                longitude: stop.longitude,
                              });
                              setNavModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-primary-800 hover:bg-primary-900 transition-colors shadow-xs cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-accent-300" />
                            <span>Navigate</span>
                          </button>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onOpenSwapModal &&
                            onOpenSwapModal(currentDay.day_number, idx, stop.destination_name)
                          }
                          className="text-xs text-neutral-600 hover:text-primary-800 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-neutral-500" />
                          Swap Activity
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onOpenBooking({
                            destination_name: stop.destination_name,
                            state: itinerary.state,
                          })
                        }
                        className="text-xs text-primary-800 hover:text-primary-950 flex items-center gap-1 font-semibold"
                      >
                        Book Zero-Commission Homestay Nearby
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        {/* Night Lodging Recommendation Card (PM-JUGA Homestay Match) */}
        {currentDay.recommended_homestay && (
          <div className="pt-2">
            <Card
              variant="default"
              className="p-4 bg-gradient-to-r from-forest-50 to-sand-50 border border-forest-200 rounded-xl shadow-xs"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-200 text-forest-900 flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      Night {currentDay.day_number} Matched Homestay
                    </span>
                    {currentDay.recommended_homestay.is_tribal_pmjuga && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-100 text-accent-900 border border-accent-300">
                        PM-JUGA Tribal Partner
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-bold text-neutral-900">
                    {currentDay.recommended_homestay.title}
                  </h5>
                  <div className="text-xs text-neutral-600 flex items-center gap-2">
                    <span>{currentDay.recommended_homestay.district}, {currentDay.recommended_homestay.state}</span>
                    <span>•</span>
                    <span className="font-semibold text-forest-800">
                      Sanitation Score: {currentDay.recommended_homestay.sanitation_trust_score}/100
                    </span>
                    <span>•</span>
                    <span className="font-bold text-neutral-900">
                      ₹{currentDay.recommended_homestay.base_price_inr}/night
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    onOpenBooking({
                      name: currentDay.recommended_homestay.title,
                      state: currentDay.recommended_homestay.state,
                      price_range: 'moderate',
                    })
                  }
                  className="text-xs font-bold whitespace-nowrap bg-forest-800 hover:bg-forest-900 text-white"
                >
                  Direct Book (0% Fee)
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* In-App Road Routing Modal (OpenRouteService) */}
      <InAppNavigationModal
        isOpen={navModalOpen}
        onClose={() => setNavModalOpen(false)}
        destination={navDestination}
        origin={navOrigin}
      />
    </div>
  );
}
