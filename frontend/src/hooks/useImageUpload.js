/**
 * useImageUpload Hook
 * Handles image upload logic with cropping
 */

import { useState } from 'react';
import { uploadFile } from '../utils/apiHelpers';
import { buildImageUrl } from '../utils/urlBuilder';
import { validateImageFile } from '../utils/imageUtils';

export const useImageUpload = (uploadEndpoint, token) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  /**
   * Upload an image file
   * @param {File|Blob} file - Image file to upload
   * @param {Object} params - Additional params (e.g., photo_type)
   * @returns {Promise<string>} Complete image URL
   */
  const uploadImage = async (file, params = {}) => {
    setUploading(true);
    setUploadError(null);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Upload to backend
      const uploadedPath = await uploadFile(uploadEndpoint, file, token, params);
      
      // Build complete URL
      const completeUrl = buildImageUrl(uploadedPath);
      
      console.log('🎉 Image uploaded successfully:', {
        path: uploadedPath,
        url: completeUrl
      });

      return completeUrl;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      setUploadError(error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    uploading,
    uploadError,
    clearError: () => setUploadError(null)
  };
};