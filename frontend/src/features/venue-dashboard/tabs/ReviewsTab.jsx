import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import LazyImage from "../../../components/LazyImage";
import { StarRating } from "../../../components/StarRating";
import { Bell, AlertCircle, User } from "lucide-react";

export default function ReviewsTab({
  reviews,
  showReviews,
  toggleReviewsVisibility,
  totalReviews,
  averageRating,
  respondToReview
}) {
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-semibold text-xl mb-2">Gestion des avis</h2>
            {totalReviews > 0 && (
              <div className="flex items-center gap-4">
                <StarRating rating={averageRating} />
                <span className="text-muted-foreground">{totalReviews} avis</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="show-reviews">Afficher publiquement</Label>
            <Switch
              id="show-reviews"
              checked={showReviews}
              onCheckedChange={toggleReviewsVisibility}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {showReviews
            ? "Les avis sont visibles sur votre page publique"
            : "Les avis sont masqués de votre page publique"}
        </p>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun avis reçu pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className={`glassmorphism rounded-xl p-5 ${review.is_reported ? 'border-2 border-red-500/50' : ''}`}>
              {review.is_reported && (
                <div className="mb-3 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Avis signalé comme inapproprié
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {review.musician_image ? (
                    <LazyImage 
                      src={review.musician_image} 
                      alt={review.musician_name} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{review.musician_name}</p>
                    <StarRating rating={review.rating} size="w-4 h-4" showNumber={false} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {review.comment && (
                <p className="text-muted-foreground mb-3">{review.comment}</p>
              )}

              {review.venue_response ? (
                <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-primary/5 p-3 rounded">
                  <p className="text-sm font-semibold text-primary mb-1">Votre réponse</p>
                  <p className="text-sm">{review.venue_response}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(review.venue_response_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  {respondingTo === review.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Votre réponse..."
                        className="bg-black/20 border-white/10"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            respondToReview(review.id, responseText);
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                          className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                        >
                          Publier
                        </Button>
                        <Button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                          variant="outline"
                          className="flex-1 rounded-full"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setRespondingTo(review.id)}
                      variant="outline"
                      className="rounded-full"
                    >
                      Répondre à cet avis
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
