import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Slider } from "../../../components/ui/slider";
import LazyImage from "../../../components/LazyImage";
import { Radio, MapPinOff, Locate, Search, Loader2, X, MapPin, Music, ChevronDown, ChevronUp } from "lucide-react";

// Component to detect manual map movements (drag, zoom)
function MapEventHandler({ onMapMove }) {
  const map = useMapEvents({
    moveend: () => {
      onMapMove();
    },
    zoomend: () => {
      onMapMove();
    }
  });
  return null;
}

// Custom guitar icon for venues
const venueIcon = L.divIcon({
  className: 'venue-guitar-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; border: 2px solid white;">
        <span style="font-size: 18px;">🎸</span>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Animated user marker for real-time tracking
const userPulseIcon = L.divIcon({
  className: 'user-pulse-marker',
  html: `
    <div class="relative">
      <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div class="absolute inset-0 w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-75"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function SetViewOnLocation({ coords, zoom = 12, enabled = true }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && coords) map.setView(coords, zoom);
  }, [coords, map, zoom, enabled]);
  return null;
}

// Component to follow user in real-time
function FollowUser({ position, enabled }) {
  const map = useMap();
  
  useEffect(() => {
    if (enabled && position) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, enabled, map]);
  
  return null;
}

export default function MapTab({
  venues,
  loading,
  loadingError,
  geoPosition,
  geoEnabled,
  geoLoading,
  geoError,
  isTracking,
  toggleGeolocation,
  centerOnUser,
  searchRadius,
  setSearchRadius,
  searchCity,
  setSearchCity,
  searchingCity,
  handleSearchCity,
  mapCenter,
  userHasMovedMap,
  setUserHasMovedMap,
  nearbyVenues,
  lastSearchTime,
  followUser,
  setFollowUser,
  showRadiusCircle,
  setShowRadiusCircle,
  fetchData
}) {
  const [selectedStyles, setSelectedStyles] = useState([]);
  
  // State for collapsible map - persist in localStorage
  const [isMapExpanded, setIsMapExpanded] = useState(() => {
    const saved = localStorage.getItem('mapExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save preference to localStorage
  const toggleMapExpanded = () => {
    setIsMapExpanded(prev => {
      const newValue = !prev;
      localStorage.setItem('mapExpanded', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Extract all unique styles from venues (normalize case to avoid duplicates)
  const allStyles = useMemo(() => {
    const styles = new Set();
    (venues || []).forEach(v => {
      (v.music_styles || []).forEach(s => {
        // Normalize: capitalize first letter, lowercase rest
        const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        styles.add(normalized);
      });
    });
    return [...styles].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [venues]);

  const toggleStyle = (style) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  // Filter venues by selected styles (case-insensitive comparison)
  const styleFilteredVenues = useMemo(() => {
    if (selectedStyles.length === 0) return venues || [];
    return (venues || []).filter(v => 
      (v.music_styles || []).some(s => {
        const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        return selectedStyles.includes(normalized);
      })
    );
  }, [venues, selectedStyles]);

  const styleFilteredNearby = useMemo(() => {
    if (selectedStyles.length === 0) return nearbyVenues || [];
    return (nearbyVenues || []).filter(v =>
      (v.music_styles || []).some(s => {
        const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        return selectedStyles.includes(normalized);
      })
    );
  }, [nearbyVenues, selectedStyles]);

  return (
    <>
      {/* Collapsible header */}
      <div className="glassmorphism rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg">Carte des établissements</h2>
              <p className="text-xs text-muted-foreground">
                {styleFilteredVenues.length} établissement{styleFilteredVenues.length > 1 ? 's' : ''} disponible{styleFilteredVenues.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={toggleMapExpanded}
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-white/10"
            aria-label={isMapExpanded ? "Réduire la carte" : "Agrandir la carte"}
          >
            {isMapExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      {isMapExpanded && (
        <>
          {/* Geolocation Controls */}
          <div className="glassmorphism rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Status & Toggle */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={toggleGeolocation} 
              variant={geoEnabled ? "default" : "outline"}
              className={`rounded-full gap-2 ${geoEnabled ? 'bg-green-500 hover:bg-green-600' : 'border-white/20'}`}
              data-testid="geolocation-toggle"
            >
              {geoEnabled ? (
                <>
                  <Radio className="w-4 h-4 animate-pulse" />
                  GPS Actif
                </>
              ) : (
                <>
                  <MapPinOff className="w-4 h-4" />
                  GPS Inactif
                </>
              )}
            </Button>
            
            {isTracking && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Suivi en temps réel
              </div>
            )}
            
            {geoLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Localisation...
              </div>
            )}
          </div>

          {/* Center on user */}
          <Button 
            onClick={centerOnUser} 
            variant="outline" 
            className="rounded-full gap-2 border-white/20"
            disabled={!geoPosition}
          >
            <Locate className="w-4 h-4" />
            Centrer
          </Button>

          {/* Radius Control */}
          <div className="flex-1 flex items-center gap-4">
            <Label className="text-sm whitespace-nowrap">Rayon: {searchRadius}km</Label>
            <Slider
              value={[searchRadius]}
              onValueChange={([value]) => setSearchRadius(value)}
              min={5}
              max={100}
              step={5}
              className="w-32 md:w-48"
            />
          </div>

          {/* Search by city */}
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une ville..." 
                value={searchCity} 
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchCity();
                  }
                }}
                className="pl-9 h-10 bg-black/20 border-white/10" 
                data-testid="search-city"
                disabled={searchingCity}
              />
            </div>
            <Button
              onClick={handleSearchCity}
              disabled={!searchCity.trim() || searchingCity}
              variant="outline"
              className="h-10 px-4 border-white/20"
            >
              {searchingCity ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Error message */}
        {geoError && (
          <div className="mt-3 p-3 bg-destructive/20 rounded-lg text-destructive text-sm">
            {geoError}
          </div>
        )}

        {/* Position info */}
        {geoPosition && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Position: {geoPosition.latitude.toFixed(4)}, {geoPosition.longitude.toFixed(4)}</span>
            <span>Précision: ±{Math.round(geoPosition.accuracy)}m</span>
            {lastSearchTime && <span>Dernière recherche: {lastSearchTime.toLocaleTimeString()}</span>}
            {nearbyVenues.length > 0 && (
              <span className="text-secondary font-medium">{nearbyVenues.length} établissement(s) à proximité</span>
            )}
          </div>
        )}
      </div>

      {/* Style filter chips */}
      {allStyles.length > 0 && (
        <div className="glassmorphism rounded-xl p-3 mb-6" data-testid="style-filter">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
              <Music className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Styles :</span>
            </div>
            {selectedStyles.length > 0 && (
              <button
                onClick={() => setSelectedStyles([])}
                className="px-2.5 py-1 text-xs rounded-full border border-white/10 text-muted-foreground hover:text-white transition-colors"
                data-testid="clear-styles"
              >
                Tous
              </button>
            )}
            {allStyles.map(style => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                  selectedStyles.includes(style)
                    ? 'bg-primary text-white border border-primary'
                    : 'bg-black/20 text-muted-foreground border border-white/10 hover:border-primary/50 hover:text-white'
                }`}
                data-testid={`style-${style}`}
              >
                {style}
              </button>
            ))}
            {selectedStyles.length > 0 && (
              <span className="text-xs text-primary ml-1">
                {styleFilteredVenues.length} résultat{styleFilteredVenues.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[500px] rounded-2xl overflow-hidden neon-border relative z-0">
          <MapContainer center={mapCenter} zoom={geoPosition ? 12 : 6} className="h-full w-full" style={{ background: 'hsl(240 25% 10%)' }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            
            {/* Detect manual map movement */}
            <MapEventHandler onMapMove={() => setUserHasMovedMap(true)} />
            
            <SetViewOnLocation coords={geoPosition ? [geoPosition.latitude, geoPosition.longitude] : null} zoom={12} enabled={!userHasMovedMap} />
            <FollowUser position={geoPosition} enabled={followUser && isTracking && !userHasMovedMap} />
            
            {/* User position marker */}
            {geoPosition && (
              <>
                <Marker 
                  position={[geoPosition.latitude, geoPosition.longitude]} 
                  icon={userPulseIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Vous êtes ici</p>
                      <p className="text-xs text-gray-500">Précision: ±{Math.round(geoPosition.accuracy)}m</p>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Search radius circle */}
                {showRadiusCircle && (
                  <Circle
                    center={[geoPosition.latitude, geoPosition.longitude]}
                    radius={searchRadius * 1000}
                    pathOptions={{
                      color: 'hsl(290 80% 60%)',
                      fillColor: 'hsl(290 80% 60%)',
                      fillOpacity: 0.1,
                      weight: 2,
                      dashArray: '5, 10'
                    }}
                  />
                )}
              </>
            )}
            
            {/* Venue markers - filtered by style */}
            {styleFilteredVenues && styleFilteredVenues.length > 0 && styleFilteredVenues.map((venue) => {
              if (venue.latitude == null || venue.longitude == null) {
                return null;
              }
              const isNearby = nearbyVenues.some(nv => nv.id === venue.id);
              return (
                <Marker 
                  key={venue.id} 
                  position={[venue.latitude, venue.longitude]} 
                  icon={venueIcon}
                  eventHandlers={{
                    click: () => {
                      window.location.href = `/venue/${venue.id}`;
                    }
                  }}
                >
                  <Tooltip 
                    direction="top" 
                    offset={[0, -10]}
                    className="venue-name-tooltip"
                  >
                    <div className="text-xs font-semibold">
                      {venue.name}
                      {isNearby && venue.distance_km && (
                        <span className="text-primary ml-1">({venue.distance_km}km)</span>
                      )}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-lg mb-1">{venue.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{venue.city}</p>
                      {isNearby && venue.distance_km && (
                        <p className="text-xs text-primary mb-2">📍 {venue.distance_km} km (à proximité)</p>
                      )}
                      <Link to={`/venue/${venue.id}`}><Button size="sm" className="w-full bg-primary text-white">Voir détails</Button></Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map controls overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
            <Button
              onClick={() => setShowRadiusCircle(!showRadiusCircle)}
              variant="outline"
              size="sm"
              className={`rounded-full bg-background/80 backdrop-blur ${showRadiusCircle ? 'border-primary text-primary' : 'border-white/20'}`}
            >
              {showRadiusCircle ? 'Masquer zone' : 'Afficher zone'}
            </Button>
            <Button
              onClick={() => setFollowUser(!followUser)}
              variant="outline"
              size="sm"
              className={`rounded-full bg-background/80 backdrop-blur ${followUser ? 'border-secondary text-secondary' : 'border-white/20'}`}
            >
              {followUser ? 'Suivi auto ON' : 'Suivi auto OFF'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-xl">
              {geoPosition && styleFilteredNearby.length > 0 
                ? `${styleFilteredNearby.length} établissement${styleFilteredNearby.length > 1 ? 's' : ''} à proximité`
                : `${styleFilteredVenues.length} établissement${styleFilteredVenues.length > 1 ? 's' : ''} répertorié${styleFilteredVenues.length > 1 ? 's' : ''}`
              }
            </h2>
            {nearbyVenues.length > 0 && geoPosition && (
              <span className="text-xs text-secondary">
                Dans un rayon de {searchRadius}km
              </span>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : loadingError ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 glassmorphism rounded-xl">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground mb-4">Impossible de charger les établissements. Veuillez réessayer.</p>
              <Button 
                onClick={() => fetchData()} 
                className="bg-primary hover:bg-primary/90 rounded-full"
              >
                Réessayer
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {/* Filtrer pour n'afficher que les établissements dans le rayon si géolocalisation active */}
              {(() => {
                const filteredVenues = (geoPosition && styleFilteredNearby.length > 0 ? styleFilteredNearby : styleFilteredVenues)
                  .filter(venue => {
                    // Filtrer par ville si recherche active
                    if (searchCity && searchCity.trim() !== '') {
                      const searchLower = searchCity.toLowerCase().trim();
                      const cityMatch = venue.city?.toLowerCase().includes(searchLower);
                      const nameMatch = venue.name?.toLowerCase().includes(searchLower);
                      const postalMatch = venue.postal_code?.includes(searchCity.trim());
                      return cityMatch || nameMatch || postalMatch;
                    }
                    return true; // Afficher tous si pas de recherche
                  });
                
                if (filteredVenues.length === 0 && searchCity.trim() !== '') {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Aucun résultat pour "{searchCity}"</p>
                      <p className="text-sm">Essayez une autre ville ou effacez la recherche</p>
                    </div>
                  );
                }
                
                return filteredVenues.map((venue) => {
                  const isNearby = nearbyVenues.some(nv => nv.id === venue.id);
                  return (
                    <Link key={venue.id} to={`/venue/${venue.id}`} className="block" data-testid={`venue-card-${venue.id}`}>
                      <div className={`card-venue p-5 group ${isNearby ? 'border border-primary/30' : ''}`}>
                        <div className="flex items-start gap-4">
                          {venue.profile_image && (
                            <LazyImage 
                              src={venue.profile_image} 
                              alt={venue.name} 
                              className="w-16 h-16 rounded-xl object-cover" 
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">{venue.name}</h3>
                              {isNearby && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                  À proximité
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                              <MapPin className="w-4 h-4" /><span>{venue.city}</span>
                              {isNearby && venue.distance_km && (
                                <span className="text-secondary font-medium ml-2">• {venue.distance_km} km</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <div className="flex gap-2">
                              {venue.has_stage && <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">Scène</span>}
                              {venue.has_sound_engineer && <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">Ingé son</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </>
  );
}
