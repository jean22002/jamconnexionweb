import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Hook pour vérifier automatiquement les badges après des actions clés
 * Utilise un debounce pour éviter trop d'appels API
 */
export const useBadgeAutoCheck = () => {
  const { token, user } = useAuth();
  const { showMultipleBadges } = useBadge();
  let checkTimeout = null;

  const checkBadges = useCallback(async () => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API}/api/badges/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      
      // Si de nouveaux badges sont débloqués, afficher les toasts
      if (data.newly_unlocked && data.newly_unlocked.length > 0) {
        showMultipleBadges(data.newly_unlocked);
      }
    } catch (error) {
      // Silently fail - ne pas déranger l'utilisateur
      console.debug('Badge auto-check failed:', error);
    }
  }, [token, user, showMultipleBadges]);

  // Vérifier les badges avec un délai pour éviter trop d'appels
  const triggerBadgeCheck = useCallback(() => {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }
    checkTimeout = setTimeout(checkBadges, 2000); // 2 secondes de délai
  }, [checkBadges]);

  return { triggerBadgeCheck };
};
