import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { CityAutocomplete } from "../../../components/CityAutocomplete";
import { MUSIC_STYLES_LIST } from "../../../data/music-styles";
import { X, Trash2, Plus, Mic, Music, MapPin, Settings, Search, Link as LinkIcon, Save } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const REPERTOIRE_TYPES = ["Compos", "Reprises", "Compos + Reprises"];
const SHOW_DURATIONS = [
  "30 min", "45 min", "1h", "1h30", "2h", "2h30", "3h", "> 3h"
];

const EMPTY_SOLO = {
  id: null,
  name: "",
  band_type: "Solo",
  music_styles: [],
  city: "",
  postal_code: "",
  department: "",
  department_name: "",
  region: "",
  description: "",
  repertoire_type: "",
  show_duration: "",
  equipment: [],
  is_association: false,
  association_name: "",
  has_label: false,
  label_name: "",
  has_sound_engineer: false,
  payment_methods: [],
  looking_for_concerts: true,
  looking_for_members: false,
  profils_recherches: [],
  facebook: "",
  instagram: "",
  youtube: "",
  website: "",
  bandcamp: "",
};

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Formulaire dédié à la création / édition d'un projet Solo.
 * UX accordion 7 sections (alignée avec l'app mobile Expo).
 *
 * Props :
 *  - open: bool
 *  - onClose: () => void
 *  - token: string
 *  - editingSolo: objet band existant ou null (mode création)
 *  - onSaved: () => void  // callback de rafraîchissement après save/delete
 */
/**
 * Wrapper qui gère l'ouverture/fermeture et remonte le contenu via une key
 * (évite setState-in-effect lors du reset entre create/edit).
 */
export default function SoloProjectFormDialog({ open, onClose, token, editingSolo = null, onSaved }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="glassmorphism border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="solo-project-dialog">
        <SoloProjectFormBody
          key={editingSolo?.id || "new"}
          token={token}
          editingSolo={editingSolo}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function SoloProjectFormBody({ token, editingSolo, onClose, onSaved }) {
  const initial = editingSolo
    ? {
        ...EMPTY_SOLO,
        ...editingSolo,
        band_type: "Solo",
        music_styles: editingSolo.music_styles || [],
        equipment: editingSolo.equipment || [],
        payment_methods: editingSolo.payment_methods || [],
        profils_recherches:
          editingSolo.profils_recherches ||
          editingSolo.looking_for_profiles ||
          [],
      }
    : EMPTY_SOLO;

  const [form, setForm] = useState(initial);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [profilsInput, setProfilsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleStyle = (style) => {
    setForm((p) => ({
      ...p,
      music_styles: p.music_styles.includes(style)
        ? p.music_styles.filter((s) => s !== style)
        : [...p.music_styles, style],
    }));
  };

  const addEquipment = () => {
    const v = equipmentInput.trim();
    if (!v) return;
    if (!form.equipment.includes(v)) {
      setForm((p) => ({ ...p, equipment: [...p.equipment, v] }));
    }
    setEquipmentInput("");
  };

  const removeEquipment = (idx) => {
    setForm((p) => ({ ...p, equipment: p.equipment.filter((_, i) => i !== idx) }));
  };

  const addProfil = () => {
    const v = profilsInput.trim();
    if (!v) return;
    if (!form.profils_recherches.includes(v)) {
      setForm((p) => ({ ...p, profils_recherches: [...p.profils_recherches, v] }));
    }
    setProfilsInput("");
  };

  const removeProfil = (idx) => {
    setForm((p) => ({
      ...p,
      profils_recherches: p.profils_recherches.filter((_, i) => i !== idx),
    }));
  };

  const togglePaymentMethod = (method) => {
    setForm((p) => ({
      ...p,
      payment_methods: p.payment_methods.includes(method)
        ? p.payment_methods.filter((m) => m !== method)
        : [...p.payment_methods, method],
    }));
  };

  const buildPayload = () => {
    // Aligne sur le mobile : payload identique, avec alias looking_for_profiles
    const payload = {
      name: form.name.trim(),
      band_type: "Solo",
      music_styles: form.music_styles,
      city: form.city || null,
      postal_code: form.postal_code || null,
      department: form.department || null,
      region: form.region || null,
      description: form.description || null,
      repertoire_type: form.repertoire_type || null,
      show_duration: form.show_duration || null,
      equipment: form.equipment,
      is_association: !!form.is_association,
      association_name: form.is_association ? form.association_name || null : null,
      has_label: !!form.has_label,
      label_name: form.has_label ? form.label_name || null : null,
      has_sound_engineer: !!form.has_sound_engineer,
      payment_methods: form.payment_methods,
      looking_for_concerts: !!form.looking_for_concerts,
      looking_for_members: !!form.looking_for_members,
      profils_recherches: form.looking_for_members ? form.profils_recherches : [],
      // Alias compat ascendante backend
      looking_for_profiles: form.looking_for_members ? form.profils_recherches : [],
      facebook: form.facebook || null,
      instagram: form.instagram || null,
      youtube: form.youtube || null,
      website: form.website || null,
      bandcamp: form.bandcamp || null,
    };
    return payload;
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingSolo && editingSolo.id) {
        await axios.put(`${API_URL}/api/musicians/bands/${editingSolo.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Projet Solo mis à jour");
      } else {
        await axios.post(`${API_URL}/api/bands`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Projet Solo créé");
      }
      onSaved && onSaved();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Erreur lors de la sauvegarde";
      toast.error(typeof msg === "string" ? msg : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSolo?.id) return;
    if (!window.confirm("Supprimer définitivement ce projet Solo ?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/musicians/bands/${editingSolo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Projet Solo supprimé");
      onSaved && onSaved();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          {editingSolo ? "Modifier mon projet Solo" : "Créer un projet Solo"}
        </DialogTitle>
        <DialogDescription>
          Formulaire identique à celui de l&apos;app mobile. Toutes les sections peuvent être repliées.
        </DialogDescription>
      </DialogHeader>

      <Accordion type="multiple" defaultValue={["base", "styles"]} className="w-full mt-2">
          {/* 1️⃣ Informations de base */}
          <AccordionItem value="base">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><Mic className="w-4 h-4" /> 1. Informations de base</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nom du projet *</Label>
                <Input
                  data-testid="solo-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Acoustic Soul"
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/30">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Type : Projet Solo</span>
                <span className="text-xs text-muted-foreground ml-auto">(non modifiable)</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2️⃣ Styles musicaux */}
          <AccordionItem value="styles">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><Music className="w-4 h-4" /> 2. Styles musicaux ({form.music_styles.length})</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="solo-styles-grid">
                {MUSIC_STYLES_LIST.map((style) => {
                  const checked = form.music_styles.includes(style);
                  return (
                    <button
                      type="button"
                      key={style}
                      onClick={() => toggleStyle(style)}
                      data-testid={`solo-style-${style}`}
                      className={`text-left px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        checked
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-black/20 border-white/10 hover:border-primary/40"
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3️⃣ Localisation */}
          <AccordionItem value="location">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 3. Localisation</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <CityAutocomplete
                value={form.city}
                onSelect={(cityData) => {
                  setForm({
                    ...form,
                    city: cityData.city,
                    postal_code: cityData.postalCode,
                    department: cityData.department,
                    department_name: cityData.departmentName,
                    region: cityData.region,
                  });
                }}
                label="Ville"
                placeholder="Ex: Lyon"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Code postal</Label>
                  <Input disabled value={form.postal_code || ""} className="bg-black/10 border-white/10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Département</Label>
                  <Input disabled value={form.department_name ? `${form.department_name} (${form.department})` : form.department || ""} className="bg-black/10 border-white/10 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Région</Label>
                <Input disabled value={form.region || ""} className="bg-black/10 border-white/10 text-muted-foreground" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4️⃣ Détails du projet */}
          <AccordionItem value="details">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> 4. Détails du projet</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  data-testid="solo-description-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Présentation libre du projet"
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type de répertoire</Label>
                  <Select value={form.repertoire_type} onValueChange={(v) => setForm({ ...form, repertoire_type: v })}>
                    <SelectTrigger className="bg-black/20 border-white/10" data-testid="solo-repertoire-trigger"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      {REPERTOIRE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Durée du show</Label>
                  <Select value={form.show_duration} onValueChange={(v) => setForm({ ...form, show_duration: v })}>
                    <SelectTrigger className="bg-black/20 border-white/10" data-testid="solo-duration-trigger"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      {SHOW_DURATIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Matériel</Label>
                <div className="flex gap-2">
                  <Input
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEquipment(); } }}
                    placeholder="Ex: Sono, Pieds de micro, Câbles XLR"
                    className="bg-black/20 border-white/10"
                    data-testid="solo-equipment-input"
                  />
                  <Button type="button" onClick={addEquipment} variant="outline" size="sm" data-testid="solo-equipment-add">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {form.equipment.map((it, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full text-sm">
                        {it}
                        <button type="button" onClick={() => removeEquipment(i)} className="hover:text-red-500" data-testid={`solo-equipment-remove-${i}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5️⃣ Structure & paiement */}
          <AccordionItem value="structure">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> 5. Structure & paiement</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3 p-3 bg-black/10 rounded-md border border-white/5">
                <Label className="cursor-pointer">Porté par une association</Label>
                <Switch checked={form.is_association} onCheckedChange={(v) => setForm({ ...form, is_association: v })} data-testid="solo-is-association-switch" />
              </div>
              {form.is_association && (
                <Input
                  value={form.association_name}
                  onChange={(e) => setForm({ ...form, association_name: e.target.value })}
                  placeholder="Nom de l'association"
                  className="bg-black/20 border-white/10"
                  data-testid="solo-association-name-input"
                />
              )}

              <div className="flex items-center justify-between gap-3 p-3 bg-black/10 rounded-md border border-white/5">
                <Label className="cursor-pointer">A un label</Label>
                <Switch checked={form.has_label} onCheckedChange={(v) => setForm({ ...form, has_label: v })} data-testid="solo-has-label-switch" />
              </div>
              {form.has_label && (
                <Input
                  value={form.label_name}
                  onChange={(e) => setForm({ ...form, label_name: e.target.value })}
                  placeholder="Nom du label"
                  className="bg-black/20 border-white/10"
                  data-testid="solo-label-name-input"
                />
              )}

              <div className="flex items-center justify-between gap-3 p-3 bg-black/10 rounded-md border border-white/5">
                <Label className="cursor-pointer">Dispose d&apos;un ingénieur son</Label>
                <Switch checked={form.has_sound_engineer} onCheckedChange={(v) => setForm({ ...form, has_sound_engineer: v })} data-testid="solo-sound-eng-switch" />
              </div>

              <div className="space-y-2 p-3 bg-black/10 rounded-md border border-white/5">
                <Label>Modes de paiement acceptés</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.payment_methods.includes("guso")}
                      onCheckedChange={() => togglePaymentMethod("guso")}
                      data-testid="solo-payment-guso"
                    />
                    <span className="text-sm">GUSO</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.payment_methods.includes("facture")}
                      onCheckedChange={() => togglePaymentMethod("facture")}
                      data-testid="solo-payment-facture"
                    />
                    <span className="text-sm">Facture</span>
                  </label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6️⃣ Recrutement / Recherche */}
          <AccordionItem value="recrutement">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><Search className="w-4 h-4" /> 6. Recrutement / Recherche</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3 p-3 bg-black/10 rounded-md border border-white/5">
                <Label className="cursor-pointer">Cherche des dates de concert</Label>
                <Switch checked={form.looking_for_concerts} onCheckedChange={(v) => setForm({ ...form, looking_for_concerts: v })} data-testid="solo-looking-concerts-switch" />
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-black/10 rounded-md border border-white/5">
                <Label className="cursor-pointer">Cherche des musiciens (collaboration)</Label>
                <Switch checked={form.looking_for_members} onCheckedChange={(v) => setForm({ ...form, looking_for_members: v })} data-testid="solo-looking-members-switch" />
              </div>

              {form.looking_for_members && (
                <div className="space-y-2">
                  <Label>Profils recherchés</Label>
                  <div className="flex gap-2">
                    <Input
                      value={profilsInput}
                      onChange={(e) => setProfilsInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProfil(); } }}
                      placeholder="Ex: Bassiste, Choriste"
                      className="bg-black/20 border-white/10"
                      data-testid="solo-profils-input"
                    />
                    <Button type="button" onClick={addProfil} variant="outline" size="sm" data-testid="solo-profils-add">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.profils_recherches.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {form.profils_recherches.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full text-sm">
                          {p}
                          <button type="button" onClick={() => removeProfil(i)} className="hover:text-red-500" data-testid={`solo-profils-remove-${i}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 7️⃣ Réseaux sociaux & liens */}
          <AccordionItem value="links">
            <AccordionTrigger className="text-base">
              <span className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> 7. Réseaux sociaux & liens</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {[
                { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
                { key: "instagram", label: "Instagram", placeholder: "@handle ou URL" },
                { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
                { key: "website", label: "Site web", placeholder: "https://..." },
                { key: "bandcamp", label: "Bandcamp", placeholder: "https://...bandcamp.com" },
              ].map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="bg-black/20 border-white/10"
                    data-testid={`solo-link-${f.key}`}
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <Button onClick={handleSave} disabled={saving} className="rounded-full" data-testid="solo-save-btn">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sauvegarde…" : editingSolo ? "Mettre à jour" : "Créer le projet Solo"}
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-full" data-testid="solo-cancel-btn">Annuler</Button>
          {editingSolo?.id && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border-red-500/40 text-red-500 hover:bg-red-500/10 ml-auto"
              data-testid="solo-delete-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          )}
        </div>
    </>
  );
}
