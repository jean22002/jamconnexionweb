/**
 * API Helper Functions
 * Common patterns for API calls
 */

import axios from 'axios';
import { normalizeImageUrls } from './urlBuilder';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Creates headers with authorization token
 * @param {string} token - JWT token
 * @returns {Object} Headers object
 */
export const createAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

/**
 * Generic profile save function
 * @param {string} endpoint - API endpoint (e.g., '/venues', '/musicians')
 * @param {Object} data - Profile data to save
 * @param {string} token - Auth token
 * @param {boolean} isNew - Whether this is a new profile (POST) or update (PUT)
 * @param {string[]} imageFields - Image fields to normalize
 * @returns {Promise<Object>} Response data
 */
export const saveProfile = async (endpoint, data, token, isNew = false, imageFields = ['profile_image', 'cover_image']) => {
  // Normalize image URLs before sending
  const normalizedData = normalizeImageUrls(data, imageFields);
  
  const method = isNew ? 'post' : 'put';
  const url = `${API_BASE}${endpoint}`;
  
  const response = await axios[method](url, normalizedData, {
    headers: createAuthHeaders(token)
  });
  
  return response.data;
};

/**
 * Generic profile fetch function
 * @param {string} endpoint - API endpoint (e.g., '/venues/me', '/musicians/me')
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Profile data
 */
export const fetchProfile = async (endpoint, token) => {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await axios.get(url, {
    headers: createAuthHeaders(token)
  });
  
  return response.data;
};

/**
 * Upload file to backend
 * @param {string} endpoint - Upload endpoint (e.g., '/upload/venue-photo')
 * @param {File|Blob} file - File to upload
 * @param {string} token - Auth token
 * @param {Object} params - Additional query params
 * @returns {Promise<string>} Uploaded file URL
 */
export const uploadFile = async (endpoint, file, token, params = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Build URL with query params
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
  
  const response = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data.url;
};

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, defaultMessage = "Une erreur est survenue") => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};