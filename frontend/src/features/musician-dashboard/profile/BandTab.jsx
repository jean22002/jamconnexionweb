import { Button } from "../../../components/ui/button";
import { Plus, Calendar, UserPlus, Copy, Check, Share2, Trash2, LogOut, Mic } from "lucide-react";
import { useState } from "react";

export default function BandTab({ 
  profileForm, 
  handleOpenBandDialog, 
  handleOpenSoloDialog,
  handleDeleteBand,
  handleLeaveBand,
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

  const handleShare = (band) => {
    const code = band.invite_code;
    if (!code) return;
    const text = `Rejoins mon groupe "${band.name}" sur Jam Connexion avec le code : ${code}`;
    if (navigator.share) {
      navigator.share({ title: `Rejoindre ${band.name}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-heading text-lg">Mes Groupes & Projets Solo</h3>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={onJoinBand} size="sm" variant="outline" className="rounded-full" data-testid="join-band-btn">
            <UserPlus className="w-4 h-4 mr-1" />
            Rejoindre un groupe
          </Button>
          {handleOpenSoloDialog && (
            <Button onClick={handleOpenSoloDialog} size="sm" variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10" data-testid="add-solo-project-btn">
              <Mic className="w-4 h-4 mr-1" />
              Ajouter un projet Solo
            </Button>
          )}
          <Button onClick={() => handleOpenBandDialog()} size="sm" className="rounded-full" data-testid="add-band-btn">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un groupe
          </Button>
        </div>
      </div>

      {profileForm.bands && profileForm.bands.length > 0 ? (
        <div className="grid gap-3">
          {profileForm.bands.map((band, index) => {
            // Détection admin alignée avec l'app mobile :
            // 1) is_admin === true (champ explicite envoyé par certains endpoints)
            // 2) admin_id == currentUserId
            // 3) groupe legacy sans admin_id → considéré admin par défaut
            const isAdmin =
              band.is_admin === true ||
              (currentUserId && band.admin_id && String(band.admin_id) === String(currentUserId)) ||
              !band.admin_id;
            
            return (
              <div key={`band-${band.id || band.name}-${index}`} className={`p-4 bg-black/20 rounded-xl border ${band.band_type === "Solo" ? "border-primary/40 bg-primary/5" : "border-white/10"} hover:border-primary/60 transition-colors`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      {band.band_type === "Solo" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                          <Mic className="w-3 h-3" />
                          Solo
                        </span>
                      )}
                      {band.name}
                    </h4>
                    {band.band_type && band.band_type !== "Solo" && (
                      <p className="text-sm text-muted-foreground">{band.band_type}</p>
                    )}
                    {band.music_styles && band.music_styles.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {band.music_styles.join(', ')}
                      </p>
                    )}
                    {/* Code d'invitation */}
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
                          data-testid={`copy-code-${index}`}
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
                    {/* Bouton Partager */}
                    {isAdmin && band.invite_code && (
                      <Button
                        onClick={() => handleShare(band)}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        title="Partager le code"
                        data-testid={`share-band-${index}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Bouton Planning */}
                    {onViewPlanning && (
                      <Button
                        onClick={() => onViewPlanning(band)}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        title="Voir le planning"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Bouton Editer */}
                    {isAdmin && (
                      <Button
                        onClick={() => handleOpenBandDialog(index)}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        data-testid={`edit-band-${index}`}
                      >
                        Editer
                      </Button>
                    )}
                    {/* Bouton Supprimer */}
                    {isAdmin && handleDeleteBand && (
                      <Button
                        onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${band.name}" ? Cette action est irréversible et le groupe ne sera plus visible des autres utilisateurs.`)) {
                            handleDeleteBand(index);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-full border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/60"
                        title="Supprimer le groupe"
                        data-testid={`delete-band-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Bouton Quitter (membre non-admin) */}
                    {!isAdmin && handleLeaveBand && (
                      <Button
                        onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir quitter le groupe "${band.name}" ? Vous ne ferez plus partie de ce groupe et vous ne pourrez plus accéder à ses informations privées.`)) {
                            handleLeaveBand(index);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-full border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/60 gap-2"
                        title="Quitter le groupe"
                        data-testid={`leave-band-${index}`}
                      >
                        <LogOut className="w-4 h-4" />
                        Quitter
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
          <p className="text-sm mt-2">Cliquez sur &quot;Ajouter un groupe&quot; pour commencer</p>
        </div>
      )}
    </div>
  );
}
