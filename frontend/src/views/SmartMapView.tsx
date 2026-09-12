import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// India Geographic Bounding Box: [South-West, North-East]
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0],
  [35.5, 97.5]
];

// Coordinate validity helper strictly within India territory
function isWithinIndia(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5;
}

function escapeHtml(text: string): string {
  return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
        map.flyTo([targetLat, targetLng], 13, { duration: 1.2 });
        return;
      }

      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints.map(p => [Number(p.lat ?? p.latitude), Number(p.lng ?? p.longitude)]));
        if (bounds.isValid()) {
          // Dynamic fit: pad 10-15% around actual data extent, tightly auto-framing POIs
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

// Custom Teardrop Pin Generator (No permanent text pills — hover tooltip / click popup only)
function createTeardropPin(type: 'regular' | 'hidden-gem' | 'trip-stop' | 'crowd-warning') {
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

    // Initialize Leaflet MarkerClusterGroup with chunked loading for seamless high-performance rendering
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 20,
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16,
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

      let pinType: 'regular' | 'hidden-gem' | 'trip-stop' | 'crowd-warning' = 'regular';
      if (d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60)) {
        pinType = 'crowd-warning';
      } else if (d.isHiddenGem) {
        pinType = 'hidden-gem';
      } else if (d.isTripStop) {
        pinType = 'trip-stop';
      }

      const icon = createTeardropPin(pinType);
      const marker = L.marker([lat, lng], { icon });

      // 1. Tooltip on Hover ONLY (Never permanent text!)
      const safeName = escapeHtml(d.name);
      const safeState = escapeHtml(d.state || '');
      const safeCat = escapeHtml(d.category || '');

      marker.bindTooltip(`
        <div class="ts-map-tooltip">
          <div class="ts-tooltip-title">${safeName}</div>
          <div class="ts-tooltip-meta">${safeState} • ${safeCat}</div>
          ${d.isHiddenGem ? '<div class="ts-tooltip-gem" style="color:#059669; font-size:10px; font-weight:700; margin-top:2px;">🌿 Verified Hidden Gem</div>' : ''}
          ${(d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60)) ? `<div style="color:#D97706; font-size:10px; font-weight:700; margin-top:2px;">⚠️ High Tourist Footfall (${d.crowdCapacityPct}%)</div>` : ''}
        </div>
      `, {
        direction: 'top',
        offset: [0, -28],
        className: 'custom-map-tooltip-wrapper',
        opacity: 0.98
      });

      // 2. Popup on Click with Google-Maps Style Navigate action
      const imgHtml = (d.image && d.image_source !== 'placeholder' && !d.needs_manual_photo)
        ? `<img src="${d.image}" alt="${safeName}" style="width:100%; height:88px; object-fit:cover; border-radius:10px; margin-bottom:6px;" />`
        : `<div style="width:100%; height:70px; background:linear-gradient(135deg, #8C3618 0%, #C97227 100%); border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-align:center; padding:6px; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:700;">${safeName}</span>
            <span style="font-size:9px; opacity:0.85;">${safeState}</span>
           </div>`;

      marker.bindPopup(`
        <div style="padding:2px; max-width:220px; font-family:Inter,sans-serif;">
          ${imgHtml}
          <div>
            <span style="font-weight:700; font-size:13px; color:#111827; display:block; line-height:1.2;">${safeName}</span>
            <p style="color:#6B7280; font-size:10px; margin:2px 0 6px 0;">${safeState} • ${safeCat}</p>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; padding-top:4px; border-top:1px solid #F3F4F6;">
            <span style="font-weight:700; color:${d.isHiddenGem ? '#059669' : ((d.crowdCapacityPct && d.crowdCapacityPct > 60) ? '#D97706' : '#2563EB')}; font-size:10px;">
              ${d.isHiddenGem ? `🌿 Hidden Gem (${d.crowdCapacityPct}%)` : ((d.crowdCapacityPct && d.crowdCapacityPct > 60) ? `⚠️ High Congestion (${d.crowdCapacityPct}%)` : `${d.crowdLevel || 'Moderate'} Density`)}
            </span>
            <a href="#/destinations/${d.id}" style="color:#8C3618; font-weight:700; font-size:11px; text-decoration:none;">
              Details →
            </a>
          </div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button class="ts-popup-nav-btn" data-dest-id="${d.id}" style="flex:1; background:#712B13; color:#fff; font-size:10px; font-weight:700; padding:6px 8px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
              <span>🧭 Route Preview</span>
            </button>
            <button class="ts-popup-gmaps-btn" data-lat="${lat}" data-lng="${lng}" style="background:#2563EB; color:#fff; font-size:10px; font-weight:700; padding:6px 8px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:2px;" title="Start turn-by-turn in Google Maps">
              <span>Google Maps ↗</span>
            </button>
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



    // Popup event listener for Route Preview and Google Maps buttons
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
      map.removeLayer(clusterGroup);
    };
  }, [map, destinations, onSelectDest, onNavigate]);

  return null;
}

export default function SmartMapView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { destinations: fallbackDestinations, activeTrip } = useApp();

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
  const [activeLayer, setActiveLayer] = useState<'all' | 'gems' | 'crowd' | 'route'>('all');
  const [selectedDest, setSelectedDest] = useState<any>(null);
  const [autoFitKey, setAutoFitKey] = useState<number>(0);
  const [hourlyToken, setHourlyToken] = useState<string | null>(null);

  // Live Location & Road Routing state (strictly starts null — no floating point in Pakistan/Afghanistan)
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [hasLiveGps, setHasLiveGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeBounds, setRouteBounds] = useState<L.LatLngBounds | null>(null);

  // Explicit geolocation trigger
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
          // Ping backend live_locations
          axios.post('/api/location/ping', {
            user_id: 'live-traveler',
            latitude: lat,
            longitude: lng
          }).catch(() => {});
        } else {
          console.warn('Geolocation coordinates outside India bounding box:', lat, lng);
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

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Real "Navigate" (Google-Maps Style): In-app route preview + bottom card
  const showRoute = useCallback(async (dest: any) => {
    const destLat = Number(dest.lat ?? dest.latitude);
    const destLng = Number(dest.lng ?? dest.longitude);
    if (isNaN(destLat) || isNaN(destLng)) return;

    setSelectedDest(dest);
    setRouteLoading(true);

    // Fallback origin: User GPS if available within India, else Delhi traveler hub
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

  // Synchronize when URL search param changes
  useEffect(() => {
    if (queryFromUrl !== activeQuery) {
      setSearchQuery(queryFromUrl);
      setActiveQuery(queryFromUrl);
    }
  }, [queryFromUrl, activeQuery]);

  // Active Trip Stops Set for Route Layer
  const tripStopIds = useMemo(() => {
    return new Set((activeTrip?.schedule || []).map((s: any) => s.destinationId || s.id));
  }, [activeTrip]);

  // Fetch map points strictly matching search query or all 12,293 India POIs
  useEffect(() => {
    setLoading(true);
    setSearchNotFound(null);
    const q = activeQuery.trim();

    if (q) {
      // 1. Search must actually drive the map: Query map-points or destinations catalog
      axios.get(`/api/destinations/map-points?q=${encodeURIComponent(q)}&limit=500`)
        .then(res => {
          const points = res.data?.points || [];
          if (!points.length) {
            // Fallback to catalog search endpoint
            return axios.get(`/api/destinations?query=${encodeURIComponent(q)}&limit=100`)
              .then(catRes => {
                const results = catRes.data?.results || [];
                return results.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  state: p.state,
                  lat: Number(p.latitude ?? p.lat),
                  lng: Number(p.longitude ?? p.lng),
                  category: p.category || 'Sightseeing',
                  rating: p.rating,
                  reviewCount: p.review_count,
                  isHiddenGem: !!p.is_hidden_gem,
                  isTripStop: tripStopIds.has(p.id),
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
              lat: Number(p.lat ?? p.latitude),
              lng: Number(p.lng ?? p.longitude),
              category: p.category || 'Sightseeing',
              rating: p.rating,
              isHiddenGem: !!p.is_hidden_gem,
              isTripStop: tripStopIds.has(p.id),
              crowdLevel: rawCrowd > 0.7 ? 'Very Busy' : (rawCrowd > 0.4 ? 'Moderate' : 'Low'),
              crowdCapacityPct: Math.round(rawCrowd * 100),
              crowdStatus: rawCrowd > 0.7 ? 'High Tourist Footfall - Consider Morning Hours' : 'Comfortable Density & Peaceful Surroundings',
              image: p.image_url || p.image || null,
              image_source: p.image_source || 'placeholder',
              needs_manual_photo: !!p.needs_manual_photo
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
      // Nationwide points across all cities & states in India (all 12,293 verified destinations!)
      axios.get('/api/destinations/map-points?limit=15000')
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
                lat: Number(p.latitude ?? p.lat),
                lng: Number(p.longitude ?? p.lng),
                category: p.category || 'Sightseeing',
                rating: p.rating,
                isHiddenGem: !!p.is_hidden_gem,
                isTripStop: tripStopIds.has(p.id),
                crowdLevel: rawCrowd > 0.60 ? 'Very Busy' : (rawCrowd > 0.38 ? 'Moderate' : 'Low'),
                crowdCapacityPct: Math.round(rawCrowd * 100),
                crowdStatus: rawCrowd > 0.60 ? 'High Tourist Footfall - Consider Morning Hours' : (p.is_hidden_gem ? 'Peaceful & Low Tourist Density' : 'Comfortable Density & Steady Footfall'),
                image: p.image_url || p.image || null,
                image_source: p.image_source || 'placeholder',
                needs_manual_photo: !!p.needs_manual_photo
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
  }, [activeQuery, fallbackDestinations, tripStopIds]);


  // Client-side layer filtering: actually reduces rendered marker count!
  const displayDestinations = useMemo(() => {
    return mapPoints.filter(d => {
      const lat = Number(d.lat ?? d.latitude);
      const lng = Number(d.lng ?? d.longitude);
      if (!isWithinIndia(lat, lng)) return false;

      if (activeLayer === 'gems') return Boolean(d.isHiddenGem);
      if (activeLayer === 'crowd') return d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60);
      if (activeLayer === 'route') return tripStopIds.has(d.id);
      return true;
    });
  }, [mapPoints, activeLayer, tripStopIds]);

  // When activeLayer changes, re-trigger fit to tightly match filtered POI bounds
  useEffect(() => {
    setAutoFitKey(prev => prev + 1);
  }, [activeLayer]);

  // Counts for layer badges
  const layerCounts = useMemo(() => {
    let gems = 0;
    let crowd = 0;
    let route = 0;
    mapPoints.forEach(d => {
      if (d.isHiddenGem) gems++;
      if (d.crowdLevel === 'Very Busy' || (d.crowdCapacityPct && d.crowdCapacityPct > 60)) crowd++;
      if (tripStopIds.has(d.id)) route++;
    });
    return { all: mapPoints.length, gems, crowd, route };
  }, [mapPoints, tripStopIds]);

  // Dynamic Route Polyline Coordinates constructed from active trip stops
  const routeCoordinates = useMemo(() => {
    return (activeTrip?.schedule || [])
      .filter((s: any) => s.latitude && s.longitude && isWithinIndia(Number(s.latitude), Number(s.longitude)))
      .map((s: any) => [Number(s.latitude), Number(s.longitude)] as [number, number]);
  }, [activeTrip]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setActiveQuery(q);
    setRouteData(null);
    setRouteBounds(null);
    if (q) {
      setSearchParams({ q });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
    setSearchNotFound(null);
    setRouteData(null);
    setRouteBounds(null);
    setSearchParams({});
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] relative overflow-hidden">
      
      {/* Top Floating Map Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        
        {/* Interactive Search Bar & Active Filter Tag */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pointer-events-auto">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl px-3 py-1.5 shadow-xl w-72 sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search town, city or place (e.g. Manali, Ooty)..."
              className="bg-transparent text-xs w-full text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none font-medium"
            />
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

          {/* Active Filter Pill */}
          {activeQuery && (
            <div className="bg-[#8C3618] text-white border border-[#A44320] rounded-full px-3 py-1 shadow-md flex items-center gap-2 text-xs font-semibold animate-fadeIn">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Only "{activeQuery}" ({displayDestinations.length} places)</span>
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

        {/* Layer Filters Pills + Locate Me Button */}
        <div className="pointer-events-auto bg-white/95 dark:bg-[#1C1A17]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 shadow-xl flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeLayer === 'all'
                ? 'bg-[#8C3618] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-[#8C3618]'
            }`}
          >
            {activeQuery ? `All in ${activeQuery}` : `All Places (${layerCounts.all})`}
          </button>

          <button
            onClick={() => setActiveLayer('gems')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayer === 'gems'
                ? 'bg-[#2E6038] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-[#2E6038]'
            }`}
          >
            <span>🌿 Hidden Gems ({layerCounts.gems})</span>
          </button>

          <button
            onClick={() => setActiveLayer('crowd')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayer === 'crowd'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-600'
            }`}
          >
            <span>⚠️ Crowd Warnings ({layerCounts.crowd})</span>
          </button>

          {routeCoordinates.length > 0 && (
            <button
              onClick={() => setActiveLayer('route')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeLayer === 'route'
                  ? 'bg-[#C97227] text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#C97227]'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Trip Route ({routeCoordinates.length})</span>
            </button>
          )}

          {hourlyToken && (
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold select-none cursor-default"
              title={`Hourly Token: ${hourlyToken} — Live Telemetry & Carrying Capacity ML Active`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Hourly Token Active</span>
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
            <span className="hidden sm:inline">{hasLiveGps ? 'GPS Active' : 'Locate Me'}</span>
          </button>
        </div>

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
          maxBounds={[[4.0, 65.0], [38.0, 100.0]]}
          minZoom={4}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Smooth camera auto-centering controller strictly framed to actual marker bounds */}
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

          {/* Dynamic Active Trip Route Polyline */}
          {routeCoordinates.length > 1 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: '#C97227', weight: 4, opacity: 0.85, dashArray: '8, 8' }}
            />
          )}

          {/* User Live Location Marker (ONLY rendered when valid and inside India territory) */}
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

          {/* Real Road Route Polyline from User Location to Selected Destination (Theme 1 Terracotta #712B13, weight 5) */}
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

          {/* Clustered Destination Markers (Numbered bubbles at low zoom; Teardrop pins on zoom in) */}
          <ClusterGroupLayer
            destinations={displayDestinations}
            onSelectDest={(d) => setSelectedDest(d)}
            onNavigate={(d) => showRoute(d)}
          />
        </MapContainer>
      </div>

      {/* Google-Maps-Style Route Summary Card Dock */}
      {routeData && (
        <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-30 sm:w-[380px] bg-white/95 dark:bg-[#1C1A17]/95 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-4 animate-slideUp backdrop-blur-md">
          {/* Route Header */}
          <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#712B13] text-white flex items-center justify-center font-bold shadow-sm">
                <Navigation className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                  Route to {selectedDest?.name || 'Destination'}
                </h4>
                <p className="text-[11px] text-neutral-500">
                  {selectedDest?.state ? `${selectedDest.state} • ` : ''}{routeData.is_estimated ? 'Direct Line Estimate' : 'Road Highway Path'}
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

          {/* Route Metrics */}
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

          {/* Route Status Note */}
          <div className="flex items-center justify-between text-[11px] mb-3 px-1 text-neutral-500">
            <span className="flex items-center gap-1">
              {routeData.is_estimated ? '⚠️ Live routing unavailable, straight-line distance' : '🛣️ Real road-following highway route'}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {routeData.provider || 'OSRM Live'}
            </span>
          </div>

          {/* Actions: Start Navigation in Google Maps */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const destLat = selectedDest ? Number(selectedDest.lat ?? selectedDest.latitude) : 0;
                const destLng = selectedDest ? Number(selectedDest.lng ?? selectedDest.longitude) : 0;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
              }}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 fill-white" />
              <span>Start navigation</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </button>
            {selectedDest && (
              <button
                onClick={() => navigate(`/destinations/${selectedDest.id}`)}
                className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                View Place
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Destination Drawer / Bottom Sheet (when no active route summary shown) */}
      {selectedDest && !routeData && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 sm:w-96 bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#8C3618] dark:text-amber-400">{selectedDest.category}</span>
                {selectedDest.isHiddenGem && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    🌿 Hidden Gem
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                {selectedDest.name}
              </h3>
              <p className="text-xs text-neutral-500">{selectedDest.state}</p>
            </div>
            <button
              onClick={() => setSelectedDest(null)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 text-xs space-y-1 border border-neutral-100 dark:border-neutral-800">
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-500">Visitor Density:</span>
              <span className={selectedDest.crowdLevel === 'Low' ? 'text-emerald-600' : 'text-amber-600'}>
                {selectedDest.crowdLevel} ({selectedDest.crowdCapacityPct}%)
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              {selectedDest.crowdStatus}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => showRoute(selectedDest)}
              disabled={routeLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-[#712B13] hover:bg-[#5C230F] text-white text-xs font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {routeLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5 fill-white" />
              )}
              <span>Navigate</span>
            </button>
            <button
              onClick={() => navigate(`/destinations/${selectedDest.id}`)}
              className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-bold text-center cursor-pointer transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => navigate('/plan', { state: { prefilledDestination: `${selectedDest.name}, ${selectedDest.state}`, prefilledState: selectedDest.state } })}
              className="px-3 py-2 rounded-xl bg-[#C97227] hover:bg-[#B3601E] text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Plan Trip
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
