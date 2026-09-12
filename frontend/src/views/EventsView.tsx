import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Sparkles, Navigation, Hotel, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EVENTS } from '../data/travelSathiData';

export default function EventsView() {
  const navigate = useNavigate();

  const handleAddToItinerary = (eventTitle, eventLocation) => {
    navigate('/plan', {
      state: {
        prefilledDestination: eventLocation,
        prefilledNotes: `Include cultural visit to ${eventTitle}`
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="badge-action">
          🎉 Cultural Calendars & Melas
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          Events & Festivals of India
        </h1>
        <p className="text-sm sm:text-base text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
          Experience sacred festivals, tribal gatherings, and harvest celebrations with crowd volume forecasts and nearby verified homestay booking.
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {EVENTS.map((event) => (
          <div
            key={event.id}
            className="ts-card p-6 flex flex-col md:flex-row gap-6 items-start justify-between"
          >
            <img
              src={event.image}
              alt={event.title}
              className="w-full md:w-64 h-48 rounded-ts-md object-cover shrink-0"
            />

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-action bg-action-light px-2.5 py-1 rounded-full">
                  {event.category}
                </span>
                <span className="text-xs text-neutral-muted flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  {event.dates}
                </span>
                <span className="text-xs text-neutral-muted flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  {event.location}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                {event.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
                {event.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border text-neutral-text-sec dark:text-darkmode-text-secondary">
                  <strong>Expected Footfall: </strong>
                  <span>{event.expectedCrowds}</span>
                </div>
                <div className="p-2.5 rounded bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border text-neutral-text-sec dark:text-darkmode-text-secondary">
                  <strong>Transit Advisory: </strong>
                  <span>{event.transportAdvisory}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 flex md:flex-col gap-2 pt-2 md:pt-0">
              <button
                onClick={() => handleAddToItinerary(event.title, event.location)}
                className="btn-action flex-1 md:flex-initial py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add to My Trip</span>
              </button>

              <button
                onClick={() => navigate('/stays')}
                className="btn-secondary flex-1 md:flex-initial py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Hotel className="w-3.5 h-3.5" />
                <span>Nearby Stays ({event.nearbyStaysCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
