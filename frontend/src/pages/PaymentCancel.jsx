import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Music, AlertCircle, CreditCard, Home, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentCancel() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Si on est en train de charger l'utilisateur, afficher un loader
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleRetryPayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      const response = await axios.post(
        `${API}/payments/checkout`,
        {
          origin_url: window.location.origin
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la création de la session de paiement");
      setIsProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    console.log("User from context:", user);
    
    if (!user) {
      // Si pas d'utilisateur connecté, rediriger vers la page d'accueil
      navigate("/");
      return;
    }

    // Rediriger selon le rôle de l'utilisateur
    if (user.role === "venue") {
      navigate("/venue");
    } else if (user.role === "musician") {
      navigate("/musician");
    } else if (user.role === "melomane") {
      navigate("/melomane");
    } else {
      navigate("/");
    }
  };

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
          <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-orange-400" />
          </div>
          
          <h1 className="font-heading font-bold text-3xl mb-4">
            Paiement annulé
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Aucun montant n'a été débité. Vous pouvez réessayer quand vous le souhaitez ou revenir plus tard.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={handleRetryPayment}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 font-heading text-lg font-semibold hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Réessayer le paiement
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleBackToDashboard}
              variant="outline"
              className="w-full rounded-full py-6 font-heading text-lg font-semibold border-white/10 hover:bg-white/5"
            >
              <Home className="w-5 h-5 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>

          <p className="text-muted-foreground text-sm mt-6">
            Besoin d'aide ? Contactez notre support à support@jamconnexion.com
          </p>
        </div>
      </main>
    </div>
  );
}
