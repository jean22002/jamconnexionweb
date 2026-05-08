import { Loader2, CalendarIcon, Check, Clock, MapPin, Music } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import Calendar from "../../../components/Calendar";

export default function PlanningTab({
  loadingCalendar,
  currentMonth,
  setCurrentMonth,
  handleDateClick,
  eventsByDate,
  selectedDate,
  showEventModal,
  setShowEventModal,
  handleShowEventOnMap
}) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-2xl mb-6 flex items-center gap-2">
        <CalendarIcon className="w-6 h-6 text-primary" />
        Mon Planning
      </h2>

      {loadingCalendar ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du planning...</p>
        </div>
      ) : (
        <>
          <Calendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDateClick={handleDateClick}
            bookedDates={[]}
            eventsByDate={eventsByDate}
            concerts={[]}
            jams={[]}
            karaokes={[]}
            spectacles={[]}
            planningSlots={[]}
            myApplications={[]}
          />

          {/* Event Details Modal */}
          <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Événements du {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {selectedDate && eventsByDate[selectedDate]?.map((event, idx) => (
                  <div key={idx} className="card-venue p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {event.type === 'accepted_application' && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Candidature Acceptée
                            </span>
                          )}
                          {event.type === 'confirmed_concert' && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              Concert Confirmé
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-heading font-semibold text-lg">{event.venue_name}</h3>
                        
                        <div className="space-y-2 mt-3">
                          {event.time && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>
                              {event.venue_city}
                              {event.venue_department && ` (${event.venue_department})`}
                            </span>
                          </div>
                          
                          {event.band_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Music className="w-4 h-4 text-primary" />
                              <span className="font-medium">{event.band_name}</span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-3">
                            {event.description}
                          </p>
                        )}

                        {/* Bouton Voir sur la carte */}
                        {event.venue_latitude && event.venue_longitude && (
                          <div className="mt-4 pt-3 border-t border-white/10">
                            <Button
                              onClick={() => handleShowEventOnMap(event)}
                              variant="outline"
                              className="w-full rounded-full gap-2"
                            >
                              <MapPin className="w-4 h-4" />
                              Voir sur la carte
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {selectedDate && (!eventsByDate[selectedDate] || eventsByDate[selectedDate].length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun événement ce jour</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
