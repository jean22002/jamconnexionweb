import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "../components/ui/button";
import { 
  Music, MapPin, Globe, Instagram, Facebook, Phone, 
  ArrowLeft, Loader2, Check, Clock, Guitar, Mic2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const venueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function VenueDetail() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await axios.get(`${API}/venues/${id}`);
        setVenue(response.data);
      } catch (error) {
        console.error("Error fetching venue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Mic2 className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Établissement non trouvé</p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90 rounded-full">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="venue-detail">
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
        <Link 
          to="/musician" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la carte
        </Link>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8">
          <div 
            className="h-64 md:h-80"
            style={{
              backgroundImage: venue.cover_image 
                ? `url(${venue.cover_image})`
                : `url(https://images.pexels.com/photos/3784221/pexels-photo-3784221.jpeg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {venue.subscription_status === "active" && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Vérifié
                </span>
              )}
              {venue.has_stage && (
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  Scène
                </span>
              )}
              {venue.has_sound_engineer && (
                <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs rounded-full">
                  Ingé son
                </span>
              )}
            </div>
            
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">{venue.name}</h1>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{venue.address}, {venue.postal_code} {venue.city}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            {venue.description && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4">À propos</h2>
                <p className="text-muted-foreground leading-relaxed">{venue.description}</p>
              </div>
            )}

            {/* Music Styles */}
            {venue.music_styles?.length > 0 && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4">Styles musicaux</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.music_styles.map((style, i) => (
                    <span key={i} className="px-4 py-2 bg-primary/20 text-primary rounded-full">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jam Days */}
            {venue.jam_days?.length > 0 && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  Jours de Jam
                </h2>
                <div className="flex flex-wrap gap-2">
                  {venue.jam_days.map((day, i) => (
                    <span key={i} className="px-4 py-2 bg-secondary/20 text-secondary rounded-full">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {venue.equipment?.length > 0 && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                  <Guitar className="w-5 h-5 text-primary" />
                  Matériel disponible
                </h2>
                <div className="flex flex-wrap gap-2">
                  {venue.equipment.map((item, i) => (
                    <span key={i} className="px-4 py-2 bg-muted rounded-full text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {venue.opening_hours && (
              <div className="glassmorphism rounded-2xl p-6">
                <h2 className="font-heading font-semibold text-lg mb-4">Horaires</h2>
                <p className="text-muted-foreground">{venue.opening_hours}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <div className="h-64 rounded-2xl overflow-hidden neon-border">
              <MapContainer 
                center={[venue.latitude, venue.longitude]} 
                zoom={15} 
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[venue.latitude, venue.longitude]} icon={venueIcon} />
              </MapContainer>
            </div>

            {/* Contact */}
            <div className="glassmorphism rounded-2xl p-6 space-y-4">
              <h2 className="font-heading font-semibold text-lg">Contact</h2>
              
              {venue.phone && (
                <a 
                  href={`tel:${venue.phone}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <span>{venue.phone}</span>
                </a>
              )}
              
              {venue.website && (
                <a 
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors"
                >
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="truncate">Site web</span>
                </a>
              )}
              
              {venue.facebook && (
                <a 
                  href={venue.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-500" />
                  <span>Facebook</span>
                </a>
              )}
              
              {venue.instagram && (
                <a 
                  href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span>{venue.instagram}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
