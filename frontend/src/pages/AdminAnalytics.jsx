import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Calendar, TrendingUp, AlertCircle, MapPin, Bell } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [usersGrowth, setUsersGrowth] = useState([]);
  const [eventsStats, setEventsStats] = useState([]);
  const [participationStats, setParticipationStats] = useState([]);
  const [geography, setGeography] = useState([]);
  const [period, setPeriod] = useState('30d');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Charger toutes les données analytics
      const [overviewRes, growthRes, eventsRes, partRes, geoRes] = await Promise.all([
        axios.get(`${API}/api/analytics/overview?period=${period}`, { headers }),
        axios.get(`${API}/api/analytics/timeseries?metric=users&period=${period}`, { headers }),
        axios.get(`${API}/api/analytics/timeseries?metric=events&period=${period}`, { headers }),
        axios.get(`${API}/api/analytics/engagement?period=${period}`, { headers }),
        axios.get(`${API}/api/analytics/overview?period=${period}`, { headers }) // Temporaire
      ]);

      setOverview(overviewRes.data);
      
      // Formater les données pour Recharts
      if (growthRes.data.data) {
        setUsersGrowth(growthRes.data.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          musicians: item.musicians || 0,
          venues: item.venues || 0,
          melomanes: item.melomanes || 0
        })));
      }

      if (eventsRes.data.data) {
        setEventsStats(eventsRes.data.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          jams: item.jams || 0,
          concerts: item.concerts || 0,
          karaokes: item.karaokes || 0,
          spectacles: item.spectacles || 0
        })));
      }

      // Mock geography data (à remplacer par vraies données)
      setGeography([
        { city: 'Paris', total: 450 },
        { city: 'Lyon', total: 280 },
        { city: 'Marseille', total: 220 },
        { city: 'Toulouse', total: 180 },
        { city: 'Bordeaux', total: 150 }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 Dashboard Analytics</h1>
          <p className="text-gray-300">Vue d'ensemble de la plateforme Jam Connexion</p>
        </div>

        {/* Sélecteur de période */}
        <div className="mb-6 flex gap-2">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : p === '90d' ? '90 jours' : '1 an'}
            </button>
          ))}
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Utilisateurs Total</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {overview?.users?.total || 0}
              </div>
              <p className="text-xs text-green-400 mt-1">
                +{overview?.users?.new_users || 0} cette période
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Événements</CardTitle>
              <Calendar className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {overview?.events?.total || 0}
              </div>
              <p className="text-xs text-green-400 mt-1">
                +{overview?.events?.new_events || 0} cette période
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Participations</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {overview?.engagement?.participations || 0}
              </div>
              <p className="text-xs text-green-400 mt-1">
                Engagement actif
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Signalements</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {overview?.moderation?.pending_reports || 0}
              </div>
              <p className="text-xs text-yellow-400 mt-1">
                En attente de modération
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs pour les graphiques */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="geography">Géographie</TabsTrigger>
          </TabsList>

          {/* Tab Utilisateurs */}
          <TabsContent value="users">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">📈 Croissance des Inscriptions</CardTitle>
                <CardDescription className="text-gray-400">
                  Évolution du nombre d'inscriptions par type d'utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={usersGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="musicians" stroke="#8b5cf6" name="Musiciens" strokeWidth={2} />
                    <Line type="monotone" dataKey="venues" stroke="#ec4899" name="Établissements" strokeWidth={2} />
                    <Line type="monotone" dataKey="melomanes" stroke="#f59e0b" name="Mélomanes" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>

                {/* Répartition par type */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {overview?.users?.musicians || 0}
                    </div>
                    <div className="text-sm text-gray-400">Musiciens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-400">
                      {overview?.users?.venues || 0}
                    </div>
                    <div className="text-sm text-gray-400">Établissements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">
                      {overview?.users?.melomanes || 0}
                    </div>
                    <div className="text-sm text-gray-400">Mélomanes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Événements */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">📊 Événements par Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Bœufs', value: overview?.events?.jams || 0 },
                          { name: 'Concerts', value: overview?.events?.concerts || 0 },
                          { name: 'Karaokés', value: overview?.events?.karaokes || 0 },
                          { name: 'Spectacles', value: overview?.events?.spectacles || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">📈 Évolution Événements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventsStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      />
                      <Legend />
                      <Bar dataKey="jams" fill="#8b5cf6" name="Bœufs" />
                      <Bar dataKey="concerts" fill="#ec4899" name="Concerts" />
                      <Bar dataKey="karaokes" fill="#f59e0b" name="Karaokés" />
                      <Bar dataKey="spectacles" fill="#10b981" name="Spectacles" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Engagement */}
          <TabsContent value="engagement">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">💫 Métriques d'Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-purple-900/30 p-6 rounded-lg">
                    <div className="text-4xl font-bold text-purple-400 mb-2">
                      {overview?.engagement?.participations || 0}
                    </div>
                    <div className="text-gray-300">Participations Actives</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Musiciens inscrits à des événements
                    </div>
                  </div>

                  <div className="bg-pink-900/30 p-6 rounded-lg">
                    <div className="text-4xl font-bold text-pink-400 mb-2">
                      {overview?.engagement?.friendships || 0}
                    </div>
                    <div className="text-gray-300">Amitiés</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Connexions entre utilisateurs
                    </div>
                  </div>

                  <div className="bg-blue-900/30 p-6 rounded-lg">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {overview?.engagement?.subscriptions || 0}
                    </div>
                    <div className="text-gray-300">Abonnements</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Musiciens suivant des établissements
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Géographie */}
          <TabsContent value="geography">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Répartition Géographique
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Top 10 des villes avec le plus d'utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={geography} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="city" type="category" stroke="#9ca3af" width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="total" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Notifications Status */}
        <Card className="bg-gray-800/50 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Système de Notifications Automatiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg">
                <div>
                  <div className="font-semibold text-green-400">✓ Rappels J-3</div>
                  <div className="text-sm text-gray-400">Notifications 3 jours avant événement</div>
                </div>
                <div className="text-green-400 font-mono text-sm">Actif</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg">
                <div>
                  <div className="font-semibold text-green-400">✓ Rappels J-1</div>
                  <div className="text-sm text-gray-400">Notifications 1 jour avant événement</div>
                </div>
                <div className="text-green-400 font-mono text-sm">Actif</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg">
                <div>
                  <div className="font-semibold text-green-400">✓ Rappels H-2</div>
                  <div className="text-sm text-gray-400">Notifications 2 heures avant événement</div>
                </div>
                <div className="text-green-400 font-mono text-sm">Actif</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg">
                <div>
                  <div className="font-semibold text-green-400">✓ Nouveaux Événements</div>
                  <div className="text-sm text-gray-400">Alertes pour établissements suivis</div>
                </div>
                <div className="text-green-400 font-mono text-sm">Actif</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg">
                <div>
                  <div className="font-semibold text-blue-400">ℹ️ Suggestions d'Amis</div>
                  <div className="text-sm text-gray-400">Basées sur localisation et instruments</div>
                </div>
                <div className="text-blue-400 font-mono text-sm">Planifié</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
