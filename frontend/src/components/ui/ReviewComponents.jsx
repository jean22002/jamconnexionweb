import { Star } from 'lucide-react';
import LazyImage from '../LazyImage';

/**
 * Display rating stars (read-only)
 */
function StarDisplay({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && hasHalfStar
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-600'
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

/**
 * Review Card Component
 */
export function ReviewCard({ review }) {
  return (
    <div className="glassmorphism p-4 rounded-xl space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {review.musician_image ? (
            <LazyImage
              src={review.musician_image}
              alt={review.musician_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-semibold">
                {review.musician_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          
          <div>
            <p className="font-semibold">{review.musician_name}</p>
            <p className="text-xs text-muted-foreground">
              {review.event_title && `${review.event_title} • `}
              {new Date(review.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <StarDisplay rating={review.overall_rating} />
      </div>

      {/* Detailed ratings */}
      {(review.ambiance_rating || review.quality_rating || review.professionalism_rating) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {review.ambiance_rating && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">🎵 Ambiance:</span>
              <span className="font-medium">{review.ambiance_rating.toFixed(1)}</span>
            </div>
          )}
          {review.quality_rating && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">🎸 Qualité:</span>
              <span className="font-medium">{review.quality_rating.toFixed(1)}</span>
            </div>
          )}
          {review.professionalism_rating && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">💼 Pro:</span>
              <span className="font-medium">{review.professionalism_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm leading-relaxed">{review.comment}</p>
      )}

      {/* Venue response */}
      {review.venue_response && (
        <div className="mt-3 p-3 bg-primary/10 border-l-2 border-primary rounded">
          <p className="text-xs font-semibold text-primary mb-1">
            Réponse de l'établissement
          </p>
          <p className="text-sm">{review.venue_response}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(review.venue_response_date).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Review Stats Component
 */
export function ReviewStats({ stats }) {
  if (!stats || stats.total_reviews === 0) {
    return (
      <div className="glassmorphism p-6 rounded-xl text-center">
        <p className="text-muted-foreground">Aucun avis pour le moment</p>
      </div>
    );
  }

  const { total_reviews, average_overall, average_ambiance, average_quality, average_professionalism, rating_distribution } = stats;

  return (
    <div className="glassmorphism p-6 rounded-xl space-y-4">
      {/* Overall rating */}
      <div className="text-center pb-4 border-b border-white/10">
        <div className="text-5xl font-bold text-primary mb-2">
          {average_overall.toFixed(1)}
        </div>
        <StarDisplay rating={average_overall} />
        <p className="text-sm text-muted-foreground mt-2">
          Basé sur {total_reviews} avis
        </p>
      </div>

      {/* Detailed averages */}
      {(average_ambiance > 0 || average_quality > 0 || average_professionalism > 0) && (
        <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
          {average_ambiance > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold">{average_ambiance.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">🎵 Ambiance</p>
            </div>
          )}
          {average_quality > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold">{average_quality.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">🎸 Qualité</p>
            </div>
          )}
          {average_professionalism > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold">{average_professionalism.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">💼 Pro</p>
            </div>
          )}
        </div>
      )}

      {/* Rating distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = rating_distribution[stars] || 0;
          const percentage = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
          
          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm w-12">{stars} ⭐</span>
              <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
