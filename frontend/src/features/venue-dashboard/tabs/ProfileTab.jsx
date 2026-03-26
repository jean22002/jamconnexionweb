import { Button } from "../../../components/ui/button";
import { Edit, MapPin, Phone, Mail, Globe, Facebook, Instagram, Clock } from "lucide-react";

export default function ProfileTab({ 
  venue, 
  handleOpenProfileDialog 
}) {
  if (!venue) {
    return (
      <div className="glassmorphism rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl mb-2">{venue.name}</h2>
          <p className="text-muted-foreground">{venue.venue_type || 'Établissement'}</p>
        </div>
        <Button 
          onClick={handleOpenProfileDialog}
          variant="outline"
          className="rounded-full"
        >
          <Edit className="w-4 h-4 mr-2" />
          Éditer le profil
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg mb-3">📞 Contact</h3>
          {venue.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-sm text-muted-foreground">{venue.address}</p>
                <p className="text-sm text-muted-foreground">{venue.postal_code} {venue.city}</p>
              </div>
            </div>
          )}
          {venue.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Téléphone</p>
                <p className="text-sm text-muted-foreground">{venue.phone}</p>
              </div>
            </div>
          )}
          {venue.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{venue.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description & Links */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg mb-3">ℹ️ Informations</h3>
          {venue.description && (
            <div>
              <p className="font-medium mb-2">Description</p>
              <p className="text-sm text-muted-foreground">{venue.description}</p>
            </div>
          )}
          {venue.capacity && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Capacité</p>
                <p className="text-sm text-muted-foreground">{venue.capacity} personnes</p>
              </div>
            </div>
          )}
          
          {/* Social Links */}
          <div className="flex gap-3 mt-4">
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                <Globe className="w-5 h-5" />
              </a>
            )}
            {venue.facebook && (
              <a href={venue.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {venue.instagram && (
              <a href={venue.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                <Instagram className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
