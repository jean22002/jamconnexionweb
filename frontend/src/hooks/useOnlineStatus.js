import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Hook personnalisé pour gérer le statut en ligne
 * Gère 3 modes: auto, manual, disabled
 */
export const useOnlineStatus = () => {
  const [mode, setMode] = useState('auto'); // auto, manual, disabled
  const [isOnline, setIsOnline] = useState(false);
  const [manualStatus, setManualStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer le mode actuel
  const fetchMode = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/online-status/mode`);
      
      setMode(response.data.mode);
      setManualStatus(response.data.manual_status);
      setIsOnline(response.data.is_online);
      setError(null);
    } catch (err) {
      console.error('Error fetching online status mode:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la récupération du mode');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour le mode
  const updateMode = useCallback(async (newMode) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API}/api/online-status/mode`,
        { mode: newMode }
      );
      
      setMode(response.data.mode);
      setManualStatus(response.data.manual_status);
      setIsOnline(response.data.is_online);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error updating online status mode:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du mode');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle manuel du statut (uniquement en mode manual)
  const toggleManualStatus = useCallback(async () => {
    if (mode !== 'manual') return;

    try {
      const newStatus = !manualStatus;
      const response = await axios.put(
        `${API}/api/online-status/manual`,
        { is_online: newStatus }
      );
      
      setManualStatus(newStatus);
      setIsOnline(newStatus);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error toggling manual status:', err);
      setError(err.response?.data?.detail || 'Erreur lors du changement de statut');
      throw err;
    }
  }, [mode, manualStatus]);

  // Envoyer un heartbeat (pour le mode auto)
  const sendHeartbeat = useCallback(async () => {
    if (mode !== 'auto') return;

    try {
      await axios.post(
        `${API}/api/online-status/heartbeat`,
        {},
        { withCredentials: true }
      );
      setIsOnline(true);
    } catch (err) {
      console.error('Error sending heartbeat:', err);
    }
  }, [mode]);

  // Récupérer le statut d'un autre utilisateur
  const getUserStatus = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${API}/api/online-status/user/${userId}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching user status:', err);
      return { is_online: false, mode: 'auto' };
    }
  }, []);

  // Initialisation
  useEffect(() => {
    fetchMode();
  }, [fetchMode]);

  // Heartbeat automatique en mode auto (toutes les 2 minutes)
  useEffect(() => {
    if (mode !== 'auto') return;

    // Envoyer immédiatement
    sendHeartbeat();

    // Puis toutes les 2 minutes
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [mode, sendHeartbeat]);

  // Heartbeat lors des interactions utilisateur (en mode auto)
  useEffect(() => {
    if (mode !== 'auto') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    let lastHeartbeat = Date.now();
    
    const handleActivity = () => {
      const now = Date.now();
      // Envoyer un heartbeat seulement toutes les 30 secondes max
      if (now - lastHeartbeat > 30000) {
        sendHeartbeat();
        lastHeartbeat = now;
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [mode, sendHeartbeat]);

  return {
    mode,
    isOnline,
    manualStatus,
    loading,
    error,
    updateMode,
    toggleManualStatus,
    refreshMode: fetchMode,
    getUserStatus
  };
};
