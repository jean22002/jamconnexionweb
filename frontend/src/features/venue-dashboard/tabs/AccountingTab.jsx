import { useState } from "react";
import { Label } from "../../../components/ui/label";
import { Check, Clock, X, CreditCard, Eye, Download, FileText } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function AccountingTab({ 
  jams = [], 
  concerts = [], 
  karaokes = [], 
  spectacles = [] 
}) {
  const [accountingFilters, setAccountingFilters] = useState({
    payment_method: 'all',
    payment_status: 'all',
    event_type: 'all'
  });

  // Combine all events
  const allEvents = [...jams, ...concerts, ...karaokes, ...spectacles];

  // Filter events
  const filteredEvents = allEvents.filter(event => {
    if (accountingFilters.payment_method !== 'all' && event.payment_method !== accountingFilters.payment_method) {
      return false;
    }
    if (accountingFilters.payment_status !== 'all' && event.payment_status !== accountingFilters.payment_status) {
      return false;
    }
    if (accountingFilters.event_type !== 'all') {
      const eventType = event.type || 
        (jams.includes(event) ? 'jam' : 
         concerts.includes(event) ? 'concert' : 
         karaokes.includes(event) ? 'karaoke' : 'spectacle');
      if (eventType !== accountingFilters.event_type) {
        return false;
      }
    }
    return true;
  });

  // Calculate statistics
  const paidEvents = allEvents.filter(e => e.payment_status === 'paid' && e.amount);
  const paidTotal = paidEvents.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const pendingEvents = allEvents.filter(e => e.payment_status === 'pending' && e.amount);
  const pendingTotal = pendingEvents.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const cancelledEvents = allEvents.filter(e => e.payment_status === 'cancelled' && e.amount);
  const cancelledTotal = cancelledEvents.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const allEventsWithAmount = allEvents.filter(e => e.amount);
  const totalAmount = allEventsWithAmount.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const getEventTypeLabel = (event) => {
    if (jams.includes(event)) return 'Bœuf';
    if (concerts.includes(event)) return 'Concert';
    if (karaokes.includes(event)) return 'Karaoké';
    if (spectacles.includes(event)) return 'Spectacle';
    return 'Événement';
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'guso': 'GUSO',
      'facture': 'Facture',
      'especes': 'Espèces',
      'virement': 'Virement',
      'cheque': 'Chèque',
      'promotion': 'Promotion'
    };
    return labels[method] || method;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'paid': 'text-green-500',
      'pending': 'text-orange-500',
      'cancelled': 'text-red-500'
    };
    return colors[status] || 'text-muted-foreground';
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      'paid': 'Payé',
      'pending': 'En attente',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredEvents.length === 0) return;
    
    const headers = ['Type', 'Titre', 'Date', 'Méthode de paiement', 'Montant', 'Statut'];
    const csvData = filteredEvents.map(event => [
      getEventTypeLabel(event),
      event.title || event.name || 'Sans titre',
      event.date || '',
      getPaymentMethodLabel(event.payment_method || ''),
      event.amount ? parseFloat(event.amount).toFixed(2) : '0.00',
      getPaymentStatusLabel(event.payment_status || '')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comptabilite_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View event details (placeholder - can be enhanced)
  const viewEventDetails = (event) => {
    alert(`Détails de l'événement:\n\nTitre: ${event.title || event.name || 'Sans titre'}\nDate: ${event.date}\nMontant: ${event.amount ? parseFloat(event.amount).toFixed(2) + ' €' : 'N/A'}\nStatut: ${getPaymentStatusLabel(event.payment_status)}`);
  };

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-semibold text-xl mb-2">💰 Comptabilité</h2>
          <p className="text-muted-foreground text-sm">
            Suivez tous vos paiements pour les événements
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Payé</span>
            <Check className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500">
            {paidTotal.toFixed(2)} €
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {paidEvents.length} événement(s)
          </p>
        </div>

        <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">En attente</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {pendingTotal.toFixed(2)} €
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingEvents.length} événement(s)
          </p>
        </div>

        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Annulé</span>
            <X className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">
            {cancelledTotal.toFixed(2)} €
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {cancelledEvents.length} événement(s)
          </p>
        </div>

        <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary">
            {totalAmount.toFixed(2)} €
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {allEventsWithAmount.length} événement(s)
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-xl">
        <h3 className="font-semibold text-base mb-3">🔍 Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm mb-2 block">Méthode de paiement</Label>
            <select
              value={accountingFilters.payment_method}
              onChange={(e) => setAccountingFilters({...accountingFilters, payment_method: e.target.value})}
              className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="guso">GUSO</option>
              <option value="facture">Facture</option>
              <option value="especes">Espèces</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Statut</Label>
            <select
              value={accountingFilters.payment_status}
              onChange={(e) => setAccountingFilters({...accountingFilters, payment_status: e.target.value})}
              className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Type d'événement</Label>
            <select
              value={accountingFilters.event_type}
              onChange={(e) => setAccountingFilters({...accountingFilters, event_type: e.target.value})}
              className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
            >
              <option value="all">Tous les types</option>
              <option value="concert">Concerts</option>
              <option value="jam">Bœufs</option>
              <option value="karaoke">Karaoké</option>
              <option value="spectacle">Spectacles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base">
            📋 Événements ({filteredEvents.length})
          </h3>
          {filteredEvents.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full"
              onClick={exportToCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground glassmorphism rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun événement trouvé</p>
            <p className="text-sm mt-2">Ajustez les filtres ou créez de nouveaux événements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, idx) => (
              <div key={idx} className="p-4 bg-black/20 rounded-xl border border-white/10 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
                        {getEventTypeLabel(event)}
                      </span>
                      <h4 className="font-semibold">{event.title || event.name || 'Sans titre'}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>{' '}
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Méthode:</span>{' '}
                        <span className="font-medium">{getPaymentMethodLabel(event.payment_method)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Montant:</span>{' '}
                        <span className="font-bold text-primary">{event.amount ? `${parseFloat(event.amount).toFixed(2)} €` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Statut:</span>{' '}
                        <span className={`font-medium ${getPaymentStatusColor(event.payment_status)}`}>
                          {getPaymentStatusLabel(event.payment_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => viewEventDetails(event)}
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
