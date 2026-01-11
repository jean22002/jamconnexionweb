import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Music, Check, ArrowRight, Guitar, Mic2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Pricing() {
  const { user } = useAuth();

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
            Une offre gratuite pour les musiciens, un abonnement accessible pour les établissements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Musician Plan */}
          <div className="glassmorphism rounded-3xl p-8 border border-secondary/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <Guitar className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl">Musicien</h2>
                <p className="text-secondary font-semibold">Gratuit</p>
              </div>
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
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/auth?role=musician">
              <Button 
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full py-6 font-heading font-semibold transition-all"
                data-testid="musician-signup-btn"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Venue Plan */}
          <div className="glassmorphism rounded-3xl p-8 neon-border relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
                Populaire
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Mic2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl">Établissement</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary font-bold text-2xl">14,99€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary/10 rounded-xl px-4 py-3 mb-6">
              <p className="text-secondary font-medium text-center">
                2 mois d'essai gratuit inclus
              </p>
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
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/auth?role=venue">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 font-heading font-semibold hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"
                data-testid="venue-signup-btn"
              >
                Commencer l'essai gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
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
              <div key={index} className="glassmorphism rounded-2xl p-6">
                <h3 className="font-heading font-semibold mb-3">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
