import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";

const ADSENSE_CLIENT = process.env.REACT_APP_ADSENSE_CLIENT || "";
const ADSENSE_SLOT = process.env.REACT_APP_ADSENSE_SLOT_BANNER || "";

/**
 * Modale publicitaire AdSense affichée aux musiciens NON-PRO avant l'envoi
 * d'un message de contact. Une bannière responsive Google AdSense est chargée,
 * et l'utilisateur doit attendre la fin du compte à rebours pour valider l'envoi.
 *
 * Props:
 *   open       boolean
 *   onClose    () => void
 *   onContinue () => void
 *   countdown  number  (default 5 secondes)
 */
export default function AdInterstitial({ open, onClose, onContinue, countdown = 5 }) {
  const [secondsLeft, setSecondsLeft] = useState(countdown);
  const adRef = useRef(null);

  // Reset countdown quand la modale s'ouvre
  useEffect(() => {
    if (open) setSecondsLeft(countdown);
  }, [open, countdown]);

  // Tick toutes les secondes tant que la modale est ouverte
  useEffect(() => {
    if (!open || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [open, secondsLeft]);

  // Push de la pub AdSense quand la modale s'ouvre (slot configuré uniquement)
  useEffect(() => {
    if (!open || !ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    try {
      // Petit délai pour laisser le DOM se monter
      const t = setTimeout(() => {
        try {
          // eslint-disable-next-line no-undef
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          // AdBlock ou script pas encore chargé — silencieux
        }
      }, 100);
      return () => clearTimeout(t);
    } catch (e) {
      // ignore
    }
  }, [open]);

  const canContinue = secondsLeft <= 0;
  const adConfigured = !!ADSENSE_CLIENT && !!ADSENSE_SLOT;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="glassmorphism border-white/10 max-w-lg"
        data-testid="ad-interstitial-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-sm text-muted-foreground font-normal">
            Publicité
          </DialogTitle>
        </DialogHeader>

        {/* Conteneur publicitaire AdSense responsive */}
        <div className="my-4 min-h-[100px] rounded-lg bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden">
          {adConfigured ? (
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: "block", width: "100%" }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={ADSENSE_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
              key={`${open}-${secondsLeft === countdown ? 1 : 0}`}
            />
          ) : (
            <div className="text-center p-6 text-muted-foreground text-xs italic">
              Espace publicitaire en cours d'activation
              <br />
              <span className="text-[10px] opacity-60">
                (validation Google AdSense en cours)
              </span>
            </div>
          )}
        </div>

        {/* Footer : continuer après le compte à rebours */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            {canContinue
              ? "Vous pouvez maintenant envoyer votre message."
              : `Vous pourrez envoyer votre message dans ${secondsLeft}s…`}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50"
              disabled={!canContinue}
              onClick={onContinue}
              data-testid="ad-interstitial-continue"
            >
              {canContinue ? "Envoyer le message" : `Patientez (${secondsLeft})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
