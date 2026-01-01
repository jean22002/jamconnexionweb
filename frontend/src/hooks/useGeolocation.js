import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000, // Cache position for 30 seconds
};

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef(null);
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });

  // Get current position once
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setPosition(newPosition);
          setIsLoading(false);
          resolve(newPosition);
        },
        (err) => {
          let errorMessage;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Accès à la localisation refusé. Veuillez autoriser l\'accès dans les paramètres.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Position indisponible. Vérifiez votre connexion GPS.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Délai d\'attente dépassé pour obtenir la position.';
              break;
            default:
              errorMessage = 'Erreur de géolocalisation inconnue.';
          }
          setError(errorMessage);
          setIsLoading(false);
          reject(new Error(errorMessage));
        },
        optionsRef.current
      );
    });
  }, []);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already tracking
    }

    setIsTracking(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setPosition(newPosition);
        setIsLoading(false);
      },
      (err) => {
        let errorMessage;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Délai dépassé.';
            break;
          default:
            errorMessage = 'Erreur de géolocalisation.';
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      optionsRef.current
    );
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    isTracking,
    isLoading,
    getCurrentPosition,
    startTracking,
    stopTracking,
  };
}

export function useAutoGeolocation(enabled = true, onPositionChange = null) {
  const { position, error, isTracking, isLoading, getCurrentPosition, startTracking, stopTracking } = useGeolocation();
  const onPositionChangeRef = useRef(onPositionChange);
  const lastPositionRef = useRef(null);

  // Update callback ref
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  // Auto-start tracking when enabled
  useEffect(() => {
    if (enabled) {
      // First get current position, then start tracking
      getCurrentPosition().then(() => {
        startTracking();
      }).catch(() => {
        // If getCurrentPosition fails, still try to start tracking
        startTracking();
      });
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, getCurrentPosition, startTracking, stopTracking]);

  // Call onPositionChange when position changes significantly (> 100m)
  useEffect(() => {
    if (position && onPositionChangeRef.current) {
      const lastPos = lastPositionRef.current;
      
      if (!lastPos) {
        // First position
        lastPositionRef.current = position;
        onPositionChangeRef.current(position);
      } else {
        // Calculate distance
        const distance = calculateDistance(
          lastPos.latitude, lastPos.longitude,
          position.latitude, position.longitude
        );
        
        // Only trigger if moved more than 100 meters
        if (distance > 0.1) {
          lastPositionRef.current = position;
          onPositionChangeRef.current(position);
        }
      }
    }
  }, [position]);

  return {
    position,
    error,
    isTracking,
    isLoading,
    getCurrentPosition,
    startTracking,
    stopTracking,
  };
}

// Calculate distance between two points in km (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
