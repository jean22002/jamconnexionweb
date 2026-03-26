import { Loader2 } from "lucide-react";
import Calendar from "../../../components/Calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import TimeSelect from "../../../components/TimeSelect";

export default function PlanningTab({
  loadingEvents,
  currentMonth,
  setCurrentMonth,
  handleDateClick,
  bookedDates,
  eventsByDate,
  concerts,
  jams,
  karaokes,
  spectacles,
  planningSlots,
  showPlanningModal,
  setShowPlanningModal,
  selectedDate,
  planningForm,
  setPlanningForm,
  handleCreatePlanningSlot,
  showApplicationsModal,
  setShowApplicationsModal,
  selectedSlot,
  applications,
  handleAcceptApplication,
  handleRejectApplication
}) {
  if (loadingEvents) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Légendes du calendrier */}
      <div className="glassmorphism rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Légende :</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500/20 border-2 border-green-500"></div>
            <span className="text-sm">Concert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-500/20 border-2 border-purple-500"></div>
            <span className="text-sm">Bœuf</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-pink-500/20 border-2 border-pink-500"></div>
            <span className="text-sm">Karaoké</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/20 border-2 border-cyan-500"></div>
            <span className="text-sm">Spectacle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-500/20 border-2 border-yellow-500"></div>
            <span className="text-sm">Ouvert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500/20 border-2 border-orange-500"></div>
            <span className="text-sm">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-500/20 border-2 border-red-500"></div>
            <span className="text-sm">Complet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500/20 border-2 border-blue-500"></div>
            <span className="text-sm">Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-500/20 border-2 border-gray-500"></div>
            <span className="text-sm">Passé</span>
          </div>
        </div>
      </div>

      {/* Calendrier Visuel */}
      <Calendar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onDateClick={handleDateClick}
        bookedDates={bookedDates}
        eventsByDate={eventsByDate}
        concerts={concerts}
        jams={jams}
        karaokes={karaokes}
        spectacles={spectacles}
        planningSlots={planningSlots}
      />

      {/* Modal de création de créneau - Simplified for extraction */}
      <Dialog open={showPlanningModal} onOpenChange={setShowPlanningModal}>
        <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un créneau ouvert aux groupes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm">
                📅 <strong>Date sélectionnée:</strong> {selectedDate && selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Heure du concert</Label>
              <TimeSelect
                value={planningForm.time}
                onChange={(value) => setPlanningForm({ ...planningForm, time: value })}
                placeholder="Heure du concert"
              />
            </div>

            <div className="space-y-2">
              <Label>Titre de l'événement (optionnel)</Label>
              <Input
                type="text"
                placeholder="Ex: Soirée Rock, Concert acoustique..."
                value={planningForm.title}
                onChange={(e) => setPlanningForm({ ...planningForm, title: e.target.value })}
                className="bg-black/20 border-white/10"
              />
            </div>

            <Button
              onClick={handleCreatePlanningSlot}
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Créer le créneau
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des candidatures - Simplified */}
      <Dialog open={showApplicationsModal} onOpenChange={setShowApplicationsModal}>
        <DialogContent className="glassmorphism border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidatures pour le créneau</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedSlot && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm">
                  📅 {new Date(selectedSlot.date).toLocaleDateString('fr-FR')} à {selectedSlot.time}
                </p>
                {selectedSlot.title && <p className="text-sm mt-1">🎵 {selectedSlot.title}</p>}
              </div>
            )}

            {applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune candidature pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-black/20 rounded-xl border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{app.band_name || app.musician_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{app.message}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptApplication(app.id)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Accepter
                        </Button>
                        <Button
                          onClick={() => handleRejectApplication(app.id)}
                          size="sm"
                          variant="destructive"
                        >
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
