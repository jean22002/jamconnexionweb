import { useAdConsent } from "../hooks/useAdConsent";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

/**
 * Bandeau de consentement RGPD (Build 95.2).
 *
 * S'affiche en bas d'écran tant que l'utilisateur n'a pas tranché entre
 * "Accepter" / "Refuser" les pubs personnalisées. Persisté en localStorage
 * + synchronisé avec le backend si l'utilisateur est connecté.
 *
 * Conforme RGPD : aucun cookie publicitaire / aucune pub avant ce choix.
 * Aligné avec Google Consent Mode v2.
 */
export default function AdConsentBanner() {
  const { token } = useAuth() || {};
  const { needsConsent, acceptConsent, refuseConsent } = useAdConsent(token);

  // Build 95.11 — Masqué tant qu'aucun système publicitaire actif.
  // Sera réactivé automatiquement dès qu'un des flags suivants sera défini :
  // REACT_APP_ADSENSE_SLOT_BANNER, REACT_APP_ADSENSE_SLOT_INTERSTITIAL_APPLY,
  // ou REACT_APP_EZOIC_PUBLISHER_ID.
  const adsEnabled = !!(
    process.env.REACT_APP_ADSENSE_SLOT_BANNER ||
    process.env.REACT_APP_ADSENSE_SLOT_INTERSTITIAL_APPLY ||
    process.env.REACT_APP_EZOIC_PUBLISHER_ID
  );
  if (!adsEnabled) return null;
  if (!needsConsent) return null;

  return (
    <div
      data-testid="ad-consent-banner"
      role="dialog"
      aria-label="Consentement cookies publicitaires"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-background/95 backdrop-blur-lg shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          <p className="font-medium text-foreground mb-1">🍪 Cookies & publicité</p>
          <p>
            Jam Connexion utilise des cookies pour le bon fonctionnement du site et,
            avec votre accord, pour afficher des publicités personnalisées (financement
            de la version gratuite). Vous pouvez retirer votre consentement à tout
            moment dans vos paramètres.{" "}
            <Link
              to="/cookies"
              className="underline hover:text-primary"
              data-testid="ad-consent-learn-more"
            >
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={refuseConsent}
            data-testid="ad-consent-refuse"
          >
            Refuser
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90"
            onClick={acceptConsent}
            data-testid="ad-consent-accept"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
