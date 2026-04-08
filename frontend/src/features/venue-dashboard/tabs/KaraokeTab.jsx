import { Button } from "../../../components/ui/button";
import { Plus, Edit, Trash2, Calendar, Clock, Mic } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import TimeSelect from "../../../components/TimeSelect";

export default function KaraokeTab({ 
  karaokes,
  handleOpenKaraokeDialog,
  handleEditEvent,
  handleDeleteEvent,
  // Nouveaux props pour le Dialog
  showKaraokeDialog,
  setShowKaraokeDialog,
  karaokeForm,
  setKaraokeForm,
  handleCreateKaraoke
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl">Karaoké</h2>
        <Dialog open={showKaraokeDialog} onOpenChange={setShowKaraokeDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
              <Plus className="w-4 h-4" /> Nouveau karaoké
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une soirée karaoké</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={karaokeForm.date} 
                    onChange={(e) => setKaraokeForm({ ...karaokeForm, date: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <TimeSelect
                    value={karaokeForm.start_time}
                    onChange={(value) => setKaraokeForm({ ...karaokeForm, start_time: value })}
                    placeholder="Heure de début"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <TimeSelect
                    value={karaokeForm.end_time}
                    onChange={(value) => setKaraokeForm({ ...karaokeForm, end_time: value })}
                    placeholder="Heure de fin"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input 
                  value={karaokeForm.title} 
                  onChange={(e) => setKaraokeForm({ ...karaokeForm, title: e.target.value })} 
                  placeholder="Ex: Soirée Karaoké Pop-Rock"
                  className="bg-black/20 border-white/10" 
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={karaokeForm.description} 
                  onChange={(e) => setKaraokeForm({ ...karaokeForm, description: e.target.value })} 
                  placeholder="Décrivez votre soirée karaoké..."
                  className="bg-black/20 border-white/10" 
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Styles musicaux (optionnel)</Label>
                <Input 
                  value={karaokeForm.music_styles} 
                  onChange={(e) => setKaraokeForm({ ...karaokeForm, music_styles: e.target.value })} 
                  placeholder="Ex: Pop, Rock, Variété française"
                  className="bg-black/20 border-white/10" 
                />
              </div>

              {/* Nouveaux champs : Conditions & Tarif */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Conditions</Label>
                  <Input 
                    value={karaokeForm.conditions} 
                    onChange={(e) => setKaraokeForm({ ...karaokeForm, conditions: e.target.value })} 
                    placeholder="Ex: Animateur, DJ, Matériel fourni"
                    className="bg-black/20 border-white/10" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tarif</Label>
                  <Input 
                    value={karaokeForm.price} 
                    onChange={(e) => setKaraokeForm({ ...karaokeForm, price: e.target.value })} 
                    placeholder="Ex: Gratuit, 5€, PAF"
                    className="bg-black/20 border-white/10" 
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateKaraoke} 
                className="w-full bg-primary hover:bg-primary/90 rounded-full"
              >
                Créer le karaoké
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {karaokes.length === 0 ? (
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun karaoké</h3>
          <p className="text-muted-foreground mb-4">Créez votre première soirée karaoké</p>
          <Button 
            onClick={handleOpenKaraokeDialog}
            className="bg-primary hover:bg-primary/90 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau karaoké
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {karaokes.map((karaoke) => (
            <div key={karaoke.id} className="glassmorphism rounded-xl p-4 hover:border-pink-500/50 transition-all border-2 border-pink-500/20">
              <h3 className="font-semibold text-lg mb-2">{karaoke.title || 'Soirée Karaoké'}</h3>
              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(karaoke.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{karaoke.start_time} - {karaoke.end_time}</span>
                </div>
                {karaoke.conditions && (
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span className="text-xs">{karaoke.conditions}</span>
                  </div>
                )}
                {karaoke.price && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                      {karaoke.price}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditEvent(karaoke, 'karaoke')}
                  className="flex-1 rounded-full"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Éditer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(karaoke.id, 'karaoke')}
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
