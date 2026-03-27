import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { TimeSelect } from "../../../../components/ui/time-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "../../../../components/ui/dialog";
import { Music, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MUSIC_STYLES_LIST } from "../../../../data/music-styles";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ConcertForm({ 
  showDialog, 
  setShowDialog, 
  venueId, 
  token, 
  onConcertCreated 
}) {
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    title: "",
    music_styles: [],
    price: "",
    bands: [],
    catering: false,
    catering_type: "",
    catering_cost: "",
    catering_per_person: "",
    catering_people_count: "",
    accommodation: false,
    accommodation_type: "",
    accommodation_cost: "",
    accommodation_people_count: "",
    bar_revenue: "",
    ticket_revenue: "",
    total_cost: "",
    payment_status: "pending",
    payment_date: "",
    description: ""
  });

  const [newBand, setNewBand] = useState({ 
    name: "", 
    musician_id: "", 
    members_count: 0, 
    photo: "", 
    facebook: "", 
    instagram: "" 
  });

  const [bandSuggestions, setBandSuggestions] = useState([]);
  const [showBandSuggestions, setShowBandSuggestions] = useState(false);
  const [manualBandEntry, setManualBandEntry] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch band suggestions when typing
  useEffect(() => {
    const fetchBandSuggestions = async () => {
      if (newBand.name.length >= 2 && !manualBandEntry) {
        try {
          const res = await axios.get(`${API}/bands/search?q=${newBand.name}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBandSuggestions(res.data);
          setShowBandSuggestions(true);
        } catch (error) {
          console.error("Error fetching band suggestions:", error);
        }
      } else {
        setBandSuggestions([]);
        setShowBandSuggestions(false);
      }
    };

    const timer = setTimeout(fetchBandSuggestions, 300);
    return () => clearTimeout(timer);
  }, [newBand.name, manualBandEntry, token]);

  const handleAddBand = () => {
    if (!newBand.name) {
      toast.error("Le nom du groupe est obligatoire");
      return;
    }
    setForm({ ...form, bands: [...form.bands, newBand] });
    setNewBand({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });
    toast.success("Groupe ajouté");
  };

  const handleRemoveBand = (idx) => {
    setForm({ ...form, bands: form.bands.filter((_, i) => i !== idx) });
    toast.success("Groupe retiré");
  };

  const handleCreate = async () => {
    if (!form.date || !form.start_time || !form.title) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Vérifier qu'il n'y a pas déjà un événement ce jour-là
    try {
      const checkRes = await axios.get(`${API}/venues/${venueId}/events/check-date?date=${form.date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (checkRes.data.exists) {
        toast.error("Un événement existe déjà pour cette date. Veuillez choisir une autre date.");
        return;
      }
    } catch (error) {
      console.error("Error checking date:", error);
    }

    setCreating(true);
    try {
      await axios.post(
        `${API}/venues/${venueId}/concerts`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Concert créé avec succès !");
      setForm({
        date: "",
        start_time: "",
        end_time: "",
        title: "",
        music_styles: [],
        price: "",
        bands: [],
        catering: false,
        catering_type: "",
        catering_cost: "",
        catering_per_person: "",
        catering_people_count: "",
        accommodation: false,
        accommodation_type: "",
        accommodation_cost: "",
        accommodation_people_count: "",
        bar_revenue: "",
        ticket_revenue: "",
        total_cost: "",
        payment_status: "pending",
        payment_date: "",
        description: ""
      });
      setShowDialog(false);
      if (onConcertCreated) onConcertCreated();
    } catch (error) {
      console.error("Error creating concert:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la création du concert");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
          <Plus className="w-4 h-4" /> Nouveau concert
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Créer un concert</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={form.date} 
                onChange={(e) => setForm({ ...form, date: e.target.value })} 
                className="bg-black/20 border-white/10"
                onKeyDown={(e) => e.preventDefault()}
                style={{ caretColor: 'transparent' }}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure début</Label>
              <TimeSelect
                value={form.start_time}
                onChange={(value) => setForm({ ...form, start_time: value })}
                placeholder="Heure de début"
              />
            </div>
            <div className="space-y-2">
              <Label>Heure fin</Label>
              <TimeSelect
                value={form.end_time}
                onChange={(value) => setForm({ ...form, end_time: value })}
                placeholder="Heure de fin"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="bg-black/20 border-white/10" 
            />
          </div>

          {/* Musical Styles */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Styles musicaux
            </Label>
            <Select 
              value="" 
              onValueChange={(value) => {
                if (value && !form.music_styles.includes(value)) {
                  setForm({ 
                    ...form, 
                    music_styles: [...form.music_styles, value] 
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
                    disabled={form.music_styles.includes(style)}
                  >
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.music_styles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.music_styles.map((style, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                  >
                    {style}
                    <button 
                      type="button"
                      onClick={() => setForm({ 
                        ...form, 
                        music_styles: form.music_styles.filter((_, i) => i !== idx) 
                      })}
                      className="hover:text-primary-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Prix</Label>
            <Input 
              value={form.price} 
              onChange={(e) => setForm({ ...form, price: e.target.value })} 
              placeholder="Ex: Gratuit, 10€, PAF" 
              className="bg-black/20 border-white/10" 
            />
          </div>

          {/* Bands Section - Simplified version */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Groupes / Artistes</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualBandEntry}
                  onChange={(e) => {
                    setManualBandEntry(e.target.checked);
                    setNewBand({ name: "", musician_id: "", members_count: 0, photo: "", facebook: "", instagram: "" });
                    setShowBandSuggestions(false);
                  }}
                  className="rounded"
                />
                <span className="text-muted-foreground">Groupe non référencé</span>
              </label>
            </div>

            <div className="p-4 border border-white/10 rounded-xl space-y-3">
              <div className="relative">
                <Input 
                  placeholder="Nom du groupe" 
                  value={newBand.name} 
                  onChange={(e) => setNewBand({ ...newBand, name: e.target.value })} 
                  onFocus={() => {
                    if (bandSuggestions.length > 0) setShowBandSuggestions(true);
                  }}
                  className="bg-black/20 border-white/10" 
                />
                
                {/* Band Suggestions */}
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
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <p className="font-semibold">{band.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {band.members_count && `${band.members_count} membres`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {manualBandEntry && (
                <div className="space-y-2">
                  <Label>Nombre de membres</Label>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="Ex: 5" 
                    value={newBand.members_count || ""} 
                    onChange={(e) => setNewBand({ ...newBand, members_count: parseInt(e.target.value) || 0 })} 
                    className="bg-black/20 border-white/10" 
                  />
                </div>
              )}

              <Button 
                type="button" 
                onClick={handleAddBand}
                className="w-full"
              >
                Ajouter le groupe
              </Button>

              {/* Added Bands List */}
              {form.bands.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>Groupes ajoutés :</Label>
                  {form.bands.map((band, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-black/20 rounded">
                      <span>{band.name} {band.members_count > 0 && `(${band.members_count} membres)`}</span>
                      <button onClick={() => handleRemoveBand(idx)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              placeholder="Description optionnelle..."
              className="bg-black/20 border-white/10" 
              rows={3}
            />
          </div>

          {/* Create Button */}
          <Button 
            onClick={handleCreate} 
            className="w-full" 
            disabled={creating}
          >
            {creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Création...</> : "Créer le concert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
