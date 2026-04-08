import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../../../components/ui/button";
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Music, Users, Euro, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import TimeSelect from "../../../components/TimeSelect";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ConcertsTab({
  concerts,
  showConcertDialog,
  setShowConcertDialog,
  concertForm,
  setConcertForm,
  handleCreateConcert,
  handleEditEvent,
  handleDeleteEvent,
  // Nouvelles props pour la gestion des groupes
  searchBandQuery,
  setSearchBandQuery,
  searchedBands,
  loadingBands,
  manualBandName,
  setManualBandName,
  addBandFromDB,
  addManualBand,
  removeBandFromConcert
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl">Concerts</h2>
        <Dialog open={showConcertDialog} onOpenChange={setShowConcertDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
              <Plus className="w-4 h-4" /> Nouveau concert
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un concert</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Date & Heures */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input 
                    type="date" 
                    value={concertForm.date} 
                    onChange={(e) => setConcertForm({ ...concertForm, date: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <TimeSelect
                    value={concertForm.start_time}
                    onChange={(value) => setConcertForm({ ...concertForm, start_time: value })}
                    placeholder="Heure de début"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <TimeSelect
                    value={concertForm.end_time}
                    onChange={(value) => setConcertForm({ ...concertForm, end_time: value })}
                    placeholder="Heure de fin"
                  />
                </div>
              </div>

              {/* Titre & Description */}
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input 
                  value={concertForm.title} 
                  onChange={(e) => setConcertForm({ ...concertForm, title: e.target.value })} 
                  className="bg-black/20 border-white/10"
                  placeholder="Soirée Rock"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={concertForm.description} 
                  onChange={(e) => setConcertForm({ ...concertForm, description: e.target.value })} 
                  className="bg-black/20 border-white/10" 
                  rows={3}
                  placeholder="Décrivez le concert..."
                />
              </div>

              {/* Prix & Styles musicaux */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix d'entrée</Label>
                  <Input 
                    value={concertForm.price} 
                    onChange={(e) => setConcertForm({ ...concertForm, price: e.target.value })} 
                    className="bg-black/20 border-white/10"
                    placeholder="ex: 10€, Gratuit, PAF"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Styles musicaux</Label>
                  <Input 
                    value={concertForm.music_styles?.join(", ") || ""} 
                    onChange={(e) => setConcertForm({ ...concertForm, music_styles: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                    className="bg-black/20 border-white/10"
                    placeholder="Rock, Jazz, Blues"
                  />
                </div>
              </div>

              {/* Groupes/Artistes */}
              <div className="space-y-3 p-4 border-2 border-purple-500/20 rounded-xl">
                <Label className="font-medium text-purple-400">🎸 Groupes / Artistes</Label>
                
                {/* Liste des groupes ajoutés */}
                {concertForm && Array.isArray(concertForm.bands) && concertForm.bands.length > 0 && (
                  <div className="space-y-2">
                    {concertForm.bands.map((band, index) => (
                      <div key={`band-${index}-${band.name}`} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-purple-400" />
                          <span className="font-medium">{band.name}</span>
                          {band.musician_id ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              ✓ Dans la BDD
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">
                              Non inscrit
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBandFromConcert(index)}
                          className="h-8 w-8 p-0 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recherche dans la BDD */}
                <div className="space-y-2">
                  <Label className="text-sm">Rechercher un groupe inscrit</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      value={searchBandQuery}
                      onChange={(e) => setSearchBandQuery(e.target.value)}
                      placeholder="Nom du groupe..."
                      className="bg-black/20 border-white/10 pl-10"
                    />
                    {loadingBands && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  {/* Résultats de la recherche */}
                  {searchedBands.length > 0 && (
                    <div className="max-h-40 overflow-y-auto bg-black/40 rounded-lg border border-white/10">
                      {searchedBands.map((band, idx) => (
                        <button
                          key={`${band.name}-${idx}`}
                          onClick={() => addBandFromDB(band)}
                          className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-purple-400" />
                            <span>{band.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {band.members_count && <span>{band.members_count} membres</span>}
                            {band.musician_name && <span>• {band.musician_name}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ajout manuel */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <Label className="text-sm">Ou ajouter un groupe non inscrit</Label>
                  <div className="flex gap-2">
                    <Input
                      value={manualBandName}
                      onChange={(e) => setManualBandName(e.target.value)}
                      placeholder="Nom du groupe..."
                      className="bg-black/20 border-white/10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addManualBand();
                        }
                      }}
                    />
                    <Button
                      onClick={addManualBand}
                      variant="outline"
                      className="rounded-full"
                      disabled={!manualBandName.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* GUSO */}
              <div className="p-4 border-2 border-amber-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={concertForm.is_guso || concertForm.payment_method === 'guso'}
                    onCheckedChange={(checked) => setConcertForm({ 
                      ...concertForm, 
                      is_guso: checked,
                      payment_method: checked ? 'guso' : ''
                    })}
                  />
                  <Label className="font-medium text-amber-400">📋 Concert avec contrat GUSO</Label>
                </div>

                {(concertForm.is_guso || concertForm.payment_method === 'guso') && (
                  <div className="pl-8 space-y-3">
                    <div className="space-y-2">
                      <Label>Type de cachet</Label>
                      <Select 
                        value={concertForm.cachet_type} 
                        onValueChange={(value) => setConcertForm({ ...concertForm, cachet_type: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="isolé">Cachet isolé</SelectItem>
                          <SelectItem value="groupé">Cachet groupé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type de contrat</Label>
                      <Select 
                        value={concertForm.guso_contract_type} 
                        onValueChange={(value) => setConcertForm({ ...concertForm, guso_contract_type: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDDU">CDDU</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Facture */}
              <div className="p-4 border-2 border-cyan-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={concertForm.invoice_required || false}
                    onCheckedChange={(checked) => setConcertForm({ 
                      ...concertForm, 
                      invoice_required: checked,
                      payment_status: checked ? (concertForm.payment_status || 'pending') : undefined
                    })}
                  />
                  <Label className="font-medium text-cyan-400">📄 Facture requise</Label>
                </div>

                {concertForm.invoice_required && (
                  <div className="pl-8 space-y-3">
                    <div className="space-y-2">
                      <Label>Statut de paiement</Label>
                      <Select 
                        value={concertForm.payment_status || 'pending'} 
                        onValueChange={(value) => setConcertForm({ ...concertForm, payment_status: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">⏳ En attente</SelectItem>
                          <SelectItem value="paid">✅ Payé</SelectItem>
                          <SelectItem value="partial">🔄 Partiel</SelectItem>
                          <SelectItem value="cancelled">❌ Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Montant (optionnel)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={concertForm.amount || ''}
                        onChange={(e) => setConcertForm({ ...concertForm, amount: parseFloat(e.target.value) || 0 })}
                        className="bg-black/20 border-white/10"
                        placeholder="ex: 150.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Moyen de paiement</Label>
                      <Select 
                        value={concertForm.payment_method || ''} 
                        onValueChange={(value) => setConcertForm({ ...concertForm, payment_method: value })}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Espèces</SelectItem>
                          <SelectItem value="check">📝 Chèque</SelectItem>
                          <SelectItem value="transfer">🏦 Virement</SelectItem>
                          <SelectItem value="card">💳 Carte bancaire</SelectItem>
                          <SelectItem value="other">📋 Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-muted-foreground bg-black/20 p-3 rounded-lg">
                      💡 <strong>Note :</strong> Vous pourrez uploader la facture plus tard depuis l'onglet Comptabilité
                    </div>
                  </div>
                )}
              </div>

              {/* Restauration */}
              <div className="p-4 border-2 border-green-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={concertForm.has_catering}
                    onCheckedChange={(checked) => setConcertForm({ ...concertForm, has_catering: checked })}
                  />
                  <Label className="font-medium text-green-400">🍽️ Restauration proposée</Label>
                </div>

                {concertForm.has_catering && (
                  <div className="pl-8 space-y-3">
                    <div className="space-y-2">
                      <Label>Nombre de boissons offertes</Label>
                      <Input
                        type="number"
                        min="0"
                        value={concertForm.catering_drinks}
                        onChange={(e) => setConcertForm({ ...concertForm, catering_drinks: parseInt(e.target.value) || 0 })}
                        className="bg-black/20 border-white/10"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={concertForm.catering_respect}
                        onCheckedChange={(checked) => setConcertForm({ ...concertForm, catering_respect: checked })}
                      />
                      <Label className="text-sm">Repas respectueux (végétarien/vegan)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={concertForm.catering_tbd}
                        onCheckedChange={(checked) => setConcertForm({ ...concertForm, catering_tbd: checked })}
                      />
                      <Label className="text-sm">À définir avec l'artiste</Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Hébergement */}
              <div className="p-4 border-2 border-blue-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={concertForm.has_accommodation}
                    onCheckedChange={(checked) => setConcertForm({ ...concertForm, has_accommodation: checked })}
                  />
                  <Label className="font-medium text-blue-400">🏠 Hébergement proposé</Label>
                </div>

                {concertForm.has_accommodation && (
                  <div className="pl-8 space-y-3">
                    <div className="space-y-2">
                      <Label>Capacité d'hébergement (personnes)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={concertForm.accommodation_capacity}
                        onChange={(e) => setConcertForm({ ...concertForm, accommodation_capacity: parseInt(e.target.value) || 0 })}
                        className="bg-black/20 border-white/10"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={concertForm.accommodation_tbd}
                        onCheckedChange={(checked) => setConcertForm({ ...concertForm, accommodation_tbd: checked })}
                      />
                      <Label className="text-sm">À définir avec l'artiste</Label>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateConcert} 
                className="w-full bg-primary hover:bg-primary/90 rounded-full"
              >
                Créer le concert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {concerts.length === 0 ? (
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun concert</h3>
          <p className="text-muted-foreground mb-4">Créez votre premier concert</p>
          <Button 
            onClick={() => setShowConcertDialog(true)}
            className="bg-primary hover:bg-primary/90 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau concert
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {concerts.map((concert) => (
            <div key={concert.id} className="glassmorphism rounded-xl p-4 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{concert.title || 'Concert'}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(concert.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{concert.start_time} - {concert.end_time}</span>
                    </div>
                    {concert.description && (
                      <p className="text-xs mt-2 line-clamp-2">{concert.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditEvent(concert, 'concert')}
                  className="flex-1 rounded-full"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Éditer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(concert.id, 'concert')}
                  className="rounded-full"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
