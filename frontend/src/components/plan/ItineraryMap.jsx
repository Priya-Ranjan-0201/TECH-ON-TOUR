import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Eye, MapPin, Navigation } from 'lucide-react';

export default function ItineraryMap({ itinerary, selectedDay }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const [viewAllDays, setViewAllDays] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [26.9124, 75.7873],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !itinerary || !itinerary.days_schedule) return;

    layerGroup.clearLayers();

    const allLatLngs = [];

    if (viewAllDays) {
      // Draw all days with distinct day colors
      const dayColors = ['#712B13', '#27500A', '#1E40AF', '#854D0E', '#6B21A8', '#0F766E', '#9F1239'];

      itinerary.days_schedule.forEach((day, dIdx) => {
        const dayColor = dayColors[dIdx % dayColors.length];
        const dayCoords = [];

        day.stops.forEach((stop, sIdx) => {
          if (!stop.latitude || !stop.longitude) return;
          const pos = [stop.latitude, stop.longitude];
          dayCoords.push(pos);
          allLatLngs.push(pos);

          const iconHtml = `
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: ${dayColor};
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 11px;
              border: 2px solid #ffffff;
              box-shadow: 0 3px 6px rgba(0,0,0,0.35);
            ">
              D${day.day_number}.${sIdx + 1}
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'custom-multi-day-pin',
            html: iconHtml,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -16],
          });

          const popupHtml = `
            <div style="max-width: 220px; font-family: sans-serif; padding: 2px;">
              <div style="font-size: 10px; font-weight: 800; color: ${dayColor}; text-transform: uppercase;">
                Day ${day.day_number} • Stop ${sIdx + 1}
              </div>
              <div style="font-size: 13px; font-weight: bold; color: #1e293b; margin-top: 2px;">
                ${stop.destination_name}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                ${stop.category} • Est. ₹${stop.estimated_cost_inr}
              </div>
            </div>
          `;

          L.marker(pos, { icon: customIcon }).bindPopup(popupHtml).addTo(layerGroup);
        });

        if (dayCoords.length > 1) {
          L.polyline(dayCoords, {
            color: dayColor,
            weight: 3.5,
            opacity: 0.8,
            dashArray: '6, 6',
          }).addTo(layerGroup);
        }
      });
    } else {
      // Selected day only with slot-based color pins
      const activeDayIndex = Math.min(
        Math.max(selectedDay - 1, 0),
        itinerary.days_schedule.length - 1
      );
      const day = itinerary.days_schedule[activeDayIndex];
      if (!day || !day.stops) return;

      const dayCoords = [];

      day.stops.forEach((stop, index) => {
        if (!stop.latitude || !stop.longitude) return;
        const pos = [stop.latitude, stop.longitude];
        dayCoords.push(pos);
        allLatLngs.push(pos);

        let pinBg = '#E5A93C'; // Morning Gold
        let slotName = 'Morning';
        if (stop.time_slot.toLowerCase().includes('afternoon')) {
          pinBg = '#27500A'; // Afternoon Forest
          slotName = 'Afternoon';
        } else if (stop.time_slot.toLowerCase().includes('evening')) {
          pinBg = '#712B13'; // Evening Terracotta
          slotName = 'Evening';
        }

        const markerHtml = `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${pinBg};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          ">
            ${index + 1}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-itinerary-pin',
          html: markerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const popupContent = `
          <div style="max-width: 240px; font-family: sans-serif;">
            ${stop.image_url ? `
              <img src="${stop.image_url}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />
            ` : ''}
            <div style="font-size: 10px; font-weight: 800; color: ${pinBg}; text-transform: uppercase;">
              Stop ${index + 1} • ${stop.time_slot}
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #1e293b; margin-top: 2px;">
              ${stop.destination_name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${stop.category} • Est. Fee: ₹${stop.estimated_cost_inr}
            </div>
            ${stop.transit_guard_fare_inr ? `
              <div style="margin-top: 5px; padding: 4px 6px; border-radius: 4px; background: #ecfdf5; font-size: 10px; color: #065f46; font-weight: 600;">
                TransitGuard Fare: ₹${stop.transit_guard_fare_inr} (${stop.transit_mode})
              </div>
            ` : ''}
          </div>
        `;

        L.marker(pos, { icon: customIcon }).bindPopup(popupContent).addTo(layerGroup);
      });

      if (dayCoords.length > 1) {
        L.polyline(dayCoords, {
          color: '#712B13',
          weight: 4,
          opacity: 0.9,
          dashArray: '8, 8',
        }).addTo(layerGroup);
      }
    }

    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    }
  }, [itinerary, selectedDay, viewAllDays]);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-neutral-300 shadow-sm bg-neutral-100">
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Header Floating Overlay */}
      <div className="absolute top-2.5 right-2.5 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewAllDays(!viewAllDays)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 backdrop-blur-xs ${
            viewAllDays
              ? 'bg-primary-800 text-white border-primary-900'
              : 'bg-white/95 text-neutral-800 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {viewAllDays ? 'Viewing All Circuit Days' : `Day ${selectedDay} Only`}
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-[11px] font-semibold text-neutral-700 shadow-sm flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-500"></span>
          <span>Morning</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-forest-700"></span>
          <span>Afternoon</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-800"></span>
          <span>Evening</span>
        </div>
      </div>
    </div>
  );
}
