import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Music, Users, Euro, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import TimeSelect from "../../../components/TimeSelect";

export default function ConcertsTab({
  concerts,
  showConcertDialog,
  setShowConcertDialog,
  concertForm,
  setConcertForm,
  handleCreateConcert,
  handleEditEvent,
  handleDeleteEvent
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
