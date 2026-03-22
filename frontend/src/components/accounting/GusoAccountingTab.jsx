import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Clock, FileText, CheckCircle, AlertCircle, Download, Loader2, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GusoAccountingTab = ({ token, gusoNumber, onGusoNumberUpdate }) => {
  const [summary, setSummary] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    declared: 'all'
  });
  const [showGusoDialog, setShowGusoDialog] = useState(false);
  const [tempGusoNumber, setTempGusoNumber] = useState(gusoNumber || '');
  const [editMode, setEditMode] = useState(false);
  const [manualValues, setManualValues] = useState({
    hours: 0,
    cachet: 0
  });

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/musicians/me/guso/summary`, {
        params: { year: filters.year },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching GUSO summary:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors du chargement du récapitulatif GUSO');
    }
  };

  const fetchConcerts = async () => {
    try {
      const params = { year: filters.year };
      if (filters.declared !== 'all') {
        params.declared = filters.declared === 'yes';
      }
      
      const response = await axios.get(`${API}/musicians/me/guso/concerts`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setConcerts(response.data);
    } catch (error) {
      console.error('Error fetching GUSO concerts:', error);
      toast.error('Erreur lors du chargement des concerts GUSO');
    }
  };

  const markAsDeclared = async (concertId) => {
    try {
      await axios.patch(
        `${API}/musicians/me/guso/concerts/${concertId}/declare`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Concert marqué comme déclaré');
      fetchSummary();
      fetchConcerts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await axios.get(`${API}/musicians/me/guso/export/csv`, {
        params: { year: filters.year },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `guso_${filters.year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export CSV réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const saveGusoNumber = async () => {
    try {
      await axios.put(
        `${API}/musicians`,
        { guso_number: tempGusoNumber, is_guso_member: !!tempGusoNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Numéro GUSO enregistré');
      setShowGusoDialog(false);
      if (onGusoNumberUpdate) onGusoNumberUpdate(tempGusoNumber);
      fetchSummary();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const saveManualValues = async () => {
    try {
      await axios.put(
        `${API}/musicians/me/guso/manual`,
        {
          year: filters.year,
          manual_hours: parseFloat(manualValues.hours) || 0,
          manual_cachet: parseFloat(manualValues.cachet) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Valeurs manuelles enregistrées');
      setEditMode(false);
      fetchSummary();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const cancelEdit = () => {
    setManualValues({
      hours: summary?.manual_hours || summary?.total_hours || 0,
      cachet: summary?.manual_cachet || summary?.total_cachet || 0
    });
    setEditMode(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchConcerts()]);
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (summary) {
      setManualValues({
        hours: summary.manual_hours || summary.total_hours || 0,
        cachet: summary.manual_cachet || summary.total_cachet || 0
      });
    }
  }, [summary]);

  const getStatusBadge = (status) => {
    const config = {
      eligible: { color: 'green', label: 'Éligible Intermittent', icon: CheckCircle },
      close: { color: 'yellow', label: 'Proche du seuil', icon: AlertCircle },
      active: { color: 'blue', label: 'En cours', icon: Clock },
      inactive: { color: 'gray', label: 'Inactif', icon: AlertCircle }
    };
    
    const { color, label, icon: Icon } = config[status] || config.inactive;
    const colorClasses = {
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="glassmorphism rounded-2xl p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement comptabilité GUSO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading font-semibold text-2xl flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-primary" />
              Comptabilité GUSO
            </h2>
            {summary?.guso_number ? (
              <p className="text-sm text-muted-foreground">
                N° GUSO: <span className="font-mono font-semibold">{summary.guso_number}</span>
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGusoDialog(true)}
                className="mt-2"
              >
                <Edit className="w-4 h-4 mr-2" />
                Renseigner mon numéro GUSO
              </Button>
            )}
          </div>
          
          <Button onClick={exportToCSV} variant="outline" className="rounded-full gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={filters.year.toString()} onValueChange={(val) => setFilters({ ...filters, year: parseInt(val) })}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2024, 2023, 2022].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Select value={filters.declared} onValueChange={(val) => setFilters({ ...filters, declared: val })}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Statut déclaration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="yes">Déclarés</SelectItem>
                <SelectItem value="no">À déclarer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 507h Progress */}
        {summary && (
          <div className="bg-gradient-to-br from-primary/10 to-cyan-500/5 border border-primary/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Progression vers les 507 heures</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Seuil d'éligibilité au statut d'intermittent du spectacle
                </p>
              </div>
              {getStatusBadge(summary.status)}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-primary">
                    {summary.manual_hours !== null && summary.manual_hours !== undefined 
                      ? summary.manual_hours 
                      : summary.total_hours}h
                  </span>
                  <span className="text-muted-foreground">/ {summary.threshold}h</span>
                </div>
                <Progress value={
                  ((summary.manual_hours !== null && summary.manual_hours !== undefined 
                    ? summary.manual_hours 
                    : summary.total_hours) / summary.threshold) * 100
                } className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {(() => {
                    const currentHours = summary.manual_hours !== null && summary.manual_hours !== undefined 
                      ? summary.manual_hours 
                      : summary.total_hours;
                    const remaining = summary.threshold - currentHours;
                    return remaining > 0 ? (
                      <>Encore <span className="font-semibold">{remaining}h</span> pour atteindre le seuil</>
                    ) : (
                      <span className="text-green-400 font-semibold">✅ Seuil atteint ! Vous êtes éligible</span>
                    );
                  })()}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-muted-foreground">Concerts GUSO</p>
                  <p className="text-xl font-bold">{summary.concerts_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Déclarés</p>
                  <p className="text-xl font-bold text-green-400">{summary.declared_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">À déclarer</p>
                  <p className="text-xl font-bold text-yellow-400">{summary.pending_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Cachets GUSO {filters.year}</p>
                </div>
                {!editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={manualValues.cachet}
                    onChange={(e) => setManualValues({ ...manualValues, cachet: e.target.value })}
                    className="text-2xl font-bold h-12"
                  />
                  <span className="text-2xl font-bold">€</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-green-400">
                  {(summary.manual_cachet !== null && summary.manual_cachet !== undefined 
                    ? summary.manual_cachet 
                    : summary.total_cachet).toFixed(2)}€
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-cyan-500/5 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Heures totales</p>
                </div>
                {!editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    value={manualValues.hours}
                    onChange={(e) => setManualValues({ ...manualValues, hours: e.target.value })}
                    className="text-2xl font-bold h-12"
                  />
                  <span className="text-2xl font-bold">h</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-primary">
                  {summary.manual_hours !== null && summary.manual_hours !== undefined 
                    ? summary.manual_hours 
                    : summary.total_hours}h
                </p>
              )}
            </div>
          </div>
        )}

        {/* Edit Mode Actions */}
        {editMode && (
          <div className="flex gap-3 mt-4">
            <Button
              onClick={saveManualValues}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
            >
              Enregistrer
            </Button>
            <Button
              onClick={cancelEdit}
              variant="outline"
              className="flex-1 rounded-full"
            >
              Annuler
            </Button>
          </div>
        )}
      </div>

      {/* Concerts List */}
      <div className="glassmorphism rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">
          Concerts GUSO ({concerts.length})
        </h3>

        {concerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun concert GUSO pour cette période</p>
            <p className="text-sm mt-2">Les concerts marqués comme "GUSO" dans votre comptabilité apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {concerts.map((concert) => (
              <div key={concert.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{concert.venue_name || 'Concert'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(concert.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                        {concert.city && (
                          <p className="text-sm text-muted-foreground">📍 {concert.city}</p>
                        )}
                      </div>
                      {concert.guso_declared ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Déclaré
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                          À déclarer
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {concert.guso_hours && (
                        <div>
                          <p className="text-xs text-muted-foreground">Heures</p>
                          <p className="font-semibold">{concert.guso_hours}h</p>
                        </div>
                      )}
                      {concert.cachet && (
                        <div>
                          <p className="text-xs text-muted-foreground">Cachet</p>
                          <p className="font-semibold">{concert.cachet.toFixed(2)}€</p>
                        </div>
                      )}
                      {concert.guso_contract_type && (
                        <div>
                          <p className="text-xs text-muted-foreground">Contrat</p>
                          <p className="font-semibold text-xs">{concert.guso_contract_type}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {!concert.guso_declared && (
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full bg-green-500 hover:bg-green-600 gap-2"
                      onClick={() => markAsDeclared(concert.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer comme déclaré
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GUSO Number Dialog */}
      <Dialog open={showGusoDialog} onOpenChange={setShowGusoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Numéro d'identifiant GUSO</DialogTitle>
            <DialogDescription>
              Renseignez votre numéro d'identifiant GUSO pour activer le badge PRO vérifié et accéder à la comptabilité GUSO.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="guso-number">Numéro GUSO</Label>
              <Input
                id="guso-number"
                placeholder="Ex: 123456789"
                value={tempGusoNumber}
                onChange={(e) => setTempGusoNumber(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Votre numéro d'identifiant GUSO est nécessaire pour valider votre statut professionnel
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGusoDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveGusoNumber} disabled={!tempGusoNumber.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GusoAccountingTab;
