import { Button } from "../../../components/ui/button";
import { Plus, Edit, Trash2, Calendar, Clock, Mic } from "lucide-react";

export default function KaraokeTab({ 
  karaokes,
  handleOpenKaraokeDialog,
  handleEditEvent,
  handleDeleteEvent
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl">Karaoké</h2>
        <Button 
          onClick={handleOpenKaraokeDialog}
          className="bg-primary hover:bg-primary/90 rounded-full gap-2"
        >
          <Plus className="w-4 h-4" /> Nouveau karaoké
        </Button>
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
