import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export function useGeolocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingMode, setTrackingMode] = useState('off'); // 'off' | 'one_time' | 'live_navigation' | 'group_sharing' | 'trip_track'
  const [coordinates, setCoordinates] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [heading, setHeading] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [arrivalAlert, setArrivalAlert] = useState(null);

  const watchIdRef = useRef(null);
  const pingThrottleRef = useRef(0);

  // Check initial permission
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((res) => {
        setPermissionStatus(res.state);
        res.onchange = () => setPermissionStatus(res.state);
      }).catch(() => {});
    }
  }, []);

  const sendLocationPing = useCallback(async (pos, currentSessionId) => {
    const now = Date.now();
    // Throttle backend pings to once every 6 seconds to save battery and network
    if (now - pingThrottleRef.current < 6000) return;
    pingThrottleRef.current = now;

    // 1. Direct GPS ping to live location endpoint for real-time recommendation rows & geofence
    try {
      const liveRes = await axios.post('/api/location/ping', {
        user_id: 'usr-901',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      if (liveRes.data?.arrival_alert) {
        setArrivalAlert(liveRes.data.arrival_alert);
      }
    } catch {
      // Non-blocking live ping
    }

    // 2. High-precision session tracking if an ephemeral session is active
    if (!currentSessionId) return;

    try {
      const res = await axios.post('/api/recommendations/location-ping', {
        session_id: currentSessionId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy_meters: pos.coords.accuracy || 10.0,
        speed_mps: pos.coords.speed || null,
        heading_degrees: pos.coords.heading || null
      });

      if (res.data?.arrival_alert) {
        setArrivalAlert(res.data.arrival_alert);
      }
    } catch {
      // Non-blocking ping
    }
  }, []);

  const handlePositionSuccess = useCallback((pos, currentSessionId) => {
    setCoordinates({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    });
    setAccuracy(Math.round(pos.coords.accuracy || 10));
    setSpeed(pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : null); // km/h
    setHeading(pos.coords.heading !== null ? Math.round(pos.coords.heading) : null);
    setLastUpdated(new Date());
    setError(null);
    setPermissionStatus('granted');

    sendLocationPing(pos, currentSessionId);
  }, [sendLocationPing]);

  const handlePositionError = useCallback((err) => {
    let msg = 'Failed to get location.';
    if (err.code === 1) {
      msg = 'Location permission was denied. Enable GPS in browser settings.';
      setPermissionStatus('denied');
    } else if (err.code === 2) {
      msg = 'Location is unavailable. Check network or GPS signal.';
    } else if (err.code === 3) {
      msg = 'Location request timed out.';
    }
    setError(msg);
  }, []);

  // Request Single Position
  const requestOneTimePosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos, null);
        setTrackingMode('one_time');
      },
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [handlePositionSuccess, handlePositionError]);

  // Start Live Tracking with specific mode
  const startTracking = useCallback(async (mode = 'live_navigation', tripId = null) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    // 1. Create authenticated server session with hourly TTL
    let newSessionId = null;
    try {
      const res = await axios.post('/api/recommendations/location-session', {
        owner_user_id: 'usr-901',
        trip_id: tripId,
        sharing_mode: mode,
        allowed_members: []
      });
      newSessionId = res.data?.session_id;
      setSessionId(newSessionId);
    } catch {
      newSessionId = `local-${Date.now()}`;
      setSessionId(newSessionId);
    }

    // 2. Start HTML5 watchPosition
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePositionSuccess(pos, newSessionId),
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );

    setIsTracking(true);
    setTrackingMode(mode);
  }, [handlePositionSuccess, handlePositionError]);

  // Stop Tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setTrackingMode('off');
    setArrivalAlert(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    trackingMode,
    coordinates,
    accuracy,
    speed,
    heading,
    lastUpdated,
    permissionStatus,
    error,
    sessionId,
    arrivalAlert,
    dismissArrivalAlert: () => setArrivalAlert(null),
    startTracking,
    stopTracking,
    requestOneTimePosition
  };
}
