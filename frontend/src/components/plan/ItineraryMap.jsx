import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ItineraryMap({ itinerary, selectedDay }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [23.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      // Free OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Don't destroy on every re-render to avoid flashing, but clean up layers
    };
  }, []);

  // Update markers and route polyline when itinerary or selectedDay changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !itinerary || !itinerary.days_schedule) return;

    layerGroup.clearLayers();

    const activeDayIndex = Math.min(
      Math.max(selectedDay - 1, 0),
      itinerary.days_schedule.length - 1
    );
    const day = itinerary.days_schedule[activeDayIndex];
    if (!day || !day.stops || day.stops.length === 0) return;

    const latLngs = [];

    day.stops.forEach((stop, index) => {
      if (!stop.latitude || !stop.longitude) return;

      const position = [stop.latitude, stop.longitude];
      latLngs.push(position);

      // Custom numbered marker HTML
      const markerHtml = `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #712B13;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 13px;
          border: 2px solid #ffffff;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        ">
          ${index + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-itinerary-pin',
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
      });

      const popupContent = `
        <div style="max-width: 200px; font-family: sans-serif;">
          <div style="font-size: 10px; font-weight: bold; color: #712B13; text-transform: uppercase;">
            Stop ${index + 1} • ${stop.time_slot}
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #1e293b; margin-top: 2px;">
            ${stop.destination_name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${stop.category} • Est. ₹${stop.estimated_cost_inr}
          </div>
        </div>
      `;

      const marker = L.marker(position, { icon: customIcon }).bindPopup(popupContent);
      layerGroup.addLayer(marker);
    });

    // Draw route polyline connecting the day's stops
    if (latLngs.length > 1) {
      const routeLine = L.polyline(latLngs, {
        color: '#E5A93C',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      });
      layerGroup.addLayer(routeLine);
    }

    // Auto-fit map bounds with padding
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [itinerary, selectedDay]);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-800 shadow-sm flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-primary-700"></span>
        <span>Day {selectedDay} Route Stops</span>
      </div>
    </div>
  );
}
