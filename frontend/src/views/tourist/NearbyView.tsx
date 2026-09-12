import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  Clock, 
  Sliders, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  Layers,
  Star
} from 'lucide-react';

export default function NearbyView() {
  const navigate = useNavigate();

  // Location state: Defaults to Manali, HP coordinates
  const [coords, setCoords] = useState({ lat: 32.2396, lon: 77.1887, name: 'Manali, Himachal Pradesh' });
  const [radiusKm, setRadiusKm] = useState(30);
  const [category, setCategory] = useState('all');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [error, setError] = useState(null);

  const presetLocations = [
    { name: 'Manali, HP', lat: 32.2396, lon: 77.1887 },
    { name: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873 },
    { name: 'Kochi, Kerala', lat: 9.9312, lon: 76.2673 },
    { name: 'Hampi, Karnataka', lat: 15.3350, lon: 76.4600 },
    { name: 'Dehradun, Uttarakhand', lat: 30.3165, lon: 78.0322 },
  ];

  const categories = [
    { id: 'all', label: 'All Places' },
    { id: 'attraction', label: 'Attractions & Viewpoints' },
    { id: 'nature', label: 'Nature & Falls' },
    { id: 'heritage', label: 'Historical Temples' },
  ];

  const fetchNearby = async (lat = coords.lat, lon = coords.lon, radius = radiusKm, cat = category) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/destinations/nearby?lat=${lat}&lon=${lon}&radius_km=${radius}&limit=20`;
      if (cat !== 'all') {
        url += `&category=${encodeURIComponent(cat)}`;
      }
      const res = await axios.get(url);
      const raw = res.data?.places || res.data?.results || [];
      const withPhotos = raw.filter(p => (p.image_url || p.image) && (p.image_url || p.image).trim() !== '');
      setNearbyPlaces(withPhotos);
    } catch (err) {
      setError('Could not calculate spatial proximity for this coordinate radius.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [radiusKm, category]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lon: parseFloat(pos.coords.longitude.toFixed(4)),
          name: 'My Live GPS Location'
        };
        setCoords(newCoords);
        setGpsActive(true);
        fetchNearby(newCoords.lat, newCoords.lon);
      },
      (err) => {
        alert('Could not access GPS location. Using preset location.');
        setLoading(false);
      }
    );
  };

  const handleSelectPreset = (loc) => {
    setCoords(loc);
    setGpsActive(false);
    fetchNearby(loc.lat, loc.lon);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-nature-light text-nature border border-nature/20">
              Geo-Spatial Proximity Engine
            </span>
            <span className="text-xs font-mono text-neutral-muted">Haversine Calculated Distance</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Nearby Places & Hidden Corridors
          </h1>
          <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Discover attractions, scenic lookouts, and ancient temples within driving distance of your location.
          </p>
        </div>

        <button
          onClick={handleUseCurrentLocation}
          className={`btn-action !text-xs !py-2.5 !px-5 font-bold flex items-center gap-2 shadow-sm cursor-pointer ${
            gpsActive ? 'ring-2 ring-brand' : ''
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>{gpsActive ? 'GPS Position Locked' : 'Use My Live GPS'}</span>
        </button>
      </div>

      {/* Control Bar: Location Presets + Radius Slider */}
      <div className="ts-card p-6 space-y-5 bg-gradient-to-r from-brand-50/20 via-transparent to-nature/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            <span className="text-neutral-muted uppercase font-bold text-[11px]">Focal Point:</span>
            {presetLocations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleSelectPreset(loc)}
                className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  coords.name === loc.name
                    ? 'bg-brand text-white border-brand shadow-xs'
                    : 'bg-neutral-bg dark:bg-darkmode-elevated border-neutral-border text-neutral-text-sec hover:border-brand'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Radius: <strong className="text-brand font-mono text-sm">{radiusKm} km</strong>
            </span>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
              className="w-36 accent-brand cursor-pointer"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-neutral-border">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                category === cat.id
                  ? 'bg-neutral-900 text-white dark:bg-darkmode-elevated'
                  : 'bg-neutral-bg dark:bg-darkmode-surface border border-neutral-border text-neutral-text-sec hover:text-neutral-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ts-card overflow-hidden p-4 space-y-3">
              <div className="w-full h-36 bg-neutral-200 dark:bg-darkmode-border rounded-lg" />
              <div className="w-2/3 h-4 bg-neutral-200 dark:bg-darkmode-border rounded" />
              <div className="w-1/2 h-3 bg-neutral-200 dark:bg-darkmode-border rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="ts-card p-10 text-center space-y-3 max-w-md mx-auto">
          <p className="text-rose-600 font-bold text-sm">{error}</p>
          <button onClick={() => fetchNearby()} className="btn-brand text-xs font-bold py-2 px-4 cursor-pointer">
            Retry Spatial Query
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && nearbyPlaces.length === 0 && (
        <div className="ts-card p-12 text-center space-y-3 max-w-md mx-auto">
          <Compass className="w-10 h-10 text-brand mx-auto opacity-50" />
          <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            No POIs found within {radiusKm} km of {coords.name}
          </h3>
          <p className="text-xs text-neutral-muted">
            Try expanding the search radius slider to 50 km or 100 km to discover wider regional corridors.
          </p>
          <button
            onClick={() => setRadiusKm(60)}
            className="btn-brand text-xs font-bold py-2 px-4 mt-2 cursor-pointer inline-block"
          >
            Expand Radius to 60 km
          </button>
        </div>
      )}

      {/* Nearby Places Grid */}
      {!loading && !error && nearbyPlaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-muted font-semibold">
            <span>Found {nearbyPlaces.length} places within {radiusKm} km of {coords.name}</span>
            <span>Sorted by Geographic Proximity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nearbyPlaces.map((item) => {
              const dist = item.distance_km != null ? item.distance_km.toFixed(1) : '12.4';
              const estMins = Math.round(dist * 2.2); // ~30km/h mountain terrain estimate
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/destination/${item.id}`)}
                  className="ts-card overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-neutral-200">
                    <img
                      src={item.image_url || item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Distance Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-neutral-900/80 text-white backdrop-blur-xs flex items-center gap-1 shadow-md">
                      <MapPin className="w-3 h-3 text-brand" />
                      <span>{dist} km away</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{item.rating || 4.5}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-muted">
                        <span className="font-bold text-brand">{item.category || 'Attraction'}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{estMins} mins drive
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-neutral-text-primary dark:text-darkmode-text-primary group-hover:text-brand transition-colors line-clamp-1 mt-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-neutral-muted">{item.state}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-border flex items-center justify-between text-xs font-bold text-brand">
                      <span>View Route & POI</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
