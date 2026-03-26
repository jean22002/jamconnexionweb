import { Button } from "../../../components/ui/button";
import { Plus, Edit, Trash2, Calendar, Clock, Theater } from "lucide-react";

export default function SpectacleTab({ 
  spectacles,
  handleOpenSpectacleDialog,
  handleEditEvent,
  handleDeleteEvent
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl">Spectacles</h2>
        <Button 
          onClick={handleOpenSpectacleDialog}
          className="bg-primary hover:bg-primary/90 rounded-full gap-2"
        >
          <Plus className="w-4 h-4" /> Nouveau spectacle
        </Button>
      </div>

      {spectacles.length === 0 ? (
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <Theater className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun spectacle</h3>
          <p className="text-muted-foreground mb-4">Créez votre premier spectacle</p>
          <Button 
            onClick={handleOpenSpectacleDialog}
            className="bg-primary hover:bg-primary/90 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau spectacle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spectacles.map((spectacle) => (
            <div key={spectacle.id} className="glassmorphism rounded-xl p-4 hover:border-cyan-500/50 transition-all border-2 border-cyan-500/20">
              <h3 className="font-semibold text-lg mb-2">{spectacle.title || 'Spectacle'}</h3>
              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(spectacle.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{spectacle.start_time} - {spectacle.end_time}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditEvent(spectacle, 'spectacle')}
                  className="flex-1 rounded-full"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Éditer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(spectacle.id, 'spectacle')}
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
