/**
 * useProfileManager Hook
 * Manages profile state, fetching, and saving
 */

import { useState, useCallback, useEffect } from 'react';
import { fetchProfile as apiFetchProfile, saveProfile as apiSaveProfile, handleApiError } from '../utils/apiHelpers';
import { processImageDataFromBackend } from '../utils/imageUtils';
import { toast } from 'sonner';

/**
 * @param {Object} config
 * @param {string} config.fetchEndpoint - Endpoint to fetch profile (e.g., '/venues/me')
 * @param {string} config.saveEndpoint - Endpoint to save profile (e.g., '/venues')
 * @param {string} config.token - Auth token
 * @param {Function} config.onNavigate - Navigation function
 * @param {Object} config.initialFormData - Initial form data structure
 * @param {string[]} config.imageFields - Image field names
 */
export const useProfileManager = ({
  fetchEndpoint,
  saveEndpoint,
  token,
  onNavigate,
  initialFormData = {},
  imageFields = ['profile_image', 'cover_image']
}) => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Fetch profile from backend
   */
  const fetchProfile = useCallback(async () => {
    if (!token) {
      onNavigate?.('/login');
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetchProfile(fetchEndpoint, token);
      
      // Process image URLs
      const processedData = processImageDataFromBackend(data, imageFields);
      
      setProfile(processedData);
      setFormData(prev => ({ ...prev, ...processedData }));
      
      console.log('✅ Profile fetched:', processedData);
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      const message = handleApiError(error, 'Erreur lors du chargement du profil');
      toast.error(message);
      
      if (error.response?.status === 401) {
        onNavigate?.('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, fetchEndpoint, imageFields, onNavigate]);

  /**
   * Save profile to backend
   * @param {Object} dataToSave - Data to save (defaults to formData)
   * @param {boolean} isNew - Whether this is creating a new profile
   */
  const saveProfile = async (dataToSave = formData, isNew = false) => {
    setSaving(true);

    try {
      console.log('💾 Saving profile...', dataToSave);
      
      // Save to backend
      const savedData = await apiSaveProfile(
        saveEndpoint,
        dataToSave,
        token,
        isNew,
        imageFields
      );
      
      // Process response and update state
      const processedData = processImageDataFromBackend(savedData, imageFields);
      
      setProfile(processedData);
      setFormData(prev => ({ ...prev, ...processedData }));
      
      console.log('✅ Profile saved:', processedData);
      toast.success(isNew ? 'Profil créé avec succès!' : 'Profil sauvegardé!');
      
      setEditing(false);
      
      return processedData;
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      const message = handleApiError(error, 'Erreur lors de la sauvegarde');
      toast.error(message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update form field
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Update multiple fields
   */
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset form to profile data
   */
  const resetForm = useCallback(() => {
    setFormData(prev => ({ ...prev, ...profile }));
    setEditing(false);
  }, [profile]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    // State
    profile,
    formData,
    editing,
    loading,
    saving,
    
    // Actions
    setFormData,
    setEditing,
    updateField,
    updateFields,
    saveProfile,
    fetchProfile,
    resetForm
  };
};