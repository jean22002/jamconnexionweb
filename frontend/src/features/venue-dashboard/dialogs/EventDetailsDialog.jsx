import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { TimeSelect } from "../../../components/ui/time-select";
import { Music, X, Loader2, Trash2, Eye, MessageSquare, Heart } from "lucide-react";
import { MUSIC_STYLES_LIST } from "../../../data/music-styles";
import { toast } from "sonner";

/**
 * EventDetailsDialog - Modale d'affichage/édition d'événement
 * 
 * Composant extrait de VenueDashboard.jsx pour réduire la taille du fichier principal.
 * Gère l'affichage et la modification des événements (concerts, jams, karaokes, spectacles, etc.)
 * 
 * @param {boolean} isOpen - État d'ouverture de la modale
 * @param {function} onClose - Callback de fermeture
 * @param {object} selectedEvent - Événement sélectionné
 * @param {function} setSelectedEvent - Setter pour l'événement
 * @param {string} selectedEventType - Type d'événement (concert, jam, etc.)
 * @param {function} setSelectedEventType - Setter pour le type
 * @param {boolean} isEditing - Mode édition activé
 * @param {function} setIsEditing - Setter pour le mode édition
 * @param {object} newBand - Nouveau groupe à ajouter
 * @param {function} setNewBand - Setter pour le nouveau groupe
 * @param {array} bandSuggestions - Suggestions de groupes
 * @param {boolean} showBandSuggestions - Afficher les suggestions
 * @param {function} setShowBandSuggestions - Setter pour l'affichage des suggestions
 * @param {function} handleDeleteEvent - Fonction de suppression
 * @param {function} handleSaveEvent - Fonction de sauvegarde
 * @param {string} profile - Profil de l'établissement (pour la validation)
 */
export function EventDetailsDialog({
  isOpen,
  onClose,
  selectedEvent,
  setSelectedEvent,
  selectedEventType,
  setSelectedEventType,
  isEditing,
  setIsEditing,
  newBand,
  setNewBand,
  bandSuggestions,
  showBandSuggestions,
  setShowBandSuggestions,
  handleDeleteEvent,
  handleSaveEvent,
  profile
}) {
  
  const handleClose = (open) => {
    if (!open) {
      setSelectedEvent(null);
      setSelectedEventType(null);
      setIsEditing(false);
    }
    onClose(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditing ? 'Modifier' : 'Détails'} {
              selectedEventType === 'concert' ? 'du Concert' : 
              selectedEventType === 'jam' ? 'du Bœuf' :
              selectedEventType === 'karaoke' ? 'du Karaoké' :
              selectedEventType === 'spectacle' ? 'du Spectacle' :
              selectedEventType === 'slot' ? 'du Créneau' :
              selectedEventType === 'application' ? 'de la Candidature' :
              'de l\'événement'
            }
          </DialogTitle>
        </DialogHeader>

        {selectedEvent && (
          <div className="space-y-4 mt-4">
            {/* Date et Horaires */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedEvent.date || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                  className="bg-black/20 border-white/10"
                  disabled={!isEditing}
                  onKeyDown={(e) => e.preventDefault()}
                  style={{ caretColor: 'transparent' }}
                />
              </div>
              <div className="space-y-2">
                <Label>Horaire de début</Label>
                {isEditing ? (
                  <TimeSelect
                    value={selectedEvent.start_time || ''}
                    onChange={(value) => setSelectedEvent({ ...selectedEvent, start_time: value })}
                    placeholder="Heure de début"
                  />
                ) : (
                  <Input
                    type="text"
                    value={selectedEvent.start_time || ''}
                    className="bg-black/20 border-white/10"
                    disabled
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Horaire de fin</Label>
              {isEditing ? (
                <TimeSelect
                  value={selectedEvent.end_time || ''}
                  onChange={(value) => setSelectedEvent({ ...selectedEvent, end_time: value })}
                  placeholder="Heure de fin"
                />
              ) : (
                <Input
                  type="text"
                  value={selectedEvent.end_time || ''}
                  className="bg-black/20 border-white/10"
                  disabled
                />
              )}
            </div>

            {/* Champs spécifiques au Concert */}
            {selectedEventType === 'concert' && (
              <>
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={selectedEvent.title || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    className="bg-black/20 border-white/10"
                    disabled={!isEditing}
                  />
                </div>

                {/* Musical Styles Section for Concert */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Styles musicaux
                  </Label>
                  {isEditing ? (
                    <>
                      <Select 
                        value="" 
                        onValueChange={(value) => {
                          if (value && !selectedEvent.music_styles?.includes(value)) {
                            setSelectedEvent({ 
                              ...selectedEvent, 
                              music_styles: [...(selectedEvent.music_styles || []), value] 
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Sélectionnez un style" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 max-h-[300px] overflow-y-auto">
                          {MUSIC_STYLES_LIST.map(style => (
                            <SelectItem 
                              key={style} 
                              value={style}
                              disabled={selectedEvent.music_styles?.includes(style)}
                            >
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedEvent.music_styles && selectedEvent.music_styles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedEvent.music_styles.map((style, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                            >
                              {style}
                              <button 
                                type="button"
                                onClick={() => setSelectedEvent({ 
                                  ...selectedEvent, 
                                  music_styles: selectedEvent.music_styles.filter((_, i) => i !== idx) 
                                })}
                                className="hover:text-primary-foreground"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.music_styles && selectedEvent.music_styles.length > 0 ? (
                        selectedEvent.music_styles.map((style, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                          >
                            {style}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun style défini</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selectedEvent.description || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    className="bg-black/20 border-white/10"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prix</Label>
                  <Input
                    value={selectedEvent.price || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, price: e.target.value })}
                    placeholder="Ex: 10€"
                    className="bg-black/20 border-white/10"
                    disabled={!isEditing}
                  />
                </div>

                {/* Section Artistes/Groupes */}
                <div className="space-y-2">
                  <Label>Artistes / Groupes</Label>
                  
                  {isEditing ? (
                    // Mode édition : permettre d'ajouter/supprimer des groupes
                    <div className="space-y-3">
                      {/* Formulaire d'ajout de groupe */}
                      <div className="p-4 border border-white/10 rounded-xl space-y-3">
                        <div className="relative">
                          <Input 
                            placeholder="Nom du groupe (commencez à taper pour rechercher)" 
                            value={newBand.name} 
                            onChange={(e) => setNewBand({ ...newBand, name: e.target.value })} 
                            onFocus={() => {
                              if (bandSuggestions.length > 0) setShowBandSuggestions(true);
                            }}
                            className="bg-black/20 border-white/10" 
                          />
                          
                          {/* Suggestions dropdown */}
                          {showBandSuggestions && bandSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {bandSuggestions.map((band, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setNewBand({ 
                                      ...newBand, 
                                      name: band.name,
                                      members_count: band.members_count || 0
                                    });
                                    setShowBandSuggestions(false);
                                    toast.success(`Groupe "${band.name}" sélectionné`);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-semibold text-white">{band.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {band.members_count && `${band.members_count} membres`}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Nombre de membres du groupe</Label>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Ex: 4" 
                            value={newBand.members_count || ""} 
                            onChange={(e) => setNewBand({ ...newBand, members_count: parseInt(e.target.value) || 0 })} 
                            className="bg-black/20 border-white/10" 
                          />
                        </div>
                        
                        <Button 
                          type="button" 
                          onClick={() => {
                            if (newBand.name) {
                              setSelectedEvent({ 
                                ...selectedEvent, 
                                bands: [...(selectedEvent.bands || []), { ...newBand }] 
                              });
                              setNewBand({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });
                              setShowBandSuggestions(false);
                            }
                          }} 
                          variant="outline" 
                          className="w-full border-white/20"
                        >
                          Ajouter le groupe
                        </Button>
                      </div>
                      
                      {/* Liste des groupes */}
                      {selectedEvent.bands && selectedEvent.bands.length > 0 && (
                        <div className="space-y-2">
                          {selectedEvent.bands.map((band, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{band.name}</p>
                                {band.members_count && (
                                  <span className="text-sm text-muted-foreground">
                                    {band.members_count} membre{band.members_count > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedEvent({ 
                                    ...selectedEvent, 
                                    bands: selectedEvent.bands.filter((_, idx) => idx !== i) 
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Total des musiciens */}
                      {selectedEvent.bands && selectedEvent.bands.length > 0 && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <p className="text-sm font-semibold text-primary">
                            Total : {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0)} musicien{selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Mode lecture seule : affichage simple
                    selectedEvent.bands && selectedEvent.bands.length > 0 && (
                      <div className="space-y-2">
                        {selectedEvent.bands.map((band, i) => (
                          <div key={i} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                            <p className="font-medium">{band.name}</p>
                            {band.members_count && (
                              <span className="text-sm text-muted-foreground">
                                {band.members_count} membre{band.members_count > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ))}
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mt-2">
                          <p className="text-sm font-semibold text-primary">
                            Total : {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0)} musicien{selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) > 1 ? 's' : ''}
                          </p>
                          {(selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) + (selectedEvent.participants_count || 0)) > 0 && (
                            <p className="text-sm font-semibold text-green-400 mt-2">
                              {selectedEvent.bands.reduce((sum, band) => sum + (band.members_count || 0), 0) + (selectedEvent.participants_count || 0)} : minimum de personnes étrangères à l'établissement (groupes + participants)
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* Champs spécifiques au Bœuf */}
            {selectedEventType === 'jam' && (
              <>
                <div className="space-y-2">
                  <Label>Styles musicaux</Label>
                  <Input
                    value={selectedEvent.music_styles?.join(', ') || ''}
                    onChange={(e) => setSelectedEvent({ 
                      ...selectedEvent, 
                      music_styles: e.target.value.split(',').map(s => s.trim()) 
                    })}
                    placeholder="Rock, Jazz, Blues..."
                    className="bg-black/20 border-white/10"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Règles</Label>
                  <Textarea
                    value={selectedEvent.rules || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, rules: e.target.value })}
                    className="bg-black/20 border-white/10"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Informations supplémentaires</Label>
                  <Textarea
                    value={selectedEvent.additional_info || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, additional_info: e.target.value })}
                    className="bg-black/20 border-white/10"
                    rows={2}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedEvent.has_instruments || false}
                      onCheckedChange={(checked) => setSelectedEvent({ ...selectedEvent, has_instruments: checked })}
                      disabled={!isEditing}
                    />
                    <Label>Instruments sur place</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedEvent.has_pa_system || false}
                      onCheckedChange={(checked) => setSelectedEvent({ ...selectedEvent, has_pa_system: checked })}
                      disabled={!isEditing}
                    />
                    <Label>Sonorisation</Label>
                  </div>
                </div>
              </>
            )}

            {/* NOTE: Le reste du contenu (Karaoke, Spectacle, Slot, Applications, etc.) 
                       sera ajouté dans la prochaine partie pour ne pas dépasser la limite de tokens */}
            
            {/* Boutons d'action */}
            <div className="flex gap-2 mt-6">
              {!isEditing && selectedEventType !== 'application' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditing(true)}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteEvent(selectedEventType, selectedEvent.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}

              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false);
                      handleClose(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSaveEvent(selectedEventType)}
                  >
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrer
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
