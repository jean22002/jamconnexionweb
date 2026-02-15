import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Badge pour afficher le statut "En ligne" d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} className - Classes CSS additionnelles
 * @param {boolean} showText - Afficher ou non le texte "En ligne"
 */
export default function OnlineStatusBadge({ userId, className = '', showText = true }) {
  const [isOnline, setIsOnline] = useState(false);
  const [mode, setMode] = useState('auto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API}/api/online-status/user/${userId}`);
        setIsOnline(response.data.is_online);
        setMode(response.data.mode);
      } catch (error) {
        console.error('Error fetching user online status:', error);
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Rafraîchir le statut toutes les 60 secondes
    const interval = setInterval(fetchStatus, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  // Ne rien afficher si le statut est désactivé ou si l'utilisateur est hors ligne
  if (loading || mode === 'disabled' || !isOnline) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      {showText && (
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          En ligne
        </span>
      )}
    </div>
  );
}
