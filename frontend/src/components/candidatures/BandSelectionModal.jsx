import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Users, User } from "lucide-react";

export default function BandSelectionModal({ isOpen, onClose, bands, onSelectBand }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choisissez votre projet</DialogTitle>
          <DialogDescription>
            Avec quel groupe ou projet souhaitez-vous postuler ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Option Solo */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => onSelectBand("solo")}
          >
            <User className="w-5 h-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold">Solo</div>
              <div className="text-xs text-muted-foreground">Candidater en tant qu'artiste solo</div>
            </div>
          </Button>

          {/* Liste des groupes */}
          {bands && bands.length > 0 && (
            <>
              {bands.map((band) => (
                <Button
                  key={band.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={() => onSelectBand(band.id)}
                >
                  <Users className="w-5 h-5 text-primary" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">{band.name}</div>
                    {band.music_styles && band.music_styles.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {band.music_styles.join(", ")}
                      </div>
                    )}
                    {band.members_count && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {band.members_count} membre{band.members_count > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
