import { Button } from "../ui/button";
import { MapPin, CalendarIcon, Check } from "lucide-react";
import toast from "react-hot-toast";

function ParticipationCard({ participation }) {
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
  );
}

export default function ParticipationsTab({ participations }) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-xl mb-4">Mes Participations</h2>
      {participations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Vous n'avez pas encore marqué de participation</p>
          <p className="text-sm mt-2">Consultez la carte pour découvrir les événements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {participations.map((participation) => (
            <ParticipationCard key={participation.id} participation={participation} />
          ))}
        </div>
      )}
    </div>
  );
}
