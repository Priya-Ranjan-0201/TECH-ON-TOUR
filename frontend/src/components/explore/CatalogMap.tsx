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

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [35.5, 97.5]
];

function isWithinIndia(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5;
}

// Helper component to auto-pan and zoom map when places change
function MapCenterUpdater({ places }: { places: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (places && places.length > 0) {
      const validCoords = places
        .filter(p => p.latitude && p.longitude && isWithinIndia(Number(p.latitude), Number(p.longitude)))
        .map(p => [Number(p.latitude), Number(p.longitude)]);

      if (validCoords.length === 1) {
        map.setView(validCoords[0], 11, { animate: true });
      } else if (validCoords.length > 1) {
        const bounds = L.latLngBounds(validCoords as [number, number][]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
      } else {
        map.fitBounds(INDIA_BOUNDS, { padding: [20, 20], animate: true });
      }
    } else {
      map.fitBounds(INDIA_BOUNDS, { padding: [20, 20], animate: true });
    }
  }, [places, map]);

  return null;
}

// Clustered markers for CatalogMap
function CatalogClusterGroup({ places, onSelectPlace }: { places: any[]; onSelectPlace?: (p: any) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        const sizeClass = count > 50 ? 'ts-cluster-large' : (count > 15 ? 'ts-cluster-medium' : 'ts-cluster-small');
        const sizePx = count > 50 ? 48 : (count > 15 ? 40 : 34);
        return L.divIcon({
          html: `<div class="ts-cluster-bubble ${sizeClass}"><span>${count}</span></div>`,
          className: 'ts-cluster-wrapper',
          iconSize: [sizePx, sizePx],
          iconAnchor: [sizePx / 2, sizePx / 2]
        });
      }
    });

    places.forEach((place) => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      if (!isWithinIndia(lat, lng)) return;

      const icon = place.is_hidden_gem ? gemIcon : standardIcon;
      const marker = L.marker([lat, lng], { icon });

      marker.bindTooltip(`<b>${place.name}</b><br/><span style="opacity:0.8">${place.state}</span>`, {
        direction: 'top',
        offset: [0, -32],
        className: 'custom-map-tooltip-wrapper'
      });

      marker.bindPopup(`
        <div class="p-1 max-w-[210px] text-xs">
          ${place.image_url ? `<img src="${place.image_url}" alt="${place.name}" class="w-full h-20 object-cover rounded-lg mb-1.5" />` : ''}
          <h4 class="font-bold text-neutral-900 line-clamp-1">${place.name}</h4>
          <p class="text-neutral-500 text-[10px] mb-1">${place.state}</p>
          <div class="flex items-center justify-between mt-1 pt-1 border-t border-neutral-100">
            <span class="font-bold text-amber-700 text-[11px]">★ ${place.rating?.toFixed(1) || '4.5'}</span>
            <a href="#/destinations/${place.id}" class="text-[11px] font-bold text-[#8C3618] hover:underline">
              Details →
            </a>
          </div>
        </div>
      `, { className: 'custom-leaflet-popup' });

      if (onSelectPlace) {
        marker.on('click', () => onSelectPlace(place));
      }

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, places, onSelectPlace]);

  return null;
}

export default function CatalogMap({ 
  places = [], 
  onSelectPlace,
  height = '500px'
}: {
  places?: any[];
  onSelectPlace?: (p: any) => void;
  height?: string;
}) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl relative" style={{ height }}>
      <MapContainer
        bounds={INDIA_BOUNDS}
        maxBounds={[[4.0, 65.0], [38.0, 100.0]]}
        minZoom={4}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenterUpdater places={places} />

        <CatalogClusterGroup places={places} onSelectPlace={onSelectPlace} />
      </MapContainer>
    </div>
  );
}
