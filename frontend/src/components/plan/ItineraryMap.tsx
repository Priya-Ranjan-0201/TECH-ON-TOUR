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
          const pos: [number, number] = [stop.latitude, stop.longitude];
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
              <a href="#/destinations/${stop.destination_id || encodeURIComponent(stop.destination_name)}" style="display: inline-block; margin-top: 6px; font-size: 11px; font-weight: bold; color: #8C3618; text-decoration: none;">
                View Details →
              </a>
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
        const pos: [number, number] = [stop.latitude, stop.longitude];
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

        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
        const safetyScore = stop.safety_score || 92;

        const popupContent = `
          <div style="max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            ${stop.image_url ? `
              <img src="${stop.image_url}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />
            ` : ''}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 800; color: ${pinBg}; text-transform: uppercase;">
                Stop ${index + 1} • ${stop.time_slot}
              </span>
              <span style="font-size: 10px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 1px 5px; border-radius: 4px;">
                🛡️ ${safetyScore}/100 Safe
              </span>
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 1px;">
              ${stop.destination_name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
              Category: <strong>${stop.category || 'Cultural Landmark'}</strong> • Est. Fee: <strong>₹${stop.estimated_cost_inr || 0}</strong>
            </div>
            ${stop.transit_guard_fare_inr ? `
              <div style="margin-top: 5px; padding: 4px 6px; border-radius: 4px; background: #f0fdf4; font-size: 10px; color: #166534; font-weight: 600;">
                TransitGuard Fare: ₹${stop.transit_guard_fare_inr} (${stop.transit_mode || 'Auto'})
              </div>
            ` : ''}
            <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; flex-direction: column; gap: 5px;">
              <a href="#/destinations/${stop.destination_id || encodeURIComponent(stop.destination_name)}" style="display: inline-flex; align-items: center; gap: 4px; background: #712B13; color: #ffffff; padding: 5px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; text-decoration: none; width: 100%; justify-content: center; box-sizing: border-box;">
                View Destination Details →
              </a>
              <div style="font-size: 10.5px; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 4px; background: #f0fdf4; padding: 4px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">
                <span>🛣️ In-App Road Route (OpenRouteService)</span>
              </div>
              <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #f8fafc; color: #64748b; padding: 4px 8px; border-radius: 5px; font-size: 10px; font-weight: 600; text-decoration: none; width: 100%; justify-content: center; box-sizing: border-box; border: 1px solid #cbd5e1;">
                Google Maps (Fallback) ↗
              </a>
            </div>
          </div>
        `;

        L.marker(pos, { icon: customIcon }).bindPopup(popupContent).addTo(layerGroup);
      });

      // Draw road route polyline between consecutive stops
      if (dayCoords.length > 1) {
        // Asynchronously fetch road polylines from routing API
        (async () => {
          for (let i = 0; i < day.stops.length - 1; i++) {
            const s1 = day.stops[i];
            const s2 = day.stops[i + 1];
            if (!s1.latitude || !s1.longitude || !s2.latitude || !s2.longitude) continue;

            try {
              const res = await fetch('/api/routing/directions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  start_lat: s1.latitude,
                  start_lng: s1.longitude,
                  end_lat: s2.latitude,
                  end_lng: s2.longitude,
                  mode: 'driving-car',
                }),
              });
              if (res.ok) {
                const routeData = await res.json();
                if (routeData.coordinates && routeData.coordinates.length > 0) {
                  L.polyline(routeData.coordinates, {
                    color: '#712B13',
                    weight: 4.5,
                    opacity: 0.85,
                    dashArray: routeData.is_estimated ? '6, 6' : undefined,
                  }).addTo(layerGroup);
                  continue;
                }
              }
            } catch (err) {
              // fallback
            }

            // Geodesic fallback
            L.polyline([[s1.latitude, s1.longitude], [s2.latitude, s2.longitude]], {
              color: '#712B13',
              weight: 4,
              opacity: 0.8,
              dashArray: '6, 6',
            }).addTo(layerGroup);
          }
        })();
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
