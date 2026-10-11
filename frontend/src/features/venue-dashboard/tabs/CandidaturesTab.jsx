import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import { useState, useMemo } from "react";
import { CalendarIcon, Users } from "lucide-react";

export default function CandidaturesTab({
  planningSlots,
  applications,
  handleSlotCardClick,
  setViewingApplications,
  fetchApplications
}) {
  // Build 220 — Switch "Afficher uniquement les créneaux avec plateaux"
  const [onlyPlateau, setOnlyPlateau] = useState(false);

  const visibleSlots = useMemo(() => {
    if (!onlyPlateau) return planningSlots;
    return (planningSlots || []).filter((s) => (s.plateau_count ?? 0) > 0);
  }, [planningSlots, onlyPlateau]);

  const totalPlateauSlots = useMemo(
    () => (planningSlots || []).filter((s) => (s.plateau_count ?? 0) > 0).length,
    [planningSlots]
  );

  return (
    <div className="space-y-6">
      {/* Liste des créneaux ouverts */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="font-heading font-semibold text-xl">📅 Créneaux ouverts aux candidatures</h2>
          <div className="flex items-center gap-3">
            <Label htmlFor="only-plateau-switch" className="text-sm cursor-pointer flex items-center gap-2">
              🎸 Afficher uniquement les plateaux
              <span className="text-xs text-muted-foreground">
                ({totalPlateauSlots} créneau{totalPlateauSlots > 1 ? "x" : ""})
              </span>
            </Label>
            <Switch
              id="only-plateau-switch"
              checked={onlyPlateau}
              onCheckedChange={setOnlyPlateau}
              data-testid="only-plateau-switch"
            />
          </div>
        </div>

        {visibleSlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            {onlyPlateau ? (
              <>
                <p>Aucun créneau n'a reçu de candidature plateau pour le moment</p>
                <p className="text-sm mt-2">Décoche le filtre pour voir tous les créneaux ouverts</p>
              </>
            ) : (
              <>
                <p>Aucun créneau ouvert pour le moment</p>
                <p className="text-sm mt-2">Allez dans l'onglet "Planning" et cliquez sur un jour libre (bleu) dans le calendrier pour créer un créneau</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSlots.map((slot) => (
              <div 
                key={slot.id} 
                className={`p-5 border rounded-xl transition-all cursor-pointer ${
                  (slot.plateau_count ?? 0) > 0
                    ? "border-purple-500/40 hover:border-purple-500/70 bg-gradient-to-br from-purple-500/5 to-transparent"
                    : "border-white/10 hover:border-primary/30"
                }`}
                onClick={() => handleSlotCardClick(slot)}
                data-testid={`candidature-slot-${slot.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full font-semibold">
                        {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {slot.time && (
                        <span className="text-sm text-muted-foreground">🕐 {slot.time}</span>
                      )}
                      {slot.is_open ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Ouvert</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Fermé</span>
                      )}
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {slot.accepted_bands_count || 0}/{slot.num_bands_needed || 1} groupe{(slot.num_bands_needed || 1) > 1 ? 's' : ''}
                      </span>
                      {slot.accepts_plateaus && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs rounded-full font-semibold" data-testid={`slot-accepts-plateaus-badge-${slot.id}`}>
                          🎸 Ouvert aux plateaux
                        </span>
                      )}
                      {/* Build 220 — Badge si le slot a reçu au moins 1 candidature plateau */}
                      {(slot.plateau_count ?? 0) > 0 && (
                        <span
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs rounded-full font-semibold"
                          data-testid={`plateau-count-badge-${slot.id}`}
                        >
                          🎸 {slot.plateau_count} plateau{slot.plateau_count > 1 ? "x" : ""}
                        </span>
                      )}
                    </div>
                    
                    {slot.title && (
                      <h3 className="font-heading font-semibold text-lg mb-2">{slot.title}</h3>
                    )}
                    
                    {slot.description && (
                      <p className="text-sm text-muted-foreground mb-3">{slot.description}</p>
                    )}
                    
                    {slot.expected_band_style && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Style recherché:</span>{' '}
                        <span className="text-primary font-medium">{slot.expected_band_style}</span>
                      </p>
                    )}
                    
                    {slot.expected_attendance > 0 && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Affluence estimée:</span>{' '}
                        <span className="font-medium">{slot.expected_attendance} personnes</span>
                      </p>
                    )}
                    
                    {slot.payment && (
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Rémunération:</span>{' '}
                        <span className="text-green-400 font-medium">{slot.payment}</span>
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={(e) => {
                      // Build 152.27 — même comportement que le click sur la carte :
                      // handleSlotCardClick ouvre la modal (setShowApplicationsModal)
                      // ce que ce bouton ne faisait pas → rien ne se passait au clic
                      e.stopPropagation();
                      handleSlotCardClick(slot);
                    }}
                    variant="outline"
                    className="rounded-full gap-2"
                    data-testid={`applications-button-${slot.id}`}
                  >
                    <Users className="w-4 h-4" />
                    {/* Utilise le compteur retourné par /api/planning (instantané)
                        et fallback sur les applications déjà chargées si dispo. */}
                    Candidatures ({applications[slot.id]?.length ?? slot.applications_count ?? 0})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
