import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "./button";
import { Music, Radio, X, MapPin, Clock, Users } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Badge showing musician is currently at an event
export function LiveParticipationBadge({ musicianId, token, showDetails = true }) {
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchParticipation = useCallback(async () => {
    try {
      const endpoint = token 
        ? `${API}/musicians/me/current-participation`
        : `${API}/musicians/${musicianId}/current-participation`;
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(endpoint, { headers });
      setParticipation(response.data);
    } catch (error) {
      setParticipation(null);
    } finally {
      setLoading(false);
    }
  }, [musicianId, token]);

  useEffect(() => {
    fetchParticipation();
    // Poll every 30 seconds
    const interval = setInterval(fetchParticipation, 30000);
    return () => clearInterval(interval);
  }, [fetchParticipation]);

  const handleLeave = async () => {
    if (!token || !participation) return;
    try {
      await axios.post(`${API}/events/${participation.event_id}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipation(null);
    } catch (error) {
      console.error("Error leaving event:", error);
    }
  };

  if (loading || !participation) return null;

  return (
    <div className="animate-pulse-glow rounded-xl p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">En jam session!</span>
          </div>
          
          {showDetails && (
            <Link to={`/venue/${participation.venue_id}`} className="text-white hover:text-green-300 transition-colors">
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{participation.venue_name}</span>
              </div>
            </Link>
          )}
        </div>

        {token && (
          <Button
            onClick={handleLeave}
            variant="ghost"
            size="sm"
            className="text-green-400 hover:text-white hover:bg-green-500/20 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Component to join an active event
export function JoinEventButton({ eventId, eventType = "jam", venueName, token, onJoin }) {
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    try {
      await axios.post(`${API}/events/${eventId}/join?event_type=${eventType}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasJoined(true);
      onJoin?.();
    } catch (error) {
      console.error("Error joining event:", error);
      // If already participating, show as joined
      if (error.response?.data?.detail === "Already participating in this event") {
        setHasJoined(true);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!token) return;
    try {
      await axios.post(`${API}/events/${eventId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasJoined(false);
    } catch (error) {
      console.error("Error leaving event:", error);
    }
  };

  if (hasJoined) {
    return (
      <Button
        onClick={handleLeave}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full gap-2 animate-pulse"
      >
        <Radio className="w-4 h-4" />
        Je participe!
        <X className="w-4 h-4 ml-2" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={joining || !token}
      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full gap-2 shadow-lg shadow-green-500/30"
    >
      {joining ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Connexion...
        </>
      ) : (
        <>
          <Radio className="w-4 h-4" />
          Je participe!
        </>
      )}
    </Button>
  );
}

// Active event card with participants
export function ActiveEventCard({ event, token, userRole, onParticipationChange }) {
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/events/${event.id}/participants`);
      setParticipants(response.data);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  }, [event.id]);

  useEffect(() => {
    fetchParticipants();
    // Poll every 30 seconds
    const interval = setInterval(fetchParticipants, 30000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  const handleJoin = () => {
    fetchParticipants();
    onParticipationChange?.();
  };

  return (
    <div className="glassmorphism rounded-2xl p-5 border-2 border-green-500/50 relative overflow-hidden">
      {/* Live indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse"></div>
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">EN COURS</span>
            </div>
          </div>
          <h3 className="font-heading font-semibold text-lg">Boeuf Musical</h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            <Clock className="w-4 h-4" />
            <span>{event.start_time} - {event.end_time}</span>
          </div>
        </div>
        
        {userRole === "musician" && (
          <JoinEventButton
            eventId={event.id}
            eventType={event.type}
            venueName={event.venue_name}
            token={token}
            onJoin={handleJoin}
          />
        )}
      </div>

      {/* Music styles */}
      {event.music_styles?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {event.music_styles.map((style, i) => (
            <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
              {style}
            </span>
          ))}
        </div>
      )}

      {/* Participants */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
        </div>
        
        {loadingParticipants ? (
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full bg-muted/50 animate-pulse"></div>
            ))}
          </div>
        ) : participants.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <Link key={p.musician_id} to={`/musician/${p.musician_id}`}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full hover:bg-green-500/20 transition-colors">
                  {p.profile_image ? (
                    <img src={p.profile_image} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center">
                      <Music className="w-3 h-3 text-green-400" />
                    </div>
                  )}
                  <span className="text-sm text-green-300">{p.pseudo}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun participant pour le moment</p>
        )}
      </div>
    </div>
  );
}

// Small badge for musician cards/lists
export function MusicianLiveBadge({ musicianId }) {
  const [isLive, setIsLive] = useState(false);
  const [venueName, setVenueName] = useState("");

  useEffect(() => {
    const checkLive = async () => {
      try {
        const response = await axios.get(`${API}/musicians/${musicianId}/current-participation`);
        if (response.data) {
          setIsLive(true);
          setVenueName(response.data.venue_name);
        } else {
          setIsLive(false);
        }
      } catch (error) {
        setIsLive(false);
      }
    };

    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, [musicianId]);

  if (!isLive) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/50">
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
      </div>
      <span className="text-green-400 text-xs font-medium">En jam</span>
    </div>
  );
}
