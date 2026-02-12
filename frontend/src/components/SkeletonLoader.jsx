/**
 * Composant Skeleton Loader pour affichage pendant le chargement
 * 
 * Usage:
 * <SkeletonLoader variant="text" />
 * <SkeletonLoader variant="circular" width={50} height={50} />
 * <SkeletonLoader variant="rectangular" width="100%" height={200} />
 */
export default function SkeletonLoader({ 
  variant = "text", 
  width, 
  height, 
  className = "",
  count = 1 
}) {
  const baseClass = "animate-pulse bg-gradient-to-r from-gray-700/50 via-gray-600/50 to-gray-700/50 bg-[length:200%_100%]";
  
  const variantStyles = {
    text: "h-4 rounded w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl h-48 w-full"
  };

  const style = {
    width: width || (variant === "circular" ? height : "100%"),
    height: height || (variant === "text" ? "1rem" : "auto")
  };

  // Support pour plusieurs lignes de skeleton (utile pour listes)
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${variantStyles[variant]} ${className}`}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${variantStyles[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Chargement en cours"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}

/**
 * Skeleton pour une carte de profil
 */
export function ProfileCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl glassmorphism border border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <SkeletonLoader variant="circular" width={64} height={64} />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="60%" height={20} />
          <SkeletonLoader variant="text" width="40%" height={16} />
        </div>
      </div>
      <SkeletonLoader variant="rectangular" height={100} />
    </div>
  );
}

/**
 * Skeleton pour une liste d'éléments
 */
export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl glassmorphism border border-white/10">
          <div className="flex items-center gap-3">
            <SkeletonLoader variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <SkeletonLoader variant="text" width="70%" height={16} />
              <SkeletonLoader variant="text" width="50%" height={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour les statistiques
 */
export function StatsSkeleton() {
  return (
    <div className="flex gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <SkeletonLoader variant="text" width={80} height={32} className="mb-2" />
          <SkeletonLoader variant="text" width={100} height={16} />
        </div>
      ))}
    </div>
  );
}
