import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Clock, CreditCard, CheckCircle2, Music, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TrialExpired() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/payments/checkout`,
        { origin_url: originUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erreur lors de la création de la session de paiement");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="glassmorphism rounded-3xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-gradient">
            Votre essai gratuit est terminé 🎉
          </h1>

          {/* Message */}
          <p className="text-xl text-muted-foreground mb-8">
            Merci d'avoir testé Jam Connexion pendant 60 jours !
          </p>

          {/* Features reminder */}
          <div className="bg-background/50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-heading font-semibold text-xl mb-4 text-center">
              Continuez à profiter de :
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span>Créer et gérer vos événements musicaux</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span>Recevoir des candidatures de musiciens</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span>Être visible dans le répertoire des établissements</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span>Messagerie avec les musiciens</span>
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="glassmorphism rounded-2xl p-6 mb-8 neon-border">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="font-heading font-bold text-5xl text-gradient">14,99€</span>
              <span className="text-muted-foreground text-lg">/mois</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sans engagement • Annulation à tout moment
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
              className="bg-primary hover:bg-primary/90 rounded-full text-lg px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Continuer avec l'abonnement
                </>
              )}
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full text-lg px-8"
              disabled={loading}
            >
              <Link to="/">
                <Music className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>

          {/* Support */}
          <p className="text-sm text-muted-foreground mt-8">
            Questions ? Contactez-nous à{" "}
            <a href="mailto:support@jamconnexion.fr" className="text-primary hover:underline">
              support@jamconnexion.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
