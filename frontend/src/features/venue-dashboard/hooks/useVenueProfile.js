/**
 * Custom hook for managing venue profile data and operations
 * Handles: profile fetching, editing, saving, image uploads
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useVenueProfile(token) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Fetch venue profile
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/venues/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Save profile changes
  const saveProfile = useCallback(async (updatedProfile) => {
    if (!token) return false;
    
    setSaving(true);
    try {
      const response = await axios.put(
        `${API}/venues/me`,
        updatedProfile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data);
      setEditing(false);
      toast.success('Profil mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
      return false;
    } finally {
      setSaving(false);
    }
  }, [token]);

  // Upload profile image
  const uploadImage = useCallback(async (file, folder = 'venues') => {
    if (!token) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
      return null;
    }
  }, [token]);

  // Update specific profile field
  const updateProfileField = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    setProfile,
    loading,
    saving,
    editing,
    setEditing,
    fetchProfile,
    saveProfile,
    uploadImage,
    updateProfileField
  };
}
