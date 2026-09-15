import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Hospital,
  MapPin,
  PhoneCall,
  Navigation,
  Search,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Locate,
  Clock,
  CheckCircle2,
  X,
  Stethoscope
} from 'lucide-react';
import Card from '../common/Card';
import InAppNavigationModal from '../common/InAppNavigationModal';
import { useApp } from '../../context/AppContext';

export interface HospitalItem {
  id: number | string;
  name: string;
  type: 'Hospital' | 'Clinic' | string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  emergency?: string | null;
  opening_hours?: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
  maps_url: string;
}

interface NearbyHospitalsProps {
  initialCoords?: { lat: number; lng: number };
  compact?: boolean;
  onSelectHospital?: (hospital: HospitalItem) => void;
}

export default function NearbyHospitals({
  initialCoords,
  compact = false,
  onSelectHospital
}: NearbyHospitalsProps) {
  const { setIsSosModalOpen } = useApp();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 28.6139, lng: 77.2090 } // Default: Central Delhi / fallback
  );
  const [locationName, setLocationName] = useState<string>('Detecting GPS location...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);

  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<HospitalItem | null>(null);
  const [showMap, setShowMap] = useState<boolean>(!compact);

  const [showAllHospitals, setShowAllHospitals] = useState<boolean>(false);

  // In-App Turn-by-Turn Navigation Modal State
  const [navModalOpen, setNavModalOpen] = useState<boolean>(false);
  const [navDestination, setNavDestination] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    category?: string;
  } | null>(null);

  const handleOpenNavigation = (h: HospitalItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNavDestination({
      name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      category: h.type || 'Hospital'
    });
    setNavModalOpen(true);
  };

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Expose global window handler so Leaflet marker popups can trigger in-app navigation
  useEffect(() => {
    (window as any).__openHospitalNav = (id: string | number) => {
      const found = hospitals.find((item) => String(item.id) === String(id));
      if (found) {
        handleOpenNavigation(found);
      }
    };
    return () => {
      delete (window as any).__openHospitalNav;
    };
  }, [hospitals]);

  // 1. Detect Realtime GPS Coordinates on mount
  const detectLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(5));
          const lng = Number(position.coords.longitude.toFixed(5));
          setCoords({ lat, lng });
          setLocationName(`GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          setGpsLocked(true);
          setIsLocating(false);
          fetchHospitals(lat, lng);
        },
        (err) => {
          console.warn('Geolocation failed or denied, using fallback coordinates:', err.message);
          setIsLocating(false);
          setGpsLocked(false);
          setLocationName('GPS offline (Standard Hub: 28.6139° N, 77.2090° E)');
          fetchHospitals(coords.lat, coords.lng);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      setGpsLocked(false);
      setLocationName('GPS not supported in browser');
      fetchHospitals(coords.lat, coords.lng);
    }
  };

  useEffect(() => {
    if (initialCoords) {
      setCoords(initialCoords);
      setGpsLocked(true);
      setLocationName(`GPS: ${initialCoords.lat.toFixed(4)}° N, ${initialCoords.lng.toFixed(4)}° E`);
      fetchHospitals(initialCoords.lat, initialCoords.lng);
    } else {
      detectLocation();
    }
  }, [initialCoords?.lat, initialCoords?.lng]);

  // 2. Fetch Nearby Hospitals from FastAPI backend
  const fetchHospitals = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/nearby-hospitals', {
        latitude: lat,
        longitude: lon,
        radius_m: 10000
      });

      if (res.data && Array.isArray(res.data.hospitals)) {
        setHospitals(res.data.hospitals);
      } else {
        setHospitals([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch nearby hospitals:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Hospital locator service is temporarily unavailable.';
      setError(errMsg);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Instant client-side keyword filter
  const filteredHospitals = useMemo(() => {
    if (!searchFilter.trim()) return hospitals;
    const q = searchFilter.toLowerCase().trim();
    return hospitals.filter((h) => {
      const matchName = h.name.toLowerCase().includes(q);
      const matchType = (h.type || '').toLowerCase().includes(q);
      const matchAddr = (h.address || '').toLowerCase().includes(q);
      return matchName || matchType || matchAddr;
    });
  }, [hospitals, searchFilter]);

  // Sliced hospital cards: 9 nearby by default, or all if toggled
  const displayedHospitals = useMemo(() => {
    if (showAllHospitals) return filteredHospitals;
    return filteredHospitals.slice(0, 9);
  }, [filteredHospitals, showAllHospitals]);

  // 4. Initialize & Update Leaflet Map (Crisp CartoDB Voyager road tiles, robust resize handling)
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    // Check if previous map instance was bound to a detached container
    if (leafletMapRef.current) {
      const existingContainer = leafletMapRef.current.getContainer();
      if (existingContainer !== mapContainerRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
      }
    }

    // Create map instance if not already initialized
    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // OpenStreetMap standard tiles: 100% free, no API key required, zero watermark
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // User location pulsing marker
    const userMarkerIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #1d4ed8; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(29,78,216,0.8);"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const userMarker = L.marker([coords.lat, coords.lng], { icon: userMarkerIcon }).addTo(markersLayer);
    userMarker.bindPopup('<b style="color:#1e3a8a;">Your Current Location</b><br/><span style="font-size:11px;color:#475569;">Emergency Search Origin (10 km radius)</span>');

    // Bounds to fit points
    const latLngs: L.LatLngExpression[] = [[coords.lat, coords.lng]];

    // Hospital / Clinic pins
    filteredHospitals.forEach((h) => {
      const isHospital = (h.type || '').toLowerCase() === 'hospital';
      const pinColor = isHospital ? '#dc2626' : '#0d9488';
      const pinLetter = isHospital ? 'H' : 'C';

      const hospitalIcon = L.divIcon({
        className: 'hospital-marker',
        html: `
          <div style="
            background: ${pinColor};
            color: #ffffff;
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.35);
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 13px; font-weight: 900; font-family: sans-serif;">${pinLetter}</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([h.latitude, h.longitude], { icon: hospitalIcon }).addTo(markersLayer);

      const popupHtml = `
        <div style="min-width: 190px; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <b style="color: #111827; font-size: 13px;">${h.name}</b>
          <div style="color: #6b7280; margin: 3px 0; font-size: 11px;">
            <span style="display:inline-block; padding: 1px 6px; border-radius: 4px; background: ${isHospital ? '#fee2e2' : '#ccfbf1'}; color: ${isHospital ? '#991b1b' : '#115e59'}; font-weight: bold;">${h.type}</span>
            • <b>${h.distance_km} km away</b>
          </div>
          ${h.address ? `<div style="font-size: 11px; color: #4b5563; margin-bottom: 4px;">${h.address}</div>` : ''}
          ${h.phone ? `<div style="margin: 4px 0;"><a href="tel:${h.phone}" style="color: #dc2626; font-weight: bold; text-decoration: none;">📞 ${h.phone}</a></div>` : ''}
          <div style="margin-top: 8px;">
            <button
              onclick="window.__openHospitalNav && window.__openHospitalNav('${h.id}')"
              style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #dc2626;
                color: #ffffff;
                border: none;
                cursor: pointer;
                padding: 5px 12px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 11px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              "
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              <span>In-App Navigation</span> ➔
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedHospital(h);
        if (onSelectHospital) onSelectHospital(h);
      });

      latLngs.push([h.latitude, h.longitude]);
    });

    if (latLngs.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [35, 35], maxZoom: 15 });
    } else {
      map.setView([coords.lat, coords.lng], 13);
    }

    // Staggered invalidateSize to ensure tiles load seamlessly without black voids
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 350);
    const t4 = setTimeout(() => map.invalidateSize(), 700);

    // Watch for parent container resizes
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [showMap, coords, filteredHospitals]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const handleCardClick = (h: HospitalItem) => {
    setSelectedHospital(h);
    if (onSelectHospital) onSelectHospital(h);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([h.latitude, h.longitude], 15, { animate: true });
    }
  };

  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
    }
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-xs' : ''}`}>
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Hospital className="w-5 h-5 text-semantic-sos" />
            <h3 className="text-lg sm:text-xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
              Nearest Hospitals & Clinics
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              10 km Radius
            </span>
          </div>
          <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary flex items-center gap-1.5 mt-0.5">
            <Locate className={`w-3.5 h-3.5 ${gpsLocked ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span>{locationName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={detectLocation}
            disabled={isLocating}
            title="Refresh GPS Location"
            className="btn-secondary !p-2 !text-xs flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-brand-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {!compact && (
            <button
              onClick={() => {
                setShowMap(!showMap);
                setTimeout(() => {
                  if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
                }, 100);
              }}
              className="btn-secondary !px-3 !py-1.5 !text-xs font-bold shrink-0"
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          )}
        </div>
      </div>

      {/* Filter search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter by hospital name, clinic, or street..."
          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-neutral-card dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Interactive Map view when enabled */}
      {showMap && (
        <div className="relative rounded-2xl overflow-hidden border border-neutral-border dark:border-darkmode-border shadow-md bg-slate-100 dark:bg-neutral-900">
          <div
            ref={mapContainerRef}
            style={{ height: '360px', minHeight: '300px', width: '100%', background: '#e2e8f0' }}
            className="w-full relative z-0"
          />

          {/* Floating Map Legend & Re-Center button */}
          <div className="absolute top-2 right-2 z-[400]">
            <button
              onClick={handleRecenter}
              title="Center on My GPS Location"
              className="bg-white/95 dark:bg-neutral-900/95 hover:bg-white dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center gap-1.5 transition-all"
            >
              <Locate className="w-3.5 h-3.5 text-blue-600" />
              <span>Center Me</span>
            </button>
          </div>

          <div className="absolute bottom-2 left-2 z-[400] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-bold border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-md">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300 inline-block"></span> You
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-300 inline-block"></span> Hospital
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-teal-300 inline-block"></span> Clinic
            </span>
          </div>
        </div>
      )}

      {/* Results Header with 9-limit toggle indicator */}
      {!loading && !error && hospitals.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-neutral-muted px-1 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Found <b>{filteredHospitals.length}</b> medical facilities within 10 km
              {searchFilter && ` (filtered from ${hospitals.length})`}
            </span>
            {filteredHospitals.length > 9 && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-darkmode-elevated font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-darkmode-border">
                Showing {displayedHospitals.length} of {filteredHospitals.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {filteredHospitals.length > 9 && (
              <button
                onClick={() => setShowAllHospitals(!showAllHospitals)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
              >
                {showAllHospitals ? 'Show Only 9 Nearby ▲' : `Show All (${filteredHospitals.length}) ▼`}
              </button>
            )}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Sorted by Proximity
            </span>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-neutral-200 dark:border-darkmode-border bg-white/50 dark:bg-darkmode-elevated animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12"></div>
              </div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State with SOS Fallback (Never Blank) */}
      {!loading && error && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/30 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Hospital Search Temporarily Unavailable
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-md mx-auto leading-relaxed">
              {error} — For immediate medical or travel emergencies, contact India's 24x7 Unified Emergency Helpline directly.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href="tel:112"
              className="btn-sos !px-4 !py-2 text-xs font-black flex items-center gap-1.5 shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Emergency 112</span>
            </a>
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="btn-secondary !px-4 !py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-semantic-sos" />
              <span>Trigger Platform SOS</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State with Inline SOS Fallback */}
      {!loading && !error && filteredHospitals.length === 0 && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              No hospitals found within 10 km
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 max-w-md mx-auto">
              {searchFilter
                ? `No results matching "${searchFilter}". Try clearing your search keyword.`
                : 'No open healthcare facilities registered in this sector within 10 km. If you are in distress, use Emergency SOS (112) immediately.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            {searchFilter ? (
              <button
                onClick={() => setSearchFilter('')}
                className="btn-secondary !px-3 !py-1.5 text-xs font-bold"
              >
                Clear Search Filter
              </button>
            ) : (
              <>
                <a
                  href="tel:112"
                  className="btn-sos !px-4 !py-2 text-xs font-black flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Emergency 112</span>
                </a>
                <button
                  onClick={() => setIsSosModalOpen(true)}
                  className="btn-secondary !px-4 !py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-semantic-sos" />
                  <span>Open Emergency SOS</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hospitals Card Grid (Limited to 9 Nearby by default, or all if toggled) */}
      {!loading && !error && displayedHospitals.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedHospitals.map((h) => {
              const isSelected = selectedHospital?.id === h.id;
              const isHospital = (h.type || '').toLowerCase() === 'hospital';

              return (
                <Card
                  key={h.id}
                  variant="default"
                  hover={true}
                  onClick={() => handleCardClick(h)}
                  className={`p-4 flex flex-col justify-between transition-all duration-200 border ${
                    isSelected
                      ? 'border-semantic-sos shadow-lg ring-2 ring-semantic-sos/20'
                      : 'border-neutral-200 dark:border-darkmode-border hover:border-semantic-sos/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Row: Name and Type Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-semantic-sos">
                        {h.name}
                      </h4>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isHospital
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                        }`}
                      >
                        {h.type}
                      </span>
                    </div>

                    {/* Distance & Emergency Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        <span>{h.distance_km} km away</span>
                      </span>

                      {h.emergency && (
                        <span className="text-[10px] font-extrabold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
                          24x7 Emergency
                        </span>
                      )}

                      {h.opening_hours && (
                        <span className="text-[10px] text-neutral-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{h.opening_hours}</span>
                        </span>
                      )}
                    </div>

                    {/* Address Snippet */}
                    {h.address && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {h.address}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Phone Link & Get Directions */}
                  <div className="pt-3 mt-3 border-t border-neutral-border dark:border-darkmode-border flex items-center justify-between gap-2">
                    {h.phone ? (
                      <a
                        href={`tel:${h.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 hover:underline"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                        <span>{h.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic">No phone listed</span>
                    )}

                    {/* In-App Turn-by-Turn Road Navigation Trigger */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenNavigation(h, e)}
                      className="btn-sos !px-3 !py-1.5 !text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                      title={`Navigate to ${h.name}`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Show All / Collapse to 9 Button */}
          {filteredHospitals.length > 9 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-neutral-border dark:border-darkmode-border">
              <button
                onClick={() => setShowAllHospitals(!showAllHospitals)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-darkmode-elevated dark:hover:bg-darkmode-surface text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-darkmode-border transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>
                  {showAllHospitals
                    ? '▲ Collapse to Top 9 Facilities'
                    : `▼ Show All ${filteredHospitals.length} Medical Facilities (${filteredHospitals.length - 9} More Nearby)`}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {/* In-App Turn-by-Turn Road Navigation Modal (Consistent with the entire application) */}
      <InAppNavigationModal
        isOpen={navModalOpen}
        onClose={() => setNavModalOpen(false)}
        destination={navDestination}
        origin={{
          name: locationName.startsWith('GPS') ? 'Current GPS Location' : 'Your Location',
          latitude: coords.lat,
          longitude: coords.lng,
          category: 'My Location'
        }}
      />
    </div>
  );
}
