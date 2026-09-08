import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Star, MapPin, ExternalLink } from 'lucide-react';

// Custom SVG-based Pin Icon matching Theme 1 Terracotta & Forest
const createCustomIcon = (isGem = false) => {
  const color = isGem ? '#27500A' : '#712B13';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="#FFFFFF"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-map-pin',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
};

const standardIcon = createCustomIcon(false);
const gemIcon = createCustomIcon(true);

// Helper component to auto-pan and zoom map when places change
function MapCenterUpdater({ places, defaultCenter }) {
  const map = useMap();

  useEffect(() => {
    if (places && places.length > 0) {
      // Fit bounds if multiple places exist
      const validCoords = places
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude, p.longitude]);

      if (validCoords.length === 1) {
        map.setView(validCoords[0], 11, { animate: true });
      } else if (validCoords.length > 1) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
      }
    } else {
      map.setView(defaultCenter, 5, { animate: true });
    }
  }, [places, map, defaultCenter]);

  return null;
}

export default function CatalogMap({ 
  places = [], 
  onSelectPlace,
  height = '500px'
}) {
  const defaultCenter = [22.5937, 78.9629]; // Center of India

  return (
    <div className="w-full rounded-ts overflow-hidden border border-neutral-300 shadow-ts-card relative" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* 100% Free OpenStreetMap Tile Server */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenterUpdater places={places} defaultCenter={defaultCenter} />

        {places.map((place) => {
          if (!place.latitude || !place.longitude) return null;
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={place.is_hidden_gem ? gemIcon : standardIcon}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 max-w-[200px] text-xs">
                  {place.image_url && (
                    <img
                      src={place.image_url}
                      alt={place.name}
                      className="w-full h-20 object-cover rounded-ts mb-1.5"
                    />
                  )}
                  <h4 className="font-bold text-primary-900 line-clamp-1">{place.name}</h4>
                  <p className="text-neutral-500 text-[10px] mb-1">{place.state}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="flex items-center gap-0.5 text-accent-800 font-bold text-[11px]">
                      <Star className="w-3 h-3 text-accent-400 fill-accent-400" />
                      {place.rating?.toFixed(1)}
                    </span>
                    <button
                      onClick={() => onSelectPlace(place)}
                      className="text-[11px] font-bold text-primary-800 hover:underline inline-flex items-center gap-0.5"
                    >
                      Details <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
