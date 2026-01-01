import { useState } from "react";
import { Button } from "./ui/button";
import { Radio, Loader2, LogOut } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function JoinEventButton({ 
  event, 
  venueId, 
  token, 
  currentParticipation,
  onParticipationChange 
}) {
  const [loading, setLoading] = useState(false);
  
  // Check if already participating in THIS event
  const isParticipating = currentParticipation && currentParticipation.event_id === event.id;

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
      
      toast.success(`Vous participez au boeuf chez ${response.data.venue_name} ! 🎵`);
      
      // Notify parent to refresh participation status
      if (onParticipationChange) {
        onParticipationChange();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la participation");
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
      
      // Notify parent to refresh participation status
      if (onParticipationChange) {
        onParticipationChange();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (isParticipating) {
    return (
      <Button
        onClick={handleLeave}
        disabled={loading}
        variant="outline"
        className="rounded-full gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
        data-testid="leave-event-btn"
      >
        {loading ? (
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
      disabled={loading}
      className="rounded-full gap-2 bg-green-500 hover:bg-green-600 text-white"
      data-testid="join-event-btn"
    >
      {loading ? (
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
