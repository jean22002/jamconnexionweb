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
          
          <h1 className="font-heading font-bold text-4xl mb-4">
            Paiement réussi ! 🎉
          </h1>
          
          <p className="text-muted-foreground text-lg mb-2">
            Merci pour votre abonnement à Jam Connexion.
          </p>
          
          <p className="text-muted-foreground mb-8">
            Votre accès est maintenant actif. Vous pouvez profiter de toutes les fonctionnalités de la plateforme.
          </p>

          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-8">
            <p className="text-sm">
              ✅ Abonnement mensuel activé<br/>
              💳 Renouvellement automatique chaque mois<br/>
              📧 Vous recevrez un email de confirmation
            </p>
          </div>
          
          <Button 
            onClick={() => navigate(user?.role === "venue" ? "/venue" : user?.role === "musician" ? "/musician" : "/")}
            className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 font-heading text-lg font-semibold hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all"
          >
            Accéder à mon tableau de bord
          </Button>

          <p className="text-muted-foreground text-sm mt-6">
            Besoin d'aide ? Contactez notre support à support@jamconnexion.com
          </p>
        </div>
      </main>
    </div>
  );
}
