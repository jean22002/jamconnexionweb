import { Button } from "../../../components/ui/button";
import { Plus, Calendar } from "lucide-react";

export default function BandTab({ profileForm, handleOpenBandDialog, onViewPlanning }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg">Mes Groupes</h3>
        <Button onClick={() => handleOpenBandDialog()} size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter un groupe
        </Button>
      </div>

      {profileForm.bands && profileForm.bands.length > 0 ? (
        <div className="grid gap-3">
          {profileForm.bands.map((band, index) => (
            <div key={index} className="p-4 bg-black/20 rounded-xl border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{band.name}</h4>
                  {band.band_type && (
                    <p className="text-sm text-muted-foreground">{band.band_type}</p>
                  )}
                  {band.music_styles && band.music_styles.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {band.music_styles.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Bouton Voir le planning */}
                  {onViewPlanning && (
                    <Button
                      onClick={() => onViewPlanning(band)}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      title={band.band_id ? "Voir le planning du groupe" : "Sauvegardez d'abord pour activer le planning"}
                      disabled={!band.band_id}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleOpenBandDialog(index)}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Éditer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
          <p>Aucun groupe ajouté</p>
          <p className="text-sm mt-2">Cliquez sur "Ajouter un groupe" pour commencer</p>
        </div>
      )}
    </div>
  );
}
