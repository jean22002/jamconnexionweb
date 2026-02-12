import { useState } from 'react';

/**
 * Composant Image optimisé avec lazy loading et skeleton loader
 * 
 * @param {string} src - URL de l'image
 * @param {string} alt - Texte alternatif
 * @param {string} className - Classes CSS
 * @param {boolean} eager - Désactive lazy loading pour images above-the-fold
 * @param {string} fallback - Image de fallback si erreur
 */
export default function LazyImage({ 
  src, 
  alt = "", 
  className = "", 
  eager = false,
  fallback = null,
  ...props 
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  return (
    <div className="relative" style={{ minHeight: '1px' }}>
      {/* Skeleton loader pendant le chargement */}
      {!loaded && (
        <div 
          className={`absolute inset-0 animate-pulse bg-gray-700/50 ${className}`}
          aria-hidden="true"
        />
      )}
      
      {/* Image réelle */}
      <img
        src={error && fallback ? fallback : src}
        alt={alt}
        className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={eager ? "eager" : "lazy"}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}
