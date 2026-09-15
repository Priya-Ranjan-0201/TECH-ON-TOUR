import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import axios from 'axios';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation, 
  Layers, 
  Clock, 
  Users, 
  Filter,
  ArrowRight,
  Search,
  X,
  RotateCcw,
  LocateFixed,
  Loader2,
  ExternalLink,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  List,
  Map as MapIcon,
  ChevronRight,
  Eye,
  Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

// India Geographic Bounding Box: [South-West, North-East]
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [35.5, 97.5]
];

// Broad regional bounds covering Indian subcontinent & surrounding seas/landmass
// Strictly prevents tile cutoff or right-side blank grey space on widescreen/high-res displays
const REGIONAL_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-15.0, 35.0],
  [50.0, 140.0]
];

// Coordinate validity helper strictly within India territory
function isWithinIndia(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0;
}

function escapeHtml(text: string): string {
  return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Map Event Listener for Zoom & Center tracking
function MapEventsWatcher({
  onZoomChange,
  onBoundsChange,
  onMapClick
}: {
  onZoomChange: (zoom: number, center: [number, number]) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onMapClick?: () => void;
}) {
  const map = useMapEvents({
    click: () => {
      if (onMapClick) onMapClick();
    },
    zoomend: () => {
      const center = map.getCenter();
      onZoomChange(map.getZoom(), [center.lat, center.lng]);
      if (onBoundsChange) onBoundsChange(map.getBounds());
    },
    moveend: () => {
      const center = map.getCenter();
      onZoomChange(map.getZoom(), [center.lat, center.lng]);
      if (onBoundsChange) onBoundsChange(map.getBounds());
    }
  });

  useEffect(() => {
    map.setMaxBounds(REGIONAL_MAX_BOUNDS);
  }, [map]);

  return null;
}

// Map Resize Watcher: Fixes Leaflet tile rendering & eliminates right-side blank space on flex resize
function MapResizeWatcher({ isListPanelOpen }: { isListPanelOpen: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, isListPanelOpen]);

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);

    const handleWindowResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [map]);

  return null;
}

// Leaflet Map Camera Controller: Dynamic fit to actual marker/cluster bounds & search extent
function MapController({ 
  points, 
  focusCoords,
  userCoords,
  hasLiveGps,
  activeQuery,
  routeBounds,
  autoFitKey
}: { 
  points: any[]; 
  focusCoords: [number, number] | null;
  userCoords: [number, number] | null;
  hasLiveGps: boolean;
  activeQuery: string;
  routeBounds?: L.LatLngBounds | null;
  autoFitKey: string | number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(REGIONAL_MAX_BOUNDS);

    // 0. Route Bounds priority: when a route is previewed, auto-frame the entire route
    if (routeBounds && routeBounds.isValid()) {
      map.fitBounds(routeBounds.pad(0.15), { animate: true });
      return;
    }

    // 1. Explicit coordinate focus (from URL search e.g. ?lat=...&lng=...)
    if (focusCoords && !isNaN(focusCoords[0]) && !isNaN(focusCoords[1])) {
      map.flyTo(focusCoords, 14, { duration: 1.2 });
      return;
    }

    // 2. Dynamic fit to actual marker/cluster bounds
    if (points && points.length > 0) {
      const validPoints = points.filter(p => {
        const lat = Number(p.lat ?? p.latitude);
        const lng = Number(p.lng ?? p.longitude);
        return !isNaN(lat) && !isNaN(lng) && isWithinIndia(lat, lng);
      });

      if (validPoints.length === 1) {
        const targetLat = Number(validPoints[0].lat ?? validPoints[0].latitude);
        const targetLng = Number(validPoints[0].lng ?? validPoints[0].longitude);
        map.flyTo([targetLat, targetLng], 14, { duration: 1.2 });
        return;
      }

      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints.map(p => [Number(p.lat ?? p.latitude), Number(p.lng ?? p.longitude)]));
        if (bounds.isValid()) {
          if (activeQuery.trim()) {
            map.flyToBounds(bounds.pad(0.15), { duration: 1.2 });
          } else {
            map.fitBounds(bounds.pad(0.1), { animate: true });
          }
          return;
        }
      }
    }

    // 3. User live location known AND verified within India bounds
    if (hasLiveGps && userCoords && isWithinIndia(userCoords[0], userCoords[1])) {
      map.setView(userCoords, 11, { animate: true });
      return;
    }

    // 4. Default: Scoped strictly to India mainland bounds
    map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });
  }, [points, focusCoords, userCoords, hasLiveGps, activeQuery, routeBounds, autoFitKey, map]);

  return null;
}

export const isEssentialCategory = (cat?: string, name?: string): boolean => {
  const c = String(cat || '').toLowerCase().trim();
  if (['hospital', 'clinic', 'hotel', 'resort', 'homestay', 'stay', 'lodge', 'rent_house', 'rental', 'guest_house', 'restaurant', 'cafe', 'dining', 'dhaba', 'police', 'pharmacy', 'emergency'].includes(c)) {
    return true;
  }
  const n = String(name || '').toLowerCase();
  if (n.includes('hospital') || n.includes('clinic') || n.includes('medical') || n.includes('dispensary') || n.includes('health centre') || n.includes('health center') || n.includes('pharmacy') || n.includes('trauma')) return true;
  if (n.includes('homestay') || n.includes('rent house') || n.includes('guest house') || n.includes('farmstay') || n.includes('eco stay') || n.includes('cottage') || n.includes('treehouse') || n.includes('houseboat')) return true;
  if (n.includes('hotel') || n.includes('resort') || n.includes('tourist lodge') || n.includes('palace hotel') || n.includes('inn ') || n.includes('marriott') || n.includes('taj ') || n.includes('oberoi') || n.includes('radisson')) return true;
  if (n.includes('restaurant') || n.includes('cafe') || n.includes('dhaba') || n.includes('bhojanalaya') || n.includes('rasoi') || n.includes('kitchen') || n.includes('bistro') || n.includes('dining') || n.includes('bakery') || n.includes('thali')) return true;
  return false;
};

// Custom Teardrop Pin Generator (No permanent text pills — hover tooltip / click popup only)
function createTeardropPin(type: 'regular' | 'hidden-gem' | 'trip-stop' | 'crowd-warning' | 'hospital' | 'hotel' | 'homestay' | 'restaurant') {
  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `<div class="custom-pin ${type}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28]
  });
}

// Pulsing Blue GPS Beacon for Real User Location
const userGpsIcon = L.divIcon({
  className: 'custom-gps-marker',
  html: `
    <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:#3B82F6; opacity:0.5; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position:relative; width:14px; height:14px; border-radius:50%; background:#2563EB; border:2.5px solid #FFFFFF; box-shadow:0 2px 10px rgba(37,99,235,0.7);"></span>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14]
});

// Marker Clustering Layer with Theme 1 Terracotta Bubbles
function ClusterGroupLayer({
  destinations,
  onSelectDest,
  onNavigate
}: {
  destinations: any[];
  onSelectDest: (d: any) => void;
  onNavigate: (d: any) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Initialize Leaflet MarkerClusterGroup with tuned radius (38) for natural geographic density
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 20,
      maxClusterRadius: 38,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let sizeClass = 'ts-cluster-small';
        let sizePx = 34;

        if (count > 50) {
          sizeClass = 'ts-cluster-large';
          sizePx = 48;
        } else if (count > 15) {
          sizeClass = 'ts-cluster-medium';
          sizePx = 40;
        }

        return L.divIcon({
          html: `
            <div class="ts-cluster-bubble ${sizeClass}">
              <span>${count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}</span>
            </div>
          `,
          className: 'ts-cluster-wrapper',
          iconSize: [sizePx, sizePx],
          iconAnchor: [sizePx / 2, sizePx / 2]
        });
      }
    });

    const markers: any[] = [];
    destinations.forEach(d => {
      const lat = Number(d.lat ?? d.latitude);
      const lng = Number(d.lng ?? d.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      if (!isWithinIndia(lat, lng)) return;

      const catLower = String(d.category || '').toLowerCase();
      const nameLower = String(d.name || '').toLowerCase();
      let pinType: 'regular' | 'hidden-gem' | 'trip-stop' | 'crowd-warning' | 'hospital' | 'hotel' | 'homestay' | 'restaurant' = 'regular';
      
      const isHospital = catLower === 'hospital' || catLower === 'clinic' || nameLower.includes('hospital') || nameLower.includes('clinic');
      const isHomestay = catLower === 'homestay' || catLower === 'stay' || catLower === 'rent_house' || nameLower.includes('homestay') || nameLower.includes('rent house') || nameLower.includes('guest house');
      const isHotel = catLower === 'hotel' || catLower === 'resort' || catLower === 'lodge' || nameLower.includes('hotel') || nameLower.includes('resort');
      const isRestaurant = catLower === 'restaurant' || catLower === 'cafe' || catLower === 'dhaba' || nameLower.includes('restaurant') || nameLower.includes('dhaba') || nameLower.includes('cafe');

      if (isHospital) {
        pinType = 'hospital';
      } else if (isHomestay) {
        pinType = 'homestay';
      } else if (isHotel) {
        pinType = 'hotel';
      } else if (isRestaurant) {
        pinType = 'restaurant';
      } else if (d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60)) {
        pinType = 'crowd-warning';
      } else if (d.isHiddenGem && !isEssentialCategory(d.category, d.name)) {
        pinType = 'hidden-gem';
      } else if (d.isTripStop) {
        pinType = 'trip-stop';
      }

      const icon = createTeardropPin(pinType);
      const marker = L.marker([lat, lng], { icon });

      // 1. Tooltip on Hover ONLY
      const safeName = escapeHtml(d.name);
      const safeState = escapeHtml(d.state || '');
      const safeCat = escapeHtml(d.category || '');

      marker.bindTooltip(`
        <div class="ts-map-tooltip">
          <div class="ts-tooltip-title">${safeName}</div>
          <div class="ts-tooltip-meta">${safeState} • ${safeCat}</div>
          ${isHospital ? '<div style="color:#DC2626; font-size:10px; font-weight:700; margin-top:2px;">🏥 24/7 Medical Hospital & Emergency</div>' : ''}
          ${isHotel ? '<div style="color:#4F46E5; font-size:10px; font-weight:700; margin-top:2px;">🏨 Verified Hotel & Resort</div>' : ''}
          ${isHomestay ? '<div style="color:#0D9488; font-size:10px; font-weight:700; margin-top:2px;">🏡 Certified Homestay & Rent House</div>' : ''}
          ${isRestaurant ? '<div style="color:#EA580C; font-size:10px; font-weight:700; margin-top:2px;">🍽️ Authentic Dining & Restaurant</div>' : ''}
          ${(!isHospital && !isHotel && !isHomestay && !isRestaurant && d.isHiddenGem) ? '<div class="ts-tooltip-gem" style="color:#059669; font-size:10px; font-weight:700; margin-top:2px;">🌿 Verified Hidden Gem</div>' : ''}
          ${(!isHospital && !isHotel && !isHomestay && !isRestaurant && (d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60))) ? `<div style="color:#D97706; font-size:10px; font-weight:700; margin-top:2px;">⚠️ High Tourist Footfall (${d.crowdCapacityPct}%)</div>` : ''}
        </div>
      `, {
        direction: 'top',
        offset: [0, -28],
        className: 'custom-map-tooltip-wrapper',
        opacity: 0.98
      });

      // 2. Popup on Click with In-App Route Preview
      const imgHtml = (d.image && d.image_source !== 'placeholder' && !d.needs_manual_photo)
        ? `<img src="${d.image}" alt="${safeName}" style="width:100%; height:90px; object-fit:cover; border-radius:10px; margin-bottom:6px;" />`
        : `<div style="width:100%; height:72px; background:linear-gradient(135deg, #8C3618 0%, #C97227 100%); border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-align:center; padding:6px; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:700;">${safeName}</span>
            <span style="font-size:9px; opacity:0.85;">${safeState}</span>
           </div>`;

      const descText = String(d.description || '');
      const phoneMatch = descText.match(/(?:phone|helpline|emergency|tel):\s*([+\d\s\-\/]{7,25})/i) || descText.match(/([+\d]{1,4}[- ]\d{2,4}[- ]\d{5,8})/);
      const rawPhone = phoneMatch ? phoneMatch[1].trim() : (isHospital ? '108' : null);
      const callPhone = rawPhone ? rawPhone.split('/')[0].trim().replace(/[^\d+]/g, '') : null;
      const safeDesc = descText ? escapeHtml(descText.slice(0, 160)) + (descText.length > 160 ? '...' : '') : '';

      marker.bindPopup(`
        <div style="padding:2px; max-width:245px; font-family:Inter,sans-serif;">
          ${imgHtml}
          <div>
            <span style="font-weight:700; font-size:13px; color:#111827; display:block; line-height:1.2;">${safeName}</span>
            <p style="color:#6B7280; font-size:10px; margin:2px 0 4px 0;">${safeState} • ${safeCat}</p>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; padding:3px 0; border-top:1px solid #F3F4F6;">
            <span style="font-weight:700; color:${isHospital ? '#DC2626' : isHotel ? '#4F46E5' : isHomestay ? '#0D9488' : isRestaurant ? '#EA580C' : d.isHiddenGem ? '#059669' : ((d.crowdCapacityPct && d.crowdCapacityPct > 60) ? '#D97706' : '#2563EB')}; font-size:10px;">
              ${isHospital ? '🏥 24/7 Hospital & Emergency' : isHotel ? '🏨 Verified Hotel' : isHomestay ? '🏡 Certified Homestay' : isRestaurant ? '🍽️ Verified Dining' : d.isHiddenGem ? `🌿 Hidden Gem (${d.crowdCapacityPct}%)` : ((d.crowdCapacityPct && d.crowdCapacityPct > 60) ? `⚠️ High Congestion (${d.crowdCapacityPct}%)` : `${d.crowdLevel || 'Moderate'} Density`)}
            </span>
            <span style="font-size:10px; font-weight:700; color:#B45309;">
              ★ ${d.rating || 4.6} ${d.price_range ? `• ${d.price_range}` : ''}
            </span>
          </div>
          ${safeDesc ? `
            <div style="font-size:10px; color:#4B5563; line-height:1.35; margin:3px 0 5px 0; background:#F9FAFB; padding:5px 6px; border-radius:6px; border:1px solid #F3F4F6;">
              ${safeDesc}
            </div>
          ` : ''}
          ${callPhone ? `
            <div style="margin-bottom:6px;">
              <a href="tel:${callPhone}" style="display:flex; align-items:center; justify-content:center; gap:4px; background:${isHospital ? '#DC2626' : '#2563EB'}; color:#fff; font-size:10px; font-weight:700; padding:5px 8px; border-radius:8px; text-decoration:none;">
                <span>📞 ${isHospital ? 'Emergency Helpline' : 'Direct Call'}: ${rawPhone}</span>
              </a>
            </div>
          ` : ''}
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="ts-popup-nav-btn" data-dest-id="${d.id}" style="flex:1; background:#712B13; color:#fff; font-size:10px; font-weight:700; padding:6px 8px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
              <span>🧭 In-App Route</span>
            </button>
            <button class="ts-popup-gmaps-btn" data-lat="${lat}" data-lng="${lng}" style="background:#4B5563; color:#fff; font-size:10px; font-weight:700; padding:6px 8px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:2px;" title="External Google Maps Fallback">
              <span>GMaps ↗</span>
            </button>
            <a href="#/destinations/${d.id}" style="background:#F3F4F6; color:#1F2937; font-size:10px; font-weight:700; padding:6px 8px; border-radius:8px; text-decoration:none; display:flex; align-items:center; justify-content:center;">
              Details
            </a>
          </div>
        </div>
      `, { className: 'custom-leaflet-popup' });

      marker.on('click', () => {
        onSelectDest(d);
      });

      markers.push(marker);
    });

    map.addLayer(clusterGroup);
    if (markers.length > 0) {
      clusterGroup.addLayers(markers);
    }

    const handlePopupOpen = (e: any) => {
      const container = e.popup.getElement();
      if (!container) return;
      
      const navBtn = container.querySelector('.ts-popup-nav-btn');
      if (navBtn) {
        navBtn.onclick = () => {
          const destId = navBtn.getAttribute('data-dest-id');
          const found = destinations.find(x => String(x.id) === String(destId));
          if (found) {
            onNavigate(found);
          }
        };
      }

      const gmapsBtn = container.querySelector('.ts-popup-gmaps-btn');
      if (gmapsBtn) {
        gmapsBtn.onclick = () => {
          const dLat = gmapsBtn.getAttribute('data-lat');
          const dLng = gmapsBtn.getAttribute('data-lng');
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}&travelmode=driving`, '_blank');
        };
      }
    };

    map.on('popupopen', handlePopupOpen);

    return () => {
      map.off('popupopen', handlePopupOpen);
      clusterGroup.clearLayers();
      map.removeLayer(clusterGroup);
    };
  }, [map, destinations, onSelectDest, onNavigate]);

  return null;
}

export default function SmartMapView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { destinations: fallbackDestinations } = useApp();

  const { t } = useTranslation();
  const queryFromUrl = searchParams.get('q') || searchParams.get('search') || searchParams.get('destination') || location.state?.destination || '';
  const latFromUrl = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const lngFromUrl = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const focusCoords: [number, number] | null = (latFromUrl && lngFromUrl && isWithinIndia(latFromUrl, lngFromUrl)) 
    ? [latFromUrl, lngFromUrl] 
    : null;

  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [activeQuery, setActiveQuery] = useState(queryFromUrl);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'gems' | 'crowd' | 'essentials'>('all');
  const [essentialSubFilter, setEssentialSubFilter] = useState<'all' | 'hospital' | 'hotel' | 'homestay' | 'restaurant'>('all');
  const [selectedDest, setSelectedDest] = useState<any>(null);
  const [autoFitKey, setAutoFitKey] = useState<number>(0);
  const [hourlyToken, setHourlyToken] = useState<string | null>(null);

  // Live Autocomplete Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close suggestions on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Split View Panel state
  const [isListPanelOpen, setIsListPanelOpen] = useState(true);
  const [listFilterAnchor, setListFilterAnchor] = useState<any | null>(null);

  // Deep Zoom Weather Widget state
  const [currentZoom, setCurrentZoom] = useState(5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 82.0]);
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Live Location & Road Routing state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [hasLiveGps, setHasLiveGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeBounds, setRouteBounds] = useState<L.LatLngBounds | null>(null);

  // Request location on mount
  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (isWithinIndia(lat, lng)) {
          setUserCoords([lat, lng]);
          setHasLiveGps(true);
          axios.post('/api/location/ping', {
            user_id: 'live-traveler',
            latitude: lat,
            longitude: lng
          }).catch(() => {});
        }
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation unavailable:', err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Live Autocomplete Debounce (300ms, min 2 chars)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setIsSuggesting(true);
      axios.get(`/api/destinations?query=${encodeURIComponent(q)}&limit=6`)
        .then(res => {
          const results = res.data?.results || [];
          setSuggestions(results);
          setShowSuggestions(true);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setIsSuggesting(false);
        });
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Live Search Query Debounce: automatically updates activeQuery as user types & resets layer
  useEffect(() => {
    const q = searchQuery.trim();
    const timer = setTimeout(() => {
      if (q.length === 0 && activeQuery !== '') {
        setActiveQuery('');
        setActiveLayer('all');
        setSearchParams({});
      } else if (q.length >= 2 && q !== activeQuery) {
        setActiveQuery(q);
        setActiveLayer('all');
        setSearchParams({ q });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeQuery]);

  // Deep Zoom Weather Widget (triggered on zoom >= 14 or single selection)
  useEffect(() => {
    const target = selectedDest || (currentZoom >= 14 ? { lat: mapCenter[0], lng: mapCenter[1], name: '' } : null);
    if (!target) {
      setWeatherData(null);
      return;
    }

    const tLat = Number(target.lat ?? target.latitude);
    const tLng = Number(target.lng ?? target.longitude);
    if (isNaN(tLat) || isNaN(tLng) || !isWithinIndia(tLat, tLng)) return;

    setWeatherLoading(true);
    axios.get(`/api/weather?lat=${tLat}&lng=${tLng}${target.name ? `&destination=${encodeURIComponent(target.name)}` : ''}`)
      .then(res => {
        if (res.data) {
          setWeatherData(res.data);
        }
      })
      .catch(() => {
        setWeatherData(null);
      })
      .finally(() => {
        setWeatherLoading(false);
      });
  }, [currentZoom, mapCenter, selectedDest]);

  // In-App Road Route Preview via OpenRouteService
  const showRoute = useCallback(async (dest: any) => {
    const destLat = Number(dest.lat ?? dest.latitude);
    const destLng = Number(dest.lng ?? dest.longitude);
    if (isNaN(destLat) || isNaN(destLng)) return;

    setSelectedDest(dest);
    setRouteLoading(true);

    let startLat = 28.6139;
    let startLng = 77.2090;
    if (userCoords && isWithinIndia(userCoords[0], userCoords[1])) {
      startLat = userCoords[0];
      startLng = userCoords[1];
    }

    try {
      const res = await axios.get(`/api/route?start_lat=${startLat}&start_lng=${startLng}&end_lat=${destLat}&end_lng=${destLng}&mode=driving-car`);
      const route = res.data;
      if (route && route.coordinates && route.coordinates.length > 0) {
        setRouteData(route);
        if (route.coordinates.length > 1) {
          const bounds = L.latLngBounds(route.coordinates);
          setRouteBounds(bounds);
        }
      } else {
        setRouteData({
          distance_km: 120,
          duration_min: 150,
          coordinates: [[startLat, startLng], [destLat, destLng]],
          is_estimated: true,
          provider: 'straight_line_fallback',
          google_maps_nav_url: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`
        });
      }
    } catch (err: any) {
      console.warn('Routing API call failed, using straight-line fallback:', err.message);
      setRouteData({
        distance_km: 120,
        duration_min: 150,
        coordinates: [[startLat, startLng], [destLat, destLng]],
        is_estimated: true,
        provider: 'straight_line_fallback',
        google_maps_nav_url: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`
      });
    } finally {
      setRouteLoading(false);
    }
  }, [userCoords]);

  // Sync with URL query parameter
  useEffect(() => {
    if (queryFromUrl !== activeQuery) {
      setSearchQuery(queryFromUrl);
      setActiveQuery(queryFromUrl);
    }
  }, [queryFromUrl, activeQuery]);

  // Fetch map points with essentials or general filtering
  useEffect(() => {
    setLoading(true);
    setSearchNotFound(null);
    const q = activeQuery.trim();

    if (q) {
      axios.get(`/api/destinations/map-points?q=${encodeURIComponent(q)}&limit=15000`)
        .then(res => {
          const points = res.data?.points || [];
          if (!points.length) {
            return axios.get(`/api/destinations?query=${encodeURIComponent(q)}&limit=100`)
              .then(catRes => {
                const results = catRes.data?.results || [];
                return results.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  state: p.state,
                  district: p.district || '',
                  lat: Number(p.latitude ?? p.lat),
                  lng: Number(p.longitude ?? p.lng),
                  category: p.category || 'Sightseeing',
                  rating: p.rating,
                  reviewCount: p.review_count,
                  isHiddenGem: !!p.is_hidden_gem,
                  crowdLevel: 'Moderate',
                  crowdCapacityPct: 45,
                  crowdStatus: 'Comfortable Density & Peaceful Surroundings',
                  image: p.image_url || p.image || null,
                  image_source: p.image_source || 'placeholder',
                  needs_manual_photo: !!p.needs_manual_photo,
                  description: p.description
                }));
              });
          }
          return points.map((p: any) => {
            const rawCrowd = typeof p.crowd_density_score === 'number'
              ? (p.crowd_density_score > 1 ? p.crowd_density_score / 100 : p.crowd_density_score)
              : 0.45;
            return {
              id: p.id,
              name: p.name,
              state: p.state,
              district: p.district || '',
              lat: Number(p.lat ?? p.latitude),
              lng: Number(p.lng ?? p.longitude),
              category: p.category || 'Sightseeing',
              rating: p.rating,
              isHiddenGem: !!p.is_hidden_gem,
              crowdLevel: rawCrowd > 0.7 ? 'Very Busy' : (rawCrowd > 0.4 ? 'Moderate' : 'Low'),
              crowdCapacityPct: Math.round(rawCrowd * 100),
              crowdStatus: rawCrowd > 0.7 ? 'High Tourist Footfall - Consider Morning Hours' : 'Comfortable Density & Peaceful Surroundings',
              image: p.image_url || p.image || null,
              image_source: p.image_source || 'placeholder',
              needs_manual_photo: !!p.needs_manual_photo,
              description: p.description || '',
              price_range: p.price_range || '₹₹',
              reviewCount: p.review_count || 120
            };
          });
        })
        .then((mapped: any[]) => {
          const valid = (mapped || []).filter((p: any) => isWithinIndia(p.lat, p.lng));
          if (!valid.length) {
            setSearchNotFound(q);
            setMapPoints([]);
          } else {
            setMapPoints(valid);
            setAutoFitKey(prev => prev + 1);
            if (valid.length === 1) {
              setSelectedDest(valid[0]);
              setListFilterAnchor(valid[0]);
            }
          }
        })
        .catch(err => {
          console.warn('Destinations search query failed:', err.message);
          setSearchNotFound(q);
          setMapPoints([]);
        })
        .finally(() => setLoading(false));
    } else {
      const url = '/api/destinations/map-points?limit=15000';

      axios.get(url)
        .then(res => {
          if (res.data && res.data.points && res.data.points.length > 0) {
            if (res.data.hourly_token) {
              setHourlyToken(res.data.hourly_token);
            }
            const mapped = res.data.points.map((p: any) => {
              const rawCrowd = typeof p.crowd_density_score === 'number'
                ? (p.crowd_density_score > 1 ? p.crowd_density_score / 100 : p.crowd_density_score)
                : 0.45;
              return {
                id: p.id,
                name: p.name,
                state: p.state,
                district: p.district || '',
                lat: Number(p.latitude ?? p.lat),
                lng: Number(p.longitude ?? p.lng),
                category: p.category || 'Sightseeing',
                rating: p.rating,
                isHiddenGem: !!p.is_hidden_gem,
                crowdLevel: rawCrowd > 0.60 ? 'Very Busy' : (rawCrowd > 0.38 ? 'Moderate' : 'Low'),
                crowdCapacityPct: Math.round(rawCrowd * 100),
                crowdStatus: rawCrowd > 0.60 ? 'High Tourist Footfall - Consider Morning Hours' : (p.is_hidden_gem ? 'Peaceful & Low Tourist Density' : 'Comfortable Density & Steady Footfall'),
                image: p.image_url || p.image || null,
                image_source: p.image_source || 'placeholder',
                needs_manual_photo: !!p.needs_manual_photo,
                description: p.description || '',
                price_range: p.price_range || '₹₹',
                reviewCount: p.review_count || 120
              };
            }).filter((p: any) => isWithinIndia(p.lat, p.lng));
            setMapPoints(mapped);
            setAutoFitKey(prev => prev + 1);
          }
        })
        .catch(err => {
          console.warn('Using fallback map destinations:', err.message);
          setMapPoints((fallbackDestinations || []).filter((d: any) => isWithinIndia(Number(d.lat), Number(d.lng))));
          setAutoFitKey(prev => prev + 1);
        })
        .finally(() => setLoading(false));
    }
  }, [activeQuery, fallbackDestinations]);

  // Client-side layer & search filtering: strictly limits rendered markers to what was searched
  const displayDestinations = useMemo(() => {
    const rawQuery = (activeQuery || searchQuery || '').toLowerCase().trim();

    return mapPoints.filter(d => {
      const lat = Number(d.lat ?? d.latitude);
      const lng = Number(d.lng ?? d.longitude);
      if (!isWithinIndia(lat, lng)) return false;

      // When searching, strictly show destinations matching the search query!
      if (rawQuery && rawQuery.length >= 2) {
        const name = String(d.name || '').toLowerCase();
        const state = String(d.state || '').toLowerCase();
        const district = String(d.district || '').toLowerCase();
        const cat = String(d.category || '').toLowerCase();
        const desc = String(d.description || '').toLowerCase();

        const matches = 
          state === rawQuery ||
          state.includes(rawQuery) ||
          name.includes(rawQuery) ||
          district.includes(rawQuery) ||
          cat.includes(rawQuery) ||
          desc.includes(rawQuery);

        if (!matches) return false;
      }

      const isEss = isEssentialCategory(d.category, d.name);
      if (activeLayer === 'gems') return Boolean(d.isHiddenGem) && !isEss;
      if (activeLayer === 'crowd') return (d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60)) && !isEss;
      if (activeLayer === 'essentials') {
        if (!isEss) return false;
        if (essentialSubFilter === 'all') return true;
        const catLower = String(d.category || '').toLowerCase();
        const nameLower = String(d.name || '').toLowerCase();
        if (essentialSubFilter === 'hospital') {
          return catLower.includes('hospital') || catLower.includes('clinic') || nameLower.includes('hospital') || nameLower.includes('health') || nameLower.includes('medical') || nameLower.includes('trauma');
        }
        if (essentialSubFilter === 'hotel') {
          return catLower.includes('hotel') || catLower.includes('resort') || catLower.includes('lodge') || nameLower.includes('hotel') || nameLower.includes('resort') || nameLower.includes('palace');
        }
        if (essentialSubFilter === 'homestay') {
          return catLower.includes('homestay') || catLower.includes('stay') || catLower.includes('rent') || nameLower.includes('homestay') || nameLower.includes('cottage') || nameLower.includes('treehouse') || nameLower.includes('houseboat');
        }
        if (essentialSubFilter === 'restaurant') {
          return catLower.includes('restaurant') || catLower.includes('cafe') || catLower.includes('dhaba') || nameLower.includes('restaurant') || nameLower.includes('kitchen') || nameLower.includes('rasoi') || nameLower.includes('dining') || nameLower.includes('bakery') || nameLower.includes('thali');
        }
        return true;
      }
      return true;
    });
  }, [mapPoints, activeLayer, essentialSubFilter, activeQuery, searchQuery]);

  // Filtered destinations for the side/split list view
  const listPanelDestinations = useMemo(() => {
    if (!listFilterAnchor) {
      return displayDestinations.slice(0, 100);
    }
    const anchorLat = Number(listFilterAnchor.lat ?? listFilterAnchor.latitude);
    const anchorLng = Number(listFilterAnchor.lng ?? listFilterAnchor.longitude);
    const anchorState = String(listFilterAnchor.state || '').toLowerCase();
    const anchorDistrict = String(listFilterAnchor.district || '').toLowerCase();

    const filtered = displayDestinations.filter(d => {
      if (d.id === listFilterAnchor.id) return true;
      const dState = String(d.state || '').toLowerCase();
      const dDistrict = String(d.district || '').toLowerCase();
      const dLat = Number(d.lat ?? d.latitude);
      const dLng = Number(d.lng ?? d.longitude);

      if (anchorDistrict && dDistrict && anchorDistrict === dDistrict) return true;
      if (anchorState && dState === anchorState) {
        const distDeg = Math.hypot(dLat - anchorLat, dLng - anchorLng);
        return distDeg <= 0.65; // ~70km
      }
      return false;
    });

    return filtered.length > 0 ? filtered : [listFilterAnchor];
  }, [displayDestinations, listFilterAnchor]);

  // When activeLayer changes, re-fit
  useEffect(() => {
    setAutoFitKey(prev => prev + 1);
  }, [activeLayer, essentialSubFilter]);

  // Layer counts scoped to the current filtered view
  const layerCounts = useMemo(() => {
    let gems = 0;
    let crowd = 0;
    let essentials = 0;
    let essentialsHospitals = 0;
    let essentialsHotels = 0;
    let essentialsHomestays = 0;
    let essentialsRestaurants = 0;

    const rawQuery = (activeQuery || searchQuery || '').toLowerCase().trim();
    const targetPool = (rawQuery && rawQuery.length >= 2)
      ? mapPoints.filter(d => {
          const name = String(d.name || '').toLowerCase();
          const state = String(d.state || '').toLowerCase();
          const district = String(d.district || '').toLowerCase();
          const cat = String(d.category || '').toLowerCase();
          const desc = String(d.description || '').toLowerCase();
          return state === rawQuery || state.includes(rawQuery) || name.includes(rawQuery) || district.includes(rawQuery) || cat.includes(rawQuery) || desc.includes(rawQuery);
        })
      : mapPoints;

    targetPool.forEach(d => {
      const isEss = isEssentialCategory(d.category, d.name);
      if (d.isHiddenGem && !isEss) gems++;
      if (!isEss && (d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60))) crowd++;
      if (isEss) {
        essentials++;
        const catLower = String(d.category || '').toLowerCase();
        const nameLower = String(d.name || '').toLowerCase();
        if (catLower.includes('hospital') || catLower.includes('clinic') || nameLower.includes('hospital') || nameLower.includes('health') || nameLower.includes('medical') || nameLower.includes('trauma')) {
          essentialsHospitals++;
        } else if (catLower.includes('homestay') || catLower.includes('stay') || catLower.includes('rent') || nameLower.includes('homestay') || nameLower.includes('cottage') || nameLower.includes('treehouse') || nameLower.includes('houseboat')) {
          essentialsHomestays++;
        } else if (catLower.includes('restaurant') || catLower.includes('cafe') || catLower.includes('dhaba') || nameLower.includes('restaurant') || nameLower.includes('kitchen') || nameLower.includes('rasoi') || nameLower.includes('dining') || nameLower.includes('bakery') || nameLower.includes('thali')) {
          essentialsRestaurants++;
        } else {
          essentialsHotels++;
        }
      }
    });
    return { all: targetPool.length, gems, crowd, essentials, essentialsHospitals, essentialsHotels, essentialsHomestays, essentialsRestaurants };
  }, [mapPoints, activeQuery, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const q = searchQuery.trim();
    setActiveQuery(q);
    setActiveLayer('all');
    setRouteData(null);
    setRouteBounds(null);
    setListFilterAnchor(null);
    if (q) {
      setSearchParams({ q });
    } else {
      setSearchParams({});
    }
  };

  const handleSelectSuggestion = (item: any) => {
    setShowSuggestions(false);
    setSearchQuery(item.name);
    setActiveQuery(item.name);
    setActiveLayer('all');
    setSelectedDest(item);
    setListFilterAnchor(item);
    setRouteData(null);
    setRouteBounds(null);
    setSearchParams({ q: item.name });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
    setActiveLayer('all');
    setSearchNotFound(null);
    setRouteData(null);
    setRouteBounds(null);
    setListFilterAnchor(null);
    setShowSuggestions(false);
    setSearchParams({});
  };

  const handleSelectPin = (dest: any) => {
    setSelectedDest(dest);
    setListFilterAnchor(dest);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] relative overflow-hidden bg-neutral-100 dark:bg-[#121110]">
      
      {/* Left/Main Map Canvas (flex-1 with min-w-0 for flex elasticity) */}
      <div className="flex-1 relative w-full h-full flex flex-col overflow-hidden min-w-0">
        
        {/* Top Floating Map Controls Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col lg:flex-row gap-2.5 items-start lg:items-center justify-between">
          
          {/* Interactive Search Bar with Live Autocomplete */}
          <div ref={searchContainerRef} className="flex flex-wrap items-center gap-2 pointer-events-auto relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl px-3 py-1.5 shadow-xl w-72 sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder={t('map.searchPlaceholder', 'Search places, cities in India...')}
                className="bg-transparent text-xs w-full text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none font-medium"
              />
              {isSuggesting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400 mr-1 shrink-0" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 w-80 bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-fadeIn divide-y divide-neutral-100 dark:divide-neutral-800">
                <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900/60 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{t('map.destinationsMatching', { query: searchQuery })}</span>
                  <button onClick={() => setShowSuggestions(false)} className="hover:text-neutral-600 cursor-pointer">✕</button>
                </div>
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSuggestion(s)}
                    className="p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#8C3618] text-white text-[10px] font-bold flex items-center justify-center">POI</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">{s.name}</h4>
                      <p className="text-[10px] text-neutral-500 truncate">{s.state || 'India'} • {s.category || 'Sightseeing'}</p>
                    </div>
                    {s.rating && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                        ★ {s.rating}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Active Filter Pill */}
            {activeQuery && (
              <div className="bg-[#8C3618] text-white border border-[#A44320] rounded-full px-3 py-1 shadow-md flex items-center gap-2 text-xs font-semibold animate-fadeIn">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('map.onlyFilter', { query: activeQuery, count: displayDestinations.length })}</span>
                <button
                  onClick={handleClearSearch}
                  className="hover:text-amber-200 font-bold ml-1 cursor-pointer"
                  title="Show all India"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Layer Filter Pills + Locate Me Button */}
          <div className="pointer-events-auto bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 shadow-xl flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeLayer === 'all'
                  ? 'bg-[#8C3618] text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#8C3618]'
              }`}
            >
              {activeQuery ? t('map.allIn', { query: activeQuery, count: layerCounts.all }) : t('map.allPlaces', { count: layerCounts.all })}
            </button>

            <button
              onClick={() => setActiveLayer('gems')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeLayer === 'gems'
                  ? 'bg-[#2E6038] text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#2E6038]'
              }`}
            >
              <span>🌿 {t('map.hiddenGems', { count: layerCounts.gems })}</span>
            </button>

            <button
              onClick={() => setActiveLayer('crowd')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeLayer === 'crowd'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-600'
              }`}
            >
              <span>⚠️ {t('map.crowdWarnings', { count: layerCounts.crowd })}</span>
            </button>

            {/* Single Essentials Toggle (Hospital + Hotel + Restaurant) */}
            <button
              onClick={() => setActiveLayer(activeLayer === 'essentials' ? 'all' : 'essentials')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeLayer === 'essentials'
                  ? 'bg-red-700 text-white shadow-xs ring-2 ring-red-400'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-red-700'
              }`}
              title="Show emergency hospitals, verified hotels & restaurants"
            >
              <span>🏥 {t('map.essentials', { count: layerCounts.essentials })}</span>
            </button>

            {hourlyToken && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold select-none cursor-default"
                title={`Hourly Token: ${hourlyToken} — Live Telemetry & Carrying Capacity ML Active`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{t('map.hourlyActive', 'Hourly Telemetry Active')}</span>
              </div>
            )}

            <div className="w-[1px] h-5 bg-neutral-200 dark:bg-neutral-800 mx-0.5"></div>

            {/* Locate Me Button */}
            <button
              onClick={requestLocation}
              disabled={gpsLoading}
              className={`p-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                hasLiveGps 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={hasLiveGps ? "Live GPS Active" : "Find My Location"}
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <LocateFixed className={`w-3.5 h-3.5 ${hasLiveGps ? 'text-blue-600 fill-blue-100' : ''}`} />
              )}
              <span className="hidden sm:inline">{hasLiveGps ? 'GPS' : 'Locate'}</span>
            </button>

            {/* Split Panel Toggle Button */}
            <button
              onClick={() => setIsListPanelOpen(!isListPanelOpen)}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                isListPanelOpen 
                  ? 'bg-[#8C3618] text-white shadow-xs' 
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={isListPanelOpen ? "Hide Destinations List" : "Show Destinations List"}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List ({displayDestinations.length})</span>
            </button>
          </div>

          {/* Sub-Category Pills for Essentials Layer */}
          {activeLayer === 'essentials' && (
            <div className="pointer-events-auto bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar animate-fadeIn">
              <span className="text-[10px] font-extrabold uppercase text-neutral-400 dark:text-neutral-500 tracking-wider shrink-0 mr-1">
                Category:
              </span>
              <button
                onClick={() => setEssentialSubFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  essentialSubFilter === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                All ({layerCounts.essentials})
              </button>
              <button
                onClick={() => setEssentialSubFilter('hospital')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  essentialSubFilter === 'hospital'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                <span>🏥 Hospitals</span>
                <span className="text-[10px] opacity-80">({layerCounts.essentialsHospitals})</span>
              </button>
              <button
                onClick={() => setEssentialSubFilter('hotel')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  essentialSubFilter === 'hotel'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300'
                }`}
              >
                <span>🏨 Hotels</span>
                <span className="text-[10px] opacity-80">({layerCounts.essentialsHotels})</span>
              </button>
              <button
                onClick={() => setEssentialSubFilter('homestay')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  essentialSubFilter === 'homestay'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300'
                }`}
              >
                <span>🏡 Homestays</span>
                <span className="text-[10px] opacity-80">({layerCounts.essentialsHomestays})</span>
              </button>
              <button
                onClick={() => setEssentialSubFilter('restaurant')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  essentialSubFilter === 'restaurant'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                <span>🍽️ Dining</span>
                <span className="text-[10px] opacity-80">({layerCounts.essentialsRestaurants})</span>
              </button>
            </div>
          )}
        </div>

        {/* Clean No-Results Notification */}
        {searchNotFound && (
          <div className="absolute top-20 left-4 z-20 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No verified destinations found matching "{searchNotFound}".</span>
            <button 
              onClick={handleClearSearch}
              className="underline hover:text-amber-700 font-bold ml-1 cursor-pointer"
            >
              Reset Map
            </button>
          </div>
        )}

        {/* Leaflet Map Canvas */}
        <div className="flex-1 w-full h-full z-10">
          <MapContainer
            bounds={INDIA_BOUNDS}
            maxBounds={REGIONAL_MAX_BOUNDS}
            minZoom={4}
            maxZoom={18}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <MapEventsWatcher 
              onZoomChange={(zoom, center) => {
                setCurrentZoom(zoom);
                setMapCenter(center);
              }}
              onMapClick={() => setShowSuggestions(false)}
            />

            <MapResizeWatcher isListPanelOpen={isListPanelOpen} />

            <MapController 
              points={displayDestinations} 
              focusCoords={focusCoords} 
              userCoords={userCoords}
              hasLiveGps={hasLiveGps}
              activeQuery={activeQuery}
              routeBounds={routeBounds}
              autoFitKey={autoFitKey}
            />

            {/* Clean OpenStreetMap Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User Live Location Marker */}
            {hasLiveGps && userCoords && isWithinIndia(userCoords[0], userCoords[1]) && (
              <Marker position={userCoords} icon={userGpsIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-blue-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-ping"></span>
                      Your Live Location
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Real Road Route Polyline from User to Destination via ORS */}
            {routeData && routeData.coordinates && routeData.coordinates.length > 1 && (
              <Polyline
                positions={routeData.coordinates}
                pathOptions={{
                  color: '#712B13',
                  weight: 5,
                  opacity: 0.95,
                  dashArray: routeData.is_estimated ? '8, 8' : undefined
                }}
              />
            )}

            {/* Clustered Destination Markers */}
            <ClusterGroupLayer
              destinations={displayDestinations}
              onSelectDest={handleSelectPin}
              onNavigate={(d) => showRoute(d)}
            />
          </MapContainer>
        </div>

        {/* Deep Zoom Floating Weather Widget (OpenWeatherMap / Real Telemetry) */}
        {(currentZoom >= 14 || selectedDest) && weatherData && (
          <div className="absolute bottom-6 left-4 z-20 bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-slideUp text-xs font-medium max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-neutral-900 dark:text-white truncate">
                  {weatherData.destination || selectedDest?.name || 'Local Weather'}
                </span>
                <span className="text-base font-extrabold text-[#712B13] dark:text-amber-400">
                  {weatherData.current_temp_c}°C
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 truncate">
                {weatherData.condition} • Feels {weatherData.feels_like_c || weatherData.current_temp_c}°C
              </p>
              <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                <span>💧 {weatherData.humidity_pct || 55}% Humidity</span>
                <span>🌧️ {weatherData.rain_probability_pct || 10}% Rain</span>
              </div>
            </div>
          </div>
        )}

        {/* Route Summary Drawer */}
        {routeData && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-30 sm:w-[380px] bg-white/95 dark:bg-[#1C1A17]/95 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-4 animate-slideUp backdrop-blur-md">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#712B13] text-white flex items-center justify-center font-bold shadow-sm">
                  <Navigation className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                    In-App Route to {selectedDest?.name || 'Destination'}
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    {selectedDest?.state ? `${selectedDest.state} • ` : ''}{routeData.is_estimated ? 'Direct Line Estimate' : 'OpenRouteService Road Track'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setRouteData(null); setRouteBounds(null); }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 cursor-pointer font-bold text-xs"
                title="Close Route Preview"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Est. Driving Time</span>
                <span className="text-base font-extrabold text-[#712B13] dark:text-amber-400">
                  {Math.floor(routeData.duration_min / 60) > 0 ? `${Math.floor(routeData.duration_min / 60)}h ` : ''}{Math.round(routeData.duration_min % 60)} min
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Total Distance</span>
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                  {typeof routeData.distance_km === 'number' ? `${routeData.distance_km.toFixed(1)} km` : routeData.distance_km}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] mb-3 px-1 text-neutral-500">
              <span className="flex items-center gap-1">
                {routeData.is_estimated ? '⚠️ Live routing unavailable, straight-line fallback' : '🛣️ In-app road-following OpenRouteService highway route'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const destLat = selectedDest ? Number(selectedDest.lat ?? selectedDest.latitude) : 0;
                  const destLng = selectedDest ? Number(selectedDest.lng ?? selectedDest.longitude) : 0;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
                }}
                className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                title="External fallback only"
              >
                <span>Google Maps ↗</span>
              </button>
              {selectedDest && (
                <button
                  onClick={() => navigate(`/destinations/${selectedDest.id}`)}
                  className="flex-1 bg-[#712B13] hover:bg-[#5C230F] text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  View Place Profile
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Right Split Panel: Full List View of Destinations */}
      {isListPanelOpen && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 lg:relative lg:w-96 bg-white dark:bg-[#1C1A17] border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full shadow-2xl z-30 transition-all duration-300">
          
          {/* List Panel Header */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#8C3618]" />
                <span>Destinations Catalog</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                {listFilterAnchor ? (
                  <span>Filtered to {listFilterAnchor.name} & nearby</span>
                ) : (
                  <span>Showing {listPanelDestinations.length} places</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {listFilterAnchor && (
                <button
                  onClick={() => setListFilterAnchor(null)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
              <button
                onClick={() => setIsListPanelOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="Close List Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {listPanelDestinations.map(d => {
              const isEss = isEssentialCategory(d.category, d.name);
              const catLower = String(d.category || '').toLowerCase();
              const nameLower = String(d.name || '').toLowerCase();
              const isHospital = catLower.includes('hospital') || catLower.includes('clinic') || nameLower.includes('hospital') || nameLower.includes('medical') || nameLower.includes('trauma');
              const isHotel = catLower.includes('hotel') || catLower.includes('resort') || catLower.includes('lodge') || nameLower.includes('hotel') || nameLower.includes('resort');
              const isHomestay = catLower.includes('homestay') || catLower.includes('stay') || catLower.includes('rent') || nameLower.includes('homestay') || nameLower.includes('cottage');
              const isRestaurant = catLower.includes('restaurant') || catLower.includes('cafe') || catLower.includes('dhaba') || nameLower.includes('restaurant') || nameLower.includes('kitchen') || nameLower.includes('dining');

              const descText = String(d.description || '');
              const phoneMatch = descText.match(/(?:phone|helpline|emergency|tel):\s*([+\d\s\-\/]{7,25})/i) || descText.match(/([+\d]{1,4}[- ]\d{2,4}[- ]\d{5,8})/);
              const rawPhone = phoneMatch ? phoneMatch[1].trim() : (isHospital ? '108' : null);
              const callPhone = rawPhone ? rawPhone.split('/')[0].trim().replace(/[^\d+]/g, '') : null;

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDest(d);
                    setListFilterAnchor(d);
                  }}
                  className={`pt-2.5 first:pt-0 cursor-pointer p-2.5 rounded-2xl transition-all ${
                    selectedDest?.id === d.id
                      ? 'bg-[#8C3618]/10 border border-[#8C3618]/30 shadow-xs'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                      {d.image ? (
                        <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#8C3618] text-white text-[10px] font-bold flex items-center justify-center">
                          {isHospital ? '🏥' : isHotel ? '🏨' : isHomestay ? '🏡' : isRestaurant ? '🍽️' : 'POI'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">{d.name}</h4>
                        {d.rating && (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 shrink-0">
                            ★ {d.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 truncate">{d.state} • {d.category}</p>
                      
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {isHospital && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            🏥 24/7 Hospital
                          </span>
                        )}
                        {isHotel && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            🏨 Hotel
                          </span>
                        )}
                        {isHomestay && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            🏡 Homestay
                          </span>
                        )}
                        {isRestaurant && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            🍽️ Dining
                          </span>
                        )}
                        {d.price_range && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            {d.price_range}
                          </span>
                        )}
                        {!isEss && d.isHiddenGem && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            🌿 Gem
                          </span>
                        )}
                        {!isEss && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            d.crowdLevel === 'Very Busy' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {d.crowdCapacityPct}% Crowd
                          </span>
                        )}
                      </div>

                      {descText && (
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                          {descText}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedDest?.id === d.id && (
                    <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
                      {callPhone && (
                        <a
                          href={`tel:${callPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`py-1 px-2.5 rounded-lg text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer no-underline ${
                            isHospital ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          title={`Call ${rawPhone}`}
                        >
                          <span>📞 Call</span>
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showRoute(d);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-[#712B13] text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Route</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/destinations/${d.id}`);
                        }}
                        className="py-1 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white text-[10px] font-bold cursor-pointer"
                      >
                        Profile
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
