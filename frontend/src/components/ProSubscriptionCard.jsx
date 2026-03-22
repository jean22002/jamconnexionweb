import React, { useState } from 'react';
import axios from 'axios';
import { Check, Crown, TrendingUp, FileText, BarChart3, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

const ProSubscriptionCard = ({ token, currentTier, onSuccess }) => {
  const [loading, setLoading] = useState(false);

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
      <h2 className="text-3xl font-bold mb-2">
        <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Musicien PRO
        </span>
      </h2>
      
      <p className="text-xl text-muted-foreground mb-6">
        Boostez votre carrière musicale
      </p>

      {/* Pricing */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold text-primary">2 mois</span>
          <span className="text-2xl font-semibold text-muted-foreground">GRATUITS</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl text-muted-foreground">puis</span>
          <span className="text-3xl font-bold">9,99€</span>
          <span className="text-lg text-muted-foreground">/mois</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Annulable à tout moment • Sans engagement
        </p>
      </div>

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
          ✅ Aucun paiement avant 60 jours<br />
          ✅ Accès complet immédiat<br />
          ✅ Résiliable en 1 clic
        </p>
      </div>
    </div>
  );
};

export default ProSubscriptionCard;
