import { Label } from "../../../components/ui/label";
import { MUSIC_STYLES_LIST } from "../../../data/music-styles";
import { X } from "lucide-react";

export default function StylesTab({ profileForm, setProfileForm, addToList, removeFromList }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Styles musicaux</Label>
        <select
          onChange={(e) => {
            if (e.target.value && !profileForm.music_styles.includes(e.target.value)) {
              addToList('music_styles', e.target.value);
              e.target.value = '';
            }
          }}
          className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-md text-white"
        >
          <option value="">Sélectionner un style</option>
          {MUSIC_STYLES_LIST.map((style) => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 mt-2">
          {profileForm.music_styles.map((style, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full text-sm">
              {style}
              <button onClick={() => removeFromList('music_styles', i)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
