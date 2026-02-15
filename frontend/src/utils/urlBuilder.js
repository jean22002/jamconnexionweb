/**
 * URL Builder Utility
 * Handles image URL construction and normalization
 */

/**
 * Constructs a complete image URL from a backend path
 * @param {string} path - The image path from backend (e.g., "/api/uploads/venues/file.jpg")
 * @param {string} backendUrl - The backend URL (defaults to REACT_APP_BACKEND_URL)
 * @returns {string} Complete image URL or empty string
 */
export const buildImageUrl = (path, backendUrl = process.env.REACT_APP_BACKEND_URL) => {
  if (!path) return "";
  
  // If already a complete URL, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Construct full URL using backend URL
  // Backend returns paths like "/api/uploads/..." so we prepend the backend URL
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return `${backendUrl}${normalizedPath}`;
};

/**
 * Normalizes an image URL for saving to backend
 * Strips the backend URL and keeps only the path
 * @param {string} url - The image URL
 * @param {string} backendUrl - The backend URL
 * @returns {string} Normalized path (e.g., "/api/uploads/venues/file.jpg")
 */
export const normalizeImageUrl = (url, backendUrl = process.env.REACT_APP_BACKEND_URL) => {
  if (!url) return "";
  
  let normalized = url;
  
  // Remove full backend URL if present
  if (normalized.includes(backendUrl)) {
    normalized = normalized.replace(backendUrl, '');
  }
  
  // Remove any duplicate /api/ prefix (fix /api/api/uploads → /api/uploads)
  normalized = normalized.replace(/\/api\/api\//, '/api/');
  
  // Ensure it starts with /api/uploads if it's an upload path
  if (normalized.includes('uploads') && !normalized.startsWith('/api/uploads')) {
    normalized = normalized.replace(/^\/?(uploads\/)/, '/api/uploads/');
  }
  
  return normalized;
};

/**
 * Normalizes multiple image URLs in an object
 * @param {Object} data - Object containing image URLs
 * @param {string[]} imageFields - Array of field names that contain image URLs
 * @returns {Object} Object with normalized URLs
 */
export const normalizeImageUrls = (data, imageFields = ['profile_image', 'cover_image', 'profile_picture']) => {
  const normalized = { ...data };
  
  imageFields.forEach(field => {
    if (normalized[field]) {
      normalized[field] = normalizeImageUrl(normalized[field]);
    }
  });
  
  return normalized;
};

/**
 * Builds multiple image URLs in an object
 * @param {Object} data - Object containing image paths
 * @param {string[]} imageFields - Array of field names that contain image paths
 * @returns {Object} Object with complete URLs
 */
export const buildImageUrls = (data, imageFields = ['profile_image', 'cover_image', 'profile_picture']) => {
  const built = { ...data };
  
  imageFields.forEach(field => {
    if (built[field]) {
      built[field] = buildImageUrl(built[field]);
    }
  });
  
  return built;
};