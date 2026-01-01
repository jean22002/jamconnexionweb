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
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  Bell, Youtube, UserPlus, Check, Calendar as CalendarIcon, Heart
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const venueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function SetViewOnLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 12);
  }, [coords, map]);
  return null;
}

export default function MusicianDashboard() {
  const { user, token, logout } = useAuth();
  const [venues, setVenues] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  
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

  useEffect(() => {
    fetchData();
    fetchProfile();
    fetchNotifications();
    fetchFriends();
  }, [fetchData, fetchProfile, fetchNotifications, fetchFriends]);

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          try {
            const response = await axios.post(`${API}/venues/nearby`, { latitude, longitude, radius_km: 50 });
            setVenues(response.data);
            toast.success(`${response.data.length} établissements trouvés`);
          } catch (error) {
            toast.error("Erreur lors de la recherche");
          }
        },
        () => toast.error("Impossible d'obtenir votre position")
      );
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
                            <Label>Nom du groupe</Label>
                            <Input value={profileForm.band.name} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, name: e.target.value } })} className="bg-black/20 border-white/10" />
                          </div>
                          <div className="space-y-2">
                            <Label>Photo du groupe (URL)</Label>
                            <Input value={profileForm.band.photo} onChange={(e) => setProfileForm({ ...profileForm, band: { ...profileForm.band, photo: e.target.value } })} className="bg-black/20 border-white/10" />
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
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="map" className="rounded-full">Carte</TabsTrigger>
            <TabsTrigger value="musicians" className="rounded-full">Musiciens</TabsTrigger>
            <TabsTrigger value="friends" className="rounded-full">Amis ({friends.length})</TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-full">Abonnements</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Rechercher par ville..." value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="pl-10 h-12 bg-black/20 border-white/10" data-testid="search-city" />
              </div>
              <Button onClick={handleGeolocation} className="h-12 px-6 bg-secondary hover:bg-secondary/90 rounded-lg gap-2" data-testid="geolocation-btn">
                <Navigation className="w-4 h-4" />
                Près de moi
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[500px] rounded-2xl overflow-hidden neon-border">
                <MapContainer center={mapCenter} zoom={6} className="h-full w-full" style={{ background: 'hsl(240 25% 10%)' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <SetViewOnLocation coords={userLocation} />
                  {userLocation && <Marker position={userLocation} icon={userIcon}><Popup>Vous êtes ici</Popup></Marker>}
                  {venues.map((venue) => (
                    <Marker key={venue.id} position={[venue.latitude, venue.longitude]} icon={venueIcon}>
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-semibold text-lg mb-1">{venue.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{venue.city}</p>
                          <Link to={`/venue/${venue.id}`}><Button size="sm" className="w-full bg-primary text-white">Voir détails</Button></Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="space-y-4">
                <h2 className="font-heading font-semibold text-xl">{venues.length} établissement{venues.length > 1 ? 's' : ''}</h2>
                {loading ? (
                  <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {venues.map((venue) => (
                      <Link key={venue.id} to={`/venue/${venue.id}`} className="block" data-testid={`venue-card-${venue.id}`}>
                        <div className="card-venue p-5 group">
                          <div className="flex items-start gap-4">
                            {venue.profile_image && <img src={venue.profile_image} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                            <div className="flex-1">
                              <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">{venue.name}</h3>
                              <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <MapPin className="w-4 h-4" /><span>{venue.city}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {venue.has_stage && <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">Scène</span>}
                              {venue.has_sound_engineer && <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">Ingé son</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
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
        </Tabs>
      </main>
    </div>
  );
}
