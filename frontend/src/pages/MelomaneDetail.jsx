import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { 
  Music, ArrowLeft, Loader2, User, MapPin, Heart,
  Globe, Instagram, Facebook, Twitter
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MelomaneDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [melomane, setMelomane] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMelomane = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/melomanes/${id}`);
      setMelomane(response.data);
    } catch (error) {
      console.error("Error fetching melomane:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMelomane();
  }, [fetchMelomane]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!melomane) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <User className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Profil mélomane non trouvé</p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90 rounded-full">Retour</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="melomane-detail">
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
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        {/* Profile Header */}
        <div className="glassmorphism rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {melomane.profile_picture ? (
              <img 
                src={melomane.profile_picture} 
                alt={melomane.pseudo} 
                className="w-32 h-32 rounded-full object-cover neon-border" 
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Heart className="w-16 h-16 text-primary" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-heading font-bold text-3xl mb-2">{melomane.pseudo}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground mb-4">
                {melomane.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {melomane.city}
                  </span>
                )}
              </div>

              {/* Bio */}
              {melomane.bio && (
                <p className="text-muted-foreground mb-4">{melomane.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {melomane.events_attended > 0 && (
                  <div className="px-4 py-2 bg-primary/10 rounded-full">
                    <span className="text-sm font-semibold text-primary">
                      {melomane.events_attended} événement{melomane.events_attended > 1 ? 's' : ''} assisté{melomane.events_attended > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Styles */}
        {melomane.favorite_styles && melomane.favorite_styles.length > 0 && (
          <div className="glassmorphism rounded-2xl p-6 mb-8">
            <h2 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Styles musicaux préférés
            </h2>
            <div className="flex flex-wrap gap-2">
              {melomane.favorite_styles.map((style, idx) => (
                <span 
                  key={idx} 
                  className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(melomane.facebook || melomane.instagram || melomane.twitter) && (
          <div className="glassmorphism rounded-2xl p-6">
            <h2 className="font-heading font-semibold text-xl mb-4">Réseaux sociaux</h2>
            <div className="flex flex-wrap gap-3">
              {melomane.facebook && (
                <a 
                  href={melomane.facebook.startsWith('http') ? melomane.facebook : `https://facebook.com/${melomane.facebook}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-full transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
              )}
              {melomane.instagram && (
                <a 
                  href={melomane.instagram.startsWith('http') ? melomane.instagram : `https://instagram.com/${melomane.instagram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 rounded-full transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              )}
              {melomane.twitter && (
                <a 
                  href={melomane.twitter.startsWith('http') ? melomane.twitter : `https://twitter.com/${melomane.twitter}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 rounded-full transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
