import { Button } from "../../../components/ui/button";
import { Plus, Calendar, Share2, UserPlus, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function BandTab({ 
  profileForm, 
  handleOpenBandDialog, 
  onViewPlanning, 
  onShareBand, 
  onJoinBand,
  currentUserId 
}) {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg">Mes Groupes</h3>
        <div className="flex gap-2">
          <Button onClick={onJoinBand} size="sm" variant="outline" className="rounded-full">
            <UserPlus className="w-4 h-4 mr-1" />
            Rejoindre un groupe
          </Button>
          <Button onClick={() => handleOpenBandDialog()} size="sm" className="rounded-full">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un groupe
          </Button>
        </div>
      </div>

      {profileForm.bands && profileForm.bands.length > 0 ? (
        <div className="grid gap-3">
          {profileForm.bands.map((band, index) => {
            const isAdmin = band.admin_id === currentUserId;
            
            return (
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
                    {/* Code d'invitation visible uniquement par l'admin */}
                    {isAdmin && band.invite_code && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Code :</span>
                        <span className="font-mono font-bold text-sm bg-primary/10 border border-primary/30 px-2 py-0.5 rounded tracking-wider" data-testid={`invite-code-${index}`}>
                          {band.invite_code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(band.invite_code)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Copier le code"
                        >
                          {copiedCode === band.invite_code ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
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
                        title="Voir le planning du groupe"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Bouton Editer (admin uniquement) */}
                    {isAdmin && (
                      <Button
                        onClick={() => handleOpenBandDialog(index)}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        Editer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
          <p>Aucun groupe ajoute</p>
          <p className="text-sm mt-2">Cliquez sur "Ajouter un groupe" pour commencer</p>
        </div>
      )}
    </div>
  );
}
