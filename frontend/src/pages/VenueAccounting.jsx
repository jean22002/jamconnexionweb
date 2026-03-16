import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Calendar, DollarSign, FileText, Download, Upload, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VenueAccounting() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    payment_method: 'all',
    start_date: '',
    end_date: '',
    payment_status: 'all'
  });
  const [uploadingEventId, setUploadingEventId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAccountingData();
  }, [filters]);

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.payment_method !== 'all') params.append('payment_method', filters.payment_method);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.payment_status !== 'all') params.append('payment_status', filters.payment_status);

      const response = await axios.get(`${API}/api/accounting/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (eventId, eventType, file) => {
    if (!file) return;

    setUploadingEventId(eventId);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', eventId);
    formData.append('event_type', eventType);

    try {
      await axios.post(`${API}/api/accounting/upload-invoice`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Facture uploadée avec succès');
      fetchAccountingData();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Erreur lors de l\'upload de la facture');
    } finally {
      setUploadingEventId(null);
    }
  };

  const updatePaymentStatus = async (eventId, eventType, newStatus) => {
    try {
      await axios.put(
        `${API}/api/accounting/events/${eventId}/payment-status?event_type=${eventType}&payment_status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Statut mis à jour');
      fetchAccountingData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-900/30';
      case 'pending': return 'text-yellow-400 bg-yellow-900/30';
      case 'cancelled': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return 'Non défini';
    }
  };

  const totalAmount = events.reduce((sum, event) => sum + (parseFloat(event.amount) || 0), 0);
  const paidAmount = events.filter(e => e.payment_status === 'paid').reduce((sum, event) => sum + (parseFloat(event.amount) || 0), 0);
  const pendingAmount = events.filter(e => e.payment_status === 'pending').reduce((sum, event) => sum + (parseFloat(event.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">💰 Comptabilité</h1>
          <p className="text-gray-300">Gestion des paiements et factures</p>
        </div>

        {/* Résumé financier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Total Événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalAmount.toFixed(2)} €</div>
              <p className="text-xs text-gray-400 mt-1">{events.length} événements</p>
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-700">
            <CardHeader>
              <CardTitle className="text-sm text-green-300">Payés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{paidAmount.toFixed(2)} €</div>
              <p className="text-xs text-green-300 mt-1">{events.filter(e => e.payment_status === 'paid').length} événements</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900/20 border-yellow-700">
            <CardHeader>
              <CardTitle className="text-sm text-yellow-300">En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{pendingAmount.toFixed(2)} €</div>
              <p className="text-xs text-yellow-300 mt-1">{events.filter(e => e.payment_status === 'pending').length} événements</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">Méthode de Paiement</Label>
                <Select value={filters.payment_method} onValueChange={(v) => setFilters({...filters, payment_method: v})}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="facture">Facture</SelectItem>
                    <SelectItem value="guso">GUSO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Date Début</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Date Fin</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Statut Paiement</Label>
                <Select value={filters.payment_status} onValueChange={(v) => setFilters({...filters, payment_status: v})}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des événements */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Événements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-400">Chargement...</p>
            ) : events.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Aucun événement trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-300">Date</th>
                      <th className="text-left py-3 px-2 text-gray-300">Type</th>
                      <th className="text-left py-3 px-2 text-gray-300">Participants</th>
                      <th className="text-left py-3 px-2 text-gray-300">Paiement</th>
                      <th className="text-left py-3 px-2 text-gray-300">Montant</th>
                      <th className="text-left py-3 px-2 text-gray-300">Statut</th>
                      <th className="text-left py-3 px-2 text-gray-300">Facture</th>
                      <th className="text-left py-3 px-2 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-400" />
                            <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm">{event.event_type_label}</span>
                        </td>
                        <td className="py-3 px-2">
                          {event.participants?.map((p, i) => (
                            <div key={i} className="text-sm text-gray-300">
                              {p.name}
                              {p.payment_methods?.length > 0 && (
                                <span className="text-xs text-gray-500 ml-2">({p.payment_methods.join(', ')})</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 rounded text-xs bg-purple-900/30 text-purple-300">
                            {event.payment_method === 'facture' ? '📄 Facture' : event.payment_method === 'guso' ? '🏛️ GUSO' : 'Non défini'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            {event.amount || '0'} €
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={event.payment_status || 'pending'}
                            onChange={(e) => updatePaymentStatus(event.id, event.event_type, e.target.value)}
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(event.payment_status)}`}
                          >
                            <option value="pending">En attente</option>
                            <option value="paid">Payé</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          {event.invoice_file ? (
                            <a href={`${API}${event.invoice_file}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                              <Download className="h-4 w-4" />
                              <span className="text-sm">Télécharger</span>
                            </a>
                          ) : (
                            <label className="flex items-center gap-1 text-gray-400 hover:text-gray-300 cursor-pointer">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Upload</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleFileUpload(event.id, event.event_type, e.target.files[0]);
                                  }
                                }}
                                disabled={uploadingEventId === event.id}
                              />
                            </label>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {event.invoice_file && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`${API}${event.invoice_file}`, '_blank')}
                              className="text-xs"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function getStatusColor(status) {
    switch (status) {
      case 'paid': return 'bg-green-900/30 text-green-400';
      case 'pending': return 'bg-yellow-900/30 text-yellow-400';
      case 'cancelled': return 'bg-red-900/30 text-red-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  }
}
