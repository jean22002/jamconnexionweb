import { useEffect, useRef } from "react";

const ADSENSE_CLIENT = process.env.REACT_APP_ADSENSE_CLIENT || "";
const ADSENSE_SLOT_BANNER = process.env.REACT_APP_ADSENSE_SLOT_BANNER || "";

/**
 * Bannière publicitaire persistante AdSense (sticky bottom).
 *
 * Affichée pour les mélomanes free (équivalent du tab bar banner mobile).
 * Le composant parent décide de l'afficher ou non (PRO check, role check,
 * consentement RGPD).
 *
 * Le composant lui-même ne s'affiche que si :
 *   - `ADSENSE_CLIENT` et `ADSENSE_SLOT_BANNER` sont configurés en .env
 *
 * Sinon il ne rend rien (silencieux, pas de placeholder bruyant).
 */
export default function AdBanner({ position = "sticky-bottom", testId = "ad-banner" }) {
  const adRef = useRef(null);
  const adConfigured = !!ADSENSE_CLIENT && !!ADSENSE_SLOT_BANNER;

  useEffect(() => {
    if (!adConfigured) return;
    const t = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* AdBlock ou script pas encore chargé */
      }
    }, 100);
    return () => clearTimeout(t);
  }, [adConfigured]);

  if (!adConfigured) return null;

  const positionClass =
    position === "sticky-bottom"
      ? "sticky bottom-0 left-0 right-0 z-40"
      : "";

  return (
    <div
      data-testid={testId}
      className={`${positionClass} border-t border-white/10 bg-background/90 backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-2 py-1 flex items-center justify-center min-h-[60px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: 50 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT_BANNER}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
