import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { 
  Music, MapPin, LogOut, Search, Mic2, Guitar, 
  Globe, Instagram, Facebook, Phone, User, Loader2, Navigation, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom marker icon
const venueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function SetViewOnLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 12);
    }
  }, [coords, map]);
  return null;
}

export default function MusicianDashboard() {
  const { user, token, logout } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]); // France center
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    instruments: [],
    music_styles: [],
    experience_years: 0,
    city: "",
    phone: "",
    website: "",
    facebook: "",
    instagram: ""
  });

  const fetchVenues = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues`);
      setVenues(response.data);
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setProfileForm({
        name: response.data.name || "",
        bio: response.data.bio || "",
        instruments: response.data.instruments || [],
        music_styles: response.data.music_styles || [],
        experience_years: response.data.experience_years || 0,
        city: response.data.city || "",
        phone: response.data.phone || "",
        website: response.data.website || "",
        facebook: response.data.facebook || "",
        instagram: response.data.instagram || ""
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching profile:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchVenues();
    fetchProfile();
  }, [fetchVenues, fetchProfile]);

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          
          try {
            const response = await axios.post(`${API}/venues/nearby`, {
              latitude,
              longitude,
              radius_km: 50
            });
            setVenues(response.data);
            toast.success(`${response.data.length} établissements trouvés à proximité`);
          } catch (error) {
            toast.error("Erreur lors de la recherche");
          }
        },
        (error) => {
          toast.error("Impossible d'obtenir votre position");
        }
      );
    } else {
      toast.error("La géolocalisation n'est pas supportée");
    }
  };

  const handleSearch = async () => {
    if (!searchCity.trim()) {
      fetchVenues();
      return;
    }
    
    try {
      const response = await axios.get(`${API}/venues?city=${searchCity}`);
      setVenues(response.data);
    } catch (error) {
      toast.error("Erreur lors de la recherche");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const endpoint = profile ? `${API}/musicians` : `${API}/musicians`;
      const method = profile ? "put" : "post";
      
      await axios[method](endpoint, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Profil mis à jour!");
      setEditingProfile(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    }
  };

  const addToList = (field, value) => {
    if (value && !profileForm[field].includes(value)) {
      setProfileForm({
        ...profileForm,
        [field]: [...profileForm[field], value]
      });
    }
  };

  const removeFromList = (field, value) => {
    setProfileForm({
      ...profileForm,
      [field]: profileForm[field].filter(item => item !== value)
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="musician-dashboard">
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
              <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="profile-btn">
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Mon Profil Musicien</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Nom / Pseudo</Label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="bg-black/20 border-white/10"
                        data-testid="profile-name"
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
                      <Label>Instruments</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ajouter un instrument"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addToList('instruments', e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileForm.instruments.map((inst, i) => (
                          <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center gap-1">
                            {inst}
                            <button onClick={() => removeFromList('instruments', inst)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Styles musicaux</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ajouter un style"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addToList('music_styles', e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileForm.music_styles.map((style, i) => (
                          <span key={i} className="px-3 py-1 bg-secondary/20 rounded-full text-sm flex items-center gap-1">
                            {style}
                            <button onClick={() => removeFromList('music_styles', style)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Années d'expérience</Label>
                        <Input
                          type="number"
                          value={profileForm.experience_years}
                          onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="bg-black/20 border-white/10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Instagram</Label>
                      <Input
                        value={profileForm.instagram}
                        onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                        placeholder="@votre_compte"
                        className="bg-black/20 border-white/10"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveProfile}
                      className="w-full bg-primary hover:bg-primary/90 rounded-full"
                      data-testid="save-profile-btn"
                    >
                      Sauvegarder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="ghost" 
                onClick={logout}
                className="text-destructive hover:text-destructive/80"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Search */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">
            Salut, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-muted-foreground">Trouve des spots pour jouer près de chez toi</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par ville..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-12 bg-black/20 border-white/10"
              data-testid="search-city"
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="h-12 px-6 bg-muted hover:bg-muted/80 rounded-lg"
          >
            Rechercher
          </Button>
          <Button 
            onClick={handleGeolocation}
            className="h-12 px-6 bg-secondary hover:bg-secondary/90 rounded-lg gap-2"
            data-testid="geolocation-btn"
          >
            <Navigation className="w-4 h-4" />
            Près de moi
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <div className="h-[500px] rounded-2xl overflow-hidden neon-border">
            <MapContainer 
              center={mapCenter} 
              zoom={6} 
              className="h-full w-full"
              style={{ background: 'hsl(240 25% 10%)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <SetViewOnLocation coords={userLocation} />
              
              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Vous êtes ici</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {venues.map((venue) => (
                <Marker 
                  key={venue.id} 
                  position={[venue.latitude, venue.longitude]}
                  icon={venueIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-lg mb-1">{venue.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{venue.city}</p>
                      <Link to={`/venue/${venue.id}`}>
                        <Button size="sm" className="w-full bg-primary text-white">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Venue List */}
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-xl">
              {venues.length} établissement{venues.length > 1 ? 's' : ''} trouvé{venues.length > 1 ? 's' : ''}
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mic2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun établissement trouvé</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                {venues.map((venue) => (
                  <Link 
                    key={venue.id} 
                    to={`/venue/${venue.id}`}
                    className="block"
                    data-testid={`venue-card-${venue.id}`}
                  >
                    <div className="card-venue p-5 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                            {venue.name}
                          </h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{venue.city}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {venue.has_stage && (
                            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                              Scène
                            </span>
                          )}
                          {venue.has_sound_engineer && (
                            <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">
                              Ingé son
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {venue.music_styles?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {venue.music_styles.slice(0, 3).map((style, i) => (
                            <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                              {style}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                        {venue.instagram && (
                          <Instagram className="w-4 h-4 text-muted-foreground" />
                        )}
                        {venue.facebook && (
                          <Facebook className="w-4 h-4 text-muted-foreground" />
                        )}
                        {venue.website && (
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
