import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { buildImageUrl } from '../../utils/urlBuilder';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useVenuesMap = () => {
  const [venues, setVenues] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [searchingCity, setSearchingCity] = useState(false);
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]); // France center
  const [userHasMovedMap, setUserHasMovedMap] = useState(false);
  const [searchRadius, setSearchRadius] = useState(25); // km
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const fetchVenuesAndMusicians = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    console.log('[useVenuesMap] fetchData called (attempt', retryCount + 1, '/', MAX_RETRIES + 1, ')');
    
    try {
      // Load venues (critical for map display)
      const venuesRes = await axios.get(`${API}/venues`, { timeout: 10000 });
      console.log('[useVenuesMap] Venues loaded successfully. Count:', venuesRes.data.length);
      
      if (Array.isArray(venuesRes.data)) {
        const venuesWithUrls = venuesRes.data.map(venue => ({
          ...venue,
          profile_image: venue.profile_image ? buildImageUrl(venue.profile_image) : null,
          cover_image: venue.cover_image ? buildImageUrl(venue.cover_image) : null
        }));
        setVenues(venuesWithUrls);
      } else {
        console.error('[useVenuesMap] Venues data is not an array');
        setVenues([]);
      }
      
      // Load musicians separately (non-critical)
      try {
        const musiciansRes = await axios.get(`${API}/musicians`, { timeout: 10000 });
        console.log('[useVenuesMap] Musicians loaded successfully. Count:', musiciansRes.data.length);
        
        if (Array.isArray(musiciansRes.data)) {
          const musiciansWithUrls = musiciansRes.data.map(musician => ({
            ...musician,
            profile_image: musician.profile_image ? buildImageUrl(musician.profile_image) : null,
            cover_image: musician.cover_image ? buildImageUrl(musician.cover_image) : null
          }));
          setMusicians(musiciansWithUrls);
        } else {
          setMusicians([]);
        }
      } catch (musiciansError) {
        console.warn('[useVenuesMap] Failed to load musicians (non-critical):', musiciansError.message);
        setMusicians([]);
      }
      
      setLoadingError(false);
      setLoading(false);
    } catch (error) {
      console.error("[useVenuesMap] Error fetching venues (attempt", retryCount + 1, "):", error);
      
      // Retry logic for network errors and 520
      if (retryCount < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.response?.status === 520 || error.message === 'Network Error')) {
        console.log('[useVenuesMap] Retrying in 2 seconds...');
        setTimeout(() => {
          fetchVenuesAndMusicians(retryCount + 1);
        }, 2000);
      } else {
        console.error('[useVenuesMap] All retries failed');
        toast.error("Erreur de chargement des établissements. Veuillez rafraîchir la page.");
        setLoadingError(true);
        setLoading(false);
      }
    }
  }, []);

  const searchCity = async () => {
    if (!searchCity.trim()) return;
    
    setSearchingCity(true);
    try {
      // Use Nominatim API to geocode the city
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: searchCity,
          format: 'json',
          limit: 1,
          countrycodes: 'fr'
        }
      });
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        setMapCenter([lat, lon]);
        setUserHasMovedMap(false);
        
        toast.success(`Carte centrée sur ${result.display_name.split(',')[0]}`);
      } else {
        toast.error(`Ville "${searchCity}" non trouvée`);
      }
    } catch (error) {
      console.error("Error searching city:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setSearchingCity(false);
    }
  };

  const handleMapMove = () => {
    setUserHasMovedMap(true);
  };

  return {
    venues,
    musicians,
    loading,
    loadingError,
    searchCity,
    setSearchCity,
    searchingCity,
    mapCenter,
    setMapCenter,
    userHasMovedMap,
    setUserHasMovedMap,
    searchRadius,
    setSearchRadius,
    showRadiusCircle,
    setShowRadiusCircle,
    nearbyVenues,
    setNearbyVenues,
    selectedRegion,
    setSelectedRegion,
    selectedDepartment,
    setSelectedDepartment,
    fetchVenuesAndMusicians,
    searchCity: searchCity,
    handleMapMove
  };
};
