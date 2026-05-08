/**
 * Image Utilities
 * Helper functions for image handling
 */

import { buildImageUrl, normalizeImageUrl } from './urlBuilder';

/**
 * Validates if a file is a valid image
 * @param {File} file - The file to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!file) {
    return { valid: false, error: "Aucun fichier sélectionné" };
  }
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Format non supporté. Utilisez JPG, PNG, GIF ou WebP." };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: "Fichier trop volumineux. Maximum 10MB." };
  }
  
  return { valid: true, error: null };
};

/**
 * Prepares image data for saving to backend
 * @param {Object} formData - Form data containing image URLs
 * @param {string[]} imageFields - Fields to process
 * @returns {Object} Prepared data with normalized URLs
 */
export const prepareImageDataForSave = (formData, imageFields = ['profile_image', 'cover_image']) => {
  const prepared = { ...formData };
  
  imageFields.forEach(field => {
    if (prepared[field]) {
      prepared[field] = normalizeImageUrl(prepared[field]);
    }
  });
  
  return prepared;
};

/**
 * Processes image data from backend response
 * @param {Object} responseData - Response from backend
 * @param {string[]} imageFields - Fields to process
 * @returns {Object} Processed data with complete URLs
 */
export const processImageDataFromBackend = (responseData, imageFields = ['profile_image', 'cover_image']) => {
  const processed = { ...responseData };
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  
  imageFields.forEach(field => {
    if (processed[field]) {
      processed[field] = buildImageUrl(processed[field], BACKEND_URL);
    }
  });
  
  return processed;
};