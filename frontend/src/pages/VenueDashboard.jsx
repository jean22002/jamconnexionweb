import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { VenueImageUpload } from "../components/ui/image-upload";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { 
  Music, LogOut, MapPin, Globe, Instagram, Facebook, Phone, Edit, Save, 
  Loader2, CreditCard, Check, Clock, AlertCircle, X, Plus, CalendarIcon, 
  Users, Bell, Trash2, Eye, FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { StarRating } from "../components/StarRating";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VenueDashboard() {
  const { user, token, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Events
  const [jams, setJams] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [planningSlots, setPlanningSlots] = useState([]);
  const [applications, setApplications] = useState({});
  const [musicians, setMusicians] = useState([]);
  
  // Dialogs
  const [showJamDialog, setShowJamDialog] = useState(false);
  const [showConcertDialog, setShowConcertDialog] = useState(false);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewingApplications, setViewingApplications] = useState(null);
  
  // Broadcast notifications
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [nearbyMusiciansCount, setNearbyMusiciansCount] = useState(0);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviews, setShowReviews] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");
  
  const [formData, setFormData] = useState({
    name: "", description: "", profile_image: "", cover_image: "",
    address: "", city: "", postal_code: "", latitude: 0, longitude: 0,
    phone: "", website: "", facebook: "", instagram: "",
    has_stage: false, has_sound_engineer: false, has_pa_system: false,
    equipment: [], music_styles: [], opening_hours: ""
  });

  const [jamForm, setJamForm] = useState({
    date: "", start_time: "", end_time: "", music_styles: [],
    rules: "", has_instruments: false, has_pa_system: false,
    instruments_available: [], additional_info: ""
  });

  const [concertForm, setConcertForm] = useState({
    date: "", start_time: "", title: "", description: "",
    bands: [], price: ""
  });

  const [planningForm, setPlanningForm] = useState({
    date: "", music_styles: [], description: ""
  });

  const [newBand, setNewBand] = useState({ name: "", musician_id: "", photo: "", facebook: "", instagram: "" });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(response.data);
      setFormData({
        name: response.data.name || "",
        description: response.data.description || "",
        profile_image: response.data.profile_image || "",
        cover_image: response.data.cover_image || "",
        address: response.data.address || "",
        city: response.data.city || "",
        postal_code: response.data.postal_code || "",
        latitude: response.data.latitude || 0,
        longitude: response.data.longitude || 0,
        phone: response.data.phone || "",
        website: response.data.website || "",
        facebook: response.data.facebook || "",
        instagram: response.data.instagram || "",
        has_stage: response.data.has_stage || false,
        has_sound_engineer: response.data.has_sound_engineer || false,
        has_pa_system: response.data.has_pa_system || false,
        equipment: response.data.equipment || [],
        music_styles: response.data.music_styles || [],
        opening_hours: response.data.opening_hours || ""
      });
    } catch (error) {
      if (error.response?.status === 404) setEditing(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    if (!profile) return;
    try {
      const [jamsRes, concertsRes, planningRes] = await Promise.all([
        axios.get(`${API}/venues/${profile.id}/jams`),
        axios.get(`${API}/venues/${profile.id}/concerts`),
        axios.get(`${API}/venues/${profile.id}/planning`)
      ]);
      setJams(jamsRes.data);
      setConcerts(concertsRes.data);
      setPlanningSlots(planningRes.data);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [profile]);

  const fetchMusicians = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians`);
      setMusicians(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchMusicians();
  }, [fetchProfile, fetchMusicians]);

  useEffect(() => {
    if (profile) fetchEvents();
  }, [profile, fetchEvents]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = profile ? "put" : "post";
      await axios[method](`${API}/venues`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Profil sauvegardé!");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await axios.post(`${API}/payments/checkout`, { origin_url: window.location.origin }, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error("Erreur lors du paiement");
    }
  };

  const geocodeAddress = async () => {
    if (!formData.address || !formData.city) {
      toast.error("Entrez une adresse et une ville");
      return;
    }
    try {
      const query = `${formData.address}, ${formData.postal_code} ${formData.city}, France`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.length > 0) {
        setFormData({ ...formData, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
        toast.success("Coordonnées trouvées!");
      } else {
        toast.error("Adresse non trouvée");
      }
    } catch (error) {
      toast.error("Erreur géolocalisation");
    }
  };

  // Broadcast Notifications
  const fetchNearbyMusiciansCount = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/nearby-musicians-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNearbyMusiciansCount(response.data.count);
    } catch (error) {
      console.error("Error fetching nearby musicians count:", error);
    }
  };

  const fetchBroadcastHistory = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/broadcast-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBroadcastHistory(response.data);
    } catch (error) {
      console.error("Error fetching broadcast history:", error);
    }
  };

  const sendBroadcastNotification = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Entrez un message");
      return;
    }

    setSendingBroadcast(true);
    try {
      const response = await axios.post(
        `${API}/venues/me/broadcast-notification`,
        { message: broadcastMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Notification envoyée à ${response.data.recipients_count} musicien(s) ! 🎵`);
      setBroadcastMessage("");
      fetchBroadcastHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setSendingBroadcast(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications" && profile) {
      fetchNearbyMusiciansCount();
      fetchBroadcastHistory();
    }
  }, [activeTab, profile]);

  // Reviews Management
  const fetchMyReviews = async () => {
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        axios.get(`${API}/venues/me/reviews`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/venues/${profile.id}/average-rating`)
      ]);
      setReviews(reviewsRes.data);
      setAverageRating(ratingRes.data.average_rating);
      setTotalReviews(ratingRes.data.total_reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const toggleReviewsVisibility = async () => {
    try {
      await axios.put(
        `${API}/venues/me/reviews-visibility?show_reviews=${!showReviews}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReviews(!showReviews);
      toast.success(showReviews ? "Avis masqués" : "Avis affichés publiquement");
      fetchProfile();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const respondToReview = async (reviewId) => {
    if (!responseText.trim()) {
      toast.error("Entrez une réponse");
      return;
    }

    try {
      await axios.post(
        `${API}/reviews/${reviewId}/respond`,
        { response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Réponse publiée !");
      setRespondingTo(null);
      setResponseText("");
      fetchMyReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  useEffect(() => {
    if (activeTab === "reviews" && profile) {
      fetchMyReviews();
      setShowReviews(profile.show_reviews ?? true);
    }
  }, [activeTab, profile]);

  // Create Jam
  const createJam = async () => {
    try {
      await axios.post(`${API}/jams`, jamForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Boeuf musical créé!");
      setShowJamDialog(false);
      setJamForm({ date: "", start_time: "", end_time: "", music_styles: [], rules: "", has_instruments: false, has_pa_system: false, instruments_available: [], additional_info: "" });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Create Concert
  const createConcert = async () => {
    try {
      await axios.post(`${API}/concerts`, concertForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Concert créé!");
      setShowConcertDialog(false);
      setConcertForm({ date: "", start_time: "", title: "", description: "", bands: [], price: "" });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Create Planning Slot
  const createPlanningSlot = async () => {
    try {
      await axios.post(`${API}/planning`, planningForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Date disponible publiée!");
      setShowPlanningDialog(false);
      setPlanningForm({ date: "", music_styles: [], description: "" });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Delete events
  const deleteJam = async (id) => {
    try {
      await axios.delete(`${API}/jams/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Supprimé");
      fetchEvents();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const deleteConcert = async (id) => {
    try {
      await axios.delete(`${API}/concerts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Supprimé");
      fetchEvents();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const deletePlanningSlot = async (id) => {
    try {
      await axios.delete(`${API}/planning/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Supprimé");
      fetchEvents();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  // View applications
  const viewApplications = async (slotId) => {
    try {
      const response = await axios.get(`${API}/planning/${slotId}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      setApplications({ ...applications, [slotId]: response.data });
      setViewingApplications(slotId);
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleApplication = async (appId, action) => {
    try {
      await axios.post(`${API}/applications/${appId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(action === "accept" ? "Candidature acceptée!" : "Candidature refusée");
      if (viewingApplications) viewApplications(viewingApplications);
      fetchEvents();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const addBandToConcert = () => {
    if (newBand.name) {
      setConcertForm({ ...concertForm, bands: [...concertForm.bands, { ...newBand }] });
      setNewBand({ name: "", musician_id: "", photo: "", facebook: "", instagram: "" });
    }
  };

  const addToList = (field, value, form, setForm) => {
    if (value && !form[field].includes(value)) {
      setForm({ ...form, [field]: [...form[field], value] });
    }
  };

  const removeFromList = (field, value, form, setForm) => {
    setForm({ ...form, [field]: form[field].filter(item => item !== value) });
  };

  const getSubscriptionStatus = () => {
    if (user?.subscription_status === "active") return { label: "Actif", color: "text-green-400", icon: Check };
    if (user?.subscription_status === "trial") {
      const trialEnd = user?.trial_end ? new Date(user.trial_end) : null;
      const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      return { label: `Essai (${daysLeft}j)`, color: "text-secondary", icon: Clock };
    }
    return { label: "Inactif", color: "text-destructive", icon: AlertCircle };
  };

  const status = getSubscriptionStatus();
  const StatusIcon = status.icon;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="venue-dashboard">
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
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 ${status.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{status.label}</span>
              </div>
              {profile && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{profile.subscribers_count} abonnés</span>
                </div>
              )}
              <Button variant="ghost" onClick={logout} className="text-destructive hover:text-destructive/80" data-testid="logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">
            Bienvenue, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-muted-foreground">Gérez votre établissement et vos événements</p>
        </div>

        {/* Subscription Card */}
        {user?.subscription_status !== "active" && (
          <div className="glassmorphism rounded-2xl p-6 mb-8 neon-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">
                  {user?.subscription_status === "trial" ? "Période d'essai" : "Abonnez-vous"}
                </h3>
                <p className="text-muted-foreground text-sm">10€/mois pour être visible</p>
              </div>
              {user?.subscription_status !== "trial" && (
                <Button onClick={handleSubscribe} className="bg-primary hover:bg-primary/90 rounded-full px-6 gap-2" data-testid="subscribe-btn">
                  <CreditCard className="w-4 h-4" /> S'abonner
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="profile" className="rounded-full">Profil</TabsTrigger>
            <TabsTrigger value="jams" className="rounded-full">Boeufs</TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full">Concerts</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-full">Planning</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full">Notifications</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full">Avis</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-xl">Profil de l'établissement</h2>
                {!editing ? (
                  <Button variant="ghost" onClick={() => setEditing(true)} className="gap-2" data-testid="edit-profile-btn">
                    <Edit className="w-4 h-4" /> Modifier
                  </Button>
                ) : (
                  <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 rounded-full gap-2" data-testid="save-profile-btn">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Sauvegarder
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" data-testid="venue-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Photo de profil</Label>
                    <VenueImageUpload
                      value={formData.profile_image}
                      onChange={(url) => setFormData({ ...formData, profile_image: url })}
                      token={token}
                      photoType="profile"
                      disabled={!editing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo de couverture</Label>
                    <VenueImageUpload
                      value={formData.cover_image}
                      onChange={(url) => setFormData({ ...formData, cover_image: url })}
                      token={token}
                      photoType="cover"
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={!editing} rows={3} className="bg-black/20 border-white/10 disabled:opacity-70" />
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Adresse</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input placeholder="Adresse" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={!editing} className="md:col-span-2 bg-black/20 border-white/10 disabled:opacity-70" />
                    <Input placeholder="Code postal" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Ville" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" data-testid="venue-city" />
                    {editing && <Button type="button" onClick={geocodeAddress} variant="outline" className="border-white/20"><MapPin className="w-4 h-4 mr-2" /> Géolocaliser</Button>}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Liens</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Site web" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                    <Input placeholder="Facebook" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                    <Input placeholder="Instagram" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Équipements & Services</Label>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2"><Switch checked={formData.has_stage} onCheckedChange={(c) => setFormData({ ...formData, has_stage: c })} disabled={!editing} /><Label>Scène</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={formData.has_sound_engineer} onCheckedChange={(c) => setFormData({ ...formData, has_sound_engineer: c })} disabled={!editing} /><Label>Ingé son</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={formData.has_pa_system} onCheckedChange={(c) => setFormData({ ...formData, has_pa_system: c })} disabled={!editing} /><Label>Sono</Label></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Styles musicaux</Label>
                  {editing && <Input placeholder="Appuyez Entrée" onKeyPress={(e) => { if (e.key === 'Enter') { addToList('music_styles', e.target.value, formData, setFormData); e.target.value = ''; } }} className="bg-black/20 border-white/10" />}
                  <div className="flex flex-wrap gap-2">
                    {formData.music_styles.map((style, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1">
                        {style}
                        {editing && <button onClick={() => removeFromList('music_styles', style, formData, setFormData)}><X className="w-3 h-3" /></button>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Jams Tab */}
          <TabsContent value="jams">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-xl">Boeufs Musicaux</h2>
                <Dialog open={showJamDialog} onOpenChange={setShowJamDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2"><Plus className="w-4 h-4" /> Nouveau boeuf</Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Créer un boeuf musical</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={jamForm.date} onChange={(e) => setJamForm({ ...jamForm, date: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Début</Label>
                          <Input type="time" value={jamForm.start_time} onChange={(e) => setJamForm({ ...jamForm, start_time: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fin</Label>
                          <Input type="time" value={jamForm.end_time} onChange={(e) => setJamForm({ ...jamForm, end_time: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Styles musicaux</Label>
                        <Input placeholder="Entrée pour ajouter" onKeyPress={(e) => { if (e.key === 'Enter') { addToList('music_styles', e.target.value, jamForm, setJamForm); e.target.value = ''; } }} className="bg-black/20 border-white/10" />
                        <div className="flex flex-wrap gap-2">
                          {jamForm.music_styles.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-1">{s}<button onClick={() => removeFromList('music_styles', s, jamForm, setJamForm)}><X className="w-3 h-3" /></button></span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Règlement</Label>
                        <Textarea value={jamForm.rules} onChange={(e) => setJamForm({ ...jamForm, rules: e.target.value })} className="bg-black/20 border-white/10" rows={2} />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2"><Switch checked={jamForm.has_instruments} onCheckedChange={(c) => setJamForm({ ...jamForm, has_instruments: c })} /><Label>Instruments dispo</Label></div>
                        <div className="flex items-center gap-2"><Switch checked={jamForm.has_pa_system} onCheckedChange={(c) => setJamForm({ ...jamForm, has_pa_system: c })} /><Label>Sono dispo</Label></div>
                      </div>
                      {jamForm.has_instruments && (
                        <div className="space-y-2">
                          <Label>Instruments disponibles</Label>
                          <Input placeholder="Entrée pour ajouter" onKeyPress={(e) => { if (e.key === 'Enter') { addToList('instruments_available', e.target.value, jamForm, setJamForm); e.target.value = ''; } }} className="bg-black/20 border-white/10" />
                          <div className="flex flex-wrap gap-2">
                            {jamForm.instruments_available.map((s, i) => (
                              <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs flex items-center gap-1">{s}<button onClick={() => removeFromList('instruments_available', s, jamForm, setJamForm)}><X className="w-3 h-3" /></button></span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Infos complémentaires</Label>
                        <Textarea value={jamForm.additional_info} onChange={(e) => setJamForm({ ...jamForm, additional_info: e.target.value })} className="bg-black/20 border-white/10" rows={2} />
                      </div>
                      <Button onClick={createJam} className="w-full bg-primary hover:bg-primary/90 rounded-full">Créer</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {jams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun boeuf musical planifié</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jams.map((jam) => (
                    <div key={jam.id} className="glassmorphism rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-heading font-semibold text-lg">{jam.date}</p>
                          <p className="text-muted-foreground">{jam.start_time} - {jam.end_time}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteJam(jam.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {jam.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{s}</span>)}
                      </div>
                      {jam.has_instruments && <p className="text-sm text-secondary mt-2">Instruments sur place</p>}
                      {jam.has_pa_system && <p className="text-sm text-secondary">Sono disponible</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Concerts Tab */}
          <TabsContent value="concerts">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-xl">Concerts</h2>
                <Dialog open={showConcertDialog} onOpenChange={setShowConcertDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2"><Plus className="w-4 h-4" /> Nouveau concert</Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Créer un concert</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={concertForm.date} onChange={(e) => setConcertForm({ ...concertForm, date: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure</Label>
                          <Input type="time" value={concertForm.start_time} onChange={(e) => setConcertForm({ ...concertForm, start_time: e.target.value })} className="bg-black/20 border-white/10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input value={concertForm.title} onChange={(e) => setConcertForm({ ...concertForm, title: e.target.value })} className="bg-black/20 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix</Label>
                        <Input value={concertForm.price} onChange={(e) => setConcertForm({ ...concertForm, price: e.target.value })} placeholder="Ex: Gratuit, 10€, PAF" className="bg-black/20 border-white/10" />
                      </div>
                      
                      {/* Bands */}
                      <div className="space-y-2">
                        <Label>Groupes / Artistes</Label>
                        <div className="p-4 border border-white/10 rounded-xl space-y-3">
                          <Input placeholder="Nom du groupe" value={newBand.name} onChange={(e) => setNewBand({ ...newBand, name: e.target.value })} className="bg-black/20 border-white/10" />
                          <select value={newBand.musician_id} onChange={(e) => setNewBand({ ...newBand, musician_id: e.target.value })} className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white">
                            <option value="">Lier à un musicien (optionnel)</option>
                            {musicians.map(m => <option key={m.id} value={m.id}>{m.pseudo}</option>)}
                          </select>
                          <Button type="button" onClick={addBandToConcert} variant="outline" className="w-full border-white/20">Ajouter le groupe</Button>
                        </div>
                        <div className="space-y-2">
                          {concertForm.bands.map((band, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                              <span>{band.name}</span>
                              <Button variant="ghost" size="sm" onClick={() => setConcertForm({ ...concertForm, bands: concertForm.bands.filter((_, idx) => idx !== i) })}><X className="w-4 h-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={concertForm.description} onChange={(e) => setConcertForm({ ...concertForm, description: e.target.value })} className="bg-black/20 border-white/10" rows={2} />
                      </div>
                      <Button onClick={createConcert} className="w-full bg-primary hover:bg-primary/90 rounded-full">Créer</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {concerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun concert planifié</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {concerts.map((concert) => (
                    <div key={concert.id} className="glassmorphism rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-heading font-semibold text-lg">{concert.title || "Concert"}</p>
                          <p className="text-muted-foreground">{concert.date} à {concert.start_time}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteConcert(concert.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                      {concert.bands?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-1">Artistes:</p>
                          {concert.bands.map((b, i) => <p key={i} className="text-white">{b.name}</p>)}
                        </div>
                      )}
                      {concert.price && <p className="text-sm text-secondary mt-2">{concert.price}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-xl">Dates ouvertes aux candidatures</h2>
                <Dialog open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary hover:bg-secondary/90 rounded-full gap-2"><Plus className="w-4 h-4" /> Nouvelle date</Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10">
                    <DialogHeader><DialogTitle>Proposer une date</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={planningForm.date} onChange={(e) => setPlanningForm({ ...planningForm, date: e.target.value })} className="bg-black/20 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Styles recherchés</Label>
                        <Input placeholder="Entrée pour ajouter" onKeyPress={(e) => { if (e.key === 'Enter') { addToList('music_styles', e.target.value, planningForm, setPlanningForm); e.target.value = ''; } }} className="bg-black/20 border-white/10" />
                        <div className="flex flex-wrap gap-2">
                          {planningForm.music_styles.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs flex items-center gap-1">{s}<button onClick={() => removeFromList('music_styles', s, planningForm, setPlanningForm)}><X className="w-3 h-3" /></button></span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={planningForm.description} onChange={(e) => setPlanningForm({ ...planningForm, description: e.target.value })} className="bg-black/20 border-white/10" rows={2} />
                      </div>
                      <Button onClick={createPlanningSlot} className="w-full bg-secondary hover:bg-secondary/90 rounded-full">Publier</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {planningSlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune date ouverte aux candidatures</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planningSlots.map((slot) => (
                    <div key={slot.id} className="glassmorphism rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-heading font-semibold text-lg">{slot.date}</p>
                          <p className="text-muted-foreground">{slot.applications_count} candidature(s)</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewApplications(slot.id)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deletePlanningSlot(slot.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {slot.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">{s}</span>)}
                      </div>
                      {!slot.is_open && <p className="text-sm text-primary mt-2">Date pourvue</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Applications Dialog */}
              <Dialog open={!!viewingApplications} onOpenChange={() => setViewingApplications(null)}>
                <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Candidatures</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    {(!applications[viewingApplications] || applications[viewingApplications].length === 0) ? (
                      <p className="text-muted-foreground text-center py-4">Aucune candidature</p>
                    ) : applications[viewingApplications].map((app) => (
                      <div key={app.id} className="p-4 border border-white/10 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-heading font-semibold">{app.band_name}</p>
                            <p className="text-sm text-muted-foreground">{app.music_style}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${app.status === 'accepted' ? 'bg-green-500/20 text-green-400' : app.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {app.status === 'accepted' ? 'Accepté' : app.status === 'rejected' ? 'Refusé' : 'En attente'}
                          </span>
                        </div>
                        {app.description && <p className="text-sm mt-2">{app.description}</p>}
                        {app.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            <Button onClick={() => handleApplication(app.id, 'accept')} className="flex-1 bg-green-500 hover:bg-green-600 rounded-full">Accepter</Button>
                            <Button onClick={() => handleApplication(app.id, 'reject')} variant="outline" className="flex-1 border-destructive text-destructive rounded-full">Refuser</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Broadcast Notification Form */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">📢 Envoyer une notification</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Envoyez un message à tous les musiciens dans un rayon de 100 km autour de votre établissement.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="broadcast-message">Message</Label>
                    <Textarea
                      id="broadcast-message"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Ex: Recherche batteur pour jam session ce soir à 21h..."
                      rows={4}
                      className="bg-black/20 border-white/10 mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {broadcastMessage.length} caractères
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        <strong>{nearbyMusiciansCount}</strong> musicien(s) dans un rayon de 100 km
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={sendBroadcastNotification}
                    disabled={sendingBroadcast || !broadcastMessage.trim()}
                    className="w-full bg-primary hover:bg-primary/90 rounded-full gap-2"
                  >
                    {sendingBroadcast ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Envoyer la notification
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Broadcast History */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">Historique des notifications</h2>
                
                {broadcastHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune notification envoyée pour le moment
                  </p>
                ) : (
                  <div className="space-y-3">
                    {broadcastHistory.map((broadcast) => (
                      <div key={broadcast.id} className="p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(broadcast.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                            {broadcast.recipients_count} destinataires
                          </span>
                        </div>
                        <p className="text-sm">{broadcast.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="space-y-6">
              {/* Rating Summary */}
              <div className="glassmorphism rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading font-semibold text-xl mb-2">Gestion des avis</h2>
                    {totalReviews > 0 && (
                      <div className="flex items-center gap-4">
                        <StarRating rating={averageRating} />
                        <span className="text-muted-foreground">{totalReviews} avis</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="show-reviews">Afficher publiquement</Label>
                    <Switch
                      id="show-reviews"
                      checked={showReviews}
                      onCheckedChange={toggleReviewsVisibility}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {showReviews
                    ? "Les avis sont visibles sur votre page publique"
                    : "Les avis sont masqués de votre page publique"}
                </p>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis reçu pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className={`glassmorphism rounded-xl p-5 ${review.is_reported ? 'border-2 border-red-500/50' : ''}`}>
                      {review.is_reported && (
                        <div className="mb-3 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Avis signalé comme inapproprié
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {review.musician_image ? (
                            <img src={review.musician_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{review.musician_name}</p>
                            <StarRating rating={review.rating} size="w-4 h-4" showNumber={false} />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}

                      {review.venue_response ? (
                        <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-primary/5 p-3 rounded">
                          <p className="text-sm font-semibold text-primary mb-1">Votre réponse</p>
                          <p className="text-sm">{review.venue_response}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(review.venue_response_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4">
                          {respondingTo === review.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Votre réponse..."
                                className="bg-black/20 border-white/10"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => respondToReview(review.id)}
                                  className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                                >
                                  Publier
                                </Button>
                                <Button
                                  onClick={() => {
                                    setRespondingTo(null);
                                    setResponseText("");
                                  }}
                                  variant="outline"
                                  className="flex-1 rounded-full"
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setRespondingTo(review.id)}
                              variant="outline"
                              className="rounded-full"
                            >
                              Répondre à cet avis
                            </Button>
                          )}
                        </div>
                      )}
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
