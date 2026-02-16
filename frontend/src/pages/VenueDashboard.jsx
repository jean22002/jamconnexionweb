import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { VenueImageUpload } from "../components/ui/image-upload";
import LazyImage from "../components/LazyImage";
import OnlineStatusSelector from "../components/OnlineStatusSelector";
import BackgroundSyncSettings from "../components/BackgroundSyncSettings";
// NEW: Import refactored utilities
import { buildImageUrl } from "../utils/urlBuilder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Calendar from "../components/Calendar";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { TimeSelect } from "../components/ui/time-select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { 
  Music, LogOut, MapPin, Globe, Instagram, Facebook, Phone, Edit, Save, 
  Loader2, CreditCard, Check, Clock, AlertCircle, X, Plus, CalendarIcon, 
  Users, Bell, Trash2, Eye, FileText, User, Youtube, Send, Heart, Plug, Award, MessageSquare, Trophy
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBadgeAutoCheck } from "../hooks/useBadgeAutoCheck";
import SocialLinks from "../components/SocialLinks";
import { StarRating } from "../components/StarRating";
import { toast } from "sonner";
import { MUSIC_STYLES_LIST } from "../data/music-styles";
import { useNotifications } from "../hooks/useNotifications";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Liste des instruments de base pour les bœufs
const INSTRUMENTS_BASE = [
  "Batterie",
  "Basse",
  "Guitare électrique",
  "Guitare acoustique",
  "Piano",
  "Clavier/Synthé",
  "Micro",
  "Ampli guitare",
  "Ampli basse"
];

export default function VenueDashboard() {
  const { user, token, logout, refreshUser } = useAuth();
  const { triggerBadgeCheck } = useBadgeAutoCheck();
  
  // Hook pour les notifications push
  useNotifications(token, user);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  
  // Events
  const [jams, setJams] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [karaokes, setKaraokes] = useState([]);
  const [spectacles, setSpectacles] = useState([]);
  const [planningSlots, setPlanningSlots] = useState([]);
  const [applications, setApplications] = useState({});
  const [musicians, setMusicians] = useState([]);
  
  // Dialogs
  const [showJamDialog, setShowJamDialog] = useState(false);
  const [showConcertDialog, setShowConcertDialog] = useState(false);
  const [showKaraokeDialog, setShowKaraokeDialog] = useState(false);
  const [showSpectacleDialog, setShowSpectacleDialog] = useState(false);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [viewingApplications, setViewingApplications] = useState(null);
  
  // Broadcast notifications
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [nearbyMusiciansCount, setNearbyMusiciansCount] = useState(0);
  const [subscribers, setSubscribers] = useState([]); // Liste des abonnés (Jacks)
  const [bandSuggestions, setBandSuggestions] = useState([]);
  const [showBandSuggestions, setShowBandSuggestions] = useState(false);
  
  // Planning calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [editingPlanningSlotId, setEditingPlanningSlotId] = useState(null); // Pour tracker si on édite un créneau existant
  const [bookedDates, setBookedDates] = useState([]); // Ancien système simple
  const [eventsByDate, setEventsByDate] = useState({}); // Nouveau : {date: type} où type = 'concert' ou 'jam'
  const [planningForm, setPlanningForm] = useState({
    date: '',
    time: '',
    title: '',
    music_styles: [],
    description: '',
    expectedBandStyle: '',
    expectedAttendance: '',
    payment: '',
    payment_type: 'manual', // 'manual', 'hat', 'tickets'
    payment_base: '', // Base minimum pour "au chapeau"
    artist_categories: [],
    num_bands_needed: 1,
    application_type: 'bands', // 'bands', 'solo', or 'both'
    // Catering
    has_catering: false,
    catering_drinks: 0,
    catering_respect: false,
    catering_tbd: false,
    // Accommodation
    has_accommodation: false,
    accommodation_capacity: 0,
    accommodation_tbd: false
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState("subscribers"); // 'subscribers' or 'nearby'
  
  // Notifications states (comme pour les musiciens)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  
  // Event details modal states
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null); // 'concert', 'jam', or 'planning'
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviews, setShowReviews] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");
  
  // Profitability/History states
  const [pastEvents, setPastEvents] = useState([]);
  const [profitabilityStats, setProfitabilityStats] = useState(null);
  const [editingProfitability, setEditingProfitability] = useState(null);
  const [profitabilityForm, setProfitabilityForm] = useState({
    revenue: '',
    expenses: '',
    notes: ''
  });
  const [historyFilters, setHistoryFilters] = useState({
    period: 'all', // 'all', 'month', 'quarter', 'year', 'custom'
    type: 'all', // 'all', 'jam', 'concert'
    style: 'all', // 'all' ou un style musical spécifique
    customStartDate: '',
    customEndDate: ''
  });
  
  // Bands
  const [bands, setBands] = useState([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [bandFilters, setBandFilters] = useState({ department: "", city: "" });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedBand, setSelectedBand] = useState(null);
  const [messageForm, setMessageForm] = useState({ subject: "", content: "" });
  const [manualBandEntry, setManualBandEntry] = useState(false); // Mode saisie manuelle
  
  // Gallery
  const [gallery, setGallery] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", description: "", profile_image: "", cover_image: "",
    address: "", city: "", department: "", region: "", postal_code: "", latitude: 0, longitude: 0,
    phone: "", website: "", facebook: "", instagram: "",
    has_stage: false, has_sound_engineer: false, has_pa_system: false, has_lights: false,
    stage_size: "", // "5m²", "10m²", etc.
    // Sono details
    pa_mixer_name: "", // Nom de la table de mixage
    pa_speakers_name: "", // Nom des enceintes
    pa_power: "", // Puissance
    // Lights details
    has_auto_light: false, // Auto light
    has_light_table: false, // Table light
    equipment: [], music_styles: [], opening_hours: "",
    allow_messages_from: "everyone" // "everyone" or "connected_only"
  });

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!profile) return false;
    const requiredFields = ['name', 'address', 'city', 'postal_code', 'description', 'phone'];
    return requiredFields.every(field => profile[field] && profile[field].trim() !== '');
  };

  const [jamForm, setJamForm] = useState({
    date: "", start_time: "", end_time: "", music_styles: [],
    rules: "", has_instruments: false, has_pa_system: false,
    instruments_available: [], additional_info: ""
  });

  const [concertForm, setConcertForm] = useState({
    date: "", start_time: "", end_time: "", title: "", description: "",
    bands: [], price: "", music_styles: [],
    // Catering
    has_catering: false, catering_drinks: 0, catering_respect: false, catering_tbd: false,
    // Accommodation
    has_accommodation: false, accommodation_capacity: 0, accommodation_tbd: false
  });

  const [karaokeForm, setKaraokeForm] = useState({
    date: "", start_time: "", end_time: "", title: "", description: "",
    music_styles: [], has_catering: false, catering_drinks: 0
  });

  const [spectacleForm, setSpectacleForm] = useState({
    date: "", start_time: "", end_time: "", type: "", artist_name: "",
    description: "", price: ""
  });

  const [newBand, setNewBand] = useState({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(response.data);
      
      // Get subscription status
      setSubscriptionStatus(response.data.subscription_status);
      setTrialDaysLeft(response.data.trial_days_left);
      
      // Check if expired and redirect
      if (response.data.subscription_status === "expired") {
        navigate("/trial-expired");
        return;
      }
      
      // NEW: Use refactored buildImageUrl utility
      const profile_image_url = buildImageUrl(response.data.profile_image);
      const cover_image_url = buildImageUrl(response.data.cover_image);
        
        console.log('🔄 === FETCH PROFILE - Setting formData ===');
        console.log('📥 Raw images from API:', {
          profile_image_raw: response.data.profile_image,
          cover_image_raw: response.data.cover_image
        });
        console.log('🔗 Constructed URLs:', {
          profile_image_url,
          cover_image_url
        });
        
        setFormData({
          name: response.data.name || "",
          description: response.data.description || "",
          profile_image: profile_image_url,
          cover_image: cover_image_url,
          address: response.data.address || "",
          city: response.data.city || "",
          department: response.data.department || "",
          region: response.data.region || "",
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
          has_lights: response.data.has_lights || false,
          stage_size: response.data.stage_size || "",
          pa_mixer_name: response.data.pa_mixer_name || "",
          pa_speakers_name: response.data.pa_speakers_name || "",
          pa_power: response.data.pa_power || "",
          has_auto_light: response.data.has_auto_light || false,
          has_light_table: response.data.has_light_table || false,
          equipment: response.data.equipment || [],
          music_styles: response.data.music_styles || [],
          opening_hours: response.data.opening_hours || "",
          allow_messages_from: response.data.allow_messages_from || "everyone"
        });
        
        console.log('✅ FormData set with images:', {
          profile_image_url,
          cover_image_url
        });
    } catch (error) {
      if (error.response?.status === 404) setEditing(true);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]); // FIXED: Removed 'editing' from dependencies to prevent loop

  const fetchEvents = useCallback(async () => {
    if (!profile?.id) return; // Guard: Don't fetch if no profile ID yet
    
    try {
      const [jamsRes, concertsRes, karaokeRes, spectacleRes, planningRes] = await Promise.all([
        axios.get(`${API}/venues/${profile.id}/jams`),
        axios.get(`${API}/venues/${profile.id}/concerts`),
        axios.get(`${API}/venues/${profile.id}/karaoke`),
        axios.get(`${API}/venues/${profile.id}/spectacle`),
        axios.get(`${API}/venues/${profile.id}/planning`)
      ]);
      setJams(jamsRes.data);
      setConcerts(concertsRes.data);
      setKaraokes(karaokeRes.data);
      setSpectacles(spectacleRes.data);
      setPlanningSlots(planningRes.data);
      
      // Construire le tableau des dates réservées
      const bookedDatesArray = [
        ...jamsRes.data.map(j => j.date),
        ...concertsRes.data.map(c => c.date),
        ...karaokeRes.data.map(k => k.date),
        ...spectacleRes.data.map(s => s.date)
      ];
      setBookedDates(bookedDatesArray);
      
      // Construire l'objet des événements par date avec leur type
      const eventsMap = {};
      jamsRes.data.forEach(jam => {
        eventsMap[jam.date] = 'jam'; // Mauve pour les bœufs
      });
      concertsRes.data.forEach(concert => {
        eventsMap[concert.date] = 'concert'; // Vert pour les concerts
      });
      karaokeRes.data.forEach(karaoke => {
        eventsMap[karaoke.date] = 'karaoke'; // Couleur pour karaoké
      });
      spectacleRes.data.forEach(spectacle => {
        eventsMap[spectacle.date] = 'spectacle'; // Couleur pour spectacle
      });
      setEventsByDate(eventsMap);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [profile?.id]); // FIXED: Only depend on profile.id

  const fetchMusicians = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians`);
      setMusicians(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [token]);

  useEffect(() => {
    // Initial data load - only runs once on mount
    fetchProfile();
    fetchMusicians();
    fetchEvents();
    fetchNotifications();
    fetchSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run only once on mount

  // Polling pour rafraîchir les notifications toutes les 30 secondes (réduit de 15s à 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds instead of 15
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling pour rafraîchir les événements toutes les 60 secondes (réduit de 10s à 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 60000); // 60 seconds instead of 10
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    // 🔍 DEBUG: Log l'état complet de formData au moment de la sauvegarde
    console.log('🚀 === DÉBUT HANDLESA VE ===');
    console.log('📊 État de formData au moment de handleSave:', {
      profile_image: formData.profile_image,
      cover_image: formData.cover_image,
      name: formData.name
    });
    
    try {
      // Validate required fields
      if (!formData.name || !formData.address || !formData.city || !formData.postal_code) {
        toast.error("Veuillez remplir tous les champs obligatoires (nom, adresse, ville, code postal)");
        setSaving(false);
        return;
      }

      // Log pour debug
      console.log('💾 Saving profile with images:', {
        profile_image: formData.profile_image,
        cover_image: formData.cover_image
      });

      // If latitude/longitude are missing or zero, geocode the address
      let dataToSave = { ...formData };
      if (!dataToSave.latitude || !dataToSave.longitude || dataToSave.latitude === 0 || dataToSave.longitude === 0) {
        try {
          const geocodeResponse = await axios.post(`${API}/geocode`, {
            city: formData.city,
            postal_code: formData.postal_code
          });
          
          if (geocodeResponse.data) {
            dataToSave = {
              ...dataToSave,
              latitude: geocodeResponse.data.latitude,
              longitude: geocodeResponse.data.longitude,
              department: geocodeResponse.data.department || dataToSave.department,
              region: geocodeResponse.data.region || dataToSave.region
            };
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          toast.error("Erreur lors de la géolocalisation. Veuillez vérifier votre ville.");
          setSaving(false);
          return;
        }
      }

      // Normalize image URLs robustly (remove backend URL if present, keep only path)
      // This handles multiple edge cases:
      // - Full URLs: https://domain.com/api/uploads/... → /api/uploads/...
      // - URLs without protocol: domain.com/api/uploads/... → /api/uploads/...
      // - Paths with double /api/: /api/api/uploads/... → /api/uploads/...
      // - Already normalized: /api/uploads/... → /api/uploads/... (unchanged)
      if (dataToSave.profile_image) {
        let normalizedUrl = dataToSave.profile_image;
        // Remove full backend URL if present
        if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
          normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
        }
        // Remove any duplicate /api/ prefix (fix /api/api/uploads → /api/uploads)
        normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
        // Ensure it starts with /api/uploads
        if (!normalizedUrl.startsWith('/api/uploads')) {
          normalizedUrl = normalizedUrl.replace(/^\/?(uploads\/)/, '/api/uploads/');
        }
        dataToSave.profile_image = normalizedUrl;
      }
      
      if (dataToSave.cover_image) {
        let normalizedUrl = dataToSave.cover_image;
        // Remove full backend URL if present
        if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
          normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
        }
        // Remove any duplicate /api/ prefix (fix /api/api/uploads → /api/uploads)
        normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
        // Ensure it starts with /api/uploads
        if (!normalizedUrl.startsWith('/api/uploads')) {
          normalizedUrl = normalizedUrl.replace(/^\/?(uploads\/)/, '/api/uploads/');
        }
        dataToSave.cover_image = normalizedUrl;
      }

      console.log('📤 Sending to backend:', {
        profile_image: dataToSave.profile_image,
        cover_image: dataToSave.cover_image
      });

      // Check if profile exists - if not, use POST (create), otherwise PUT (update)
      if (!profile) {
        // Create new profile
        const response = await axios.post(`${API}/venues`, dataToSave, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Profil créé avec succès!");
        
        // Update profile state with the response
        setProfile(response.data);
        
        // NEW: Use refactored buildImageUrl utility
        const saved_profile_image = buildImageUrl(response.data.profile_image);
        const saved_cover_image = buildImageUrl(response.data.cover_image);
        
        // Update formData with complete URLs from backend response
        setFormData(prev => ({
          ...prev,
          profile_image: saved_profile_image,
          cover_image: saved_cover_image
        }));
        
        console.log('✅ Profile created. Images saved:', {
          profile_image: saved_profile_image,
          cover_image: saved_cover_image
        });
        
        setEditing(false);
      } else {
        // Update existing profile
        const response = await axios.put(`${API}/venues`, dataToSave, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Profil sauvegardé!");
        
        // Update profile state with the response
        setProfile(response.data);
        
        // NEW: Use refactored buildImageUrl utility
        const saved_profile_image = buildImageUrl(response.data.profile_image);
        const saved_cover_image = buildImageUrl(response.data.cover_image);
        
        // Update formData with complete URLs from backend response
        setFormData(prev => ({
          ...prev,
          profile_image: saved_profile_image,
          cover_image: saved_cover_image
        }));
        
        console.log('✅ Profile updated. Images saved:', {
          profile_image: saved_profile_image,
          cover_image: saved_cover_image
        });
        
        setEditing(false);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
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

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Transform image URLs before setting state
      const subscribersWithUrls = (response.data || []).map(sub => ({
        ...sub,
        profile_image: sub.profile_image ? buildImageUrl(sub.profile_image) : null
      }));
      setSubscribers(subscribersWithUrls);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      setSubscribers([]);
    }
  };

  const sendBroadcastNotification = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Entrez un message");
      return;
    }

    setSendingBroadcast(true);
    try {
      let endpoint, targetText;
      
      if (notificationTarget === 'subscribers') {
        endpoint = `${API}/venues/me/notify-subscribers`;
        targetText = 'abonné(s)';
      } else if (notificationTarget === 'nearby') {
        endpoint = `${API}/venues/me/broadcast-notification`;
        targetText = 'musicien(s)';
      } else if (notificationTarget === 'all') {
        endpoint = `${API}/venues/me/notify-all`;
        targetText = 'destinataire(s)';
      }
      
      const response = await axios.post(
        endpoint,
        { 
          message: broadcastMessage,
          radius: (notificationTarget === 'nearby' || notificationTarget === 'all') ? 100 : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Notification envoyée à ${response.data.recipients_count} ${targetText} ! 🎵`);
      setBroadcastMessage("");
      fetchBroadcastHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setSendingBroadcast(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications" && profile?.id) {
      fetchNearbyMusiciansCount();
      fetchBroadcastHistory();
      fetchSubscribers(); // Rafraîchir les abonnés
    }
    if (activeTab === "jacks" && profile?.id) {
      fetchSubscribers(); // Rafraîchir les abonnés quand on ouvre l'onglet Jacks
    }
  }, [activeTab, profile?.id]); // FIXED: Only depend on profile.id instead of full profile object

  // Reviews Management
  const fetchMyReviews = async () => {
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        axios.get(`${API}/venues/me/reviews`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/venues/${profile.id}/average-rating`)
      ]);
      // Transform image URLs before setting state
      const reviewsWithUrls = (reviewsRes.data || []).map(review => ({
        ...review,
        musician_image: review.musician_image ? buildImageUrl(review.musician_image) : null
      }));
      setReviews(reviewsWithUrls);
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
      // Ne pas appeler fetchProfile() pour éviter d'écraser formData en mode édition
      if (!editing) {
        fetchProfile();
      }
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  // Toggle functions pour les équipements (sauvegarde immédiate)
  const toggleEquipment = async (field, currentValue) => {
    // Vérifier que le profil existe (avec les champs requis)
    if (!profile || !formData.address || !formData.city) {
      toast.error("Veuillez d'abord compléter votre profil (nom, ville, adresse)");
      return;
    }
    
    try {
      const newValue = !currentValue;
      const updatedData = { ...formData, [field]: newValue };
      
      await axios.put(`${API}/venues`, updatedData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setFormData(updatedData);
      toast.success("Équipement mis à jour");
      // Ne pas appeler fetchProfile() pour éviter d'écraser formData en mode édition
      if (!editing) {
        fetchProfile();
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error("Toggle equipment error:", error.response?.data || error);
    }
  };

  // Toggle function pour la messagerie (sauvegarde immédiate)
  const toggleMessaging = async (allowEveryone) => {
    // Vérifier que le profil existe (avec les champs requis)
    if (!profile || !formData.address || !formData.city) {
      toast.error("Veuillez d'abord compléter votre profil (nom, ville, adresse)");
      return;
    }
    
    try {
      const newValue = allowEveryone ? "everyone" : "connected_only";
      const updatedData = { ...formData, allow_messages_from: newValue };
      
      await axios.put(`${API}/venues`, updatedData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setFormData(updatedData);
      toast.success(allowEveryone 
        ? "Tous les musiciens peuvent vous contacter" 
        : "Seuls les musiciens connectés peuvent vous contacter");
      // Ne pas appeler fetchProfile() pour éviter d'écraser formData en mode édition
      if (!editing) {
        fetchProfile();
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error("Toggle messaging error:", error.response?.data || error);
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
    if (activeTab === "reviews" && profile?.id) {
      fetchMyReviews();
      setShowReviews(profile.show_reviews ?? true);
    }
  }, [activeTab, profile?.id]); // FIXED: Only depend on profile.id instead of full profile object

  // Charger les avis au démarrage si on a un profil
  useEffect(() => {
    if (profile?.id) {
      fetchMyReviews();
    }
  }, [profile?.id]); // FIXED: Only depend on profile.id instead of full profile object

  // Bands Management
  const fetchBands = async () => {
    setBandsLoading(true);
    try {
      const params = new URLSearchParams();
      if (bandFilters.department) params.append('department', bandFilters.department);
      if (bandFilters.city) params.append('city', bandFilters.city);
      
      const response = await axios.get(`${API}/bands?${params.toString()}`);
      // Transform image URLs before setting state
      const bandsWithUrls = (response.data || []).map(band => ({
        ...band,
        photo: band.photo ? buildImageUrl(band.photo) : null
      }));
      setBands(bandsWithUrls);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bandFilters]); // FIXED: Don't need fetchBands as dependency

  // ============= PROFITABILITY & HISTORY FUNCTIONS =============
  
  const fetchPastEvents = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/past-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPastEvents(response.data);
    } catch (error) {
      console.error("Error fetching past events:", error);
      toast.error("Erreur lors du chargement de l'historique");
    }
  };

  const fetchProfitabilityStats = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/profitability-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfitabilityStats(response.data);
    } catch (error) {
      console.error("Error fetching profitability stats:", error);
    }
  };

  const updateEventProfitability = async (eventId, eventType) => {
    const { revenue, expenses, notes } = profitabilityForm;
    
    if (!revenue || !expenses) {
      toast.error("Remplissez les recettes et dépenses");
      return;
    }

    try {
      const endpoint = eventType === 'jam' 
        ? `${API}/jams/${eventId}/profitability`
        : `${API}/concerts/${eventId}/profitability`;
      
      await axios.put(
        endpoint,
        {
          revenue: parseFloat(revenue),
          expenses: parseFloat(expenses),
          notes: notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Rentabilité enregistrée ! 💰");
      setEditingProfitability(null);
      setProfitabilityForm({ revenue: '', expenses: '', notes: '' });
      
      // Recharger les données
      fetchPastEvents();
      fetchProfitabilityStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'enregistrement");
    }
  };

  const openProfitabilityEdit = (event) => {
    setEditingProfitability(event);
    if (event.profitability) {
      setProfitabilityForm({
        revenue: event.profitability.revenue.toString(),
        expenses: event.profitability.expenses.toString(),
        notes: event.profitability.notes || ''
      });
    } else {
      setProfitabilityForm({ revenue: '', expenses: '', notes: '' });
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchPastEvents();
      fetchProfitabilityStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // FIXED: Don't need to add fetch functions as dependencies

  // Filter past events based on selected filters
  const getFilteredEvents = () => {
    let filtered = [...pastEvents];

    // Filter by type
    if (historyFilters.type !== 'all') {
      filtered = filtered.filter(e => e.type === historyFilters.type);
    }

    // Filter by style
    if (historyFilters.style !== 'all') {
      filtered = filtered.filter(e => 
        e.music_styles && e.music_styles.includes(historyFilters.style)
      );
    }

    // Filter by period
    if (historyFilters.period === 'custom') {
      // Custom date range
      if (historyFilters.customStartDate && historyFilters.customEndDate) {
        const startDate = new Date(historyFilters.customStartDate);
        const endDate = new Date(historyFilters.customEndDate);
        filtered = filtered.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate >= startDate && eventDate <= endDate;
        });
      }
    } else if (historyFilters.period !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (historyFilters.period === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (historyFilters.period === 'quarter') {
        filterDate.setMonth(now.getMonth() - 3);
      } else if (historyFilters.period === 'year') {
        filterDate.setFullYear(now.getFullYear() - 1);
      }
      
      filtered = filtered.filter(e => new Date(e.date) >= filterDate);
    }

    return filtered;
  };

  // Calculate filtered statistics based on current filters
  const getFilteredStats = () => {
    const filtered = getFilteredEvents();
    
    // Initialize stats
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    let eventCount = 0;
    const byStyle = {};
    const byMonth = {};
    
    // Calculate stats from filtered events
    filtered.forEach(event => {
      const prof = event.profitability;
      if (!prof) return;
      
      eventCount++;
      const revenue = prof.revenue || 0;
      const expenses = prof.expenses || 0;
      const profit = prof.profit || 0;
      
      totalRevenue += revenue;
      totalExpenses += expenses;
      totalProfit += profit;
      
      // By style
      const styles = event.music_styles || [];
      if (styles.length === 0) {
        // For concerts without music_styles, use "Concert" as the style
        const style = event.type === 'concert' ? 'Concert' : 'Non spécifié';
        if (!byStyle[style]) {
          byStyle[style] = { count: 0, revenue: 0, expenses: 0, profit: 0 };
        }
        byStyle[style].count++;
        byStyle[style].revenue += revenue;
        byStyle[style].expenses += expenses;
        byStyle[style].profit += profit;
      } else {
        styles.forEach(style => {
          if (!byStyle[style]) {
            byStyle[style] = { count: 0, revenue: 0, expenses: 0, profit: 0 };
          }
          byStyle[style].count++;
          byStyle[style].revenue += revenue;
          byStyle[style].expenses += expenses;
          byStyle[style].profit += profit;
        });
      }
      
      // By month
      const monthKey = event.date.substring(0, 7); // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { count: 0, revenue: 0, expenses: 0, profit: 0 };
      }
      byMonth[monthKey].count++;
      byMonth[monthKey].revenue += revenue;
      byMonth[monthKey].expenses += expenses;
      byMonth[monthKey].profit += profit;
    });
    
    // Calculate averages
    Object.keys(byStyle).forEach(style => {
      const count = byStyle[style].count;
      if (count > 0) {
        byStyle[style].avg_profit = parseFloat((byStyle[style].profit / count).toFixed(2));
        byStyle[style].avg_revenue = parseFloat((byStyle[style].revenue / count).toFixed(2));
      }
    });
    
    Object.keys(byMonth).forEach(month => {
      const count = byMonth[month].count;
      if (count > 0) {
        byMonth[month].avg_profit = parseFloat((byMonth[month].profit / count).toFixed(2));
      }
    });
    
    return {
      global: {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_expenses: parseFloat(totalExpenses.toFixed(2)),
        total_profit: parseFloat(totalProfit.toFixed(2)),
        event_count: eventCount,
        avg_profit_per_event: eventCount > 0 ? parseFloat((totalProfit / eventCount).toFixed(2)) : 0
      },
      by_style: byStyle,
      by_month: byMonth
    };
  };

  // Get all unique styles from past events for filter dropdown
  const getAllStyles = () => {
    const styles = new Set();
    pastEvents.forEach(event => {
      if (event.music_styles) {
        event.music_styles.forEach(style => styles.add(style));
      }
    });
    return Array.from(styles).sort();
  };

  // ============= END PROFITABILITY & HISTORY FUNCTIONS =============

  // Gallery Management
  const uploadGalleryPhoto = async (file) => {
    if (!file) return;
    
    if (gallery.length >= 20) {
      toast.error("Limite de 20 photos atteinte");
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/venues/me/gallery`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Photo ajoutée ! 📸");
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deleteGalleryPhoto = async (photoUrl) => {
    try {
      await axios.delete(`${API}/venues/me/gallery?photo_url=${encodeURIComponent(photoUrl)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Photo supprimée");
      fetchProfile();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    if (profile?.gallery) {
      setGallery(profile.gallery);
    }
  }, [profile]);

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateBooked = (dateStr) => {
    return bookedDates.includes(dateStr);
  };

  const handleDateClick = async (date) => {
    // S'assurer que date est un objet Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Format date sans conversion UTC
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Vérifier s'il y a un événement à cette date
    const eventType = eventsByDate[dateStr];
    
    if (eventType) {
      // Il y a un événement (concert ou jam), on l'affiche
      try {
        let event = null;
        let type = null;
        
        if (eventType === 'concert') {
          // Trouver le concert
          event = concerts.find(c => c.date === dateStr);
          type = 'concert';
        } else if (eventType === 'jam') {
          // Trouver le jam
          event = jams.find(j => j.date === dateStr);
          type = 'jam';
        }
        
        if (event) {
          setSelectedEvent(event);
          setSelectedEventType(type);
          setIsEditingEvent(false);
          setShowEventDetailsModal(true);
        }
      } catch (error) {
        console.error("Error loading event details:", error);
        toast.error("Erreur lors du chargement de l'événement");
      }
    } else {
      // Vérifier s'il y a un créneau de planning à cette date
      const planningSlot = planningSlots.find(slot => slot.date === dateStr);
      
      if (planningSlot) {
        // Il y a un créneau de planning, on l'affiche pour modification
        console.log('🎵 Créneau trouvé:', planningSlot);
        setEditingPlanningSlotId(planningSlot.id); // Tracker qu'on édite
        setPlanningForm({
          date: planningSlot.date,
          time: planningSlot.time || '',
          title: planningSlot.title || '',
          music_styles: planningSlot.music_styles || [],
          description: planningSlot.description || '',
          expectedBandStyle: planningSlot.expected_band_style || '',
          expectedAttendance: planningSlot.expected_attendance || '',
          payment: planningSlot.payment || '',
          artist_categories: planningSlot.artist_categories || [],
          num_bands_needed: planningSlot.num_bands_needed || 1,
          has_catering: planningSlot.has_catering || false,
          catering_drinks: planningSlot.catering_drinks || 0,
          catering_respect: planningSlot.catering_respect || false,
          catering_tbd: planningSlot.catering_tbd || false,
          has_accommodation: planningSlot.has_accommodation || false,
          accommodation_capacity: planningSlot.accommodation_capacity || 0,
          accommodation_tbd: planningSlot.accommodation_tbd || false
        });
        setSelectedDate(dateObj);
        setShowPlanningModal(true);
      } else {
        // Pas d'événement, créer un nouveau créneau de planning
        if (isDateBooked(dateStr)) {
          toast.info("Cette date est déjà réservée");
          return;
        }
        setEditingPlanningSlotId(null); // Pas d'édition
        setSelectedDate(dateObj);
        setPlanningForm({
          ...planningForm,
          date: dateStr,
          time: ''
        });
        setShowPlanningModal(true);
      }
    }
  };

  const handleCreatePlanningSlot = async () => {
    try {
      await axios.post(
        `${API}/planning`,
        {
          date: planningForm.date,
          time: planningForm.time,
          title: planningForm.title,
          description: planningForm.description,
          expected_band_style: planningForm.expectedBandStyle,
          expected_attendance: parseInt(planningForm.expectedAttendance) || 0,
          payment: planningForm.payment,
          num_bands_needed: planningForm.num_bands_needed || 1,
          has_catering: planningForm.has_catering || false,
          catering_drinks: planningForm.catering_drinks || 0,
          catering_respect: planningForm.catering_respect || false,
          catering_tbd: planningForm.catering_tbd || false,
          has_accommodation: planningForm.has_accommodation || false,
          accommodation_capacity: planningForm.accommodation_capacity || 0,
          accommodation_tbd: planningForm.accommodation_tbd || false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Créneau créé avec succès ! Les groupes peuvent maintenant postuler.");
      setShowPlanningModal(false);
      setEditingPlanningSlotId(null);
      setPlanningForm({
        date: '',
        time: '',
        title: '',
        description: '',
        expectedBandStyle: '',
        expectedAttendance: '',
        payment: '',
        payment_type: 'manual',
        payment_base: '',
        num_bands_needed: 1,
        has_catering: false,
        catering_drinks: 0,
        catering_respect: false,
        catering_tbd: false,
        has_accommodation: false,
        accommodation_capacity: 0,
        accommodation_tbd: false
      });
      fetchPlanningSlots();
      fetchEvents();
    } catch (error) {
      toast.error("Erreur lors de la création du créneau");
      console.error(error);
    }
  };

  const handleDeletePlanningSlot = async () => {
    if (!editingPlanningSlotId) return;
    
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) {
      return;
    }
    
    try {
      await axios.delete(`${API}/planning/${editingPlanningSlotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Créneau supprimé!");
      setShowPlanningModal(false);
      setSelectedDate(null);
      setEditingPlanningSlotId(null);
      setPlanningForm({
        date: '',
        time: '',
        title: '',
        description: '',
        expectedBandStyle: '',
        expectedAttendance: '',
        payment: '',
        payment_type: 'manual',
        payment_base: '',
        music_styles: [],
        artist_categories: [],
        num_bands_needed: 1,
        has_catering: false,
        catering_drinks: 0,
        catering_respect: false,
        catering_tbd: false,
        has_accommodation: false,
        accommodation_capacity: 0,
        accommodation_tbd: false
      });
      fetchPlanningSlots();
      fetchEvents();
    } catch (error) {
      console.error("Error deleting planning slot:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const handleUpdatePlanningSlot = async () => {
    if (!editingPlanningSlotId) return;
    
    try {
      await axios.put(
        `${API}/planning/${editingPlanningSlotId}`,
        {
          date: planningForm.date,
          time: planningForm.time,
          title: planningForm.title,
          description: planningForm.description,
          expected_band_style: planningForm.expectedBandStyle,
          expected_attendance: parseInt(planningForm.expectedAttendance) || 0,
          payment: planningForm.payment,
          num_bands_needed: planningForm.num_bands_needed || 1,
          has_catering: planningForm.has_catering || false,
          catering_drinks: planningForm.catering_drinks || 0,
          catering_respect: planningForm.catering_respect || false,
          catering_tbd: planningForm.catering_tbd || false,
          has_accommodation: planningForm.has_accommodation || false,
          accommodation_capacity: planningForm.accommodation_capacity || 0,
          accommodation_tbd: planningForm.accommodation_tbd || false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Créneau mis à jour avec succès !");
      setShowPlanningModal(false);
      setEditingPlanningSlotId(null);
      setPlanningForm({
        date: '',
        time: '',
        title: '',
        description: '',
        expectedBandStyle: '',
        expectedAttendance: '',
        payment: '',
        payment_type: 'manual',
        payment_base: '',
        music_styles: [],
        artist_categories: [],
        num_bands_needed: 1,
        has_catering: false,
        catering_drinks: 0,
        catering_respect: false,
        catering_tbd: false,
        has_accommodation: false,
        accommodation_capacity: 0,
        accommodation_tbd: false
      });
      fetchPlanningSlots();
      fetchEvents();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du créneau");
      console.error(error);
    }
  };

  // Fetch planning slots
  const fetchPlanningSlots = async () => {
    if (!profile) return;
    try {
      const response = await axios.get(`${API}/venues/${profile.id}/planning`);
      setPlanningSlots(response.data);
    } catch (error) {
      console.error("Error fetching planning slots:", error);
    }
  };

  // Fetch applications for a specific slot
  const fetchApplications = async (slotId) => {
    try {
      const response = await axios.get(`${API}/planning/${slotId}/applications`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      // Transform image URLs before setting state
      const applicationsWithUrls = (response.data || []).map(app => ({
        ...app,
        band_photo: app.band_photo ? buildImageUrl(app.band_photo) : null
      }));
      setApplications({ ...applications, [slotId]: applicationsWithUrls });
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  // Create Jam
  const createJam = async () => {
    try {
      await axios.post(`${API}/jams`, jamForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Boeuf musical créé!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowJamDialog(false);
      setJamForm({ date: "", start_time: "", end_time: "", music_styles: [], rules: "", has_instruments: false, has_pa_system: false, instruments_available: [], additional_info: "" });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Duplicate Jam - Copie tous les paramètres sauf date et heure
  const duplicateJam = (jam) => {
    setJamForm({
      date: "", // Vide pour que l'utilisateur entre une nouvelle date
      start_time: "", // Vide pour que l'utilisateur entre une nouvelle heure
      end_time: "", // Vide
      music_styles: [...jam.music_styles],
      rules: jam.rules || "",
      has_instruments: jam.has_instruments || false,
      has_pa_system: jam.has_pa_system || false,
      instruments_available: [...(jam.instruments_available || [])],
      additional_info: jam.additional_info || ""
    });
    setShowJamDialog(true);
    toast.info("Paramètres du bœuf copiés ! Entrez la nouvelle date et heure.");
  };

  // Create Concert
  const createConcert = async () => {
    try {
      await axios.post(`${API}/concerts`, concertForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Concert créé!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowConcertDialog(false);
      setConcertForm({ date: "", start_time: "", end_time: "", title: "", description: "", bands: [], price: "", music_styles: [] });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };


  // Create Karaoke
  const createKaraoke = async () => {
    try {
      await axios.post(`${API}/karaoke`, karaokeForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Soirée karaoké créée!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowKaraokeDialog(false);
      setKaraokeForm({ date: "", start_time: "", end_time: "", title: "", description: "", music_styles: [] });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Create Spectacle
  const createSpectacle = async () => {
    try {
      await axios.post(`${API}/spectacle`, spectacleForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Spectacle créé!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowSpectacleDialog(false);
      setSpectacleForm({ date: "", start_time: "", end_time: "", type: "", artist_name: "", description: "", price: "" });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };


  // Search bands with debounce
  const searchBands = async (query) => {
    if (query.length < 2) {
      setBandSuggestions([]);
      setShowBandSuggestions(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/bands/search?query=${encodeURIComponent(query)}&limit=5`);
      setBandSuggestions(response.data);
      setShowBandSuggestions(true);
    } catch (error) {
      console.error("Error searching bands:", error);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newBand.name) {
        searchBands(newBand.name);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [newBand.name]);

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

  // Fonctions pour éditer les événements
  const handleEditEvent = (event, type) => {
    setSelectedEvent(event);
    setSelectedEventType(type);
    setIsEditingEvent(true);
    setShowEventDetailsModal(true);
  };

  const handleUpdateEvent = async () => {
    try {
      if (selectedEventType === 'concert') {
        await axios.put(
          `${API}/concerts/${selectedEvent.id}`,
          selectedEvent,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Concert mis à jour");
      } else if (selectedEventType === 'jam') {
        await axios.put(
          `${API}/jams/${selectedEvent.id}`,
          selectedEvent,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Bœuf mis à jour");
      }
      
      // Réinitialiser l'état de la modale
      setShowEventDetailsModal(false);
      setIsEditingEvent(false);
      setSelectedEvent(null);
      setSelectedEventType(null);
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Erreur lors de la mise à jour");
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
      setNewBand({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });
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
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </div>
            
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
              
              {/* Notifications */}
              <Dialog open={showNotificationsDialog} onOpenChange={(open) => {
                setShowNotificationsDialog(open);
                if (open && unreadCount > 0) {
                  // Marquer toutes les notifications comme lues quand on ouvre le panneau
                  (async () => {
                    try {
                      await axios.post(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
                      fetchNotifications();
                    } catch (error) {
                      console.error("Error marking notifications as read:", error);
                    }
                  })();
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {notifications.length > 0 ? (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await axios.post(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                fetchNotifications();
                                toast.success("Toutes les notifications marquées comme lues");
                              } catch (error) {
                                console.error("Error marking notifications as read:", error);
                              }
                            }}
                          >
                            Tout marquer comme lu
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm("Êtes-vous sûr de vouloir effacer toutes les notifications ?")) return;
                              try {
                                await axios.delete(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
                                toast.success("Toutes les notifications ont été effacées");
                                fetchNotifications();
                              } catch (error) {
                                console.error("Error deleting notifications:", error);
                              }
                            }}
                          >
                            Effacer tout
                          </Button>
                        </div>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 rounded-lg border ${
                              notif.is_read ? 'bg-black/20 border-white/5' : 'bg-primary/10 border-primary/30'
                            }`}
                          >
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune notification</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Link to="/leaderboard">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <Trophy className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/badges">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <Award className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/messages-improved">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </Link>
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
            Bienvenue, <span className="text-gradient">{profile?.name || user?.name}</span>!
          </h1>
          <p className="text-muted-foreground">Gérez votre établissement et vos événements</p>
        </div>

        {/* Profile Completion Alert */}
        {!isProfileComplete() && (
          <div className="glassmorphism border-2 border-yellow-500/50 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-semibold text-lg mb-1">
                  Complétez votre profil
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Merci de bien remplir tous les champs de votre profil (nom, adresse, ville, téléphone, description) afin de pouvoir commencer à créer des événements et être visible par les musiciens.
                </p>
                <Button 
                  onClick={() => setActiveTab('profile')} 
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-full"
                >
                  Compléter mon profil
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Card */}
        {user?.subscription_status !== "active" && (
          <div className="glassmorphism rounded-2xl p-6 mb-8 neon-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">
                  {user?.subscription_status === "trial" ? "Période d'essai" : "Abonnez-vous"}
                </h3>
                <p className="text-muted-foreground text-sm">12,99€/mois pour être visible</p>
              </div>
              {user?.subscription_status !== "trial" && (
                <Button onClick={handleSubscribe} className="bg-primary hover:bg-primary/90 rounded-full px-6 gap-2" data-testid="subscribe-btn">
                  <CreditCard className="w-4 h-4" /> S'abonner
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Trial Banner */}
        {subscriptionStatus === "trial" && trialDaysLeft !== null && (
          <div className="glassmorphism border-2 border-secondary/50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-lg">
                    {trialDaysLeft > 0 ? (
                      <>Il vous reste {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} d'essai gratuit</>
                    ) : (
                      <>Votre essai se termine aujourd'hui</>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Profitez de toutes les fonctionnalités sans engagement
                  </p>
                </div>
              </div>
              <Button asChild className="bg-secondary hover:bg-secondary/90 rounded-full">
                <Link to="/pricing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  S'abonner maintenant
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 mb-6 gap-1 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent min-h-[44px] items-center">
            <TabsTrigger value="profile" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Profil</TabsTrigger>
            <TabsTrigger value="jams" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Bœufs</TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Concerts</TabsTrigger>
            <TabsTrigger value="karaoke" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Karaoké</TabsTrigger>
            <TabsTrigger value="spectacle" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Spectacle</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Planning</TabsTrigger>
            <TabsTrigger value="candidatures" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              Candidatures
            </TabsTrigger>
            <TabsTrigger value="jacks" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              <Plug className="w-4 h-4 inline mr-1" />
              Jacks
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              <Bell className="w-4 h-4 inline mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Historique</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Avis</TabsTrigger>
            <TabsTrigger value="bands" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Groupes</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Galerie</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Paramètres</TabsTrigger>
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
                      onChange={(url) => {
                        console.log('🎯 === VENUE DASHBOARD ONCHANGE ===');
                        console.log('📸 Profile image URL received:', url);
                        console.log('📊 Current formData BEFORE update:', {
                          profile_image: formData.profile_image,
                          name: formData.name
                        });
                        setFormData(prev => {
                          const updated = { ...prev, profile_image: url };
                          console.log('✅ New formData AFTER update:', {
                            profile_image: updated.profile_image,
                            name: updated.name
                          });
                          return updated;
                        });
                      }}
                      token={token}
                      photoType="profile"
                      disabled={!editing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo de couverture</Label>
                    <VenueImageUpload
                      value={formData.cover_image}
                      onChange={(url) => {
                        console.log('🎯 === VENUE DASHBOARD ONCHANGE ===');
                        console.log('📸 Cover image URL received:', url);
                        console.log('📊 Current formData BEFORE update:', {
                          cover_image: formData.cover_image,
                          name: formData.name
                        });
                        setFormData(prev => {
                          const updated = { ...prev, cover_image: url };
                          console.log('✅ New formData AFTER update:', {
                            cover_image: updated.cover_image,
                            name: updated.name
                          });
                          return updated;
                        });
                      }}
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
                  <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Localisation</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      placeholder="Adresse" 
                      value={formData.address || ''} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                      disabled={!editing} 
                      className="bg-black/20 border-white/10 disabled:opacity-70" 
                    />
                    <div>
                      {editing ? (
                        <CityAutocomplete
                          value={formData.city || ''}
                          onSelect={(cityData) => {
                            setFormData({
                              ...formData,
                              city: cityData.city,
                              postal_code: cityData.postalCode,
                              department: cityData.department,
                              region: cityData.region,
                              latitude: cityData.latitude,
                              longitude: cityData.longitude
                            });
                          }}
                          label="Ville"
                          placeholder="Ex: Paris"
                        />
                      ) : (
                        <>
                          <Label>Ville</Label>
                          <Input value={formData.city || ''} disabled className="bg-black/20 border-white/10 disabled:opacity-70" />
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input 
                      placeholder="Code postal" 
                      value={formData.postal_code || ''} 
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} 
                      disabled={!editing} 
                      className="bg-black/20 border-white/10 disabled:opacity-70" 
                    />
                    <Input 
                      placeholder="Département (ex: 75)" 
                      value={formData.department || ''} 
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                      disabled={!editing} 
                      className="bg-black/20 border-white/10 disabled:opacity-70" 
                    />
                    <Input 
                      placeholder="Région (ex: Île-de-France)" 
                      value={formData.region || ''} 
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })} 
                      disabled={!editing} 
                      className="bg-black/20 border-white/10 disabled:opacity-70" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Liens</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Site web (https://...)" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                    <Input placeholder="Facebook (https://facebook.com/...)" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                    <Input placeholder="Instagram (https://instagram.com/...)" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} disabled={!editing} className="bg-black/20 border-white/10 disabled:opacity-70" />
                  </div>

                  {/* Aperçu des liens */}
                  {!editing && (
                    <div className="p-3 bg-black/10 rounded-lg border border-white/10">
                      <Label className="text-xs mb-2 block">Vos liens :</Label>
                      <SocialLinks 
                        website={formData.website}
                        facebook={formData.facebook}
                        instagram={formData.instagram}
                      />
                      {!formData.website && !formData.facebook && !formData.instagram && (
                        <p className="text-xs text-muted-foreground">Aucun lien ajouté</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Équipements & Services</Label>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={formData.has_stage} 
                        onCheckedChange={() => toggleEquipment('has_stage', formData.has_stage)}
                        disabled={!editing}
                      />
                      <Label>Scène</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={formData.has_sound_engineer} 
                        onCheckedChange={() => toggleEquipment('has_sound_engineer', formData.has_sound_engineer)}
                        disabled={!editing}
                      />
                      <Label>Ingé son</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={formData.has_pa_system} 
                        onCheckedChange={() => toggleEquipment('has_pa_system', formData.has_pa_system)}
                        disabled={!editing}
                      />
                      <Label>Sono</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={formData.has_lights} 
                        onCheckedChange={() => toggleEquipment('has_lights', formData.has_lights)}
                        disabled={!editing}
                      />
                      <Label>Lights</Label>
                    </div>
                  </div>

                  {/* Conditionally show stage size selector */}
                  {formData.has_stage && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-white/10">
                      <Label className="mb-2 block">Taille de la scène</Label>
                      <Select 
                        value={formData.stage_size || ""} 
                        onValueChange={(value) => setFormData({ ...formData, stage_size: value })}
                        disabled={!editing}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez la taille" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                          {Array.from({ length: 10 }, (_, i) => (i + 1) * 5).map(size => (
                            <SelectItem key={size} value={`${size}m²`}>
                              {size}m²
                            </SelectItem>
                          ))}
                          <SelectItem value="Plus de 50m²">Plus de 50m²</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conditionally show PA system details */}
                  {formData.has_pa_system && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-white/10 space-y-3">
                      <Label className="text-base font-semibold">🔊 Détails de la sono</Label>
                      
                      {editing ? (
                        /* Mode édition - Formulaire */
                        <div className="space-y-3">
                          <div>
                            <Label>Nom de la table de mixage</Label>
                            <Input 
                              placeholder="Ex: Yamaha MG16XU, Behringer X32..."
                              value={formData.pa_mixer_name}
                              onChange={(e) => setFormData({ ...formData, pa_mixer_name: e.target.value })}
                              className="bg-black/20 border-white/10"
                            />
                          </div>
                          
                          <div>
                            <Label>Nom des enceintes</Label>
                            <Input 
                              placeholder="Ex: JBL EON615, RCF ART 735-A..."
                              value={formData.pa_speakers_name}
                              onChange={(e) => setFormData({ ...formData, pa_speakers_name: e.target.value })}
                              className="bg-black/20 border-white/10"
                            />
                          </div>
                          
                          <div>
                            <Label>Puissance</Label>
                            <Input 
                              placeholder="Ex: 2000W, 3kW..."
                              value={formData.pa_power}
                              onChange={(e) => setFormData({ ...formData, pa_power: e.target.value })}
                              className="bg-black/20 border-white/10"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Mode lecture - Affichage */
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {formData.pa_mixer_name && (
                            <p><span className="text-white font-medium">Table de mixage :</span> {formData.pa_mixer_name}</p>
                          )}
                          {formData.pa_speakers_name && (
                            <p><span className="text-white font-medium">Enceintes :</span> {formData.pa_speakers_name}</p>
                          )}
                          {formData.pa_power && (
                            <p><span className="text-white font-medium">Puissance :</span> {formData.pa_power}</p>
                          )}
                          {!formData.pa_mixer_name && !formData.pa_speakers_name && !formData.pa_power && (
                            <p className="text-muted-foreground italic">Aucun détail renseigné</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conditionally show lights details */}
                  {formData.has_lights && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-white/10 space-y-3">
                      <Label className="text-base font-semibold">💡 Détails des lights</Label>
                      
                      {editing ? (
                        /* Mode édition - Checkboxes */
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.has_auto_light}
                              onChange={(e) => setFormData({ ...formData, has_auto_light: e.target.checked })}
                              className="rounded"
                            />
                            <Label className="cursor-pointer" onClick={() => setFormData({ ...formData, has_auto_light: !formData.has_auto_light })}>
                              Auto light (jeux de lumière automatiques)
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.has_light_table}
                              onChange={(e) => setFormData({ ...formData, has_light_table: e.target.checked })}
                              className="rounded"
                            />
                            <Label className="cursor-pointer" onClick={() => setFormData({ ...formData, has_light_table: !formData.has_light_table })}>
                              Table light (console d'éclairage)
                            </Label>
                          </div>
                        </div>
                      ) : (
                        /* Mode lecture - Affichage */
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {formData.has_auto_light && (
                            <p>✓ Auto light (jeux de lumière automatiques)</p>
                          )}
                          {formData.has_light_table && (
                            <p>✓ Table light (console d'éclairage)</p>
                          )}
                          {!formData.has_auto_light && !formData.has_light_table && (
                            <p className="text-muted-foreground italic">Aucun détail renseigné</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t border-white/10 pt-4">
                  <Label>Paramètres de messagerie</Label>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Switch 
                        checked={formData.allow_messages_from === "everyone"} 
                        onCheckedChange={(checked) => toggleMessaging(checked)} 
                      />
                      <div>
                        <Label className="cursor-pointer">Autoriser les messages de tous les musiciens</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.allow_messages_from === "everyone" 
                            ? "✅ Tout musicien peut vous contacter par messagerie"
                            : "🔒 Seuls les musiciens ayant joué dans votre établissement ou ayant été acceptés peuvent vous contacter"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Styles musicaux</Label>
                  {editing && (
                    <Select 
                      onValueChange={(value) => {
                        if (value && !formData.music_styles.includes(value)) {
                          setFormData({ ...formData, music_styles: [...formData.music_styles, value] });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Sélectionnez un style musical" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                        {MUSIC_STYLES_LIST.filter(style => !formData.music_styles.includes(style)).map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.music_styles.map((style, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1">
                        {style}
                        {editing && <button onClick={() => removeFromList('music_styles', style, formData, setFormData)}><X className="w-3 h-3" /></button>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account Management Section */}
              <div className="glassmorphism rounded-2xl p-6 mt-6 border-2 border-red-500/20">
                <h3 className="font-heading font-semibold text-lg mb-4 text-red-400">Gestion du compte</h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <div>
                      <p className="font-medium mb-1">Suspendre mon compte</p>
                      <p className="text-sm text-muted-foreground">
                        Suspendre temporairement votre compte pour 60 jours. Vous pourrez le réactiver à tout moment.
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-full border-orange-500/50 hover:bg-orange-500/20">
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
                              <li>• Votre compte sera suspendu pour 60 jours maximum</li>
                              <li>• Votre profil ne sera plus visible pendant cette période</li>
                              <li>• Vos événements seront masqués</li>
                              <li>• Vous pourrez réactiver votre compte à tout moment</li>
                            </ul>
                          </div>
                          <DialogFooter className="flex gap-2">
                            <DialogTrigger asChild>
                              <Button variant="outline" className="rounded-full">
                                Annuler
                              </Button>
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
                              Confirmer la suspension
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex items-start justify-between gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div>
                      <p className="font-medium mb-1">Supprimer mon compte</p>
                      <p className="text-sm text-muted-foreground">
                        Supprimer définitivement votre compte et toutes vos données. Cette action est irréversible.
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-full border-red-500/50 hover:bg-red-500/20">
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
                            <h4 className="font-semibold mb-2">🚨 Attention - Action irréversible</h4>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                              <li>• Toutes vos données seront supprimées définitivement</li>
                              <li>• Tous vos événements seront supprimés</li>
                              <li>• Toutes les candidatures reçues seront perdues</li>
                              <li>• Vos messages et notifications seront effacés</li>
                              <li>• Cette action ne peut pas être annulée</li>
                            </ul>
                          </div>
                          <DialogFooter className="flex gap-2">
                            <DialogTrigger asChild>
                              <Button variant="outline" className="rounded-full">
                                Annuler
                              </Button>
                            </DialogTrigger>
                            <Button
                              className="bg-red-500 hover:bg-red-600 rounded-full"
                              onClick={async () => {
                                try {
                                  await axios.delete(`${API}/account/delete`, { 
                                    headers: { Authorization: `Bearer ${token}` } 
                                  });
                                  toast.success("Compte supprimé définitivement");
                                  setTimeout(() => {
                                    logout();
                                    navigate("/");
                                  }, 2000);
                                } catch (error) {
                                  toast.error("Erreur lors de la suppression");
                                }
                              }}
                            >
                              Confirmer la suppression
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                    <Button 
                      className="bg-primary hover:bg-primary/90 rounded-full gap-2"
                      onClick={() => {
                        // Réinitialiser le formulaire pour un nouveau bœuf
                        setJamForm({
                          date: '',
                          start_time: '',
                          end_time: '',
                          description: '',
                          music_styles: [],
                          rules: '',
                          has_instruments: false,
                          instruments_available: [],
                          has_pa_system: false,
                          has_catering: false,
                          catering_drinks: 0,
                          catering_respect: false,
                          catering_tbd: false,
                          has_accommodation: false,
                          accommodation_capacity: 0,
                          accommodation_tbd: false
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" /> Nouveau boeuf
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Créer un boeuf musical</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input 
                            type="date" 
                            value={jamForm.date} 
                            onChange={(e) => setJamForm({ ...jamForm, date: e.target.value })} 
                            className="bg-black/20 border-white/10"
                            onKeyDown={(e) => e.preventDefault()}
                            style={{ caretColor: 'transparent' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Début</Label>
                          <TimeSelect
                            value={jamForm.start_time}
                            onChange={(value) => setJamForm({ ...jamForm, start_time: value })}
                            placeholder="Heure de début"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fin</Label>
                          <TimeSelect
                            value={jamForm.end_time}
                            onChange={(value) => setJamForm({ ...jamForm, end_time: value })}
                            placeholder="Heure de fin"
                          />
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
                          <div className="grid grid-cols-2 gap-3 p-4 bg-black/10 rounded-lg">
                            {INSTRUMENTS_BASE.map((instrument) => (
                              <div key={instrument} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`instrument-${instrument}`}
                                  checked={jamForm.instruments_available?.includes(instrument) || false}
                                  onChange={(e) => {
                                    const currentInstruments = jamForm.instruments_available || [];
                                    if (e.target.checked) {
                                      setJamForm({ 
                                        ...jamForm, 
                                        instruments_available: [...currentInstruments, instrument] 
                                      });
                                    } else {
                                      setJamForm({ 
                                        ...jamForm, 
                                        instruments_available: currentInstruments.filter(i => i !== instrument) 
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                                />
                                <Label 
                                  htmlFor={`instrument-${instrument}`} 
                                  className="text-sm font-normal cursor-pointer select-none"
                                >
                                  {instrument}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {jamForm.instruments_available && jamForm.instruments_available.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {jamForm.instruments_available.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs flex items-center gap-1">
                                  {s}
                                  <button onClick={() => setJamForm({ 
                                    ...jamForm, 
                                    instruments_available: jamForm.instruments_available.filter(inst => inst !== s) 
                                  })}>
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
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
                    <div 
                      key={jam.id} 
                      className="glassmorphism rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => handleEditEvent(jam, 'jam')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-lg">{jam.date}</p>
                          <p className="text-muted-foreground">{jam.start_time} - {jam.end_time}</p>
                          <p className="text-green-400 text-sm mt-1">
                            👥 {jam.participants_count || 0} participant{(jam.participants_count || 0) > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateJam(jam);
                            }}
                            className="hover:bg-primary/20"
                            title="Dupliquer ce bœuf"
                          >
                            <Plus className="w-4 h-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJam(jam.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {jam.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{s}</span>)}
                      </div>
                      
                      {/* Informations complémentaires */}
                      <div className="mt-3 space-y-1 text-sm">
                        {jam.has_instruments && jam.instruments_available && jam.instruments_available.length > 0 && (
                          <p className="text-secondary">🎸 {jam.instruments_available.join(", ")}</p>
                        )}
                        {jam.has_instruments && (!jam.instruments_available || jam.instruments_available.length === 0) && (
                          <p className="text-secondary">🎸 Instruments sur place</p>
                        )}
                        {jam.has_pa_system && <p className="text-secondary">🔊 Sono disponible</p>}
                        {jam.rules && <p className="text-muted-foreground mt-2"><strong>Règlement:</strong> {jam.rules}</p>}
                        {jam.description && <p className="text-muted-foreground"><strong>Description:</strong> {jam.description.substring(0, 100)}{jam.description.length > 100 ? '...' : ''}</p>}
                      </div>
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
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input 
                            type="date" 
                            value={concertForm.date} 
                            onChange={(e) => setConcertForm({ ...concertForm, date: e.target.value })} 
                            className="bg-black/20 border-white/10"
                            onKeyDown={(e) => e.preventDefault()}
                            style={{ caretColor: 'transparent' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure début</Label>
                          <TimeSelect
                            value={concertForm.start_time}
                            onChange={(value) => setConcertForm({ ...concertForm, start_time: value })}
                            placeholder="Heure de début"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure fin</Label>
                          <TimeSelect
                            value={concertForm.end_time}
                            onChange={(value) => setConcertForm({ ...concertForm, end_time: value })}
                            placeholder="Heure de fin"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input value={concertForm.title} onChange={(e) => setConcertForm({ ...concertForm, title: e.target.value })} className="bg-black/20 border-white/10" />
                      </div>

                      {/* Musical Styles Section */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Styles musicaux
                        </Label>
                        <Select 
                          value="" 
                          onValueChange={(value) => {
                            if (value && !concertForm.music_styles.includes(value)) {
                              setConcertForm({ 
                                ...concertForm, 
                                music_styles: [...concertForm.music_styles, value] 
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue placeholder="Sélectionnez un style" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                            {MUSIC_STYLES_LIST.map(style => (
                              <SelectItem 
                                key={style} 
                                value={style}
                                disabled={concertForm.music_styles.includes(style)}
                              >
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {concertForm.music_styles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {concertForm.music_styles.map((style, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                              >
                                {style}
                                <button 
                                  type="button"
                                  onClick={() => setConcertForm({ 
                                    ...concertForm, 
                                    music_styles: concertForm.music_styles.filter((_, i) => i !== idx) 
                                  })}
                                  className="hover:text-primary-foreground"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Prix</Label>
                        <Input value={concertForm.price} onChange={(e) => setConcertForm({ ...concertForm, price: e.target.value })} placeholder="Ex: Gratuit, 10€, PAF" className="bg-black/20 border-white/10" />
                      </div>
                      
                      {/* Bands */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Groupes / Artistes</Label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={manualBandEntry}
                              onChange={(e) => {
                                setManualBandEntry(e.target.checked);
                                setNewBand({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });
                                setShowBandSuggestions(false);
                              }}
                              className="rounded"
                            />
                            <span className="text-muted-foreground">Groupe non référencé</span>
                          </label>
                        </div>
                        
                        <div className="p-4 border border-white/10 rounded-xl space-y-3">
                          {manualBandEntry ? (
                            /* Mode saisie manuelle */
                            <>
                              <div className="space-y-2">
                                <Label>Nom du groupe</Label>
                                <Input 
                                  placeholder="Ex: Les Tambours du Soleil" 
                                  value={newBand.name} 
                                  onChange={(e) => setNewBand({ ...newBand, name: e.target.value })} 
                                  className="bg-black/20 border-white/10" 
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Nombre de membres</Label>
                                <Input 
                                  type="number" 
                                  min="1"
                                  placeholder="Ex: 5" 
                                  value={newBand.members_count || ""} 
                                  onChange={(e) => setNewBand({ ...newBand, members_count: parseInt(e.target.value) || 0 })} 
                                  className="bg-black/20 border-white/10" 
                                />
                                <p className="text-xs text-muted-foreground">Pour calculer le catering total</p>
                              </div>
                            </>
                          ) : (
                            /* Mode recherche avec suggestions */
                            <>
                              <div className="relative">
                                <Input 
                                  placeholder="Nom du groupe (commencez à taper pour rechercher)" 
                                  value={newBand.name} 
                                  onChange={(e) => setNewBand({ ...newBand, name: e.target.value })} 
                                  onFocus={() => {
                                    if (bandSuggestions.length > 0) setShowBandSuggestions(true);
                                  }}
                                  className="bg-black/20 border-white/10" 
                                />
                                
                                {/* Suggestions dropdown */}
                                {showBandSuggestions && bandSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {bandSuggestions.map((band, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setNewBand({ 
                                            ...newBand, 
                                            name: band.name,
                                            members_count: band.members_count || 0
                                          });
                                          setShowBandSuggestions(false);
                                          toast.success(`Groupe "${band.name}" sélectionné`);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <p className="font-semibold text-white">{band.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {band.band_type && `${band.band_type} • `}
                                              {band.members_count && `${band.members_count} membres • `}
                                              {band.musician_name && `Créé par ${band.musician_name}`}
                                            </p>
                                            {band.music_styles && band.music_styles.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {band.music_styles.slice(0, 3).map((style, i) => (
                                                  <span key={i} className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                                                    {style}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <select value={newBand.musician_id} onChange={(e) => setNewBand({ ...newBand, musician_id: e.target.value })} className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white">
                                <option value="">Lier à un musicien (optionnel)</option>
                                {musicians.map(m => <option key={m.id} value={m.id}>{m.pseudo}</option>)}
                              </select>
                              
                              <div className="space-y-2">
                                <Label>Nombre de membres du groupe</Label>
                                <Input 
                                  type="number" 
                                  min="1"
                                  placeholder="Ex: 4" 
                                  value={newBand.members_count || ""} 
                                  onChange={(e) => setNewBand({ ...newBand, members_count: parseInt(e.target.value) || 0 })} 
                                  className="bg-black/20 border-white/10" 
                                />
                                <p className="text-xs text-muted-foreground">Pour calculer le catering total</p>
                              </div>
                            </>
                          )}
                          
                          <Button 
                            type="button" 
                            onClick={() => {
                              addBandToConcert();
                              setShowBandSuggestions(false);
                            }} 
                            variant="outline" 
                            className="w-full border-white/20"
                          >
                            Ajouter le groupe
                          </Button>
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

                      {/* Catering Section */}
                      <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-white/10">
                        <Label className="text-base flex items-center gap-2">
                          🍽️ Catering <span className="text-xs text-muted-foreground">(la ration pour les ménestrels)</span>
                        </Label>
                        
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={concertForm.has_catering || false} 
                            onCheckedChange={(c) => setConcertForm({ ...concertForm, has_catering: c, catering_drinks: c ? concertForm.catering_drinks : 0 })} 
                          />
                          <Label>Restauration disponible</Label>
                        </div>

                        {concertForm.has_catering && (
                          <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                            <div className="space-y-2">
                              <Label>Boissons par personne</Label>
                              <Select 
                                value={concertForm.catering_drinks?.toString() || "0"} 
                                onValueChange={(value) => setConcertForm({ ...concertForm, catering_drinks: parseInt(value) })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/10">
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-white/10">
                                  {[...Array(11)].map((_, i) => (
                                    <SelectItem key={i} value={i.toString()}>{i === 0 ? "Aucune" : `${i} boisson${i > 1 ? 's' : ''}`}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="concert-catering-respect"
                                checked={concertForm.catering_respect || false}
                                onChange={(e) => setConcertForm({ ...concertForm, catering_respect: e.target.checked })}
                                className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded"
                              />
                              <Label htmlFor="concert-catering-respect" className="text-sm">
                                Ne pas abuser de la gentillesse du patron
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="concert-catering-tbd"
                                checked={concertForm.catering_tbd || false}
                                onChange={(e) => setConcertForm({ ...concertForm, catering_tbd: e.target.checked })}
                                className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded"
                              />
                              <Label htmlFor="concert-catering-tbd" className="text-sm">
                                À définir
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Accommodation Section */}
                      <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-white/10">
                        <Label className="text-base flex items-center gap-2">
                          🛏️ Hébergement possible
                        </Label>
                        
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={concertForm.has_accommodation || false} 
                            onCheckedChange={(c) => setConcertForm({ ...concertForm, has_accommodation: c, accommodation_capacity: c ? concertForm.accommodation_capacity : 0 })} 
                          />
                          <Label>Hébergement disponible</Label>
                        </div>

                        {concertForm.has_accommodation && (
                          <div className="space-y-2 pl-6 border-l-2 border-primary/30">
                            <Label>Nombre de personnes</Label>
                            <div className="grid grid-cols-5 gap-2">
                              {[...Array(10)].map((_, i) => {
                                const capacity = i + 1;
                                return (
                                  <button
                                    key={capacity}
                                    type="button"
                                    onClick={() => setConcertForm({ ...concertForm, accommodation_capacity: capacity })}
                                    className={`
                                      p-2 rounded-lg border-2 transition-all font-semibold
                                      ${concertForm.accommodation_capacity === capacity 
                                        ? 'bg-primary/20 border-primary text-primary' 
                                        : 'bg-black/20 border-white/10 hover:border-white/30'
                                      }
                                    `}
                                  >
                                    {capacity}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
                  {concerts.map((concert) => {
                    const totalMembers = concert.bands ? concert.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) : 0;
                    return (
                      <div 
                        key={concert.id} 
                        className="glassmorphism rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => handleEditEvent(concert, 'concert')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-lg">{concert.date}</p>
                            <p className="text-muted-foreground">
                              {concert.start_time}{concert.end_time ? ` - ${concert.end_time}` : ''}
                            </p>
                            {concert.title && <p className="text-sm font-medium mt-1">{concert.title}</p>}
                            
                            {/* Musical Styles Display */}
                            {concert.music_styles && concert.music_styles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {concert.music_styles.map((style, idx) => (
                                  <span 
                                    key={idx} 
                                    className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full"
                                  >
                                    {style}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-green-400 text-sm mt-1">
                              👥 {concert.participants_count || 0} participant{(concert.participants_count || 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConcert(concert.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        {concert.bands?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-1">Artistes:</p>
                            {concert.bands.map((b, i) => (
                              <div key={i} className="flex items-center justify-between text-white">
                                <span>{b.name}</span>
                                {b.members_count && (
                                  <span className="text-xs text-muted-foreground">
                                    ({b.members_count} membre{b.members_count > 1 ? 's' : ''})
                                  </span>
                                )}
                              </div>
                            ))}
                            {totalMembers > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <span className="text-xs font-semibold text-primary">
                                  Total : {totalMembers} musicien{totalMembers > 1 ? 's' : ''}
                                </span>
                                {(totalMembers + (concert.participants_count || 0)) > 0 && (
                                  <p className="text-xs font-semibold text-green-400 mt-1">
                                    {totalMembers + (concert.participants_count || 0)} : minimum de personnes étrangères à l'établissement
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {concert.price && <p className="text-sm text-secondary mt-2">{concert.price}€</p>}
                        
                        {/* Catering and Accommodation Info */}
                        {(concert.has_catering || concert.has_accommodation) && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            {concert.has_catering && (
                              <div className="flex items-start gap-2 text-sm">
                                <span className="text-lg">🍽️</span>
                                <div className="flex-1">
                                  <p className="font-medium text-green-400">Catering disponible</p>
                                  {concert.catering_drinks > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {concert.catering_drinks} boisson{concert.catering_drinks > 1 ? 's' : ''} par personne
                                    </p>
                                  )}
                                  {concert.catering_tbd && (
                                    <p className="text-xs text-yellow-400">À définir</p>
                                  )}
                                </div>
                              </div>
                            )}
                            {concert.has_accommodation && (
                              <div className="flex items-start gap-2 text-sm">
                                <span className="text-lg">🛏️</span>
                                <div className="flex-1">
                                  <p className="font-medium text-blue-400">Hébergement possible</p>
                                  {concert.accommodation_capacity > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Jusqu'à {concert.accommodation_capacity} personne{concert.accommodation_capacity > 1 ? 's' : ''}
                                    </p>
                                  )}
                                  {concert.accommodation_tbd && (
                                    <p className="text-xs text-yellow-400">À définir</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Karaoké Tab */}
          <TabsContent value="karaoke">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-xl">🎤 Soirées Karaoké</h2>
                <Dialog open={showKaraokeDialog} onOpenChange={setShowKaraokeDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
                      <Plus className="w-4 h-4" /> Nouvelle soirée karaoké
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Créer une soirée karaoké</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input 
                            type="date" 
                            value={karaokeForm.date} 
                            onChange={(e) => setKaraokeForm({ ...karaokeForm, date: e.target.value })} 
                            className="bg-black/20 border-white/10"
                            onKeyDown={(e) => e.preventDefault()}
                            style={{ caretColor: 'transparent' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure début</Label>
                          <TimeSelect
                            value={karaokeForm.start_time}
                            onChange={(value) => setKaraokeForm({ ...karaokeForm, start_time: value })}
                            placeholder="Heure de début"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure fin</Label>
                          <TimeSelect
                            value={karaokeForm.end_time}
                            onChange={(value) => setKaraokeForm({ ...karaokeForm, end_time: value })}
                            placeholder="Heure de fin"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Titre de la soirée</Label>
                        <Input 
                          value={karaokeForm.title} 
                          onChange={(e) => setKaraokeForm({ ...karaokeForm, title: e.target.value })} 
                          placeholder="Ex: Soirée Karaoké du vendredi"
                          className="bg-black/20 border-white/10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={karaokeForm.description} 
                          onChange={(e) => setKaraokeForm({ ...karaokeForm, description: e.target.value })} 
                          placeholder="Détails de la soirée karaoké..."
                          className="bg-black/20 border-white/10 min-h-[100px]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Styles musicaux</Label>
                        <Select 
                          value="" 
                          onValueChange={(value) => {
                            if (value && !karaokeForm.music_styles.includes(value)) {
                              setKaraokeForm({ 
                                ...karaokeForm, 
                                music_styles: [...karaokeForm.music_styles, value] 
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue placeholder="Sélectionnez un style" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                            {MUSIC_STYLES_LIST.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {karaokeForm.music_styles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {karaokeForm.music_styles.map((style, index) => (
                              <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                                {style}
                                <button 
                                  onClick={() => setKaraokeForm({ 
                                    ...karaokeForm, 
                                    music_styles: karaokeForm.music_styles.filter((_, i) => i !== index) 
                                  })}
                                  className="hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setShowKaraokeDialog(false)} variant="outline">Annuler</Button>
                      <Button onClick={createKaraoke} className="bg-primary hover:bg-primary/90">Créer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {karaokes.length === 0 ? (
                <div className="glassmorphism rounded-2xl p-6">
                  <p className="text-muted-foreground text-center py-8">
                    Aucune soirée karaoké prévue. Créez votre première soirée karaoké !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {karaokes.map((karaoke) => (
                    <div 
                      key={karaoke.id} 
                      className="glassmorphism rounded-xl p-5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-lg">{karaoke.title || "Soirée Karaoké"}</p>
                          <p className="text-muted-foreground text-sm">{karaoke.date} • {karaoke.start_time} - {karaoke.end_time}</p>
                          <p className="text-green-400 text-sm mt-1">
                            👥 {karaoke.participants_count || 0} participant{(karaoke.participants_count || 0) > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            if (window.confirm("Supprimer cette soirée karaoké ?")) {
                              try {
                                await axios.delete(`${API}/karaoke/${karaoke.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                toast.success("Soirée karaoké supprimée");
                                fetchEvents();
                              } catch (error) {
                                toast.error("Erreur lors de la suppression");
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {karaoke.description && (
                        <p className="text-muted-foreground text-sm mt-3">{karaoke.description}</p>
                      )}
                      {karaoke.music_styles && karaoke.music_styles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {karaoke.music_styles.map((s, i) => <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Spectacle Tab */}
          <TabsContent value="spectacle">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-xl">🎭 Spectacles</h2>
                <Dialog open={showSpectacleDialog} onOpenChange={setShowSpectacleDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
                      <Plus className="w-4 h-4" /> Nouveau spectacle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Créer un spectacle</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input 
                            type="date" 
                            value={spectacleForm.date} 
                            onChange={(e) => setSpectacleForm({ ...spectacleForm, date: e.target.value })} 
                            className="bg-black/20 border-white/10"
                            onKeyDown={(e) => e.preventDefault()}
                            style={{ caretColor: 'transparent' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure début</Label>
                          <TimeSelect
                            value={spectacleForm.start_time}
                            onChange={(value) => setSpectacleForm({ ...spectacleForm, start_time: value })}
                            placeholder="Heure de début"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure fin</Label>
                          <TimeSelect
                            value={spectacleForm.end_time}
                            onChange={(value) => setSpectacleForm({ ...spectacleForm, end_time: value })}
                            placeholder="Heure de fin"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Type de spectacle</Label>
                        <Select 
                          value={spectacleForm.type} 
                          onValueChange={(value) => setSpectacleForm({ ...spectacleForm, type: value })}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue placeholder="Sélectionnez le type" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-white/10">
                            <SelectItem value="humour">Humour / Stand-up</SelectItem>
                            <SelectItem value="theatre">Théâtre</SelectItem>
                            <SelectItem value="magie">Magie</SelectItem>
                            <SelectItem value="danse">Danse</SelectItem>
                            <SelectItem value="cirque">Cirque</SelectItem>
                            <SelectItem value="conte">Conte / Lecture</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Nom de l'artiste</Label>
                        <Input 
                          value={spectacleForm.artist_name} 
                          onChange={(e) => setSpectacleForm({ ...spectacleForm, artist_name: e.target.value })} 
                          placeholder="Nom de l'artiste ou de la troupe"
                          className="bg-black/20 border-white/10" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description du spectacle</Label>
                        <Textarea 
                          value={spectacleForm.description} 
                          onChange={(e) => setSpectacleForm({ ...spectacleForm, description: e.target.value })} 
                          placeholder="Description détaillée du spectacle..."
                          className="bg-black/20 border-white/10 min-h-[100px]" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Prix d'entrée (optionnel)</Label>
                        <Input 
                          value={spectacleForm.price} 
                          onChange={(e) => setSpectacleForm({ ...spectacleForm, price: e.target.value })} 
                          placeholder="Ex: 15€ / Gratuit"
                          className="bg-black/20 border-white/10" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setShowSpectacleDialog(false)} variant="outline">Annuler</Button>
                      <Button onClick={createSpectacle} className="bg-primary hover:bg-primary/90">Créer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {spectacles.length === 0 ? (
                <div className="glassmorphism rounded-2xl p-6">
                  <p className="text-muted-foreground text-center py-8">
                    Aucun spectacle prévu. Créez votre premier spectacle !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {spectacles.map((spectacle) => (
                    <div 
                      key={spectacle.id} 
                      className="glassmorphism rounded-xl p-5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-lg">{spectacle.artist_name}</p>
                          <p className="text-muted-foreground text-sm">{spectacle.date} • {spectacle.start_time} - {spectacle.end_time}</p>
                          <span className="inline-block px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full mt-2">
                            {spectacle.type}
                          </span>
                          {spectacle.price && (
                            <p className="text-green-400 text-sm mt-1">💰 {spectacle.price}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            if (window.confirm("Supprimer ce spectacle ?")) {
                              try {
                                await axios.delete(`${API}/spectacle/${spectacle.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                toast.success("Spectacle supprimé");
                                fetchEvents();
                              } catch (error) {
                                toast.error("Erreur lors de la suppression");
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {spectacle.description && (
                        <p className="text-muted-foreground text-sm mt-3">{spectacle.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>


          {/* Planning Tab - Calendrier Visuel */}
          <TabsContent value="planning">
            <div className="space-y-6">
              {/* Légendes du calendrier */}
              <div className="glassmorphism rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Légende :</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500/20 border-2 border-green-500"></div>
                    <span className="text-sm">Concert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-500/20 border-2 border-purple-500"></div>
                    <span className="text-sm">Bœuf</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-pink-500/20 border-2 border-pink-500"></div>
                    <span className="text-sm">Karaoké</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-cyan-500/20 border-2 border-cyan-500"></div>
                    <span className="text-sm">Spectacle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-yellow-500/20 border-2 border-yellow-500"></div>
                    <span className="text-sm">Ouvert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-500/20 border-2 border-orange-500"></div>
                    <span className="text-sm">En cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500/20 border-2 border-red-500"></div>
                    <span className="text-sm">Complet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500/20 border-2 border-blue-500"></div>
                    <span className="text-sm">Libre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-500/20 border-2 border-gray-500"></div>
                    <span className="text-sm">Passé</span>
                  </div>
                </div>
              </div>

              {/* Calendrier Visuel */}
              <Calendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onDateClick={handleDateClick}
                bookedDates={bookedDates}
                eventsByDate={eventsByDate}
                concerts={concerts}
                jams={jams}
                karaokes={karaokes}
                spectacles={spectacles}
                planningSlots={planningSlots}
              />

              {/* Modal de création de créneau */}
              <Dialog open={showPlanningModal} onOpenChange={setShowPlanningModal}>
                <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un créneau ouvert aux groupes</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <p className="text-sm">
                        📅 <strong>Date sélectionnée:</strong> {selectedDate && selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Heure du concert</Label>
                      <TimeSelect
                        value={planningForm.time}
                        onChange={(value) => setPlanningForm({ ...planningForm, time: value })}
                        placeholder="Heure du concert"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Titre de l'événement (optionnel)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: Soirée Rock, Concert acoustique..."
                        value={planningForm.title}
                        onChange={(e) => setPlanningForm({ ...planningForm, title: e.target.value })}
                        className="bg-black/20 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Décrivez le type de concert, l'ambiance recherchée..."
                        value={planningForm.description}
                        onChange={(e) => setPlanningForm({ ...planningForm, description: e.target.value })}
                        rows={3}
                        className="bg-black/20 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type de candidatures *</Label>
                      <select 
                        value={planningForm.application_type || "bands"} 
                        onChange={(e) => {
                          const type = e.target.value;
                          setPlanningForm({ 
                            ...planningForm, 
                            application_type: type,
                            num_bands_needed: type === "solo" ? 1 : planningForm.num_bands_needed 
                          });
                        }}
                        className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
                      >
                        <option value="bands">Groupes</option>
                        <option value="solo">Solo</option>
                        <option value="both">Groupes et Solo</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Choisissez si vous acceptez des groupes, des musiciens solo, ou les deux
                      </p>
                    </div>

                    {(planningForm.application_type === "bands" || planningForm.application_type === "both" || !planningForm.application_type) && (
                      <div className="space-y-2">
                        <Label>Nombre de groupes souhaités pour ce créneau *</Label>
                        <select 
                          value={planningForm.num_bands_needed} 
                          onChange={(e) => setPlanningForm({ ...planningForm, num_bands_needed: parseInt(e.target.value) })}
                          className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
                        >
                          <option value="1">1 groupe</option>
                          <option value="2">2 groupes</option>
                          <option value="3">3 groupes ou plus</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Le créneau restera ouvert aux candidatures tant que le nombre de groupes demandés n'aura pas été atteint
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Styles musicaux recherchés
                      </Label>
                      <Select 
                        value="" 
                        onValueChange={(value) => {
                          if (value && !planningForm.music_styles.includes(value)) {
                            setPlanningForm({ 
                              ...planningForm, 
                              music_styles: [...planningForm.music_styles, value] 
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez un ou plusieurs styles" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                          {MUSIC_STYLES_LIST.map(style => (
                            <SelectItem 
                              key={style} 
                              value={style}
                              disabled={planningForm.music_styles.includes(style)}
                            >
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {planningForm.music_styles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {planningForm.music_styles.map((style, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                            >
                              {style}
                              <button 
                                type="button"
                                onClick={() => setPlanningForm({ 
                                  ...planningForm, 
                                  music_styles: planningForm.music_styles.filter((_, i) => i !== idx) 
                                })}
                                className="hover:text-primary-foreground"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Affluence estimée (nombre de personnes)</Label>
                      <Select 
                        value={planningForm.expectedAttendance || ""} 
                        onValueChange={(value) => setPlanningForm({ ...planningForm, expectedAttendance: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez l'affluence attendue" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                          {Array.from({ length: 49 }, (_, i) => (i + 2) * 10).map(count => (
                            <SelectItem key={count} value={count.toString()}>
                              {count} personnes
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-white/10">
                      <Label className="text-base font-semibold">💰 Rémunération proposée</Label>
                      
                      {/* Option 1: Proposition manuelle */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_type"
                          value="manual"
                          checked={planningForm.payment_type === 'manual'}
                          onChange={(e) => setPlanningForm({ ...planningForm, payment_type: e.target.value, payment_base: '' })}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <Label className="cursor-pointer" onClick={() => setPlanningForm({ ...planningForm, payment_type: 'manual', payment_base: '' })}>
                            Proposition manuelle
                          </Label>
                          {planningForm.payment_type === 'manual' && (
                            <Input
                              type="text"
                              placeholder="Ex: 200€, 150€ + bar, Visibilité..."
                              value={planningForm.payment}
                              onChange={(e) => setPlanningForm({ ...planningForm, payment: e.target.value })}
                              className="bg-black/20 border-white/10"
                            />
                          )}
                        </div>
                      </div>

                      {/* Option 2: Au chapeau */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_type"
                          value="hat"
                          checked={planningForm.payment_type === 'hat'}
                          onChange={(e) => setPlanningForm({ ...planningForm, payment_type: e.target.value, payment: 'Au chapeau' })}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <Label className="cursor-pointer" onClick={() => setPlanningForm({ ...planningForm, payment_type: 'hat', payment: 'Au chapeau' })}>
                            Au chapeau
                          </Label>
                          {planningForm.payment_type === 'hat' && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Les spectateurs donnent ce qu'ils souhaitent à la fin du concert
                              </p>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs whitespace-nowrap">Base minimum (optionnel) :</Label>
                                <Input
                                  type="text"
                                  placeholder="Ex: 50€, 100€..."
                                  value={planningForm.payment_base}
                                  onChange={(e) => setPlanningForm({ ...planningForm, payment_base: e.target.value })}
                                  className="bg-black/20 border-white/10"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Option 3: Aux entrées */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_type"
                          value="tickets"
                          checked={planningForm.payment_type === 'tickets'}
                          onChange={(e) => setPlanningForm({ ...planningForm, payment_type: e.target.value, payment: 'Aux entrées (billetterie auto-gérée)', payment_base: '' })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label className="cursor-pointer" onClick={() => setPlanningForm({ ...planningForm, payment_type: 'tickets', payment: 'Aux entrées (billetterie auto-gérée)', payment_base: '' })}>
                            Aux entrées (billetterie auto-gérée par le/les groupes)
                          </Label>
                          {planningForm.payment_type === 'tickets' && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Les groupes gèrent leur propre billetterie et conservent les recettes des entrées
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Catering Section */}
                    <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-white/10">
                      <Label className="text-base flex items-center gap-2">
                        🍽️ Catering <span className="text-xs text-muted-foreground">(la ration pour les ménestrels)</span>
                      </Label>
                      
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={planningForm.has_catering || false} 
                          onCheckedChange={(c) => setPlanningForm({ ...planningForm, has_catering: c, catering_drinks: c ? planningForm.catering_drinks : 0 })} 
                        />
                        <Label>Restauration disponible</Label>
                      </div>

                      {planningForm.has_catering && (
                        <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                          <div className="space-y-2">
                            <Label>Boissons (nombre)</Label>
                            <Select 
                              value={planningForm.catering_drinks?.toString() || "0"} 
                              onValueChange={(value) => setPlanningForm({ ...planningForm, catering_drinks: parseInt(value) })}
                            >
                              <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-white/10">
                                {[...Array(11)].map((_, i) => (
                                  <SelectItem key={i} value={i.toString()}>{i === 0 ? "Aucune" : `${i} boisson${i > 1 ? 's' : ''}`}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="planning-catering-respect"
                              checked={planningForm.catering_respect || false}
                              onChange={(e) => setPlanningForm({ ...planningForm, catering_respect: e.target.checked })}
                              className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded"
                            />
                            <Label htmlFor="planning-catering-respect" className="text-sm">
                              Ne pas abuser de la gentillesse du patron
                            </Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="planning-catering-tbd"
                              checked={planningForm.catering_tbd || false}
                              onChange={(e) => setPlanningForm({ ...planningForm, catering_tbd: e.target.checked })}
                              className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded"
                            />
                            <Label htmlFor="planning-catering-tbd" className="text-sm">
                              À définir
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accommodation Section */}
                    <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-white/10">
                      <Label className="text-base flex items-center gap-2">
                        🛏️ Hébergement possible
                      </Label>
                      
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={planningForm.has_accommodation || false} 
                          onCheckedChange={(c) => setPlanningForm({ ...planningForm, has_accommodation: c, accommodation_capacity: c ? planningForm.accommodation_capacity : 0 })} 
                        />
                        <Label>Hébergement disponible</Label>
                      </div>

                      {planningForm.has_accommodation && (
                        <div className="space-y-2 pl-6 border-l-2 border-primary/30">
                          <Label>Nombre de personnes</Label>
                          <div className="grid grid-cols-5 gap-2">
                            {[...Array(10)].map((_, i) => {
                              const capacity = i + 1;
                              return (
                                <button
                                  key={capacity}
                                  type="button"
                                  onClick={() => setPlanningForm({ ...planningForm, accommodation_capacity: capacity })}
                                  className={`
                                    p-2 rounded-lg border-2 transition-all font-semibold
                                    ${planningForm.accommodation_capacity === capacity 
                                      ? 'bg-primary/20 border-primary text-primary' 
                                      : 'bg-black/20 border-white/10 hover:border-white/30'
                                    }
                                  `}
                                >
                                  {capacity}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      {editingPlanningSlotId ? (
                        // Mode édition : boutons Sauvegarder, Supprimer et Annuler
                        <>
                          <Button
                            onClick={handleUpdatePlanningSlot}
                            className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Sauvegarder
                          </Button>
                          <Button
                            onClick={handleDeletePlanningSlot}
                            variant="outline"
                            className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                          <Button
                            onClick={() => {
                              setShowPlanningModal(false);
                              setSelectedDate(null);
                              setEditingPlanningSlotId(null);
                              setPlanningForm({
                                date: '',
                                time: '',
                                title: '',
                                music_styles: [],
                                description: '',
                                expectedBandStyle: '',
                                expectedAttendance: '',
                                payment: '',
                                payment_type: 'manual',
                                payment_base: '',
                                artist_categories: [],
                                num_bands_needed: 1,
                                has_catering: false,
                                catering_drinks: 0,
                                catering_respect: false,
                                catering_tbd: false,
                                has_accommodation: false,
                                accommodation_capacity: 0,
                                accommodation_tbd: false
                              });
                            }}
                            variant="outline"
                            className="rounded-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Annuler
                          </Button>
                        </>
                      ) : (
                        // Mode création : boutons Publier et Annuler
                        <>
                          <Button
                            onClick={handleCreatePlanningSlot}
                            className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                          >
                            Publier le créneau
                          </Button>
                          <Button
                            onClick={() => {
                              setShowPlanningModal(false);
                              setSelectedDate(null);
                              setEditingPlanningSlotId(null);
                              setPlanningForm({
                                date: '',
                                time: '',
                                title: '',
                                music_styles: [],
                                description: '',
                                expectedBandStyle: '',
                                expectedAttendance: '',
                                payment: '',
                                payment_type: 'manual',
                                payment_base: '',
                                artist_categories: [],
                                num_bands_needed: 1,
                                has_catering: false,
                                catering_drinks: 0,
                                catering_respect: false,
                                catering_tbd: false,
                                has_accommodation: false,
                                accommodation_capacity: 0,
                                accommodation_tbd: false
                              });
                              fetchPlanningSlots();
                            }}
                            variant="outline"
                            className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Annuler
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Applications Dialog */}
              <Dialog open={!!viewingApplications} onOpenChange={() => setViewingApplications(null)}>
                <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Candidatures reçues</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    {(!applications[viewingApplications] || applications[viewingApplications].length === 0) ? (
                      <p className="text-muted-foreground text-center py-4">Aucune candidature</p>
                    ) : applications[viewingApplications].map((app) => (
                      <div key={app.id} className="p-5 border border-white/10 rounded-xl hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                          {/* Photo du groupe ou profil */}
                          {app.band_photo ? (
                            <LazyImage 
                              src={app.band_photo} 
                              alt={app.band_name} 
                              className="w-16 h-16 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                              <Music className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-heading font-semibold text-lg">{app.band_name}</h3>
                                <Link 
                                  to={`/musician/${app.musician_id}`}
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                  onClick={() => setViewingApplications(null)}
                                >
                                  <User className="w-3 h-3" />
                                  Postulé par {app.musician_name}
                                </Link>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'accepted' ? 'bg-green-500/20 text-green-400' : app.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {app.status === 'accepted' ? '✓ Accepté' : app.status === 'rejected' ? '✗ Refusé' : '⏳ En attente'}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="text-muted-foreground">Style:</span>{' '}
                                <span className="text-primary font-medium">{app.music_style}</span>
                              </p>
                              
                              {app.description && (
                                <p className="text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                                  {app.description}
                                </p>
                              )}
                              
                              {/* Contact info */}
                              {(app.contact_email || app.contact_phone) && (
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {app.contact_email && (
                                    <a href={`mailto:${app.contact_email}`} className="hover:text-primary">
                                      📧 {app.contact_email}
                                    </a>
                                  )}
                                  {app.contact_phone && (
                                    <a href={`tel:${app.contact_phone}`} className="hover:text-primary">
                                      📞 {app.contact_phone}
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {/* Social links */}
                              {app.links && Object.keys(app.links).length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {app.links.facebook && (
                                    <a href={app.links.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                      <Facebook className="w-4 h-4" />
                                    </a>
                                  )}
                                  {app.links.instagram && (
                                    <a href={app.links.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                      <Instagram className="w-4 h-4" />
                                    </a>
                                  )}
                                  {app.links.youtube && (
                                    <a href={app.links.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                      <Youtube className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Action buttons */}
                            {app.status === 'pending' && (
                              <div className="flex gap-2 mt-4">
                                <Button 
                                  onClick={() => handleApplication(app.id, 'accept')} 
                                  className="flex-1 bg-green-500 hover:bg-green-600 rounded-full gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Accepter
                                </Button>
                                <Button 
                                  onClick={() => handleApplication(app.id, 'reject')} 
                                  variant="outline" 
                                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10 rounded-full gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Refuser
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Candidatures Tab - Créneaux ouverts aux groupes */}
          <TabsContent value="candidatures">
            <div className="space-y-6">
              {/* Liste des créneaux ouverts */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">📅 Créneaux ouverts aux candidatures</h2>
                
                {planningSlots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun créneau ouvert pour le moment</p>
                    <p className="text-sm mt-2">Allez dans l'onglet "Planning" et cliquez sur un jour libre (bleu) dans le calendrier pour créer un créneau</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {planningSlots.map((slot) => (
                      <div key={slot.id} className="p-5 border border-white/10 rounded-xl hover:border-primary/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full font-semibold">
                                {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              {slot.time && (
                                <span className="text-sm text-muted-foreground">🕐 {slot.time}</span>
                              )}
                              {slot.is_open ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Ouvert</span>
                              ) : (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Fermé</span>
                              )}
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                {slot.accepted_bands_count || 0}/{slot.num_bands_needed || 1} groupe{(slot.num_bands_needed || 1) > 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {slot.title && (
                              <h3 className="font-heading font-semibold text-lg mb-2">{slot.title}</h3>
                            )}
                            
                            {slot.description && (
                              <p className="text-sm text-muted-foreground mb-3">{slot.description}</p>
                            )}
                            
                            {slot.expected_band_style && (
                              <p className="text-sm mb-2">
                                <span className="text-muted-foreground">Style recherché:</span>{' '}
                                <span className="text-primary font-medium">{slot.expected_band_style}</span>
                              </p>
                            )}
                            
                            {slot.expected_attendance > 0 && (
                              <p className="text-sm mb-2">
                                <span className="text-muted-foreground">Affluence estimée:</span>{' '}
                                <span className="font-medium">{slot.expected_attendance} personnes</span>
                              </p>
                            )}
                            
                            {slot.payment && (
                              <p className="text-sm mb-2">
                                <span className="text-muted-foreground">Rémunération:</span>{' '}
                                <span className="text-green-400 font-medium">{slot.payment}</span>
                              </p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => {
                              setViewingApplications(slot.id);
                              fetchApplications(slot.id);
                            }}
                            variant="outline"
                            className="rounded-full gap-2"
                          >
                            <Users className="w-4 h-4" />
                            Candidatures ({applications[slot.id]?.length || 0})
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Jacks (Subscribers) Tab */}
          <TabsContent value="jacks">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-2xl mb-6 flex items-center gap-2">
                <Plug className="w-6 h-6 text-primary" />
                Jacks - Abonnés ({subscribers.length})
              </h2>
              
              {subscribers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Vous n'avez pas encore d'abonnés</p>
                  <p className="text-sm mt-2">Les musiciens qui se connectent à votre établissement apparaîtront ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="card-venue p-5">
                      <div className="flex items-start gap-4">
                        {subscriber.profile_image ? (
                          <LazyImage 
                            src={subscriber.profile_image} 
                            alt={subscriber.pseudo || "Abonné"} 
                            className="w-16 h-16 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold">{subscriber.pseudo}</h3>
                          {subscriber.city && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {subscriber.city}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {subscriber.instruments?.slice(0, 2).map((inst, i) => (
                              <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link to={subscriber.role === 'musician' ? `/musician/${subscriber.id}` : `/melomane/${subscriber.id}`}>
                          <Button variant="outline" className="w-full rounded-full gap-2">
                            <User className="w-4 h-4" /> Voir profil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Broadcast Notification Form */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">📢 Envoyer une notification</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Choisissez les destinataires et envoyez votre message.
                </p>
                
                <div className="space-y-4">
                  {/* Recipient Selection */}
                  <div>
                    <Label className="mb-3 block">Destinataires</Label>
                    <div className="space-y-3">
                      <div 
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${notificationTarget === 'subscribers' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => setNotificationTarget('subscribers')}
                      >
                        <input 
                          type="radio" 
                          name="target" 
                          value="subscribers" 
                          checked={notificationTarget === 'subscribers'}
                          onChange={() => setNotificationTarget('subscribers')}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Plug className="w-4 h-4 text-primary" />
                            <span className="font-semibold">Mes Jacks (Abonnés)</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {subscribers.length} abonné{subscribers.length > 1 ? 's' : ''} recevr{subscribers.length > 1 ? 'ont' : 'a'} la notification
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${notificationTarget === 'nearby' ? 'border-secondary bg-secondary/10' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => setNotificationTarget('nearby')}
                      >
                        <input 
                          type="radio" 
                          name="target" 
                          value="nearby" 
                          checked={notificationTarget === 'nearby'}
                          onChange={() => setNotificationTarget('nearby')}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-secondary" />
                            <span className="font-semibold">Musiciens à proximité (100 km)</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estimation : {nearbyMusiciansCount} musicien{nearbyMusiciansCount > 1 ? 's' : ''} dans un rayon de 100 km
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${notificationTarget === 'all' ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => setNotificationTarget('all')}
                      >
                        <input 
                          type="radio" 
                          name="target" 
                          value="all" 
                          checked={notificationTarget === 'all'}
                          onChange={() => setNotificationTarget('all')}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span className="font-semibold">Jacks ET Musiciens à proximité</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estimation : {subscribers.length + nearbyMusiciansCount} destinataire{(subscribers.length + nearbyMusiciansCount) > 1 ? 's' : ''} (combiné)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-xl">Historique des notifications</h2>
                  {broadcastHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm(`Êtes-vous sûr de vouloir supprimer TOUT l'historique des notifications ? (${broadcastHistory.length} notification${broadcastHistory.length > 1 ? 's' : ''})\n\nCette action est irréversible.`)) {
                          try {
                            const response = await axios.delete(`${API}/venues/me/broadcast-history`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            toast.success(`${response.data.deleted_count} notification${response.data.deleted_count > 1 ? 's supprimées' : ' supprimée'}`);
                            // Clear history
                            setBroadcastHistory([]);
                          } catch (error) {
                            toast.error('Erreur lors de la suppression');
                          }
                        }
                      }}
                      className="text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Tout effacer
                    </Button>
                  )}
                </div>
                
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              {broadcast.recipients_count} destinataire{broadcast.recipients_count > 1 ? 's' : ''}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification de l\'historique ?')) {
                                  try {
                                    await axios.delete(`${API}/venues/me/broadcast-history/${encodeURIComponent(broadcast.id)}`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    toast.success('Notification supprimée de l\'historique');
                                    // Refresh history
                                    const response = await axios.get(`${API}/venues/me/broadcast-history`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    setBroadcastHistory(response.data);
                                  } catch (error) {
                                    toast.error('Erreur lors de la suppression');
                                  }
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
                            <LazyImage 
                              src={review.musician_image} 
                              alt={review.musician_name} 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
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

          {/* Bands Tab */}
          <TabsContent value="bands">
            <div className="space-y-6">
              {/* Filters */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">🎸 Répertoire des Groupes</h2>
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
                    <div key={band.id} className="glassmorphism rounded-xl p-5">
                      {band.photo && (
                        <LazyImage 
                          src={band.photo} 
                          alt={band.name} 
                          className="w-full h-40 object-cover rounded-lg mb-4" 
                        />
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

                      <div className="flex gap-2 flex-wrap mb-3">
                        {band.facebook && (
                          <a href={band.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                        {band.instagram && (
                          <a href={band.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {band.youtube && (
                          <a href={band.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                            <Youtube className="w-4 h-4" />
                          </a>
                        )}
                        {band.website && (
                          <a href={band.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="flex-1 bg-cyan-500 hover:bg-cyan-600 rounded-full gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Voir le profil complet
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">{band.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              {band.photo && (
                                <LazyImage 
                                  src={band.photo} 
                                  alt={band.name} 
                                  className="w-full h-60 object-cover rounded-lg" 
                                />
                              )}
                              
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{band.city} {band.department && `(${band.department})`}</span>
                              </div>

                              {band.members_count && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  <span>{band.members_count} membre(s)</span>
                                </div>
                              )}

                              {band.description && (
                                <div>
                                  <Label className="text-base font-semibold mb-2 block">Description</Label>
                                  <p className="text-sm text-muted-foreground">{band.description}</p>
                                </div>
                              )}

                              {band.music_styles?.length > 0 && (
                                <div>
                                  <Label className="text-base font-semibold mb-2 block">Styles musicaux</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {band.music_styles.map((style, i) => (
                                      <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">{style}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 flex-wrap">
                                {band.looking_for_concerts && (
                                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                                    🎤 Cherche concerts
                                  </span>
                                )}
                                {band.looking_for_members && (
                                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                    👥 Cherche membres
                                  </span>
                                )}
                              </div>

                              {(band.is_association && band.association_name) && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                  <Label className="text-base font-semibold mb-2 block text-blue-400">🏛️ Association</Label>
                                  <p className="text-sm">{band.association_name}</p>
                                </div>
                              )}

                              {(band.has_label && band.label_name) && (
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                  <Label className="text-base font-semibold mb-2 block text-purple-400">🎵 Label de musique</Label>
                                  <p className="text-sm">{band.label_name}</p>
                                  {band.label_city && <p className="text-sm text-muted-foreground mt-1">📍 {band.label_city}</p>}
                                </div>
                              )}

                              {(band.facebook || band.instagram || band.youtube || band.website) && (
                                <div>
                                  <Label className="text-base font-semibold mb-2 block">Réseaux sociaux</Label>
                                  <div className="flex gap-3">
                                    {band.facebook && (
                                      <a href={band.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                                        <Facebook className="w-5 h-5" />
                                      </a>
                                    )}
                                    {band.instagram && (
                                      <a href={band.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                                        <Instagram className="w-5 h-5" />
                                      </a>
                                    )}
                                    {band.youtube && (
                                      <a href={band.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                                        <Youtube className="w-5 h-5" />
                                      </a>
                                    )}
                                    {band.website && (
                                      <a href={band.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white">
                                        <Globe className="w-5 h-5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          onClick={() => {
                            setSelectedBand(band);
                            setShowMessageDialog(true);
                          }}
                          className="flex-1 bg-primary hover:bg-primary/90 rounded-full gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Contacter
                        </Button>
                      </div>
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
                        placeholder="Ex: Proposition de concert"
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

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <div className="space-y-6">
              <div className="glassmorphism rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-heading font-semibold text-xl">📸 Galerie Photos</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {gallery.length}/20 photos
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files[0] && uploadGalleryPhoto(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingPhoto || gallery.length >= 20}
                    />
                    <Button 
                      disabled={uploadingPhoto || gallery.length >= 20}
                      className="bg-primary hover:bg-primary/90 rounded-full gap-2"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Ajouter Photo
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {gallery.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune photo dans la galerie</p>
                    <p className="text-sm mt-2">Ajoutez des photos de vos soirées !</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((photo, index) => (
                      <div key={index} className="relative group">
                        <LazyImage 
                          src={photo} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            onClick={() => deleteGalleryPhoto(photo)}
                            variant="destructive"
                            size="sm"
                            className="rounded-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="history">
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-semibold text-xl mb-2">📊 Historique & Rentabilité</h2>
                  <p className="text-muted-foreground text-sm">
                    Suivez la rentabilité de vos événements passés et analysez vos statistiques
                  </p>
                </div>
              </div>

              {/* Disclaimer - Avertissement */}
              <div className="mb-6 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500 text-xl flex-shrink-0">ℹ️</span>
                  <div>
                    <p className="font-semibold text-yellow-500 mb-1">Indicateurs donnés à titre informatif</p>
                    <p className="text-sm text-muted-foreground">
                      L'utilisateur reste seul responsable des décisions prises sur leur base.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">Période</Label>
                    <select
                      value={historyFilters.period}
                      onChange={(e) => setHistoryFilters({...historyFilters, period: e.target.value, customStartDate: '', customEndDate: ''})}
                      className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
                    >
                      <option value="all">Toutes les périodes</option>
                      <option value="month">Dernier mois</option>
                      <option value="quarter">Dernier trimestre</option>
                      <option value="year">Dernière année</option>
                      <option value="custom">Période personnalisée</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">Type d'événement</Label>
                    <select
                      value={historyFilters.type}
                      onChange={(e) => setHistoryFilters({...historyFilters, type: e.target.value})}
                      className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
                    >
                      <option value="all">Tous les événements</option>
                      <option value="jam">Bœufs uniquement</option>
                      <option value="concert">Concerts uniquement</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">Style musical</Label>
                    <select
                      value={historyFilters.style}
                      onChange={(e) => setHistoryFilters({...historyFilters, style: e.target.value})}
                      className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
                    >
                      <option value="all">Tous les styles</option>
                      {MUSIC_STYLES_LIST.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Date Range - Only shown when custom period selected */}
                {historyFilters.period === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <Label className="text-sm mb-2 block">Date de début</Label>
                      <Input
                        type="date"
                        value={historyFilters.customStartDate}
                        onChange={(e) => setHistoryFilters({...historyFilters, customStartDate: e.target.value})}
                        className="bg-black/20 border-white/10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Date de fin</Label>
                      <Input
                        type="date"
                        value={historyFilters.customEndDate}
                        onChange={(e) => setHistoryFilters({...historyFilters, customEndDate: e.target.value})}
                        className="bg-black/20 border-white/10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics Summary */}
              {pastEvents.length > 0 && (() => {
                const filteredStats = getFilteredStats();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl border border-green-500/30">
                      <p className="text-sm text-muted-foreground mb-1">Bénéfice Total</p>
                      <p className="text-2xl font-bold text-green-400">
                        {filteredStats.global.total_profit.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/30">
                      <p className="text-sm text-muted-foreground mb-1">Recettes Totales</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {filteredStats.global.total_revenue.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl border border-orange-500/30">
                      <p className="text-sm text-muted-foreground mb-1">Dépenses Totales</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {filteredStats.global.total_expenses.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30">
                      <p className="text-sm text-muted-foreground mb-1">Bénéfice Moyen</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {filteredStats.global.avg_profit_per_event.toLocaleString('fr-FR')} €
                      </p>
                      <p className="text-xs text-muted-foreground">{filteredStats.global.event_count} événements</p>
                    </div>
                  </div>
                );
              })()}

              {/* Statistics by Style */}
              {pastEvents.length > 0 && (() => {
                const filteredStats = getFilteredStats();
                return Object.keys(filteredStats.by_style).length > 0 && (
                  <div className="mb-6 p-4 bg-muted/30 rounded-xl">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5 text-primary" />
                      Rentabilité par style musical
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(filteredStats.by_style)
                        .sort((a, b) => b[1].avg_profit - a[1].avg_profit)
                        .map(([style, stats]) => (
                          <div key={style} className="p-3 bg-black/20 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{style}</span>
                              <span className="text-sm text-muted-foreground">{stats.count} événements</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Bénéfice moyen</p>
                                <p className={`font-semibold ${stats.avg_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {stats.avg_profit.toLocaleString('fr-FR')} €
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className={`font-semibold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {stats.profit.toLocaleString('fr-FR')} €
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })()}

              {/* Past Events List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Événements passés ({getFilteredEvents().length})</h3>
                </div>

                {getFilteredEvents().length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">Aucun événement passé</p>
                    <p className="text-sm text-muted-foreground">
                      Les événements passés apparaîtront ici pour suivre leur rentabilité
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredEvents().map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-card rounded-xl border border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => handleEditEvent(event, event.type)}
                        title="Cliquez pour voir les détails de l'événement"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Eye className="w-4 h-4 text-primary opacity-60" />
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                event.type === 'jam' 
                                  ? 'bg-purple-500/20 text-purple-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {event.type === 'jam' ? '🎸 Bœuf' : '🎤 Concert'}
                              </span>
                              {event.profitability ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                  ✓ Rentabilité renseignée
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400">
                                  ⚠ À compléter
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-semibold mb-1">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              📅 {new Date(event.date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })} à {event.start_time}
                            </p>
                            
                            {event.music_styles && event.music_styles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {event.music_styles.map((style, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                    {style}
                                  </span>
                                ))}
                              </div>
                            )}

                            {event.profitability && (
                              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Recettes</p>
                                    <p className="font-semibold text-blue-400">
                                      +{event.profitability.revenue.toLocaleString('fr-FR')} €
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Dépenses</p>
                                    <p className="font-semibold text-orange-400">
                                      -{event.profitability.expenses.toLocaleString('fr-FR')} €
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Bénéfice</p>
                                    <p className={`font-semibold ${
                                      event.profitability.profit >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {event.profitability.profit >= 0 ? '+' : ''}{event.profitability.profit.toLocaleString('fr-FR')} €
                                    </p>
                                  </div>
                                </div>
                                {event.profitability.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    📝 {event.profitability.notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openProfitabilityEdit(event);
                            }}
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            {event.profitability ? <Edit className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                            {event.profitability ? 'Modifier' : 'Ajouter'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Dialog for editing profitability */}
          <Dialog open={editingProfitability !== null} onOpenChange={(open) => !open && setEditingProfitability(null)}>
            <DialogContent className="glassmorphism border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle>
                  💰 Rentabilité - {editingProfitability?.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    📅 {editingProfitability && new Date(editingProfitability.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Recettes (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1500"
                    value={profitabilityForm.revenue}
                    onChange={(e) => setProfitabilityForm({...profitabilityForm, revenue: e.target.value})}
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dépenses (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 800"
                    value={profitabilityForm.expenses}
                    onChange={(e) => setProfitabilityForm({...profitabilityForm, expenses: e.target.value})}
                    className="bg-black/20 border-white/10"
                  />
                </div>

                {profitabilityForm.revenue && profitabilityForm.expenses && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Bénéfice net</p>
                    <p className={`text-2xl font-bold ${
                      (parseFloat(profitabilityForm.revenue) - parseFloat(profitabilityForm.expenses)) >= 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {(parseFloat(profitabilityForm.revenue) - parseFloat(profitabilityForm.expenses)).toLocaleString('fr-FR')} €
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Ex: Bonne affluence, beau temps, groupe très apprécié..."
                    value={profitabilityForm.notes}
                    onChange={(e) => setProfitabilityForm({...profitabilityForm, notes: e.target.value})}
                    className="bg-black/20 border-white/10"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => updateEventProfitability(editingProfitability.id, editingProfitability.type)}
                  className="w-full bg-primary hover:bg-primary/90 rounded-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-xl mb-6">Paramètres</h2>
              <div className="space-y-6">
                <OnlineStatusSelector />
                <BackgroundSyncSettings />
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Modale d'affichage/édition d'événement */}
        <Dialog open={showEventDetailsModal} onOpenChange={(open) => {
          setShowEventDetailsModal(open);
          if (!open) {
            // Réinitialiser l'état quand la modale se ferme
            setSelectedEvent(null);
            setSelectedEventType(null);
            setIsEditingEvent(false);
          }
        }}>
          <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {isEditingEvent ? 'Modifier' : 'Détails'} {selectedEventType === 'concert' ? 'du Concert' : 'du Bœuf'}
              </DialogTitle>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-4 mt-4">
                {/* Date et Horaires */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedEvent.date || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                      className="bg-black/20 border-white/10"
                      disabled={!isEditingEvent}
                      onKeyDown={(e) => e.preventDefault()}
                      style={{ caretColor: 'transparent' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horaire de début</Label>
                    {isEditingEvent ? (
                      <TimeSelect
                        value={selectedEvent.start_time || ''}
                        onChange={(value) => setSelectedEvent({ ...selectedEvent, start_time: value })}
                        placeholder="Heure de début"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={selectedEvent.start_time || ''}
                        className="bg-black/20 border-white/10"
                        disabled
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Horaire de fin</Label>
                  {isEditingEvent ? (
                    <TimeSelect
                      value={selectedEvent.end_time || ''}
                      onChange={(value) => setSelectedEvent({ ...selectedEvent, end_time: value })}
                      placeholder="Heure de fin"
                    />
                  ) : (
                    <Input
                      type="text"
                      value={selectedEvent.end_time || ''}
                      className="bg-black/20 border-white/10"
                      disabled
                    />
                  )}
                </div>

                {/* Champs spécifiques au Concert */}
                {selectedEventType === 'concert' && (
                  <>
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={selectedEvent.title || ''}
                        onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                        className="bg-black/20 border-white/10"
                        disabled={!isEditingEvent}
                      />
                    </div>

                    {/* Musical Styles Section for Concert */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Styles musicaux
                      </Label>
                      {isEditingEvent ? (
                        <>
                          <Select 
                            value="" 
                            onValueChange={(value) => {
                              if (value && !selectedEvent.music_styles?.includes(value)) {
                                setSelectedEvent({ 
                                  ...selectedEvent, 
                                  music_styles: [...(selectedEvent.music_styles || []), value] 
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue placeholder="Sélectionnez un style" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                              {MUSIC_STYLES_LIST.map(style => (
                                <SelectItem 
                                  key={style} 
                                  value={style}
                                  disabled={selectedEvent.music_styles?.includes(style)}
                                >
                                  {style}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedEvent.music_styles && selectedEvent.music_styles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedEvent.music_styles.map((style, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                                >
                                  {style}
                                  <button 
                                    type="button"
                                    onClick={() => setSelectedEvent({ 
                                      ...selectedEvent, 
                                      music_styles: selectedEvent.music_styles.filter((_, i) => i !== idx) 
                                    })}
                                    className="hover:text-primary-foreground"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.music_styles && selectedEvent.music_styles.length > 0 ? (
                            selectedEvent.music_styles.map((style, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                              >
                                {style}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Aucun style défini</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={selectedEvent.description || ''}
                        onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                        className="bg-black/20 border-white/10"
                        rows={3}
                        disabled={!isEditingEvent}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prix</Label>
                      <Input
                        value={selectedEvent.price || ''}
                        onChange={(e) => setSelectedEvent({ ...selectedEvent, price: e.target.value })}
                        placeholder="Ex: 10€"
                        className="bg-black/20 border-white/10"
                        disabled={!isEditingEvent}
                      />
                    </div>

                    {/* Section Artistes/Groupes */}
                    <div className="space-y-2">
                      <Label>Artistes / Groupes</Label>
                      
                      {isEditingEvent ? (
                        // Mode édition : permettre d'ajouter/supprimer des groupes
                        <div className="space-y-3">
                          {/* Formulaire d'ajout de groupe */}
                          <div className="p-4 border border-white/10 rounded-xl space-y-3">
                            <div className="relative">
                              <Input 
                                placeholder="Nom du groupe (commencez à taper pour rechercher)" 
                                value={newBand.name} 
                                onChange={(e) => setNewBand({ ...newBand, name: e.target.value })} 
                                onFocus={() => {
                                  if (bandSuggestions.length > 0) setShowBandSuggestions(true);
                                }}
                                className="bg-black/20 border-white/10" 
                              />
                              
                              {/* Suggestions dropdown */}
                              {showBandSuggestions && bandSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {bandSuggestions.map((band, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setNewBand({ 
                                          ...newBand, 
                                          name: band.name,
                                          members_count: band.members_count || 0
                                        });
                                        setShowBandSuggestions(false);
                                        toast.success(`Groupe "${band.name}" sélectionné`);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-semibold text-white">{band.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {band.members_count && `${band.members_count} membres`}
                                          </p>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Nombre de membres du groupe</Label>
                              <Input 
                                type="number" 
                                min="1"
                                placeholder="Ex: 4" 
                                value={newBand.members_count || ""} 
                                onChange={(e) => setNewBand({ ...newBand, members_count: parseInt(e.target.value) || 0 })} 
                                className="bg-black/20 border-white/10" 
                              />
                            </div>
                            
                            <Button 
                              type="button" 
                              onClick={() => {
                                if (newBand.name) {
                                  setSelectedEvent({ 
                                    ...selectedEvent, 
                                    bands: [...(selectedEvent.bands || []), { ...newBand }] 
                                  });
                                  setNewBand({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });
                                  setShowBandSuggestions(false);
                                }
                              }} 
                              variant="outline" 
                              className="w-full border-white/20"
                            >
                              Ajouter le groupe
                            </Button>
                          </div>
                          
                          {/* Liste des groupes */}
                          {selectedEvent.bands && selectedEvent.bands.length > 0 && (
                            <div className="space-y-2">
                              {selectedEvent.bands.map((band, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium">{band.name}</p>
                                    {band.members_count && (
                                      <span className="text-sm text-muted-foreground">
                                        {band.members_count} membre{band.members_count > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedEvent({ 
                                        ...selectedEvent, 
                                        bands: selectedEvent.bands.filter((_, idx) => idx !== i) 
                                      });
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Total des musiciens */}
                          {selectedEvent.bands && selectedEvent.bands.length > 0 && (
                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                              <p className="text-sm font-semibold text-primary">
                                Total : {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0)} musicien{selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) > 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Mode lecture seule : affichage simple
                        selectedEvent.bands && selectedEvent.bands.length > 0 && (
                          <div className="space-y-2">
                            {selectedEvent.bands.map((band, i) => (
                              <div key={i} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                                <p className="font-medium">{band.name}</p>
                                {band.members_count && (
                                  <span className="text-sm text-muted-foreground">
                                    {band.members_count} membre{band.members_count > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            ))}
                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mt-2">
                              <p className="text-sm font-semibold text-primary">
                                Total : {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0)} musicien{selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) > 1 ? 's' : ''}
                              </p>
                              {(selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) + (selectedEvent.participants_count || 0)) > 0 && (
                                <p className="text-sm font-semibold text-green-400 mt-2">
                                  {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) + (selectedEvent.participants_count || 0)} : minimum de personnes étrangères à l'établissement (groupes + participants)
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}

                {/* Champs spécifiques au Bœuf */}
                {selectedEventType === 'jam' && (
                  <>
                    <div className="space-y-2">
                      <Label>Styles musicaux</Label>
                      <Input
                        value={selectedEvent.music_styles?.join(', ') || ''}
                        onChange={(e) => setSelectedEvent({ 
                          ...selectedEvent, 
                          music_styles: e.target.value.split(',').map(s => s.trim()) 
                        })}
                        placeholder="Rock, Jazz, Blues..."
                        className="bg-black/20 border-white/10"
                        disabled={!isEditingEvent}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Règles</Label>
                      <Textarea
                        value={selectedEvent.rules || ''}
                        onChange={(e) => setSelectedEvent({ ...selectedEvent, rules: e.target.value })}
                        className="bg-black/20 border-white/10"
                        rows={3}
                        disabled={!isEditingEvent}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Informations supplémentaires</Label>
                      <Textarea
                        value={selectedEvent.additional_info || ''}
                        onChange={(e) => setSelectedEvent({ ...selectedEvent, additional_info: e.target.value })}
                        className="bg-black/20 border-white/10"
                        rows={2}
                        disabled={!isEditingEvent}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedEvent.has_instruments || false}
                          onCheckedChange={(checked) => setSelectedEvent({ ...selectedEvent, has_instruments: checked })}
                          disabled={!isEditingEvent}
                        />
                        <Label>Instruments sur place</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedEvent.has_pa_system || false}
                          onCheckedChange={(checked) => setSelectedEvent({ ...selectedEvent, has_pa_system: checked })}
                          disabled={!isEditingEvent}
                        />
                        <Label>Sonorisation</Label>
                      </div>
                    </div>
                  </>
                )}

                {/* Catering Section - uniquement pour les concerts */}
                {selectedEventType === 'concert' && (
                  <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-white/10">
                    <Label className="text-base flex items-center gap-2">
                      🍽️ Catering <span className="text-xs text-muted-foreground">(la ration pour les ménestrels)</span>
                    </Label>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedEvent.has_catering || false} 
                        onCheckedChange={(c) => setSelectedEvent({ ...selectedEvent, has_catering: c, catering_drinks: c ? selectedEvent.catering_drinks : 0 })} 
                        disabled={!isEditingEvent}
                      />
                      <Label>Restauration disponible</Label>
                    </div>

                    {selectedEvent.has_catering && (
                      <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                        <div className="space-y-2">
                          <Label>Boissons par personne</Label>
                          {isEditingEvent ? (
                            <Select 
                              value={selectedEvent.catering_drinks?.toString() || "0"} 
                              onValueChange={(value) => setSelectedEvent({ ...selectedEvent, catering_drinks: parseInt(value) })}
                            >
                              <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-white/10">
                                {[...Array(11)].map((_, i) => (
                                  <SelectItem key={i} value={i.toString()}>{i === 0 ? "Aucune" : `${i} boisson${i > 1 ? 's' : ''}`}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {selectedEvent.catering_drinks === 0 ? "Aucune" : `${selectedEvent.catering_drinks} boisson${selectedEvent.catering_drinks > 1 ? 's' : ''}`}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="concert-edit-catering-respect"
                            checked={selectedEvent.catering_respect || false}
                            onChange={(e) => setSelectedEvent({ ...selectedEvent, catering_respect: e.target.checked })}
                            className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded"
                            disabled={!isEditingEvent}
                          />
                          <Label htmlFor="concert-edit-catering-respect" className="text-sm">
                            Ne pas abuser de la gentillesse du patron
                          </Label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="concert-edit-catering-tbd"
                            checked={selectedEvent.catering_tbd || false}
                            onChange={(e) => setSelectedEvent({ ...selectedEvent, catering_tbd: e.target.checked })}
                            className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded"
                            disabled={!isEditingEvent}
                          />
                          <Label htmlFor="concert-edit-catering-tbd" className="text-sm">
                            À définir
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Accommodation Section - uniquement pour les concerts */}
                {selectedEventType === 'concert' && (
                  <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-white/10">
                    <Label className="text-base flex items-center gap-2">
                      🛏️ Hébergement possible
                    </Label>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedEvent.has_accommodation || false} 
                        onCheckedChange={(c) => setSelectedEvent({ ...selectedEvent, has_accommodation: c, accommodation_capacity: c ? selectedEvent.accommodation_capacity : 0 })} 
                        disabled={!isEditingEvent}
                      />
                      <Label>Hébergement disponible</Label>
                    </div>

                    {selectedEvent.has_accommodation && (
                      <div className="space-y-2 pl-6 border-l-2 border-primary/30">
                        <Label>Nombre de personnes</Label>
                        {isEditingEvent ? (
                          <div className="grid grid-cols-5 gap-2">
                            {[...Array(10)].map((_, i) => {
                              const capacity = i + 1;
                              return (
                                <button
                                  key={capacity}
                                  type="button"
                                  onClick={() => setSelectedEvent({ ...selectedEvent, accommodation_capacity: capacity })}
                                  className={`
                                    p-2 rounded-lg border-2 transition-all font-semibold
                                    ${selectedEvent.accommodation_capacity === capacity 
                                      ? 'bg-primary/20 border-primary text-primary' 
                                      : 'bg-black/20 border-white/10 hover:border-white/30'
                                    }
                                  `}
                                >
                                  {capacity}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.accommodation_capacity || 0} personne{selectedEvent.accommodation_capacity > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                  {isEditingEvent ? (
                    <>
                      <Button 
                        onClick={handleUpdateEvent}
                        className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cet événement ?`)) return;
                          try {
                            if (selectedEventType === 'concert') {
                              await axios.delete(`${API}/concerts/${selectedEvent.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              toast.success("Concert supprimé");
                            } else if (selectedEventType === 'jam') {
                              await axios.delete(`${API}/jams/${selectedEvent.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              toast.success("Bœuf supprimé");
                            }
                            setShowEventDetailsModal(false);
                            setIsEditingEvent(false);
                            setSelectedEvent(null);
                            setSelectedEventType(null);
                            fetchEvents();
                          } catch (error) {
                            toast.error("Erreur lors de la suppression");
                          }
                        }}
                        variant="outline"
                        className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingEvent(false);
                          setShowEventDetailsModal(false);
                        }}
                        variant="outline"
                        className="rounded-full border-white/20"
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsEditingEvent(true)}
                        className="flex-1 bg-secondary hover:bg-secondary/90 rounded-full"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => setShowEventDetailsModal(false)}
                        variant="outline"
                        className="flex-1 rounded-full border-white/20"
                      >
                        Fermer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
