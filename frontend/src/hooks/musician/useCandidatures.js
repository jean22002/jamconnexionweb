import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useCandidatures = (token) => {
  const [candidatures, setCandidatures] = useState([]);
  const [loadingCandidatures, setLoadingCandidatures] = useState(false);
  const [candidatureFilters, setCandidatureFilters] = useState({
    dateFrom: "",
    dateTo: "",
    region: "",
    department: "",
    musicStyle: ""
  });

  const [myApplications, setMyApplications] = useState([]);
  const [loadingMyApplications, setLoadingMyApplications] = useState(false);

  const searchCandidatures = async () => {
    setLoadingCandidatures(true);
    try {
      const params = new URLSearchParams();
      if (candidatureFilters.dateFrom) params.append('date_from', candidatureFilters.dateFrom);
      if (candidatureFilters.dateTo) params.append('date_to', candidatureFilters.dateTo);
      if (candidatureFilters.region) params.append('region', candidatureFilters.region);
      if (candidatureFilters.department) params.append('department', candidatureFilters.department);
      if (candidatureFilters.musicStyle) params.append('music_style', candidatureFilters.musicStyle);
      
      const response = await axios.get(`${API}/planning/search?${params.toString()}`);
      setCandidatures(response.data);
    } catch (error) {
      console.error("Error searching candidatures:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoadingCandidatures(false);
    }
  };

  const applyToSlot = async (slotId) => {
    try {
      await axios.post(`${API}/planning/${slotId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Candidature envoyée !");
      searchCandidatures();
      fetchMyApplications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la candidature");
    }
  };

  const fetchMyApplications = async () => {
    setLoadingMyApplications(true);
    try {
      const response = await axios.get(`${API}/applications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyApplications(response.data);
    } catch (error) {
      console.error("Error fetching my applications:", error);
      toast.error("Erreur lors du chargement de vos candidatures");
    } finally {
      setLoadingMyApplications(false);
    }
  };

  const cancelApplication = async (appId) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette candidature ?")) {
      return;
    }
    try {
      await axios.delete(`${API}/applications/my/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Candidature annulée");
      fetchMyApplications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'annulation");
    }
  };

  return {
    candidatures,
    loadingCandidatures,
    candidatureFilters,
    setCandidatureFilters,
    searchCandidatures,
    applyToSlot,
    myApplications,
    loadingMyApplications,
    fetchMyApplications,
    cancelApplication
  };
};
