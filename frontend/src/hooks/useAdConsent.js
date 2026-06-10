import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STORAGE_KEY = "jc_ad_consent_v1";

/**
 * Hook de gestion du consentement publicitaire RGPD.
 *
 * Valeurs possibles :
 *   - `null`     : pas encore demandé → on doit afficher le bandeau de consentement
 *   - `true`     : utilisateur a accepté les pubs personnalisées
 *   - `false`    : utilisateur a refusé (on peut toujours afficher des pubs non-personnalisées)
 *
 * Sync :
 *   - localStorage (lecture immédiate, persistant cross-session)
 *   - backend `PATCH /api/auth/me/ad-consent` (sync Web ↔ Mobile via UMP SDK)
 *
 * Conforme RGPD : tant que `consent === null`, ne charge AUCUNE pub.
 * Mobile lit `user.ad_consent` via `GET /auth/me` au démarrage.
 */
export function useAdConsent(token) {
  // Initialisation depuis localStorage (synchrone, pas de flash)
  const [consent, setConsent] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed?.value === "boolean" ? parsed.value : null;
    } catch {
      return null;
    }
  });

  // Si user connecté, on récupère le flag depuis backend (source de vérité cross-device)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        const backendConsent = res?.data?.ad_consent;
        if (typeof backendConsent === "boolean") {
          // Backend gagne sur le local
          setConsent(backendConsent);
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ value: backendConsent, ts: Date.now() })
            );
          } catch {
            /* quota plein → on continue */
          }
        }
      } catch {
        /* offline ou 401 → on garde la valeur locale */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const acceptConsent = useCallback(() => {
    setConsent(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: true, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    // Sync vers backend si connecté (best effort, ne bloque pas l'UI)
    if (token) {
      axios
        .patch(
          `${API}/auth/me/ad-consent`,
          { ad_consent: true },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {
          /* silent — on retentera au prochain login */
        });
    }
    // Google Consent Mode v2 — autoriser les signaux publicitaires
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }
  }, [token]);

  const refuseConsent = useCallback(() => {
    setConsent(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: false, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    if (token) {
      axios
        .patch(
          `${API}/auth/me/ad-consent`,
          { ad_consent: false },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {});
    }
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      });
    }
  }, [token]);

  return {
    consent,           // null | true | false
    needsConsent: consent === null,
    canShowAds: consent === true,           // pubs personnalisées
    canShowNpa: consent === false,          // non-personalized ads autorisées si refus
    acceptConsent,
    refuseConsent,
  };
}
