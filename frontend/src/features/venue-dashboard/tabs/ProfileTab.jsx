import { Button } from "../../../components/ui/button";
import { Edit, MapPin, Phone, Mail, Globe, Facebook, Instagram, Clock, Music, Mic, Speaker, Lightbulb, Guitar } from "lucide-react";
import NotificationPreferences from "../../../components/NotificationPreferences";

export default function ProfileTab({ 
  venue,
  token,
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

      {/* Technical Equipment Section */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="font-semibold text-lg mb-4">🎤 Équipements Techniques</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stage */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-primary" />
              <p className="font-medium">Scène</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {venue.has_stage ? (
                <>
                  <p>✅ Scène disponible</p>
                  {venue.stage_size && <p className="ml-4">Taille : {venue.stage_size}</p>}
                </>
              ) : (
                <p>❌ Pas de scène</p>
              )}
            </div>
          </div>

          {/* PA System */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Speaker className="w-5 h-5 text-primary" />
              <p className="font-medium">Sonorisation</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {venue.has_pa_system ? (
                <>
                  <p>✅ Système de sonorisation (PA)</p>
                  {venue.pa_mixer_name && <p className="ml-4">Table : {venue.pa_mixer_name}</p>}
                  {venue.pa_speakers_name && <p className="ml-4">Enceintes : {venue.pa_speakers_name}</p>}
                  {venue.pa_power && <p className="ml-4">Puissance : {venue.pa_power}</p>}
                </>
              ) : (
                <p>❌ Pas de sono</p>
              )}
              {venue.has_sound_engineer && (
                <p className="mt-2">👨‍🎤 Ingénieur son disponible</p>
              )}
            </div>
          </div>

          {/* Lights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <p className="font-medium">Lumières</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {venue.has_lights ? (
                <>
                  <p>✅ Éclairage scénique</p>
                  {venue.has_auto_light && <p className="ml-4">• Jeu automatique</p>}
                  {venue.has_light_table && <p className="ml-4">• Table lumière</p>}
                </>
              ) : (
                <p>❌ Pas d'éclairage spécifique</p>
              )}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Guitar className="w-5 h-5 text-primary" />
              <p className="font-medium">Équipements disponibles</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {venue.equipment && venue.equipment.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {venue.equipment.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p>Aucun équipement renseigné</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Music Styles & Schedule */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Music Styles */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-primary" />
              <p className="font-medium">Styles musicaux</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {venue.music_styles && venue.music_styles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {venue.music_styles.map((style, i) => (
                    <span key={i} className="px-2 py-1 bg-secondary/20 rounded-full text-xs">
                      {style}
                    </span>
                  ))}
                </div>
              ) : (
                <p>Aucun style renseigné</p>
              )}
            </div>
          </div>

          {/* Opening Hours */}
          {venue.opening_hours && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <p className="font-medium">Horaires d'ouverture</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{venue.opening_hours}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <NotificationPreferences token={token} />
      </div>
    </div>
  );
}
