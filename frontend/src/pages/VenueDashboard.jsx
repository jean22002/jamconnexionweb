import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { 
  Music, LogOut, MapPin, Globe, Instagram, Facebook, 
  Phone, Edit, Save, Loader2, CreditCard, Check, Clock, AlertCircle, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VenueDashboard() {
  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    latitude: 0,
    longitude: 0,
    phone: "",
    website: "",
    facebook: "",
    instagram: "",
    has_stage: false,
    has_sound_engineer: false,
    equipment: [],
    music_styles: [],
    jam_days: [],
    opening_hours: ""
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setFormData({
        name: response.data.name || "",
        description: response.data.description || "",
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
        equipment: response.data.equipment || [],
        music_styles: response.data.music_styles || [],
        jam_days: response.data.jam_days || [],
        opening_hours: response.data.opening_hours || ""
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setEditing(true); // Force editing mode for new profiles
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = profile ? `${API}/venues` : `${API}/venues`;
      const method = profile ? "put" : "post";
      
      await axios[method](endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Profil sauvegardé!");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await axios.post(`${API}/payments/checkout`, {
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.location.href = response.data.url;
    } catch (error) {
      toast.error("Erreur lors de la création du paiement");
    }
  };

  const geocodeAddress = async () => {
    if (!formData.address || !formData.city) {
      toast.error("Veuillez entrer une adresse et une ville");
      return;
    }
    
    try {
      const query = `${formData.address}, ${formData.postal_code} ${formData.city}, France`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
        toast.success("Coordonnées trouvées!");
      } else {
        toast.error("Adresse non trouvée");
      }
    } catch (error) {
      toast.error("Erreur lors de la géolocalisation");
    }
  };

  const addToList = (field, value) => {
    if (value && !formData[field].includes(value)) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value]
      });
    }
  };

  const removeFromList = (field, value) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter(item => item !== value)
    });
  };

  const getSubscriptionStatus = () => {
    if (user?.subscription_status === "active") {
      return { label: "Actif", color: "text-green-400", icon: Check };
    }
    if (user?.subscription_status === "trial") {
      const trialEnd = user?.trial_end ? new Date(user.trial_end) : null;
      const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      return { 
        label: `Essai (${daysLeft}j restants)`, 
        color: "text-secondary", 
        icon: Clock 
      };
    }
    return { label: "Inactif", color: "text-destructive", icon: AlertCircle };
  };

  const status = getSubscriptionStatus();
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
              
              <Button 
                variant="ghost" 
                onClick={logout}
                className="text-destructive hover:text-destructive/80"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">
            Bienvenue, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-muted-foreground">Gérez votre profil d'établissement</p>
        </div>

        {/* Subscription Card */}
        {user?.subscription_status !== "active" && (
          <div className="glassmorphism rounded-2xl p-6 mb-8 neon-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">
                  {user?.subscription_status === "trial" 
                    ? "Votre période d'essai" 
                    : "Abonnez-vous pour être visible"
                  }
                </h3>
                <p className="text-muted-foreground text-sm">
                  {user?.subscription_status === "trial" 
                    ? "Profitez de toutes les fonctionnalités pendant 2 mois"
                    : "10€/mois pour apparaître sur la carte et attirer des musiciens"
                  }
                </p>
              </div>
              
              {user?.subscription_status !== "trial" && (
                <Button 
                  onClick={handleSubscribe}
                  className="bg-primary hover:bg-primary/90 rounded-full px-6 gap-2"
                  data-testid="subscribe-btn"
                >
                  <CreditCard className="w-4 h-4" />
                  S'abonner - 10€/mois
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="glassmorphism rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-xl">Profil de l'établissement</h2>
            
            {!editing ? (
              <Button 
                variant="ghost" 
                onClick={() => setEditing(true)}
                className="gap-2"
                data-testid="edit-profile-btn"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 rounded-full gap-2"
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de l'établissement</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  className="bg-black/20 border-white/10 disabled:opacity-70"
                  data-testid="venue-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  className="bg-black/20 border-white/10 disabled:opacity-70"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!editing}
                rows={3}
                className="bg-black/20 border-white/10 disabled:opacity-70"
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Adresse
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Input
                    placeholder="Adresse"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!editing}
                    className="bg-black/20 border-white/10 disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Code postal"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    disabled={!editing}
                    className="bg-black/20 border-white/10 disabled:opacity-70"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Ville"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!editing}
                  className="bg-black/20 border-white/10 disabled:opacity-70"
                  data-testid="venue-city"
                />
                
                {editing && (
                  <Button 
                    type="button"
                    onClick={geocodeAddress}
                    variant="outline"
                    className="border-white/20"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Géolocaliser
                  </Button>
                )}
              </div>
              
              {(formData.latitude !== 0 || formData.longitude !== 0) && (
                <p className="text-sm text-muted-foreground">
                  Coordonnées: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Réseaux & Liens
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Site web</Label>
                  </div>
                  <Input
                    placeholder="https://..."
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!editing}
                    className="bg-black/20 border-white/10 disabled:opacity-70"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Facebook</Label>
                  </div>
                  <Input
                    placeholder="URL Facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    disabled={!editing}
                    className="bg-black/20 border-white/10 disabled:opacity-70"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Instagram</Label>
                  </div>
                  <Input
                    placeholder="@votre_compte"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    disabled={!editing}
                    className="bg-black/20 border-white/10 disabled:opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Equipment & Services */}
            <div className="space-y-4">
              <Label>Équipements & Services</Label>
              
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.has_stage}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_stage: checked })}
                    disabled={!editing}
                  />
                  <Label>Scène</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.has_sound_engineer}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_sound_engineer: checked })}
                    disabled={!editing}
                  />
                  <Label>Ingénieur son</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Matériel disponible</Label>
                {editing && (
                  <Input
                    placeholder="Ajouter (ex: Sono, Micros, Batterie...)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToList('equipment', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-black/20 border-white/10"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.equipment.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm flex items-center gap-1">
                      {item}
                      {editing && (
                        <button onClick={() => removeFromList('equipment', item)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Music Styles */}
            <div className="space-y-2">
              <Label>Styles musicaux</Label>
              {editing && (
                <Input
                  placeholder="Ajouter un style (Jazz, Blues, Rock...)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToList('music_styles', e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-black/20 border-white/10"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {formData.music_styles.map((style, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1">
                    {style}
                    {editing && (
                      <button onClick={() => removeFromList('music_styles', style)}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Jam Days */}
            <div className="space-y-2">
              <Label>Jours de Jam</Label>
              {editing && (
                <Input
                  placeholder="Ajouter un jour (Lundi, Mardi...)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToList('jam_days', e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-black/20 border-white/10"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {formData.jam_days.map((day, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm flex items-center gap-1">
                    {day}
                    {editing && (
                      <button onClick={() => removeFromList('jam_days', day)}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Opening Hours */}
            <div className="space-y-2">
              <Label>Horaires d'ouverture</Label>
              <Textarea
                placeholder="Ex: Lun-Ven: 18h-02h, Sam-Dim: 15h-03h"
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                disabled={!editing}
                rows={2}
                className="bg-black/20 border-white/10 disabled:opacity-70"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
