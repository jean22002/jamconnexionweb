/**
 * Custom hook for managing venue events (Jams, Concerts, Karaoke, Spectacles)
 * Handles: fetching, creating, updating, deleting events
 */
import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useVenueEvents(token) {
  const [jams, setJams] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [karaokes, setKaraokes] = useState([]);
  const [spectacles, setSpectacles] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fetch all events
  const fetchAllEvents = useCallback(async () => {
    if (!token) return;
    
    setLoadingEvents(true);
    try {
      const [jamsRes, concertsRes, karaokesRes, spectaclesRes] = await Promise.all([
        axios.get(`${API}/venues/me/jams`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/venues/me/concerts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/venues/me/karaoke`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/venues/me/spectacles`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setJams(jamsRes.data || []);
      setConcerts(concertsRes.data || []);
      setKaraokes(karaokesRes.data || []);
      setSpectacles(spectaclesRes.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoadingEvents(false);
    }
  }, [token]);

  // Create event (generic)
  const createEvent = useCallback(async (eventType, eventData) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API}/venues/me/${eventType}`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the corresponding state
      const newEvent = response.data;
      switch(eventType) {
        case 'jams':
          setJams(prev => [...prev, newEvent]);
          break;
        case 'concerts':
          setConcerts(prev => [...prev, newEvent]);
          break;
        case 'karaoke':
          setKaraokes(prev => [...prev, newEvent]);
          break;
        case 'spectacles':
          setSpectacles(prev => [...prev, newEvent]);
          break;
        default:
          break;
      }
      
      toast.success('Événement créé avec succès');
      return true;
    } catch (error) {
      console.error(`Error creating ${eventType}:`, error);
      toast.error('Erreur lors de la création de l\'événement');
      return false;
    }
  }, [token]);

  // Delete event
  const deleteEvent = useCallback(async (eventType, eventId) => {
    if (!token) return false;
    
    try {
      await axios.delete(`${API}/venues/me/${eventType}/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from state
      switch(eventType) {
        case 'jams':
          setJams(prev => prev.filter(e => e.id !== eventId));
          break;
        case 'concerts':
          setConcerts(prev => prev.filter(e => e.id !== eventId));
          break;
        case 'karaoke':
          setKaraokes(prev => prev.filter(e => e.id !== eventId));
          break;
        case 'spectacles':
          setSpectacles(prev => prev.filter(e => e.id !== eventId));
          break;
        default:
          break;
      }
      
      toast.success('Événement supprimé');
      return true;
    } catch (error) {
      console.error(`Error deleting ${eventType}:`, error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [token]);

  return {
    jams,
    concerts,
    karaokes,
    spectacles,
    loadingEvents,
    fetchAllEvents,
    createEvent,
    deleteEvent,
    setJams,
    setConcerts,
    setKaraokes,
    setSpectacles
  };
}
