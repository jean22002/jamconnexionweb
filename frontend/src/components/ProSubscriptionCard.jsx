import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Check, Crown, TrendingUp, FileText, BarChart3, Loader2, Sparkles, ChevronDown, ChevronUp, AlertCircle, Camera, Music, MapPin, Users, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

const ProSubscriptionCard = ({ token, currentTier, onSuccess, profile }) => {
  const [loading, setLoading] = useState(false);
  
  // Calculate missing profile fields
  const missingFields = useMemo(() => {
    if (!profile) return [];
    
    const missing = [];
    
    if (!profile.profile_image || profile.profile_image === '') {
      missing.push({ icon: Camera, label: 'Photo de profil', field: 'profile_image' });
    }
    if (!profile.description || profile.description.trim() === '') {
      missing.push({ icon: FileText, label: 'Biographie', field: 'description' });
    }
    if (!profile.styles || profile.styles.length === 0) {
      missing.push({ icon: Music, label: 'Styles musicaux', field: 'styles' });
    }
    if (!profile.city || profile.city.trim() === '') {
      missing.push({ icon: MapPin, label: 'Ville', field: 'city' });
    }
    if (!profile.bands || profile.bands.length === 0) {
      missing.push({ icon: Users, label: 'Groupe(s) / Projet(s)', field: 'bands' });
    }
    
    return missing;
  }, [profile]);
  
  // State for collapsible - persist in localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('proOfferExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Toggle expansion
  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const newValue = !prev;
      localStorage.setItem('proOfferExpanded', JSON.stringify(newValue));
      return newValue;
    });
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/api/musicians/me/subscribe-pro`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la souscription');
      setLoading(false);
    }
  };

  if (currentTier === 'pro') {
    return null; // Don't show if already PRO
  }

  return (
    <div className="mb-6">
      {/* Collapsible header */}
      <div className="glassmorphism rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg">Offre PRO</h2>
              <p className="text-xs text-muted-foreground">
                7 jours gratuits puis 6,99€/mois
              </p>
            </div>
          </div>
          <Button
            onClick={toggleExpanded}
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-white/10"
            aria-label={isExpanded ? "Réduire l'offre PRO" : "Agrandir l'offre PRO"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-cyan-500/20 to-purple-500/20 border-2 border-primary/50 p-8">
      {/* Sparkle decoration */}
      <div className="absolute top-4 right-4">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>

      {/* Badge "Offre de lancement" */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/50 rounded-full mb-6">
        <Crown className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Offre de Lancement</span>
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">
        <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Musicien PRO
        </span>
      </h2>
      
      <p className="text-lg sm:text-xl text-muted-foreground mb-6">
        Boostez votre carrière musicale
      </p>

      {/* Pricing */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <span className="text-4xl sm:text-5xl font-bold text-primary">7 jours</span>
          <span className="text-xl sm:text-2xl font-semibold text-muted-foreground">GRATUITS</span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg sm:text-xl text-muted-foreground">puis</span>
          <span className="text-2xl sm:text-3xl font-bold">6,99€</span>
          <span className="text-base sm:text-lg text-muted-foreground">/mois</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Annulable à tout moment • Sans engagement
        </p>
      </div>

      {/* Missing Profile Fields Warning */}
      {missingFields.length > 0 && (
        <div className="mb-6 p-4 bg-orange-500/10 border-2 border-orange-500/50 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-400 mb-2">
                Complétez votre profil avant de passer PRO
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Pour tirer le meilleur parti de votre abonnement PRO, complétez ces éléments :
              </p>
            </div>
          </div>
          <div className="space-y-2 ml-8">
            {missingFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4 text-orange-400" />
                  <span className="text-muted-foreground">{field.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 ml-8">
            💡 Rendez-vous dans l'onglet "Profil" pour compléter ces informations
          </p>
        </div>
      )}

      {/* Features */}
      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Badge PRO vérifié</p>
            <p className="text-sm text-muted-foreground">Démarquez-vous dans les recherches</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mt-0.5">
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="font-semibold">Comptabilité & Factures</p>
            <p className="text-sm text-muted-foreground">Gérez vos concerts et revenus</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5">
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold">Analytics avancées</p>
            <p className="text-sm text-muted-foreground">Statistiques et insights détaillés</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center mt-0.5">
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold">Badge GUSO visible</p>
            <p className="text-sm text-muted-foreground">Trouvez facilement les établissements au GUSO</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
            <Filter className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="font-semibold">Filtres avancés sur la carte</p>
            <p className="text-sm text-muted-foreground">Filtrez par candidatures et offres disponibles</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary via-cyan-500 to-purple-500 hover:opacity-90 text-white font-semibold py-6 text-lg rounded-xl transition-all transform hover:scale-105"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Chargement...
          </>
        ) : (
          <>
            <Crown className="w-5 h-5 mr-2" />
            Commencer l'essai gratuit
          </>
        )}
      </Button>

      {/* Reassurance */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl">
        <p className="text-sm text-center text-muted-foreground">
          ✅ Aucun paiement avant 7 jours<br />
          ✅ Accès complet immédiat<br />
          ✅ Résiliable en 1 clic
        </p>
      </div>
    </div>
      )}
    </div>
  );
};

export default ProSubscriptionCard;
