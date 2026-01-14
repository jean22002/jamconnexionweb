import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Music, MapPin, Users, Mic2, Guitar, Radio, ArrowRight, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ musicians: 0, venues: 0 });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch musicians count
        const musiciansRes = await axios.get(`${API}/musicians`);
        const musiciansCount = musiciansRes.data.length;

        // Fetch venues count
        const venuesRes = await axios.get(`${API}/venues`);
        const venuesCount = venuesRes.data.length;

        setStats({ musicians: musiciansCount, venues: venuesCount });
        
        // Show stats only if at least one exceeds 100
        if (musiciansCount > 100 || venuesCount > 100) {
          setShowStats(true);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/faq">
                <Button variant="ghost" className="text-muted-foreground hover:text-white">
                  FAQ
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" className="text-muted-foreground hover:text-white" data-testid="nav-pricing">
                  Tarifs
                </Button>
              </Link>
              {user ? (
                <Link to={user.role === "musician" ? "/musician" : "/venue"}>
                  <Button className="bg-primary hover:bg-primary/90 rounded-full px-6" data-testid="nav-dashboard">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 rounded-full px-6" data-testid="nav-login">
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(https://images.pexels.com/photos/1692695/pexels-photo-1692695.jpeg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-background/90"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <Radio className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-primary">
                  Plateforme Live Music
                </span>
              </div>
              
              <h1 className="font-heading font-bold text-5xl md:text-7xl tracking-tight leading-none animate-fade-up">
                Connectez les
                <span className="block text-gradient">Musiciens & les Scènes locales</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg animate-fade-up animation-delay-100">
                Trouvez les meilleurs spots pour jouer ou découvrez des talents locaux. 
                La plateforme qui fait vibrer la scène musicale locale.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-up animation-delay-200">
                <Link to="/musician-register">
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 font-heading font-semibold hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:-translate-y-1 transition-all w-full sm:w-auto"
                    data-testid="hero-musician-btn"
                  >
                    <Guitar className="w-5 h-5 mr-2" />
                    Je suis Musicien
                  </Button>
                </Link>
                <Link to="/venue-register">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/20 hover:border-white/50 rounded-full px-8 py-6 font-heading hover:bg-white/5 transition-all w-full sm:w-auto"
                    data-testid="hero-venue-btn"
                  >
                    <Mic2 className="w-5 h-5 mr-2" />
                    Je suis Établissement
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden neon-border animate-pulse-glow" style={{backgroundColor: '#0a0014'}}>
                <img 
                  src="https://customer-assets.emergentagent.com/job_50c65ff9-dffb-4fa4-89ca-c0630dc7b014/artifacts/oauw7wn1_18723499-C61F-4032-BF38-9B49E9B8BBBB.png"
                  alt="Jam Connexion - Connectez musiciens et scènes locales"
                  className="w-full h-[500px] object-contain"
                  style={{mixBlendMode: 'screen'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60"></div>
              </div>
              
              {showStats && stats.venues > 100 && (
                <div className="absolute -bottom-6 -left-6 glassmorphism rounded-2xl p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-white">+{stats.venues}</p>
                      <p className="text-sm text-muted-foreground">Établissements</p>
                    </div>
                  </div>
                </div>
              )}
              
              {showStats && stats.musicians > 100 && (
                <div className="absolute -top-6 -right-6 glassmorphism rounded-2xl p-4 animate-float animation-delay-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-white">+{stats.musicians}</p>
                      <p className="text-sm text-muted-foreground">Musiciens</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              Comment ça <span className="text-gradient">marche</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Une plateforme simple pour connecter musiciens et établissements
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-8 h-8" />,
                title: "Géolocalisation",
                description: "Trouvez les cafés-concerts et jam sessions près de chez vous en temps réel."
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Profils Détaillés",
                description: "Découvrez le matériel disponible, les styles musicaux et les jours de jam."
              },
              {
                icon: <Music className="w-8 h-8" />,
                title: "Connexion Directe",
                description: "Contactez directement les établissements via leurs réseaux sociaux."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-sm hover:border-primary/30 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight">
                Gratuit pour les <span className="text-gradient">musiciens</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Les musiciens ont un accès gratuit et illimité à la plateforme. 
                Trouvez des spots, consultez les profils et connectez-vous avec les établissements.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Accès à tous les établissements",
                  "Géolocalisation en temps réel",
                  "Création de profil musicien",
                  "Contact direct avec les venues"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glassmorphism rounded-3xl p-8 neon-border">
              <div className="text-center mb-6">
                <p className="font-mono text-xs uppercase tracking-wider text-primary mb-2">Établissements</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-heading font-bold text-5xl">10€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <p className="text-secondary mt-2 font-medium">2 mois d'essai gratuit</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Profil établissement complet",
                  "Visibilité sur la carte",
                  "Détail équipement & services",
                  "Liens réseaux sociaux",
                  "Badge établissement vérifié"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/auth?role=venue">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 font-heading font-semibold hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"
                  data-testid="pricing-cta"
                >
                  Commencer l'essai gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Music className="w-4 h-4 text-primary" />
              </div>
              <span className="font-heading font-bold text-gradient">Jam Connexion</span>
            </div>
            
            <p className="text-muted-foreground text-sm">
              © 2024 Jam Connexion. Tous droits réservés.
            </p>
            
            <div className="flex items-center gap-6">
              <Link to="/pricing" className="text-muted-foreground hover:text-white text-sm transition-colors">
                Tarifs
              </Link>
              <Link to="/auth" className="text-muted-foreground hover:text-white text-sm transition-colors">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
