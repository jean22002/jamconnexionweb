import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { MusicianImageUpload } from "../../../components/ui/image-upload";
import { X } from "lucide-react";

const REPERTOIRE_TYPES = ["Compos", "Reprises", "Compos + Reprises"];
const SHOW_DURATIONS = [
  "30mn", "45mn", "1h", "1h15", "1h30", "1h45",
  "2h", "2h15", "2h30", "2h45",
  "3h", "3h15", "3h30", "3h45",
  "4h", "4h15", "4h30", "4h45",
  "5h", "5h15", "5h30", "5h45", "6h"
];

export default function SoloTab({ soloProfile, setSoloProfile, token, addToList, removeFromList }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={soloProfile.has_solo}
          onCheckedChange={(checked) => setSoloProfile({ ...soloProfile, has_solo: checked })}
        />
        <Label>J'ai un projet solo</Label>
      </div>

      {soloProfile.has_solo && (
        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="space-y-2">
            <Label>Photo Solo</Label>
            <MusicianImageUpload
              value={soloProfile.solo_photo}
              onChange={(url) => setSoloProfile({ ...soloProfile, solo_photo: url })}
              token={token}
              photoType="solo"
            />
          </div>

          <div className="space-y-2">
            <Label>Nom de scène</Label>
            <Input
              value={soloProfile.solo_name}
              onChange={(e) => setSoloProfile({ ...soloProfile, solo_name: e.target.value })}
              className="bg-black/20 border-white/10"
              placeholder="Mon nom de scène"
            />
          </div>

          <div className="space-y-2">
            <Label>Description solo</Label>
            <Textarea
              value={soloProfile.solo_description}
              onChange={(e) => setSoloProfile({ ...soloProfile, solo_description: e.target.value })}
              className="bg-black/20 border-white/10"
              rows={3}
              placeholder="Décrivez votre projet solo"
            />
          </div>

          <div className="space-y-2">
            <Label>Instruments solo</Label>
            <Input
              placeholder="Appuyez Entrée pour ajouter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const newInstruments = [...(soloProfile.solo_instruments || []), e.target.value];
                  setSoloProfile({ ...soloProfile, solo_instruments: newInstruments });
                  e.target.value = '';
                }
              }}
              className="bg-black/20 border-white/10"
            />
            <div className="flex flex-wrap gap-2">
              {(soloProfile.solo_instruments || []).map((inst, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full text-sm">
                  {inst}
                  <button
                    onClick={() => {
                      const newInstruments = soloProfile.solo_instruments.filter((_, idx) => idx !== i);
                      setSoloProfile({ ...soloProfile, solo_instruments: newInstruments });
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de répertoire</Label>
              <Select
                value={soloProfile.solo_repertoire_type}
                onValueChange={(value) => setSoloProfile({ ...soloProfile, solo_repertoire_type: value })}
              >
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/10">
                  {REPERTOIRE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Durée du show</Label>
              <Select
                value={soloProfile.solo_show_duration}
                onValueChange={(value) => setSoloProfile({ ...soloProfile, solo_show_duration: value })}
              >
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Durée" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/10">
                  {SHOW_DURATIONS.map((duration) => (
                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={soloProfile.solo_looking_for_concerts}
              onCheckedChange={(checked) => setSoloProfile({ ...soloProfile, solo_looking_for_concerts: checked })}
            />
            <Label>Recherche des concerts</Label>
          </div>
        </div>
      )}
    </div>
  );
}
