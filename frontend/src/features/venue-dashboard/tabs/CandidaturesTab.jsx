import { Button } from "../../../components/ui/button";
import { CalendarIcon, Users } from "lucide-react";

export default function CandidaturesTab({
  planningSlots,
  applications,
  handleSlotCardClick,
  setViewingApplications,
  fetchApplications
}) {
  return (
    <div className="space-y-6">
      {/* Liste des créneaux ouverts */}
      <div className="glassmorphism rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-xl mb-4">📅 Créneaux ouverts aux candidatures</h2>
        
        {planningSlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun créneau ouvert pour le moment</p>
            <p className="text-sm mt-2">Allez dans l'onglet "Planning" et cliquez sur un jour libre (bleu) dans le calendrier pour créer un créneau</p>
          </div>
        ) : (
          <div className="space-y-4">
            {planningSlots.map((slot) => (
              <div 
                key={slot.id} 
                className="p-5 border border-white/10 rounded-xl hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => handleSlotCardClick(slot)}
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
                      e.stopPropagation();
                      setViewingApplications(slot.id);
                      fetchApplications(slot.id);
                    }}
                    variant="outline"
                    className="rounded-full gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Candidatures ({applications[slot.id]?.length || 0})
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
