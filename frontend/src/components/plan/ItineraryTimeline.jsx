import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Compass,
  Lightbulb,
  Sun,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  IndianRupee,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ItineraryTimeline({
  itinerary,
  selectedDay,
  onSelectDay,
  onOpenBooking,
}) {
  if (!itinerary || !itinerary.days_schedule || itinerary.days_schedule.length === 0) {
    return null;
  }

  const activeDayIndex = Math.min(
    Math.max(selectedDay - 1, 0),
    itinerary.days_schedule.length - 1
  );
  const currentDay = itinerary.days_schedule[activeDayIndex];

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
        className="p-5 bg-gradient-to-r from-surface to-ivory border-l-4 border-l-primary-700 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold tracking-wider uppercase text-primary-700">
                Day {currentDay.day_number} Schedule
              </span>
              {currentDay.weather_advisory && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium">
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
      </Card>

      {/* Stops Timeline for Current Day */}
      <div className="relative border-l-2 border-primary-200 ml-4 pl-6 space-y-6">
        {currentDay.stops.map((stop, idx) => {
          const isMorning = stop.time_slot.toLowerCase().includes('morning');
          const isAfternoon = stop.time_slot.toLowerCase().includes('afternoon');
          const isEvening = stop.time_slot.toLowerCase().includes('evening');

          let slotColor = 'bg-amber-100 text-amber-900 border-amber-300';
          let markerColor = 'bg-accent-500 ring-accent-100';

          if (isAfternoon) {
            slotColor = 'bg-forest-100 text-forest-900 border-forest-300';
            markerColor = 'bg-secondary-600 ring-secondary-100';
          } else if (isEvening) {
            slotColor = 'bg-indigo-100 text-indigo-900 border-indigo-300';
            markerColor = 'bg-primary-700 ring-primary-100';
          }

          return (
            <div key={idx} className="relative group">
              {/* Bullet Node on Timeline */}
              <div
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-4 ${markerColor} transition-transform group-hover:scale-125`}
              />

              {/* Stop Card */}
              <Card
                variant="default"
                className="p-4 sm:p-5 border border-neutral-200 bg-white hover:border-primary-300 transition-all shadow-xs hover:shadow-sm"
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
                          e.target.src =
                            'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                  )}

                  {/* Stop Content */}
                  <div className="flex-1 min-w-0">
                    {/* Time Slot and Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${slotColor}`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        {stop.time_slot}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          Est. Fee: ₹{stop.estimated_cost_inr}
                        </span>
                        <span className="text-xs text-neutral-400">•</span>
                        <span className="text-xs text-neutral-500 font-medium">
                          {stop.estimated_duration}
                        </span>
                      </div>
                    </div>

                    {/* Stop Title */}
                    <h4 className="text-base font-display font-bold text-neutral-900 group-hover:text-primary-800 transition-colors">
                      {stop.title}
                    </h4>

                    {/* Destination Name / Coordinates */}
                    <div className="flex items-center gap-1.5 text-xs text-primary-800 font-medium mt-0.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{stop.destination_name}</span>
                      <span className="text-neutral-400 font-mono text-[10px]">
                        ({stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)})
                      </span>
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

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-neutral-100">
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
      </div>
    </div>
  );
}
