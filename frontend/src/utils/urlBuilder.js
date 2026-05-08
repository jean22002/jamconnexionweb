/**
 * URL Builder Utility
 * Handles image URL construction and normalization
 */

/**
 * Constructs a complete image URL from a backend path
 * @param {string} path - The image path from backend (e.g., "/api/uploads/venues/file.jpg")
 * @param {string} backendUrl - Optional backend URL (if different from current domain)
 * @returns {string} Complete image URL or empty string
 * 
 * If path is already absolute (starts with http) or relative (starts with /), returns as-is.
 * This allows the browser to use the current domain automatically.
 */
export const buildImageUrl = (path, backendUrl) => {
  if (!path) return "";
  
  // If path contains old domain URLs, extract just the path
  if (path.includes('jamconnexion.com') || path.includes('image-crop-test') || path.includes('preview.emergentagent.com')) {
    // Extract the path after the domain
    const urlMatch = path.match(/https?:\/\/[^/]+(\/api\/uploads\/.+)$/);
    if (urlMatch) {
      return urlMatch[1]; // Return just the /api/uploads/... part
    }
  }
  
  // If already a complete URL (but not old domains), return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // If path starts with /, it's already relative - return as-is
  // The browser will use the current domain (jamconnexion.com or preview)
  if (path.startsWith('/')) {
    return path;
  }
  
  // Otherwise, ensure it starts with /
  return `/${path}`;
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