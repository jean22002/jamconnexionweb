import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import { MapPin, Navigation, Music, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import 'leaflet/dist/leaflet.css';

const API = process.env.REACT_APP_BACKEND_URL;

// Custom marker icons
const venueIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxMCIgZmlsbD0iIzM4OTVmNyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// Component to handle map centering
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function VenueMap({ className = '' }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]); // France center
  const [mapZoom, setMapZoom] = useState(6);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchVenues();
    requestUserLocation();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data } = await axios.get(`${API}/api/venues/map/locations`);
      setVenues(data);
      
      // Center on first venue if available
      if (data.length > 0) {
        setMapCenter([data[0].latitude, data[0].longitude]);
        setMapZoom(8);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
        },
        (error) => {
          console.log('Geolocation denied or unavailable:', error);
        }
      );
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getVenueDistance = (venue) => {
    if (!userLocation) return null;
    return calculateDistance(
      userLocation[0],
      userLocation[1],
      venue.latitude,
      venue.longitude
    );
  };

  const filteredVenues = venues.filter(venue => {
    if (filter === 'all') return true;
    if (filter === 'nearby') {
      const distance = getVenueDistance(venue);
      return distance && distance < 20; // Within 20km
    }
    return venue.venue_type === filter;
  });

  const centerOnVenue = (venue) => {
    setMapCenter([venue.latitude, venue.longitude]);
    setMapZoom(15);
    setSelectedVenue(venue);
  };

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-background/50 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Filters */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2 flex-wrap max-w-md">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'secondary'}
          onClick={() => setFilter('all')}
          className="glassmorphism"
        >
          Tous ({venues.length})
        </Button>
        {userLocation && (
          <Button
            size="sm"
            variant={filter === 'nearby' ? 'default' : 'secondary'}
            onClick={() => setFilter('nearby')}
            className="glassmorphism"
          >
            <Navigation className="w-3 h-3 mr-1" />
            Près de moi
          </Button>
        )}
        <Button
          size="sm"
          variant={filter === 'bar' ? 'default' : 'secondary'}
          onClick={() => setFilter('bar')}
          className="glassmorphism"
        >
          Bars
        </Button>
        <Button
          size="sm"
          variant={filter === 'concert_hall' ? 'default' : 'secondary'}
          onClick={() => setFilter('concert_hall')}
          className="glassmorphism"
        >
          Salles
        </Button>
      </div>

      {/* Geolocation button */}
      {!userLocation && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Button
            size="sm"
            onClick={requestUserLocation}
            className="glassmorphism"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Me localiser
          </Button>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-[600px] rounded-2xl overflow-hidden border border-white/10"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Vous êtes ici</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Venue markers */}
        {filteredVenues.map((venue) => (
          <Marker
            key={venue.id}
            position={[venue.latitude, venue.longitude]}
            icon={venueIcon}
            eventHandlers={{
              click: () => setSelectedVenue(venue)
            }}
          >
            <Popup>
              <div className="min-w-[250px]">
                <div className="flex items-start gap-3 mb-2">
                  {venue.profile_image ? (
                    <img
                      src={venue.profile_image}
                      alt={venue.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Music className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{venue.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {venue.city} {venue.postal_code}
                    </p>
                  </div>
                </div>

                {venue.music_styles && venue.music_styles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {venue.music_styles.slice(0, 3).map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}

                {userLocation && (
                  <p className="text-xs text-muted-foreground mb-2">
                    📍 {getVenueDistance(venue)?.toFixed(1)} km
                  </p>
                )}

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => window.location.href = `/venue/${venue.id}`}
                >
                  Voir le profil
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Selected venue card (mobile friendly) */}
      {selectedVenue && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[1000]">
          <div className="glassmorphism rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-3">
              {selectedVenue.profile_image ? (
                <img
                  src={selectedVenue.profile_image}
                  alt={selectedVenue.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Music className="w-8 h-8 text-primary" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{selectedVenue.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" />
                  {selectedVenue.city}
                </p>
                
                <Button
                  size="sm"
                  onClick={() => window.location.href = `/venue/${selectedVenue.id}`}
                >
                  Voir le profil
                </Button>
              </div>
              
              <button
                onClick={() => setSelectedVenue(null)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
