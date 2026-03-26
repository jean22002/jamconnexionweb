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
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  Music, LogOut, MapPin, MapPinOff, Globe, Instagram, Facebook, Phone, Edit, Save, Menu, 
  Loader2, CreditCard, Check, Clock, AlertCircle, X, Plus, CalendarIcon, 
  Users, Bell, Trash2, Eye, FileText, User, Youtube, Send, Heart, Plug, Award, MessageSquare, Trophy, Paperclip, Upload, Download, Camera
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBadgeAutoCheck } from "../hooks/useBadgeAutoCheck";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import SocialLinks from "../components/SocialLinks";
import { StarRating } from "../components/StarRating";
import { toast } from "sonner";
import { DEPARTEMENTS_FRANCE, REGIONS_FRANCE } from "../data/france-locations";
import { MUSIC_STYLES_LIST } from "../data/music-styles";
import { useNotifications } from "../hooks/useNotifications";
import DashboardNotification from "../components/DashboardNotification";
import ConcertForm from "../features/venue-dashboard/components/tabs/ConcertForm";
// NEW: Import custom hooks for refactored logic
import { 
  useVenueProfile, 
  useVenueEvents, 
  useVenuePlanning 
} from "../features/venue-dashboard/hooks";
// Refactored tabs
import ReviewsTab from "../features/venue-dashboard/tabs/ReviewsTab";
import GalleryTab from "../features/venue-dashboard/tabs/GalleryTab";
import JacksTab from "../features/venue-dashboard/tabs/JacksTab";
import CandidaturesTab from "../features/venue-dashboard/tabs/CandidaturesTab";
import SettingsTab from "../features/venue-dashboard/tabs/SettingsTab";
import AccountingTab from "../features/venue-dashboard/tabs/AccountingTab";
import PlanningTab from "../features/venue-dashboard/tabs/PlanningTab";
import ConcertsTab from "../features/venue-dashboard/tabs/ConcertsTab";
import ProfileTab from "../features/venue-dashboard/tabs/ProfileTab";
import JamsTab from "../features/venue-dashboard/tabs/JamsTab";
import BandsTab from "../features/venue-dashboard/tabs/BandsTab";
import KaraokeTab from "../features/venue-dashboard/tabs/KaraokeTab";
import SpectacleTab from "../features/venue-dashboard/tabs/SpectacleTab";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/aFa6oG9gV4d20te2uRafS02";

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

/**
 * =============================================================================
 * VENUE DASHBOARD - COMPOSANT PRINCIPAL
 * =============================================================================
 * 
 * Tableau de bord complet pour la gestion d'un établissement (bar, salle de concert, etc.)
 * 
 * SECTIONS PRINCIPALES:
 * - États & Configuration (lignes ~69-308)
 * - Fonctions Fetch (lignes ~310-900)
 * - Handlers & Actions (lignes ~606-1924)
 * - Rendu JSX: Header + Bannières + 13 Onglets (lignes ~2153-7927)
 * 
 * DOCUMENTATION COMPLÈTE: /app/frontend/src/features/venue-dashboard/README.md
 * 
 * ⚠️ ATTENTION: Fichier monolithique de ~7900 lignes. Refactoring nécessaire.
 * =============================================================================
 */
export default function VenueDashboard() {
  // ============================================================================
  // CONTEXTES & HOOKS EXTERNES
  // ============================================================================
  const { user, token, logout, refreshUser } = useAuth();
  const { triggerBadgeCheck } = useBadgeAutoCheck();
  
  // Hook pour le statut en ligne
  const { mode: onlineMode, isOnline, manualStatus, toggleManualStatus, updateMode } = useOnlineStatus();
  
  // Hook pour les notifications push
  useNotifications(token, user);
  const navigate = useNavigate();

  // ============================================================================
  // CUSTOM HOOKS - REFACTORED LOGIC
  // ============================================================================
  // Use custom hooks for profile, events, and planning management
  const profileHook = useVenueProfile(token);
  const eventsHook = useVenueEvents(token);
  const planningHook = useVenuePlanning(token);
  
  // Extract values from hooks for easier access
  // Note: Keep original state names for backward compatibility
  const {
    profile: profileFromHook,
    setProfile: setProfileFromHook,
    loading: loadingFromHook,
    saving: savingFromHook,
    editing: editingFromHook,
    setEditing: setEditingFromHook,
    saveProfile: saveProfileFromHook,
    uploadImage: uploadImageFromHook,
  } = profileHook;
  
  const {
    jams: jamsFromHook,
    concerts: concertsFromHook,
    karaokes: karaokesFromHook,
    spectacles: spectaclesFromHook,
    setJams: setJamsFromHook,
    setConcerts: setConcertsFromHook,
    setKaraokes: setKaraokesFromHook,
    setSpectacles: setSpectaclesFromHook,
    loadingEvents: loadingEventsFromHook,
    fetchAllEvents,
  } = eventsHook;
  
  const {
    planningSlots: planningSlotsFromHook,
    setPlanningSlots: setPlanningSlotsFromHook,
    applications: applicationsFromHook,
    fetchPlanningSlots: fetchPlanningSlotsFromHook,
    fetchApplications: fetchApplicationsFromHook,
  } = planningHook;

  // ============================================================================
  // ÉTATS - PROFIL & GÉNÉRAL (Using hooks where possible)
  // ============================================================================
  // Use hook values with original names for backward compatibility
  const profile = profileFromHook;
  const setProfile = setProfileFromHook;
  const loading = loadingFromHook;
  const saving = savingFromHook;
  const editing = editingFromHook;
  const setEditing = setEditingFromHook;
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Restaurer le dernier onglet depuis localStorage
    const savedTab = localStorage.getItem('venue_activeTab');
    return savedTab || "profile";
  });
  
  // Sauvegarder l'onglet actif dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('venue_activeTab', activeTab);
  }, [activeTab]);
  
  // ============================================================================
  // ÉTATS - ABONNEMENT
  // ============================================================================
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  
  // ============================================================================
  // ÉTATS - ÉVÉNEMENTS (Using hooks where possible)
  // ============================================================================
  // Use hook values with original names
  const jams = jamsFromHook;
  const setJams = setJamsFromHook;
  const concerts = concertsFromHook;
  const setConcerts = setConcertsFromHook;
  const karaokes = karaokesFromHook;
  const setKaraokes = setKaraokesFromHook;
  const spectacles = spectaclesFromHook;
  const setSpectacles = setSpectaclesFromHook;
  
  // Planning from hooks
  const planningSlots = planningSlotsFromHook;
  const setPlanningSlots = setPlanningSlotsFromHook;
  const applications = applicationsFromHook;
  
  const [musicians, setMusicians] = useState([]);
  
  // Dialogs
  const [showJamDialog, setShowJamDialog] = useState(false);
  const [showConcertDialog, setShowConcertDialog] = useState(false);
  const [showKaraokeDialog, setShowKaraokeDialog] = useState(false);
  const [showSpectacleDialog, setShowSpectacleDialog] = useState(false);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [viewingApplications, setViewingApplications] = useState(null);
  const [creatingSlot, setCreatingSlot] = useState(false); // Loading state pour création de créneau
  
  // Broadcast notifications
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [nearbyMusiciansCount, setNearbyMusiciansCount] = useState(0);
  const [subscribers, setSubscribers] = useState([]); // Liste des abonnés (Jacks)
  const [bandSuggestions, setBandSuggestions] = useState([]);
  const [showBandSuggestions, setShowBandSuggestions] = useState(false);
  const [notificationsQuota, setNotificationsQuota] = useState({ used: 0, remaining: 3, total: 3 });
  
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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  
  // Event details modal states
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null); // 'concert', 'jam', or 'planning'
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // Event selection modal (for multiple events on same day)
  const [showEventSelectionModal, setShowEventSelectionModal] = useState(false);
  const [multipleEventsOfDay, setMultipleEventsOfDay] = useState([]);
  
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

  // Accounting filters
  const [accountingFilters, setAccountingFilters] = useState({
    payment_method: 'all', // 'all', 'facture', 'guso'
    period: 'all', // 'all', 'month', 'quarter', 'year', 'custom'
    status: 'all', // 'all', 'paid', 'pending', 'cancelled'
    customStartDate: '',
    customEndDate: ''
  });
  
  // Bands
  const [bands, setBands] = useState([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [bandFilters, setBandFilters] = useState({ 
    country: "France",
    region: "", 
    department: "", 
    city: "" 
  });
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
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

  // Check if profile is complete (name + location minimum)
  const isProfileComplete = () => {
    if (!profile) return false;
    // Minimum requis : nom + localisation (adresse OU ville)
    return profile.name && profile.name.trim() !== '' && 
           ((profile.address && profile.address.trim() !== '') || (profile.city && profile.city.trim() !== ''));
  };

  // Calculate days until subscription renewal
  const getDaysUntilRenewal = () => {
    if (!user?.subscription_end_date) return null;
    const endDate = new Date(user.subscription_end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const showRenewalReminder = user?.subscription_status === "active" && daysUntilRenewal !== null && daysUntilRenewal <= 5 && daysUntilRenewal > 0;
  
  // Check if subscription is expired
  const isSubscriptionExpired = user?.subscription_status === "expired" || 
                                 user?.subscription_status === "cancelled" || 
                                 (user?.subscription_status === "active" && daysUntilRenewal !== null && daysUntilRenewal < 0);

  // Block tabs if subscription expired (except profile)
  const canAccessTab = (tabValue) => {
    if (isSubscriptionExpired && tabValue !== 'profile') {
      return false;
    }
    return true;
  };

  const [jamForm, setJamForm] = useState({
    date: "", start_time: "", end_time: "", music_styles: [],
    rules: "", has_instruments: false, has_pa_system: false,
    instruments_available: [], additional_info: "",
    // Comptabilité
    payment_method: "", amount: "", payment_status: "pending"
  });

  const [concertForm, setConcertForm] = useState({
    date: "", start_time: "", end_time: "", title: "", description: "",
    bands: [], price: "", music_styles: [],
    // Catering
    has_catering: false, catering_drinks: 0, catering_respect: false, catering_tbd: false,
    // Accommodation
    has_accommodation: false, accommodation_capacity: 0, accommodation_tbd: false,
    // Comptabilité
    payment_method: "", amount: "", payment_status: "pending",
    // GUSO fields (for intermittent artists)
    cachet_type: "", // "isolé" or "groupé"
    guso_contract_type: "", // "CDDU", "CDD", etc.
    is_guso: false // Auto-set to true when payment_method is "guso"
  });

  const [karaokeForm, setKaraokeForm] = useState({
    date: "", start_time: "", end_time: "", title: "", description: "",
    host_name: "", has_catering: false, catering_drinks: 0,
    // Comptabilité
    payment_method: "", amount: "", payment_status: "pending"
  });

  const [spectacleForm, setSpectacleForm] = useState({
    date: "", start_time: "", end_time: "", type: "", artist_name: "",
    description: "", price: "",
    // Comptabilité
    payment_method: "", amount: "", payment_status: "pending"
  });

  const [newBand, setNewBand] = useState({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });

  const fetchProfile = useCallback(async () => {
    console.log('🔄 fetchProfile: Starting profile fetch...');
    try {
      const response = await axios.get(`${API}/venues/me`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('✅ fetchProfile: Profile loaded successfully', { venue_id: response.data.id, venue_name: response.data.name });
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
      console.error('❌ fetchProfile: Error loading profile', error.response?.status, error.message);
      if (error.response?.status === 404) {
        console.log('⚠️ fetchProfile: Profile not found (404), enabling edit mode');
        setEditing(true);
      }
    }
  }, [token, navigate]); // FIXED: Removed 'editing' from dependencies to prevent loop

  const fetchEvents = useCallback(async () => {
    if (!profile?.id) {
      console.log('⚠️ fetchEvents: No profile ID, skipping fetch');
      return; // Guard: Don't fetch if no profile ID yet
    }
    
    console.log(`🔄 fetchEvents: Loading events for venue ${profile.id}`);
    
    // Helper function to normalize payment status from French to English
    const normalizePaymentStatus = (status) => {
      const statusMap = {
        'Payé': 'paid',
        'En attente': 'pending',
        'Annulé': 'cancelled',
        'Non spécifié': 'unspecified'
      };
      return statusMap[status] || status;
    };
    
    // Helper to normalize events array
    const normalizeEvents = (events) => 
      events.map(event => ({
        ...event,
        payment_status: event.payment_status ? normalizePaymentStatus(event.payment_status) : event.payment_status
      }));
    
    setLoadingEvents(true);
    try {
      // Faire les requêtes en parallèle avec gestion d'erreur individuelle
      const [jamsRes, concertsRes, karaokeRes, spectacleRes, planningRes] = await Promise.allSettled([
        axios.get(`${API}/venues/${profile.id}/jams`),
        axios.get(`${API}/venues/${profile.id}/concerts`),
        axios.get(`${API}/venues/${profile.id}/karaoke`),
        axios.get(`${API}/venues/${profile.id}/spectacle`),
        axios.get(`${API}/venues/${profile.id}/planning`)
      ]);
      
      // Log des erreurs éventuelles
      if (jamsRes.status === 'rejected') console.error('❌ Error loading jams:', jamsRes.reason);
      if (concertsRes.status === 'rejected') console.error('❌ Error loading concerts:', concertsRes.reason);
      if (karaokeRes.status === 'rejected') console.error('❌ Error loading karaokes:', karaokeRes.reason);
      if (spectacleRes.status === 'rejected') console.error('❌ Error loading spectacles:', spectacleRes.reason);
      if (planningRes.status === 'rejected') console.error('❌ Error loading planning:', planningRes.reason);
      
      // Extraire les données réussies, ou utiliser [] si échoué, et normaliser les statuts
      const jams = normalizeEvents(jamsRes.status === 'fulfilled' ? jamsRes.value.data : []);
      const concerts = normalizeEvents(concertsRes.status === 'fulfilled' ? concertsRes.value.data : []);
      const karaokes = normalizeEvents(karaokeRes.status === 'fulfilled' ? karaokeRes.value.data : []);
      const spectacles = normalizeEvents(spectacleRes.status === 'fulfilled' ? spectacleRes.value.data : []);
      const planning = planningRes.status === 'fulfilled' ? planningRes.value.data : [];
      
      console.log(`✅ Events loaded - Jams: ${jams.length}, Concerts: ${concerts.length}, Karaoke: ${karaokes.length}, Spectacles: ${spectacles.length}`);
      
      setJams(jams);
      setConcerts(concerts);
      setKaraokes(karaokes);
      setSpectacles(spectacles);
      setPlanningSlots(planning);
      
      // Construire le tableau des dates réservées
      const bookedDatesArray = [
        ...jams.map(j => j.date),
        ...concerts.map(c => c.date),
        ...karaokes.map(k => k.date),
        ...spectacles.map(s => s.date)
      ];
      setBookedDates(bookedDatesArray);
      
      // Construire l'objet des événements par date avec leur type
      // NOTE: Si plusieurs événements le même jour, on stocke un array
      const eventsMap = {};
      
      // Fonction helper pour ajouter un événement
      const addEvent = (date, type) => {
        if (!eventsMap[date]) {
          eventsMap[date] = type;
        } else if (typeof eventsMap[date] === 'string') {
          // Convertir en array si un deuxième événement existe
          eventsMap[date] = [eventsMap[date], type];
        } else {
          // Ajouter à l'array existant
          eventsMap[date].push(type);
        }
      };
      
      jams.forEach(jam => addEvent(jam.date, 'jam'));
      concerts.forEach(concert => addEvent(concert.date, 'concert'));
      karaokes.forEach(karaoke => addEvent(karaoke.date, 'karaoke'));
      spectacles.forEach(spectacle => addEvent(spectacle.date, 'spectacle'));
      
      setEventsByDate(eventsMap);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
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
        axios.get(`${API}/notifications/unread/count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [token]);
  
  const fetchUnreadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/messages/inbox`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const unreadMessages = response.data.filter(msg => !msg.is_read);
      setUnreadMessagesCount(unreadMessages.length);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  }, [token]);

  useEffect(() => {
    // Initial data load - only runs once on mount
    fetchProfile();
    fetchMusicians();
    fetchEvents();
    fetchNotifications();
    fetchUnreadMessages();
    fetchSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run only once on mount

  // Re-fetch events when profile is loaded (fix for Comptabilité tab)
  useEffect(() => {
    if (profile?.id) {
      fetchEvents();
    }
  }, [profile?.id, fetchEvents]);

  // Polling pour rafraîchir les notifications toutes les 30 secondes (réduit de 15s à 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadMessages();
    }, 30000); // 30 seconds instead of 15
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Écouter l'événement de nouvelle notification pour rafraîchir immédiatement
  useEffect(() => {
    const handleNewNotification = () => {
      console.log('🔔 Événement nouvelle notification reçu - Rafraîchissement immédiat');
      fetchNotifications();
      fetchUnreadMessages();
    };
    
    window.addEventListener('new-notification-received', handleNewNotification);
    
    return () => {
      window.removeEventListener('new-notification-received', handleNewNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling pour rafraîchir les événements toutes les 15 secondes pour mise à jour temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 15000); // 15 secondes pour mises à jour temps réel des participants
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour selectedEvent quand les données sont rafraîchies
  useEffect(() => {
    if (selectedEvent && selectedEventType) {
      let updatedEvent = null;
      
      if (selectedEventType === 'concert') {
        updatedEvent = concerts.find(c => c.id === selectedEvent.id);
      } else if (selectedEventType === 'jam') {
        updatedEvent = jams.find(j => j.id === selectedEvent.id);
      } else if (selectedEventType === 'karaoke') {
        updatedEvent = karaokes.find(k => k.id === selectedEvent.id);
      } else if (selectedEventType === 'spectacle') {
        updatedEvent = spectacles.find(s => s.id === selectedEvent.id);
      }
      
      // Mettre à jour selectedEvent si l'événement existe toujours
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concerts, jams, karaokes, spectacles]);

  // Charger les événements quand on ouvre l'onglet Planning et que le profil est disponible
  useEffect(() => {
    if (activeTab === 'planning' && profile?.id) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile?.id]);

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

  // Handle subscription
  const handleSubscribe = () => {
    // Redirection directe vers le lien de paiement Stripe
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  // Cancel subscription renewal
  const handleCancelRenewal = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler le renouvellement automatique ? Votre abonnement restera actif jusqu'à la fin de la période payée.")) {
      return;
    }

    try {
      const response = await axios.post(
        `${API}/payments/cancel-renewal`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await refreshUser(); // Rafraîchir les données utilisateur
      }
    } catch (error) {
      console.error("Error cancelling renewal:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de l'annulation du renouvellement");
    }
  };

  // Reactivate subscription renewal
  const handleReactivateRenewal = async () => {
    try {
      const response = await axios.post(
        `${API}/payments/reactivate-renewal`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await refreshUser(); // Rafraîchir les données utilisateur
      }
    } catch (error) {
      console.error("Error reactivating renewal:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la réactivation du renouvellement");
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

  const fetchNotificationsQuota = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/notifications-quota`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificationsQuota(response.data);
    } catch (error) {
      console.error("Error fetching notifications quota:", error);
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
      fetchNotificationsQuota(); // Refresh quota after sending
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit error
        toast.error(error.response?.data?.detail || "Limite hebdomadaire atteinte", {
          duration: 5000
        });
      } else {
        toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
      }
    } finally {
      setSendingBroadcast(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications" && profile?.id) {
      fetchNearbyMusiciansCount();
      fetchBroadcastHistory();
      fetchSubscribers(); // Rafraîchir les abonnés
      fetchNotificationsQuota(); // Fetch quota when notifications tab is opened
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
      const newShowReviews = !showReviews;
      await axios.put(
        `${API}/venues/me/reviews-visibility?show_reviews=${newShowReviews}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReviews(newShowReviews);
      // Mettre à jour le profil local pour maintenir la synchronisation
      setProfile({ ...profile, show_reviews: newShowReviews });
      toast.success(newShowReviews ? "Avis affichés publiquement" : "Avis masqués");
    } catch (error) {
      console.error("Error toggling reviews visibility:", error);
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
  const toggleMessaging = async (newValue) => {
    // Vérifier que le profil existe (avec les champs requis)
    if (!profile || !formData.address || !formData.city) {
      toast.error("Veuillez d'abord compléter votre profil (nom, ville, adresse)");
      return;
    }
    
    try {
      const updatedData = { ...formData, allow_messages_from: newValue };
      
      await axios.put(`${API}/venues`, updatedData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setFormData(updatedData);
      
      const messages = {
        "everyone": "Tous les musiciens peuvent vous contacter",
        "pro_only": "Seuls les musiciens PRO peuvent vous contacter",
        "connected_only": "Seuls les musiciens connectés peuvent vous contacter"
      };
      
      toast.success(messages[newValue] || "Paramètres de messagerie mis à jour");
      
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

  // Fonction pour ouvrir les candidatures d'un créneau depuis l'onglet Candidatures
  const handleSlotCardClick = (slot) => {
    console.log('👥 Affichage des candidatures pour le créneau:', slot);
    setViewingApplications(slot.id);
    fetchApplications(slot.id);
  };

  const handleDateClick = async (eventOrDate) => {
    console.log('📅 handleDateClick called with:', eventOrDate);
    
    // Cas 1 : On a reçu un événement complet (objet avec type, data, date)
    if (eventOrDate && typeof eventOrDate === 'object' && eventOrDate.type && eventOrDate.data) {
      const { type, data } = eventOrDate;
      
      console.log(`✅ Événement direct reçu : ${type}`);
      console.log('🎯 Data de l\'événement:', data);
      
      // Ouvrir directement la modale avec l'événement
      console.log('🔄 Setting selectedEvent to:', data);
      console.log('🔄 Setting selectedEventType to:', type);
      setSelectedEvent(data);
      setSelectedEventType(type);
      setIsEditingEvent(false);
      setShowEventDetailsModal(true);
      console.log('✅ Modale devrait s\'ouvrir avec:', { type, event: data });
      return;
    }
    
    // Cas 2 : On a reçu juste une date (string ou Date) - comportement ancien pour compatibilité
    // S'assurer que date est un objet Date
    const dateObj = eventOrDate instanceof Date ? eventOrDate : new Date(eventOrDate);
    
    // Format date sans conversion UTC
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Vérifier s'il y a un événement à cette date
    let eventType = eventsByDate[dateStr];
    
    // Si eventType est un array, on a plusieurs événements le même jour
    if (Array.isArray(eventType)) {
      console.warn(`⚠️ Plusieurs événements le ${dateStr}:`, eventsByDate[dateStr]);
      
      // Collecter tous les événements du jour
      const eventsOfDay = [];
      
      eventType.forEach(type => {
        if (type === 'jam') {
          const event = jams.find(j => j.date === dateStr);
          if (event) eventsOfDay.push({ ...event, type: 'jam', label: 'Bœuf' });
        } else if (type === 'concert') {
          const event = concerts.find(c => c.date === dateStr);
          if (event) eventsOfDay.push({ ...event, type: 'concert', label: 'Concert' });
        } else if (type === 'karaoke') {
          const event = karaokes.find(k => k.date === dateStr);
          if (event) eventsOfDay.push({ ...event, type: 'karaoke', label: 'Karaoké' });
        } else if (type === 'spectacle') {
          const event = spectacles.find(s => s.date === dateStr);
          if (event) eventsOfDay.push({ ...event, type: 'spectacle', label: 'Spectacle' });
        }
      });
      
      // Si plusieurs événements, afficher un menu de sélection
      if (eventsOfDay.length > 1) {
        console.log(`📋 ${eventsOfDay.length} événements trouvés, affichage modale de sélection`);
        setMultipleEventsOfDay(eventsOfDay);
        setShowEventSelectionModal(true);
        return;
      }
      
      // Sinon, prendre le premier événement
      if (eventsOfDay.length > 0) {
        setSelectedEvent(eventsOfDay[0]);
        setSelectedEventType(eventsOfDay[0].type);
        setIsEditingEvent(false);
        setShowEventDetailsModal(true);
        return;
      }
    }
    
    if (eventType) {
      // Il y a un événement (concert, jam, karaoké ou spectacle), on l'affiche
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
        } else if (eventType === 'karaoke') {
          // Trouver le karaoké
          event = karaokes.find(k => k.date === dateStr);
          type = 'karaoke';
        } else if (eventType === 'spectacle') {
          // Trouver le spectacle
          event = spectacles.find(s => s.date === dateStr);
          type = 'spectacle';
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
    // Empêcher les clics multiples
    if (creatingSlot) return;
    
    setCreatingSlot(true);
    try {
      await axios.post(
        `${API}/planning`,
        {
          date: planningForm.date,
          time: planningForm.time,
          title: planningForm.title,
          description: planningForm.description,
          music_styles: planningForm.music_styles || [],
          artist_categories: planningForm.artist_categories || [],
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
      // Recharger les données
      if (profile?.id) {
        await fetchPlanningSlots();
        await fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création du créneau");
      console.error("Error creating planning slot:", error);
    } finally {
      setCreatingSlot(false);
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
      // Recharger les données
      if (profile?.id) {
        await fetchPlanningSlots();
        await fetchEvents();
      }
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
          music_styles: planningForm.music_styles || [],
          artist_categories: planningForm.artist_categories || [],
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
      // Recharger les données
      if (profile?.id) {
        await fetchPlanningSlots();
        await fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la mise à jour du créneau");
      console.error("Error updating planning slot:", error);
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

  // ⚠️ VALIDATION: Vérifier qu'il n'y a pas déjà un événement à cette date
  const checkEventConflict = (date) => {
    const existingJam = jams.find(j => j.date === date);
    const existingConcert = concerts.find(c => c.date === date);
    const existingKaraoke = karaokes.find(k => k.date === date);
    const existingSpectacle = spectacles.find(s => s.date === date);
    
    if (existingJam) return { conflict: true, type: 'Bœuf musical' };
    if (existingConcert) return { conflict: true, type: 'Concert' };
    if (existingKaraoke) return { conflict: true, type: 'Karaoké' };
    if (existingSpectacle) return { conflict: true, type: 'Spectacle' };
    
    return { conflict: false };
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
      // ⚠️ Vérifier les conflits de date
      const conflict = checkEventConflict(jamForm.date);
      if (conflict.conflict) {
        toast.error(`❌ Impossible : Un événement "${conflict.type}" existe déjà le ${new Date(jamForm.date).toLocaleDateString('fr-FR')} !`);
        return;
      }
      
      await axios.post(`${API}/jams`, jamForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Boeuf musical créé!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowJamDialog(false);
      setJamForm({ date: "", start_time: "", end_time: "", music_styles: [], rules: "", has_instruments: false, has_pa_system: false, instruments_available: [], additional_info: "" });
      fetchEvents();
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : Array.isArray(error.response?.data?.detail)
        ? error.response.data.detail.map(e => e.msg).join(', ')
        : "Erreur lors de la création";
      toast.error(errorMsg);
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
      // ⚠️ Vérifier les conflits de date
      const conflict = checkEventConflict(concertForm.date);
      if (conflict.conflict) {
        toast.error(`❌ Impossible : Un événement "${conflict.type}" existe déjà le ${new Date(concertForm.date).toLocaleDateString('fr-FR')} !`);
        return;
      }
      
      await axios.post(`${API}/concerts`, concertForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Concert créé!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowConcertDialog(false);
      setConcertForm({ date: "", start_time: "", end_time: "", title: "", description: "", bands: [], price: "", music_styles: [] });
      fetchEvents();
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : Array.isArray(error.response?.data?.detail)
        ? error.response.data.detail.map(e => e.msg).join(', ')
        : "Erreur lors de la création";
      toast.error(errorMsg);
    }
  };


  // Create Karaoke
  const createKaraoke = async () => {
    try {
      // ⚠️ Vérifier les conflits de date
      const conflict = checkEventConflict(karaokeForm.date);
      if (conflict.conflict) {
        toast.error(`❌ Impossible : Un événement "${conflict.type}" existe déjà le ${new Date(karaokeForm.date).toLocaleDateString('fr-FR')} !`);
        return;
      }
      
      await axios.post(`${API}/karaoke`, karaokeForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Soirée karaoké créée!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowKaraokeDialog(false);
      setKaraokeForm({ date: "", start_time: "", end_time: "", title: "", description: "", music_styles: [] });
      fetchEvents();
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : Array.isArray(error.response?.data?.detail)
        ? error.response.data.detail.map(e => e.msg).join(', ')
        : "Erreur lors de la création";
      toast.error(errorMsg);
    }
  };

  // Create Spectacle
  const createSpectacle = async () => {
    try {
      // ⚠️ Vérifier les conflits de date
      const conflict = checkEventConflict(spectacleForm.date);
      if (conflict.conflict) {
        toast.error(`❌ Impossible : Un événement "${conflict.type}" existe déjà le ${new Date(spectacleForm.date).toLocaleDateString('fr-FR')} !`);
        return;
      }
      
      await axios.post(`${API}/spectacle`, spectacleForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Spectacle créé!");
      
      // ⭐ Check for new badges after creating event
      triggerBadgeCheck();
      
      setShowSpectacleDialog(false);
      setSpectacleForm({ date: "", start_time: "", end_time: "", type: "", artist_name: "", description: "", price: "" });
      fetchEvents();
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : Array.isArray(error.response?.data?.detail)
        ? error.response.data.detail.map(e => e.msg).join(', ')
        : "Erreur lors de la création";
      toast.error(errorMsg);
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
      setPlanningForm({ 
        date: "", 
        time: '',
        title: '',
        music_styles: [], 
        artist_categories: [],
        description: "",
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

  const downloadAllInvoices = async () => {
    try {
      toast.loading("Préparation du téléchargement...");
      
      // Construire les paramètres de filtrage
      const params = new URLSearchParams();
      
      if (accountingFilters.payment_method !== 'all') {
        params.append('payment_method', accountingFilters.payment_method);
      }
      
      if (accountingFilters.status !== 'all') {
        params.append('payment_status', accountingFilters.status);
      }
      
      // Gérer les filtres de date selon la période
      if (accountingFilters.period === 'custom') {
        if (accountingFilters.customStartDate) {
          params.append('start_date', accountingFilters.customStartDate);
        }
        if (accountingFilters.customEndDate) {
          params.append('end_date', accountingFilters.customEndDate);
        }
      } else if (accountingFilters.period !== 'all') {
        const now = new Date();
        let startDate;
        
        if (accountingFilters.period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (accountingFilters.period === 'quarter') {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
        } else if (accountingFilters.period === 'year') {
          startDate = new Date(now.getFullYear(), 0, 1);
        }
        
        if (startDate) {
          params.append('start_date', startDate.toISOString().split('T')[0]);
        }
      }
      
      const response = await axios.get(`${API}/invoices/download/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factures_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Factures téléchargées avec succès!");
    } catch (error) {
      toast.dismiss();
      if (error.response?.status === 404) {
        toast.error("Aucune facture trouvée pour les filtres sélectionnés");
      } else {
        toast.error("Erreur lors du téléchargement des factures");
      }
      console.error('Error downloading invoices:', error);
    }
  };

  const downloadSingleInvoice = async (filename) => {
    try {
      // Ouvrir la facture dans un nouvel onglet pour la visualiser
      const invoiceUrl = `${API}/invoices/${filename}`;
      window.open(invoiceUrl, '_blank');
      toast.success("Facture ouverte dans un nouvel onglet");
    } catch (error) {
      toast.error("Erreur lors de l'ouverture de la facture");
      console.error('Error opening invoice:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="venue-dashboard">
      {/* Dashboard Notifications */}
      <DashboardNotification />
      
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
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{profile.subscribers_count} abonnés</span>
                </div>
              )}
              
              {/* Indicateur de statut en ligne/hors ligne */}
              {onlineMode !== 'disabled' && (
                <button
                  onClick={async () => {
                    if (onlineMode === 'manual') {
                      try {
                        const newStatusValue = !manualStatus;
                        await toggleManualStatus();
                        toast.success(newStatusValue ? 'Vous êtes maintenant en ligne' : 'Vous êtes maintenant hors ligne');
                      } catch (err) {
                        toast.error('Erreur lors du changement de statut');
                      }
                    } else {
                      try {
                        await updateMode('manual');
                        toast.success('Mode manuel activé. Cliquez à nouveau pour changer votre statut.');
                      } catch (err) {
                        toast.error('Erreur lors du changement de mode');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted/70 transition-all cursor-pointer"
                  title={onlineMode === 'manual' ? 'Cliquez pour changer votre statut' : 'Cliquez pour activer le mode manuel'}
                >
                  {isOnline ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">En ligne</span>
                    </>
                  ) : (
                    <>
                      <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                      <span className="text-sm font-medium text-muted-foreground">Hors ligne</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Notifications */}
              <Dialog open={showNotificationsDialog} onOpenChange={(open) => {
                setShowNotificationsDialog(open);
                if (open && unreadCount > 0) {
                  // Marquer toutes les notifications comme lues quand on ouvre le panneau
                  (async () => {
                    try {
                      await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
                                await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" onClick={logout} className="text-destructive hover:text-destructive/80" data-testid="logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Navigation - Hamburger Menu */}
            <div className="flex md:hidden items-center gap-2">
              {/* Notifications visible on mobile */}
              <Dialog open={showNotificationsDialog} onOpenChange={(open) => {
                setShowNotificationsDialog(open);
                if (open && unreadCount > 0) {
                  (async () => {
                    try {
                      await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
                      fetchNotifications();
                    } catch (error) {
                      console.error("Error marking notifications as read:", error);
                    }
                  })();
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-[95vw] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {notifications.length > 0 ? (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <Button variant="outline" size="sm" onClick={async () => {
                            try {
                              await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
                              fetchNotifications();
                              toast.success("Tout marqué comme lu");
                            } catch (error) {
                              console.error("Error:", error);
                            }
                          }}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={async () => {
                            if (!window.confirm("Effacer tout ?")) return;
                            try {
                              await axios.delete(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
                              toast.success("Effacé");
                              fetchNotifications();
                            } catch (error) {
                              console.error("Error:", error);
                            }
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {notifications.map((notif) => (
                          <div key={notif.id} className={`p-3 rounded-lg border ${notif.is_read ? 'bg-black/20 border-white/5' : 'bg-primary/10 border-primary/30'}`}>
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Bell className="w-12 h-12 mb-4 opacity-50" />
                        <p>Aucune notification</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Hamburger Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] glassmorphism border-white/10">
                  <div className="flex flex-col gap-4 mt-6">
                    {/* Status */}
                    <div className="flex flex-col gap-3 pb-4 border-b border-white/10">
                      {profile && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                          <Users className="w-5 h-5" />
                          <span>{profile.subscribers_count} abonnés</span>
                        </div>
                      )}
                    </div>

                    <Link to="/leaderboard" className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="font-medium">Trophées</span>
                    </Link>

                    <Link to="/badges" className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <Award className="w-5 h-5 text-primary" />
                      <span className="font-medium">Badges</span>
                    </Link>

                    <Link to="/messages-improved" className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <div className="relative">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        {unreadMessagesCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadMessagesCount > 9 ? '9' : unreadMessagesCount}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">Messages</span>
                      {unreadMessagesCount > 0 && (
                        <span className="ml-auto text-red-500 font-bold text-sm">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Link>

                    <div className="border-t border-white/10 my-2"></div>

                    <button 
                      onClick={logout} 
                      className="flex items-center gap-3 p-3 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
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

        {/* Profile Completion Alert - Masqué si profil complet */}
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
                  Merci de renseigner au minimum le nom et la localisation de votre établissement pour commencer.
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

        {/* Subscription Card - Masqué si abonnement actif */}
        {(!user?.subscription_status || user?.subscription_status !== "active" || isSubscriptionExpired) && (
          <div className="glassmorphism rounded-2xl p-6 mb-8 neon-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">
                  {isSubscriptionExpired ? "Votre abonnement a expiré" : 
                   user?.subscription_status === "trial" ? "Période d'essai" : "Abonnez-vous"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {isSubscriptionExpired ? "Réabonnez-vous pour continuer à utiliser toutes les fonctionnalités" : "12,99€/mois pour être visible"}
                </p>
              </div>
              <Button onClick={handleSubscribe} className="bg-primary hover:bg-primary/90 rounded-full px-6 gap-2" data-testid="subscribe-btn">
                <CreditCard className="w-4 h-4" /> {isSubscriptionExpired ? "Se réabonner" : "S'abonner"}
              </Button>
            </div>
          </div>
        )}

        {/* Trial Banner - Masqué si abonnement actif OU si subscription_status est null/undefined */}
        {user?.subscription_status === "trial" && trialDaysLeft !== null && trialDaysLeft > 0 && (
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

        {/* Renewal Reminder Banner - Compte à rebours 5 jours avant échéance */}
        {showRenewalReminder && !user?.subscription_cancel_at_period_end && (
          <div className="glassmorphism border-2 border-blue-500/50 rounded-2xl p-4 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-semibold text-xl mb-1">
                    ⏰ Renouvellement dans {daysUntilRenewal} jour{daysUntilRenewal > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Votre abonnement sera renouvelé automatiquement pour 12,99€.
                    {daysUntilRenewal === 1 && " C'est demain !"}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCancelRenewal}
                variant="outline" 
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-full whitespace-nowrap"
              >
                Annuler le renouvellement
              </Button>
            </div>
          </div>
        )}

        {/* Cancelled Subscription Banner - Annulation prévue */}
        {user?.subscription_cancel_at_period_end && user?.subscription_status === "active" && daysUntilRenewal !== null && daysUntilRenewal > 0 && (
          <div className="glassmorphism border-2 border-orange-500/50 rounded-2xl p-4 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-semibold text-xl mb-1">
                    ⚠️ Annulation prévue dans {daysUntilRenewal} jour{daysUntilRenewal > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vous avez annulé le renouvellement automatique. Votre abonnement restera actif jusqu'à la fin de la période payée.
                  </p>
                  <p className="text-xs text-orange-400">
                    💡 Vous pouvez changer d'avis et réactiver le renouvellement avant la fin de la période.
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleReactivateRenewal}
                size="sm"
                className="bg-primary hover:bg-primary/90 rounded-full whitespace-nowrap"
              >
                Réactiver
              </Button>
            </div>
          </div>
        )}

        {/* Expired Subscription Alert - Bloque l'accès aux onglets */}
        {isSubscriptionExpired && (
          <div className="glassmorphism border-2 border-red-500/50 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-semibold text-xl mb-2">
                  ⚠️ Accès limité - Abonnement expiré
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Votre abonnement a expiré. Vous ne pouvez plus accéder aux fonctionnalités de gestion d'événements. 
                  Réabonnez-vous pour retrouver l'accès complet à votre dashboard.
                </p>
                <Button 
                  onClick={handleSubscribe} 
                  className="bg-red-500 hover:bg-red-600 rounded-full px-6 gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Se réabonner maintenant
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(newTab) => {
          // Si abonnement expiré, autoriser seulement l'onglet profil
          if (isSubscriptionExpired && newTab !== 'profile') {
            toast.error("Accès limité - Veuillez renouveler votre abonnement pour accéder à cette section");
            return;
          }
          setActiveTab(newTab);
        }} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 mb-6 gap-1 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent min-h-[44px] items-center">
            <TabsTrigger value="profile" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Profil</TabsTrigger>
            <TabsTrigger 
              value="jams" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Bœufs {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="concerts" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Concerts {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="karaoke" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Karaoké {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="spectacle" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Spectacle {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="planning" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Planning {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="candidatures" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Candidatures {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="jacks" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plug className="w-4 h-4 inline mr-1" />
              Jacks {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Bell className="w-4 h-4 inline mr-1" />
              Notifications {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Historique {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="accounting" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              💰 Comptabilité {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Avis {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="bands" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Groupes {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Galerie {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              disabled={isSubscriptionExpired}
              className={`rounded-full whitespace-nowrap flex-shrink-0 px-4 ${isSubscriptionExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Paramètres {isSubscriptionExpired && '🔒'}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileTab venue={venue} handleOpenProfileDialog={() => setEditingProfile(true)} />
          </TabsContent>

          {/* Jams Tab */}
          <TabsContent value="jams">
            <JamsTab jams={jams} handleOpenJamDialog={() => setShowJamDialog(true)} handleEditEvent={handleEditEvent} handleDeleteEvent={handleDeleteEvent} />
          </TabsContent>

          {/* Concerts Tab */}
          <TabsContent value="concerts">
            <ConcertsTab
              concerts={concerts}
              showConcertDialog={showConcertDialog}
              setShowConcertDialog={setShowConcertDialog}
              concertForm={concertForm}
              setConcertForm={setConcertForm}
              handleCreateConcert={handleCreateConcert}
              handleEditEvent={handleEditEvent}
              handleDeleteEvent={handleDeleteEvent}
            />
          </TabsContent>

          {/* Karaoké Tab */}
          <TabsContent value="karaoke">
            <KaraokeTab karaokes={karaokes} handleOpenKaraokeDialog={() => setShowKaraokeDialog(true)} handleEditEvent={handleEditEvent} handleDeleteEvent={handleDeleteEvent} />
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

                      {/* Comptabilité */}
                      <div className="space-y-4 p-4 border-2 border-primary/20 rounded-xl">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          💰 Comptabilité (optionnel)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Méthode de paiement</Label>
                            <Select 
                              value={spectacleForm.payment_method} 
                              onValueChange={(value) => {
                                setSpectacleForm({ 
                                  ...spectacleForm, 
                                  payment_method: value,
                                  amount: value === "promotion" ? "0" : spectacleForm.amount
                                });
                              }}
                            >
                              <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue placeholder="Aucune (optionnel)" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-white/10">
                                <SelectItem value="facture">Facture</SelectItem>
                                <SelectItem value="guso">GUSO</SelectItem>
                                <SelectItem value="promotion">Promotion du groupe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {spectacleForm.payment_method !== "promotion" && (
                            <div className="space-y-2">
                              <Label>Montant (€)</Label>
                              <Input 
                                type="number" 
                                value={spectacleForm.amount} 
                                onChange={(e) => setSpectacleForm({ ...spectacleForm, amount: e.target.value })} 
                                className="bg-black/20 border-white/10"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>
                          )}
                        </div>

                        {spectacleForm.payment_method && (spectacleForm.amount || spectacleForm.payment_method === "promotion") && (
                          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm">
                              <span className="font-medium">Paiement:</span> {
                                spectacleForm.payment_method === "facture" ? "📄 Facture" : 
                                spectacleForm.payment_method === "guso" ? "🎫 GUSO" : 
                                "🎸 Promotion du groupe"
                              }{spectacleForm.payment_method !== "promotion" && ` • ${parseFloat(spectacleForm.amount || 0).toFixed(2)} €`}
                              {spectacleForm.payment_method === "promotion" && " • Gratuit"}
                            </p>
                          </div>
                        )}
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
                      className="glassmorphism rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => handleEditEvent(spectacle, 'spectacle')}
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
                          onClick={async (e) => {
                            e.stopPropagation();
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
            <PlanningTab
              loadingEvents={loadingEvents}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              handleDateClick={handleDateClick}
              bookedDates={bookedDates}
              eventsByDate={eventsByDate}
              concerts={concerts}
              jams={jams}
              karaokes={karaokes}
              spectacles={spectacles}
              planningSlots={planningSlots}
              showPlanningModal={showPlanningModal}
              setShowPlanningModal={setShowPlanningModal}
              selectedDate={selectedDate}
              planningForm={planningForm}
              setPlanningForm={setPlanningForm}
              handleCreatePlanningSlot={handleCreatePlanningSlot}
              showApplicationsModal={showApplicationsModal}
              setShowApplicationsModal={setShowApplicationsModal}
              selectedSlot={selectedSlot}
              applications={applications}
              handleAcceptApplication={handleAcceptApplication}
              handleRejectApplication={handleRejectApplication}
            />
          </TabsContent>

          {/* Candidatures Tab - Créneaux ouverts aux groupes */}
          <TabsContent value="candidatures">
            <CandidaturesTab
              planningSlots={planningSlots}
              applications={applications}
              handleSlotCardClick={handleSlotCardClick}
              setViewingApplications={setViewingApplications}
              fetchApplications={fetchApplications}
            />
          </TabsContent>

          {/* Jacks (Subscribers) Tab */}
          <TabsContent value="jacks">
            <JacksTab subscribers={subscribers} />
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
                  
                  {/* Warning Message */}
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-amber-500 mb-1">⚠️ Utilisation responsable</p>
                      <p className="text-amber-200/80 leading-relaxed">
                        N'abusez pas des notifications à des fins commerciales. Un usage excessif peut saturer vos abonnés et les inciter à se désabonner. Privilégiez des messages pertinents et utiles.
                      </p>
                    </div>
                  </div>
                  
                  {/* Notifications Quota Counter */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-full">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Notifications cette semaine</p>
                        <p className="text-xs text-muted-foreground">Limite: {notificationsQuota.total} par semaine</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{notificationsQuota.remaining}</p>
                        <p className="text-xs text-muted-foreground">restante{notificationsQuota.remaining > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {[...Array(notificationsQuota.total)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${i < notificationsQuota.used ? 'bg-primary' : 'bg-white/10'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={sendBroadcastNotification}
                    disabled={sendingBroadcast || !broadcastMessage.trim() || notificationsQuota.remaining === 0}
                    className="w-full bg-primary hover:bg-primary/90 rounded-full gap-2"
                  >
                    {sendingBroadcast ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : notificationsQuota.remaining === 0 ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Limite hebdomadaire atteinte
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Envoyer la notification
                      </>
                    )}
                  </Button>
                  
                  {notificationsQuota.remaining === 0 && notificationsQuota.reset_date && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Nouvelle notification disponible le {new Date(notificationsQuota.reset_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
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
            <ReviewsTab
              reviews={reviews}
              showReviews={showReviews}
              toggleReviewsVisibility={toggleReviewsVisibility}
              totalReviews={totalReviews}
              averageRating={averageRating}
              respondToReview={respondToReview}
            />
          </TabsContent>

          {/* Bands Tab */}
          <TabsContent value="bands" className="mt-6">
            <BandsTab bands={bands} />
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <GalleryTab
              gallery={gallery}
              uploadingPhoto={uploadingPhoto}
              uploadGalleryPhoto={uploadGalleryPhoto}
              deleteGalleryPhoto={deleteGalleryPhoto}
            />
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

          {/* Comptabilité Tab */}
          <TabsContent value="accounting">
            <AccountingTab 
              jams={jams}
              concerts={concerts}
              karaokes={karaokes}
              spectacles={spectacles}
            />
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
            <SettingsTab />
          </TabsContent>

        </Tabs>

        {/* Modale de sélection d'événements multiples */}
        <Dialog open={showEventSelectionModal} onOpenChange={setShowEventSelectionModal}>
          <DialogContent className="glassmorphism border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">
                Plusieurs événements ce jour
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Plusieurs événements sont prévus à cette date. Sélectionnez celui que vous souhaitez consulter :
              </p>
              <div className="space-y-2">
                {multipleEventsOfDay.map((event, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEvent(event);
                      setSelectedEventType(event.type);
                      setIsEditingEvent(false);
                      setShowEventSelectionModal(false);
                      setShowEventDetailsModal(true);
                    }}
                    className="w-full p-4 rounded-xl border-2 border-white/10 hover:border-primary/50 bg-black/20 hover:bg-primary/10 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {event.label}
                        </p>
                        {event.title && (
                          <p className="text-sm text-muted-foreground mt-1">{event.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.start_time && `${event.start_time}`}
                          {event.end_time && ` - ${event.end_time}`}
                        </p>
                      </div>
                      <div className="text-3xl">
                        {event.type === 'concert' && '🎸'}
                        {event.type === 'jam' && '🎵'}
                        {event.type === 'karaoke' && '🎤'}
                        {event.type === 'spectacle' && '🎭'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                {isEditingEvent ? 'Modifier' : 'Détails'} {
                  selectedEventType === 'concert' ? 'du Concert' : 
                  selectedEventType === 'jam' ? 'du Bœuf' :
                  selectedEventType === 'karaoke' ? 'du Karaoké' :
                  selectedEventType === 'spectacle' ? 'du Spectacle' :
                  selectedEventType === 'slot' ? 'du Créneau' :
                  selectedEventType === 'application' ? 'de la Candidature' :
                  'de l\'événement'
                }
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

                {/* Section Facture */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-lg font-semibold">📄 Facture</h3>
                  
                  {selectedEvent.invoice_file ? (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <Check className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-400">Facture jointe</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedEvent.invoice_file}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSingleInvoice(selectedEvent.invoice_file)}
                        className="border-green-500/30"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      {isEditingEvent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (window.confirm("Supprimer la facture actuelle ?")) {
                              try {
                                const endpoint = selectedEventType === 'jam' ? 'jams' : 
                                                selectedEventType === 'concert' ? 'concerts' :
                                                selectedEventType === 'karaoke' ? 'karaoke' : 'spectacle';
                                
                                await axios.delete(
                                  `${API}/${endpoint}/${selectedEvent.id}/invoice`,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                
                                setSelectedEvent({ ...selectedEvent, invoice_file: null });
                                
                                // Update local events list
                                const updateInvoice = (events) => 
                                  events.map(e => 
                                    e.id === selectedEvent.id 
                                      ? { ...e, invoice_file: null }
                                      : e
                                  );
                                
                                if (selectedEventType === 'jam') setJams(updateInvoice);
                                else if (selectedEventType === 'concert') setConcerts(updateInvoice);
                                else if (selectedEventType === 'karaoke') setKaraokes(updateInvoice);
                                else if (selectedEventType === 'spectacle') setSpectacles(updateInvoice);
                                
                                toast.success("Facture supprimée !");
                              } catch (error) {
                                toast.error("Erreur lors de la suppression");
                              }
                            }
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/20 border border-white/10 rounded-lg">
                      {isEditingEvent ? (
                        <div>
                          {/* Hidden input for file selection */}
                          <input
                            id="modal-file-input"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error("Fichier trop volumineux (max 10MB)");
                                return;
                              }
                              
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                
                                const endpoint = selectedEventType === 'jam' ? 'jams' : 
                                                selectedEventType === 'concert' ? 'concerts' :
                                                selectedEventType === 'karaoke' ? 'karaoke' : 'spectacle';
                                
                                const response = await axios.post(
                                  `${API}/${endpoint}/${selectedEvent.id}/invoice`,
                                  formData,
                                  { 
                                    headers: { 
                                      Authorization: `Bearer ${token}`,
                                      'Content-Type': 'multipart/form-data'
                                    } 
                                  }
                                );
                                
                                setSelectedEvent({ ...selectedEvent, invoice_file: response.data.filename });
                                toast.success("Facture ajoutée !");
                                e.target.value = '';
                              } catch (error) {
                                toast.error("Erreur lors de l'upload");
                                console.error(error);
                              }
                            }}
                          />
                          
                          {/* Hidden input for camera capture */}
                          <input
                            id="modal-camera-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error("Fichier trop volumineux (max 10MB)");
                                return;
                              }
                              
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                
                                const endpoint = selectedEventType === 'jam' ? 'jams' : 
                                                selectedEventType === 'concert' ? 'concerts' :
                                                selectedEventType === 'karaoke' ? 'karaoke' : 'spectacle';
                                
                                const response = await axios.post(
                                  `${API}/${endpoint}/${selectedEvent.id}/invoice`,
                                  formData,
                                  { 
                                    headers: { 
                                      Authorization: `Bearer ${token}`,
                                      'Content-Type': 'multipart/form-data'
                                    } 
                                  }
                                );
                                
                                setSelectedEvent({ ...selectedEvent, invoice_file: response.data.filename });
                                toast.success("Photo ajoutée !");
                                e.target.value = '';
                              } catch (error) {
                                toast.error("Erreur lors de l'upload");
                                console.error(error);
                              }
                            }}
                          />
                          
                          <div className="flex flex-col items-center gap-3 py-6">
                            <Paperclip className="w-8 h-8 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium">Cliquez pour joindre une facture</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, PNG, JPG (max 10MB)
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" className="mt-2">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choisir un fichier
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="bg-background border-white/10">
                                <DropdownMenuItem 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => {
                                      const input = document.getElementById('modal-camera-input');
                                      if (input) {
                                        input.click();
                                      } else {
                                        toast.error("Input caméra introuvable");
                                      }
                                    }, 100);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Camera className="w-4 h-4 mr-2" />
                                  Prendre une photo
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => {
                                      const input = document.getElementById('modal-file-input');
                                      if (input) {
                                        input.click();
                                      } else {
                                        toast.error("Input fichier introuvable");
                                      }
                                    }, 100);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choisir un fichier
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune facture jointe</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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

        {/* Modale de message au groupe */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="glassmorphism border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">
                Contacter {selectedBand?.name}
              </DialogTitle>
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
                  className="bg-black/20 border-white/10 min-h-[150px]"
                  rows={6}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={sendMessageToBand}
                  className="flex-1"
                >
                  Envoyer 📧
                </Button>
                <Button
                  onClick={() => {
                    setShowMessageDialog(false);
                    setMessageForm({ subject: "", content: "" });
                  }}
                  variant="outline"
                  className="flex-1 border-white/20"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
