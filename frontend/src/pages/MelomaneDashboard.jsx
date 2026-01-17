import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Slider } from "../components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { MelomaneImageUpload } from "../components/ui/image-upload";
import { CityAutocomplete, reverseGeocode } from "../components/CityAutocomplete";
import { 
  Music, MapPin, LogOut, User, Loader2, Bell, 
  Calendar as CalendarIcon, Check, Trash2, Heart, MessageSquare,
  Search, Radio, MapPinOff, Locate, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { MUSIC_STYLES_LIST } from "../data/music-styles";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Venue marker icon
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

export default function MelomaneDashboard() {
  const { user, token, logout } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [participations, setParticipations] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  
  // Geo and search states
  const [searchRadius, setSearchRadius] = useState(50);
  const [searchCity, setSearchCity] = useState("");
  const [geoPosition, setGeoPosition] = useState(null);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  
  const [profileForm, setProfileForm] = useState({
    pseudo: "",
    bio: "",
    city: "",
    region: "",
    postal_code: "",
    favorite_styles: [],
    profile_picture: "",
    notifications_enabled: true,
    notification_radius_km: 50
  });

  const fetchVenues = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues`);
      setVenues(response.data);
      
      // Calculer les établissements à proximité si GPS activé
      if (geoPosition && response.data) {
        const nearby = response.data
          .filter(v => v.latitude && v.longitude)
          .map(v => {
            const distance = calculateDistance(
              geoPosition.latitude,
              geoPosition.longitude,
              v.latitude,
              v.longitude
            );
            return { ...v, distance_km: distance.toFixed(1) };
          })
          .filter(v => parseFloat(v.distance_km) <= searchRadius)
          .sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
        
        setNearbyVenues(nearby);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setLoading(false);
    }
  }, [geoPosition, searchRadius]);
  
  // Fonction pour calculer la distance entre deux points GPS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/melomanes/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setProfile(response.data);
      setProfileForm({
        pseudo: response.data.pseudo || "",
        bio: response.data.bio || "",
        city: response.data.city || "",
        region: response.data.region || "",
        postal_code: response.data.postal_code || "",
        favorite_styles: response.data.favorite_styles || [],
        profile_picture: response.data.profile_picture || "",
        notifications_enabled: response.data.notifications_enabled ?? true,
        notification_radius_km: response.data.notification_radius_km || 50
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setEditingProfile(true);
      }
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [token]);

  const fetchParticipations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/melomanes/me/participations`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setParticipations(response.data);
    } catch (error) {
      console.error("Error fetching participations:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchVenues();
    fetchProfile();
    fetchNotifications();
    fetchParticipations();
  }, [fetchVenues, fetchProfile, fetchNotifications, fetchParticipations]);

  const handleSaveProfile = async () => {
    try {
      // Validation
      if (!profileForm.pseudo || profileForm.pseudo.trim() === "") {
        toast.error("Le pseudo est obligatoire");
        return;
      }
      
      const method = profile ? "put" : "post";
      const endpoint = profile ? `${API}/melomanes/me` : `${API}/melomanes/`;
      
      // Log pour debug
      console.log('Saving profile with method:', method);
      console.log('Profile data:', profileForm);
      console.log('Endpoint:', endpoint);
      
      const response = await axios[method](endpoint, profileForm, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Save response:', response.data);
      toast.success("Profil mis à jour!");
      setEditingProfile(false);
      fetchProfile();
    } catch (error) {
      console.error('Save error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.detail || error.message || "Erreur lors de la sauvegarde";
      toast.error(errorMsg);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const addToFavoriteStyles = (style) => {
    if (style && !profileForm.favorite_styles.includes(style)) {
      setProfileForm({ 
        ...profileForm, 
        favorite_styles: [...profileForm.favorite_styles, style] 
      });
    }
  };

  const removeFromFavoriteStyles = (style) => {
    setProfileForm({ 
      ...profileForm, 
      favorite_styles: profileForm.favorite_styles.filter(s => s !== style) 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="melomane-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Messages */}
              <Link to="/messages-improved">
                <Button variant="ghost" className="relative">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>

              {/* Notifications */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="relative" data-testid="notifications-btn">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle className="font-heading">Notifications</DialogTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={markAllRead}>
                          <Check className="w-4 h-4 mr-1" />
                          Tout lire
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            if (!window.confirm("Êtes-vous sûr de vouloir effacer toutes les notifications ?")) return;
                            try {
                              await axios.delete(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
                              toast.success("Toutes les notifications ont été effacées");
                              fetchNotifications();
                            } catch (error) {
                              console.error("Error deleting notifications:", error);
                              toast.error("Erreur lors de la suppression");
                            }
                          }}
                          className="text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Tout effacer
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {notifications.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucune notification</p>
                    ) : notifications.map((notif) => (
                      <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-muted/30' : 'bg-primary/10 border border-primary/30'}`}>
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Profile */}
              <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="profile-btn">
                    {profile?.profile_picture ? (
                      <img src={profile.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    Mon Profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Mon Profil Mélomane</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Photo de profil</Label>
                      <MelomaneImageUpload
                        value={profileForm.profile_picture}
                        onChange={(url) => setProfileForm({ ...profileForm, profile_picture: url })}
                        token={token}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pseudo</Label>
                      <Input 
                        value={profileForm.pseudo} 
                        onChange={(e) => setProfileForm({ ...profileForm, pseudo: e.target.value })} 
                        className="bg-black/20 border-white/10" 
                        data-testid="profile-pseudo" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea 
                        value={profileForm.bio} 
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} 
                        className="bg-black/20 border-white/10" 
                        rows={3} 
                      />
                    </div>

                    <div className="space-y-2">
                      <CityAutocomplete
                        value={profileForm.city}
                        onSelect={(cityData) => {
                          setProfileForm({
                            ...profileForm,
                            city: cityData.city,
                            postal_code: cityData.postalCode,
                            region: cityData.region
                          });
                        }}
                        label="Ville"
                        placeholder="Ex: Paris"
                      />
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!navigator.geolocation) {
                            toast.error("Géolocalisation non supportée");
                            return;
                          }
                          toast.info("Localisation en cours...");
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const cityData = await reverseGeocode(position.coords.latitude, position.coords.longitude);
                              if (cityData) {
                                setProfileForm({
                                  ...profileForm,
                                  city: cityData.city,
                                  postal_code: cityData.postalCode,
                                  region: cityData.region
                                });
                                toast.success(`📍 Localisé à ${cityData.city} !`);
                              }
                            },
                            () => toast.error("Erreur de localisation")
                          );
                        }}
                        variant="outline"
                        className="w-full border-white/20"
                        size="sm"
                      >
                        📍 Ma position
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Styles musicaux préférés</Label>
                      <Select onValueChange={addToFavoriteStyles}>
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez un style" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px]">
                          {MUSIC_STYLES_LIST.map((style) => (
                            <SelectItem key={style} value={style}>{style}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        {profileForm.favorite_styles.map((style, i) => (
                          <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center gap-1">
                            {style}
                            <button onClick={() => removeFromFavoriteStyles(style)}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rayon de notification (km)</Label>
                      <Input 
                        type="number" 
                        value={profileForm.notification_radius_km} 
                        onChange={(e) => setProfileForm({ ...profileForm, notification_radius_km: parseFloat(e.target.value) })} 
                        className="bg-black/20 border-white/10" 
                      />
                    </div>

                    <Button 
                      onClick={handleSaveProfile} 
                      className="w-full bg-primary hover:bg-primary/90 rounded-full"
                    >
                      Sauvegarder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" onClick={logout} className="text-destructive hover:text-destructive/80" data-testid="logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">
            Bienvenue, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-muted-foreground">Découvrez les événements musicaux près de chez vous</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 mb-6 gap-1 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
            <TabsTrigger value="map" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Carte</TabsTrigger>
            <TabsTrigger value="participations" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              Mes Participations ({participations.length})
            </TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map">
            {/* Geolocation Controls */}
            <div className="glassmorphism rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Status & Toggle */}
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => {
                      if (!geoEnabled) {
                        setGeoLoading(true);
                        setGeoError(null);
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const pos = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy
                              };
                              setGeoPosition(pos);
                              setGeoEnabled(true);
                              setMapCenter([pos.latitude, pos.longitude]);
                              setGeoLoading(false);
                              toast.success("Géolocalisation activée");
                            },
                            (error) => {
                              setGeoError("Erreur de géolocalisation. Vérifiez vos autorisations.");
                              setGeoLoading(false);
                            }
                          );
                        } else {
                          setGeoError("Géolocalisation non supportée par votre navigateur");
                          setGeoLoading(false);
                        }
                      } else {
                        setGeoEnabled(false);
                        setGeoPosition(null);
                        setNearbyVenues([]);
                        toast.info("Géolocalisation désactivée");
                      }
                    }}
                    variant={geoEnabled ? "default" : "outline"}
                    className={`rounded-full gap-2 ${geoEnabled ? 'bg-green-500 hover:bg-green-600' : 'border-white/20'}`}
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
                  
                  {geoLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Localisation...
                    </div>
                  )}
                </div>

                {/* Center on user */}
                <Button 
                  onClick={() => {
                    if (geoPosition) {
                      setMapCenter([geoPosition.latitude, geoPosition.longitude]);
                    }
                  }}
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
                      className="pl-9 h-10 bg-black/20 border-white/10" 
                    />
                  </div>
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
                  {nearbyVenues.length > 0 && (
                    <span className="text-secondary font-medium">{nearbyVenues.length} établissement(s) à proximité</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[500px] rounded-2xl overflow-hidden neon-border relative z-0">
                <MapContainer center={mapCenter} zoom={geoPosition ? 12 : 6} className="h-full w-full" style={{ background: 'hsl(240 25% 10%)' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  
                  {/* User position marker */}
                  {geoPosition && (
                    <>
                      <Marker 
                        position={[geoPosition.latitude, geoPosition.longitude]} 
                        icon={L.divIcon({
                          className: 'user-pulse-marker',
                          html: `
                            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                              <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); border: 3px solid white; animation: pulse 2s ease-in-out infinite;"></div>
                            </div>
                          `,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10],
                          popupAnchor: [0, -10]
                        })}
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
                  
                  {/* Venue markers */}
                  {venues && venues.map((venue) => {
                    if (!venue.latitude || !venue.longitude) return null;
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
                          permanent 
                          direction="right" 
                          offset={[15, -5]}
                          className="venue-name-tooltip"
                        >
                          <div className="text-xs font-semibold cursor-pointer hover:text-primary">
                            {venue.name}
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="min-w-[200px]">
                            <h3 className="font-semibold text-lg mb-1">{venue.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">{venue.city}</p>
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
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-xl">
                    {geoPosition && nearbyVenues.length > 0 
                      ? `${nearbyVenues.length} établissement${nearbyVenues.length > 1 ? 's' : ''} à proximité`
                      : `${venues.length} établissement${venues.length > 1 ? 's' : ''} répertorié${venues.length > 1 ? 's' : ''}`
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
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {(nearbyVenues.length > 0 ? nearbyVenues : venues).map((venue) => (
                      <Link key={venue.id} to={`/venue/${venue.id}`}>
                        <div className="card-venue p-4 hover:border-primary/50 transition-all cursor-pointer">
                          <h3 className="font-heading font-semibold">{venue.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {venue.city}
                          </p>
                          {venue.distance_km && (
                            <p className="text-xs text-primary mt-1">📍 {venue.distance_km} km</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Participations Tab */}
          <TabsContent value="participations">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-xl mb-4">Mes Participations</h2>
              {participations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Vous n'avez pas encore marqué de participation</p>
                  <p className="text-sm mt-2">Consultez la carte pour découvrir les événements</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participations.map((participation) => (
                    <div key={participation.id} className="card-venue p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-heading font-semibold text-lg">
                            {participation.event_type === 'jam' ? '🎸 Bœuf musical' :
                             participation.event_type === 'concert' ? '🎤 Concert' :
                             participation.event_type === 'karaoke' ? '🎤 Karaoké' :
                             participation.event_type === 'spectacle' ? '🎭 Spectacle' : 'Événement'}
                          </p>
                          <p className="text-sm text-muted-foreground">Événement ID: {participation.event_id}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Participant
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(participation.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
