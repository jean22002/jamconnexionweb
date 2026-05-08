import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Hook pour gérer le compteur de notifications non-lues
 * Temps réel via props + fallback polling toutes les 30s
 */
export const useUnreadNotifications = (token, socketUnreadCount = null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setLoading(false);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Update from socket (temps réel)
  useEffect(() => {
    if (socketUnreadCount !== null && socketUnreadCount !== undefined) {
      setUnreadCount(socketUnreadCount);
    }
  }, [socketUnreadCount]);

  // Fallback polling every 30 seconds
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [token, fetchUnreadCount]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Increment count (called when new notification received)
  const increment = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  // Decrement count (called when notification marked as read)
  const decrement = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Reset to zero (called when all marked as read)
  const reset = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    refresh,
    increment,
    decrement,
    reset
  };
};
