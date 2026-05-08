import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Textarea } from './textarea';
import { Label } from './label';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Rating Star Component
 */
function StarRating({ value, onChange, label, disabled = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => !disabled && setHover(0)}
            disabled={disabled}
            className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-3 text-sm text-muted-foreground self-center">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Review Modal Component
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onOpenChange - Callback to change open state
 * @param {object} venue - Venue object {id, name}
 * @param {object} event - Event object {id, title, date}
 * @param {string} token - JWT token
 * @param {function} onSuccess - Callback after successful review
 */
export default function ReviewModal({
  open,
  onOpenChange,
  venue,
  event,
  token,
  onSuccess
}) {
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    overall: 0,
    ambiance: 0,
    quality: 0,
    professionalism: 0
  });
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (ratings.overall === 0) {
      toast.error('Veuillez donner une note globale');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${API}/api/reviews`,
        {
          venue_id: venue.id,
          event_id: event.id,
          overall_rating: ratings.overall,
          ambiance_rating: ratings.ambiance || null,
          quality_rating: ratings.quality || null,
          professionalism_rating: ratings.professionalism || null,
          comment: comment.trim() || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Avis publié avec succès ! 🎉');
      
      // Reset form
      setRatings({ overall: 0, ambiance: 0, quality: 0, professionalism: 0 });
      setComment('');
      
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Review error:', error);
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Vous avez déjà noté cet événement');
      } else if (error.response?.status === 403) {
        toast.error('Vous devez être musicien pour laisser un avis');
      } else {
        toast.error('Erreur lors de la publication de l\'avis');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glassmorphism border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            ⭐ Noter {venue?.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Événement : {event?.title} ({event?.date})
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Note globale (obligatoire) */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
            <StarRating
              value={ratings.overall}
              onChange={(val) => setRatings({ ...ratings, overall: val })}
              label="Note globale *"
              disabled={submitting}
            />
          </div>

          {/* Critères détaillés (optionnels) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Critères détaillés (optionnel)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StarRating
                value={ratings.ambiance}
                onChange={(val) => setRatings({ ...ratings, ambiance: val })}
                label="🎵 Ambiance"
                disabled={submitting}
              />
              
              <StarRating
                value={ratings.quality}
                onChange={(val) => setRatings({ ...ratings, quality: val })}
                label="🎸 Qualité"
                disabled={submitting}
              />
              
              <StarRating
                value={ratings.professionalism}
                onChange={(val) => setRatings({ ...ratings, professionalism: val })}
                label="💼 Professionnalisme"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec cet établissement..."
              className="bg-black/20 border-white/10 min-h-[120px]"
              maxLength={1000}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 caractères
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || ratings.overall === 0}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  Publier l'avis
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
