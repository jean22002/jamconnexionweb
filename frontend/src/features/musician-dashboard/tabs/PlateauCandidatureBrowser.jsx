import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Loader2, MapPin, MapPinOff, Music, Send, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { REGIONS_FRANCE, DEPARTEMENTS_FRANCE } from "../../../data/france-locations";
import { MUSIC_STYLES_LIST } from "../../../data/music-styles";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const FORMATIONS = ["Solo", "Duo", "Trio", "Quatuor", "Quintet", "Groupe"];
const EMPTY_FILTERS = { musicStyle: "", formation: "", gusoOnly: false, city: "" };
const ACCENTS = {
  primary: { hover: "hover:bg-primary/10 hover:border-primary", text: "text-primary" },
  secondary: { hover: "hover:bg-secondary/10 hover:border-secondary", text: "text-secondary" },
};
const isFrance = (s) => !s.venue_country || s.venue_country === "France";

const formatDate = (d) => {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
};

function SlotCard({ slot, applied, onApply }) {
  return (
    <div className="card-venue p-5 flex flex-col gap-3" data-testid={`plateau-slot-card-${slot.id}`}>
      <div>
        <h3 className="font-heading font-semibold text-lg">{slot.venue_name || "Établissement"}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {slot.venue_city}
          {slot.venue_department && ` (${slot.venue_department})`}
        </p>
        {slot.venue_region && <p className="text-xs text-muted-foreground">{slot.venue_region}</p>}
      </div>
      <p className="text-sm flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="capitalize">{formatDate(slot.date)}</span>
        {slot.time && <span className="text-muted-foreground">· {slot.time}</span>}
      </p>
      {slot.title && <p className="text-sm font-medium">{slot.title}</p>}
      <div className="flex flex-wrap gap-1">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">🎸 Ouvert aux plateaux</span>
        {slot.is_guso && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300">💼 GUSO</span>}
        {slot.formation_type && <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-300">{slot.formation_type}</span>}
        {(slot.music_styles || []).slice(0, 3).map((s) => (
          <span key={s} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{s}</span>
        ))}
      </div>
      {slot.payment && <p className="text-xs text-muted-foreground">💰 {slot.payment}</p>}
      <Button
        className="rounded-full gap-2 mt-auto"
        disabled={applied}
        onClick={() => onApply(slot)}
        data-testid={`plateau-slot-apply-${slot.id}`}
      >
        <Send className="w-4 h-4" />
        {applied ? "Plateau proposé ✓" : "Postuler avec un plateau"}
      </Button>
    </div>
  );
}

function SlotGrid({ slots, appliedIds, onApply, emptyText }) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" data-testid="plateau-slots-empty">
        <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{emptyText}</p>
        <p className="text-sm mt-2">Essayez avec d'autres filtres</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {slots.map((s) => (
        <SlotCard key={s.id} slot={s} applied={appliedIds.has(s.id)} onApply={onApply} />
      ))}
    </div>
  );
}

function ZoneGrid({ zones, onSelect, accent }) {
  const a = ACCENTS[accent];
  return (
    <div className={`grid gap-3 ${accent === "secondary" ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
      {zones.map((z) => (
        <Button
          key={z.key}
          variant="outline"
          disabled={z.count === 0}
          onClick={() => z.count > 0 && onSelect(z.key)}
          className={`h-auto py-4 px-3 flex flex-col items-center gap-2 transition-colors ${z.count > 0 ? a.hover : "opacity-50"}`}
          data-testid={`plateau-zone-${z.key}`}
        >
          {z.code ? <div className={`text-lg font-bold ${z.count > 0 ? a.text : "text-muted-foreground"}`}>{z.code}</div> : <MapPin className={`w-5 h-5 ${z.count > 0 ? a.text : "text-muted-foreground"}`} />}
          <div className="text-center">
            <div className="font-semibold text-xs leading-tight whitespace-normal">{z.label}</div>
            <div className={`text-xs mt-1 ${z.count > 0 ? `${a.text} font-semibold` : "text-muted-foreground"}`}>
              {z.count} créneau{z.count > 1 ? "x" : ""}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}

function ZoneBrowser({ slots, zones, field, accent, title, backLabel, gridProps }) {
  const [selected, setSelected] = useState(null);
  if (selected) {
    const zone = zones.find((z) => z.key === selected);
    const list = slots.filter((s) => s[field] === selected);
    return (
      <div>
        <Button onClick={() => setSelected(null)} variant="outline" className="mb-4 rounded-full gap-2" data-testid="plateau-zone-back">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Button>
        <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
          <MapPin className={`w-6 h-6 ${ACCENTS[accent].text}`} />
          {zone?.code ? `${zone.code} - ` : ""}{zone?.label} ({list.length})
        </h3>
        {list.length ? <SlotGrid slots={list} {...gridProps} /> : (
          <div className="text-center py-8 text-muted-foreground"><MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Aucun créneau ici</p></div>
        )}
      </div>
    );
  }
  return (
    <div>
      <h3 className="font-heading font-semibold text-lg mb-4">{title}</h3>
      <ZoneGrid zones={zones} onSelect={setSelected} accent={accent} />
    </div>
  );
}

function ApplyPlateauDialog({ slot, plateaus, onClose, onApplied }) {
  const [plateauId, setPlateauId] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { setPlateauId(plateaus[0]?.id || ""); }, [slot, plateaus]);

  const submit = async () => {
    setSending(true);
    try {
      await axios.post(`${API}/applications`, { planning_slot_id: slot.id, plateau_id: plateauId }, { headers: authHeader() });
      toast.success("Plateau proposé au créneau 🎸");
      onApplied(slot.id);
      onClose();
    } catch (e) {
      const d = e.response?.data?.detail;
      if (e.response?.status === 409) {
        toast.info("Ce plateau a déjà candidaté sur ce créneau");
        onApplied(slot.id);
        onClose();
      } else {
        toast.error(typeof d === "string" ? d : d?.message || "Erreur");
      }
    }
    setSending(false);
  };

  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="plateau-apply-dialog">
        <DialogHeader>
          <DialogTitle>Postuler avec un plateau</DialogTitle>
          <DialogDescription>
            {slot?.venue_name} — {slot && formatDate(slot.date)}. Le plateau postule comme une seule entité.
          </DialogDescription>
        </DialogHeader>
        {plateaus.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center" data-testid="plateau-apply-no-plateau">
            Vous n'avez aucun plateau complet dont vous êtes l'admin. Créez un plateau et attendez que tous les membres aient accepté.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Plateau à proposer</Label>
            <Select value={plateauId} onValueChange={setPlateauId}>
              <SelectTrigger data-testid="plateau-apply-plateau-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {plateaus.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    🎸 {p.title} ({(p.members || []).filter((m) => m.status === "accepted").length} artistes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={sending || !plateauId} data-testid="plateau-apply-submit">
            {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Envoyer la candidature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotFilters({ filters, onChange }) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-xl mb-4">📨 Candidature plateau</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Créneaux dont l'établissement accepte les plateaux multi-artistes. Proposez un de vos plateaux complets.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label>Style musical</Label>
          <Select value={filters.musicStyle || undefined} onValueChange={(v) => onChange({ ...filters, musicStyle: v })}>
            <SelectTrigger className="bg-black/20 border-white/10" data-testid="plateau-filter-style"><SelectValue placeholder="Tous les styles" /></SelectTrigger>
            <SelectContent className="bg-background border-white/10 max-h-[300px]">
              {MUSIC_STYLES_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Formation recherchée</Label>
          <Select value={filters.formation || undefined} onValueChange={(v) => onChange({ ...filters, formation: v })}>
            <SelectTrigger className="bg-black/20 border-white/10" data-testid="plateau-filter-formation"><SelectValue placeholder="Toutes" /></SelectTrigger>
            <SelectContent className="bg-background border-white/10">
              {FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ville</Label>
          <Input
            placeholder="Rechercher par ville..."
            value={filters.city}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="bg-black/20 border-white/10"
            data-testid="plateau-filter-city"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 p-3 bg-black/10 rounded-lg border border-white/10">
          <Switch checked={filters.gusoOnly} onCheckedChange={(c) => onChange({ ...filters, gusoOnly: c })} data-testid="plateau-filter-guso" />
          <Label className="cursor-pointer text-sm">GUSO uniquement</Label>
        </div>
        <Button variant="outline" onClick={() => onChange(EMPTY_FILTERS)} className="rounded-full gap-2" data-testid="plateau-filter-reset">
          <X className="w-4 h-4" /> Réinitialiser les filtres
        </Button>
      </div>
    </div>
  );
}

export default function PlateauCandidatureBrowser({ profile }) {
  const [slots, setSlots] = useState([]);
  const [plateaus, setPlateaus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applySlot, setApplySlot] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, p] = await Promise.all([
          axios.get(`${API}/planning`, { headers: authHeader(), params: { is_open: true, accepts_plateaus: true } }),
          axios.get(`${API}/plateaus/my`, { headers: authHeader() }),
        ]);
        setSlots((s.data || []).filter((x) => x.is_open && x.accepts_plateaus));
        setPlateaus((p.data || []).filter((x) => x.status === "active" && x.admin_user_id === profile?.user_id));
      } catch {
        setSlots([]);
      }
      setLoading(false);
    })();
  }, [profile?.user_id]);

  const filtered = useMemo(() => slots.filter((s) => {
    if (filters.musicStyle && !(s.music_styles || []).includes(filters.musicStyle)) return false;
    if (filters.formation && s.formation_type && s.formation_type !== filters.formation) return false;
    if (filters.gusoOnly && !s.is_guso) return false;
    if (filters.city && !(s.venue_city || "").toLowerCase().includes(filters.city.toLowerCase())) return false;
    return true;
  }), [slots, filters]);

  const france = filtered.filter(isFrance);
  const gridProps = { appliedIds, onApply: setApplySlot, emptyText: "Aucun créneau ouvert aux plateaux" };
  const regionZones = REGIONS_FRANCE.map((r) => ({ key: r, label: r, count: france.filter((s) => s.venue_region === r).length }));
  const deptZones = DEPARTEMENTS_FRANCE.map((d) => ({ key: d.code, code: d.code, label: d.nom, count: france.filter((s) => s.venue_department === d.code).length }));

  return (
    <div className="space-y-6" data-testid="plateau-candidature-browser">
      <SlotFilters filters={filters} onChange={setFilters} />
      {loading ? (
        <div className="text-center py-12">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary animate-pulse" />
          <p className="text-muted-foreground">Chargement des créneaux...</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1">
            <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4" data-testid="plateau-loc-all">Tous ({filtered.length})</TabsTrigger>
            <TabsTrigger value="france" className="rounded-full whitespace-nowrap flex-shrink-0 px-4" data-testid="plateau-loc-france">France ({france.length})</TabsTrigger>
            <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4" data-testid="plateau-loc-region">Par Région</TabsTrigger>
            <TabsTrigger value="department" className="rounded-full whitespace-nowrap flex-shrink-0 px-4" data-testid="plateau-loc-department">Par Département</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6"><SlotGrid slots={filtered} {...gridProps} /></TabsContent>
          <TabsContent value="france" className="mt-6"><SlotGrid slots={france} {...gridProps} /></TabsContent>
          <TabsContent value="region" className="mt-6">
            <ZoneBrowser slots={france} zones={regionZones} field="venue_region" accent="primary" title="Toutes les régions de France" backLabel="Retour aux régions" gridProps={gridProps} />
          </TabsContent>
          <TabsContent value="department" className="mt-6">
            <ZoneBrowser slots={france} zones={deptZones} field="venue_department" accent="secondary" title="Tous les départements de France" backLabel="Retour aux départements" gridProps={gridProps} />
          </TabsContent>
        </Tabs>
      )}
      <ApplyPlateauDialog
        slot={applySlot}
        plateaus={plateaus}
        onClose={() => setApplySlot(null)}
        onApplied={(id) => setAppliedIds((prev) => new Set(prev).add(id))}
      />
    </div>
  );
}
