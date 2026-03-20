/**
 * Custom hook for managing musician applications to planning slots
 * Handles: searching slots, applying, viewing applications
 */
import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useMusicianApplications(token) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available planning slots
  const fetchAvailableSlots = useCallback(async (filters = {}) => {
    if (!token) return;
    
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API}/planning/slots?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Erreur lors du chargement des créneaux');
    } finally {
      setLoadingSlots(false);
    }
  }, [token]);

  // Fetch my applications
  const fetchMyApplications = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API}/planning/musician/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Erreur lors du chargement des candidatures');
    }
  }, [token]);

  // Apply to a planning slot
  const applyToSlot = useCallback(async (slotId, applicationData) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API}/planning/slots/${slotId}/apply`,
        applicationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMyApplications(prev => [...prev, response.data]);
      toast.success('Candidature envoyée avec succès');
      return true;
    } catch (error) {
      console.error('Error applying to slot:', error);
      toast.error('Erreur lors de l\'envoi de la candidature');
      return false;
    }
  }, [token]);

  // Cancel an application
  const cancelApplication = useCallback(async (applicationId) => {
    if (!token) return false;
    
    try {
      await axios.delete(`${API}/planning/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMyApplications(prev => prev.filter(app => app.id !== applicationId));
      toast.success('Candidature annulée');
      return true;
    } catch (error) {
      console.error('Error canceling application:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  }, [token]);

  return {
    availableSlots,
    myApplications,
    loadingSlots,
    fetchAvailableSlots,
    fetchMyApplications,
    applyToSlot,
    cancelApplication
  };
}
