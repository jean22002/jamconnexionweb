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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import LazyImage from "../components/LazyImage";
import { TimeSelect } from "../components/ui/time-select";
import { MusicianImageUpload } from "../components/ui/image-upload";
import OnlineStatusSelector from "../components/OnlineStatusSelector";
import BackgroundSyncSettings from "../components/BackgroundSyncSettings";
// NEW: Import refactored utilities
import { buildImageUrl } from "../utils/urlBuilder";
import { CityAutocomplete, reverseGeocode } from "../components/CityAutocomplete";
import { 
  Music, MapPin, LogOut, Search, Guitar, Users,
  Globe, Instagram, Facebook, Phone, User, Loader2, Navigation, X,
  Bell, Youtube, UserPlus, Check, Calendar as CalendarIcon, Heart,
  Radio, MapPinOff, Locate, Settings2, Send, ArrowLeft, MessageSquare, Clock, Eye, Plus, Edit, Trash2, Award, Trophy, Menu, Ban, UserMinus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBadgeAutoCheck } from "../hooks/useBadgeAutoCheck";
import { useAutoGeolocation } from "../hooks/useGeolocation";
import { useNotifications } from "../hooks/useNotifications";
import { toast } from "sonner";
import JoinEventButton from "../components/JoinEventButton";
import SocialLinks from "../components/SocialLinks";
import { DEPARTEMENTS_FRANCE, REGIONS_FRANCE } from "../data/france-locations";
import { MUSIC_STYLES_LIST } from "../data/music-styles";

// Options pour les groupes
const BAND_TYPES = [
  "Duo acoustique",
  "Trio acoustique",
  "Quatuor acoustique",
  "Duo electro acoustique",
  "Trio electro acoustique",
  "Quatuor électro acoustique",
  "Groupe de reprise",
  "Groupe tribute",
  "Groupe de compos",
  "Autre"
];

const REPERTOIRE_TYPES = ["Compos", "Reprises", "Compos + Reprises"];

const SHOW_DURATIONS = [
  "30mn", "45mn", "1h", "1h15", "1h30", "1h45", 
  "2h", "2h15", "2h30", "2h45", 
  "3h", "3h15", "3h30", "3h45", 
  "4h", "4h15", "4h30", "4h45", 
  "5h", "5h15", "5h30", "5h45", "6h"
];

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Composant réutilisable pour afficher une carte de musicien
function MusicianCard({ musician, onSendFriendRequest, onCancelRequest, sentRequests, friends }) {
  // Vérifier si une demande a déjà été envoyée à ce musicien
  const requestSent = sentRequests?.some(req => req.to_user_id === musician.user_id);
  // Trouver l'ID de la demande pour pouvoir l'annuler
  const sentRequest = sentRequests?.find(req => req.to_user_id === musician.user_id);
  // Vérifier si déjà ami (cherche dans user_id ET friend_id pour compatibilité)
  const isFriend = friends?.some(f => 
    f.friend_id === musician.user_id || f.user_id === musician.user_id
  );

  return (
    <div className="card-venue p-5">
      <div className="flex items-start gap-4">
        {musician.profile_image ? (
          <LazyImage 
            src={musician.profile_image} 
            alt={musician.pseudo || "Musicien"} 
            className="w-16 h-16 rounded-full object-cover" 
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-heading font-semibold">{musician.pseudo}</h3>
          {musician.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {musician.city}
              {musician.department && ` (${musician.department})`}
            </p>
          )}
          {musician.experience_level && (
            <p className="text-xs text-muted-foreground mt-1">
              🎵 {musician.experience_level}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {musician.instruments?.slice(0, 2).map((inst, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        {isFriend ? (
          <Button variant="outline" className="flex-1 rounded-full border-green-500/50 text-green-500" disabled>
            <Check className="w-4 h-4 mr-2" /> Ami
          </Button>
        ) : requestSent ? (
          <>
            <Button variant="outline" className="flex-1 rounded-full border-orange-500/50 text-orange-500" disabled>
              <Clock className="w-4 h-4 mr-2" /> Envoyé
            </Button>
            <Button 
              onClick={() => onCancelRequest(sentRequest.id)} 
              variant="outline" 
              size="icon"
              className="rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button onClick={() => onSendFriendRequest(musician.user_id)} variant="outline" className="flex-1 rounded-full border-white/20 gap-2">
            <UserPlus className="w-4 h-4" /> Ajouter
          </Button>
        )}
        <Link to={`/musician/${musician.id}`} className="flex-1">
          <Button variant="secondary" className="w-full rounded-full gap-2">
            <Eye className="w-4 h-4" /> Voir
          </Button>
        </Link>
      </div>
    </div>
  );
}

function VenueCard({ venue, onSubscribe, onUnsubscribe, subscriptions }) {
  const isSubscribed = subscriptions?.some(sub => sub.venue_id === venue.id);

  return (
    <div className="card-venue p-5">
      <Link to={`/venue/${venue.id}`}>
        {venue.profile_image && (
          <LazyImage 
            src={venue.profile_image} 
            alt={venue.name} 
            className="w-full h-32 object-cover rounded-lg mb-3 hover:opacity-90 transition" 
          />
        )}
        <h3 className="font-heading font-semibold hover:text-primary transition">{venue.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" />
          {venue.city}
          {venue.department && ` (${venue.department})`}
        </p>
        {venue.music_styles?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {venue.music_styles.slice(0, 3).map((style, i) => (
              <span key={i} className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs rounded-full">{style}</span>
            ))}
          </div>
        )}
      </Link>
      <div className="mt-4">
        {isSubscribed ? (
          <Button 
            onClick={() => onUnsubscribe(venue.id)} 
            variant="outline" 
            className="w-full rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-2" /> Se déconnecter
          </Button>
        ) : (
          <Button 
            onClick={() => onSubscribe(venue.id)} 
            variant="default" 
            className="w-full rounded-full bg-primary hover:bg-primary/90"
          >
            <Heart className="w-4 h-4 mr-2" /> Se connecter
          </Button>
        )}
      </div>
    </div>
  );
}

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
  const { triggerBadgeCheck } = useBadgeAutoCheck();
  
  // Hook pour les notifications push
  useNotifications(token, user);
  
  const [venues, setVenues] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // Nouvelles demandes envoyées
  const [blockedUsers, setBlockedUsers] = useState([]); // Utilisateurs bloqués
  const [subscriptions, setSubscriptions] = useState([]);
  const [participations, setParticipations] = useState([]); // Participations musicien
  const [activeTab, setActiveTab] = useState("map");
  const [currentParticipation, setCurrentParticipation] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // Candidatures search states
  const [candidatures, setCandidatures] = useState([]);
  const [loadingCandidatures, setLoadingCandidatures] = useState(false);
  const [candidatureFilters, setCandidatureFilters] = useState({
    dateFrom: '',
    dateTo: '',
    region: '',
    department: '',
    musicStyle: ''
  });
  
  // My applications states
  const [myApplications, setMyApplications] = useState([]);
  const [loadingMyApplications, setLoadingMyApplications] = useState(false);
  
  // Change password states
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Geolocation states
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  
  // Bands
  const [bands, setBands] = useState([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [bandFilters, setBandFilters] = useState({ 
    department: "", 
    city: "", 
    musicStyle: "", 
    bandType: "",
    repertoireType: "",
    lookingForMembers: false
  });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedBand, setSelectedBand] = useState(null);
  const [showBandDetailsDialog, setShowBandDetailsDialog] = useState(false);
  const [bandSearchMode, setBandSearchMode] = useState("filters");
  const [bandSearchRadius, setBandSearchRadius] = useState(50);
  const [messageForm, setMessageForm] = useState({ subject: "", content: "" });
  const [searchRadius, setSearchRadius] = useState(25); // km
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [lastSearchTime, setLastSearchTime] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Venue events modal states
  const [showVenueEventsModal, setShowVenueEventsModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueEvents, setVenueEvents] = useState({ concerts: [], jams: [] });
  const [loadingVenueEvents, setLoadingVenueEvents] = useState(false);

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
      
      const previousCount = nearbyVenues.length;
      setNearbyVenues(response.data);
      setLastSearchTime(new Date());
      
      // Show toast only once when first venues are found or when count significantly changes
      if (response.data.length > 0 && previousCount === 0) {
        toast.success(`${response.data.length} établissement(s) à proximité`, {
          id: 'nearby-venues-initial',
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error fetching nearby venues:", error);
    }
  }, [searchRadius]); // FIXED: Don't depend on nearbyVenues.length to prevent loops

  // Effect to refetch when radius changes
  useEffect(() => {
    if (geoPosition) {
      fetchNearbyVenues(geoPosition.latitude, geoPosition.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchRadius]); // FIXED: Don't add geoPosition and fetchNearbyVenues as dependencies to prevent loops

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
    instruments: [], music_styles: [], experience_years: 0, experience_level: "",
    city: "", department: "", region: "", phone: "", website: "", facebook: "", instagram: "", youtube: "", bandcamp: "",
    has_band: false,
    band: { name: "", photo: "", facebook: "", instagram: "", youtube: "", website: "", bandcamp: "" },
    bands: [], // Multiple bands support
    concerts: []
  });

  const [newConcert, setNewConcert] = useState({ date: "", venue_id: "", venue_name: "", city: "", description: "" });
  
  // State for managing multiple bands
  const [editingBandIndex, setEditingBandIndex] = useState(null);
  const [showBandDialog, setShowBandDialog] = useState(false);
  const [currentBand, setCurrentBand] = useState({
    name: "",
    photo: "",
    description: "",
    members_count: null,
    music_styles: [],
    band_type: "",
    repertoire_type: "",
    show_duration: "",
    city: "",
    postal_code: "",
    department: "",
    department_name: "",
    region: "",
    facebook: "",
    instagram: "",
    youtube: "",
    website: "",
    bandcamp: "",
    looking_for_concerts: true,
    looking_for_members: false,
    is_public: true,
    is_association: false,
    association_name: "",
    has_label: false,
    label_name: "",
    label_city: "",
    payment_methods: [] // ["facture", "guso"]
  });

  // State for solo profile
  const [soloProfile, setSoloProfile] = useState({
    has_solo: false,
    band_type: "",
    repertoire_type: "",
    show_duration: "",
    music_styles: [],
    description: "",
    looking_for_concerts: true,
    payment_methods: [] // ["facture", "guso"]
  });

  const fetchData = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    console.log('[MusicianDashboard] fetchData called (attempt', retryCount + 1, '/', MAX_RETRIES + 1, '), API endpoint:', `${API}/venues`);
    
    try {
      // Charger les venues (critique pour l'affichage de la carte)
      const venuesRes = await axios.get(`${API}/venues`, { timeout: 10000 });
      console.log('[MusicianDashboard] Venues loaded successfully. Count:', venuesRes.data.length);
      
      if (Array.isArray(venuesRes.data)) {
        // Transform image URLs before setting state
        const venuesWithUrls = venuesRes.data.map(venue => ({
          ...venue,
          profile_image: venue.profile_image ? buildImageUrl(venue.profile_image) : null,
          cover_image: venue.cover_image ? buildImageUrl(venue.cover_image) : null
        }));
        setVenues(venuesWithUrls);
        console.log('[MusicianDashboard] Venues state updated successfully');
      } else {
        console.error('[MusicianDashboard] Venues data is not an array:', typeof venuesRes.data);
        setVenues([]);
      }
      
      // Charger les musiciens séparément (non-critique, ne doit pas bloquer venues)
      try {
        const musiciansRes = await axios.get(`${API}/musicians`, { timeout: 10000 });
        console.log('[MusicianDashboard] Musicians loaded successfully. Count:', musiciansRes.data.length);
        
        if (Array.isArray(musiciansRes.data)) {
          // Transform image URLs before setting state
          const musiciansWithUrls = musiciansRes.data.map(musician => ({
            ...musician,
            profile_image: musician.profile_image ? buildImageUrl(musician.profile_image) : null,
            cover_image: musician.cover_image ? buildImageUrl(musician.cover_image) : null
          }));
          setMusicians(musiciansWithUrls);
        } else {
          setMusicians([]);
        }
      } catch (musiciansError) {
        console.warn('[MusicianDashboard] Failed to load musicians (non-critical):', musiciansError.response?.status, musiciansError.message);
        // L'échec de chargement des musiciens ne doit pas empêcher l'affichage des venues
        setMusicians([]);
      }
      
      setLoadingError(false);
      setLoading(false);
    } catch (error) {
      console.error("[MusicianDashboard] Error fetching venues (attempt", retryCount + 1, "):", error);
      console.error("[MusicianDashboard] Error details:", error.response?.status, error.response?.data, error.message);
      
      // Retry logic pour erreurs réseau et 520
      if (retryCount < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.response?.status === 520 || error.message === 'Network Error')) {
        console.log('[MusicianDashboard] Retrying in 2 seconds...');
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, 2000);
      } else {
        // Après tous les retries, afficher un message d'erreur
        console.error('[MusicianDashboard] All retries failed');
        toast.error("Erreur de chargement des établissements. Veuillez rafraîchir la page.");
        setLoadingError(true);
        setLoading(false);
      }
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(response.data);
      
      // Migration: si l'ancien champ 'band' existe mais pas 'bands', migrer vers bands[0]
      const profileData = response.data;
      let bandsArray = profileData.bands || [];
      if (profileData.has_band && profileData.band && profileData.band.name && bandsArray.length === 0) {
        bandsArray = [profileData.band];
      }
      
      // Construire les URLs complètes pour les images avec buildImageUrl
      const profile_image_url = buildImageUrl(profileData.profile_image);
      const cover_image_url = buildImageUrl(profileData.cover_image);
      
      setProfileForm({
        pseudo: profileData.pseudo || "",
        age: profileData.age || null,
        profile_image: profile_image_url,
        cover_image: cover_image_url,
        bio: profileData.bio || "",
        instruments: profileData.instruments || [],
        music_styles: profileData.music_styles || [],
        experience_years: profileData.experience_years || 0,
        experience_level: profileData.experience_level || "",
        city: profileData.city || "",
        department: profileData.department || "",
        region: profileData.region || "",
        phone: profileData.phone || "",
        website: profileData.website || "",
        facebook: profileData.facebook || "",
        instagram: profileData.instagram || "",
        youtube: profileData.youtube || "",
        bandcamp: profileData.bandcamp || "",
        has_band: profileData.has_band || false,
        band: profileData.band || { name: "", photo: "", facebook: "", instagram: "", youtube: "", website: "", bandcamp: "" },
        bands: bandsArray,
        concerts: profileData.concerts || []
      });
      
      // Charger le profil solo s'il existe
      if (profileData.solo_profile) {
        setSoloProfile(profileData.solo_profile);
      }
    } catch (error) {
      if (error.response?.status !== 404) console.error("Error:", error);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications/unread/count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [token]);

  const fetchFriends = useCallback(async () => {
    try {
      const [friendsRes, requestsRes, sentRes, subsRes] = await Promise.all([
        axios.get(`${API}/friends`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/friends/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/friends/sent`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/my-subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      // Transform image URLs before setting state
      const friendsWithUrls = (friendsRes.data || []).map(friend => ({
        ...friend,
        profile_image: friend.profile_image ? buildImageUrl(friend.profile_image) : null
      }));
      const requestsWithUrls = (requestsRes.data || []).map(req => ({
        ...req,
        profile_image: req.profile_image ? buildImageUrl(req.profile_image) : null
      }));
      const sentWithUrls = (sentRes.data || []).map(sent => ({
        ...sent,
        profile_image: sent.profile_image ? buildImageUrl(sent.profile_image) : null
      }));
      // Transform subscriptions image URLs too
      const subsWithUrls = (subsRes.data || []).map(sub => ({
        ...sub,
        venue_image: sub.venue_image ? buildImageUrl(sub.venue_image) : null
      }));
      setFriends(friendsWithUrls);
      setFriendRequests(requestsWithUrls);
      setSentRequests(sentWithUrls);
      setSubscriptions(subsWithUrls);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [token]);

  const fetchParticipations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/me/participations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipations(response.data || []);
    } catch (error) {
      console.error("Error fetching participations:", error);
      setParticipations([]);
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
    // Initial data load - only runs once on mount
    fetchData();
    fetchProfile();
    fetchNotifications();
    fetchFriends();
    fetchBlockedUsers();
    fetchCurrentParticipation();
    fetchParticipations();
    
    // Force service worker update to get latest cache version
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
          console.log('🔄 Forcing service worker update...');
          reg.update();
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run only once on mount

  // Polling pour rafraîchir les notifications toutes les 30 secondes (réduit de 15s à 30s)
  useEffect(() => {
    if (!token) return;
    
    const notificationInterval = setInterval(() => {
      fetchNotifications();
      fetchFriends(); // Rafraîchir aussi les demandes d'amis pour mettre à jour le compteur
    }, 30000); // 30 secondes au lieu de 15
    
    return () => clearInterval(notificationInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  
  // Écouter l'événement de nouvelle notification pour rafraîchir immédiatement
  useEffect(() => {
    const handleNewNotification = () => {
      console.log('🔔 Événement nouvelle notification reçu - Rafraîchissement immédiat');
      fetchNotifications();
      fetchFriends();
    };
    
    window.addEventListener('new-notification-received', handleNewNotification);
    
    return () => {
      window.removeEventListener('new-notification-received', handleNewNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Polling for participation status (every 60 seconds - réduit de 30s à 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentParticipation();
    }, 60000); // 60 secondes au lieu de 30
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bands Management
  const fetchBands = async () => {
    setBandsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Mode filtres classiques
      if (bandSearchMode === "filters") {
        if (bandFilters.department) params.append('department', bandFilters.department);
        if (bandFilters.city) params.append('city', bandFilters.city);
        if (bandFilters.musicStyle) params.append('music_style', bandFilters.musicStyle);
        if (bandFilters.bandType) params.append('band_type', bandFilters.bandType);
        if (bandFilters.repertoireType) params.append('repertoire_type', bandFilters.repertoireType);
        if (bandFilters.lookingForMembers) params.append('looking_for_members', 'true');
      }
      
      // Mode géolocalisation
      if (bandSearchMode === "geolocation" && geoPosition) {
        params.append('latitude', geoPosition.latitude);
        params.append('longitude', geoPosition.longitude);
        params.append('radius', bandSearchRadius);
      }
      
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
  }, [activeTab, bandFilters, bandSearchMode, bandSearchRadius]); // FIXED: Don't add geoPosition as it causes loops

  useEffect(() => {
    if (activeTab === "my-applications") {
      fetchMyApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // FIXED: Don't add fetchMyApplications as dependency

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

  // Band management functions
  const handleOpenBandDialog = (index = null) => {
    if (index !== null) {
      // Editing existing band
      setCurrentBand(profileForm.bands[index]);
      setEditingBandIndex(index);
    } else {
      // Adding new band
      setCurrentBand({
        name: "",
        photo: "",
        description: "",
        members_count: null,
        music_styles: [],
        band_type: "",
        repertoire_type: "",
        show_duration: "",
        city: "",
        postal_code: "",
        department: "",
        department_name: "",
        region: "",
        facebook: "",
        instagram: "",
        youtube: "",
        website: "",
        bandcamp: "",
        looking_for_concerts: true,
        looking_for_members: false,
        looking_for_profiles: [],
        is_public: true,
        is_admin: false,
        admin_id: null,
        payment_methods: []
      });
      setEditingBandIndex(null);
    }
    setShowBandDialog(true);
  };

  const handleSaveBand = () => {
    if (!currentBand.name) {
      toast.error("Le nom du groupe est requis");
      return;
    }

    // Si c'est une nouvelle création et que is_admin est activé, enregistrer l'admin_id
    if (editingBandIndex === null && currentBand.is_admin) {
      currentBand.admin_id = user.id;
    }

    // Vérifier si l'utilisateur est admin avant de permettre la modification
    if (editingBandIndex !== null && currentBand.admin_id && currentBand.admin_id !== user.id) {
      toast.error("Seul l'administrateur du groupe peut modifier ces informations");
      return;
    }

    if (editingBandIndex !== null) {
      // Update existing band
      const newBands = [...profileForm.bands];
      newBands[editingBandIndex] = currentBand;
      setProfileForm({ ...profileForm, bands: newBands });
      toast.success("Groupe mis à jour");
    } else {
      // Add new band
      setProfileForm({ ...profileForm, bands: [...profileForm.bands, currentBand] });
      toast.success("Groupe ajouté");
    }
    
    setShowBandDialog(false);
    setCurrentBand({
      name: "",
      photo: "",
      description: "",
      members_count: null,
      music_styles: [],
      band_type: "",
      repertoire_type: "",
      show_duration: "",
      city: "",
      postal_code: "",
      department: "",
      department_name: "",
      region: "",
      facebook: "",
      instagram: "",
      youtube: "",
      website: "",
      bandcamp: "",
      looking_for_concerts: true,
      looking_for_members: false,
      looking_for_profiles: [],
      is_public: true,
      has_sound_engineer: false,
      is_admin: false,
      admin_id: null,
      payment_methods: []
    });
  };

  const handleSaveProfile = async () => {
    try {
      const method = profile ? "put" : "post";
      
      // Préparer les données avec le profil solo
      const profileData = {
        ...profileForm,
        solo_profile: soloProfile
      };
      
      // Normalize image URLs robustly (same logic as VenueDashboard)
      if (profileData.profile_image) {
        let normalizedUrl = profileData.profile_image;
        if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
          normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
        }
        normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
        if (!normalizedUrl.startsWith('/api/uploads')) {
          normalizedUrl = normalizedUrl.replace(/^\/?(uploads\/)/, '/api/uploads/');
        }
        profileData.profile_image = normalizedUrl;
      }
      
      if (profileData.cover_image) {
        let normalizedUrl = profileData.cover_image;
        if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
          normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
        }
        normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
        if (!normalizedUrl.startsWith('/api/uploads')) {
          normalizedUrl = normalizedUrl.replace(/^\/?(uploads\/)/, '/api/uploads/');
        }
        profileData.cover_image = normalizedUrl;
      }
      
      const response = await axios[method](`${API}/musicians`, profileData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Profil mis à jour!");
      
      // Update profile state with the response
      setProfile(response.data);
      
      // NEW: Use refactored buildImageUrl utility
      const saved_profile_image = buildImageUrl(response.data.profile_image);
      const saved_cover_image = buildImageUrl(response.data.cover_image);
      
      // Update profileForm with complete URLs from backend response
      setProfileForm(prev => ({
        ...prev,
        profile_image: saved_profile_image,
        cover_image: saved_cover_image
      }));
      
      console.log('✅ Profile updated. Images saved:', {
        profile_image: saved_profile_image,
        cover_image: saved_cover_image
      });
      
      setEditingProfile(false);
      fetchData(); // Recharger la liste des musiciens pour mettre à jour les filtres
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const searchCandidatures = async () => {
    setLoadingCandidatures(true);
    try {
      const params = new URLSearchParams();
      if (candidatureFilters.dateFrom) params.append('date_from', candidatureFilters.dateFrom);
      if (candidatureFilters.dateTo) params.append('date_to', candidatureFilters.dateTo);
      if (candidatureFilters.region) params.append('region', candidatureFilters.region);
      if (candidatureFilters.department) params.append('department', candidatureFilters.department);
      if (candidatureFilters.musicStyle) params.append('music_style', candidatureFilters.musicStyle);
      
      const response = await axios.get(`${API}/planning/search?${params.toString()}`);
      setCandidatures(response.data);
    } catch (error) {
      console.error("Error searching candidatures:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoadingCandidatures(false);
    }
  };

  const applyToSlot = async (slotId) => {
    try {
      await axios.post(`${API}/planning/${slotId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Candidature envoyée !");
      searchCandidatures(); // Refresh list
      fetchMyApplications(); // Refresh my applications
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la candidature");
    }
  };

  const fetchMyApplications = async () => {
    setLoadingMyApplications(true);
    try {
      const response = await axios.get(`${API}/applications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyApplications(response.data);
    } catch (error) {
      console.error("Error fetching my applications:", error);
      toast.error("Erreur lors du chargement de vos candidatures");
    } finally {
      setLoadingMyApplications(false);
    }
  };

  const cancelApplication = async (appId) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette candidature ?")) {
      return;
    }
    try {
      await axios.delete(`${API}/applications/my/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Candidature annulée");
      fetchMyApplications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'annulation");
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    
    setChangingPassword(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Mot de passe modifié avec succès ! Un email de confirmation vous a été envoyé.");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors du changement de mot de passe");
    } finally {
      setChangingPassword(false);
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
      
      // ⭐ Check for new badges after friend request
      triggerBadgeCheck();
      
      fetchFriends(); // Refresh pour mettre à jour l'état des boutons
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const cancelFriendRequest = async (requestId) => {
    try {
      await axios.delete(`${API}/friends/cancel/${requestId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Demande annulée!");
      fetchFriends(); // Refresh pour mettre à jour l'état des boutons
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleSubscribe = async (venueId) => {
    try {
      await axios.post(`${API}/venues/${venueId}/subscribe`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Connecté à l'établissement!");
      
      // ⭐ Check for new badges after subscribing to venue
      triggerBadgeCheck();
      
      fetchFriends(); // Refresh pour mettre à jour subscriptions
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleUnsubscribe = async (venueId) => {
    try {
      await axios.delete(`${API}/venues/${venueId}/unsubscribe`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Déconnecté de l'établissement!");
      fetchFriends(); // Refresh pour mettre à jour subscriptions
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Fonction pour charger les événements d'un établissement
  const fetchVenueEvents = async (venueId, venueName) => {
    setSelectedVenue({ id: venueId, name: venueName });
    setLoadingVenueEvents(true);
    setShowVenueEventsModal(true);
    
    // Vider les anciens événements pour montrer un chargement frais
    setVenueEvents({ concerts: [], jams: [] });
    
    try {
      const [concertsRes, jamsRes] = await Promise.all([
        axios.get(`${API}/venues/${venueId}/concerts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/venues/${venueId}/jams`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setVenueEvents({
        concerts: concertsRes.data,
        jams: jamsRes.data
      });
    } catch (error) {
      console.error("Error fetching venue events:", error);
      toast.error("Erreur lors du chargement des événements");
    } finally {
      setLoadingVenueEvents(false);
    }
  };

  const refreshVenueEvents = async () => {
    if (!selectedVenue) return;
    
    try {
      const [concertsRes, jamsRes] = await Promise.all([
        axios.get(`${API}/venues/${selectedVenue.id}/concerts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/venues/${selectedVenue.id}/jams`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setVenueEvents({
        concerts: concertsRes.data,
        jams: jamsRes.data
      });
    } catch (error) {
      console.error("Error refreshing venue events:", error);
    }
  };
  
  // Fonction pour fermer la modale et nettoyer les données
  const closeVenueEventsModal = () => {
    setShowVenueEventsModal(false);
    // Vider les événements quand on ferme la modale
    setTimeout(() => {
      setVenueEvents({ concerts: [], jams: [] });
      setSelectedVenue(null);
    }, 300); // Petit délai pour l'animation de fermeture
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API}/friends/accept/${requestId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Demande acceptée!");
      
      // ⭐ Check for new badges after accepting friend
      triggerBadgeCheck();
      
      fetchFriends();
      fetchNotifications();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const removeFriend = async (friendUserId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet ami ?")) {
      return;
    }
    try {
      await axios.delete(`${API}/friends/${friendUserId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Ami supprimé");
      fetchFriends();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const blockUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir bloquer cet utilisateur ? Cela supprimera aussi l'amitié.")) {
      return;
    }
    try {
      await axios.post(`${API}/users/block/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Utilisateur bloqué");
      fetchFriends();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors du blocage");
    }
  };

  const unblockUser = async (userId) => {
    try {
      await axios.delete(`${API}/users/unblock/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Utilisateur débloqué");
      fetchBlockedUsers();
    } catch (error) {
      toast.error("Erreur lors du déblocage");
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get(`${API}/users/blocked`, { headers: { Authorization: `Bearer ${token}` } });
      setBlockedUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      setBlockedUsers([]);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {/* Leaderboard */}
              <Link to="/leaderboard">
                <Button variant="ghost" className="relative">
                  <Trophy className="w-5 h-5" />
                </Button>
              </Link>

              {/* Badges */}
              <Link to="/badges">
                <Button variant="ghost" className="relative">
                  <Award className="w-5 h-5" />
                </Button>
              </Link>

              {/* Messages */}
              <Link to="/messages-improved">
                <Button variant="ghost" className="relative">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>

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
                    {profile?.profile_image ? (
                      <LazyImage 
                        src={profile.profile_image} 
                        alt={profile.pseudo} 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
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
                    <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
                      <TabsTrigger value="info" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Infos</TabsTrigger>
                      <TabsTrigger value="styles" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Styles</TabsTrigger>
                      <TabsTrigger value="solo" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Solo</TabsTrigger>
                      <TabsTrigger value="band" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Groupe</TabsTrigger>
                      <TabsTrigger value="concerts" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Concerts</TabsTrigger>
                      <TabsTrigger value="settings" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Paramètres</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Photo de profil</Label>
                        <MusicianImageUpload
                          value={profileForm.profile_image}
                          onChange={(url) => {
                            console.log('📸 Musician profile image updated:', url);
                            setProfileForm(prev => ({ ...prev, profile_image: url }));
                          }}
                          token={token}
                          photoType="profile"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pseudo</Label>
                          <Input value={profileForm.pseudo} onChange={(e) => setProfileForm({ ...profileForm, pseudo: e.target.value })} className="bg-black/20 border-white/10" data-testid="profile-pseudo" />
                        </div>
                        <div className="space-y-2">
                          <Label>Âge</Label>
                          <Select value={profileForm.age?.toString() || ""} onValueChange={(value) => setProfileForm({ ...profileForm, age: parseInt(value) })}>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue placeholder="Sélectionnez votre âge" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10 max-h-[300px]">
                              {Array.from({ length: 91 }, (_, i) => i + 10).map((age) => (
                                <SelectItem key={age} value={age.toString()}>
                                  {age} ans
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <CityAutocomplete
                            value={profileForm.city}
                            onSelect={(cityData) => {
                              setProfileForm({
                                ...profileForm,
                                city: cityData.city,
                                department: cityData.department,
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
                                      department: cityData.department,
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
                          <Label>Niveau d'expérience</Label>
                          <Select value={profileForm.experience_level || ""} onValueChange={(value) => setProfileForm({ ...profileForm, experience_level: value })}>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue placeholder="Sélectionnez votre niveau" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10">
                              <SelectItem value="Débutant">🌱 Débutant</SelectItem>
                              <SelectItem value="Je fais ce que je peux">🎵 Je fais ce que je peux</SelectItem>
                              <SelectItem value="Je gère ça va">🎸 Je gère ça va</SelectItem>
                              <SelectItem value="Je maîtrise bien">⭐ Je maîtrise bien</SelectItem>
                              <SelectItem value="Maestro">👑 Maestro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Département</Label>
                          <Select value={profileForm.department} onValueChange={(value) => setProfileForm({ ...profileForm, department: value })}>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue placeholder="Sélectionnez un département" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10 max-h-[300px]">
                              {DEPARTEMENTS_FRANCE.map((dept) => (
                                <SelectItem key={dept.code} value={dept.code}>
                                  {dept.code} - {dept.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Région</Label>
                          <Select value={profileForm.region} onValueChange={(value) => setProfileForm({ ...profileForm, region: value })}>
                            <SelectTrigger className="bg-black/20 border-white/10">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Facebook</Label>
                          <Input value={profileForm.facebook} onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })} className="bg-black/20 border-white/10" placeholder="https://facebook.com/..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Instagram</Label>
                          <Input value={profileForm.instagram} onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })} className="bg-black/20 border-white/10" placeholder="https://instagram.com/..." />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>YouTube</Label>
                          <Input value={profileForm.youtube} onChange={(e) => setProfileForm({ ...profileForm, youtube: e.target.value })} className="bg-black/20 border-white/10" placeholder="https://youtube.com/..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Bandcamp</Label>
                          <Input value={profileForm.bandcamp} onChange={(e) => setProfileForm({ ...profileForm, bandcamp: e.target.value })} className="bg-black/20 border-white/10" placeholder="https://bandcamp.com/..." />
                        </div>
                      </div>

                      {/* Aperçu des liens */}
                      <div className="p-4 bg-black/10 rounded-lg border border-white/10">
                        <Label className="text-sm mb-2 block">Aperçu de vos liens :</Label>
                        <SocialLinks 
                          facebook={profileForm.facebook}
                          instagram={profileForm.instagram}
                          youtube={profileForm.youtube}
                          bandcamp={profileForm.bandcamp}
                        />
                        {!profileForm.facebook && !profileForm.instagram && !profileForm.youtube && !profileForm.bandcamp && (
                          <p className="text-xs text-muted-foreground">Aucun lien ajouté</p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Onglet Styles musicaux */}
                    <TabsContent value="styles" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-lg font-semibold mb-3 block">Styles musicaux</Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Sélectionnez les styles musicaux que vous pratiquez
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {MUSIC_STYLES_LIST.map((style) => (
                            <div key={style} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`style-${style}`}
                                checked={profileForm.music_styles?.includes(style) || false}
                                onChange={(e) => {
                                  const currentStyles = profileForm.music_styles || [];
                                  if (e.target.checked) {
                                    // Ajouter le style
                                    setProfileForm({
                                      ...profileForm,
                                      music_styles: [...currentStyles, style]
                                    });
                                  } else {
                                    // Retirer le style
                                    setProfileForm({
                                      ...profileForm,
                                      music_styles: currentStyles.filter(s => s !== style)
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                              />
                              <Label 
                                htmlFor={`style-${style}`} 
                                className="text-sm font-normal cursor-pointer select-none"
                              >
                                {style}
                              </Label>
                            </div>
                          ))}
                        </div>

                        {/* Affichage des styles sélectionnés */}
                        {profileForm.music_styles && profileForm.music_styles.length > 0 && (
                          <div className="mt-4 p-4 glassmorphism rounded-xl">
                            <p className="text-sm font-semibold mb-2">Styles sélectionnés ({profileForm.music_styles.length}) :</p>
                            <div className="flex flex-wrap gap-2">
                              {profileForm.music_styles.map((style, index) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                                >
                                  {style}
                                  <button
                                    onClick={() => {
                                      setProfileForm({
                                        ...profileForm,
                                        music_styles: profileForm.music_styles.filter(s => s !== style)
                                      });
                                    }}
                                    className="hover:bg-primary/30 rounded-full"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Onglet Solo */}
                    <TabsContent value="solo" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Switch 
                            checked={soloProfile.has_solo} 
                            onCheckedChange={(checked) => setSoloProfile({ ...soloProfile, has_solo: checked })}
                          />
                          <Label>Je joue aussi en solo</Label>
                        </div>

                        {soloProfile.has_solo && (
                          <div className="space-y-4 p-4 glassmorphism rounded-xl">
                            {/* Type de performance */}
                            <div className="space-y-2">
                              <Label>Type de performance</Label>
                              <Select 
                                value={soloProfile.band_type} 
                                onValueChange={(value) => setSoloProfile({ ...soloProfile, band_type: value })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/10">
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-white/10">
                                  <SelectItem value="Solo acoustique">Solo acoustique</SelectItem>
                                  <SelectItem value="Solo électro acoustique">Solo électro acoustique</SelectItem>
                                  <SelectItem value="Solo avec boucles">Solo avec boucles</SelectItem>
                                  <SelectItem value="DJ Set">DJ Set</SelectItem>
                                  <SelectItem value="Autre">Autre</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Type de répertoire */}
                            <div className="space-y-2">
                              <Label>Type de répertoire</Label>
                              <Select 
                                value={soloProfile.repertoire_type} 
                                onValueChange={(value) => setSoloProfile({ ...soloProfile, repertoire_type: value })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/10">
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-white/10">
                                  {REPERTOIRE_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Si Compos + Reprises, afficher les détails */}
                            {soloProfile.repertoire_type === "Compos + Reprises" && (
                              <div className="grid grid-cols-2 gap-4 p-4 bg-black/10 rounded-lg border border-white/10">
                                <div className="space-y-2">
                                  <Label>Nombre de compos</Label>
                                  <Select 
                                    value={soloProfile.compos_count?.toString() || "0"} 
                                    onValueChange={(value) => setSoloProfile({ ...soloProfile, compos_count: parseInt(value) })}
                                  >
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                      <SelectValue placeholder="0" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-white/10 max-h-[200px]">
                                      {[...Array(51)].map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Nombre de reprises</Label>
                                  <Select 
                                    value={soloProfile.reprises_count?.toString() || "0"} 
                                    onValueChange={(value) => setSoloProfile({ ...soloProfile, reprises_count: parseInt(value) })}
                                  >
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                      <SelectValue placeholder="0" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-white/10 max-h-[200px]">
                                      {[...Array(51)].map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="col-span-2 text-xs text-muted-foreground text-center">
                                  Total : {(soloProfile.compos_count || 0) + (soloProfile.reprises_count || 0)} morceaux
                                </div>
                              </div>
                            )}

                            {/* Durée du show */}
                            <div className="space-y-2">
                              <Label>Durée du show</Label>
                              <Select 
                                value={soloProfile.show_duration} 
                                onValueChange={(value) => setSoloProfile({ ...soloProfile, show_duration: value })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/10">
                                  <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-white/10 max-h-[300px]">
                                  {SHOW_DURATIONS.map((duration) => (
                                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                              <Label>Description de votre performance solo</Label>
                              <Textarea 
                                value={soloProfile.description || ""} 
                                onChange={(e) => setSoloProfile({ ...soloProfile, description: e.target.value })}
                                className="bg-black/20 border-white/10" 
                                rows={3}
                                placeholder="Décrivez votre univers musical en solo..."
                              />
                            </div>

                            {/* Switch Ingé Son */}
                            <div className="flex items-center gap-2 p-3 bg-black/10 rounded-lg border border-white/10">
                              <Switch 
                                checked={soloProfile.has_sound_engineer || false} 
                                onCheckedChange={(checked) => setSoloProfile({ ...soloProfile, has_sound_engineer: checked })}
                              />
                              <Label className="cursor-pointer">Je possède mon propre ingénieur son</Label>
                            </div>

                            {/* Styles musicaux */}
                            <div className="space-y-2">
                              <Label>Styles musicaux</Label>
                              <div className="grid grid-cols-2 gap-3 p-4 bg-black/10 rounded-lg max-h-[200px] overflow-y-auto">
                                {MUSIC_STYLES_LIST.map((style) => (
                                  <div key={style} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`solo-style-${style}`}
                                      checked={soloProfile.music_styles?.includes(style) || false}
                                      onChange={(e) => {
                                        const currentStyles = soloProfile.music_styles || [];
                                        if (e.target.checked) {
                                          setSoloProfile({ 
                                            ...soloProfile, 
                                            music_styles: [...currentStyles, style] 
                                          });
                                        } else {
                                          setSoloProfile({ 
                                            ...soloProfile, 
                                            music_styles: currentStyles.filter(s => s !== style) 
                                          });
                                        }
                                      }}
                                      className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                                    />
                                    <Label 
                                      htmlFor={`solo-style-${style}`} 
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {style}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              {soloProfile.music_styles && soloProfile.music_styles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {soloProfile.music_styles.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-1">
                                      {s}
                                      <button onClick={() => setSoloProfile({ 
                                        ...soloProfile, 
                                        music_styles: soloProfile.music_styles.filter(style => style !== s) 
                                      })}>
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Disponibilité */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={soloProfile.looking_for_concerts !== false} 
                                  onCheckedChange={(checked) => setSoloProfile({ ...soloProfile, looking_for_concerts: checked })}
                                />
                                <Label className="text-sm">🎤 Cherche des concerts en solo</Label>
                              </div>
                              <p className="text-xs text-muted-foreground ml-6 italic">
                                ⚠️ Activez cette option pour recevoir des notifications lorsqu'un établissement cherche ce type de profil ou ces styles musicaux
                              </p>
                            </div>

                            {/* Récapitulatif */}
                            {soloProfile.band_type && (
                              <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                                <h4 className="font-semibold mb-2">Votre profil solo :</h4>
                                <div className="space-y-1 text-sm">
                                  <p>• Type : {soloProfile.band_type}</p>
                                  {soloProfile.repertoire_type && <p>• Répertoire : {soloProfile.repertoire_type}</p>}
                                  {soloProfile.show_duration && <p>• Durée : {soloProfile.show_duration}</p>}
                                  {soloProfile.music_styles.length > 0 && (
                                    <p>• Styles : {soloProfile.music_styles.join(', ')}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Comptabilité / Méthodes de paiement Solo */}
                            <div className="space-y-4 p-4 border-2 border-primary/20 rounded-xl mt-4">
                              <h4 className="font-medium text-primary flex items-center gap-2">
                                💰 Comptabilité Solo
                              </h4>
                              
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Méthodes de paiement acceptées pour vos concerts en solo</Label>
                                
                                <div className="space-y-2">
                                  {/* Checkbox Facture */}
                                  <div className="flex items-center space-x-3 p-3 bg-black/10 rounded-lg border border-white/10">
                                    <input
                                      type="checkbox"
                                      id="solo-payment-facture"
                                      checked={soloProfile.payment_methods?.includes("facture") || false}
                                      onChange={(e) => {
                                        const currentMethods = soloProfile.payment_methods || [];
                                        if (e.target.checked) {
                                          setSoloProfile({ 
                                            ...soloProfile, 
                                            payment_methods: [...currentMethods, "facture"] 
                                          });
                                        } else {
                                          setSoloProfile({ 
                                            ...soloProfile, 
                                            payment_methods: currentMethods.filter(m => m !== "facture") 
                                          });
                                        }
                                      }}
                                      className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                                    />
                                    <Label 
                                      htmlFor="solo-payment-facture" 
                                      className="cursor-pointer flex-1"
                                    >
                                      <div className="font-medium">Facture</div>
                                      <div className="text-xs text-muted-foreground">Paiement par facture classique</div>
                                    </Label>
                                  </div>

                                  {/* Checkbox GUSO */}
                                  <div className="flex items-center space-x-3 p-3 bg-black/10 rounded-lg border border-white/10">
                                    <input
                                      type="checkbox"
                                      id="solo-payment-guso"
                                      checked={soloProfile.payment_methods?.includes("guso") || false}
                                      onChange={(e) => {
                                        const currentMethods = soloProfile.payment_methods || [];
                                        if (e.target.checked) {
                                          setSoloProfile({ 
                                            ...soloProfile, 
                                            payment_methods: [...currentMethods, "guso"] 
                                          });
                                        } else {
                                          setSoloProfile({ 
                                            ...soloProfile, 
                                            payment_methods: currentMethods.filter(m => m !== "guso") 
                                          });
                                        }
                                      }}
                                      className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                                    />
                                    <Label 
                                      htmlFor="solo-payment-guso" 
                                      className="cursor-pointer flex-1"
                                    >
                                      <div className="font-medium">GUSO</div>
                                      <div className="text-xs text-muted-foreground">Guichet Unique du Spectacle Occasionnel</div>
                                    </Label>
                                  </div>
                                </div>

                                {/* Affichage des méthodes sélectionnées */}
                                {soloProfile.payment_methods && soloProfile.payment_methods.length > 0 && (
                                  <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <p className="text-sm font-medium mb-2">✓ Méthodes acceptées :</p>
                                    <div className="flex flex-wrap gap-2">
                                      {soloProfile.payment_methods.map((method) => (
                                        <span key={method} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                          {method === "facture" ? "📄 Facture" : "🎫 GUSO"}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Onglet Groupe */}
                    <TabsContent value="band" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading text-lg">Mes Groupes</h3>
                        <Button 
                          onClick={() => handleOpenBandDialog(null)}
                          className="bg-primary hover:bg-primary/90 rounded-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter un groupe
                        </Button>
                      </div>

                      {profileForm.bands.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground glassmorphism rounded-xl">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Vous n'avez pas encore ajouté de groupe</p>
                          <p className="text-sm mt-2">Cliquez sur "Ajouter un groupe" pour commencer</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profileForm.bands.map((band, index) => (
                            <div key={index} className="glassmorphism rounded-xl p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-heading font-semibold text-lg">{band.name}</h4>
                                  {band.band_type && (
                                    <p className="text-sm text-muted-foreground">{band.band_type}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenBandDialog(index)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newBands = profileForm.bands.filter((_, i) => i !== index);
                                      setProfileForm({ ...profileForm, bands: newBands });
                                      toast.success("Groupe supprimé");
                                    }}
                                  >
                                    <X className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                {band.repertoire_type && (
                                  <div className="flex items-center gap-2">
                                    <Music className="w-4 h-4 text-primary" />
                                    <span>{band.repertoire_type}</span>
                                  </div>
                                )}
                                {band.show_duration && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-secondary" />
                                    <span>Durée du show : {band.show_duration}</span>
                                  </div>
                                )}
                                {band.members_count && (
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span>{band.members_count} membres</span>
                                  </div>
                                )}
                              </div>

                              {band.music_styles && band.music_styles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {band.music_styles.map((style, i) => (
                                    <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                      {style}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Liens sociaux */}
                              <SocialLinks 
                                facebook={band.facebook}
                                instagram={band.instagram}
                                youtube={band.youtube}
                                website={band.website}
                                bandcamp={band.bandcamp}
                                className="mt-3"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="concerts" className="space-y-4 mt-4">
                      <div className="space-y-4 p-4 border border-white/10 rounded-xl">
                        <h4 className="font-medium">Ajouter un concert</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input 
                              type="date" 
                              value={newConcert.date} 
                              onChange={(e) => setNewConcert({ ...newConcert, date: e.target.value })} 
                              className="bg-black/20 border-white/10"
                              onKeyDown={(e) => e.preventDefault()}
                              style={{ caretColor: 'transparent' }}
                            />
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

                    {/* Settings Tab - Account Management */}
                    <TabsContent value="settings" className="space-y-4 mt-4">
                      {/* Online Status Section */}
                      <OnlineStatusSelector />

                      {/* Background Sync Settings */}
                      <BackgroundSyncSettings />

                      {/* Change Password Section */}
                      <div className="space-y-4 p-4 border-2 border-primary/20 rounded-xl">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <Settings2 className="w-5 h-5" />
                          Sécurité
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Ancien mot de passe</Label>
                            <Input
                              type="password"
                              value={passwordForm.oldPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                              placeholder="Entrez votre ancien mot de passe"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>Nouveau mot de passe</Label>
                            <Input
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              placeholder="Minimum 8 caractères"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>Confirmer le nouveau mot de passe</Label>
                            <Input
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              placeholder="Confirmez le nouveau mot de passe"
                              className="mt-1"
                            />
                          </div>
                          
                          <Button
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            className="rounded-full"
                          >
                            {changingPassword ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Modification...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Changer le mot de passe
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

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
                                    <li>• Vos candidatures seront perdues</li>
                                    <li>• Vos messages seront effacés</li>
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
                    </TabsContent>
                  </Tabs>

                  <Button onClick={handleSaveProfile} className="w-full mt-4 bg-primary hover:bg-primary/90 rounded-full" data-testid="save-profile-btn">
                    Sauvegarder
                  </Button>
                </DialogContent>
              </Dialog>

              {/* Dialog de gestion de groupe */}
              <Dialog open={showBandDialog} onOpenChange={setShowBandDialog}>
                <DialogContent className="glassmorphism border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">
                      {editingBandIndex !== null ? "Modifier le groupe" : "Ajouter un groupe"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    {/* Nom du groupe */}
                    <div className="space-y-2">
                      <Label>Nom du groupe *</Label>
                      <Input 
                        value={currentBand.name} 
                        onChange={(e) => setCurrentBand({ ...currentBand, name: e.target.value })}
                        className="bg-black/20 border-white/10"
                        placeholder="Ex: The Rolling Stones"
                      />
                    </div>

                    {/* Photo de couverture */}
                    <div className="space-y-2">
                      <Label>Photo de couverture du groupe</Label>
                      <MusicianImageUpload
                        value={currentBand.photo || ""}
                        onChange={(url) => {
                          console.log('📸 Band cover image updated:', url);
                          setCurrentBand(prev => ({ ...prev, photo: url }));
                        }}
                        token={token}
                        photoType="cover"
                      />
                    </div>

                    {/* Switch Administrateur - uniquement lors de la création */}
                    {editingBandIndex === null && (
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                        <div className="flex items-start gap-3">
                          <Switch 
                            checked={currentBand.is_admin || false} 
                            onCheckedChange={(checked) => setCurrentBand({ ...currentBand, is_admin: checked })}
                          />
                          <div className="flex-1">
                            <Label className="cursor-pointer text-base">👑 Je suis l'administrateur de ce groupe</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              En tant qu'administrateur, vous serez le seul à pouvoir modifier les informations du groupe. 
                              Vous recevrez également les notifications des établissements et pourrez communiquer avec eux.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Affichage si édition par non-admin */}
                    {editingBandIndex !== null && currentBand.admin_id && currentBand.admin_id !== user?.id && (
                      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                        <p className="text-sm text-yellow-400">
                          ⚠️ Vous n'êtes pas l'administrateur de ce groupe. Seul l'administrateur peut modifier ces informations.
                        </p>
                      </div>
                    )}

                    {/* Quartier général */}
                    <div className="p-4 glassmorphism rounded-xl space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <Label className="text-lg font-semibold">Quartier général</Label>
                      </div>

                      <CityAutocomplete
                        value={currentBand.city}
                        onSelect={(cityData) => {
                          setCurrentBand({
                            ...currentBand,
                            city: cityData.city,
                            postal_code: cityData.postalCode,
                            department: cityData.department,
                            department_name: cityData.departmentName,
                            region: cityData.region
                          });
                        }}
                        label="Ville du groupe"
                        placeholder="Ex: Narbonne"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Département</Label>
                          <Input
                            value={currentBand.department_name ? `${currentBand.department_name} (${currentBand.department})` : ''}
                            disabled
                            className="bg-black/10 border-white/10 text-muted-foreground"
                            placeholder="Auto-rempli"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Région</Label>
                          <Input
                            value={currentBand.region || ''}
                            disabled
                            className="bg-black/10 border-white/10 text-muted-foreground"
                            placeholder="Auto-rempli"
                          />
                        </div>
                      </div>

                      {currentBand.city && (
                        <p className="text-xs text-primary flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          Basé à {currentBand.city}, {currentBand.department_name} ({currentBand.region})
                        </p>
                      )}
                    </div>

                    {/* Type de groupe */}
                    <div className="space-y-2">
                      <Label>Type de groupe</Label>
                      <Select 
                        value={currentBand.band_type} 
                        onValueChange={(value) => setCurrentBand({ ...currentBand, band_type: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10">
                          {BAND_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type de répertoire */}
                    <div className="space-y-2">
                      <Label>Type de répertoire</Label>
                      <Select 
                        value={currentBand.repertoire_type} 
                        onValueChange={(value) => setCurrentBand({ ...currentBand, repertoire_type: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10">
                          {REPERTOIRE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Si Compos + Reprises, afficher les détails */}
                    {currentBand.repertoire_type === "Compos + Reprises" && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-black/10 rounded-lg border border-white/10">
                        <div className="space-y-2">
                          <Label>Nombre de compos</Label>
                          <Select 
                            value={currentBand.compos_count?.toString() || "0"} 
                            onValueChange={(value) => setCurrentBand({ ...currentBand, compos_count: parseInt(value) })}
                          >
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue placeholder="0" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10 max-h-[200px]">
                              {[...Array(51)].map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Nombre de reprises</Label>
                          <Select 
                            value={currentBand.reprises_count?.toString() || "0"} 
                            onValueChange={(value) => setCurrentBand({ ...currentBand, reprises_count: parseInt(value) })}
                          >
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue placeholder="0" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10 max-h-[200px]">
                              {[...Array(51)].map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2 text-xs text-muted-foreground text-center">
                          Total : {(currentBand.compos_count || 0) + (currentBand.reprises_count || 0)} morceaux
                        </div>
                      </div>
                    )}

                    {/* Durée du show */}
                    <div className="space-y-2">
                      <Label>Durée du show</Label>
                      <Select 
                        value={currentBand.show_duration} 
                        onValueChange={(value) => setCurrentBand({ ...currentBand, show_duration: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px]">
                          {SHOW_DURATIONS.map((duration) => (
                            <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={currentBand.description || ""} 
                        onChange={(e) => setCurrentBand({ ...currentBand, description: e.target.value })}
                        className="bg-black/20 border-white/10" 
                        rows={3}
                        placeholder="Décrivez votre groupe..."
                      />
                    </div>

                    {/* Nombre de membres */}
                    <div className="space-y-2">
                      <Label>Nombre de membres</Label>
                      <Select 
                        value={currentBand.members_count?.toString() || ""} 
                        onValueChange={(value) => setCurrentBand({ ...currentBand, members_count: parseInt(value) })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez le nombre" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px]">
                          {[...Array(19)].map((_, i) => {
                            const count = i + 2; // De 2 à 20
                            return (
                              <SelectItem key={count} value={count.toString()}>
                                {count} membre{count > 1 ? 's' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Switch Ingé Son */}
                    <div className="flex items-center gap-2 p-3 bg-black/10 rounded-lg border border-white/10">
                      <Switch 
                        checked={currentBand.has_sound_engineer || false} 
                        onCheckedChange={(checked) => setCurrentBand({ ...currentBand, has_sound_engineer: checked })}
                      />
                      <Label className="cursor-pointer">Le groupe possède son propre ingénieur son</Label>
                    </div>

                    {/* Association */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 glassmorphism rounded-lg p-4">
                        <Switch 
                          checked={currentBand.is_association || false} 
                          onCheckedChange={(checked) => setCurrentBand({ ...currentBand, is_association: checked, association_name: checked ? currentBand.association_name : "" })}
                        />
                        <Label className="cursor-pointer">Mon groupe fait partie d'une association</Label>
                      </div>
                      
                      {currentBand.is_association && (
                        <div className="space-y-2 pl-4">
                          <Label>Nom de l'association</Label>
                          <Input 
                            value={currentBand.association_name || ""} 
                            onChange={(e) => setCurrentBand({ ...currentBand, association_name: e.target.value })}
                            placeholder="Ex: Association Musicale de Paris"
                            className="bg-black/20 border-white/10" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Label de musique */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 glassmorphism rounded-lg p-4">
                        <Switch 
                          checked={currentBand.has_label || false} 
                          onCheckedChange={(checked) => setCurrentBand({ 
                            ...currentBand, 
                            has_label: checked, 
                            label_name: checked ? currentBand.label_name : "",
                            label_city: checked ? currentBand.label_city : ""
                          })}
                        />
                        <Label className="cursor-pointer">Mon groupe a un label de musique</Label>
                      </div>
                      
                      {currentBand.has_label && (
                        <div className="space-y-3 pl-4">
                          <div className="space-y-2">
                            <Label>Nom du label</Label>
                            <Input 
                              value={currentBand.label_name || ""} 
                              onChange={(e) => setCurrentBand({ ...currentBand, label_name: e.target.value })}
                              placeholder="Ex: Universal Music France"
                              className="bg-black/20 border-white/10" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ville du label</Label>
                            <Input 
                              value={currentBand.label_city || ""} 
                              onChange={(e) => setCurrentBand({ ...currentBand, label_city: e.target.value })}
                              placeholder="Ex: Paris"
                              className="bg-black/20 border-white/10" 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Styles musicaux */}
                    <div className="space-y-2">
                      <Label>Styles musicaux du groupe</Label>
                      <div className="grid grid-cols-2 gap-3 p-4 glassmorphism rounded-lg max-h-[200px] overflow-y-auto">
                        {MUSIC_STYLES_LIST.map((style) => (
                          <div key={style} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`band-style-${style}`}
                              checked={currentBand.music_styles?.includes(style) || false}
                              onChange={(e) => {
                                const currentStyles = currentBand.music_styles || [];
                                if (e.target.checked) {
                                  setCurrentBand({ 
                                    ...currentBand, 
                                    music_styles: [...currentStyles, style] 
                                  });
                                } else {
                                  setCurrentBand({ 
                                    ...currentBand, 
                                    music_styles: currentStyles.filter(s => s !== style) 
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                            />
                            <Label 
                              htmlFor={`band-style-${style}`} 
                              className="text-sm font-normal cursor-pointer"
                            >
                              {style}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {currentBand.music_styles && currentBand.music_styles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {currentBand.music_styles.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-1">
                              {s}
                              <button onClick={() => setCurrentBand({ 
                                ...currentBand, 
                                music_styles: currentBand.music_styles.filter((_, idx) => idx !== i) 
                              })}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Disponibilités */}
                    <div className="space-y-3">
                      <Label>Disponibilités</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={currentBand.looking_for_concerts !== false} 
                            onCheckedChange={(checked) => setCurrentBand({ ...currentBand, looking_for_concerts: checked })}
                          />
                          <Label className="text-sm">🎤 Cherche des concerts</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6 italic">
                          ⚠️ Activez cette option pour recevoir des notifications lorsqu'un établissement cherche ce type de profil ou ces styles musicaux
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={currentBand.looking_for_members || false} 
                            onCheckedChange={(checked) => setCurrentBand({ ...currentBand, looking_for_members: checked, looking_for_profiles: checked ? currentBand.looking_for_profiles : [] })}
                          />
                          <Label className="text-sm">👥 Cherche des membres</Label>
                        </div>

                        {currentBand.looking_for_members && (
                          <div className="space-y-2 pl-6 border-l-2 border-primary/30">
                            <Label className="text-sm">Profils recherchés</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {['Chanteur(se)', 'Guitariste', 'Bassiste', 'Batteur', 'Claviériste', 'Autre'].map((profile) => (
                                <div key={profile} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`profile-${profile}`}
                                    checked={currentBand.looking_for_profiles?.includes(profile) || false}
                                    onChange={(e) => {
                                      const currentProfiles = currentBand.looking_for_profiles || [];
                                      if (e.target.checked) {
                                        setCurrentBand({ 
                                          ...currentBand, 
                                          looking_for_profiles: [...currentProfiles, profile] 
                                        });
                                      } else {
                                        setCurrentBand({ 
                                          ...currentBand, 
                                          looking_for_profiles: currentProfiles.filter(p => p !== profile) 
                                        });
                                      }
                                    }}
                                    className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                                  />
                                  <Label 
                                    htmlFor={`profile-${profile}`} 
                                    className="text-sm font-normal cursor-pointer select-none"
                                  >
                                    {profile}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {currentBand.looking_for_profiles && currentBand.looking_for_profiles.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {currentBand.looking_for_profiles.map((p, i) => (
                                  <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs flex items-center gap-1">
                                    {p}
                                    <button onClick={() => setCurrentBand({ 
                                      ...currentBand, 
                                      looking_for_profiles: currentBand.looking_for_profiles.filter(prof => prof !== p) 
                                    })}>
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={currentBand.is_public !== false} 
                          onCheckedChange={(checked) => setCurrentBand({ ...currentBand, is_public: checked })}
                        />
                        <Label className="text-sm">👁️ Visible dans le répertoire public</Label>
                      </div>
                    </div>

                    {/* Réseaux sociaux */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Facebook</Label>
                        <Input 
                          value={currentBand.facebook || ""} 
                          onChange={(e) => setCurrentBand({ ...currentBand, facebook: e.target.value })}
                          className="bg-black/20 border-white/10"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input 
                          value={currentBand.instagram || ""} 
                          onChange={(e) => setCurrentBand({ ...currentBand, instagram: e.target.value })}
                          className="bg-black/20 border-white/10"
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>YouTube</Label>
                        <Input 
                          value={currentBand.youtube || ""} 
                          onChange={(e) => setCurrentBand({ ...currentBand, youtube: e.target.value })}
                          className="bg-black/20 border-white/10"
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bandcamp</Label>
                        <Input 
                          value={currentBand.bandcamp || ""} 
                          onChange={(e) => setCurrentBand({ ...currentBand, bandcamp: e.target.value })}
                          className="bg-black/20 border-white/10"
                          placeholder="https://bandcamp.com/..."
                        />
                      </div>
                    </div>

                    {/* Aperçu des liens */}
                    <div className="p-3 bg-black/10 rounded-lg border border-white/10">
                      <Label className="text-xs mb-2 block">Aperçu de vos liens :</Label>
                      <SocialLinks 
                        facebook={currentBand.facebook}
                        instagram={currentBand.instagram}
                        youtube={currentBand.youtube}
                        bandcamp={currentBand.bandcamp}
                      />
                      {!currentBand.facebook && !currentBand.instagram && !currentBand.youtube && !currentBand.bandcamp && (
                        <p className="text-xs text-muted-foreground">Aucun lien ajouté</p>
                      )}
                    </div>

                    {/* Comptabilité / Méthodes de paiement Groupe */}
                    <div className="space-y-4 p-4 border-2 border-primary/20 rounded-xl">
                      <h4 className="font-medium text-primary flex items-center gap-2">
                        💰 Comptabilité
                      </h4>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Méthodes de paiement acceptées pour ce groupe</Label>
                        
                        <div className="space-y-2">
                          {/* Checkbox Facture */}
                          <div className="flex items-center space-x-3 p-3 bg-black/10 rounded-lg border border-white/10">
                            <input
                              type="checkbox"
                              id="band-payment-facture"
                              checked={currentBand.payment_methods?.includes("facture") || false}
                              onChange={(e) => {
                                const currentMethods = currentBand.payment_methods || [];
                                if (e.target.checked) {
                                  setCurrentBand({ 
                                    ...currentBand, 
                                    payment_methods: [...currentMethods, "facture"] 
                                  });
                                } else {
                                  setCurrentBand({ 
                                    ...currentBand, 
                                    payment_methods: currentMethods.filter(m => m !== "facture") 
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                            />
                            <Label 
                              htmlFor="band-payment-facture" 
                              className="cursor-pointer flex-1"
                            >
                              <div className="font-medium">Facture</div>
                              <div className="text-xs text-muted-foreground">Paiement par facture classique</div>
                            </Label>
                          </div>

                          {/* Checkbox GUSO */}
                          <div className="flex items-center space-x-3 p-3 bg-black/10 rounded-lg border border-white/10">
                            <input
                              type="checkbox"
                              id="band-payment-guso"
                              checked={currentBand.payment_methods?.includes("guso") || false}
                              onChange={(e) => {
                                const currentMethods = currentBand.payment_methods || [];
                                if (e.target.checked) {
                                  setCurrentBand({ 
                                    ...currentBand, 
                                    payment_methods: [...currentMethods, "guso"] 
                                  });
                                } else {
                                  setCurrentBand({ 
                                    ...currentBand, 
                                    payment_methods: currentMethods.filter(m => m !== "guso") 
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary bg-black/20 border-white/10 rounded focus:ring-primary focus:ring-2"
                            />
                            <Label 
                              htmlFor="band-payment-guso" 
                              className="cursor-pointer flex-1"
                            >
                              <div className="font-medium">GUSO</div>
                              <div className="text-xs text-muted-foreground">Guichet Unique du Spectacle Occasionnel</div>
                            </Label>
                          </div>
                        </div>

                        {/* Affichage des méthodes sélectionnées */}
                        {currentBand.payment_methods && currentBand.payment_methods.length > 0 && (
                          <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm font-medium mb-2">✓ Méthodes acceptées :</p>
                            <div className="flex flex-wrap gap-2">
                              {currentBand.payment_methods.map((method) => (
                                <span key={method} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                  {method === "facture" ? "📄 Facture" : "🎫 GUSO"}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleSaveBand}
                        className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                      >
                        {editingBandIndex !== null ? "Mettre à jour" : "Ajouter"}
                      </Button>
                      <Button
                        onClick={() => setShowBandDialog(false)}
                        variant="outline"
                        className="flex-1 rounded-full border-white/20"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Profile Dropdown - Desktop */}
              <Button variant="ghost" onClick={logout} className="text-destructive hover:text-destructive/80" data-testid="logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Navigation - Hamburger Menu */}
            <div className="flex md:hidden items-center gap-2">
              {/* Notifications visible on mobile */}
              <Dialog onOpenChange={(open) => {
                if (open && unreadCount > 0) {
                  markAllRead();
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-xs flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/10 max-w-[95vw] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle className="font-heading">Notifications</DialogTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={markAllRead}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            if (!window.confirm("Effacer toutes les notifications ?")) return;
                            try {
                              await axios.delete(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
                              toast.success("Notifications effacées");
                              fetchNotifications();
                            } catch (error) {
                              toast.error("Erreur");
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
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
                        <p className="text-muted-foreground text-xs mt-1">{new Date(notif.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    ))}
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
                    <Link to="/leaderboard" className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="font-medium">Trophées</span>
                    </Link>

                    <Link to="/badges" className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <Award className="w-5 h-5 text-primary" />
                      <span className="font-medium">Badges</span>
                    </Link>

                    <Link to="/messages-improved" className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span className="font-medium">Messages</span>
                    </Link>

                    <div className="border-t border-white/10 my-2"></div>

                    {/* Profile Edit Button - Opens the existing profile dialog */}
                    <button 
                      onClick={() => {
                        // Close the sheet first, then open the profile dialog
                        document.querySelector('[data-radix-collection-item]')?.click(); // Close sheet
                        setTimeout(() => setEditingProfile(true), 100);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors text-left w-full"
                    >
                      <User className="w-5 h-5 text-primary" />
                      <span className="font-medium">Mon Profil</span>
                    </button>

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
            <h3 className="font-heading font-semibold mb-4">Demandes d'ami ({friendRequests.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendRequests.map(req => (
                <div key={req.id} className="p-4 bg-muted/30 border border-white/10 rounded-xl hover:bg-muted/50 transition-all">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {req.from_user_image ? (
                      <LazyImage 
                        src={req.from_user_image} 
                        alt={req.from_user_name} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate">{req.from_user_name}</h4>
                      {req.from_user_city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.from_user_city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(req.from_user_instruments || req.from_user_styles) && (
                    <div className="space-y-2 mb-3 text-sm">
                      {req.from_user_instruments && (
                        <div className="flex items-center gap-2">
                          <Guitar className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground truncate">
                            {req.from_user_instruments}
                          </span>
                        </div>
                      )}
                      {req.from_user_styles && (
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground truncate">
                            {req.from_user_styles}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => acceptFriendRequest(req.id)} 
                      className="flex-1 bg-primary hover:bg-primary/80 gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Accepter
                    </Button>
                    {req.from_profile_id && req.from_user_role && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Navigate to profile based on role
                          const profilePath = req.from_user_role === "musician" ? "musician" 
                            : req.from_user_role === "venue" ? "venue" 
                            : "melomane";
                          window.location.href = `/${profilePath}/${req.from_profile_id}`;
                        }}
                        className="border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 mb-6 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent min-h-[44px] items-center">
            <TabsTrigger value="map" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Carte</TabsTrigger>
            <TabsTrigger value="candidatures" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Candidatures</TabsTrigger>
            <TabsTrigger value="my-applications" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Mes Candidatures</TabsTrigger>
            <TabsTrigger value="participations" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Mes Participations ({participations.length})</TabsTrigger>
            <TabsTrigger value="musicians" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Musiciens</TabsTrigger>
            <TabsTrigger value="venues" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Établissements</TabsTrigger>
            <TabsTrigger value="friends" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Amis ({friends.length})</TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Connexions</TabsTrigger>
            <TabsTrigger value="bands" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">Groupes</TabsTrigger>
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
              <div className="h-[500px] rounded-2xl overflow-hidden neon-border relative z-0">
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
                  {console.log('[MusicianDashboard] Rendering venue markers. Total venues:', venues.length, 'With coordinates:', venues.filter(v => v.latitude && v.longitude).length) || null}
                  {venues && venues.length > 0 && venues.map((venue) => {
                    if (!venue.latitude || !venue.longitude) {
                      console.warn('[MusicianDashboard] Venue missing coordinates:', venue.name, venue.id);
                      return null;
                    }
                    const isNearby = nearbyVenues.some(nv => nv.id === venue.id);
                    console.log(`[MusicianDashboard] Rendering marker for "${venue.name}" at [${venue.latitude}, ${venue.longitude}]`);
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
                ) : loadingError ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6 glassmorphism rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                      <X className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="font-heading font-semibold text-xl mb-2">Erreur de chargement</h3>
                    <p className="text-muted-foreground mb-4">Impossible de charger les établissements. Veuillez réessayer.</p>
                    <Button 
                      onClick={() => { setLoading(true); setLoadingError(false); fetchData(); }} 
                      className="bg-primary hover:bg-primary/90 rounded-full"
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {/* Filtrer pour n'afficher que les établissements dans le rayon si géolocalisation active */}
                    {(() => {
                      const filteredVenues = (geoPosition && nearbyVenues.length > 0 ? nearbyVenues : venues)
                        .filter(venue => {
                          // Filtrer par ville si recherche active
                          if (searchCity && searchCity.trim() !== '') {
                            const searchLower = searchCity.toLowerCase().trim();
                            const cityMatch = venue.city?.toLowerCase().includes(searchLower);
                            const nameMatch = venue.name?.toLowerCase().includes(searchLower);
                            const postalMatch = venue.postal_code?.includes(searchCity.trim());
                            return cityMatch || nameMatch || postalMatch;
                          }
                          return true; // Afficher tous si pas de recherche
                        });
                      
                      if (filteredVenues.length === 0 && searchCity.trim() !== '') {
                        return (
                          <div className="text-center py-12 text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">Aucun résultat pour "{searchCity}"</p>
                            <p className="text-sm">Essayez une autre ville ou effacez la recherche</p>
                          </div>
                        );
                      }
                      
                      return filteredVenues.map((venue) => {
                        const isNearby = nearbyVenues.some(nv => nv.id === venue.id);
                        return (
                          <Link key={venue.id} to={`/venue/${venue.id}`} className="block" data-testid={`venue-card-${venue.id}`}>
                            <div className={`card-venue p-5 group ${isNearby ? 'border border-primary/30' : ''}`}>
                              <div className="flex items-start gap-4">
                                {venue.profile_image && (
                                  <LazyImage 
                                    src={venue.profile_image} 
                                    alt={venue.name} 
                                    className="w-16 h-16 rounded-xl object-cover" 
                                  />
                                )}
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
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Candidatures Tab */}
          <TabsContent value="candidatures">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-2xl mb-6 flex items-center gap-2">
                <Search className="w-6 h-6 text-primary" />
                Recherche de Candidatures
              </h2>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Date de début</Label>
                  <Input 
                    type="date" 
                    value={candidatureFilters.dateFrom}
                    onChange={(e) => setCandidatureFilters({...candidatureFilters, dateFrom: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <Input 
                    type="date" 
                    value={candidatureFilters.dateTo}
                    onChange={(e) => setCandidatureFilters({...candidatureFilters, dateTo: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Région</Label>
                  <Select 
                    value={candidatureFilters.region || undefined}
                    onValueChange={(value) => setCandidatureFilters({...candidatureFilters, region: value, department: ''})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS_FRANCE.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Département</Label>
                  <Select 
                    value={candidatureFilters.department || undefined}
                    onValueChange={(value) => setCandidatureFilters({...candidatureFilters, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les départements" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTEMENTS_FRANCE.map(dept => (
                        <SelectItem key={dept.code} value={dept.code}>
                          {dept.code} - {dept.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Style musical</Label>
                  <Select 
                    value={candidatureFilters.musicStyle || undefined}
                    onValueChange={(value) => setCandidatureFilters({...candidatureFilters, musicStyle: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les styles" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSIC_STYLES_LIST.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <Button 
                  onClick={searchCandidatures}
                  disabled={loadingCandidatures}
                  className="rounded-full"
                >
                  {loadingCandidatures ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setCandidatureFilters({
                      dateFrom: '',
                      dateTo: '',
                      region: '',
                      department: '',
                      musicStyle: ''
                    });
                    setCandidatures([]);
                  }}
                  className="rounded-full"
                >
                  Réinitialiser
                </Button>
              </div>

              {/* Results */}
              {loadingCandidatures ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Recherche en cours...</p>
                </div>
              ) : candidatures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune candidature trouvée</p>
                  <p className="text-sm mt-2">Ajustez vos filtres et lancez une recherche</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{candidatures.length} résultat(s) trouvé(s)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidatures.map((slot) => (
                      <div key={slot.id} className="card-venue p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-heading font-semibold text-lg">{slot.venue_name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {slot.venue_city}
                              {slot.venue_department && ` (${slot.venue_department})`}
                            </p>
                            {slot.venue_region && (
                              <p className="text-xs text-muted-foreground">{slot.venue_region}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span>{slot.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                        </div>

                        {slot.music_styles && slot.music_styles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {slot.music_styles.map((style, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                {style}
                              </span>
                            ))}
                          </div>
                        )}

                        {slot.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{slot.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {slot.applications_count || 0} candidature(s)
                            </span>
                            {slot.accepted_bands_count > 0 && (
                              <span className="flex items-center gap-1 text-green-400 mt-1">
                                <Check className="w-3 h-3" />
                                {slot.accepted_bands_count} acceptée(s)
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => applyToSlot(slot.id)}
                            className="rounded-full"
                            disabled={!slot.is_open}
                          >
                            {slot.is_open ? 'Candidater' : 'Fermé'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="my-applications">
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-2xl flex items-center gap-2">
                  <Send className="w-6 h-6 text-primary" />
                  Mes Candidatures
                </h2>
                <Button 
                  onClick={fetchMyApplications}
                  variant="outline"
                  className="rounded-full"
                  disabled={loadingMyApplications}
                >
                  {loadingMyApplications ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    "Actualiser"
                  )}
                </Button>
              </div>

              {loadingMyApplications ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Chargement de vos candidatures...</p>
                </div>
              ) : myApplications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Vous n'avez pas encore envoyé de candidature</p>
                  <p className="text-sm mt-2">Consultez l'onglet "Candidatures" pour postuler</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{myApplications.length} candidature(s) envoyée(s)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myApplications.map((app) => (
                      <div key={app.id} className="card-venue p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-heading font-semibold text-lg">{app.slot_venue_name || "Établissement"}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {app.slot_venue_city || "Ville"}
                            </p>
                          </div>
                          <div>
                            {app.status === "pending" && (
                              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                En attente
                              </span>
                            )}
                            {app.status === "accepted" && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Acceptée
                              </span>
                            )}
                            {app.status === "rejected" && (
                              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Refusée
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span>{app.slot_date || "Date"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{app.slot_start_time || ""} - {app.slot_end_time || ""}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Music className="w-4 h-4 text-primary" />
                            <span className="font-medium">{app.band_name}</span>
                          </div>
                        </div>

                        {app.message && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{app.message}</p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="text-xs text-muted-foreground">
                            Envoyée le {new Date(app.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          {app.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelApplication(app.id)}
                              className="rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Participations Tab - Copié du MelomaneDashboard */}
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


          <TabsContent value="musicians">
            <div className="space-y-6">
              {/* Filtres de localisation */}
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-xl mb-4">Filtrer par localisation</h2>
                
                <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
                  // Réinitialiser les sélections quand on change d'onglet
                  setSelectedRegion(null);
                  setSelectedDepartment(null);
                }}>
                  <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
                    <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                      Tous ({musicians.length})
                    </TabsTrigger>
                    <TabsTrigger value="france" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                      France ({musicians.filter(m => !m.country || m.country === 'France').length})
                    </TabsTrigger>
                    <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                      Par Région
                    </TabsTrigger>
                    <TabsTrigger value="department" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                      Par Département
                    </TabsTrigger>
                    <TabsTrigger value="country" className="rounded-full">
                      Autres Pays
                    </TabsTrigger>
                  </TabsList>

                  {/* Tous les musiciens */}
                  <TabsContent value="all" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {musicians.filter(m => m.user_id !== user?.id).map((musician) => (
                        <MusicianCard 
                          key={musician.id} 
                          musician={musician} 
                          onSendFriendRequest={sendFriendRequest}
                          onCancelRequest={cancelFriendRequest}
                          sentRequests={sentRequests}
                          friends={friends}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  {/* France */}
                  <TabsContent value="france" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {musicians
                        .filter(m => m.user_id !== user?.id && (!m.country || m.country === 'France'))
                        .map((musician) => (
                          <MusicianCard 
                          key={musician.id} 
                          musician={musician} 
                          onSendFriendRequest={sendFriendRequest}
                          onCancelRequest={cancelFriendRequest}
                          sentRequests={sentRequests}
                          friends={friends}
                        />
                        ))}
                    </div>
                  </TabsContent>

                  {/* Par Région */}
                  <TabsContent value="region" className="mt-6">
                    {(() => {
                      // Compter les musiciens par région
                      const musiciansByRegion = {};
                      
                      // Initialiser TOUTES les régions avec 0 musicien
                      REGIONS_FRANCE.forEach(region => {
                        musiciansByRegion[region] = [];
                      });
                      
                      // Ajouter les musiciens dans leurs régions respectives
                      musicians.filter(m => m.user_id !== user?.id && (!m.country || m.country === 'France')).forEach(m => {
                        if (m.region && musiciansByRegion[m.region]) {
                          musiciansByRegion[m.region].push(m);
                        }
                      });
                      
                      // Si une région est sélectionnée, afficher les profils
                      if (selectedRegion) {
                        return (
                          <div>
                            <Button 
                              onClick={() => setSelectedRegion(null)} 
                              variant="outline" 
                              className="mb-4 rounded-full gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" /> Retour aux régions
                            </Button>
                            <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                              <MapPin className="w-6 h-6 text-primary" />
                              {selectedRegion} ({musiciansByRegion[selectedRegion]?.length || 0} musicien{(musiciansByRegion[selectedRegion]?.length || 0) > 1 ? 's' : ''})
                            </h3>
                            {musiciansByRegion[selectedRegion]?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {musiciansByRegion[selectedRegion].map((musician) => (
                                  <MusicianCard 
                          key={musician.id} 
                          musician={musician} 
                          onSendFriendRequest={sendFriendRequest}
                          onCancelRequest={cancelFriendRequest}
                          sentRequests={sentRequests}
                          friends={friends}
                        />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Aucun musicien dans cette région pour le moment</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Sinon, afficher TOUTES les régions de France
                      return (
                        <div>
                          <h3 className="font-heading font-semibold text-lg mb-4">
                            Toutes les régions de France
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {REGIONS_FRANCE.map(region => {
                              const count = musiciansByRegion[region]?.length || 0;
                              return (
                                <Button
                                  key={region}
                                  onClick={() => setSelectedRegion(region)}
                                  variant="outline"
                                  className={`h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all ${
                                    count > 0 
                                      ? 'hover:bg-primary/10 hover:border-primary' 
                                      : 'opacity-50 hover:bg-muted/10'
                                  }`}
                                >
                                  <MapPin className={`w-5 h-5 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <div className="text-center">
                                    <div className="font-semibold text-sm">{region}</div>
                                    <div className={`text-xs mt-1 ${count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                      {count} musicien{count > 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>

                  {/* Par Département */}
                  <TabsContent value="department" className="mt-6">
                    {(() => {
                      // Compter les musiciens par département
                      const musiciansByDepartment = {};
                      
                      // Initialiser TOUS les départements avec 0 musicien
                      DEPARTEMENTS_FRANCE.forEach(dept => {
                        musiciansByDepartment[dept.code] = {
                          nom: dept.nom,
                          musicians: []
                        };
                      });
                      
                      // Ajouter les musiciens dans leurs départements respectifs
                      musicians.filter(m => m.user_id !== user?.id && (!m.country || m.country === 'France')).forEach(m => {
                        if (m.department && musiciansByDepartment[m.department]) {
                          musiciansByDepartment[m.department].musicians.push(m);
                        }
                      });
                      
                      // Si un département est sélectionné, afficher les profils
                      if (selectedDepartment) {
                        const deptData = musiciansByDepartment[selectedDepartment];
                        return (
                          <div>
                            <Button 
                              onClick={() => setSelectedDepartment(null)} 
                              variant="outline" 
                              className="mb-4 rounded-full gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" /> Retour aux départements
                            </Button>
                            <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                              <MapPin className="w-6 h-6 text-secondary" />
                              {selectedDepartment} - {deptData?.nom} ({deptData?.musicians.length || 0} musicien{(deptData?.musicians.length || 0) > 1 ? 's' : ''})
                            </h3>
                            {deptData?.musicians.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {deptData.musicians.map((musician) => (
                                  <MusicianCard 
                          key={musician.id} 
                          musician={musician} 
                          onSendFriendRequest={sendFriendRequest}
                          onCancelRequest={cancelFriendRequest}
                          sentRequests={sentRequests}
                          friends={friends}
                        />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Aucun musicien dans ce département pour le moment</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Sinon, afficher TOUS les départements de France
                      return (
                        <div>
                          <h3 className="font-heading font-semibold text-lg mb-4">
                            Tous les départements de France
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {DEPARTEMENTS_FRANCE.map(dept => {
                              const count = musiciansByDepartment[dept.code]?.musicians.length || 0;
                              return (
                                <Button
                                  key={dept.code}
                                  onClick={() => setSelectedDepartment(dept.code)}
                                  variant="outline"
                                  className={`h-auto py-3 px-3 flex flex-col items-center gap-2 transition-all ${
                                    count > 0 
                                      ? 'hover:bg-secondary/10 hover:border-secondary' 
                                      : 'opacity-50 hover:bg-muted/10'
                                  }`}
                                >
                                  <div className={`text-lg font-bold ${count > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                                    {dept.code}
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold text-xs leading-tight">{dept.nom}</div>
                                    <div className={`text-xs mt-1 ${count > 0 ? 'text-secondary font-semibold' : 'text-muted-foreground'}`}>
                                      {count} musicien{count > 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>

                  {/* Autres Pays */}
                  <TabsContent value="country" className="mt-6">
                    {(() => {
                      const musiciansByCountry = {};
                      musicians.filter(m => m.user_id !== user?.id && m.country && m.country !== 'France').forEach(m => {
                        const country = m.country;
                        if (!musiciansByCountry[country]) musiciansByCountry[country] = [];
                        musiciansByCountry[country].push(m);
                      });
                      
                      return (
                        <div className="space-y-6">
                          {Object.keys(musiciansByCountry).sort().map(country => (
                            <div key={country}>
                              <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                {country} ({musiciansByCountry[country].length})
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {musiciansByCountry[country].map((musician) => (
                                  <MusicianCard 
                          key={musician.id} 
                          musician={musician} 
                          onSendFriendRequest={sendFriendRequest}
                          onCancelRequest={cancelFriendRequest}
                          sentRequests={sentRequests}
                          friends={friends}
                        />
                                ))}
                              </div>
                            </div>
                          ))}
                          {Object.keys(musiciansByCountry).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>Aucun musicien d'autres pays pour le moment</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="venues">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-2xl mb-6">Établissements</h2>
              
              <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
                setSelectedRegion(null);
                setSelectedDepartment(null);
              }}>
                <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
                  <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                    Tous ({venues.length})
                  </TabsTrigger>
                  <TabsTrigger value="france" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                    France ({venues.filter(v => !v.country || v.country === 'France').length})
                  </TabsTrigger>
                  <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
                    Par Région
                  </TabsTrigger>
                  <TabsTrigger value="department" className="rounded-full">
                    Par Département
                  </TabsTrigger>
                </TabsList>

                {/* Tous les établissements */}
                <TabsContent value="all" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {venues.map((venue) => (
                      <VenueCard 
                        key={venue.id} 
                        venue={venue}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                        subscriptions={subscriptions}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* France */}
                <TabsContent value="france" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {venues.filter(v => !v.country || v.country === 'France').map((venue) => (
                      <VenueCard 
                        key={venue.id} 
                        venue={venue}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                        subscriptions={subscriptions}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Par Région */}
                <TabsContent value="region" className="mt-6">
                  {(() => {
                    const venuesByRegion = {};
                    REGIONS_FRANCE.forEach(region => {
                      venuesByRegion[region] = [];
                    });
                    venues.filter(v => !v.country || v.country === 'France').forEach(v => {
                      if (v.region && venuesByRegion[v.region]) {
                        venuesByRegion[v.region].push(v);
                      }
                    });
                    
                    if (selectedRegion) {
                      return (
                        <div>
                          <Button onClick={() => setSelectedRegion(null)} variant="outline" className="mb-4 rounded-full gap-2">
                            <ArrowLeft className="w-4 h-4" /> Retour aux régions
                          </Button>
                          <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-primary" />
                            {selectedRegion} ({venuesByRegion[selectedRegion]?.length || 0} établissement{(venuesByRegion[selectedRegion]?.length || 0) > 1 ? 's' : ''})
                          </h3>
                          {venuesByRegion[selectedRegion]?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {venuesByRegion[selectedRegion].map((venue) => (
                                <VenueCard 
                        key={venue.id} 
                        venue={venue}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                        subscriptions={subscriptions}
                      />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Aucun établissement dans cette région</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <h3 className="font-heading font-semibold text-lg mb-4">Toutes les régions de France</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {REGIONS_FRANCE.map(region => {
                            const count = venuesByRegion[region]?.length || 0;
                            return (
                              <Button
                                key={region}
                                onClick={() => setSelectedRegion(region)}
                                variant="outline"
                                className={`h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all ${count > 0 ? 'hover:bg-primary/10 hover:border-primary' : 'opacity-50 hover:bg-muted/10'}`}
                              >
                                <MapPin className={`w-5 h-5 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="text-center">
                                  <div className="font-semibold text-sm">{region}</div>
                                  <div className={`text-xs mt-1 ${count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                    {count} établissement{count > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* Par Département */}
                <TabsContent value="department" className="mt-6">
                  {(() => {
                    const venuesByDepartment = {};
                    DEPARTEMENTS_FRANCE.forEach(dept => {
                      venuesByDepartment[dept.code] = {
                        nom: dept.nom,
                        venues: []
                      };
                    });
                    venues.filter(v => !v.country || v.country === 'France').forEach(v => {
                      if (v.department && venuesByDepartment[v.department]) {
                        venuesByDepartment[v.department].venues.push(v);
                      }
                    });
                    
                    if (selectedDepartment) {
                      const deptData = venuesByDepartment[selectedDepartment];
                      return (
                        <div>
                          <Button onClick={() => setSelectedDepartment(null)} variant="outline" className="mb-4 rounded-full gap-2">
                            <ArrowLeft className="w-4 h-4" /> Retour aux départements
                          </Button>
                          <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-secondary" />
                            {selectedDepartment} - {deptData?.nom} ({deptData?.venues.length || 0} établissement{(deptData?.venues.length || 0) > 1 ? 's' : ''})
                          </h3>
                          {deptData?.venues.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {deptData.venues.map((venue) => (
                                <VenueCard 
                        key={venue.id} 
                        venue={venue}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                        subscriptions={subscriptions}
                      />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Aucun établissement dans ce département</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <h3 className="font-heading font-semibold text-lg mb-4">Tous les départements de France</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {DEPARTEMENTS_FRANCE.map(dept => {
                            const count = venuesByDepartment[dept.code]?.venues.length || 0;
                            return (
                              <Button
                                key={dept.code}
                                onClick={() => setSelectedDepartment(dept.code)}
                                variant="outline"
                                className={`h-auto py-3 px-3 flex flex-col items-center gap-2 transition-all ${count > 0 ? 'hover:bg-secondary/10 hover:border-secondary' : 'opacity-50 hover:bg-muted/10'}`}
                              >
                                <div className={`text-lg font-bold ${count > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                                  {dept.code}
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-xs leading-tight">{dept.nom}</div>
                                  <div className={`text-xs mt-1 ${count > 0 ? 'text-secondary font-semibold' : 'text-muted-foreground'}`}>
                                    {count} établissement{count > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
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
                  <div key={friend.friend_id} className="card-venue p-5">
                    <div className="flex items-start gap-4 mb-3">
                      {friend.profile_image ? (
                        <LazyImage 
                          src={friend.profile_image} 
                          alt={friend.pseudo} 
                          className="w-14 h-14 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-7 h-7 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold truncate">{friend.pseudo || friend.friend_name}</h3>
                        {friend.city && <p className="text-sm text-muted-foreground truncate">{friend.city}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {friend.instruments?.slice(0, 2).map((inst, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 rounded-full border-white/20 gap-2 hover:bg-white/5"
                        onClick={() => {
                          const profilePath = friend.friend_role === "musician" ? "musician" 
                            : friend.friend_role === "venue" ? "venue" 
                            : "melomane";
                          window.location.href = `/${profilePath}/${friend.profile_id}`;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                        onClick={() => removeFriend(friend.friend_id)}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/50"
                        onClick={() => blockUser(friend.friend_id)}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Section Utilisateurs bloqués */}
            {blockedUsers.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading font-semibold text-lg mb-4">Utilisateurs bloqués ({blockedUsers.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blockedUsers.map((blocked) => (
                    <div key={blocked.user_id} className="card-venue p-5 border-2 border-red-500/20">
                      <div className="flex items-center gap-4 mb-3">
                        {blocked.profile_image ? (
                          <LazyImage 
                            src={blocked.profile_image} 
                            alt={blocked.pseudo} 
                            className="w-12 h-12 rounded-full object-cover grayscale" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Ban className="w-6 h-6 text-red-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{blocked.pseudo || blocked.name}</h4>
                          <p className="text-xs text-red-500">Bloqué</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => unblockUser(blocked.user_id)}
                      >
                        Débloquer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Vous n'êtes connecté à aucun établissement</p>
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
                        <LazyImage 
                          src={sub.venue_image} 
                          alt={sub.venue_name} 
                          className="w-14 h-14 rounded-xl object-cover" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center"><Music className="w-7 h-7 text-primary" /></div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-white">{sub.venue_name || 'Nom non disponible'}</h3>
                        <p className="text-sm text-gray-300">{sub.city || 'Ville non disponible'}</p>
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

                {/* Filtres de recherche */}
                <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Localisation */}
                  <div className="space-y-2">
                    <Label>Département</Label>
                    <Select 
                      value={bandFilters.department || undefined} 
                      onValueChange={(value) => setBandFilters({ ...bandFilters, department: value })}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Tous les départements" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10 max-h-[300px]">
                        {DEPARTEMENTS_FRANCE.map((dept) => (
                          <SelectItem key={dept.code} value={dept.code}>
                            {dept.code} - {dept.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  {/* Style musical */}
                  <div className="space-y-2">
                    <Label>Style musical</Label>
                    <Select 
                      value={bandFilters.musicStyle || undefined} 
                      onValueChange={(value) => setBandFilters({ ...bandFilters, musicStyle: value })}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Tous les styles" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10 max-h-[300px]">
                        {MUSIC_STYLES_LIST.map((style) => (
                          <SelectItem key={style} value={style}>{style}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type de groupe */}
                  <div className="space-y-2">
                    <Label>Type de groupe</Label>
                    <Select 
                      value={bandFilters.bandType || undefined} 
                      onValueChange={(value) => setBandFilters({ ...bandFilters, bandType: value })}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10 max-h-[300px]">
                        {BAND_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type de répertoire */}
                  <div className="space-y-2">
                    <Label>Type de répertoire</Label>
                    <Select 
                      value={bandFilters.repertoireType || undefined} 
                      onValueChange={(value) => setBandFilters({ ...bandFilters, repertoireType: value })}
                    >
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10">
                        {REPERTOIRE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cherche membres */}
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center gap-2 p-3 bg-black/10 rounded-lg border border-white/10 w-full">
                      <Switch 
                        checked={bandFilters.lookingForMembers} 
                        onCheckedChange={(checked) => setBandFilters({ ...bandFilters, lookingForMembers: checked })}
                      />
                      <Label className="cursor-pointer text-sm">Cherche des membres</Label>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setBandFilters({ 
                    department: "", 
                    city: "", 
                    musicStyle: "", 
                    bandType: "",
                    repertoireType: "",
                    lookingForMembers: false
                  })}
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
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
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            setSelectedBand(band);
                            setShowBandDetailsDialog(true);
                          }}
                          className="flex-1 bg-secondary hover:bg-secondary/90 rounded-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir le profil complet
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedBand(band);
                            setShowMessageDialog(true);
                          }}
                          className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
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

              {/* Band Details Dialog */}
              <Dialog open={showBandDetailsDialog} onOpenChange={setShowBandDetailsDialog}>
                <DialogContent className="bg-background border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-heading">{selectedBand?.name}</DialogTitle>
                  </DialogHeader>
                  {selectedBand && (
                    <div className="space-y-6">
                      {/* Photo */}
                      {selectedBand.photo && (
                        <LazyImage 
                          src={selectedBand.photo} 
                          alt={selectedBand.name} 
                          className="w-full h-48 object-cover rounded-lg" 
                        />
                      )}

                      {/* Infos principales */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <p className="font-semibold">{selectedBand.band_type || "Non spécifié"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Répertoire</Label>
                          <p className="font-semibold">{selectedBand.repertoire_type || "Non spécifié"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Membres</Label>
                          <p className="font-semibold">{selectedBand.members_count || "Non spécifié"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Durée du show</Label>
                          <p className="font-semibold">{selectedBand.show_duration || "Non spécifié"}</p>
                        </div>
                      </div>

                      {/* Localisation */}
                      {selectedBand.city && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Localisation</Label>
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-secondary" />
                            {selectedBand.city}, {selectedBand.department} - {selectedBand.region}
                          </p>
                        </div>
                      )}

                      {/* Description */}
                      {selectedBand.description && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Description</Label>
                          <p className="text-sm">{selectedBand.description}</p>
                        </div>
                      )}

                      {/* Association */}
                      {selectedBand.is_association && selectedBand.association_name && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Association</Label>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-400" />
                            {selectedBand.association_name}
                          </p>
                        </div>
                      )}

                      {/* Label de musique */}
                      {selectedBand.has_label && selectedBand.label_name && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Label de musique</Label>
                          <p className="text-sm font-semibold">
                            🏷️ {selectedBand.label_name}
                            {selectedBand.label_city && (
                              <span className="text-muted-foreground ml-2">({selectedBand.label_city})</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Styles musicaux */}
                      {selectedBand.music_styles && selectedBand.music_styles.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Styles musicaux</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedBand.music_styles.map((style, i) => (
                              <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs">
                                {style}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Liens sociaux */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Réseaux sociaux</Label>
                        <SocialLinks 
                          facebook={selectedBand.facebook}
                          instagram={selectedBand.instagram}
                          youtube={selectedBand.youtube}
                          website={selectedBand.website}
                          bandcamp={selectedBand.bandcamp}
                        />
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {selectedBand.looking_for_concerts && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            Cherche des concerts
                          </span>
                        )}
                        {selectedBand.looking_for_members && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Cherche des membres
                          </span>
                        )}
                        {selectedBand.has_sound_engineer && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            🎚️ Ingé son
                          </span>
                        )}
                      </div>

                      {/* Profils recherchés */}
                      {selectedBand.looking_for_profiles && selectedBand.looking_for_profiles.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Profils recherchés</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedBand.looking_for_profiles.map((profile, i) => (
                              <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs">
                                {profile}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bouton contact */}
                      <Button
                        onClick={() => {
                          setShowBandDetailsDialog(false);
                          setShowMessageDialog(true);
                        }}
                        className="w-full bg-primary hover:bg-primary/90 rounded-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Contacter ce groupe
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modale des événements d'un établissement */}
      <Dialog open={showVenueEventsModal} onOpenChange={closeVenueEventsModal}>
        <DialogContent className="glassmorphism border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-heading text-2xl">
                {selectedVenue?.name} - Événements
              </DialogTitle>
              <Button
                onClick={() => selectedVenue && fetchVenueEvents(selectedVenue.id, selectedVenue.name)}
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={loadingVenueEvents}
              >
                {loadingVenueEvents ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "🔄 Rafraîchir"
                )}
              </Button>
            </div>
          </DialogHeader>

          {loadingVenueEvents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Concerts */}
              <div>
                <h3 className="font-heading text-xl mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Concerts ({venueEvents.concerts.length})
                </h3>
                {venueEvents.concerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Aucun concert à venir</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venueEvents.concerts.map((concert) => (
                      <div key={concert.id} className="glassmorphism rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-lg">{concert.title || "Concert"}</p>
                            <p className="text-sm text-muted-foreground">{concert.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Concert
                            </span>
                            {concert.participants_count !== undefined && concert.participants_count > 0 && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {concert.participants_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {concert.start_time} - {concert.end_time}
                        </p>
                        {concert.description && (
                          <p className="text-sm mt-2">{concert.description}</p>
                        )}
                        {concert.price && (
                          <p className="text-sm text-secondary mt-2">{concert.price}</p>
                        )}
                        {concert.bands && concert.bands.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1">Artistes:</p>
                            {concert.bands.map((band, i) => (
                              <p key={i} className="text-sm">{band.name}</p>
                            ))}
                          </div>
                        )}
                        <div className="mt-4">
                          <JoinEventButton 
                            event={{ ...concert, type: 'concert' }}
                            venueId={concert.venue_id}
                            token={token}
                            currentParticipation={null}
                            onParticipationChange={refreshVenueEvents}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bœufs */}
              <div>
                <h3 className="font-heading text-xl mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Bœufs ({venueEvents.jams.length})
                </h3>
                {venueEvents.jams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Aucun bœuf à venir</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venueEvents.jams.map((jam) => (
                      <div key={jam.id} className="glassmorphism rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-heading font-semibold text-lg">Bœuf Musical</p>
                            <p className="text-sm text-muted-foreground">{jam.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                              Bœuf
                            </span>
                            {jam.participants_count !== undefined && (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {jam.participants_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {jam.start_time} - {jam.end_time}
                        </p>
                        {jam.music_styles && jam.music_styles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {jam.music_styles.map((style, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                {style}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 space-y-1">
                          {jam.has_instruments && (
                            <p className="text-xs text-secondary">✓ Instruments disponibles</p>
                          )}
                          {jam.has_pa_system && (
                            <p className="text-xs text-secondary">✓ Sonorisation</p>
                          )}
                        </div>
                        {jam.rules && (
                          <p className="text-sm mt-2 text-muted-foreground">{jam.rules}</p>
                        )}
                        <div className="mt-4">
                          <JoinEventButton 
                            event={{ ...jam, type: 'jam' }}
                            venueId={jam.venue_id}
                            token={token}
                            currentParticipation={null}
                            onParticipationChange={refreshVenueEvents}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
