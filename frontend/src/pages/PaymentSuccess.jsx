import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Music, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Rafraîchir les données utilisateur au cas où l'abonnement a été mis à jour
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glassmorphism">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="glassmorphism rounded-3xl p-8 md:p-12 max-w-lg w-full text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse">
            <Check className="w-12 h-12 text-green-400" />
          </div>
          
          <h1 className="font-heading font-bold text-4xl mb-4 text-green-400">
            Paiement accepté ! ✅
          </h1>
          
          <p className="text-muted-foreground text-lg mb-2">
            Votre abonnement à Jam Connexion a été activé avec succès.
          </p>
          
          <p className="text-muted-foreground mb-8">
            Profitez dès maintenant de toutes les fonctionnalités de la plateforme.
          </p>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Abonnement mensuel activé</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5" />
                <span>Renouvellement automatique chaque mois</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5" />
                <span>Confirmation envoyée par email</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              if (!user) {
                navigate("/auth");
              } else {
                navigate(user.role === "venue" ? "/venue" : user.role === "musician" ? "/musician" : "/");
              }
            }}
            className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 font-heading text-lg font-semibold hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all"
          >
            {user ? "Accéder à mon tableau de bord" : "Se connecter pour continuer"}
          </Button>

          <p className="text-muted-foreground text-sm mt-6">
            Besoin d'aide ? Contactez notre support à support@jamconnexion.com
          </p>
        </div>
      </main>
    </div>
  );
}
