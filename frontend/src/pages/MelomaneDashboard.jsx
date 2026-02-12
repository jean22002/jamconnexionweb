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
import LazyImage from "../components/LazyImage";
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
  Search, Radio, MapPinOff, Locate, X, ChevronDown, Home, Building2, Users as UsersIcon, Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { MUSIC_STYLES_LIST } from "../data/music-styles";
import { useNotifications } from "../hooks/useNotifications";

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
  
  // Hook pour les notifications push
  useNotifications(token, user);
  
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
  
  // Subscription state for Connexions tab
  const [subscriptions, setSubscriptions] = useState([]);
  
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
      
      // Reconstruire les URLs complètes pour les images des venues
      const venuesWithFullUrls = response.data.map(venue => ({
        ...venue,
        profile_image: venue.profile_image 
          ? (venue.profile_image.startsWith('http') 
              ? venue.profile_image 
              : `${API}${venue.profile_image}`)
          : "",
        cover_image: venue.cover_image
          ? (venue.cover_image.startsWith('http')
              ? venue.cover_image
              : `${API}${venue.cover_image}`)
          : ""
      }));
      
      setVenues(venuesWithFullUrls);
      
      // Calculer les établissements à proximité si GPS activé
      if (geoPosition && venuesWithFullUrls) {
        const nearby = venuesWithFullUrls
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
      
      // NEW: Use refactored buildImageUrl utility
      const profile_picture_url = buildImageUrl(response.data.profile_picture);
      
      setProfileForm({
        pseudo: response.data.pseudo || "",
        bio: response.data.bio || "",
        city: response.data.city || "",
        region: response.data.region || "",
        postal_code: response.data.postal_code || "",
        favorite_styles: response.data.favorite_styles || [],
        profile_picture: profile_picture_url,
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
      // Only keep active participations
      const activeParticipations = (response.data || []).filter(p => p.active !== false);
      setParticipations(activeParticipations);
    } catch (error) {
      console.error("Error fetching participations:", error);
    }
  }, [token]);
  
  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/my-subscriptions`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // Enrichir avec les données des venues
      const enrichedSubs = await Promise.all(
        response.data.map(async (sub) => {
          try {
            const venueRes = await axios.get(`${API}/venues/${sub.venue_id}`);
            return {
              ...sub,
              venue_name: venueRes.data.name,
              city: venueRes.data.city,
              venue_image: venueRes.data.profile_image
            };
          } catch (err) {
            return sub;
          }
        })
      );
      
      setSubscriptions(enrichedSubs);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchVenues();
    fetchProfile();
    fetchNotifications();
    fetchParticipations();
    fetchSubscriptions();
  }, [fetchVenues, fetchProfile, fetchNotifications, fetchParticipations, fetchSubscriptions]);

  // Polling pour rafraîchir les notifications toutes les 15 secondes
  useEffect(() => {
    if (!token) return;
    
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 15000); // 15 secondes
    
    return () => clearInterval(notificationInterval);
  }, [token, fetchNotifications]);

  const handleSaveProfile = async () => {
    try {
      // Validation
      if (!profileForm.pseudo || profileForm.pseudo.trim() === "") {
        toast.error("Le pseudo est obligatoire");
        return;
      }
      
      const method = profile ? "put" : "post";
      const endpoint = profile ? `${API}/melomanes/me` : `${API}/melomanes/`;
      
      // Préparer les données avec normalisation d'URL
      const profileData = { ...profileForm };
      
      // Normalize profile_picture URL
      if (profileData.profile_picture) {
        let normalizedUrl = profileData.profile_picture;
        if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
          normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
        }
        normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
        if (!normalizedUrl.startsWith('/api/uploads')) {
          normalizedUrl = normalizedUrl.replace(/^\/?(uploads\/)/, '/api/uploads/');
        }
        profileData.profile_picture = normalizedUrl;
      }
      
      // Log pour debug
      console.log('Saving profile with method:', method);
      console.log('Profile data:', profileData);
      console.log('Endpoint:', endpoint);
      
      const response = await axios[method](endpoint, profileData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Save response:', response.data);
      toast.success("Profil mis à jour!");
      
      // Update profile state with the response
      setProfile(response.data);
      
      // NEW: Use refactored buildImageUrl utility
      const saved_profile_picture = buildImageUrl(response.data.profile_picture);
      
      // Update profileForm with complete URL from backend response
      setProfileForm(prev => ({
        ...prev,
        profile_picture: saved_profile_picture
      }));
      
      console.log('✅ Profile updated. Image saved:', {
        profile_picture: saved_profile_picture
      });
      
      setEditingProfile(false);
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
              {/* Notifications */}
              <Dialog onOpenChange={(open) => {
                if (open && unreadCount > 0) {
                  // Marquer toutes les notifications comme lues quand on ouvre le panneau
                  markAllRead();
                }
              }}>
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
                        onChange={(url) => {
                          console.log('📸 Melomane profile picture updated:', url);
                          setProfileForm(prev => ({ ...prev, profile_picture: url }));
                        }}
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

                    {/* Account Management Section */}
                    <div className="space-y-4 p-4 border-2 border-red-500/20 rounded-xl">
                      <h4 className="font-medium text-red-400">Gestion du compte</h4>
                      
                      {/* Suspend Account */}
                      <div className="flex items-start justify-between gap-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div>
                          <p className="font-medium mb-1">Suspendre mon compte</p>
                          <p className="text-xs text-muted-foreground">
                            Suspendre temporairement pour 60 jours. Réactivation possible à tout moment.
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full border-orange-500/50 hover:bg-orange-500/20">
                              <Clock className="w-4 h-4 mr-2" />
                              Suspendre
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glassmorphism border-white/10">
                            <DialogHeader>
                              <DialogTitle className="text-orange-400">Suspendre mon compte</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <h4 className="font-semibold mb-2">⚠️ Attention</h4>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                  <li>• Compte suspendu pour 60 jours maximum</li>
                                  <li>• Profil non visible pendant cette période</li>
                                  <li>• Réactivation possible à tout moment</li>
                                </ul>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="rounded-full">Annuler</Button>
                                </DialogTrigger>
                                <Button
                                  className="bg-orange-500 hover:bg-orange-600 rounded-full"
                                  onClick={async () => {
                                    try {
                                      await axios.post(`${API}/account/suspend`, {}, { 
                                        headers: { Authorization: `Bearer ${token}` } 
                                      });
                                      toast.success("Compte suspendu pour 60 jours");
                                      setTimeout(() => logout(), 2000);
                                    } catch (error) {
                                      toast.error("Erreur lors de la suspension");
                                    }
                                  }}
                                >
                                  Confirmer
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Delete Account */}
                      <div className="flex items-start justify-between gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div>
                          <p className="font-medium mb-1">Supprimer mon compte</p>
                          <p className="text-xs text-muted-foreground">
                            Suppression définitive et irréversible de toutes vos données.
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full border-red-500/50 hover:bg-red-500/20">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glassmorphism border-white/10">
                            <DialogHeader>
                              <DialogTitle className="text-red-400">Supprimer mon compte</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                <h4 className="font-semibold mb-2">🚨 Action irréversible</h4>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                  <li>• Toutes vos données seront supprimées</li>
                                  <li>• Vos participations seront perdues</li>
                                  <li>• Vos connexions seront effacées</li>
                                  <li>• Cette action ne peut pas être annulée</li>
                                </ul>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="rounded-full">Annuler</Button>
                                </DialogTrigger>
                                <Button
                                  className="bg-red-500 hover:bg-red-600 rounded-full"
                                  onClick={async () => {
                                    try {
                                      await axios.delete(`${API}/account/delete`, { 
                                        headers: { Authorization: `Bearer ${token}` } 
                                      });
                                      toast.success("Compte supprimé définitivement");
                                      setTimeout(() => logout(), 2000);
                                    } catch (error) {
                                      toast.error("Erreur lors de la suppression");
                                    }
                                  }}
                                >
                                  Confirmer la suppression
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
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
            <TabsTrigger value="etablissements" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Établissements</TabsTrigger>
            <TabsTrigger value="connexions" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Connexions</TabsTrigger>
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
                          // Options pour améliorer la précision
                          const options = {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                          };
                          
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
                              let errorMsg = "Erreur de géolocalisation";
                              switch(error.code) {
                                case error.PERMISSION_DENIED:
                                  errorMsg = "Permission refusée. Autorisez la géolocalisation dans votre navigateur.";
                                  break;
                                case error.POSITION_UNAVAILABLE:
                                  errorMsg = "Position indisponible. Vérifiez votre connexion GPS.";
                                  break;
                                case error.TIMEOUT:
                                  errorMsg = "Délai dépassé. Réessayez.";
                                  break;
                                default:
                                  errorMsg = "Erreur inconnue de géolocalisation.";
                              }
                              setGeoError(errorMsg);
                              setGeoLoading(false);
                              toast.error(errorMsg);
                            },
                            options
                          );
                        } else {
                          const msg = "Géolocalisation non supportée par votre navigateur";
                          setGeoError(msg);
                          setGeoLoading(false);
                          toast.error(msg);
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
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-lg mb-1">
                            {participation.event_type === 'jam' ? '🎸 Bœuf musical' :
                             participation.event_type === 'concert' ? '🎤 Concert' :
                             participation.event_type === 'karaoke' ? '🎤 Karaoké' :
                             participation.event_type === 'spectacle' ? '🎭 Spectacle' : 'Événement'}
                          </p>
                          {participation.event_title && (
                            <p className="text-sm font-medium text-foreground/90 mb-1">{participation.event_title}</p>
                          )}
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {participation.venue_name || 'Établissement inconnu'}
                            {participation.venue_city && ` • ${participation.venue_city}`}
                          </p>
                          {participation.event_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📅 {new Date(participation.event_date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                              {participation.event_time && ` à ${participation.event_time}`}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1 ml-2">
                          <Check className="w-3 h-3" />
                          Participant
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Ajouté le {new Date(participation.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        {participation.event_date && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => {
                              // Create calendar event
                              const event = {
                                title: participation.event_title || 
                                       (participation.event_type === 'jam' ? 'Bœuf musical' :
                                        participation.event_type === 'concert' ? 'Concert' :
                                        participation.event_type === 'karaoke' ? 'Karaoké' :
                                        participation.event_type === 'spectacle' ? 'Spectacle' : 'Événement'),
                                location: `${participation.venue_name || 'Établissement'}${participation.venue_city ? ', ' + participation.venue_city : ''}`,
                                startDate: new Date(`${participation.event_date}T${participation.event_time || '20:00'}`),
                                endDate: new Date(`${participation.event_date}T${participation.event_time || '20:00'}`),
                              };
                              
                              // Add 2 hours to end date
                              event.endDate.setHours(event.endDate.getHours() + 2);
                              
                              // Format dates for ICS
                              const formatDate = (date) => {
                                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                              };
                              
                              // Create ICS file content
                              const icsContent = [
                                'BEGIN:VCALENDAR',
                                'VERSION:2.0',
                                'PRODID:-//Jam Connexion//FR',
                                'BEGIN:VEVENT',
                                `UID:${participation.id}@jamconnexion.com`,
                                `DTSTAMP:${formatDate(new Date())}`,
                                `DTSTART:${formatDate(event.startDate)}`,
                                `DTEND:${formatDate(event.endDate)}`,
                                `SUMMARY:${event.title}`,
                                `LOCATION:${event.location}`,
                                `DESCRIPTION:Événement musical - ${event.title}`,
                                'END:VEVENT',
                                'END:VCALENDAR'
                              ].join('\r\n');
                              
                              // Create and download ICS file
                              const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = `event-${participation.id}.ics`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(link.href);
                              
                              toast.success('Événement téléchargé ! Ouvrez le fichier pour l\'ajouter à votre calendrier.');
                            }}
                          >
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Ajouter au calendrier
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Établissements Tab */}
          <TabsContent value="etablissements">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-2xl mb-6">Établissements</h2>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
                  <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                    Tous ({venues.length})
                  </TabsTrigger>
                  <TabsTrigger value="nearby" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                    À proximité {nearbyVenues.length > 0 && `(${nearbyVenues.length})`}
                  </TabsTrigger>
                </TabsList>

                {/* Tous les établissements */}
                <TabsContent value="all" className="mt-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : venues.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun établissement trouvé</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {venues.map((venue) => (
                        <Link key={venue.id} to={`/venue/${venue.id}`}>
                          <div className="card-venue p-4 hover:border-primary/50 transition-all cursor-pointer">
                            {venue.profile_image && (
                              <img src={venue.profile_image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                            )}
                            <h3 className="font-heading font-semibold">{venue.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {venue.city}
                            </p>
                            {venue.music_styles && venue.music_styles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {venue.music_styles.slice(0, 2).map((style, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-primary/20 rounded-full">{style}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* À proximité */}
                <TabsContent value="nearby" className="mt-6">
                  {!geoPosition ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MapPinOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Activez votre géolocalisation dans l'onglet "Carte"</p>
                      <p className="text-sm mt-2">pour voir les établissements à proximité</p>
                      <Button 
                        onClick={() => setActiveTab("map")} 
                        className="mt-4 bg-primary hover:bg-primary/90 rounded-full"
                      >
                        Aller à la carte
                      </Button>
                    </div>
                  ) : nearbyVenues.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun établissement dans un rayon de {searchRadius}km</p>
                      <p className="text-sm mt-2">Augmentez le rayon de recherche dans l'onglet "Carte"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nearbyVenues.map((venue) => (
                        <Link key={venue.id} to={`/venue/${venue.id}`}>
                          <div className="card-venue p-4 hover:border-primary/50 transition-all cursor-pointer">
                            {venue.profile_image && (
                              <img src={venue.profile_image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                            )}
                            <h3 className="font-heading font-semibold">{venue.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {venue.city}
                            </p>
                            <p className="text-xs text-primary mt-1">📍 {venue.distance_km} km</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Connexions Tab */}
          <TabsContent value="connexions">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-2xl mb-6">Mes Connexions</h2>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Vous n'êtes connecté à aucun établissement</p>
                  <p className="text-sm mt-2">Visitez les profils d'établissements et connectez-vous pour suivre leurs événements</p>
                  <Button 
                    onClick={() => setActiveTab("etablissements")} 
                    className="mt-4 bg-primary hover:bg-primary/90 rounded-full"
                  >
                    Découvrir les établissements
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscriptions.map((sub) => (
                    <Link 
                      key={sub.venue_id} 
                      to={`/venue/${sub.venue_id}`}
                      className="card-venue p-5 cursor-pointer hover:scale-105 transition-transform block"
                    >
                      <div className="flex items-center gap-4">
                        {sub.venue_image ? (
                          <img src={sub.venue_image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Music className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-heading font-semibold">{sub.venue_name}</h3>
                          <p className="text-sm text-muted-foreground">{sub.city}</p>
                        </div>
                      </div>
                    </Link>
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
