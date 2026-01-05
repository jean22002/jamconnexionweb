import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { VenueImageUpload } from "../components/ui/image-upload";
import Calendar from "../components/Calendar";
import { CityAutocomplete, reverseGeocode } from "../components/CityAutocomplete";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { 
  Music, LogOut, MapPin, Globe, Instagram, Facebook, Phone, Edit, Save, 
  Loader2, CreditCard, Check, Clock, AlertCircle, X, Plus, CalendarIcon, 
  Users, Bell, Trash2, Eye, FileText, User, Youtube, Send, Heart, Plug
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SocialLinks from "../components/SocialLinks";
import { StarRating } from "../components/StarRating";
import { DEPARTEMENTS_FRANCE, REGIONS_FRANCE } from "../data/france-locations";
import { toast } from "sonner";

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
    music_styles: [],
    description: '',
    artist_categories: [],
    num_bands_needed: 1,
    // Catering
    has_catering: false,
    catering_drinks: 0,
    catering_respect: false,
    catering_tbd: false,
    // Accommodation
    has_accommodation: false,
    accommodation_capacity: 0
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState("subscribers"); // 'subscribers' or 'nearby'
  
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
  
  // Bands
  const [bands, setBands] = useState([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [bandFilters, setBandFilters] = useState({ department: "", city: "" });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedBand, setSelectedBand] = useState(null);
  const [messageForm, setMessageForm] = useState({ subject: "", content: "" });
  
  // Gallery
  const [gallery, setGallery] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", description: "", profile_image: "", cover_image: "",
    address: "", city: "", department: "", region: "", postal_code: "", latitude: 0, longitude: 0,
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

  const [newBand, setNewBand] = useState({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });

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
      
      // Construire le tableau des dates réservées
      const bookedDatesArray = [
        ...jamsRes.data.map(j => j.date),
        ...concertsRes.data.map(c => c.date)
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
      setEventsByDate(eventsMap);
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
    fetchEvents();
  }, [fetchProfile, fetchMusicians, fetchEvents]);

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
    if (!formData.city) {
      toast.error("Entrez au moins une ville");
      return;
    }
    try {
      const query = `${formData.address ? formData.address + ', ' : ''}${formData.postal_code ? formData.postal_code + ' ' : ''}${formData.city}, France`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        // Utiliser le géocodage inversé pour obtenir département et région
        const cityData = await reverseGeocode(lat, lon);
        
        if (cityData) {
          console.log('🔍 Données géocodées:', cityData);
          console.log('📝 Département formaté:', `${cityData.department} - ${cityData.departmentName}`);
          console.log('📝 Région:', cityData.region);
          
          setFormData({ 
            ...formData, 
            latitude: lat, 
            longitude: lon,
            city: cityData.city,
            postal_code: cityData.postalCode,
            department: `${cityData.department} - ${cityData.departmentName}`,
            region: cityData.region
          });
          toast.success("📍 Adresse géolocalisée avec succès!");
        } else {
          // Si le géocodage inversé échoue, on met juste les coordonnées
          setFormData({ 
            ...formData, 
            latitude: lat, 
            longitude: lon
          });
          toast.success("Coordonnées trouvées!");
        }
      } else {
        toast.error("Adresse non trouvée");
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error("Erreur géolocalisation");
    }
  };

  // Nouvelle fonction : Utiliser le GPS pour auto-remplir l'adresse
  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    toast.info("Localisation en cours...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Géocodage inversé pour obtenir la ville
        const cityData = await reverseGeocode(latitude, longitude);
        
        if (cityData) {
          // Obtenir aussi l'adresse complète via Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            const address = `${data.address.house_number || ''} ${data.address.road || ''}`.trim() || data.address.suburb || '';
            
            setFormData({
              ...formData,
              address: address,
              city: cityData.city,
              postal_code: cityData.postalCode,
              department: `${cityData.department} - ${cityData.departmentName}`,
              region: cityData.region,
              latitude: latitude,
              longitude: longitude
            });
            
            toast.success(`📍 Localisé à ${cityData.city} !`);
          } catch (error) {
            console.error('Error getting address:', error);
            // Au moins on a la ville
            setFormData({
              ...formData,
              city: cityData.city,
              postal_code: cityData.postalCode,
              department: `${cityData.department} - ${cityData.departmentName}`,
              region: cityData.region,
              latitude: latitude,
              longitude: longitude
            });
            toast.success(`📍 Localisé à ${cityData.city} !`);
          }
        } else {
          toast.error("Impossible de déterminer la ville");
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error("Erreur d'accès à la localisation");
      }
    );
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
      setSubscribers(response.data || []);
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
      const endpoint = notificationTarget === 'subscribers' 
        ? `${API}/venues/me/notify-subscribers`
        : `${API}/venues/me/broadcast-notification`;
      
      const response = await axios.post(
        endpoint,
        { 
          message: broadcastMessage,
          radius: notificationTarget === 'nearby' ? 100 : undefined  // 100 km pour les musiciens proches
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const targetText = notificationTarget === 'subscribers' ? 'abonné(s)' : 'musicien(s)';
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
    if (activeTab === "notifications" && profile) {
      fetchNearbyMusiciansCount();
      fetchBroadcastHistory();
      fetchSubscribers(); // Rafraîchir les abonnés
    }
    if (activeTab === "jacks" && profile) {
      fetchSubscribers(); // Rafraîchir les abonnés quand on ouvre l'onglet Jacks
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
    const dateStr = date.toISOString().split('T')[0];
    
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
        setEditingPlanningSlotId(planningSlot.id); // Tracker qu'on édite
        setPlanningForm({
          date: planningSlot.date,
          music_styles: planningSlot.music_styles || [],
          description: planningSlot.description || '',
          artist_categories: planningSlot.artist_categories || [],
          num_bands_needed: planningSlot.num_bands_needed || 1,
          has_catering: planningSlot.has_catering || false,
          catering_drinks: planningSlot.catering_drinks || 0,
          catering_respect: planningSlot.catering_respect || false,
          catering_tbd: planningSlot.catering_tbd || false,
          has_accommodation: planningSlot.has_accommodation || false,
          accommodation_capacity: planningSlot.accommodation_capacity || 0
        });
        setSelectedDate(date);
        setShowPlanningModal(true);
      } else {
        // Pas d'événement, créer un nouveau créneau de planning
        if (isDateBooked(dateStr)) {
          toast.info("Cette date est déjà réservée");
          return;
        }
        setEditingPlanningSlotId(null); // Pas d'édition
        setSelectedDate(date);
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
        payment: ''
      });
      fetchPlanningSlots();
      fetchEvents();
    } catch (error) {
      console.error("Error deleting planning slot:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression");
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
      setApplications({ ...applications, [slotId]: response.data });
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

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
      setShowConcertDialog(false);
      setConcertForm({ date: "", start_time: "", title: "", description: "", bands: [], price: "" });
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
      
      setShowEventDetailsModal(false);
      setIsEditingEvent(false);
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
              <Link to="/messages-improved">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <Send className="w-4 h-4" />
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
          <TabsList className="grid w-full grid-cols-10 bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="profile" className="rounded-full">Profil</TabsTrigger>
            <TabsTrigger value="jams" className="rounded-full">Boeufs</TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full">Concerts</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-full">Planning</TabsTrigger>
            <TabsTrigger value="jacks" className="rounded-full">
              <Plug className="w-4 h-4 inline mr-1" />
              Jacks
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full">
              <Bell className="w-4 h-4 inline mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full">Avis</TabsTrigger>
            <TabsTrigger value="bands" className="rounded-full">Groupes</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-full">Galerie</TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-full">Factures</TabsTrigger>
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
                  
                  <div className="space-y-2">
                    {editing ? (
                      <>
                        <CityAutocomplete
                          value={formData.city}
                          onSelect={(cityData) => {
                            setFormData({
                              ...formData,
                              city: cityData.city,
                              postal_code: cityData.postalCode,
                              department: `${cityData.department} - ${cityData.departmentName}`,
                              region: cityData.region
                            });
                          }}
                          label="Ville"
                          placeholder="Ex: Narbonne"
                        />
                        <Button type="button" onClick={geocodeAddress} variant="outline" className="border-white/20 w-full">
                          <MapPin className="w-4 h-4 mr-2" /> Géolocaliser l'adresse
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input value={formData.city} disabled className="bg-black/20 border-white/10 disabled:opacity-70" />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Département</Label>
                      <Select 
                        key={`dept-${formData.department}`} 
                        value={formData.department} 
                        onValueChange={(value) => setFormData({ ...formData, department: value })} 
                        disabled={!editing}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10 disabled:opacity-70">
                          <SelectValue placeholder="Sélectionnez un département" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px]">
                          {DEPARTEMENTS_FRANCE.map((dept) => (
                            <SelectItem key={dept.code} value={`${dept.code} - ${dept.nom}`}>
                              {dept.code} - {dept.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Région</Label>
                      <Select 
                        key={`region-${formData.region}`}
                        value={formData.region} 
                        onValueChange={(value) => setFormData({ ...formData, region: value })} 
                        disabled={!editing}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10 disabled:opacity-70">
                          <SelectValue placeholder="Sélectionnez une région" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px]">
                          {REGIONS_FRANCE.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                        <div>
                          <p className="font-heading font-semibold text-lg">{jam.date}</p>
                          <p className="text-muted-foreground">{jam.start_time} - {jam.end_time}</p>
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
                            <p className="font-heading font-semibold text-lg">{concert.title || "Concert"}</p>
                            <p className="text-muted-foreground">{concert.date} à {concert.start_time}</p>
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
                              </div>
                            )}
                          </div>
                        )}
                        {concert.price && <p className="text-sm text-secondary mt-2">{concert.price}</p>}
                      </div>
                    );
                  })}
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
                planningSlots={planningSlots}
              />

              {/* Liste des créneaux ouverts */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">📅 Créneaux ouverts aux candidatures</h2>
                
                {planningSlots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun créneau ouvert pour le moment</p>
                    <p className="text-sm mt-2">Cliquez sur un jour libre (bleu) dans le calendrier pour créer un créneau</p>
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
                      <Input
                        type="time"
                        value={planningForm.time}
                        onChange={(e) => setPlanningForm({ ...planningForm, time: e.target.value })}
                        className="bg-black/20 border-white/10"
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

                    <div className="space-y-2">
                      <Label>Style de groupe recherché</Label>
                      <Input
                        type="text"
                        placeholder="Ex: Rock, Jazz, Blues, Pop..."
                        value={planningForm.expectedBandStyle}
                        onChange={(e) => setPlanningForm({ ...planningForm, expectedBandStyle: e.target.value })}
                        className="bg-black/20 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Affluence estimée (nombre de personnes)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 50, 100, 200..."
                        value={planningForm.expectedAttendance}
                        onChange={(e) => setPlanningForm({ ...planningForm, expectedAttendance: e.target.value })}
                        className="bg-black/20 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rémunération proposée</Label>
                      <Input
                        type="text"
                        placeholder="Ex: 200€, Au chapeau, Visibilité..."
                        value={planningForm.payment}
                        onChange={(e) => setPlanningForm({ ...planningForm, payment: e.target.value })}
                        className="bg-black/20 border-white/10"
                      />
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
                        // Mode édition : boutons Supprimer et Annuler
                        <>
                          <Button
                            onClick={handleDeletePlanningSlot}
                            variant="outline"
                            className="flex-1 rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer le créneau
                          </Button>
                          <Button
                            onClick={() => {
                              setShowPlanningModal(false);
                              setSelectedDate(null);
                              setEditingPlanningSlotId(null);
                              setPlanningForm({
                                date: '',
                                music_styles: [],
                                description: '',
                                artist_categories: [],
                                num_bands_needed: 1,
                                has_catering: false,
                                catering_drinks: 0,
                                catering_respect: false,
                                catering_tbd: false,
                                has_accommodation: false,
                                accommodation_capacity: 0
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
                                music_styles: [],
                                description: '',
                                artist_categories: [],
                                num_bands_needed: 1,
                                has_catering: false,
                                catering_drinks: 0,
                                catering_respect: false,
                                catering_tbd: false,
                                has_accommodation: false,
                                accommodation_capacity: 0
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
                          <img src={subscriber.profile_image} alt="" className="w-16 h-16 rounded-full object-cover" />
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
                        <Link to={`/musician/${subscriber.id}`}>
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
                        <img 
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
          <TabsContent value="invoices">
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-semibold text-xl mb-2">📄 Factures</h2>
                  <p className="text-muted-foreground text-sm">
                    Consultez et téléchargez vos factures d'abonnement mensuel
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Current Subscription Status */}
                <div className="p-4 bg-muted/30 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Statut de l'abonnement</h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.subscription_status === "active" && "✅ Actif - Abonnement mensuel"}
                        {user?.subscription_status === "trial" && "🎁 Période d'essai"}
                        {(!user?.subscription_status || user?.subscription_status === "inactive") && "❌ Inactif"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">29,99 €</p>
                      <p className="text-xs text-muted-foreground">par mois</p>
                    </div>
                  </div>
                </div>

                {/* Sample Invoices - In real implementation, fetch from backend */}
                <div className="space-y-3">
                  <h3 className="font-semibold mb-3">Historique des factures</h3>
                  
                  {/* Placeholder message */}
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">Aucune facture disponible</p>
                    <p className="text-sm text-muted-foreground">
                      Vos factures mensuelles apparaîtront ici après votre premier paiement
                    </p>
                  </div>

                  {/* Example invoice structure (commented for future implementation) */}
                  {/* 
                  <div className="p-4 bg-card rounded-xl border border-white/10 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Facture Janvier 2025</h4>
                          <p className="text-sm text-muted-foreground">Émise le 01/01/2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">29,99 €</p>
                          <p className="text-xs text-green-400">✓ Payée</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-full">
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </div>
                  */}
                </div>

                {/* Contact Support */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Besoin d'aide avec vos factures ?</h4>
                      <p className="text-sm text-muted-foreground">
                        Contactez notre support à{" "}
                        <a href="mailto:support@jamconnexion.com" className="text-primary hover:underline">
                          support@jamconnexion.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modale d'affichage/édition d'événement */}
        <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horaire de début</Label>
                    <Input
                      type="time"
                      value={selectedEvent.start_time || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, start_time: e.target.value })}
                      className="bg-black/20 border-white/10"
                      disabled={!isEditingEvent}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Horaire de fin</Label>
                  <Input
                    type="time"
                    value={selectedEvent.end_time || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, end_time: e.target.value })}
                    className="bg-black/20 border-white/10"
                    disabled={!isEditingEvent}
                  />
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

                    {selectedEvent.bands && selectedEvent.bands.length > 0 && (
                      <div className="space-y-2">
                        <Label>Artistes</Label>
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
                        </div>
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mt-2">
                          <p className="text-sm font-semibold text-primary">
                            Total : {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0)} musicien{selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    )}
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
                        onClick={() => {
                          setIsEditingEvent(false);
                          setShowEventDetailsModal(false);
                        }}
                        variant="outline"
                        className="flex-1 rounded-full border-white/20"
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
