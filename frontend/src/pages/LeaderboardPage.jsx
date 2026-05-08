import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Crown, TrendingUp, Filter, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LazyImage from '../components/LazyImage';
import { Button } from '../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

export default function LeaderboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [category]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const categoryParam = category !== 'all' ? `?category=${category}` : '';
      const response = await fetch(`${API}/api/badges/leaderboard${categoryParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <Award className="w-5 h-5 text-muted-foreground" />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-red-500';
    return 'from-primary/50 to-accent/50';
  };

  const getCategoryLabel = (role) => {
    const labels = {
      musician: 'Musicien',
      venue: 'Établissement',
      melomane: 'Mélomane'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-primary" />
            <h1 className="font-heading font-bold text-4xl">Classement</h1>
          </div>
          <p className="text-muted-foreground">
            Les meilleurs contributeurs de la communauté Jam Connexion
          </p>
        </div>

        {/* Filters */}
        <div className="glassmorphism rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrer par catégorie</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'musician', label: 'Musiciens' },
              { value: 'venue', label: 'Établissements' },
              { value: 'melomane', label: 'Mélomanes' }
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  category === cat.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="glassmorphism rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du classement...</p>
          </div>
        ) : (
          /* Leaderboard */
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user && entry.user_id === user.id;

              return (
                <div
                  key={entry.user_id}
                  className={`glassmorphism rounded-2xl p-4 transition-all hover:scale-[1.02] ${
                    isCurrentUser ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(
                          rank
                        )} flex items-center justify-center font-bold text-white shadow-lg`}
                      >
                        {rank <= 3 ? getRankIcon(rank) : rank}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {entry.profile_picture ? (
                        <LazyImage
                          src={entry.profile_picture}
                          alt={entry.pseudo || entry.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xl font-bold">
                            {(entry.pseudo || entry.name || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">
                          {entry.pseudo || entry.name}
                        </h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                            Vous
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="capitalize">{getCategoryLabel(entry.role)}</span>
                        <span>•</span>
                        <span>Niveau {entry.level}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="font-bold text-lg">{entry.total_points}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" />
                        <span className="text-sm text-muted-foreground">
                          {entry.badges_count} badge{entry.badges_count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {leaderboard.length === 0 && (
              <div className="glassmorphism rounded-2xl p-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Aucun classement disponible pour cette catégorie
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="glassmorphism rounded-2xl p-4 mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            💡 Gagnez des badges en participant à des événements, en créant des connexions et en contribuant à la communauté !
          </p>
        </div>
      </div>
    </div>
  );
}
