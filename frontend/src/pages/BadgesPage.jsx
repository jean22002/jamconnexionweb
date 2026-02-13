import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import BadgeCard from '../components/BadgeCard';
import BadgeStats from '../components/BadgeStats';
import { Loader2, Award, TrendingUp, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BadgesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchBadgesData();
  }, []);

  const fetchBadgesData = async () => {
    try {
      setLoading(true);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all badges
      const allBadgesRes = await fetch(`${API}/api/badges/all`, { headers });
      const allBadgesData = await allBadgesRes.json();
      
      // Fetch user's badges
      const myBadgesRes = await fetch(`${API}/api/badges/my-badges`, { headers });
      const myBadgesData = await myBadgesRes.json();
      
      // Fetch stats
      const statsRes = await fetch(`${API}/api/badges/stats`, { headers });
      const statsData = await statsRes.json();

      setAllBadges(allBadgesData);
      setMyBadges(myBadgesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les badges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBadges = async () => {
    try {
      setChecking(true);
      const response = await fetch(`${API}/api/badges/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.newly_unlocked && data.newly_unlocked.length > 0) {
        toast({
          title: "🎉 Nouveaux badges !",
          description: `Vous avez débloqué ${data.newly_unlocked.length} nouveau(x) badge(s) !`
        });
        // Refresh data
        await fetchBadgesData();
      } else {
        toast({
          title: "✅ À jour",
          description: "Aucun nouveau badge à débloquer pour le moment."
        });
      }
    } catch (error) {
      console.error('Error checking badges:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les badges",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const unlockedBadges = allBadges.filter(b => b.unlocked);
  const lockedBadges = allBadges.filter(b => !b.unlocked);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Award className="w-10 h-10 text-yellow-500" />
                Badges & Gamification
              </h1>
              <p className="text-gray-400">Débloquez des badges en participant à la communauté !</p>
            </div>
            <Button 
              onClick={handleCheckBadges}
              disabled={checking}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Vérifier mes badges
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <BadgeStats stats={stats} />

        {/* Badges Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
              Tous ({allBadges.length})
            </TabsTrigger>
            <TabsTrigger value="unlocked" className="data-[state=active]:bg-green-600">
              Débloqués ({unlockedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="locked" className="data-[state=active]:bg-gray-600">
              Verrouillés ({lockedBadges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} showProgress={true} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unlocked">
            {unlockedBadges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unlockedBadges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} showProgress={false} />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Award className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-bold mb-2">Aucun badge débloqué</h3>
                  <p className="text-gray-400">Participez aux événements pour débloquer vos premiers badges !</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="locked">
            {lockedBadges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lockedBadges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} showProgress={true} />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Lock className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-bold mb-2">Tous les badges débloqués !</h3>
                  <p className="text-gray-400">Félicitations, vous avez tout débloqué ! 🎉</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}