import { Star } from "lucide-react";

export function StarRating({ rating, size = "w-5 h-5", showNumber = true }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-600"
          }`}
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export function StarRatingInput({ rating, onRatingChange, size = "w-8 h-8" }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${size} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600 hover:text-yellow-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
