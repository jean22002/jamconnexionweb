import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Slider } from "../components/ui/slider";
import { ProfileImageUpload, BandImageUpload } from "../components/ui/image-upload";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { 
  Music, MapPin, LogOut, Search, Guitar, Users,
  Globe, Instagram, Facebook, Phone, User, Loader2, Navigation, X,
  Bell, Youtube, UserPlus, Check, Calendar as CalendarIcon, Heart,
  Radio, MapPinOff, Locate, Settings2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAutoGeolocation } from "../hooks/useGeolocation";
import { toast } from "sonner";
import ParticipationBadge from "../components/ParticipationBadge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
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

function SetViewOnLocation({ coords, zoom = 12 }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, zoom);
  }, [coords, map, zoom]);
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

export default function MusicianDashboard() {
  const { user, token, logout } = useAuth();
  const [venues, setVenues] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  const [currentParticipation, setCurrentParticipation] = useState(null);
  
  // Geolocation states
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  
  // Bands
  const [bands, setBands] = useState([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [bandFilters, setBandFilters] = useState({ department: "", city: "" });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedBand, setSelectedBand] = useState(null);
  const [messageForm, setMessageForm] = useState({ subject: "", content: "" });
  const [searchRadius, setSearchRadius] = useState(25); // km
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [lastSearchTime, setLastSearchTime] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Auto geolocation hook
  const { 
    position: geoPosition, 
    error: geoError, 
    isTracking, 
    isLoading: geoLoading,
    startTracking,
    stopTracking 
  } = useAutoGeolocation(geoEnabled, handlePositionChange);

  // Handle position change - fetch nearby venues
  function handlePositionChange(newPosition) {
    if (newPosition) {
      setMapCenter([newPosition.latitude, newPosition.longitude]);
      
      // Debounce nearby search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        fetchNearbyVenues(newPosition.latitude, newPosition.longitude);
      }, 1000);
    }
  }

  // Fetch nearby venues based on current position
  const fetchNearbyVenues = useCallback(async (lat, lng) => {
    try {
      const response = await axios.post(`${API}/venues/nearby`, {
        latitude: lat,
        longitude: lng,
        radius_km: searchRadius
      });
      setNearbyVenues(response.data);
      setLastSearchTime(new Date());
      
      // Show toast only on significant changes
      if (response.data.length > 0) {
        toast.success(`${response.data.length} établissement(s) à proximité`, {
          id: 'nearby-venues',
          duration: 2000
        });
      }
    } catch (error) {
      console.error("Error fetching nearby venues:", error);
    }
  }, [searchRadius]);

  // Effect to refetch when radius changes
  useEffect(() => {
    if (geoPosition) {
      fetchNearbyVenues(geoPosition.latitude, geoPosition.longitude);
    }
  }, [searchRadius, geoPosition, fetchNearbyVenues]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  const [profileForm, setProfileForm] = useState({
    pseudo: "", age: null, profile_image: "", bio: "",
    instruments: [], music_styles: [], experience_years: 0,
    city: "", phone: "", website: "", facebook: "", instagram: "", youtube: "", bandcamp: "",
    has_band: false,
    band: { name: "", photo: "", facebook: "", instagram: "", youtube: "", website: "", bandcamp: "" },
    concerts: []
  });

  const [newConcert, setNewConcert] = useState({ date: "", venue_id: "", venue_name: "", city: "", description: "" });

  const fetchData = useCallback(async () => {
    try {
      const [venuesRes, musiciansRes] = await Promise.all([
        axios.get(`${API}/venues`),
        axios.get(`${API}/musicians`)
      ]);
      setVenues(venuesRes.data);
      setMusicians(musiciansRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(response.data);
      setProfileForm({
        pseudo: response.data.pseudo || "",
        age: response.data.age || null,
        profile_image: response.data.profile_image || "",
        bio: response.data.bio || "",
        instruments: response.data.instruments || [],
        music_styles: response.data.music_styles || [],
        experience_years: response.data.experience_years || 0,
        city: response.data.city || "",
        phone: response.data.phone || "",
        website: response.data.website || "",
        facebook: response.data.facebook || "",
        instagram: response.data.instagram || "",
        youtube: response.data.youtube || "",
        bandcamp: response.data.bandcamp || "",
        has_band: response.data.has_band || false,
        band: response.data.band || { name: "", photo: "", facebook: "", instagram: "", youtube: "", website: "", bandcamp: "" },
        concerts: response.data.concerts || []
      });
    } catch (error) {
      if (error.response?.status !== 404) console.error("Error:", error);
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

  const fetchFriends = useCallback(async () => {
    try {
      const [friendsRes, requestsRes, subsRes] = await Promise.all([
        axios.get(`${API}/friends`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/friends/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/my-subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFriends(friendsRes.data);
      setFriendRequests(requestsRes.data);
      setSubscriptions(subsRes.data);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [token]);

  const fetchCurrentParticipation = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/me/current-participation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentParticipation(response.data);
    } catch (error) {
      // No participation or error - that's okay
      setCurrentParticipation(null);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    fetchProfile();
    fetchNotifications();
    fetchFriends();
    fetchCurrentParticipation();
  }, [fetchData, fetchProfile, fetchNotifications, fetchFriends, fetchCurrentParticipation]);

  // Polling for participation status (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentParticipation();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCurrentParticipation]);

  // Bands Management
  const fetchBands = async () => {
    setBandsLoading(true);
    try {
      const params = new URLSearchParams();
      if (bandFilters.department) params.append('department', bandFilters.department);
      if (bandFilters.city) params.append('city', bandFilters.city);
      
      const response = await axios.get(`${API}/bands?${params.toString()}`);
      setBands(response.data);
    } catch (error) {
      console.error("Error fetching bands:", error);
      toast.error("Erreur lors du chargement des groupes");
    } finally {
      setBandsLoading(false);
    }
  };

  const sendMessageToBand = async () => {
    if (!messageForm.subject.trim() || !messageForm.content.trim()) {
      toast.error("Remplissez tous les champs");
      return;
    }

    try {
      await axios.post(
        `${API}/messages`,
        {
          recipient_id: selectedBand.musician_user_id,
          subject: messageForm.subject,
          content: messageForm.content
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Message envoyé ! 📧");
      setShowMessageDialog(false);
      setMessageForm({ subject: "", content: "" });
      setSelectedBand(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    }
  };

  useEffect(() => {
    if (activeTab === "bands") {
      fetchBands();
    }
  }, [activeTab, bandFilters]);

  // Toggle geolocation tracking
  const toggleGeolocation = () => {
    setGeoEnabled(!geoEnabled);
    if (!geoEnabled) {
      toast.success("Géolocalisation activée");
    } else {
      toast.info("Géolocalisation désactivée");
    }
  };

  // Center map on user position
  const centerOnUser = () => {
    if (geoPosition) {
      setMapCenter([geoPosition.latitude, geoPosition.longitude]);
      setFollowUser(true);
    } else {
      toast.error("Position non disponible");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const method = profile ? "put" : "post";
      await axios[method](`${API}/musicians`, profileForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Profil mis à jour!");
      setEditingProfile(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const addConcert = () => {
    if (newConcert.date && newConcert.city) {
      setProfileForm({
        ...profileForm,
        concerts: [...profileForm.concerts, { ...newConcert, id: Date.now().toString() }]
      });
      setNewConcert({ date: "", venue_id: "", venue_name: "", city: "", description: "" });
    }
  };

  const removeConcert = (id) => {
    setProfileForm({
      ...profileForm,
      concerts: profileForm.concerts.filter(c => c.id !== id)
    });
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(`${API}/friends/request`, { to_user_id: userId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Demande envoyée!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API}/friends/accept/${requestId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Demande acceptée!");
      fetchFriends();
      fetchNotifications();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const addToList = (field, value) => {
    if (value && !profileForm[field].includes(value)) {
      setProfileForm({ ...profileForm, [field]: [...profileForm[field], value] });
    }
  };

  const removeFromList = (field, value) => {
    setProfileForm({ ...profileForm, [field]: profileForm[field].filter(item => item !== value) });
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
              {/* Participation Badge in Header */}
              {currentParticipation && (
                <ParticipationBadge eventInfo={currentParticipation} className="hidden md:inline-flex" />
              )}
              
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
                      <Button variant="ghost" size="sm" onClick={markAllRead}>Tout lire</Button>
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
                    {profile?.profile_image ? (
                      <img src={profile.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    Mon Profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Mon Profil Musicien</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="info" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                      <TabsTrigger value="info">Infos</TabsTrigger>
                      <TabsTrigger value="band">Groupe</TabsTrigger>
                      <TabsTrigger value="concerts">Concerts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Photo de profil</Label>
                        <ProfileImageUpload
                          value={profileForm.profile_image}
                          onChange={(url) => setProfileForm({ ...profileForm, profile_image: url })}
                          token={token}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pseudo</Label>
                          <Input value={profileForm.pseudo} onChange={(e) => setProfileForm({ ...profileForm, pseudo: e.target.value })} className="bg-black/20 border-white/10" data-testid="profile-pseudo" />
                        </div>
                        <div className="space-y-2">
                          <Label>Âge</Label>
                          <Input type="number" value={profileForm.age || ""} onChange={(e) => setProfileForm({ ...profileForm, age: parseInt(e.target.value) || null })} className="bg-black/20 border-white/10" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="bg-black/20 border-white/10" rows={3} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Instruments</Label>
                        <Input placeholder="Appuyez Entrée pour ajouter" onKeyPress={(e) => { if (e.key === 'Enter') { addToList('instruments', e.target.value); e.target.value = ''; } }} className="bg-black/20 border-white/10" />
                        <div className="flex flex-wrap gap-2">
                          {profileForm.instruments.map((inst, i) => (
                            <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center gap-1">
                              {inst}
                              <button onClick={() => removeFromList('instruments', inst)}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Styles musicaux</Label>
                        <Input placeholder="Appuyez Entrée pour ajouter" onKeyPress={(e) => { if (e.key === 'Enter') { addToList('music_styles', e.target.value); e.target.value = ''; } }} className="bg-black/20 border-white/10" />
                        <div className="flex flex-wrap gap-2">
                          {profileForm.music_styles.map((style, i) => (
                            <span key={i} className="px-3 py-1 bg-secondary/20 rounded-full text-sm flex items-center gap-1">
                              {style}
                              <button onClick={() => removeFromList('music_styles', style)}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ville</Label>
                          <Input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Années d'expérience</Label>
                          <Input type="number" value={profileForm.experience_years} onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })} className="bg-black/20 border-white/10" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Facebook</Label>
                          <Input value={profileForm.facebook} onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Instagram</Label>
                          <Input value={profileForm.instagram} onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>YouTube</Label>
                          <Input value={profileForm.youtube} onChange={(e) => setProfileForm({ ...profileForm, youtube: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Bandcamp</Label>
                          <Input value={profileForm.bandcamp} onChange={(e) => setProfileForm({ ...profileForm, bandcamp: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="band" className="space-y-4 mt-4">
                      <div className="flex items-center gap-4">
                        <Switch checked={profileForm.has_band} onCheckedChange={(checked) => setProfileForm({ ...profileForm, has_band: checked })} />
                        <Label>Je joue dans un groupe</Label>
                      </div>

                      {profileForm.has_band && (
                        <div className="space-y-4 p-4 border border-white/10 rounded-xl">
                          <div className="space-y-2">
                            <Label>Photo du groupe</Label>
                            <BandImageUpload
                              value={profileForm.band.photo}
                              onChange={(url) => setProfileForm({ ...profileForm, band: { ...profileForm.band, photo: url } })}
                              token={token}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nom du groupe</Label>
                            <Input value={profileForm.band.name} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, name: e.target.value } })} className="bg-black/20 border-white/10" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Facebook</Label>
                              <Input value={profileForm.band.facebook} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, facebook: e.target.value } })} className="bg-black/20 border-white/10" />
                            </div>
                            <div className="space-y-2">
                              <Label>Instagram</Label>
                              <Input value={profileForm.band.instagram} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, instagram: e.target.value } })} className="bg-black/20 border-white/10" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>YouTube</Label>
                              <Input value={profileForm.band.youtube} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, youtube: e.target.value } })} className="bg-black/20 border-white/10" />
                            </div>
                            <div className="space-y-2">
                              <Label>Site web</Label>
                              <Input value={profileForm.band.website} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, website: e.target.value } })} className="bg-black/20 border-white/10" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Bandcamp</Label>
                            <Input value={profileForm.band.bandcamp} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, bandcamp: e.target.value } })} className="bg-black/20 border-white/10" />
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="concerts" className="space-y-4 mt-4">
                      <div className="space-y-4 p-4 border border-white/10 rounded-xl">
                        <h4 className="font-medium">Ajouter un concert</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={newConcert.date} onChange={(e) => setNewConcert({ ...newConcert, date: e.target.value })} className="bg-black/20 border-white/10" />
                          </div>
                          <div className="space-y-2">
                            <Label>Ville</Label>
                            <Input value={newConcert.city} onChange={(e) => setNewConcert({ ...newConcert, city: e.target.value })} className="bg-black/20 border-white/10" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Lieu (ou sélectionner)</Label>
                          <select value={newConcert.venue_id} onChange={(e) => {
                            const venue = venues.find(v => v.id === e.target.value);
                            setNewConcert({ ...newConcert, venue_id: e.target.value, venue_name: venue?.name || "", city: venue?.city || newConcert.city });
                          }} className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white">
                            <option value="">Saisie manuelle</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name} - {v.city}</option>)}
                          </select>
                          {!newConcert.venue_id && (
                            <Input value={newConcert.venue_name} onChange={(e) => setNewConcert({ ...newConcert, venue_name: e.target.value })} placeholder="Nom du lieu" className="bg-black/20 border-white/10 mt-2" />
                          )}
                        </div>
                        <Button onClick={addConcert} className="w-full bg-primary hover:bg-primary/90 rounded-full">Ajouter</Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Mes concerts</h4>
                        {profileForm.concerts.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Aucun concert enregistré</p>
                        ) : profileForm.concerts.map((concert) => (
                          <div key={concert.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">{concert.date}</p>
                              <p className="text-sm text-muted-foreground">{concert.venue_name || "Lieu TBA"} - {concert.city}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeConcert(concert.id)}><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button onClick={handleSaveProfile} className="w-full mt-4 bg-primary hover:bg-primary/90 rounded-full" data-testid="save-profile-btn">
                    Sauvegarder
                  </Button>
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
            Salut, <span className="text-gradient">{profile?.pseudo || user?.name}</span>!
          </h1>
          <p className="text-muted-foreground">Trouve des spots et connecte-toi avec d'autres musiciens</p>
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="mb-6 p-4 glassmorphism rounded-xl neon-border">
            <h3 className="font-heading font-semibold mb-3">Demandes d'ami ({friendRequests.length})</h3>
            <div className="flex flex-wrap gap-3">
              {friendRequests.map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  {req.from_user_image ? (
                    <img src={req.from_user_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-5 h-5" /></div>
                  )}
                  <span>{req.from_user_name}</span>
                  <Button size="sm" onClick={() => acceptFriendRequest(req.id)} className="bg-primary rounded-full">
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="map" className="rounded-full">Carte</TabsTrigger>
            <TabsTrigger value="musicians" className="rounded-full">Musiciens</TabsTrigger>
            <TabsTrigger value="friends" className="rounded-full">Amis ({friends.length})</TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-full">Abonnements</TabsTrigger>
            <TabsTrigger value="bands" className="rounded-full">Groupes</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
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
                      className="pl-9 h-10 bg-black/20 border-white/10" 
                      data-testid="search-city" 
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
                  {lastSearchTime && <span>Dernière recherche: {lastSearchTime.toLocaleTimeString()}</span>}
                  {nearbyVenues.length > 0 && (
                    <span className="text-secondary font-medium">{nearbyVenues.length} établissement(s) à proximité</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[500px] rounded-2xl overflow-hidden neon-border relative">
                <MapContainer center={mapCenter} zoom={geoPosition ? 12 : 6} className="h-full w-full" style={{ background: 'hsl(240 25% 10%)' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <SetViewOnLocation coords={geoPosition ? [geoPosition.latitude, geoPosition.longitude] : null} zoom={12} />
                  <FollowUser position={geoPosition} enabled={followUser && isTracking} />
                  
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
                  
                  {/* Venue markers - show all venues, highlight nearby ones */}
                  {venues && venues.length > 0 && venues.map((venue) => {
                    if (!venue.latitude || !venue.longitude) {
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
                          permanent 
                          direction="right" 
                          offset={[15, -5]}
                          className="venue-name-tooltip"
                        >
                          <div className="text-xs font-semibold cursor-pointer hover:text-primary">
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
                    {venues.length} établissement{venues.length > 1 ? 's' : ''} répertorié{venues.length > 1 ? 's' : ''}
                  </h2>
                  {nearbyVenues.length > 0 && (
                    <span className="text-xs text-secondary">
                      {nearbyVenues.length} à proximité ({searchRadius}km)
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {venues.map((venue) => {
                      const isNearby = nearbyVenues.some(nv => nv.id === venue.id);
                      return (
                        <Link key={venue.id} to={`/venue/${venue.id}`} className="block" data-testid={`venue-card-${venue.id}`}>
                          <div className={`card-venue p-5 group ${isNearby ? 'border border-primary/30' : ''}`}>
                            <div className="flex items-start gap-4">
                              {venue.profile_image && <img src={venue.profile_image} alt="" className="w-16 h-16 rounded-xl object-cover" />}
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
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="musicians">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {musicians.filter(m => m.user_id !== user?.id).map((musician) => (
                <div key={musician.id} className="card-venue p-5">
                  <div className="flex items-start gap-4">
                    {musician.profile_image ? (
                      <img src={musician.profile_image} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-8 h-8 text-primary" /></div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold">{musician.pseudo}</h3>
                      {musician.city && <p className="text-sm text-muted-foreground">{musician.city}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {musician.instruments?.slice(0, 2).map((inst, i) => (
                          <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => sendFriendRequest(musician.user_id)} variant="outline" className="flex-1 rounded-full border-white/20 gap-2">
                      <UserPlus className="w-4 h-4" /> Ajouter
                    </Button>
                    <Link to={`/musician/${musician.id}`} className="flex-1">
                      <Button variant="ghost" className="w-full rounded-full">Voir profil</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="friends">
            {friends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Vous n'avez pas encore d'amis</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="card-venue p-5">
                    <div className="flex items-center gap-4">
                      {friend.profile_image ? (
                        <img src={friend.profile_image} alt="" className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-7 h-7 text-primary" /></div>
                      )}
                      <div>
                        <h3 className="font-heading font-semibold">{friend.pseudo}</h3>
                        {friend.city && <p className="text-sm text-muted-foreground">{friend.city}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {friend.instruments?.slice(0, 2).map((inst, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Vous n'êtes abonné à aucun établissement</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.map((sub) => (
                  <Link key={sub.venue_id} to={`/venue/${sub.venue_id}`} className="card-venue p-5 block">
                    <div className="flex items-center gap-4">
                      {sub.venue_image ? (
                        <img src={sub.venue_image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center"><Music className="w-7 h-7 text-primary" /></div>
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
          </TabsContent>

          {/* Bands Tab */}
          <TabsContent value="bands">
            <div className="space-y-6">
              {/* Filters */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">🎸 Répertoire des Groupes</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Découvrez les groupes de musique de votre région et contactez-les directement
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Département</Label>
                    <Input
                      placeholder="Ex: 75, 13, 69..."
                      value={bandFilters.department}
                      onChange={(e) => setBandFilters({ ...bandFilters, department: e.target.value })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      placeholder="Ex: Paris, Lyon..."
                      value={bandFilters.city}
                      onChange={(e) => setBandFilters({ ...bandFilters, city: e.target.value })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Bands List */}
              {bandsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : bands.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun groupe trouvé</p>
                  <p className="text-sm mt-2">Essayez avec d'autres filtres</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bands.map((band) => (
                    <div key={band.id} className="glassmorphism rounded-xl p-5 hover:bg-white/5 transition-all">
                      {band.photo && (
                        <img src={band.photo} alt={band.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                      )}
                      <h3 className="font-heading font-semibold text-lg mb-2">{band.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{band.city} {band.department && `(${band.department})`}</span>
                      </div>
                      {band.members_count && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <Users className="w-4 h-4 inline mr-1" />
                          {band.members_count} membre(s)
                        </p>
                      )}
                      {band.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{band.description}</p>
                      )}
                      {band.music_styles?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {band.music_styles.map((style, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">{style}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mb-3">
                        {band.looking_for_concerts && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            🎤 Cherche concerts
                          </span>
                        )}
                        {band.looking_for_members && (
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                            👥 Cherche membres
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedBand(band);
                          setShowMessageDialog(true);
                        }}
                        className="w-full bg-primary hover:bg-primary/90 rounded-full gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Contacter
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Dialog */}
              <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                <DialogContent className="glassmorphism border-white/10 max-w-md">
                  <DialogHeader>
                    <DialogTitle>Contacter {selectedBand?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Sujet</Label>
                      <Input
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                        placeholder="Ex: Proposition de collaboration"
                        className="bg-black/20 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={messageForm.content}
                        onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                        placeholder="Votre message..."
                        className="bg-black/20 border-white/10"
                        rows={5}
                      />
                    </div>
                    <Button
                      onClick={sendMessageToBand}
                      className="w-full bg-primary hover:bg-primary/90 rounded-full"
                    >
                      Envoyer le message
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
