// Build 217 — Onglet "Plateaux" du dashboard musicien.
// Deux modes via un select :
//   - "Créer un plateau"  : form avec sélection de projets (groupes/solo/duo) et admin auto-ajouté
//   - "Intégrer un plateau": liste des plateaux avec places vacantes + filtres + CTA proposer son projet
//
// Les notifications d'invitation ouvrent une modale accepter/refuser via NotificationCenter (non modifié ici).

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Card } from "../../../components/ui/card";
import { Users, Plus, Trash2, UserPlus, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function authHeader() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function PlateauCard({ plateau, onOpenDetail, onOpenJoin, canJoin = false }) {
  const vacant = plateau.vacant_slots ?? 0;
  const accepted = (plateau.members || []).filter((m) => m.status === "accepted");
  return (
    <Card
      data-testid={`plateau-card-${plateau.id}`}
      className="p-5 cursor-pointer hover:border-primary/50 transition-all"
      onClick={() => onOpenDetail && onOpenDetail(plateau)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg truncate">{plateau.title}</h3>
          <p className="text-xs text-muted-foreground">Admin : {plateau.admin_name}</p>
        </div>
        {vacant > 0 && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 shrink-0">
            {vacant} place{vacant > 1 ? "s" : ""} libre{vacant > 1 ? "s" : ""}
          </Badge>
        )}
        {plateau.status === "active" && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shrink-0">
            ✓ Complet
          </Badge>
        )}
      </div>

      {plateau.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plateau.description}</p>
      )}

      <div className="space-y-1.5 mb-3">
        {accepted.map((m) => (
          <div key={`${m.musician_id}-${m.band_id || "solo"}`} className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
              🎸
            </div>
            <span className="font-medium truncate">{m.project_name}</span>
            {m.music_styles?.length > 0 && (
              <span className="text-xs text-muted-foreground truncate">
                · {m.music_styles.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        ))}
      </div>

      {canJoin && vacant > 0 && (
        <Button
          size="sm"
          className="w-full"
          data-testid={`plateau-join-btn-${plateau.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenJoin(plateau);
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" /> Proposer mon projet
        </Button>
      )}
    </Card>
  );
}

// Build 227 — Admin : demandes d'intégration en attente (aligné mobile §2.10/2.11)
function JoinRequestsSection({ plateauId, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const r = await axios.get(`${API}/plateaus/${plateauId}/join-requests`, { headers: authHeader() });
      setRequests(Array.isArray(r.data) ? r.data : []);
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => { load(); }, [plateauId]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (req, accept) => {
    setBusyId(req.id);
    try {
      await axios.post(
        `${API}/plateaus/${plateauId}/respond-join-request`,
        { accept },
        { headers: authHeader(), params: { join_request_id: req.id } }
      );
      toast.success(accept ? `${req.project_name} a rejoint le plateau 🎸` : "Demande refusée");
      await load();
      onChanged && onChanged();
    } catch (e) {
      const d = e.response?.data?.detail;
      toast.error(typeof d === "string" ? d : d?.message || "Erreur");
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-2 mt-4" data-testid="plateau-join-requests-section">
      <h4 className="font-semibold text-sm">Demandes d'intégration ({requests.length})</h4>
      {requests.length === 0 ? (
        <p className="text-xs text-muted-foreground" data-testid="plateau-join-requests-empty">Aucune demande en attente</p>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between gap-3 p-3 border border-amber-500/30 rounded-lg" data-testid={`plateau-join-request-${req.id}`}>
            <div className="min-w-0">
              <p className="font-medium truncate">{req.project_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {req.project_kind === "band" ? "Groupe" : "Solo"}
                {req.music_styles?.length > 0 ? ` · ${req.music_styles.slice(0, 2).join(", ")}` : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" disabled={busyId === req.id} onClick={() => respond(req, true)} data-testid={`plateau-join-accept-${req.id}`}>
                Accepter
              </Button>
              <Button size="sm" variant="outline" disabled={busyId === req.id} onClick={() => respond(req, false)} data-testid={`plateau-join-reject-${req.id}`}>
                Refuser
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PlateauDetailModal({ plateau: initialPlateau, open, onClose, currentUserId, onDeleted }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [applying, setApplying] = useState(false);
  const [fresh, setFresh] = useState(null);
  const plateau = fresh && fresh.id === initialPlateau?.id ? fresh : initialPlateau;
  if (!plateau) return null;

  const refreshPlateau = async () => {
    try {
      const r = await axios.get(`${API}/plateaus/${plateau.id}`, { headers: authHeader() });
      setFresh(r.data);
    } catch {
      /* noop */
    }
    onDeleted && onDeleted();
  };
  const isAdmin = plateau.admin_user_id === currentUserId;
  const canApply = isAdmin && plateau.status === "active";

  const loadOpenSlots = async () => {
    try {
      const r = await axios.get(`${API}/planning`, { headers: authHeader() });
      const list = (Array.isArray(r.data) ? r.data : []).filter((s) => s.is_open);
      setSlots(list);
      setSelectedSlotId(list[0]?.id || "");
    } catch {
      setSlots([]);
    }
  };

  const openApply = async () => {
    await loadOpenSlots();
    setShowApply(true);
  };

  const submitApply = async () => {
    if (!selectedSlotId) return;
    setApplying(true);
    try {
      await axios.post(
        `${API}/applications`,
        { planning_slot_id: selectedSlotId, plateau_id: plateau.id },
        { headers: authHeader() }
      );
      toast.success("Candidature envoyée au nom du plateau 🎸");
      setShowApply(false);
    } catch (e) {
      const d = e.response?.data?.detail;
      toast.error(typeof d === "string" ? d : d?.message || "Erreur");
    }
    setApplying(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement ce plateau ? Les membres seront notifiés.")) return;
    try {
      await axios.delete(`${API}/plateaus/${plateau.id}`, { headers: authHeader() });
      toast.success("Plateau supprimé");
      onDeleted && onDeleted();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl" data-testid="plateau-detail-modal">
        <DialogHeader>
          <DialogTitle>🎸 {plateau.title}</DialogTitle>
          <DialogDescription>
            Admin : <b>{plateau.admin_name}</b> · {plateau.members?.filter((m) => m.status === "accepted").length}/{plateau.max_members} membres
          </DialogDescription>
        </DialogHeader>

        {plateau.description && (
          <p className="text-sm text-muted-foreground">{plateau.description}</p>
        )}

        <div className="space-y-2 mt-2">
          <h4 className="font-semibold text-sm">Membres du plateau</h4>
          {(plateau.members || []).map((m) => (
            <div
              key={`${m.musician_id}-${m.band_id || "solo"}`}
              className="flex items-center justify-between gap-3 p-3 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{m.project_name}</span>
                  <Badge
                    variant="outline"
                    className={
                      m.status === "accepted"
                        ? "border-emerald-500/50 text-emerald-400"
                        : m.status === "rejected"
                        ? "border-red-500/50 text-red-400"
                        : "border-amber-500/50 text-amber-400"
                    }
                  >
                    {m.status === "accepted" ? "✓ Accepté" : m.status === "rejected" ? "✗ Refusé" : "⏳ En attente"}
                  </Badge>
                </div>
                {m.music_styles?.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {m.music_styles.join(", ")}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                data-testid={`plateau-view-profile-${m.musician_id}`}
                onClick={() => navigate(`/musician/${m.musician_id}`)}
              >
                <Eye className="w-4 h-4 mr-1" /> Voir profil
              </Button>
            </div>
          ))}
        </div>

        {isAdmin && plateau.status !== "active" && (
          <JoinRequestsSection plateauId={plateau.id} onChanged={refreshPlateau} />
        )}

        <DialogFooter className="mt-4 gap-2">
          {canApply && (
            <Button
              onClick={openApply}
              data-testid="plateau-apply-slot-btn"
              className="bg-primary"
            >
              📅 Candidater à un créneau
            </Button>
          )}
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete} data-testid="plateau-delete-btn">
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer le plateau
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal : choisir le créneau pour candidater en tant que plateau */}
      <Dialog open={showApply} onOpenChange={(o) => !o && setShowApply(false)}>
        <DialogContent data-testid="plateau-apply-modal">
          <DialogHeader>
            <DialogTitle>Candidater avec le plateau</DialogTitle>
            <DialogDescription>
              Le plateau "{plateau.title}" postulera en tant qu'entité unique.
            </DialogDescription>
          </DialogHeader>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun créneau ouvert actuellement.
            </p>
          ) : (
            <div>
              <Label>Choisis un créneau ouvert</Label>
              <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                <SelectTrigger data-testid="plateau-apply-slot-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.venue_name || "Établissement"}{s.venue_city ? ` (${s.venue_city})` : ""} — {s.date}{s.title ? ` · ${s.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>Annuler</Button>
            <Button
              onClick={submitApply}
              disabled={applying || !selectedSlotId}
              data-testid="plateau-apply-submit"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Envoyer la candidature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function CreatePlateauForm({ profile, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [search, setSearch] = useState("");
  const [musicians, setMusicians] = useState([]);
  const [selected, setSelected] = useState([]); // [{ musician_id, band_id?, project_kind, label }]
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminProject, setAdminProject] = useState("solo"); // Build 229 — "solo" ou band_id

  const myBands = useMemo(
    () => (profile?.bands || []).filter((b) => b.id || b.band_id).map((b) => ({ id: b.id || b.band_id, name: b.name || "Groupe" })),
    [profile]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Backend plafonne limit à 100 → pagination (max 5 pages)
        const list = [];
        for (let page = 1; page <= 5; page++) {
          const r = await axios.get(`${API}/musicians`, { headers: authHeader(), params: { limit: 100, page } });
          const chunk = Array.isArray(r.data) ? r.data : [];
          list.push(...chunk);
          if (chunk.length < 100) break;
        }
        // Exclut l'utilisateur courant (il est déjà admin)
        setMusicians(list.filter((m) => m.user_id !== profile?.user_id));
      } catch {
        setMusicians([]);
      }
      setLoading(false);
    })();
  }, [profile?.user_id]);

  const availableProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const projects = [];
    musicians.forEach((m) => {
      const pseudo = m.pseudo || m.stage_name || "Musicien";
      // Projet solo
      projects.push({
        musician_id: m.id,
        project_kind: "solo",
        band_id: null,
        label: pseudo,
        sub: `${(m.music_styles || []).slice(0, 2).join(", ") || "Solo"} · ${m.city || ""}`,
      });
      // Groupes/projets inline
      (m.bands || []).forEach((b) => {
        const bid = b.id || b.band_id;
        if (!bid) return;
        projects.push({
          musician_id: m.id,
          project_kind: "band",
          band_id: bid,
          label: b.name || "Groupe",
          sub: `${(b.music_styles || []).slice(0, 2).join(", ") || "Groupe"} · ${m.city || ""}`,
        });
      });
    });
    if (!q) return projects.slice(0, 50);
    return projects
      .filter((p) => p.label.toLowerCase().includes(q) || (p.sub || "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [musicians, search]);

  const toggleSelect = (p) => {
    const key = `${p.musician_id}-${p.band_id || "solo"}`;
    const already = selected.find((s) => `${s.musician_id}-${s.band_id || "solo"}` === key);
    if (already) {
      setSelected((prev) => prev.filter((s) => `${s.musician_id}-${s.band_id || "solo"}` !== key));
    } else {
      if (selected.length + 1 >= maxMembers) {
        toast.error(`Max ${maxMembers - 1} invités (vous comptez comme 1)`);
        return;
      }
      setSelected((prev) => [...prev, p]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Le titre est requis");
    if (selected.length < 1) return toast.error("Invite au moins 1 projet (en plus de toi)");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        max_members: maxMembers,
        admin_project: adminProject === "solo"
          ? { project_kind: "solo", band_id: null }
          : { project_kind: "band", band_id: adminProject },
        invited_members: selected.map((s) => ({
          musician_id: s.musician_id,
          project_kind: s.project_kind,
          band_id: s.band_id,
        })),
      };
      await axios.post(`${API}/plateaus`, payload, { headers: authHeader() });
      toast.success("Plateau créé ! Invitations envoyées 🎸");
      setTitle(""); setDescription(""); setSelected([]); setSearch(""); setAdminProject("solo");
      onCreated && onCreated();
    } catch (e) {
      const d = e.response?.data?.detail;
      toast.error(typeof d === "string" ? d : d?.message || "Erreur à la création");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5" data-testid="plateau-create-form">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Titre du plateau *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Soirée Rock Trio"
            data-testid="plateau-title-input"
          />
        </div>
        <div>
          <Label>Nombre max de projets (2 à 6)</Label>
          <Select value={String(maxMembers)} onValueChange={(v) => setMaxMembers(Number(v))}>
            <SelectTrigger data-testid="plateau-max-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2,3,4,5,6].map((n) => <SelectItem key={n} value={String(n)}>{n} projets</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Je participe avec</Label>
        <Select value={adminProject} onValueChange={setAdminProject}>
          <SelectTrigger data-testid="plateau-admin-project-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="solo" data-testid="plateau-admin-project-solo">{profile?.pseudo || "Moi"} (solo)</SelectItem>
            {myBands.map((b) => (
              <SelectItem key={b.id} value={b.id} data-testid={`plateau-admin-project-${b.id}`}>🎸 {b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description du plateau</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décris l'ambiance, la soirée, le concept…"
          rows={2}
          data-testid="plateau-desc-input"
        />
      </div>

      <div>
        <Label>Sélection des projets ({selected.length} / {maxMembers - 1} max)</Label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un musicien, groupe, ville, style…"
          className="mb-2"
          data-testid="plateau-search-input"
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-primary/5 rounded-lg">
            {selected.map((s) => (
              <Badge
                key={`sel-${s.musician_id}-${s.band_id || "solo"}`}
                className="bg-primary/20 text-primary border-primary/30 cursor-pointer"
                onClick={() => toggleSelect(s)}
              >
                {s.label} ✕
              </Badge>
            ))}
          </div>
        )}
        <div className="max-h-72 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Chargement…</div>
          ) : availableProjects.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucun projet trouvé</div>
          ) : (
            availableProjects.map((p) => {
              const key = `${p.musician_id}-${p.band_id || "solo"}`;
              const isSel = !!selected.find((s) => `${s.musician_id}-${s.band_id || "solo"}` === key);
              return (
                <div
                  key={key}
                  onClick={() => toggleSelect(p)}
                  data-testid={`plateau-project-${key}`}
                  className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-muted/30 ${
                    isSel ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {p.label}
                        <span className="text-xs text-muted-foreground ml-1">
                          · {p.project_kind === "solo" ? "Solo" : "Groupe"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{p.sub}</p>
                    </div>
                    <input type="checkbox" checked={isSel} readOnly className="pointer-events-none" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={saving}
        data-testid="plateau-submit-btn"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        Créer le plateau et envoyer les invitations
      </Button>
    </div>
  );
}

function JoinPlateauBrowser({ profile }) {
  const [plateaus, setPlateaus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ country: "", region: "", department: "", music_style: "" });
  const [detail, setDetail] = useState(null);
  const [joinTarget, setJoinTarget] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  const fetchOpen = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const r = await axios.get(`${API}/plateaus/open`, { headers: authHeader(), params });
      setPlateaus(Array.isArray(r.data) ? r.data : []);
    } catch {
      setPlateaus([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOpen(); }, []); // eslint-disable-line

  useEffect(() => {
    // Charge mes projets (solo + bands) depuis le profil
    if (!profile) return;
    const projects = [];
    projects.push({
      value: `solo-${profile.id}`,
      label: `${profile.pseudo || "Moi"} (solo)`,
      musician_id: profile.id,
      project_kind: "solo",
      band_id: null,
    });
    (profile.bands || []).forEach((b) => {
      const bid = b.id || b.band_id;
      if (!bid) return;
      projects.push({
        value: `band-${bid}`,
        label: b.name,
        musician_id: profile.id,
        project_kind: "band",
        band_id: bid,
      });
    });
    setMyProjects(projects);
    setSelectedProject(projects[0]?.value || "");
  }, [profile]);

  const submitJoin = async () => {
    const proj = myProjects.find((p) => p.value === selectedProject);
    if (!proj || !joinTarget) return;
    try {
      await axios.post(
        `${API}/plateaus/${joinTarget.id}/request-join`,
        {
          musician_id: proj.musician_id,
          project_kind: proj.project_kind,
          band_id: proj.band_id,
        },
        { headers: authHeader() }
      );
      toast.success("Demande envoyée à l'admin du plateau 📨");
      setJoinTarget(null);
      fetchOpen();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur lors de la demande");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Input
          placeholder="Pays"
          value={filters.country}
          onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
          data-testid="plateau-filter-country"
        />
        <Input
          placeholder="Région"
          value={filters.region}
          onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
          data-testid="plateau-filter-region"
        />
        <Input
          placeholder="Département"
          value={filters.department}
          onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
          data-testid="plateau-filter-department"
        />
        <Input
          placeholder="Style musical"
          value={filters.music_style}
          onChange={(e) => setFilters((f) => ({ ...f, music_style: e.target.value }))}
          data-testid="plateau-filter-style"
        />
      </div>
      <Button variant="outline" size="sm" onClick={fetchOpen} data-testid="plateau-apply-filters">
        Appliquer les filtres
      </Button>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Chargement…
        </div>
      ) : plateaus.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Aucun plateau avec places vacantes pour l'instant.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plateaus.map((p) => (
            <PlateauCard
              key={p.id}
              plateau={p}
              onOpenDetail={setDetail}
              onOpenJoin={setJoinTarget}
              canJoin
            />
          ))}
        </div>
      )}

      <PlateauDetailModal
        plateau={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        currentUserId={profile?.user_id}
      />

      {/* Modal de proposition de projet */}
      <Dialog open={!!joinTarget} onOpenChange={(o) => !o && setJoinTarget(null)}>
        <DialogContent data-testid="plateau-join-modal">
          <DialogHeader>
            <DialogTitle>Proposer mon projet</DialogTitle>
            <DialogDescription>
              Plateau "{joinTarget?.title}" · Admin : {joinTarget?.admin_name}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Quel projet veux-tu proposer ?</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger data-testid="plateau-join-project-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {myProjects.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinTarget(null)}>Annuler</Button>
            <Button onClick={submitJoin} data-testid="plateau-join-submit">Envoyer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyPlateausList({ profile, refreshKey, onDeleted }) {
  const [plateaus, setPlateaus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/plateaus/my`, { headers: authHeader() });
      const list = Array.isArray(r.data) ? r.data : [];
      setPlateaus(list);
      // Détecte invitation pending pour l'utilisateur courant
      const invite = list.find((p) =>
        p.members?.some((m) => m.user_id === profile?.user_id && m.status === "pending")
      );
      if (invite) setPendingInvite(invite);
    } catch {
      setPlateaus([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMine(); }, [refreshKey, profile?.user_id]); // eslint-disable-line

  const respondInvite = async (accept) => {
    if (!pendingInvite) return;
    try {
      const myMember = pendingInvite.members.find((m) => m.user_id === profile?.user_id && m.status === "pending");
      await axios.post(
        `${API}/plateaus/${pendingInvite.id}/respond`,
        { accept, musician_id: myMember?.musician_id },
        { headers: authHeader() }
      );
      toast.success(accept ? "Invitation acceptée 🎸" : "Invitation refusée");
      setPendingInvite(null);
      fetchMine();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur");
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Chargement…</div>;
  }

  return (
    <div className="space-y-4">
      {plateaus.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Aucun plateau pour l'instant.</p>
          <p className="text-xs">Crée-en un ou intègre un plateau existant depuis le menu déroulant ci-dessus.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plateaus.map((p) => (
            <PlateauCard key={p.id} plateau={p} onOpenDetail={setDetail} />
          ))}
        </div>
      )}

      <PlateauDetailModal
        plateau={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        currentUserId={profile?.user_id}
        onDeleted={() => { fetchMine(); onDeleted && onDeleted(); }}
      />

      {/* Popup invitation accept/refuse */}
      <Dialog open={!!pendingInvite} onOpenChange={(o) => !o && setPendingInvite(null)}>
        <DialogContent data-testid="plateau-invite-modal">
          <DialogHeader>
            <DialogTitle>🎸 Invitation à un plateau</DialogTitle>
            <DialogDescription>
              <b>{pendingInvite?.admin_name}</b> t'invite à rejoindre le plateau "{pendingInvite?.title}".
            </DialogDescription>
          </DialogHeader>
          {pendingInvite?.description && (
            <p className="text-sm text-muted-foreground">{pendingInvite.description}</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => respondInvite(false)} data-testid="plateau-invite-refuse">Refuser</Button>
            <Button onClick={() => respondInvite(true)} data-testid="plateau-invite-accept">Accepter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PlateauxTab({ profile }) {
  const [mode, setMode] = useState("list"); // list | create | join
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-2xl">🎸 Plateaux</h2>
          <p className="text-sm text-muted-foreground">
            Organise des soirées multi-artistes ou rejoins un plateau existant.
          </p>
        </div>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-full sm:w-64" data-testid="plateau-mode-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">📋 Mes plateaux</SelectItem>
            <SelectItem value="create">➕ Créer un plateau</SelectItem>
            <SelectItem value="join">🔗 Intégrer un plateau</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "list" && (
        <MyPlateausList
          profile={profile}
          refreshKey={refreshKey}
          onDeleted={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {mode === "create" && (
        <CreatePlateauForm
          profile={profile}
          onCreated={() => { setMode("list"); setRefreshKey((k) => k + 1); }}
        />
      )}
      {mode === "join" && <JoinPlateauBrowser profile={profile} />}
    </div>
  );
}
