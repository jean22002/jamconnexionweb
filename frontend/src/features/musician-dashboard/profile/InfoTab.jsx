import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { MusicianImageUpload } from "../../../components/ui/image-upload";
import { CityAutocomplete } from "../../../components/CityAutocomplete";
import { X } from "lucide-react";

export default function InfoTab({ 
  profileForm, 
  setProfileForm, 
  token,
  addToList,
  removeFromList 
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Photo de profil</Label>
        <MusicianImageUpload
          value={profileForm.profile_image}
          onChange={(url) => {
            console.log('📸 Musician profile image updated:', url);
            setProfileForm(prev => ({ ...prev, profile_image: url }));
          }}
          token={token}
          photoType="profile"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pseudo</Label>
          <Input 
            value={profileForm.pseudo} 
            onChange={(e) => setProfileForm({ ...profileForm, pseudo: e.target.value })} 
            className="bg-black/20 border-white/10" 
            data-testid="profile-pseudo" 
          />
        </div>
        <div className="space-y-2">
          <Label>Âge</Label>
          <Select 
            value={profileForm.age?.toString() || ""} 
            onValueChange={(value) => setProfileForm({ ...profileForm, age: parseInt(value) })}
          >
            <SelectTrigger className="bg-black/20 border-white/10">
              <SelectValue placeholder="Sélectionnez votre âge" />
            </SelectTrigger>
            <SelectContent className="bg-background border-white/10 max-h-[300px]">
              {Array.from({ length: 91 }, (_, i) => i + 10).map((age) => (
                <SelectItem key={age} value={age.toString()}>
                  {age} ans
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea 
          value={profileForm.bio} 
          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} 
          className="bg-black/20 border-white/10" 
          rows={3} 
        />
      </div>
      
      <div className="space-y-2">
        <Label>Instruments</Label>
        <Input 
          placeholder="Appuyez Entrée pour ajouter" 
          onKeyPress={(e) => { 
            if (e.key === 'Enter') { 
              addToList('instruments', e.target.value); 
              e.target.value = ''; 
            } 
          }} 
          className="bg-black/20 border-white/10" 
        />
        <div className="flex flex-wrap gap-2">
          {profileForm.instruments.map((inst, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full text-sm">
              {inst}
              <button onClick={() => removeFromList('instruments', i)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Email</Label>
        <Input 
          type="email" 
          value={profileForm.email} 
          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
          className="bg-black/20 border-white/10" 
        />
      </div>
      
      <div className="space-y-2">
        <Label>Téléphone</Label>
        <Input 
          type="tel" 
          value={profileForm.phone} 
          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
          className="bg-black/20 border-white/10" 
        />
      </div>
      
      <div className="space-y-2">
        <Label>Ville</Label>
        <CityAutocomplete
          value={profileForm.city}
          onSelect={(city, postalCode, department, departmentName, region, latitude, longitude) => {
            setProfileForm({
              ...profileForm,
              city,
              postal_code: postalCode,
              department,
              department_name: departmentName,
              region
            });
          }}
          placeholder="Recherchez votre ville..."
          className="bg-black/20 border-white/10"
        />
      </div>
    </div>
  );
}
