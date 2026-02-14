import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, Flag,
  TrendingUp, Users, BarChart3, Loader2, Eye, Ban, UserCheck, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  reviewed: 'bg-blue-500',
  resolved: 'bg-green-500',
  dismissed: 'bg-gray-500'
};

const STATUS_LABELS = {
  pending: 'En attente',
  reviewed: 'Examiné',
  resolved: 'Résolu',
  dismissed: 'Rejeté'
};

const STATUS_ICONS = {
  pending: Clock,
  reviewed: Eye,
  resolved: CheckCircle,
  dismissed: XCircle
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [profileTypeFilter, setProfileTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error("Accès réservé aux administrateurs");
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    await Promise.all([fetchReports(), fetchStats()]);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (reasonFilter !== 'all') params.append('reason', reasonFilter);
      if (profileTypeFilter !== 'all') params.append('profile_type', profileTypeFilter);
      
      const response = await axios.get(
        `${API}/api/reports/admin/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error("Erreur lors du chargement des signalements");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API}/api/reports/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchReports();
    }
  }, [statusFilter, reasonFilter, profileTypeFilter]);

  const updateReportStatus = async (reportId, newStatus, notes = '') => {
    try {
      setUpdating(true);
      const params = new URLSearchParams();
      params.append('status', newStatus);
      if (notes) {
        params.append('admin_notes', notes);
      }
      
      await axios.patch(
        `${API}/api/reports/admin/${reportId}/status?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Signalement marqué comme "${STATUS_LABELS[newStatus]}"`);
      setSelectedReport(null);
      setAdminNotes('');
      await fetchData();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const suspendUser = async (userId, duration = 7) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir suspendre cet utilisateur pour ${duration} jours ?`)) {
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('duration_days', duration);
      params.append('reason', 'Multiple signalements');
      
      await axios.post(
        `${API}/api/reports/admin/suspend-user/${userId}?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Utilisateur suspendu pour ${duration} jours`);
      await fetchData();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error("Erreur lors de la suspension");
    }
  };
  
  const viewUserHistory = (userId) => {
    navigate(`/admin/user/${userId}/history`);
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
              <Link to="/">
                <Button variant="outline" size="sm" className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Dashboard Admin</h1>
                  <p className="text-sm text-muted-foreground">Gestion des signalements</p>
                </div>
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="rounded-full">
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Flag className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_reports}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.recent_reports_7_days} ces 7 derniers jours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">
                  {stats.by_status.pending}
                </div>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Résolus</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {stats.by_status.resolved}
                </div>
                <p className="text-xs text-muted-foreground">Traités</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
                <XCircle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.by_status.dismissed}</div>
                <p className="text-xs text-muted-foreground">Faux signalements</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="reports">Signalements</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Tous les signalements</CardTitle>
                <CardDescription>
                  Gérez et modérez les signalements de la communauté
                </CardDescription>

                {/* Filtres */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="reviewed">Examiné</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="dismissed">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type de profil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="musician">Musicien</SelectItem>
                      <SelectItem value="venue">Établissement</SelectItem>
                      <SelectItem value="melomane">Mélomane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun signalement trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => {
                      const StatusIcon = STATUS_ICONS[report.status];
                      return (
                        <div
                          key={report.id}
                          className="glassmorphism rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${STATUS_COLORS[report.status]} text-white`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {STATUS_LABELS[report.status]}
                                </Badge>
                                <Badge variant="outline">{report.reported_profile_type}</Badge>
                              </div>

                              <h3 className="font-semibold text-lg mb-1">
                                {report.reported_profile_name}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {report.reported_user_email}
                              </p>

                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                                <p className="font-semibold text-sm text-red-600 mb-1">
                                  {report.reason}
                                </p>
                                <p className="text-sm">{report.details}</p>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Signalé par <span className="font-medium">{report.reporter_email}</span>
                                {' • '}
                                {new Date(report.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>

                              {report.admin_notes && (
                                <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                  <p className="text-sm font-semibold text-blue-600 mb-1">
                                    Notes admin:
                                  </p>
                                  <p className="text-sm">{report.admin_notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewUserHistory(report.reported_user_id)}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Historique
                              </Button>
                              {report.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateReportStatus(report.id, 'reviewed')}
                                    disabled={updating}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Examiner
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => updateReportStatus(report.id, 'resolved')}
                                    disabled={updating}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Résoudre
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateReportStatus(report.id, 'dismissed')}
                                    disabled={updating}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rejeter
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => suspendUser(report.reported_user_id, 7)}
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Suspendre
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Raisons */}
                <Card>
                  <CardHeader>
                    <CardTitle>Raisons des signalements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.by_reason.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.reason}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top utilisateurs signalés */}
                <Card>
                  <CardHeader>
                    <CardTitle>Utilisateurs les plus signalés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.top_reported_users.map((item, index) => (
                        <div key={index} className="glassmorphism rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{item.name}</span>
                            <Badge variant="destructive">{item.count} signalements</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
