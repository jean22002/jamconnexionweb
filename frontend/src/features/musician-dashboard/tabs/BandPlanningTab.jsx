import React, { useState, useEffect } from 'react';
import { Loader2, CalendarIcon, Check, Clock, MapPin, Music, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import Calendar from "../../../components/Calendar";
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BandPlanningTab({ bandId, bandName, token }) {
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Charger les événements du groupe
  useEffect(() => {
    if (bandId) {
      fetchBandEvents();
    }
  }, [bandId, currentMonth]);

  const fetchBandEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API}/bands/${bandId}/events`,
        { 
          params: {
            month: currentMonth.getMonth() + 1,
            year: currentMonth.getFullYear()
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Organiser les événements par date
      const events = {};
      response.data.forEach(event => {
        const date = event.date;
        if (!events[date]) {
          events[date] = [];
        }
        events[date].push({
          ...event,
          type: event.status === 'confirmed' ? 'confirmed_concert' : 'pending_concert'
        });
      });

      setEventsByDate(events);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement du planning');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (eventsByDate[date] && eventsByDate[date].length > 0) {
      setShowEventModal(true);
    }
  };

  const handleShowEventOnMap = (event) => {
    // TODO: Implémenter l'affichage sur la carte
    console.log('Show event on map:', event);
  };

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-2xl flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Planning du Groupe
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{bandName}</span>
        </div>
      </div>

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground">
          🎵 <span className="font-semibold">Planning partagé</span> - Tous les membres du groupe peuvent voir les concerts et événements
        </p>
      </div>

      {loading ? (
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
            <DialogContent className="max-w-2xl glassmorphism border-white/10">
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
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {event.type === 'confirmed_concert' && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Concert Confirmé
                            </span>
                          )}
                          {event.type === 'pending_concert' && (
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              En Attente
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-heading font-semibold text-lg">{event.venue_name}</h3>
                        
                        <div className="space-y-2 mt-3">
                          {event.start_time && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>{event.start_time}</span>
                              {event.end_time && ` - ${event.end_time}`}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{event.venue_city || 'Ville non renseignée'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Music className="w-4 h-4 text-primary" />
                            <span className="font-medium">{bandName}</span>
                          </div>

                          {event.description && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          )}

                          {event.payment_method && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                                {event.payment_method === 'guso' ? '🎫 GUSO' : 
                                 event.payment_method === 'facture' ? '📄 Facture' : 
                                 '🎸 Promotion'}
                              </span>
                              {event.amount && event.payment_method !== 'promotion' && (
                                <span className="text-sm font-semibold">{event.amount}€</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowEventOnMap(event)}
                        className="rounded-full"
                      >
                        <MapPin className="w-3 h-3 mr-2" />
                        Voir sur la carte
                      </Button>
                    </div>
                  </div>
                ))}

                {selectedDate && (!eventsByDate[selectedDate] || eventsByDate[selectedDate].length === 0) && (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-muted-foreground">Aucun événement ce jour-là</p>
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
