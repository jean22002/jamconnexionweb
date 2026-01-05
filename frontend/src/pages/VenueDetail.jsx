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
  Check, Clock, Guitar, Bell, BellOff, CalendarIcon, Send, Users, User, AlertCircle, Heart
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
  const [musicianProfile, setMusicianProfile] = useState(null);
  const [selectedBandOrSolo, setSelectedBandOrSolo] = useState("");
  const [activeEvents, setActiveEvents] = useState([]);
  const [currentParticipation, setCurrentParticipation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bandsPlayed, setBandsPlayed] = useState([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

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

  const handleSubscribe = async () => {
    if (!token || !user || user.role !== "musician") {
      toast.error("Connectez-vous en tant que musicien pour vous connecter");
      return;
    }

    setSubscribing(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        await axios.post(
          `${API}/venues/${id}/unsubscribe`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsSubscribed(false);
        toast.success("Déconnecté de cet établissement");
      } else {
        // Subscribe
        await axios.post(
          `${API}/venues/${id}/subscribe`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsSubscribed(true);
        toast.success("Connecté à cet établissement ! Il apparaîtra dans votre onglet Connexions.");
      }
      fetchVenue(); // Refresh subscriber count
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la connexion");
    } finally {
      setSubscribing(false);
    }
  };

  const fetchBandsPlayed = useCallback(async () => {
    setLoadingBands(true);
    try {
      const response = await axios.get(`${API}/venues/${id}/bands-played`);
      setBandsPlayed(response.data);
    } catch (error) {
      console.error("Error fetching bands:", error);
    } finally {
      setLoadingBands(false);
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
    fetchReviews();
    fetchBandsPlayed();
    checkSubscription();
  }, [fetchVenue, fetchEvents, fetchActiveEvents, fetchReviews, fetchBandsPlayed, checkSubscription]);

  useEffect(() => {
    checkSubscription();
    fetchCurrentParticipation();
  }, [checkSubscription, fetchCurrentParticipation]);

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
    // Load musician profile to get bands
    if (!musicianProfile && token) {
      fetchMusicianProfile();
    }
  };

  const fetchMusicianProfile = async () => {
    try {
      const response = await axios.get(`${API}/musicians/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMusicianProfile(response.data);
    } catch (error) {
      console.error("Error fetching musician profile:", error);
    }
  };

  const handleBandSelection = (value) => {
    setSelectedBandOrSolo(value);
    
    if (value === "solo") {
      // Fill form with solo profile data
      const soloProfile = musicianProfile?.solo_profile || {};
      setApplicationForm({
        band_name: `${musicianProfile?.pseudo || "Artiste solo"}`,
        band_photo: musicianProfile?.profile_image || "",
        description: soloProfile.bio || musicianProfile?.bio || "",
        music_style: soloProfile.music_styles?.join(", ") || musicianProfile?.music_styles?.join(", ") || "",
        links: {
          facebook: soloProfile.facebook || musicianProfile?.facebook || "",
          instagram: soloProfile.instagram || musicianProfile?.instagram || "",
          youtube: soloProfile.youtube || musicianProfile?.youtube || "",
          website: soloProfile.website || musicianProfile?.website || "",
          bandcamp: soloProfile.bandcamp || musicianProfile?.bandcamp || ""
        },
        contact_email: musicianProfile?.email || "",
        contact_phone: musicianProfile?.phone || ""
      });
    } else {
      // Find selected band and fill form with band data
      const selectedBand = musicianProfile?.bands?.find(b => b.name === value);
      if (selectedBand) {
        setApplicationForm({
          band_name: selectedBand.name,
          band_photo: selectedBand.photo || "",
          description: selectedBand.bio || "",
          music_style: selectedBand.music_styles?.join(", ") || "",
          links: {
            facebook: selectedBand.facebook || "",
            instagram: selectedBand.instagram || "",
            youtube: selectedBand.youtube || "",
            website: selectedBand.website || "",
            bandcamp: selectedBand.bandcamp || ""
          },
          contact_email: musicianProfile?.email || "",
          contact_phone: musicianProfile?.phone || ""
        });
      }
    }
  };

  const handleParticipationChange = () => {
    fetchCurrentParticipation();
    fetchActiveEvents();
    fetchEvents(); // Rafraîchir les concerts pour mettre à jour le compteur
  };

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
                    onClick={handleSubscribe} 
                    disabled={subscribing}
                    size="lg"
                    className={`
                      rounded-full px-6 py-3 gap-2 font-bold transition-all transform hover:scale-105 shadow-lg
                      ${isSubscribed 
                        ? 'bg-muted hover:bg-muted/80 text-foreground border-2 border-white/20' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/50'
                      }
                    `}
                    data-testid="subscribe-btn"
                  >
                    {subscribing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                    ) : isSubscribed ? (
                      <><Check className="w-4 h-4" /> Connecté</>
                    ) : (
                      <><Heart className="w-4 h-4 fill-current" /> Se connecter</>
                    )}
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
          <TabsList className="grid w-full grid-cols-7 bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="info" className="rounded-full">Infos</TabsTrigger>
            <TabsTrigger value="jams" className="rounded-full">Boeufs ({jams.length})</TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full">Concerts ({concerts.length})</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-full">Candidatures ({planningSlots.length})</TabsTrigger>
            <TabsTrigger value="bands" className="rounded-full">Groupes ({bandsPlayed.length})</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full">Avis ({totalReviews})</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-full">Galerie ({venue?.gallery?.length || 0})</TabsTrigger>
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-heading font-semibold text-lg">{jam.date}</p>
                        <p className="text-muted-foreground">{jam.start_time} - {jam.end_time}</p>
                      </div>
                      {jam.participants_count !== undefined && (
                        <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {jam.participants_count}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {jam.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{s}</span>)}
                    </div>
                    {jam.has_instruments && <p className="text-sm text-secondary mt-2">🎸 Instruments sur place</p>}
                    {jam.has_pa_system && <p className="text-sm text-secondary">🔊 Sono disponible</p>}
                    {jam.rules && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-muted-foreground"><strong>Règlement:</strong> {jam.rules}</p>
                      </div>
                    )}
                    {user?.role === "musician" && (
                      <div className="mt-4">
                        <JoinEventButton 
                          event={{ ...jam, type: 'jam' }}
                          venueId={id}
                          token={token}
                          currentParticipation={currentParticipation}
                          onParticipationChange={handleParticipationChange}
                        />
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
                    
                    {/* Afficher le nombre de participants si > 0 */}
                    {concert.participants_count > 0 && (
                      <p className="text-sm text-green-400 mt-2">👥 {concert.participants_count} participant{concert.participants_count > 1 ? 's' : ''}</p>
                    )}
                    
                    {/* Bouton "Je participe" pour les musiciens */}
                    {user?.role === "musician" && (
                      <div className="mt-4">
                        <JoinEventButton 
                          event={{ ...concert, type: 'concert' }}
                          venueId={id}
                          token={token}
                          currentParticipation={currentParticipation}
                          onParticipationChange={handleParticipationChange}
                        />
                      </div>
                    )}
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
                    <div className="space-y-3">
                      <div>
                        <p className="font-heading font-semibold text-lg">{slot.date}</p>
                        {slot.time && <p className="text-primary text-sm">🕐 {slot.time}</p>}
                        {slot.title && <p className="text-sm font-medium mt-1">{slot.title}</p>}
                      </div>
                      
                      {slot.music_styles && slot.music_styles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {slot.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">{s}</span>)}
                        </div>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        {slot.expected_band_style && (
                          <p className="text-muted-foreground">🎸 Style recherché: {slot.expected_band_style}</p>
                        )}
                        {slot.expected_attendance > 0 && (
                          <p className="text-muted-foreground">👥 Affluence: ~{slot.expected_attendance} personnes</p>
                        )}
                        {slot.payment && (
                          <p className="text-green-400">💰 {slot.payment}</p>
                        )}
                        {slot.has_catering && (
                          <p className="text-muted-foreground">🍽️ Catering disponible</p>
                        )}
                        {slot.has_accommodation && (
                          <p className="text-muted-foreground">🛏️ Hébergement disponible</p>
                        )}
                      </div>
                      
                      {slot.description && (
                        <p className="text-sm text-muted-foreground border-t border-white/10 pt-3">{slot.description}</p>
                      )}
                    </div>
                    
                    <Button onClick={() => openApplyDialog(slot)} className="w-full mt-4 bg-secondary hover:bg-secondary/90 rounded-full gap-2" data-testid={`apply-btn-${slot.id}`}>
                      <Send className="w-4 h-4" /> Postuler
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Application Dialog */}
            <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
              <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Postuler pour le {selectedSlot?.date}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Sélectionnez votre groupe ou profil solo *</Label>
                    <select 
                      value={selectedBandOrSolo} 
                      onChange={(e) => handleBandSelection(e.target.value)}
                      className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
                    >
                      <option value="">-- Choisissez --</option>
                      <option value="solo">🎤 Mon profil Solo</option>
                      {musicianProfile?.bands?.map((band, idx) => (
                        <option key={idx} value={band.name}>
                          🎸 {band.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Vous ne pouvez postuler qu'avec vos propres groupes ou votre profil solo
                    </p>
                  </div>

                  {/* Display band/solo card if selected */}
                  {selectedBandOrSolo && applicationForm.band_name && (
                    <div className="p-4 bg-black/20 border border-white/10 rounded-xl space-y-3">
                      <div className="flex items-start gap-4">
                        {applicationForm.band_photo ? (
                          <img 
                            src={applicationForm.band_photo} 
                            alt={applicationForm.band_name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                            <Music className="w-10 h-10 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold text-lg">{applicationForm.band_name}</h3>
                          {applicationForm.music_style && (
                            <p className="text-sm text-primary">{applicationForm.music_style}</p>
                          )}
                          {selectedBandOrSolo !== "solo" && musicianProfile?.bands && (
                            (() => {
                              const band = musicianProfile.bands.find(b => b.name === selectedBandOrSolo);
                              return band && (
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                  {band.band_type && <span>• {band.band_type}</span>}
                                  {band.members_count && <span>• {band.members_count} membres</span>}
                                  {band.has_sound_engineer && <span>• Ingé son</span>}
                                  {band.show_duration && <span>• {band.show_duration}</span>}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </div>
                      {applicationForm.description && (
                        <p className="text-sm text-muted-foreground">{applicationForm.description}</p>
                      )}
                      {(applicationForm.links.facebook || applicationForm.links.instagram || applicationForm.links.youtube) && (
                        <div className="flex gap-2">
                          {applicationForm.links.facebook && (
                            <a href={applicationForm.links.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Facebook className="w-4 h-4" />
                            </a>
                          )}
                          {applicationForm.links.instagram && (
                            <a href={applicationForm.links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {applicationForm.links.youtube && (
                            <a href={applicationForm.links.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Music className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Message supplémentaire (optionnel)</Label>
                    <Textarea 
                      value={applicationForm.description} 
                      onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })} 
                      className="bg-black/20 border-white/10" 
                      rows={3}
                      placeholder="Ajoutez un message personnalisé pour l'établissement..."
                    />
                  </div>

                  <Button 
                    onClick={submitApplication} 
                    className="w-full bg-secondary hover:bg-secondary/90 rounded-full"
                    disabled={!selectedBandOrSolo}
                  >
                    Envoyer ma candidature
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Bands Tab */}
          <TabsContent value="bands">
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-semibold text-xl mb-2">🎸 Groupes qui ont joué ici</h2>
                  <p className="text-muted-foreground text-sm">
                    Découvrez les groupes qui se sont produits dans ce lieu
                  </p>
                </div>
              </div>

              {loadingBands ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : bandsPlayed.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun groupe n'a encore joué dans ce lieu</p>
                  <p className="text-sm mt-2">Les groupes apparaîtront ici après leurs concerts</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bandsPlayed.map((band, index) => (
                    <div key={index} className="card-venue p-5 hover:border-primary/30 transition-all">
                      <div className="flex flex-col items-center text-center">
                        {band.photo ? (
                          <img 
                            src={band.photo} 
                            alt={band.band_name} 
                            className="w-24 h-24 rounded-full object-cover mb-4"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mb-4">
                            <Music className="w-12 h-12 text-primary" />
                          </div>
                        )}
                        
                        <h3 className="font-heading font-semibold text-lg mb-2">{band.band_name}</h3>
                        
                        {band.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {band.description}
                          </p>
                        )}
                        
                        {band.music_styles && band.music_styles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3 justify-center">
                            {band.music_styles.slice(0, 3).map((style, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                {style}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {band.last_played && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Dernier concert : {new Date(band.last_played).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        
                        {/* Social Links */}
                        <div className="flex gap-2 mt-2">
                          {band.facebook && (
                            <a href={band.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                          )}
                          {band.instagram && (
                            <a href={band.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-pink-500/20 hover:bg-pink-500/30 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                          )}
                          {band.youtube && (
                            <a href={band.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            </a>
                          )}
                          {band.website && (
                            <a href={band.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-green-500/20 hover:bg-green-500/30 transition-colors">
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="space-y-6">
              {/* Average Rating Summary */}
              {totalReviews > 0 && (
                <div className="glassmorphism rounded-2xl p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <StarRating rating={averageRating} size="w-8 h-8" showNumber={false} />
                    <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
                    <p className="text-muted-foreground">{totalReviews} avis</p>
                  </div>
                </div>
              )}

              {/* Add Review Button */}
              {user?.role === "musician" && (
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-full gap-2">
                      <Send className="w-4 h-4" />
                      Laisser un avis
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10 max-w-md">
                    <DialogHeader>
                      <DialogTitle>Laisser un avis pour {venue?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Votre note</Label>
                        <div className="flex justify-center">
                          <StarRatingInput
                            rating={reviewForm.rating}
                            onRatingChange={(rating) => setReviewForm({ ...reviewForm, rating })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Commentaire (optionnel)</Label>
                        <Textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="Partagez votre expérience..."
                          className="bg-black/20 border-white/10"
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={submitReview}
                        disabled={submittingReview}
                        className="w-full bg-primary hover:bg-primary/90 rounded-full"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Publication...
                          </>
                        ) : (
                          "Publier l'avis"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis pour le moment</p>
                  <p className="text-sm mt-2">Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="glassmorphism rounded-xl p-5">
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {user && user.id !== review.musician_user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reportReview(review.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}

                      {review.venue_response && (
                        <div className="mt-4 pl-4 border-l-2 border-primary/30">
                          <p className="text-sm font-semibold text-primary mb-1">
                            Réponse de l'établissement
                          </p>
                          <p className="text-sm text-muted-foreground">{review.venue_response}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(review.venue_response_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <div className="space-y-6">
              {!venue?.gallery || venue.gallery.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune photo disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.gallery.map((photo, index) => (
                    <div key={index} className="group cursor-pointer">
                      <img 
                        src={photo} 
                        alt={`${venue.name} - Photo ${index + 1}`}
                        className="w-full h-64 object-cover rounded-xl transition-transform group-hover:scale-105"
                        onClick={() => window.open(photo, '_blank')}
                      />
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
