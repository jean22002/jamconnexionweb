import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Check, ArrowLeft, Guitar, Mic } from "lucide-react";

export default function Tarifs() {
  const navigate = useNavigate();

  const musicianFeatures = [
    "Accès illimité à la carte",
    "Profils établissements détaillés",
    "Géolocalisation en temps réel",
    "Création de profil musicien",
    "Contact direct avec les venues",
    "Filtres par style et localisation"
  ];

  const venueFeatures = [
    "Profil établissement complet",
    "Visibilité sur la carte",
    "Détail équipement & services",
    "Liens réseaux sociaux",
    "Jours de jam personnalisés",
    "Badge établissement vérifié",
    "Support prioritaire"
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
        <div className="text-center mb-16">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-gradient">
            Choisissez votre formule
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Que vous soyez musicien ou établissement, trouvez la solution qui vous correspond
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
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
                <li key={index} className="flex items-start gap-3">
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
            >
              Créer mon compte gratuit
            </Button>
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
                <p className="text-2xl font-bold text-primary">14,99€ <span className="text-base text-muted-foreground">/mois</span></p>
              </div>
            </div>

            {/* Essai gratuit */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 mb-6">
              <p className="text-center text-cyan-400 font-semibold">
                2 mois d'essai gratuit inclus
              </p>
            </div>

            <p className="text-muted-foreground mb-8">
              Soyez visible sur la carte et attirez des musiciens talentueux dans votre établissement.
            </p>

            <ul className="space-y-4 mb-8">
              {venueFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
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
              Commencer l'essai gratuit
            </Button>
          </div>

        </div>

        {/* Additional Info */}
        <div className="text-center mt-16 text-muted-foreground">
          <p>Questions ? Contactez-nous à{" "}
            <a href="mailto:support@jamconnexion.fr" className="text-primary hover:underline">
              support@jamconnexion.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
