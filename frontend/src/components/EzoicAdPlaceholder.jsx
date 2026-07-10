import { useEffect, useRef } from "react";
import { useAdConsent } from "../hooks/useAdConsent";
import { useAuth } from "../context/AuthContext";

/**
 * Emplacement publicitaire Ezoic — Build 95.10
 *
 * Ezoic gère automatiquement le remplissage des placeholders via son script.
 * Il suffit de placer `<EzoicAdPlaceholder id={XXX} />` là où on veut une pub.
 *
 * Conditions d'affichage :
 * - Ezoic activé (via .env `REACT_APP_EZOIC_PUBLISHER_ID`)
 * - Consentement RGPD accepté (`canShowAds === true`)
 * - Rôle utilisateur ≠ 'venue' (pas de pub pour les venues)
 * - Utilisateur non PRO actif
 *
 * Les IDs (101, 102, 103…) proviennent de la console Ezoic après création
 * des placements dans leur dashboard.
 */
export default function EzoicAdPlaceholder({ id, className = "" }) {
  const { user, token } = useAuth() || {};
  const { canShowAds } = useAdConsent(token);
  const ref = useRef(null);
  const EZOIC_ENABLED = !!process.env.REACT_APP_EZOIC_PUBLISHER_ID;

  // Ne rien afficher si Ezoic non configuré ou pas de consentement
  // ou si user est venue (jamais de pub pour les venues)
  const shouldShow = EZOIC_ENABLED && canShowAds && user?.role !== "venue";

  useEffect(() => {
    if (!shouldShow || !window.ezstandalone) return;
    try {
      window.ezstandalone.cmd = window.ezstandalone.cmd || [];
      window.ezstandalone.cmd.push(function () {
        window.ezstandalone.showAds(id);
      });
    } catch {
      /* Ezoic pas chargé ou bloqué → skip silencieux */
    }
  }, [shouldShow, id]);

  if (!shouldShow) return null;

  return (
    <div
      ref={ref}
      id={`ezoic-pub-ad-placeholder-${id}`}
      data-testid={`ezoic-ad-${id}`}
      className={`ezoic-ad-container ${className}`}
      style={{ minHeight: 60, textAlign: "center" }}
    />
  );
}
