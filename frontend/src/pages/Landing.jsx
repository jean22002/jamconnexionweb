import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Music, MapPin, Users, Mic2, Guitar, Radio, ArrowRight, Check, Music2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ musicians: 0, venues: 0 });
  const [showStats, setShowStats] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

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
            
            <div className="flex items-center gap-1 sm:gap-4">
              <Link to="/faq" className="hidden xs:block">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white text-xs sm:text-base px-2 sm:px-4">
                  FAQ
                </Button>
              </Link>
              <Link to="/tarifs">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white text-xs sm:text-base px-2 sm:px-4" data-testid="nav-pricing">
                  Tarifs
                </Button>
              </Link>
              {user ? (
                <Link to={user.role === "musician" ? "/musician" : "/venue"}>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-3 sm:px-6 text-xs sm:text-base" data-testid="nav-dashboard">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-2.5 sm:px-6 text-xs sm:text-base whitespace-nowrap" data-testid="nav-login">
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 overflow-hidden min-h-[80vh] sm:min-h-screen flex items-center">
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
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 w-full">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <Radio className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-primary">
                  Plateforme Live Music
                </span>
              </div>
              
              <h1 className="font-heading font-bold text-3xl sm:text-5xl md:text-7xl tracking-tight leading-tight sm:leading-none animate-fade-up">
                Connectez les
                <span className="block text-gradient">Musiciens & les Scènes locales</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg animate-fade-up animation-delay-100">
                Trouvez les meilleurs spots pour jouer ou découvrez des talents locaux. 
                La plateforme qui fait vibrer la scène musicale locale.
              </p>
              
              <div className="flex flex-col gap-3 sm:gap-4 animate-fade-up animation-delay-200 w-full max-w-md mx-auto sm:mx-0">
                <Link to="/tarifs" className="w-full">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 text-white rounded-full px-8 py-6 sm:py-7 font-heading font-semibold text-base sm:text-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-1 transition-all w-full"
                    data-testid="hero-musician-btn"
                  >
                    <Guitar className="w-5 h-5 mr-2" />
                    Je suis un musicien
                  </Button>
                </Link>
                <Link to="/venue-register" className="w-full">
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 rounded-full px-8 py-6 sm:py-7 font-heading font-semibold text-base sm:text-lg hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:-translate-y-1 transition-all w-full"
                    data-testid="hero-venue-btn"
                  >
                    <Mic2 className="w-5 h-5 mr-2" />
                    Je suis un établissement
                  </Button>
                </Link>
                <Link to="/auth?role=melomane" className="w-full">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full px-8 py-6 sm:py-7 font-heading font-semibold text-base sm:text-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:-translate-y-1 transition-all w-full"
                    data-testid="hero-melomane-btn"
                  >
                    <Music2 className="w-5 h-5 mr-2" />
                    Je suis mélomane
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

      {/* How It Works Section - 3 Steps */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              Comment ça <span className="text-gradient">marche</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Commencez en 3 étapes simples - rejoignez des centaines de musiciens et d'établissements
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            
            {[
              {
                step: "1",
                icon: <User className="w-10 h-10" />,
                title: "Inscrivez-vous",
                description: "Créez votre compte en 2 minutes. Choisissez votre rôle : musicien, établissement ou mélomane.",
                highlight: "Gratuit pour les musiciens"
              },
              {
                step: "2",
                icon: <Edit className="w-10 h-10" />,
                title: "Complétez votre profil",
                description: "Ajoutez vos photos, styles musicaux, disponibilités et toutes les infos pour vous démarquer.",
                highlight: "Profil en 5 minutes"
              },
              {
                step: "3",
                icon: <Music className="w-10 h-10" />,
                title: "Connectez-vous",
                description: "Trouvez des opportunités près de chez vous, échangez avec la communauté et organisez vos concerts.",
                highlight: "Résultats immédiats"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="relative p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-sm hover:border-primary/30 transition-all group hover:scale-105"
              >
                {/* Step number badge */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center font-heading font-bold text-2xl shadow-[0_0_20px_rgba(217,70,239,0.6)] z-10">
                  {item.step}
                </div>
                
                <div className="pt-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform mx-auto">
                    {item.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-2xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
                  <span className="inline-block px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm font-semibold">
                    ✨ {item.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA après les étapes */}
          <div className="text-center mt-16">
            <Link to="/auth">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 rounded-full px-12 py-7 font-heading font-semibold text-lg hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:-translate-y-1 transition-all"
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-muted-foreground text-sm mt-4">
              Aucune carte bancaire requise • Gratuit pour les musiciens
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              Ils nous font <span className="text-gradient">confiance</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Découvrez les témoignages de ceux qui utilisent Jam Connexion au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Le Barfly",
                role: "Bar Musical, Montpellier",
                type: "établissement",
                quote: "Depuis Jam Connexion, on a rempli notre programmation pour les 2 prochains mois ! Les musiciens sont pros et la gestion est ultra simple.",
                metric: "15 concerts organisés en 3 mois",
                avatar: "🎪",
                rating: 5
              },
              {
                name: "Thomas L.",
                role: "Guitariste Blues/Rock",
                type: "musicien",
                quote: "J'ai trouvé 12 dates en moins de 2 mois. La plateforme est intuitive et les établissements répondent rapidement. Un vrai game changer !",
                metric: "12 concerts trouvés",
                avatar: "🎸",
                rating: 5
              },
              {
                name: "Café de la Gare",
                role: "Café-Concert, Lyon",
                type: "établissement",
                quote: "La géolocalisation nous permet de trouver des musiciens locaux facilement. Plus besoin de chercher pendant des heures, tout est là !",
                metric: "20+ musiciens contactés",
                avatar: "☕",
                rating: 5
              },
              {
                name: "Sophie M.",
                role: "Chanteuse Jazz",
                type: "musicien",
                quote: "Enfin une plateforme qui comprend les besoins des musiciens ! Profil complet, messagerie directe, et surtout 100% gratuit. Merci Jam Connexion !",
                metric: "8 nouvelles scènes découvertes",
                avatar: "🎤",
                rating: 5
              },
              {
                name: "Marie D.",
                role: "Mélomane, Toulouse",
                type: "melomane",
                quote: "Je ne rate plus aucun concert près de chez moi grâce aux notifications. C'est génial de découvrir de nouveaux artistes locaux !",
                metric: "25+ événements suivis",
                avatar: "🎵",
                rating: 5
              },
              {
                name: "Le Zinc",
                role: "Bistrot Musical, Bordeaux",
                type: "établissement",
                quote: "Nos bœufs du jeudi soir n'ont jamais été aussi animés. On trouve facilement des musiciens motivés qui adorent l'ambiance !",
                metric: "Bœufs hebdomadaires complets",
                avatar: "🍺",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl glassmorphism border border-white/10 hover:border-primary/30 transition-all group hover:scale-105 flex flex-col"
              >
                {/* Header with avatar and info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-3xl flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-semibold text-lg truncate">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{testimonial.role}</p>
                    {/* Stars */}
                    <div className="flex gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-muted-foreground italic mb-4 flex-1">
                  "{testimonial.quote}"
                </p>

                {/* Metric badge */}
                <div className="pt-4 border-t border-white/10">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    testimonial.type === 'établissement' 
                      ? 'bg-primary/20 text-primary' 
                      : testimonial.type === 'musicien'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    📊 {testimonial.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">Rejoignez une communauté active</p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="font-heading font-bold text-3xl text-gradient">500+</div>
                <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
              </div>
              <div>
                <div className="font-heading font-bold text-3xl text-gradient">1000+</div>
                <div className="text-sm text-muted-foreground">Concerts organisés</div>
              </div>
              <div>
                <div className="font-heading font-bold text-3xl text-gradient">4.8/5</div>
                <div className="text-sm text-muted-foreground">Note moyenne</div>
              </div>
            </div>
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
                  <span className="font-heading font-bold text-5xl">12,99€</span>
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

      {/* Melomanes Section */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/5 via-transparent to-pink-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="glassmorphism rounded-3xl p-8 neon-border order-2 lg:order-1">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Music2 className="w-8 h-8 text-purple-400" />
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-purple-400 mb-2">Profil Mélomane</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-heading font-bold text-5xl text-gradient">Gratuit</span>
                </div>
                <p className="text-purple-400 mt-2 font-medium">100% gratuit, toujours</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Inscription gratuite",
                  "Accès à tous les événements",
                  "Notifications des concerts",
                  "Connexion aux établissements",
                  "Suivi de vos participations"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/auth?role=melomane">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full py-6 font-heading font-semibold hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
                >
                  Créer mon profil mélomane
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight">
                Gratuit pour les <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">mélomanes</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Passionnés de musique live ? Découvrez tous les concerts, bœufs et événements musicaux près de chez vous. 
                Participez à la vie musicale locale et ne ratez plus aucun événement !
              </p>
              
              <ul className="space-y-4">
                {[
                  "Voir tous les événements à proximité",
                  "Marquer votre participation aux concerts",
                  "Suivre vos établissements favoris",
                  "Recevoir des notifications (J-3 et Jour J)"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              <span className="text-gradient">Questions Fréquentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "L'inscription est-elle payante ?",
                answer: "L'inscription est gratuite pour les musiciens. Pour les établissements, elle inclut une période d'essai de deux (2) mois, puis 12,99 € TTC par mois."
              },
              {
                question: "Comment fonctionne la mise en relation ?",
                answer: "Les établissements peuvent rechercher des musiciens par style, localisation et disponibilité. Ils peuvent ensuite les contacter directement via la messagerie interne de la plateforme."
              },
              {
                question: "Jam Connexion garantit-il des concerts ?",
                answer: "Non. Jam Connexion est une plateforme de mise en relation uniquement. Nous ne garantissons ni concerts, ni contrats, ni rémunération. Les accords se font directement entre musiciens et établissements."
              },
              {
                question: "Puis-je résilier mon abonnement ?",
                answer: "Oui. L'abonnement est sans engagement et peut être résilié à tout moment. La résiliation prend effet à la date anniversaire du mois suivant."
              },
              {
                question: "Mes données sont-elles protégées ?",
                answer: "Oui. Toutes les données personnelles sont traitées conformément au RGPD. Vous disposez de droits d'accès, de rectification, de suppression et d'opposition."
              },
              {
                question: "Comment contacter le support ?",
                answer: "Pour toute question ou assistance, vous pouvez nous contacter à : jamconnexion@gmail.com"
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="glassmorphism rounded-lg overflow-hidden border border-white/10 hover:border-primary/30 transition-all"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/faq">
              <Button variant="outline" className="group">
                Voir toutes les questions
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
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
              © 2026 Jam Connexion. Tous droits réservés.
            </p>
            
            <div className="flex items-center gap-6">
              <Link to="/pricing" className="text-muted-foreground hover:text-white text-sm transition-colors">
                Tarifs
              </Link>
              <Link to="/faq" className="text-muted-foreground hover:text-white text-sm transition-colors">
                FAQ
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
