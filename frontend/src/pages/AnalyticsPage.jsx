import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft, TrendingUp, Users, Calendar, MessageSquare, 
  Award, Flag, Shield, Activity, Loader2, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AnalyticsPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error("Accès réservé aux administrateurs");
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchEngagement(),
        fetchTimeseriesData('users'),
        fetchTimeseriesData('events'),
        fetchTimeseriesData('reports')
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Erreur lors du chargement des analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await axios.get(
        `${API}/api/analytics/overview?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchEngagement = async () => {
    try {
      const response = await axios.get(
        `${API}/api/analytics/engagement`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEngagement(response.data);
    } catch (error) {
      console.error('Error fetching engagement:', error);
    }
  };

  const fetchTimeseriesData = async (metric) => {
    try {
      const response = await axios.get(
        `${API}/api/analytics/timeseries?metric=${metric}&period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTimeseriesData(prev => ({ ...prev, [metric]: response.data }));
    } catch (error) {
      console.error(`Error fetching timeseries for ${metric}:`, error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculateGrowth = (newVal, total) => {
    if (total === 0) return 0;
    return ((newVal / total) * 100).toFixed(1);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glassmorphism border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/reports">
                <Button variant="outline" size="sm" className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard Admin
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Analytics & Métriques</h1>
                  <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme</p>
                </div>
              </div>
            </div>
            
            {/* Sélecteur de période */}
            <div className="flex items-center gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="90d">90 derniers jours</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={logout} variant="outline" className="rounded-full">
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : overview ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Utilisateurs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                  <Users className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(overview.users.total)}</div>
                  <p className="text-xs text-muted-foreground">
                    +{overview.users.new} nouveaux ({calculateGrowth(overview.users.new, overview.users.total)}%)
                  </p>
                  <div className="mt-2 text-xs">
                    {overview.users.active} actifs
                  </div>
                </CardContent>
              </Card>

              {/* Événements */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Événements</CardTitle>
                  <Calendar className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(overview.events.total)}</div>
                  <p className="text-xs text-muted-foreground">
                    +{overview.events.new} nouveaux
                  </p>
                  <div className="mt-2 text-xs">
                    {overview.events.participations.total} participations
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(overview.social.messages.total)}</div>
                  <p className="text-xs text-muted-foreground">
                    +{overview.social.messages.new} nouveaux
                  </p>
                  <div className="mt-2 text-xs">
                    {overview.social.friendships.total} amitiés
                  </div>
                </CardContent>
              </Card>

              {/* Modération */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Modération</CardTitle>
                  <Shield className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.moderation.reports.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {overview.moderation.reports.pending} en attente
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    Taux résolution: {overview.moderation.reports.resolution_rate}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="users">
                  <Users className="w-4 h-4 mr-2" />
                  Utilisateurs
                </TabsTrigger>
                <TabsTrigger value="events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Événements
                </TabsTrigger>
                <TabsTrigger value="engagement">
                  <Activity className="w-4 h-4 mr-2" />
                  Engagement
                </TabsTrigger>
                <TabsTrigger value="gamification">
                  <Award className="w-4 h-4 mr-2" />
                  Gamification
                </TabsTrigger>
                <TabsTrigger value="moderation">
                  <Flag className="w-4 h-4 mr-2" />
                  Modération
                </TabsTrigger>
              </TabsList>

              {/* Utilisateurs */}
              <TabsContent value="users">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par Rôle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Musiciens</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(overview.users.by_role.musicians / overview.users.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{overview.users.by_role.musicians}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Établissements</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500" 
                                style={{ width: `${(overview.users.by_role.venues / overview.users.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{overview.users.by_role.venues}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mélomanes</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500" 
                                style={{ width: `${(overview.users.by_role.melomanes / overview.users.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{overview.users.by_role.melomanes}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tendance des Inscriptions</CardTitle>
                      <CardDescription>Évolution sur la période sélectionnée</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {timeseriesData.users && (
                        <div className="h-[200px] flex items-end gap-1">
                          {timeseriesData.users.data.map((point, index) => {
                            const maxValue = Math.max(...timeseriesData.users.data.map(p => p.value), 1);
                            const height = (point.value / maxValue) * 100;
                            return (
                              <div
                                key={index}
                                className="flex-1 bg-primary/80 hover:bg-primary transition-colors rounded-t cursor-pointer"
                                style={{ height: `${height}%` }}
                                title={`${new Date(point.date).toLocaleDateString()}: ${point.value} nouveaux`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Événements */}
              <TabsContent value="events">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Types d'Événements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {overview.events.by_type.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{item.type}</span>
                            <span className="text-sm font-semibold">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Nouveaux Événements</CardTitle>
                      <CardDescription>Créations sur la période</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {timeseriesData.events && (
                        <div className="h-[200px] flex items-end gap-1">
                          {timeseriesData.events.data.map((point, index) => {
                            const maxValue = Math.max(...timeseriesData.events.data.map(p => p.value), 1);
                            const height = (point.value / maxValue) * 100;
                            return (
                              <div
                                key={index}
                                className="flex-1 bg-purple-500/80 hover:bg-purple-500 transition-colors rounded-t cursor-pointer"
                                style={{ height: `${height}%` }}
                                title={`${new Date(point.date).toLocaleDateString()}: ${point.value} événements`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Engagement */}
              <TabsContent value="engagement">
                {engagement && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Taux de Conversion</CardTitle>
                          <CardDescription>Utilisateurs qui participent à des événements</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold text-primary">{engagement.conversion_rate}%</div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Moyenne: {engagement.avg_participations_per_user} participations/utilisateur
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Événements Populaires</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {engagement.popular_events.slice(0, 5).map((event, index) => (
                              <div key={index} className="glassmorphism rounded-lg p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold line-clamp-1">{event.title}</span>
                                  <span className="text-xs text-primary">{event.participation_count} 👥</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Utilisateurs les Plus Actifs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {engagement.most_active_users.slice(0, 10).map((user, index) => (
                            <div key={index} className="glassmorphism rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{user.name}</span>
                                <span className="text-sm text-primary">{user.participation_count} événements</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Gamification */}
              <TabsContent value="gamification">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Badges Débloqués</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-4">{overview.gamification.badges_unlocked.total}</div>
                      <p className="text-sm text-muted-foreground">
                        +{overview.gamification.badges_unlocked.new} nouveaux sur la période
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Badges</CardTitle>
                      <CardDescription>Les plus débloqués</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {overview.gamification.top_badges.slice(0, 5).map((badge, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{badge.badge_id}</span>
                            <span className="text-sm font-semibold">{badge.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Modération */}
              <TabsContent value="moderation">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Signalements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {timeseriesData.reports && (
                        <div className="h-[200px] flex items-end gap-1 mb-4">
                          {timeseriesData.reports.data.map((point, index) => {
                            const maxValue = Math.max(...timeseriesData.reports.data.map(p => p.value), 1);
                            const height = (point.value / maxValue) * 100;
                            return (
                              <div
                                key={index}
                                className="flex-1 bg-red-500/80 hover:bg-red-500 transition-colors rounded-t cursor-pointer"
                                style={{ height: `${height}%` }}
                                title={`${new Date(point.date).toLocaleDateString()}: ${point.value} signalements`}
                              />
                            );
                          })}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">En attente</p>
                          <p className="text-2xl font-bold text-yellow-500">{overview.moderation.reports.pending}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Résolus</p>
                          <p className="text-2xl font-bold text-green-500">{overview.moderation.reports.resolved}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sanctions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="glassmorphism rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-2">Utilisateurs suspendus</p>
                          <p className="text-3xl font-bold text-orange-500">{overview.moderation.suspended_users}</p>
                        </div>
                        <div className="glassmorphism rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-2">Bannissements permanents</p>
                          <p className="text-3xl font-bold text-red-500">{overview.moderation.permanently_banned}</p>
                        </div>
                        <div className="glassmorphism rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-2">Taux de résolution</p>
                          <p className="text-3xl font-bold text-green-500">{overview.moderation.reports.resolution_rate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        )}
      </main>
    </div>
  );
}
