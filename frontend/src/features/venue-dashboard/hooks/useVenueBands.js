/**
 * useVenueBands Hook
 * 
 * Gère toute la logique de recherche et d'ajout de groupes pour les concerts
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useVenueBands(token, concertForm, setConcertForm) {
  // États pour la recherche et l'ajout de groupes
  const [searchBandQuery, setSearchBandQuery] = useState("");
  const [searchedBands, setSearchedBands] = useState([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const [manualBandName, setManualBandName] = useState("");

  // Rechercher des groupes dans la base de données pour les ajouter à un concert
  const searchConcertBands = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchedBands([]);
      return;
    }
    
    setLoadingBands(true);
    try {
      const response = await axios.get(`${API}/bands/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchedBands(response.data.slice(0, 10)); // Limiter à 10 résultats
    } catch (error) {
      // Error handling - groups search failed
      setSearchedBands([]);
    } finally {
      setLoadingBands(false);
    }
  }, [token]);

  // Ajouter un groupe depuis la BDD au concert
  const addBandFromDB = (band) => {
    // S'assurer que concertForm et bands existent
    if (!concertForm) {
      return;
    }
    
    const existingBands = Array.isArray(concertForm.bands) ? concertForm.bands : [];
    
    // ⚠️ NOUVEAU : Si ce n'est pas un plateau, limiter à 1 seul groupe
    if (!concertForm.is_plateau && existingBands.length >= 1) {
      toast.error("Concert solo : Un seul groupe autorisé. Cochez 'Plateau' pour ajouter plusieurs groupes.");
      return;
    }
    
    // Vérifier si le groupe n'est pas déjà ajouté (par nom)
    if (existingBands.some(b => b && b.name === band.name)) {
      toast.info("Ce groupe est déjà ajouté");
      return;
    }
    
    setConcertForm({
      ...concertForm,
      bands: [...existingBands, {
        name: band.name,
        musician_id: band.admin_id || null,
        members_count: band.members_count || null,
        photo: band.photo || null
      }]
    });
    setSearchBandQuery("");
    setSearchedBands([]);
    toast.success(`Groupe "${band.name}" ajouté`);
  };

  // Ajouter un groupe manuellement (non inscrit)
  const addManualBand = () => {
    if (!manualBandName.trim()) return;
    
    // S'assurer que concertForm existe
    if (!concertForm) {
      return;
    }
    
    const existingBands = Array.isArray(concertForm.bands) ? concertForm.bands : [];
    
    // ⚠️ NOUVEAU : Si ce n'est pas un plateau, limiter à 1 seul groupe
    if (!concertForm.is_plateau && existingBands.length >= 1) {
      toast.error("Concert solo : Un seul groupe autorisé. Cochez 'Plateau' pour ajouter plusieurs groupes.");
      return;
    }
    
    // Vérifier si le groupe n'est pas déjà ajouté
    if (existingBands.some(b => b && b.name === manualBandName.trim())) {
      toast.info("Ce groupe est déjà ajouté");
      return;
    }
    
    setConcertForm({
      ...concertForm,
      bands: [...existingBands, {
        name: manualBandName.trim(),
        musician_id: null // Non inscrit dans la BDD
      }]
    });
    setManualBandName("");
    toast.success("Groupe ajouté");
  };

  // Supprimer un groupe de la liste du concert
  const removeBandFromConcert = (index) => {
    if (!concertForm || !Array.isArray(concertForm.bands)) {
      return;
    }
    
    const updatedBands = [...concertForm.bands];
    updatedBands.splice(index, 1);
    setConcertForm({ ...concertForm, bands: updatedBands });
  };

  // Debounce pour la recherche de groupes de concert
  useEffect(() => {
    const timer = setTimeout(() => {
      searchConcertBands(searchBandQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchBandQuery, searchConcertBands]); // FIXED: Ajout de searchConcertBands dans les dépendances

  return {
    // États
    searchBandQuery,
    setSearchBandQuery,
    searchedBands,
    loadingBands,
    manualBandName,
    setManualBandName,
    // Fonctions
    addBandFromDB,
    addManualBand,
    removeBandFromConcert
  };
}
