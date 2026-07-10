import { useEffect } from "react";
import { useAdConsent } from "../hooks/useAdConsent";
import { useAuth } from "../context/AuthContext";

/**
 * EzoicScriptLoader — Build 95.10
 *
 * Charge dynamiquement le script Ezoic (`sa.min.js`) au runtime :
 *   - Uniquement si `REACT_APP_EZOIC_PUBLISHER_ID` est défini en .env
 *   - Uniquement si le consentement RGPD est donné (`canShowAds === true`)
 *   - Uniquement si l'utilisateur n'est pas une venue
 *
 * À monter dans App.js (globalement, une seule fois).
 * Ne rend rien visuellement (composant purement side-effect).
 */
export default function EzoicScriptLoader() {
  const { user, token } = useAuth() || {};
  const { canShowAds } = useAdConsent(token);
  const EZOIC_PUBLISHER_ID = process.env.REACT_APP_EZOIC_PUBLISHER_ID;

  useEffect(() => {
    if (!EZOIC_PUBLISHER_ID) return;
    if (!canShowAds) return;
    if (user?.role === "venue") return;

    // Skip si déjà chargé
    if (document.querySelector('script[data-ezoic-loaded="true"]')) return;

    // Init de la file de commandes
    window.ezstandalone = window.ezstandalone || {};
    window.ezstandalone.cmd = window.ezstandalone.cmd || [];

    // Chargement du script Ezoic
    const script = document.createElement("script");
    script.src = "//www.ezojs.com/ezoic/sa.min.js";
    script.async = true;
    script.setAttribute("data-ezoic-loaded", "true");
    document.head.appendChild(script);
  }, [EZOIC_PUBLISHER_ID, canShowAds, user?.role]);

  return null;
}
