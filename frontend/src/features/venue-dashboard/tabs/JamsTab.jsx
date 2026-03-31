import { Button } from "../../../components/ui/button";
import { Plus, Edit, Trash2, Calendar, Clock, Music } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import TimeSelect from "../../../components/TimeSelect";

export default function JamsTab({ 
  jams,
  handleOpenJamDialog,
  handleEditEvent,
  handleDeleteEvent,
  // Nouveaux props pour le Dialog
  showJamDialog,
  setShowJamDialog,
  jamForm,
  setJamForm,
  handleCreateJam
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl">Bœufs Musicaux</h2>
        <Dialog open={showJamDialog} onOpenChange={setShowJamDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
              <Plus className="w-4 h-4" /> Nouveau bœuf
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un bœuf musical</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={jamForm.date} 
                    onChange={(e) => setJamForm({ ...jamForm, date: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <TimeSelect
                    value={jamForm.start_time}
                    onChange={(value) => setJamForm({ ...jamForm, start_time: value })}
                    placeholder="Heure de début"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <TimeSelect
                    value={jamForm.end_time}
                    onChange={(value) => setJamForm({ ...jamForm, end_time: value })}
                    placeholder="Heure de fin"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Styles musicaux (ex: Rock, Jazz, Blues)</Label>
                <Input 
                  value={jamForm.music_styles} 
                  onChange={(e) => setJamForm({ ...jamForm, music_styles: e.target.value })} 
                  placeholder="Séparer par des virgules"
                  className="bg-black/20 border-white/10" 
                />
              </div>
              <div className="space-y-2">
                <Label>Règles / Informations</Label>
                <Textarea 
                  value={jamForm.rules} 
                  onChange={(e) => setJamForm({ ...jamForm, rules: e.target.value })} 
                  placeholder="Ex: Ouvert à tous, 3 morceaux max par musicien..."
                  className="bg-black/20 border-white/10" 
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleCreateJam} 
                className="w-full bg-primary hover:bg-primary/90 rounded-full"
              >
                Créer le bœuf
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {jams.length === 0 ? (
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun bœuf</h3>
          <p className="text-muted-foreground mb-4">Créez votre premier bœuf musical</p>
          <Button 
            onClick={handleOpenJamDialog}
            className="bg-primary hover:bg-primary/90 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau bœuf
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jams.map((jam) => (
            <div key={jam.id} className="glassmorphism rounded-xl p-4 hover:border-purple-500/50 transition-all border-2 border-purple-500/20">
              <h3 className="font-semibold text-lg mb-2">{jam.title || 'Bœuf musical'}</h3>
              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(jam.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{jam.start_time} - {jam.end_time}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditEvent(jam, 'jam')}
                  className="flex-1 rounded-full"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Éditer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(jam.id, 'jam')}
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
