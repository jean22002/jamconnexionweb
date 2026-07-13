import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Check, ArrowLeft, Guitar, Mic } from "lucide-react";

export default function Tarifs() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

  const musicianFeatures = [
    "Accès illimité à la carte des établissements",
    "Profils établissements détaillés (équipements, services, avis)",
    "Géolocalisation en temps réel des venues",
    "Création de profil musicien & groupe (bio, styles, médias)",
    "Candidature aux créneaux ouverts des établissements",
    "Messagerie interne pour contacter les établissements",
    "Contact direct avec les venues via messagerie",
    "Filtres avancés par style musical et localisation",
    "Système de notifications en temps réel",
    "Gestion de plusieurs groupes musicaux"
  ];

  const musicianProFeatures = [
    "Tout ce qui est inclus dans la version gratuite",
    "🚫 Aucune publicité (bannières et interstitiels)",
    "⚡ Contact instantané avec les établissements (sans délai de pub)",
    "🎯 Priorité de candidature aux créneaux",
    "⭐ Badge PRO visible sur votre profil",
    "📊 Statistiques détaillées sur vos concerts et candidatures",
    "🔔 Notifications push prioritaires",
    "💌 Support prioritaire par email"
  ];

  const venueFeatures = [
    "Profil établissement complet (photos, description, équipements)",
    "Visibilité maximale sur la carte interactive",
    "Création de créneaux ouverts pour candidatures musiciens",
    "Gestion complète des bœufs et concerts",
    "Planning visuel avec calendrier interactif",
    "Détail équipement & services (scène, sono, ingé son)",
    "Liens réseaux sociaux (Facebook, Instagram, YouTube)",
    "Jours de jam personnalisés et événements récurrents",
    "Réception et gestion des candidatures musiciens",
    "Messagerie interne pour échanger avec les musiciens",
    "Système d'avis et notation par les musiciens",
    "Badge établissement vérifié pour plus de crédibilité",
    "Support prioritaire avec réponse rapide"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-gradient">Jam Connexion</h1>
          </div>

          <Button
            onClick={() => navigate("/auth")}
            variant="ghost"
            className="text-primary hover:text-primary/80"
          >
            Connexion
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-gradient">
            Choisissez votre formule
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Que vous soyez musicien ou établissement, trouvez la solution qui vous correspond
          </p>

          {/* Build 95.9 — Toggle Mensuel / Annuel (économie de 2 mois en annuel) */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-full bg-black/30 border border-white/10"
            data-testid="billing-toggle"
          >
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-white"
              }`}
              data-testid="billing-monthly-btn"
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-white"
              }`}
              data-testid="billing-yearly-btn"
            >
              Annuel
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/25 text-green-300 border border-green-500/40 font-bold uppercase tracking-wide">
                −2 mois
              </span>
            </button>
          </div>
          {billingCycle === "yearly" && (
            <p className="text-xs text-green-400 mt-3 font-medium" data-testid="billing-yearly-savings">
              🎉 Économisez jusqu&apos;à 19,89€ + <strong>1 mois d&apos;essai bonus</strong> sur les plans annuels
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Plan Musicien */}
          <div className="glassmorphism rounded-3xl p-8 hover:shadow-[0_0_40px_rgba(217,70,239,0.3)] transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <Guitar className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-3xl">Musicien</h2>
                <p className="text-2xl font-bold text-cyan-400">Gratuit</p>
              </div>
            </div>

            <p className="text-muted-foreground mb-8">
              Accès complet à la plateforme pour trouver des spots et se connecter avec les établissements.
            </p>

            <ul className="space-y-4 mb-8">
              {musicianFeatures.map((feature, index) => (
                <li key={`musician-feat-${feature.slice(0, 20)}`} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate("/musician-register")}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 text-white rounded-full py-6 text-lg font-heading font-semibold"
              data-testid="tarifs-musician-free-btn"
            >
              Je suis un musicien
            </Button>
          </div>

          {/* Plan Musicien PRO — Build 95.8 */}
          <div className="glassmorphism rounded-3xl p-8 hover:shadow-[0_0_40px_rgba(6,182,212,0.35)] transition-all border-2 border-cyan-500/40 relative" data-testid="tarifs-musician-pro-card">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-1.5 rounded-full">
              <span className="font-heading font-semibold text-xs text-white">🎁 2 mois gratuits</span>
            </div>

            <div className="flex items-center gap-4 mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center">
                <Guitar className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-3xl">Musicien PRO</h2>
                {billingCycle === "monthly" ? (
                  <p className="text-2xl font-bold text-cyan-300" data-testid="musician-pro-price">
                    4,99€ <span className="text-base text-muted-foreground">/mois</span>
                  </p>
                ) : (
                  <div data-testid="musician-pro-price">
                    <p className="text-2xl font-bold text-cyan-300">
                      49,90€ <span className="text-base text-muted-foreground">/an</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-through">
                      au lieu de 59,88€
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Essai gratuit — Build 95.12 : 3 mois pour annuel (2 + 1 bonus) */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 mb-6">
              {billingCycle === "monthly" ? (
                <>
                  <p className="text-center text-cyan-300 font-semibold mb-1">
                    2 mois d&apos;essai gratuit
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    pour les 200 premiers musiciens • Annulable à tout moment
                  </p>
                </>
              ) : (
                <>
                  <p className="text-center text-cyan-300 font-semibold mb-1">
                    🎁 3 mois d&apos;essai gratuits
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    2 mois + 1 mois bonus annuel • 200 premiers musiciens
                  </p>
                </>
              )}
            </div>

            <p className="text-muted-foreground mb-8">
              Boostez votre visibilité et supprimez toute publicité pour une expérience musicale premium.
            </p>

            <ul className="space-y-3 mb-8">
              {musicianProFeatures.map((feature) => (
                <li
                  key={`musician-pro-${feature.slice(0, 25)}`}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-cyan-300" />
                  </div>
                  <span className="text-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate(`/pricing?cycle=${billingCycle}`)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-full py-6 text-lg font-heading font-semibold"
              data-testid="tarifs-musician-pro-btn"
            >
              {billingCycle === "monthly"
                ? "Essayer 2 mois gratuitement"
                : "Essayer 3 mois gratuitement"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Aucun prélèvement pendant l&apos;essai
            </p>
          </div>

          {/* Plan Établissement */}
          <div className="glassmorphism rounded-3xl p-8 relative hover:shadow-[0_0_40px_rgba(217,70,239,0.4)] transition-all border-2 border-primary/40">
            {/* Badge Populaire */}
            <div className="absolute -top-4 right-8 bg-gradient-to-r from-primary to-secondary px-6 py-2 rounded-full">
              <span className="font-heading font-semibold text-sm">Populaire</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-3xl">Établissement</h2>
                {billingCycle === "monthly" ? (
                  <p className="text-2xl font-bold text-primary" data-testid="venue-price">
                    9,99€ <span className="text-base text-muted-foreground">/mois</span>
                  </p>
                ) : (
                  <div data-testid="venue-price">
                    <p className="text-2xl font-bold text-primary">
                      99,99€ <span className="text-base text-muted-foreground">/an</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-through">
                      au lieu de 119,88€
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Essai gratuit — Build 95.14 : 6 mois mensuel / 7 mois annuel (6 + 1 bonus) */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 mb-6">
              {billingCycle === "monthly" ? (
                <>
                  <p className="text-center text-cyan-400 font-semibold mb-1">
                    6 mois gratuits
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    pour les 200 premiers établissements !
                  </p>
                </>
              ) : (
                <>
                  <p className="text-center text-cyan-400 font-semibold mb-1">
                    🎁 7 mois d&apos;essai gratuits
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    6 mois + 1 mois bonus annuel • 200 premiers établissements
                  </p>
                </>
              )}
            </div>

            <p className="text-muted-foreground mb-8">
              Soyez visible sur la carte et attirez des musiciens talentueux dans votre établissement.
            </p>

            <ul className="space-y-4 mb-8">
              {venueFeatures.map((feature, index) => (
                <li key={`tarifs-feature-${index}`} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate("/venue-register")}
              className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 text-lg font-heading font-semibold hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all"
            >
              Je suis un établissement
            </Button>
          </div>

        </div>

        {/* Additional Info */}
        <div className="text-center mt-16 text-muted-foreground">
          <p>Questions ? Contactez-nous à{" "}
            <a href="mailto:jamconnexion11@gmail.com" className="text-primary hover:underline">
              jamconnexion11@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
