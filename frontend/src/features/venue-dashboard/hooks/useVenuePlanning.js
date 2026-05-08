/**
 * Custom hook for managing venue planning/slots
 * Handles: planning slots, applications, calendar
 */
import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useVenuePlanning(token) {
  const [planningSlots, setPlanningSlots] = useState([]);
  const [applications, setApplications] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});

  // Fetch planning slots
  const fetchPlanningSlots = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API}/planning/venue/slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlanningSlots(response.data || []);
      
      // Build eventsByDate map for calendar
      const eventsMap = {};
      (response.data || []).forEach(slot => {
        const date = slot.date.split('T')[0];
        eventsMap[date] = 'planning';
      });
      setEventsByDate(eventsMap);
    } catch (error) {
      console.error('Error fetching planning slots:', error);
      toast.error('Erreur lors du chargement des créneaux');
    }
  }, [token]);

  // Fetch applications for a slot
  const fetchApplications = useCallback(async (slotId) => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API}/planning/slots/${slotId}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(prev => ({
        ...prev,
        [slotId]: response.data || []
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Erreur lors du chargement des candidatures');
    }
  }, [token]);

  // Create planning slot
  const createPlanningSlot = useCallback(async (slotData) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API}/planning/venue/slots`,
        slotData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPlanningSlots(prev => [...prev, response.data]);
      toast.success('Créneau créé avec succès');
      return true;
    } catch (error) {
      console.error('Error creating planning slot:', error);
      toast.error('Erreur lors de la création du créneau');
      return false;
    }
  }, [token]);

  // Delete planning slot
  const deletePlanningSlot = useCallback(async (slotId) => {
    if (!token) return false;
    
    try {
      await axios.delete(`${API}/planning/slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPlanningSlots(prev => prev.filter(s => s.id !== slotId));
      toast.success('Créneau supprimé');
      return true;
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [token]);

  // Accept application
  const acceptApplication = useCallback(async (slotId, applicationId) => {
    if (!token) return false;
    
    try {
      await axios.post(
        `${API}/planning/applications/${applicationId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Candidature acceptée');
      await fetchApplications(slotId);
      return true;
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Erreur lors de l\'acceptation');
      return false;
    }
  }, [token, fetchApplications]);

  // Reject application
  const rejectApplication = useCallback(async (slotId, applicationId) => {
    if (!token) return false;
    
    try {
      await axios.post(
        `${API}/planning/applications/${applicationId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Candidature refusée');
      await fetchApplications(slotId);
      return true;
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Erreur lors du refus');
      return false;
    }
  }, [token, fetchApplications]);

  return {
    planningSlots,
    applications,
    selectedDate,
    currentMonth,
    eventsByDate,
    setSelectedDate,
    setCurrentMonth,
    setPlanningSlots,
    setApplications,
    fetchPlanningSlots,
    fetchApplications,
    createPlanningSlot,
    deletePlanningSlot,
    acceptApplication,
    rejectApplication
  };
}
