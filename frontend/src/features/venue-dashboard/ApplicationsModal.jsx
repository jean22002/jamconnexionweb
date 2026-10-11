import { useState } from "react";
import { Users, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";

/**
 * Build 152.27 — Modal des candidatures partagée.
 *
 * Précédemment rendue à l'intérieur de PlanningTab uniquement, ce qui empêchait
 * l'ouverture depuis l'onglet Candidatures. Extrait dans ce composant pour être
 * monté au niveau du VenueDashboard, universellement accessible.
 */
export default function ApplicationsModal({
  open,
  onOpenChange,
  selectedSlot,
  applications,
  handleAcceptApplication,
  handleRejectApplication,
  onConvertToConcert,
}) {
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const toggleApplicationSelection = (appId) => {
    setSelectedApplications((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleValidateSelection = () => {
    if (selectedApplications.length === 0) {
      alert("Veuillez sélectionner au moins un groupe");
      return;
    }
    setShowConvertModal(true);
  };

  const handleConfirmConversion = () => {
    if (onConvertToConcert) {
      onConvertToConcert(selectedSlot, selectedApplications, applications);
    }
    setShowConvertModal(false);
    onOpenChange(false);
    setSelectedApplications([]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glassmorphism border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidatures pour le créneau</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedSlot && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm">
                  📅 {new Date(selectedSlot.date).toLocaleDateString("fr-FR")} à {selectedSlot.time}
                </p>
                {selectedSlot.title && <p className="text-sm mt-1">🎵 {selectedSlot.title}</p>}
              </div>
            )}

            {!applications || applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Aucune candidature pour le moment</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="text-sm">
                    <strong>{applications.length}</strong> candidature{applications.length > 1 ? "s" : ""} reçue{applications.length > 1 ? "s" : ""}
                  </div>
                  {selectedApplications.length > 0 && (
                    <div className="text-sm text-primary">
                      {selectedApplications.length} sélectionné{selectedApplications.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {applications.map((app) => {
                    // Build 218 — Affichage distinct pour les candidatures de plateau
                    const isPlateau = app.band_type === "plateau" || !!app.plateau_id;
                    const plateauMembers = Array.isArray(app.plateau_members) ? app.plateau_members : [];
                    return (
                    <div
                      key={app.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedApplications.includes(app.id)
                          ? "bg-primary/10 border-primary"
                          : isPlateau
                          ? "bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/30 hover:border-purple-500/50"
                          : "bg-black/20 border-white/10 hover:border-white/20"
                      }`}
                      data-testid={`application-row-${app.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedApplications.includes(app.id)}
                          onCheckedChange={() => toggleApplicationSelection(app.id)}
                          className="mt-1"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                                {isPlateau && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                    data-testid={`plateau-badge-${app.id}`}
                                  >
                                    🎸 Plateau
                                  </span>
                                )}
                                <span className="truncate">{app.plateau_title || app.band_name || app.musician_name}</span>
                                {selectedApplications.includes(app.id) && (
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </h4>

                              {/* Liste des artistes du plateau */}
                              {isPlateau && plateauMembers.length > 0 && (
                                <div className="mt-3 p-3 rounded-lg bg-black/20 border border-purple-500/20">
                                  <p className="text-xs font-semibold text-purple-300 mb-2">
                                    {plateauMembers.length} artistes dans ce plateau
                                  </p>
                                  <ul className="space-y-1.5">
                                    {plateauMembers.map((m, idx) => (
                                      <li
                                        key={`${m.musician_id}-${m.band_id || idx}`}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">
                                          🎸
                                        </span>
                                        <span className="font-medium">{m.project_name || "Artiste"}</span>
                                        {m.music_styles?.length > 0 && (
                                          <span className="text-xs text-muted-foreground truncate">
                                            · {m.music_styles.slice(0, 2).join(", ")}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {app.message && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  &quot;{app.message}&quot;
                                </p>
                              )}
                              {!isPlateau && app.band_name && app.musician_name && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Contact : {app.musician_name}
                                </p>
                              )}
                              {isPlateau && app.musician_name && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Admin du plateau : <b>{app.musician_name}</b>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => handleAcceptApplication(app.id)}
                              size="sm"
                              variant="outline"
                              className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                              data-testid={`accept-application-${app.id}`}
                            >
                              ✓ {isPlateau ? "Accepter le plateau" : "Accepter seul"}
                            </Button>
                            <Button
                              onClick={() => handleRejectApplication(app.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                              data-testid={`reject-application-${app.id}`}
                            >
                              ✗ Refuser
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {selectedApplications.length > 0 && (
                  <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6">
                    <Button
                      onClick={handleValidateSelection}
                      className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 text-lg font-semibold"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Valider la sélection ({selectedApplications.length})
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <DialogContent className="glassmorphism border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Transformer en concert ?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Vous avez sélectionné <strong>{selectedApplications.length}</strong> groupe{selectedApplications.length > 1 ? "s" : ""} pour ce créneau.
            </p>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <h4 className="font-medium mb-2">
                Groupe{selectedApplications.length > 1 ? "s" : ""} sélectionné{selectedApplications.length > 1 ? "s" : ""} :
              </h4>
              <ul className="text-sm space-y-1">
                {selectedApplications.map((appId) => {
                  const app = applications?.find((a) => a.id === appId);
                  if (!app) return null;
                  const isPlateau = app.band_type === "plateau" || !!app.plateau_id;
                  return (
                    <li key={appId} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {isPlateau && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          🎸 Plateau
                        </span>
                      )}
                      {app.plateau_title || app.band_name || app.musician_name}
                      {isPlateau && Array.isArray(app.plateau_members) && app.plateau_members.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({app.plateau_members.length} artistes)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm">
                <strong>⚠️ Action :</strong>
                <br />
                Le créneau de candidature sera transformé en concert programmé avec les groupes sélectionnés.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConvertModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmConversion}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
