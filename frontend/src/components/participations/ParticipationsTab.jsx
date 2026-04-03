import { Button } from "../ui/button";
import { MapPin, CalendarIcon, Check, Download, Link2, Copy, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ReviewModal from "../ui/ReviewModal";
import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ParticipationCard({ participation, token, onReviewSuccess }) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  
  // Vérifier si l'événement est passé
  const isPastEvent = participation.event_date && new Date(participation.event_date) < new Date();
  
  const handleAddToCalendar = () => {
    const event = {
      title: participation.event_title || 
             (participation.event_type === 'jam' ? 'Bœuf musical' :
              participation.event_type === 'concert' ? 'Concert' :
              participation.event_type === 'karaoke' ? 'Karaoké' :
              participation.event_type === 'spectacle' ? 'Spectacle' : 'Événement'),
      location: `${participation.venue_name || 'Établissement'}${participation.venue_city ? ', ' + participation.venue_city : ''}`,
      startDate: new Date(`${participation.event_date}T${participation.event_time || '20:00'}`),
      endDate: new Date(`${participation.event_date}T${participation.event_time || '20:00'}`),
    };
    
    // Add 2 hours to end date
    event.endDate.setHours(event.endDate.getHours() + 2);
    
    // Format dates for ICS
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Create ICS file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jam Connexion//FR',
      'BEGIN:VEVENT',
      `UID:${participation.id}@jamconnexion.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.location}`,
      `DESCRIPTION:Événement musical - ${event.title}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // Create and download ICS file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `event-${participation.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    toast.success('Événement téléchargé ! Ouvrez le fichier pour l\'ajouter à votre calendrier.');
  };

  return (
    <div className="card-venue p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-heading font-semibold text-lg mb-1">
            {participation.event_type === 'jam' ? '🎸 Bœuf musical' :
             participation.event_type === 'concert' ? '🎤 Concert' :
             participation.event_type === 'karaoke' ? '🎤 Karaoké' :
             participation.event_type === 'spectacle' ? '🎭 Spectacle' : 'Événement'}
          </p>
          {participation.event_title && (
            <p className="text-sm font-medium text-foreground/90 mb-1">{participation.event_title}</p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {participation.venue_name || 'Établissement inconnu'}
            {participation.venue_city && ` • ${participation.venue_city}`}
          </p>
          {participation.event_date && (
            <p className="text-xs text-muted-foreground mt-1">
              📅 {new Date(participation.event_date).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
              {participation.event_time && ` à ${participation.event_time}`}
            </p>
          )}
        </div>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1 ml-2">
          <Check className="w-3 h-3" />
          Participant
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Ajouté le {new Date(participation.created_at).toLocaleDateString('fr-FR')}
        </p>
        <div className="flex items-center gap-2">
          {/* Bouton Noter (uniquement si événement passé) */}
          {isPastEvent && !participation.has_reviewed && (
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => setReviewModalOpen(true)}
            >
              <Star className="w-3 h-3 mr-1" />
              Laisser un avis
            </Button>
          )}
          
          {/* Bouton Calendrier */}
          {participation.event_date && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleAddToCalendar}
            >
              <CalendarIcon className="w-3 h-3 mr-1" />
              Ajouter au calendrier
            </Button>
          )}
        </div>
      </div>
      
      {/* Modal de notation */}
      {isPastEvent && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          venue={{
            id: participation.venue_id,
            name: participation.venue_name || 'Établissement'
          }}
          event={{
            id: participation.event_id,
            title: participation.event_title || 
                   (participation.event_type === 'jam' ? 'Bœuf musical' :
                    participation.event_type === 'concert' ? 'Concert' :
                    participation.event_type === 'karaoke' ? 'Karaoké' :
                    participation.event_type === 'spectacle' ? 'Spectacle' : 'Événement'),
            date: new Date(participation.event_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
          }}
          token={token}
          onSuccess={() => {
            setReviewModalOpen(false);
            if (onReviewSuccess) {
              onReviewSuccess();
            }
          }}
        />
      )}
    </div>
  );
}

export default function ParticipationsTab({ participations, token }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState("");

  const handleDownloadAllCalendar = async () => {
    try {
      const response = await axios.get(
        `${API}/musicians/me/participations/calendar.ics`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mes_participations.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('📅 Toutes vos participations ont été téléchargées !');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du calendrier');
    }
  };

  const handleShowSubscriptionUrl = () => {
    const url = `${API}/musicians/me/participations/calendar.ics`;
    setSubscriptionUrl(url);
    setShowExportModal(true);
  };

  const handleCopySubscriptionUrl = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      toast.success('✅ Lien copié ! Collez-le dans les paramètres de votre calendrier.');
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  return (
    <div className="glassmorphism rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="font-heading font-semibold text-lg sm:text-xl">Mes Participations</h2>
        
        {participations.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleDownloadAllCalendar}
              variant="outline"
              size="sm"
              className="rounded-full text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Tout exporter</span>
              <span className="sm:hidden">Exporter</span>
            </Button>
            <Button
              onClick={handleShowSubscriptionUrl}
              variant="default"
              size="sm"
              className="rounded-full text-xs sm:text-sm"
            >
              <Link2 className="w-4 h-4 mr-1 sm:mr-2" />
              S'abonner
            </Button>
          </div>
        )}
      </div>

      {participations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Vous n'avez pas encore marqué de participation</p>
          <p className="text-sm mt-2">Consultez la carte pour découvrir les événements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {participations.map((participation) => (
            <ParticipationCard 
              key={participation.id} 
              participation={participation}
              token={token}
              onReviewSuccess={() => {
                // Optionnel : rafraîchir les participations
                toast.success('Merci pour votre avis ! 🎉');
              }}
            />
          ))}
        </div>
      )}

      {/* Export Calendar Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl glassmorphism border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Exporter vers Google Agenda / iOS
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Option 1: Télécharger */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg mb-1">Option 1 : Télécharger</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Téléchargez toutes vos participations en un seul fichier .ics.
                    <strong> Instantané unique</strong> (ne se met pas à jour automatiquement).
                  </p>
                  <Button onClick={handleDownloadAllCalendar} variant="outline" size="sm" className="rounded-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger mes_participations.ics
                  </Button>
                </div>
              </div>
              <div className="ml-13 text-xs text-muted-foreground bg-blue-500/10 p-3 rounded-lg">
                <p className="font-semibold mb-1">📱 Comment importer :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Google Agenda</strong> : Paramètres → Importer et exporter → Sélectionner le fichier</li>
                  <li><strong>iOS</strong> : Ouvrir le fichier → Ajouter tous les événements</li>
                  <li><strong>Outlook</strong> : Fichier → Ouvrir et exporter → Importer</li>
                </ul>
              </div>
            </div>

            {/* Option 2: URL d'abonnement */}
            <div className="bg-white/5 border border-primary/30 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg mb-1 flex items-center gap-2">
                    Option 2 : S'abonner au calendrier
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Recommandé</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Utilisez ce lien pour vous abonner. Les événements se <strong>synchronisent automatiquement</strong> !
                  </p>
                  
                  {/* URL Box */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/10">
                      <code className="text-xs text-primary break-all">{subscriptionUrl}</code>
                    </div>
                    <Button onClick={handleCopySubscriptionUrl} variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="ml-13 text-xs text-muted-foreground bg-green-500/10 p-3 rounded-lg">
                <p className="font-semibold mb-1">🔄 Comment s'abonner :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Google Agenda</strong> : Autres agendas (+) → À partir de l'URL → Coller le lien</li>
                  <li><strong>iOS</strong> : Réglages → Calendrier → Comptes → Ajouter un compte → Autre → S'abonner à un calendrier</li>
                  <li><strong>Outlook</strong> : Ajouter un calendrier → S'abonner à partir du web → Coller le lien</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => setShowExportModal(false)} variant="ghost" size="sm">
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
