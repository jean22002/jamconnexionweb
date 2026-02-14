import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Radio, Loader2, LogOut } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useBadgeAutoCheck } from "../hooks/useBadgeAutoCheck";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function JoinEventButton({ 
  event, 
  venueId, 
  token, 
  currentParticipation,
  onParticipationChange,
  loadingParticipations = false
}) {
  const [loading, setLoading] = useState(false);
  const [localParticipating, setLocalParticipating] = useState(false);
  const { triggerBadgeCheck } = useBadgeAutoCheck();
  
  // Sync local state with prop when it changes
  useEffect(() => {
    // Only set as participating if currentParticipation exists AND is active
    const isActive = currentParticipation && currentParticipation.active !== false;
    setLocalParticipating(isActive);
  }, [currentParticipation]);
  
  // Check if already participating in THIS event
  // Only consider as participating if currentParticipation exists AND is active
  const isActiveParticipation = currentParticipation && currentParticipation.active !== false;
  const isParticipating = isActiveParticipation || localParticipating;

  const handleJoin = async () => {
    if (!token) {
      toast.error("Connectez-vous pour participer");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/events/${event.id}/join?event_type=${event.type}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const eventTypeLabel = event.type === 'concert' ? 'concert' : 'boeuf';
      toast.success(`Vous participez au ${eventTypeLabel} chez ${response.data.venue_name} ! 🎵`);
      
      // Update local state immediately for instant UI feedback
      setLocalParticipating(true);
      
      // Notify parent to refresh participation status
      if (onParticipationChange) {
        onParticipationChange(true, event.id, event.type).catch(err => {
          console.error("Error in onParticipationChange:", err);
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la participation");
      // En cas d'erreur, ne pas changer l'état local
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/events/${event.id}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Vous avez quitté l'événement");
      
      // Update local state immediately for instant UI feedback
      setLocalParticipating(false);
      
      // Notify parent to refresh participation status
      if (onParticipationChange) {
        onParticipationChange(false, event.id, event.type).catch(err => {
          console.error("Error in onParticipationChange:", err);
        });
      }
    } catch (error) {
      // Si la participation n'est pas trouvée, c'est que l'utilisateur a déjà quitté
      if (error.response?.status === 404 && error.response?.data?.detail === "Participation not found") {
        toast.info("Vous avez déjà quitté cet événement");
        setLocalParticipating(false);
        if (onParticipationChange) {
          onParticipationChange(false, event.id, event.type).catch(err => {
            console.error("Error in onParticipationChange:", err);
          });
        }
      } else {
        toast.error(error.response?.data?.detail || "Erreur");
        // Ne pas bloquer l'UI même en cas d'erreur
        setLocalParticipating(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isParticipating) {
    return (
      <Button
        onClick={handleLeave}
        disabled={loading || loadingParticipations}
        variant="outline"
        className="rounded-full gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
        data-testid="leave-event-btn"
      >
        {loading || loadingParticipations ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            Quitter l'événement
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={loading || loadingParticipations}
      className="rounded-full gap-2 bg-green-500 hover:bg-green-600 text-white"
      data-testid="join-event-btn"
    >
      {loading || loadingParticipations ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Radio className="w-4 h-4" />
          Je participe !
        </>
      )}
    </Button>
  );
}
