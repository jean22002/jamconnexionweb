import { useState } from 'react';

/**
 * Composant Image optimisé avec lazy loading et skeleton loader
 * 
 * @param {string} src - URL de l'image
 * @param {string} alt - Texte alternatif
 * @param {string} className - Classes CSS
 * @param {boolean} eager - Désactive lazy loading pour images above-the-fold
 * @param {string} fallback - Image de fallback si erreur
 * @param {boolean} showPlaceholder - Affiche un placeholder visuel en cas d'erreur (default: true)
 */
export default function LazyImage({ 
  src, 
  alt = "", 
  className = "", 
  eager = false,
  fallback = null,
  showPlaceholder = true,
  ...props 
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  // Si erreur et pas de fallback, afficher un placeholder
  if (error && !fallback && showPlaceholder) {
    return (
      <div 
        className={`${className} bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center`}
        aria-label={alt || "Image non disponible"}
      >
        <svg 
          className="w-1/2 h-1/2 text-white/30" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: '1px' }}>
      {/* Skeleton loader pendant le chargement */}
      {!loaded && !error && (
        <div 
          className={`absolute inset-0 animate-pulse bg-gray-700/50 ${className}`}
          aria-hidden="true"
        />
      )}
      
      {/* Image réelle */}
      {!error && (
        <img
          src={fallback || src}
          alt={alt}
          className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading={eager ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}
