import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { 
  Music, ArrowLeft, Loader2, User, Guitar, MapPin, Calendar,
  Globe, Instagram, Facebook, Youtube, UserPlus, Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBadgeAutoCheck } from "../hooks/useBadgeAutoCheck";
import { toast } from "sonner";
import LazyImage from "../components/LazyImage";
import UserBadges from "../components/UserBadges";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MusicianDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [musician, setMusician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState(null);

  const fetchMusician = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/${id}`);
      
      // Reconstruire les URLs complètes pour les images
      const musicianData = {
        ...response.data,
        profile_image: response.data.profile_image
          ? (response.data.profile_image.startsWith('http')
              ? response.data.profile_image
              : `${API}${response.data.profile_image}`)
          : "",
        cover_image: response.data.cover_image
          ? (response.data.cover_image.startsWith('http')
              ? response.data.cover_image
              : `${API}${response.data.cover_image}`)
          : ""
      };
      
      setMusician(musicianData);
      
      // Check if this musician has an active participation
      // We need to fetch from user-specific endpoint if viewing own profile
      // Otherwise check if they have a participation visible publicly
      try {
        // Try to fetch musician's user participation (works for any musician)
        const participationRes = await axios.get(`${API}/musicians/${id}/current-participation`);
        setParticipation(participationRes.data);
      } catch (err) {
        // No active participation
        setParticipation(null);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMusician();
  }, [fetchMusician]);

  const sendFriendRequest = async () => {
    if (!token) {
      toast.error("Connectez-vous pour ajouter en ami");
      return;
    }
    try {
      await axios.post(`${API}/friends/request`, { to_user_id: musician.user_id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Demande envoyée!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!musician) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <User className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Musicien non trouvé</p>
        <Link to="/"><Button className="bg-primary hover:bg-primary/90 rounded-full">Retour</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="musician-detail">
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
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6 cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* Profile Header */}
        <div className="glassmorphism rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {musician.profile_image ? (
              <LazyImage 
                src={musician.profile_image} 
                alt={musician.pseudo || "Musicien"} 
                className="w-32 h-32 rounded-full object-cover neon-border" 
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <User className="w-16 h-16 text-primary" />
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-heading font-bold text-3xl mb-2">{musician.pseudo}</h1>
              
              {musician.age && <p className="text-muted-foreground">{musician.age} ans</p>}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                {musician.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /><span>{musician.city}</span>
                  </div>
                )}
                {musician.experience_years && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" /><span>{musician.experience_years} ans d'expérience</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" /><span>{musician.friends_count} ami(s)</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                {musician.facebook && <a href={musician.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white"><Facebook className="w-5 h-5" /></a>}
                {musician.instagram && <a href={`https://instagram.com/${musician.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white"><Instagram className="w-5 h-5" /></a>}
                {musician.youtube && <a href={musician.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white"><Youtube className="w-5 h-5" /></a>}
                {musician.website && <a href={musician.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white"><Globe className="w-5 h-5" /></a>}
              </div>
            </div>
            
            {user?.role === "musician" && user?.id !== musician.user_id && (
              <Button onClick={sendFriendRequest} className="bg-primary hover:bg-primary/90 rounded-full gap-2">
                <UserPlus className="w-4 h-4" /> Ajouter
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bio & Instruments */}
          <div className="space-y-6">
            {/* Badges Section */}
            {token && (
              <div className="glassmorphism rounded-2xl p-6">
                <UserBadges userId={musician.user_id} token={token} limit={6} />
              </div>
            )}
            
            {musician.bio && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4">Bio</h2>
                <p className="text-muted-foreground leading-relaxed">{musician.bio}</p>
              </div>
            )}

            {musician.instruments?.length > 0 && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                  <Guitar className="w-5 h-5 text-primary" /> Instruments
                </h2>
                <div className="flex flex-wrap gap-2">
                  {musician.instruments.map((inst, i) => (
                    <span key={i} className="px-4 py-2 bg-primary/20 text-primary rounded-full">{inst}</span>
                  ))}
                </div>
              </div>
            )}

            {musician.music_styles?.length > 0 && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4">Styles musicaux</h2>
                <div className="flex flex-wrap gap-2">
                  {musician.music_styles.map((style, i) => (
                    <span key={i} className="px-4 py-2 bg-secondary/20 text-secondary rounded-full">{style}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Band & Concerts */}
          <div className="space-y-6">
            {musician.has_band && musician.band?.name && (
              <div className="glassmorphism rounded-2xl p-6 neon-border">
                <h2 className="font-heading font-semibold text-lg mb-4">Mon Groupe</h2>
                <div className="flex items-center gap-4">
                  {musician.band.photo ? (
                    <LazyImage 
                      src={musician.band.photo} 
                      alt={musician.band.name} 
                      className="w-20 h-20 rounded-xl object-cover" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Music className="w-10 h-10 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading font-semibold text-xl">{musician.band.name}</h3>
                    <div className="flex gap-3 mt-2">
                      {musician.band.facebook && <a href={musician.band.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="w-4 h-4 text-blue-500" /></a>}
                      {musician.band.instagram && <a href={musician.band.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-4 h-4 text-pink-500" /></a>}
                      {musician.band.youtube && <a href={musician.band.youtube} target="_blank" rel="noopener noreferrer"><Youtube className="w-4 h-4 text-red-500" /></a>}
                      {musician.band.website && <a href={musician.band.website} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4 text-white" /></a>}
                    </div>
                    {musician.band.bandcamp && (
                      <a href={musician.band.bandcamp} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline mt-2 block">
                        Bandcamp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {musician.concerts?.length > 0 && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Concerts à venir
                </h2>
                <div className="space-y-3">
                  {musician.concerts.map((concert, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium">{concert.date}</p>
                      <p className="text-sm text-muted-foreground">{concert.venue_name || "Lieu TBA"} - {concert.city}</p>
                      {concert.description && <p className="text-xs text-muted-foreground mt-1">{concert.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
