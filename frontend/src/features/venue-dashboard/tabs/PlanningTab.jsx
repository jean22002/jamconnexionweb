import { Loader2 } from "lucide-react";
import Calendar from "../../../components/Calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import TimeSelect from "../../../components/TimeSelect";

// Liste complète des styles musicaux
const MUSIC_STYLES = [
  "Rock", "Pop", "Jazz", "Blues", "Reggae", "Funk", "Soul",
  "Country", "Folk", "Chanson française", "Metal", "Punk",
  "Électro", "Hip-Hop", "Rap", "R&B", "Variété", "Acoustique",
  "Classique", "World", "Latino", "Afro", "Celtic", "Autre"
];

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

      {/* Modal de création de créneau - Complet */}
      <Dialog open={showPlanningModal} onOpenChange={setShowPlanningModal}>
        <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un créneau ouvert aux groupes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 mt-4">
            {/* Date sélectionnée */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm">
                📅 <strong>Date sélectionnée:</strong> {selectedDate && selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Heure */}
            <div className="space-y-2">
              <Label>Heure du concert</Label>
              <TimeSelect
                value={planningForm.time}
                onChange={(value) => setPlanningForm({ ...planningForm, time: value })}
                placeholder="Heure du concert"
              />
            </div>

            {/* Titre */}
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

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (optionnelle)</Label>
              <Textarea
                placeholder="Décrivez l'ambiance, le contexte, vos attentes..."
                value={planningForm.description || ''}
                onChange={(e) => setPlanningForm({ ...planningForm, description: e.target.value })}
                className="bg-black/20 border-white/10 min-h-[80px]"
              />
            </div>

            {/* Styles musicaux recherchés */}
            <div className="space-y-2">
              <Label>Styles musicaux recherchés</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-black/20 rounded-lg border border-white/10 max-h-48 overflow-y-auto">
                {MUSIC_STYLES.map((style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={`style-${style}`}
                      checked={planningForm.music_styles?.includes(style)}
                      onCheckedChange={(checked) => {
                        const current = planningForm.music_styles || [];
                        setPlanningForm({
                          ...planningForm,
                          music_styles: checked
                            ? [...current, style]
                            : current.filter(s => s !== style)
                        });
                      }}
                    />
                    <label htmlFor={`style-${style}`} className="text-sm cursor-pointer">
                      {style}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Rémunération proposée */}
            <div className="space-y-2">
              <Label>Rémunération proposée (optionnelle)</Label>
              <Input
                type="text"
                placeholder="Ex: 50€, 100€, Au chapeau, Gratuit, À négocier..."
                value={planningForm.payment || ''}
                onChange={(e) => setPlanningForm({ ...planningForm, payment: e.target.value })}
                className="bg-black/20 border-white/10"
              />
            </div>

            {/* Fréquentation attendue */}
            <div className="space-y-2">
              <Label>Fréquentation attendue (optionnelle)</Label>
              <Select
                value={planningForm.expected_attendance || ''}
                onValueChange={(value) => setPlanningForm({ ...planningForm, expected_attendance: value })}
              >
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="< 50 personnes">Moins de 50 personnes</SelectItem>
                  <SelectItem value="50-100">50-100 personnes</SelectItem>
                  <SelectItem value="100-200">100-200 personnes</SelectItem>
                  <SelectItem value="> 200">Plus de 200 personnes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catégories d'artistes recherchés */}
            <div className="space-y-2">
              <Label>Catégories d'artistes recherchés</Label>
              <div className="flex flex-wrap gap-3 p-3 bg-black/20 rounded-lg border border-white/10">
                {['Solo', 'Duo', 'Trio', 'Groupe (4+)', 'Tous'].map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={planningForm.artist_categories?.includes(category)}
                      onCheckedChange={(checked) => {
                        const current = planningForm.artist_categories || [];
                        setPlanningForm({
                          ...planningForm,
                          artist_categories: checked
                            ? [...current, category]
                            : current.filter(c => c !== category)
                        });
                      }}
                    />
                    <label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Nombre de groupes recherchés */}
            <div className="space-y-2">
              <Label>Nombre de groupes recherchés</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 1, 2, 3..."
                value={planningForm.num_bands_needed || 1}
                onChange={(e) => setPlanningForm({ ...planningForm, num_bands_needed: parseInt(e.target.value) || 1 })}
                className="bg-black/20 border-white/10"
              />
            </div>

            {/* Type de candidature */}
            <div className="space-y-2">
              <Label>Type de candidature</Label>
              <Select
                value={planningForm.application_type || 'bands'}
                onValueChange={(value) => setPlanningForm({ ...planningForm, application_type: value })}
              >
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bands">Groupes uniquement</SelectItem>
                  <SelectItem value="solo">Solo uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GUSO - Contrat GUSO */}
            <div className="space-y-3 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_guso"
                  checked={planningForm.is_guso || false}
                  onCheckedChange={(checked) => setPlanningForm({ ...planningForm, is_guso: checked })}
                />
                <label htmlFor="is_guso" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  💼 Concert avec contrat GUSO
                  <span className="text-xs text-muted-foreground font-normal">(affiché sur la carte)</span>
                </label>
              </div>
            </div>

            {/* Restauration (Catering) */}
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_catering"
                  checked={planningForm.has_catering || false}
                  onCheckedChange={(checked) => setPlanningForm({ ...planningForm, has_catering: checked })}
                />
                <label htmlFor="has_catering" className="text-sm font-semibold cursor-pointer">
                  🍽️ Restauration proposée
                </label>
              </div>

              {planningForm.has_catering && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-2">
                    <Label className="text-xs">Nombre de boissons offertes</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 2, 3..."
                      value={planningForm.catering_drinks || ''}
                      onChange={(e) => setPlanningForm({ ...planningForm, catering_drinks: parseInt(e.target.value) || 0 })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="catering_respect"
                      checked={planningForm.catering_respect || false}
                      onCheckedChange={(checked) => setPlanningForm({ ...planningForm, catering_respect: checked })}
                    />
                    <label htmlFor="catering_respect" className="text-sm cursor-pointer">
                      Repas respectueux (végétarien/vegan)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="catering_tbd"
                      checked={planningForm.catering_tbd || false}
                      onCheckedChange={(checked) => setPlanningForm({ ...planningForm, catering_tbd: checked })}
                    />
                    <label htmlFor="catering_tbd" className="text-sm cursor-pointer">
                      À définir avec l'artiste
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Hébergement (Accommodation) */}
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_accommodation"
                  checked={planningForm.has_accommodation || false}
                  onCheckedChange={(checked) => setPlanningForm({ ...planningForm, has_accommodation: checked })}
                />
                <label htmlFor="has_accommodation" className="text-sm font-semibold cursor-pointer">
                  🏠 Hébergement proposé
                </label>
              </div>

              {planningForm.has_accommodation && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-2">
                    <Label className="text-xs">Capacité d'hébergement (nombre de personnes)</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 2, 4, 6..."
                      value={planningForm.accommodation_capacity || ''}
                      onChange={(e) => setPlanningForm({ ...planningForm, accommodation_capacity: parseInt(e.target.value) || 0 })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accommodation_tbd"
                      checked={planningForm.accommodation_tbd || false}
                      onCheckedChange={(checked) => setPlanningForm({ ...planningForm, accommodation_tbd: checked })}
                    />
                    <label htmlFor="accommodation_tbd" className="text-sm cursor-pointer">
                      À définir avec l'artiste
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de création */}
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

            {!applications || applications.length === 0 ? (
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
