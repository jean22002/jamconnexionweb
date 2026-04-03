import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { ReviewStats, ReviewCard } from "../../../components/ui/ReviewComponents";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ReviewsTab({
  venueId,
  token,
  showReviews,
  toggleReviewsVisibility
}) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");

  // Fetch reviews and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          axios.get(`${API}/api/reviews/venue/${venueId}/stats`),
          axios.get(`${API}/api/reviews/venue/${venueId}`)
        ]);
        
        setStats(statsRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Erreur lors du chargement des avis');
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchData();
    }
  }, [venueId]);

  // Respond to a review
  const respondToReview = async (reviewId, response) => {
    try {
      await axios.post(
        `${API}/api/reviews/${reviewId}/respond`,
        { response },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Réponse publiée avec succès ! 🎉');
      
      // Update the review in the list
      setReviews(reviews.map(r => 
        r.id === reviewId 
          ? { ...r, venue_response: response, venue_response_date: new Date().toISOString() }
          : r
      ));
      
      setRespondingTo(null);
      setResponseText('');
    } catch (error) {
      console.error('Error responding to review:', error);
      toast.error('Erreur lors de la publication de la réponse');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-xl mb-2">Gestion des avis</h2>
            <p className="text-sm text-muted-foreground">
              {showReviews
                ? "Les avis sont visibles sur votre page publique"
                : "Les avis sont masqués de votre page publique"}
            </p>
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
      </div>

      {/* Statistics */}
      <ReviewStats stats={stats} />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun avis reçu pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-xl">Tous les avis</h3>
          {reviews.map((review) => (
            <div key={review.id} className="space-y-3">
              <ReviewCard review={review} />
              
              {/* Response section */}
              {!review.venue_response && (
                <div className="ml-4 pl-4 border-l-2 border-primary/30">
                  {respondingTo === review.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Votre réponse publique..."
                        className="bg-black/20 border-white/10"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {responseText.length}/500
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => respondToReview(review.id, responseText)}
                          disabled={!responseText.trim()}
                          className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
                        >
                          Publier la réponse
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
                      size="sm"
                      className="rounded-full"
                    >
                      💬 Répondre à cet avis
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
