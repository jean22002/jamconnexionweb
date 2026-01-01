import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Music, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [attempts, setAttempts] = useState(0);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const pollPaymentStatus = async () => {
      if (!sessionId || !token) {
        setStatus("error");
        return;
      }

      if (attempts >= 5) {
        setStatus("error");
        return;
      }

      try {
        const response = await axios.get(`${API}/payments/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.payment_status === "paid") {
          setStatus("success");
          await refreshUser();
        } else if (response.data.status === "expired") {
          setStatus("error");
        } else {
          // Continue polling
          setAttempts(prev => prev + 1);
          setTimeout(pollPaymentStatus, 2000);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setAttempts(prev => prev + 1);
        if (attempts < 4) {
          setTimeout(pollPaymentStatus, 2000);
        } else {
          setStatus("error");
        }
      }
    };

    pollPaymentStatus();
  }, [sessionId, token, attempts, refreshUser]);

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
        <div className="glassmorphism rounded-3xl p-8 md:p-12 max-w-md w-full text-center">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h1 className="font-heading font-bold text-2xl mb-3">
                Vérification du paiement...
              </h1>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que nous confirmons votre paiement.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse-glow">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="font-heading font-bold text-2xl mb-3">
                Paiement réussi !
              </h1>
              <p className="text-muted-foreground mb-8">
                Votre abonnement est maintenant actif. Vous pouvez compléter votre profil pour être visible sur la carte.
              </p>
              <Button 
                onClick={() => navigate("/venue")}
                className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 font-heading font-semibold hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"
                data-testid="go-dashboard-btn"
              >
                Aller au Dashboard
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="font-heading font-bold text-2xl mb-3">
                Une erreur est survenue
              </h1>
              <p className="text-muted-foreground mb-8">
                Nous n'avons pas pu confirmer votre paiement. Veuillez réessayer ou contacter le support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate("/venue")}
                  variant="outline"
                  className="border-white/20 rounded-full px-6"
                >
                  Retour au Dashboard
                </Button>
                <Button 
                  onClick={() => navigate("/pricing")}
                  className="bg-primary hover:bg-primary/90 rounded-full px-6"
                >
                  Réessayer
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
