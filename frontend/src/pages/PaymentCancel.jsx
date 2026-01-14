import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Music, AlertCircle, CreditCard } from "lucide-react";

export default function PaymentCancel() {
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
          <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-orange-400" />
          </div>
          
          <h1 className="font-heading font-bold text-3xl mb-4">
            Le paiement a été annulé
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            Tu peux réessayer quand tu veux pour continuer ton aventure sur Jam Connexion.
          </p>
          
          <Button 
            asChild
            className="bg-primary hover:bg-primary/90 rounded-full px-12 py-7 font-heading text-lg font-semibold hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all"
          >
            <Link to="/trial-expired">
              <CreditCard className="w-6 h-6 mr-2" />
              Revenir à l'abonnement
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
