import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "../components/ui/dialog";
import { 
  Music, MapPin, Globe, Instagram, Facebook, Phone, ArrowLeft, Loader2, 
  Check, Clock, Guitar, Bell, BellOff, CalendarIcon, Send, Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import JoinEventButton from "../components/JoinEventButton";
import { StarRating, StarRatingInput } from "../components/StarRating";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const venueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [jams, setJams] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [planningSlots, setPlanningSlots] = useState([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    band_name: "", band_photo: "", description: "", music_style: "",
    links: { facebook: "", instagram: "", youtube: "" },
    contact_email: "", contact_phone: ""
  });
  const [activeEvents, setActiveEvents] = useState([]);
  const [currentParticipation, setCurrentParticipation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchVenue = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues/${id}`);
      setVenue(response.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEvents = useCallback(async () => {
    try {
      const [jamsRes, concertsRes, planningRes] = await Promise.all([
        axios.get(`${API}/venues/${id}/jams`),
        axios.get(`${API}/venues/${id}/concerts`),
        axios.get(`${API}/venues/${id}/planning`)
      ]);
      setJams(jamsRes.data);
      setConcerts(concertsRes.data);
      setPlanningSlots(planningRes.data.filter(s => s.is_open));
    } catch (error) {
      console.error("Error:", error);
    }
  }, [id]);

  const checkSubscription = useCallback(async () => {
    if (!token || !user || user.role !== "musician") return;
    try {
      const response = await axios.get(`${API}/venues/${id}/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSubscribed(response.data.subscribed);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [id, token, user]);

  const fetchActiveEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues/${id}/active-events`);
      setActiveEvents(response.data);
    } catch (error) {
      console.error("Error fetching active events:", error);
    }
  }, [id]);

  const fetchCurrentParticipation = useCallback(async () => {
    if (!token || !user || user.role !== "musician") return;
    try {
      const response = await axios.get(`${API}/musicians/me/current-participation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentParticipation(response.data);
    } catch (error) {
      console.error("Error fetching participation:", error);
    }
  }, [token, user]);

  useEffect(() => {
    fetchVenue();
    fetchEvents();
    fetchActiveEvents();
  }, [fetchVenue, fetchEvents, fetchActiveEvents]);

  useEffect(() => {
    checkSubscription();
    fetchCurrentParticipation();
  }, [checkSubscription, fetchCurrentParticipation]);

  const toggleSubscription = async () => {
    if (!token) {
      toast.error("Connectez-vous pour vous abonner");
      return;
    }
    try {
      if (isSubscribed) {
        await axios.delete(`${API}/venues/${id}/subscribe`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Désabonné");
      } else {
        await axios.post(`${API}/venues/${id}/subscribe`, {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Abonné! Vous recevrez les notifications");
      }
      setIsSubscribed(!isSubscribed);
      fetchVenue();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const submitApplication = async () => {
    if (!selectedSlot) return;
    try {
      await axios.post(`${API}/applications`, {
        planning_slot_id: selectedSlot.id,
        ...applicationForm
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Candidature envoyée!");
      setShowApplyDialog(false);
      setApplicationForm({ band_name: "", band_photo: "", description: "", music_style: "", links: { facebook: "", instagram: "", youtube: "" }, contact_email: "", contact_phone: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const openApplyDialog = (slot) => {
    if (!token) {
      toast.error("Connectez-vous pour postuler");
      return;
    }
    if (user?.role !== "musician") {
      toast.error("Seuls les musiciens peuvent postuler");
      return;
    }
    setSelectedSlot(slot);
    setShowApplyDialog(true);
  };

  const handleParticipationChange = () => {
    fetchCurrentParticipation();
    fetchActiveEvents();
  };

  const fetchReviews = useCallback(async () => {
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        axios.get(`${API}/venues/${id}/reviews`),
        axios.get(`${API}/venues/${id}/average-rating`)
      ]);
      setReviews(reviewsRes.data);
      setAverageRating(ratingRes.data.average_rating);
      setTotalReviews(ratingRes.data.total_reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [id]);

  const submitReview = async () => {
    if (!token) {
      toast.error("Connectez-vous pour laisser un avis");
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(`${API}/reviews`, {
        venue_id: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success("Avis publié ! Merci pour votre retour 🎵");
      setShowReviewDialog(false);
      setReviewForm({ rating: 5, comment: "" });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la publication de l'avis");
    } finally {
      setSubmittingReview(false);
    }
  };

  const reportReview = async (reviewId) => {
    if (!token) {
      toast.error("Connectez-vous pour signaler un avis");
      return;
    }

    try {
      await axios.post(`${API}/reviews/${reviewId}/report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Avis signalé");
      fetchReviews();
    } catch (error) {
      toast.error("Erreur lors du signalement");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Music className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Établissement non trouvé</p>
        <Link to="/"><Button className="bg-primary hover:bg-primary/90 rounded-full">Retour</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="venue-detail">
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
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={user?.role === "musician" ? "/musician" : "/"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8">
          <div className="h-64 md:h-80" style={{
            backgroundImage: venue.cover_image ? `url(${venue.cover_image})` : `url(https://images.pexels.com/photos/3784221/pexels-photo-3784221.jpeg)`,
            backgroundSize: 'cover', backgroundPosition: 'center'
          }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {venue.subscription_status === "active" && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Vérifié
                </span>
              )}
              {venue.has_stage && <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">Scène</span>}
              {venue.has_sound_engineer && <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs rounded-full">Ingé son</span>}
              {venue.has_pa_system && <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Sono</span>}
            </div>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">{venue.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{venue.address}, {venue.postal_code} {venue.city}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {user?.role === "musician" && (
                  <Button 
                    onClick={toggleSubscription} 
                    variant={isSubscribed ? "outline" : "default"}
                    className={`rounded-full gap-2 ${isSubscribed ? 'border-white/20' : 'bg-primary hover:bg-primary/90'}`}
                    data-testid="subscribe-btn"
                  >
                    {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    {isSubscribed ? "Abonné" : "S'abonner"}
                  </Button>
                )}
                
                {/* Show join button if there's an active event */}
                {user?.role === "musician" && activeEvents.length > 0 && (
                  <JoinEventButton 
                    event={activeEvents[0]}
                    venueId={id}
                    token={token}
                    currentParticipation={currentParticipation}
                    onParticipationChange={handleParticipationChange}
                  />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{venue.subscribers_count} abonnés</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="info" className="rounded-full">Infos</TabsTrigger>
            <TabsTrigger value="jams" className="rounded-full">Boeufs ({jams.length})</TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full">Concerts ({concerts.length})</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-full">Candidatures ({planningSlots.length})</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {venue.description && (
                  <div className="glassmorphism rounded-2xl p-6">
                    <h2 className="font-heading font-semibold text-lg mb-4">À propos</h2>
                    <p className="text-muted-foreground leading-relaxed">{venue.description}</p>
                  </div>
                )}

                {venue.music_styles?.length > 0 && (
                  <div className="glassmorphism rounded-2xl p-6">
                    <h2 className="font-heading font-semibold text-lg mb-4">Styles musicaux</h2>
                    <div className="flex flex-wrap gap-2">
                      {venue.music_styles.map((style, i) => (
                        <span key={i} className="px-4 py-2 bg-primary/20 text-primary rounded-full">{style}</span>
                      ))}
                    </div>
                  </div>
                )}

                {venue.equipment?.length > 0 && (
                  <div className="glassmorphism rounded-2xl p-6">
                    <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                      <Guitar className="w-5 h-5 text-primary" /> Matériel
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {venue.equipment.map((item, i) => (
                        <span key={i} className="px-4 py-2 bg-muted rounded-full text-muted-foreground">{item}</span>
                      ))}
                    </div>
                  </div>
                )}

                {venue.opening_hours && (
                  <div className="glassmorphism rounded-2xl p-6">
                    <h2 className="font-heading font-semibold text-lg mb-4">Horaires</h2>
                    <p className="text-muted-foreground">{venue.opening_hours}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="h-64 rounded-2xl overflow-hidden neon-border">
                  <MapContainer center={[venue.latitude, venue.longitude]} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[venue.latitude, venue.longitude]} icon={venueIcon} />
                  </MapContainer>
                </div>

                <div className="glassmorphism rounded-2xl p-6 space-y-4">
                  <h2 className="font-heading font-semibold text-lg">Contact</h2>
                  {venue.phone && (
                    <a href={`tel:${venue.phone}`} className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                      <Phone className="w-5 h-5 text-primary" /><span>{venue.phone}</span>
                    </a>
                  )}
                  {venue.website && (
                    <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                      <Globe className="w-5 h-5 text-primary" /><span>Site web</span>
                    </a>
                  )}
                  {venue.facebook && (
                    <a href={venue.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                      <Facebook className="w-5 h-5 text-blue-500" /><span>Facebook</span>
                    </a>
                  )}
                  {venue.instagram && (
                    <a href={`https://instagram.com/${venue.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                      <Instagram className="w-5 h-5 text-pink-500" /><span>{venue.instagram}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Jams Tab */}
          <TabsContent value="jams">
            {jams.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun boeuf musical à venir</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jams.map((jam) => (
                  <div key={jam.id} className="glassmorphism rounded-xl p-5">
                    <p className="font-heading font-semibold text-lg">{jam.date}</p>
                    <p className="text-muted-foreground">{jam.start_time} - {jam.end_time}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {jam.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{s}</span>)}
                    </div>
                    {jam.has_instruments && <p className="text-sm text-secondary mt-2">Instruments sur place</p>}
                    {jam.has_pa_system && <p className="text-sm text-secondary">Sono disponible</p>}
                    {jam.rules && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-muted-foreground"><strong>Règlement:</strong> {jam.rules}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Concerts Tab */}
          <TabsContent value="concerts">
            {concerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun concert à venir</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {concerts.map((concert) => (
                  <div key={concert.id} className="glassmorphism rounded-xl p-5">
                    <p className="font-heading font-semibold text-lg">{concert.title || "Concert"}</p>
                    <p className="text-muted-foreground">{concert.date} à {concert.start_time}</p>
                    {concert.bands?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Artistes:</p>
                        {concert.bands.map((b, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-white font-medium">{b.name}</span>
                            {b.facebook && <a href={b.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="w-4 h-4 text-blue-500" /></a>}
                            {b.instagram && <a href={b.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-4 h-4 text-pink-500" /></a>}
                          </div>
                        ))}
                      </div>
                    )}
                    {concert.price && <p className="text-sm text-secondary mt-2">{concert.price}</p>}
                    {concert.description && <p className="text-sm text-muted-foreground mt-2">{concert.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Planning/Applications Tab */}
          <TabsContent value="planning">
            {planningSlots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune date ouverte aux candidatures</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planningSlots.map((slot) => (
                  <div key={slot.id} className="glassmorphism rounded-xl p-5">
                    <p className="font-heading font-semibold text-lg">{slot.date}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {slot.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">{s}</span>)}
                    </div>
                    {slot.description && <p className="text-sm text-muted-foreground mt-2">{slot.description}</p>}
                    <Button onClick={() => openApplyDialog(slot)} className="w-full mt-4 bg-secondary hover:bg-secondary/90 rounded-full gap-2" data-testid={`apply-btn-${slot.id}`}>
                      <Send className="w-4 h-4" /> Postuler
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Application Dialog */}
            <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
              <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Postuler pour le {selectedSlot?.date}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nom du groupe/artiste *</Label>
                    <Input value={applicationForm.band_name} onChange={(e) => setApplicationForm({ ...applicationForm, band_name: e.target.value })} className="bg-black/20 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Style musical *</Label>
                    <Input value={applicationForm.music_style} onChange={(e) => setApplicationForm({ ...applicationForm, music_style: e.target.value })} className="bg-black/20 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description / Présentation</Label>
                    <Textarea value={applicationForm.description} onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })} className="bg-black/20 border-white/10" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo (URL)</Label>
                    <Input value={applicationForm.band_photo} onChange={(e) => setApplicationForm({ ...applicationForm, band_photo: e.target.value })} className="bg-black/20 border-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={applicationForm.contact_email} onChange={(e) => setApplicationForm({ ...applicationForm, contact_email: e.target.value })} className="bg-black/20 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={applicationForm.contact_phone} onChange={(e) => setApplicationForm({ ...applicationForm, contact_phone: e.target.value })} className="bg-black/20 border-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Liens réseaux sociaux</Label>
                    <Input placeholder="Facebook" value={applicationForm.links.facebook} onChange={(e) => setApplicationForm({ ...applicationForm, links: { ...applicationForm.links, facebook: e.target.value } })} className="bg-black/20 border-white/10" />
                    <Input placeholder="Instagram" value={applicationForm.links.instagram} onChange={(e) => setApplicationForm({ ...applicationForm, links: { ...applicationForm.links, instagram: e.target.value } })} className="bg-black/20 border-white/10" />
                    <Input placeholder="YouTube" value={applicationForm.links.youtube} onChange={(e) => setApplicationForm({ ...applicationForm, links: { ...applicationForm.links, youtube: e.target.value } })} className="bg-black/20 border-white/10" />
                  </div>
                  <Button onClick={submitApplication} className="w-full bg-secondary hover:bg-secondary/90 rounded-full">Envoyer ma candidature</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
