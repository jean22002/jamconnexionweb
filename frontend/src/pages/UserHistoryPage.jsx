import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, User, Flag, Calendar, MessageSquare, 
  Users, Award, Star, ShieldAlert, Loader2, Ban, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function UserHistoryPage() {
  const { userId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserHistory();
  }, [userId]);

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/api/reports/admin/user/${userId}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching user history:', error);
      toast.error("Erreur lors du chargement de l'historique");
      navigate('/admin/reports');
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (duration = 7) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir suspendre cet utilisateur pour ${duration} jours ?`)) {
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('duration_days', duration);
      params.append('reason', 'Décision administrative');
      
      await axios.post(
        `${API}/api/reports/admin/suspend-user/${userId}?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Utilisateur suspendu pour ${duration} jours`);
      await fetchUserHistory();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error("Erreur lors de la suspension");
    }
  };

  const unsuspendUser = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir lever la suspension de cet utilisateur ?')) {
      return;
    }

    try {
      await axios.post(
        `${API}/api/reports/admin/unsuspend-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Suspension levée avec succès");
      await fetchUserHistory();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error("Erreur lors de la levée de suspension");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, profile, reports, events, social, messages, badges, reviews, suspension_status } = data;

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
                  Retour
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Historique Utilisateur</h1>
                  <p className="text-sm text-muted-foreground">{user.name} • {user.email}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {suspension_status.is_suspended ? (
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={unsuspendUser}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lever la suspension
                </Button>
              ) : (
                <>
                  <Button 
                    variant="destructive" 
                    className="rounded-full"
                    onClick={() => suspendUser(7)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspendre 7j
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="rounded-full"
                    onClick={() => suspendUser(30)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspendre 30j
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Statut de suspension */}
        {suspension_status.is_suspended && (
          <Card className="mb-6 border-red-500 bg-red-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                Utilisateur Suspendu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                <strong>Raison:</strong> {suspension_status.suspension_reason}
              </p>
              <p className="text-sm">
                <strong>Jusqu'au:</strong> {new Date(suspension_status.suspended_until).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Signalements reçus</CardTitle>
              <Flag className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{reports.received_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Événements</CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.role === 'venue' ? events.created_count : events.participated_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.role === 'venue' ? 'Créés' : 'Participations'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.sent_count + messages.received_count}</div>
              <p className="text-xs text-muted-foreground">
                {messages.sent_count} envoyés • {messages.received_count} reçus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Amis</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{social.friends_count}</div>
            </CardContent>
          </Card>
        </div>

        {/* Profil Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations du Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rôle</p>
                <Badge>{user.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membre depuis</p>
                <p className="font-semibold">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {profile && user.role === 'musician' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Pseudo</p>
                    <p className="font-semibold">{profile.pseudo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Instruments</p>
                    <p className="font-semibold">{profile.instruments?.join(', ')}</p>
                  </div>
                </>
              )}
              {profile && user.role === 'venue' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Nom de l'établissement</p>
                    <p className="font-semibold">{profile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold">{profile.venue_type}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reports">
              <Flag className="w-4 h-4 mr-2" />
              Signalements
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="social">
              <Users className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Signalements */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Signalements reçus */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Signalements Reçus ({reports.received_count})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.received.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucun signalement</p>
                  ) : (
                    <div className="space-y-3">
                      {reports.received.map((report) => (
                        <div key={report.id} className="glassmorphism rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                              {report.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mb-1">{report.reason}</p>
                          <p className="text-xs text-muted-foreground">{report.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Signalements créés */}
              <Card>
                <CardHeader>
                  <CardTitle>Signalements Créés ({reports.created_count})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.created.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucun signalement</p>
                  ) : (
                    <div className="space-y-3">
                      {reports.created.map((report) => (
                        <div key={report.id} className="glassmorphism rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>{report.reported_profile_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mb-1">{report.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            Contre: {report.reported_profile_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Événements */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.role === 'venue' 
                    ? `Événements Créés (${events.created_count})`
                    : `Événements Participés (${events.participated_count})`
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(user.role === 'venue' ? events.created : events.participated).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun événement</p>
                ) : (
                  <div className="space-y-3">
                    {(user.role === 'venue' ? events.created : events.participated).map((event) => (
                      <div key={event.id} className="glassmorphism rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge>{event.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {new Date(event.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{event.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages Récents</CardTitle>
              </CardHeader>
              <CardContent>
                {messages.recent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun message</p>
                ) : (
                  <div className="space-y-3">
                    {messages.recent.map((msg) => (
                      <div key={msg.id} className="glassmorphism rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={msg.sender_id === userId ? 'default' : 'secondary'}>
                            {msg.sender_id === userId ? 'Envoyé' : 'Reçu'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Amis ({social.friends_count})</CardTitle>
              </CardHeader>
              <CardContent>
                {social.friends.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun ami</p>
                ) : (
                  <div className="space-y-2">
                    {social.friends.map((friend, index) => (
                      <div key={index} className="glassmorphism rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm">
                          Ami: {friend.user1_id === userId ? friend.user2_id : friend.user1_id}
                        </span>
                        <Badge variant="secondary">
                          {new Date(friend.created_at).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badges Débloqués ({badges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {badges.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucun badge</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {badges.map((badge) => (
                      <div key={badge.badge_id} className="glassmorphism rounded-lg p-4 text-center">
                        <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-semibold mb-1">{badge.badge_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(badge.unlocked_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
