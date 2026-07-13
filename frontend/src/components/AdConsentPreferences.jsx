import { useAdConsent } from "../hooks/useAdConsent";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Cookie, Check, X } from "lucide-react";

/**
 * Préférences publicitaires (RGPD — Build 95.3).
 *
 * Composant à monter dans les écrans "Paramètres" des 3 dashboards
 * (musicien, mélomane, venue). Permet à l'utilisateur de :
 *   - voir son statut de consentement actuel
 *   - le modifier à tout moment (exigence CNIL : retrait aussi facile
 *     que le consentement initial)
 *
 * Si non encore exprimé, propose 2 boutons. Si déjà exprimé, affiche
 * le statut + un bouton "Modifier".
 */
export default function AdConsentPreferences() {
  const { token } = useAuth() || {};
  const { consent, acceptConsent, refuseConsent } = useAdConsent(token);

  // Build 95.11+ : masquer tant qu'aucune régie pub web n'est active.
  // Le backend continue de sync le consentement (utile pour AdMob mobile).
  const adsEnabled = !!(
    process.env.REACT_APP_ADSENSE_SLOT_BANNER ||
    process.env.REACT_APP_ADSENSE_SLOT_INTERSTITIAL_APPLY ||
    process.env.REACT_APP_EZOIC_PUBLISHER_ID
  );
  if (!adsEnabled) return null;

  const isAccepted = consent === true;
  const isRefused = consent === false;
  const isUndefined = consent === null;

  return (
    <div
      data-testid="ad-consent-preferences"
      className="glassmorphism rounded-xl p-5 border border-white/10"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Cookie className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base">Préférences publicitaires</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez votre consentement pour les cookies publicitaires (RGPD).
            Le financement de la version gratuite dépend en partie des
            publicités personnalisées.
          </p>
        </div>
      </div>

      {/* Statut actuel */}
      <div className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Statut actuel
        </div>
        <div className="flex items-center gap-2">
          {isAccepted && (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span
                data-testid="ad-consent-status-accepted"
                className="text-sm font-medium text-green-400"
              >
                Publicités personnalisées acceptées
              </span>
            </>
          )}
          {isRefused && (
            <>
              <X className="w-4 h-4 text-orange-400" />
              <span
                data-testid="ad-consent-status-refused"
                className="text-sm font-medium text-orange-400"
              >
                Publicités personnalisées refusées
              </span>
            </>
          )}
          {isUndefined && (
            <span
              data-testid="ad-consent-status-undefined"
              className="text-sm font-medium text-muted-foreground italic"
            >
              Non défini — répondez ci-dessous
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant={isAccepted ? "default" : "outline"}
          size="sm"
          className="rounded-full flex-1"
          onClick={acceptConsent}
          disabled={isAccepted}
          data-testid="ad-consent-pref-accept"
        >
          <Check className="w-4 h-4 mr-2" />
          Accepter
        </Button>
        <Button
          variant={isRefused ? "default" : "outline"}
          size="sm"
          className="rounded-full flex-1"
          onClick={refuseConsent}
          disabled={isRefused}
          data-testid="ad-consent-pref-refuse"
        >
          <X className="w-4 h-4 mr-2" />
          Refuser
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground/70 italic mt-3 leading-relaxed">
        Vous pouvez modifier ce choix à tout moment. En cas de refus, nous
        n&apos;utilisons aucune donnée personnelle pour la publicité (seules des
        publicités non-personnalisées peuvent être affichées).
      </p>
    </div>
  );
}
