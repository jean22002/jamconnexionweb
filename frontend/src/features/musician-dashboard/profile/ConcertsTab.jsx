import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { X } from "lucide-react";

export default function ConcertsTab({ profileForm, setProfileForm }) {
  const addConcert = (value) => {
    if (value.trim()) {
      setProfileForm({
        ...profileForm,
        concerts: [...(profileForm.concerts || []), value.trim()]
      });
    }
  };

  const removeConcert = (index) => {
    setProfileForm({
      ...profileForm,
      concerts: profileForm.concerts.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Concerts passés / Références</Label>
        <Input
          placeholder="Appuyez Entrée pour ajouter"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addConcert(e.target.value);
              e.target.value = '';
            }
          }}
          className="bg-black/20 border-white/10"
        />
        <div className="space-y-2 mt-3">
          {(profileForm.concerts || []).map((concert, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-black/20 rounded-lg border border-white/10">
              <span className="flex-1 text-sm">{concert}</span>
              <button onClick={() => removeConcert(i)} className="hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
