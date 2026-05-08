import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, Flag, Clock, Eye, CheckCircle, XCircle, Loader2, AlertCircle
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

const STATUS_DESCRIPTIONS = {
  pending: 'Votre signalement est en attente de traitement par notre équipe.',
  reviewed: 'Votre signalement a été examiné par un modérateur.',
  resolved: 'Votre signalement a été traité et résolu. Merci pour votre contribution.',
  dismissed: 'Après examen, ce signalement a été rejeté.'
};

export default function MyReportsPage() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchMyReports();
    }
  }, [token]);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/api/reports/my-reports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching my reports:', error);
      toast.error("Erreur lors du chargement de vos signalements");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glassmorphism border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Flag className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Mes signalements</h1>
                <p className="text-sm text-muted-foreground">
                  Historique de vos signalements de profils
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Flag className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun signalement</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Vous n'avez effectué aucun signalement pour le moment.
                Si vous rencontrez un comportement inapproprié, n'hésitez pas à signaler le profil concerné.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{reports.length}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {reports.filter(r => r.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">En attente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {reports.filter(r => r.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Résolus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500">
                      {reports.filter(r => r.status === 'dismissed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Rejetés</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des signalements */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des signalements</CardTitle>
                <CardDescription>
                  Suivez l'état de vos signalements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => {
                    const StatusIcon = STATUS_ICONS[report.status];
                    return (
                      <div
                        key={report.id}
                        className="glassmorphism rounded-lg p-4 border-l-4"
                        style={{
                          borderLeftColor: STATUS_COLORS[report.status].replace('bg-', '')
                        }}
                      >
                        {/* En-tête */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${STATUS_COLORS[report.status]} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {STATUS_LABELS[report.status]}
                              </Badge>
                              <Badge variant="outline">{report.reported_profile_type}</Badge>
                            </div>
                            <h3 className="font-semibold text-lg">
                              {report.reported_profile_name}
                            </h3>
                          </div>
                        </div>

                        {/* Détails du signalement */}
                        <div className="space-y-3">
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="font-semibold text-sm text-red-600 mb-1">
                              Raison : {report.reason}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {report.details}
                            </p>
                          </div>

                          {/* Description du statut */}
                          <div className="flex items-start gap-2 bg-accent/50 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              {STATUS_DESCRIPTIONS[report.status]}
                            </p>
                          </div>

                          {/* Notes admin (si disponibles) */}
                          {report.admin_notes && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                              <p className="text-sm font-semibold text-blue-600 mb-1">
                                Retour de l'équipe de modération :
                              </p>
                              <p className="text-sm">{report.admin_notes}</p>
                            </div>
                          )}

                          {/* Date */}
                          <div className="text-xs text-muted-foreground">
                            Signalé le{' '}
                            {new Date(report.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {report.reviewed_at && (
                              <>
                                {' • Traité le '}
                                {new Date(report.reviewed_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-600 mb-1">
                      Important
                    </p>
                    <p className="text-muted-foreground">
                      Notre équipe examine chaque signalement avec attention. 
                      Les faux signalements peuvent entraîner des sanctions. 
                      Merci de votre contribution à maintenir une communauté respectueuse.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
