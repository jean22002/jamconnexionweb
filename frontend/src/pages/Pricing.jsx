import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Music, Check, ArrowRight, Guitar, Mic2, Music2, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PromoCounter from "../components/PromoCounter";

const STRIPE_PAYMENT_LINK_VENUE = "https://buy.stripe.com/3cI8wOfFj5h68ZKd9vafS03";
const STRIPE_PAYMENT_LINK_MUSICIAN = "https://buy.stripe.com/5kQfZgfFjfVK0te4CZafS04";

export default function Pricing() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribeVenue = () => {
    if (!user) {
      window.location.href = "/auth?role=venue";
      return;
    }

    setIsProcessing(true);
    window.location.href = STRIPE_PAYMENT_LINK_VENUE;
  };

  const handleSubscribeMusician = () => {
    if (!user) {
      window.location.href = "/auth?role=musician";
      return;
    }

    setIsProcessing(true);
    window.location.href = STRIPE_PAYMENT_LINK_MUSICIAN;
  };

  return (
    <div className="min-h-screen bg-background">
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
            
            {user ? (
              <Link to={user.role === "musician" ? "/musician" : "/venue"}>
                <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="pricing-page">
        <div className="text-center mb-16">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
            Tarifs <span className="text-gradient">simples</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Musiciens et mélomanes : accès gratuit. Établissements : abonnement simple pour booster votre visibilité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Musician Plan */}
          <div className="glassmorphism rounded-3xl p-8 border border-secondary/30 relative overflow-hidden">
            {/* Badge Promo Musiciens */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-bl-2xl font-bold text-xs">
              🎁 OFFRE LIMITÉE
            </div>
            
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <Guitar className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl">Musicien PRO</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-secondary font-bold text-xl">6,99€</span>
                  <span className="text-muted-foreground text-sm">/mois</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl px-4 py-4 mb-6 border border-cyan-500/30">
              <p className="text-cyan-400 font-bold text-center text-lg mb-1">
                🎁 2 mois PRO gratuits
              </p>
              <p className="text-xs text-center text-muted-foreground">
                pour les 200 premiers musiciens !
              </p>
              <p className="text-xs text-center text-cyan-300 mt-2 font-medium">
                Puis 6,99€/mois • Annulable à tout moment
              </p>
            </div>
            
            {/* Compteur temps réel */}
            <div className="mb-6">
              <PromoCounter variant="card" type="musician" />
            </div>
            
            <p className="text-muted-foreground mb-8">
              Accès complet à la plateforme pour trouver des spots et se connecter avec les établissements.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Accès illimité à la carte",
                "Profils établissements détaillés",
                "Géolocalisation en temps réel",
                "Création de profil musicien",
                "Contact direct avec les venues",
                "Filtres par style et localisation"
              ].map((item, index) => (
                <li key={`pricing-feature-${index}`} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={handleSubscribeMusician}
              disabled={isProcessing}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full py-6 font-heading font-semibold transition-all"
              data-testid="musician-signup-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  Essayer 2 mois gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Accès gratuit de base • PRO à 6,99€/mois après l'essai
            </p>
          </div>

          {/* Melomane Plan */}
          <div className="glassmorphism rounded-3xl p-8 border border-purple-500/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Music2 className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl">Mélomane</h2>
                <p className="text-purple-400 font-semibold">Gratuit</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-8">
              Découvrez tous les événements musicaux près de chez vous et participez à la vie musicale locale.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Inscription gratuite",
                "Accès à tous les événements",
                "Notifications des concerts",
                "Connexion aux établissements",
                "Suivi de vos participations",
                "Carte interactive géolocalisée"
              ].map((item, index) => (
                <li key={`pricing-feature-${index}`} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/auth?role=melomane">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full py-6 font-heading font-semibold transition-all"
                data-testid="melomane-signup-btn"
              >
                Créer mon profil mélomane
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Venue Plan */}
          <div className="glassmorphism rounded-3xl p-8 neon-border relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2 rounded-bl-3xl font-bold text-sm shadow-lg">
              🎁 OFFRE LIMITÉE
            </div>
            
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Mic2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl">Établissement</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary font-bold text-2xl">12,99€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl px-4 py-4 mb-4 border border-orange-500/30">
              <p className="text-orange-400 font-bold text-center text-lg mb-1">
                🎁 6 mois gratuits
              </p>
              <p className="text-xs text-center text-muted-foreground">
                pour les 100 premiers établissements !
              </p>
              <p className="text-secondary font-medium text-center text-sm mt-2">
                puis 3 mois gratuits ensuite
              </p>
            </div>
            
            {/* Compteur temps réel */}
            <div className="mb-6">
              <PromoCounter variant="card" />
            </div>
            
            <p className="text-muted-foreground mb-8">
              Soyez visible sur la carte et attirez des musiciens talentueux dans votre établissement.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Profil établissement complet",
                "Visibilité sur la carte",
                "Détail équipement & services",
                "Liens réseaux sociaux",
                "Jours de jam personnalisés",
                "Badge établissement vérifié",
                "Support prioritaire"
              ].map((item, index) => (
                <li key={`pricing-feature-${index}`} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={handleSubscribeVenue}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 font-heading font-semibold hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"
              data-testid="venue-signup-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirection vers le paiement...
                </>
              ) : user && user.role === "venue" ? (
                <>
                  S'abonner maintenant
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Commencer l'essai gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="font-heading font-semibold text-2xl text-center mb-10">
            Questions fréquentes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Pourquoi c'est gratuit pour les musiciens ?",
                a: "Notre mission est de faciliter les connexions entre musiciens et établissements. Plus il y a de musiciens sur la plateforme, plus elle est utile pour tout le monde !"
              },
              {
                q: "Que comprend la période d'essai ?",
                a: "Pendant 2 mois, vous avez accès à toutes les fonctionnalités premium : profil complet, visibilité sur la carte, et tous les outils de gestion."
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis votre dashboard. Pas d'engagement, pas de frais cachés."
              },
              {
                q: "Comment fonctionne la géolocalisation ?",
                a: "Les musiciens peuvent voir les établissements sur une carte interactive et filtrer par distance. Votre adresse est géolocalisée automatiquement."
              }
            ].map((faq, index) => (
              <div key={`pricing-faq-${index}`} className="glassmorphism rounded-2xl p-6">
                <h3 className="font-heading font-semibold mb-3">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Section Notifications */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              🔔 Notifications en temps réel
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Restez informés instantanément des événements importants grâce à notre système de notifications WebSocket
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Notifications Musiciens */}
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Guitar className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-heading font-bold text-xl">Musiciens</h3>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Candidature acceptée/refusée</strong> - Réponse instantanée</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Nouveaux messages</strong> - Avec établissements</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-cyan-400">Nouvelles offres</strong> (PRO) - Opportunités exclusives</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Badges débloqués</strong> - Progression</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Invitations de groupe</strong> - Rejoindre des groupes</span>
                </li>
              </ul>
            </div>

            {/* Notifications Établissements */}
            <div className="glassmorphism rounded-2xl p-6 border-2 border-primary/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Mic2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-xl">Établissements</h3>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Nouvelles candidatures</strong> - Musiciens qui postulent</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Nouveaux messages</strong> - Avec musiciens</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Nouveaux abonnés</strong> - Qui vous suivent</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Badges débloqués</strong> - Réputation</span>
                </li>
              </ul>
            </div>

            {/* Notifications Mélomanes */}
            <div className="glassmorphism rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-heading font-bold text-xl">Mélomanes</h3>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Nouveaux concerts</strong> - Établissements suivis</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Nouveaux jams</strong> - Près de vous</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Rappels</strong> - Ne manquez rien</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Badges débloqués</strong> - Fidélité</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="glassmorphism rounded-xl p-6 inline-block">
              <p className="text-sm text-muted-foreground mb-2">
                ⚡ <strong>Technologie WebSocket</strong> pour une latence &lt; 100ms
              </p>
              <p className="text-xs text-muted-foreground">
                Notifications instantanées • Compatible mobile et web • Reconnexion automatique
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
