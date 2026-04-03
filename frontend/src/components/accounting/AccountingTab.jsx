import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, TrendingUp, DollarSign, Calendar, Filter, Download, Loader2, Check, X, Clock, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import GusoAccountingTab from './GusoAccountingTab';
import InvoiceUpload from './InvoiceUpload';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AccountingTab = ({ token }) => {
  const [summary, setSummary] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    status: 'all',
    concertType: 'all'  // 'all', 'guso', 'classic'
  });
  const [gusoNumber, setGusoNumber] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('general');

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/musicians/me/accounting/summary`, {
        params: { year: filters.year },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors du chargement du récapitulatif');
    }
  };

  const fetchConcerts = async () => {
    try {
      const params = { year: filters.year };
      if (filters.status !== 'all') {
        params.payment_status = filters.status;
      }
      
      const response = await axios.get(`${API}/musicians/me/accounting/concerts`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setConcerts(response.data);
    } catch (error) {
      console.error('Error fetching concerts:', error);
      toast.error('Erreur lors du chargement des concerts');
    }
  };

  const updatePaymentStatus = async (concertId, newStatus) => {
    try {
      await axios.patch(
        `${API}/musicians/me/concerts/${concertId}`,
        { payment_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Statut de paiement mis à jour');
      fetchSummary();
      fetchConcerts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await axios.get(`${API}/musicians/me/accounting/export/csv`, {
        params: { year: filters.year },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comptabilite_${filters.year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export CSV réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
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

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      canceled: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    const icons = {
      paid: <Check className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      canceled: <X className="w-3 h-3" />
    };
    
    const labels = {
      paid: 'Payé',
      pending: 'En attente',
      canceled: 'Annulé'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="general">Comptabilité Générale</TabsTrigger>
        <TabsTrigger value="guso">Comptabilité GUSO</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralAccountingContent
          summary={summary}
          concerts={concerts}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          updatePaymentStatus={updatePaymentStatus}
          exportToCSV={exportToCSV}
          getStatusBadge={getStatusBadge}
          token={token}
          fetchConcerts={fetchConcerts}
        />
      </TabsContent>

      <TabsContent value="guso">
        <GusoAccountingTab 
          token={token}
          gusoNumber={gusoNumber}
          onGusoNumberUpdate={setGusoNumber}
        />
      </TabsContent>
    </Tabs>
  );
};

const GeneralAccountingContent = ({ 
  summary, 
  concerts, 
  loading, 
  filters, 
  setFilters, 
  updatePaymentStatus, 
  exportToCSV,
  getStatusBadge,
  token,
  fetchConcerts
}) => {
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [downloadingZip, setDownloadingZip] = useState(false);

  const downloadInvoicesZip = async () => {
    try {
      setDownloadingZip(true);
      const response = await axios.get(`${API}/musicians/me/accounting/invoices/download`, {
        params: { 
          year: filters.year,
          type: invoiceFilter // 'all', 'guso', 'classic'
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filterLabel = invoiceFilter === 'all' ? 'toutes' : invoiceFilter === 'guso' ? 'guso' : 'normales';
      link.setAttribute('download', `factures_${filterLabel}_${filters.year}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Factures téléchargées (${filterLabel})`);
    } catch (error) {
      console.error('Error downloading invoices:', error);
      if (error.response?.status === 404) {
        toast.error('Aucune facture trouvée pour ce filtre');
      } else {
        toast.error('Erreur lors du téléchargement des factures');
      }
    } finally {
      setDownloadingZip(false);
    }
  };
  
  // Filtrer les concerts selon le type sélectionné
  const filteredConcerts = concerts.filter(concert => {
    if (filters.concertType === 'all') return true;
    if (filters.concertType === 'guso') return concert.is_guso === true;
    if (filters.concertType === 'classic') return !concert.is_guso;
    return true;
  });

  const getConcertTypeBadge = (concert) => {
    if (concert.is_guso) {
      const cachetType = concert.cachet_type;
      let label = 'GUSO';
      let icon = '🎵';
      
      if (cachetType === 'isolé') {
        label = 'GUSO Isolé (12h)';
        icon = '🎵';
      } else if (cachetType === 'groupé') {
        label = 'GUSO Groupé (8h)';
        icon = '🎸';
      }
      
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-blue-500/20 text-blue-400 border-blue-500/30">
          <span>{icon}</span>
          {label}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-gray-500/20 text-gray-400 border-gray-500/30">
        💰 Paiement classique
      </span>
    );
  };

  if (loading) {
    return (
      <div className="glassmorphism rounded-2xl p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de la comptabilité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="font-heading font-semibold text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Comptabilité PRO
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Télécharger factures ZIP */}
            <div className="flex gap-2">
              <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                <SelectTrigger className="rounded-full w-[180px]">
                  <SelectValue placeholder="Type de facture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📄 Toutes les factures</SelectItem>
                  <SelectItem value="guso">🎵 Factures GUSO</SelectItem>
                  <SelectItem value="classic">💰 Factures normales</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={downloadInvoicesZip} 
                variant="default" 
                className="rounded-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
                disabled={downloadingZip}
              >
                {downloadingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    ZIP
                  </>
                )}
              </Button>
            </div>

            {/* Exporter CSV */}
            <Button onClick={exportToCSV} variant="outline" className="rounded-full gap-2">
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
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
          
          <div>
            <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="canceled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={filters.concertType} onValueChange={(val) => setFilters({ ...filters, concertType: val })}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Type de concert" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les concerts</SelectItem>
                <SelectItem value="guso">🎵 GUSO (Intermittence)</SelectItem>
                <SelectItem value="classic">💰 Paiement classique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">Revenus {filters.year}</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{summary.total_revenues.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.concerts_count} concerts</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{summary.pending_revenues.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.pending_count} paiements</p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-cyan-500/5 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Cachet moyen</p>
              </div>
              <p className="text-3xl font-bold text-primary">{summary.average_cachet.toFixed(2)}€</p>
            </div>
          </div>
        )}
      </div>

      {/* Concerts List */}
      <div className="glassmorphism rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Historique des concerts ({filteredConcerts.length})
        </h3>

        {filteredConcerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun concert pour cette période</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConcerts.map((concert) => (
              <div key={concert.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{concert.venue_name || 'Concert'}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(concert.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                        {concert.city && (
                          <p className="text-sm text-muted-foreground mt-1">📍 {concert.city}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getConcertTypeBadge(concert)}
                        {getStatusBadge(concert.payment_status)}
                      </div>
                    </div>

                    {concert.band_name && (
                      <p className="text-sm text-muted-foreground">🎸 {concert.band_name}</p>
                    )}
                    
                    {concert.description && (
                      <p className="text-sm text-muted-foreground mt-2">{concert.description}</p>
                    )}
                    
                    {concert.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">Note: {concert.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {concert.cachet && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{concert.cachet.toFixed(2)}€</p>
                        {concert.payment_date && (
                          <p className="text-xs text-muted-foreground">
                            Payé le {new Date(concert.payment_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Invoice Upload Component */}
                    <InvoiceUpload
                      concertId={concert.id}
                      currentInvoice={concert.invoice_url}
                      token={token}
                      onUploadSuccess={() => {
                        fetchConcerts();
                      }}
                    />

                    {concert.payment_status === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full bg-green-500 hover:bg-green-600 gap-2"
                        onClick={() => updatePaymentStatus(concert.id, 'paid')}
                      >
                        <Check className="w-4 h-4" />
                        Marquer payé
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingTab;
