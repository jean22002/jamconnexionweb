import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import LazyImage from "../LazyImage";
import { ChevronDown, ChevronRight, Copy, Eye, MapPin, Search, User, X } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Section "🎫 Musiciens GUSO déclarés" — Build 152.3
 *
 * Affichée en haut de la tab Candidatures du VenueDashboard.
 * Liste compacte des musiciens PRO ayant renseigné leur numéro GUSO,
 * pour aider le venue à préparer une déclaration GUSO en 1 clic.
 *
 * Features :
 *   - Repliable/dépliable (default: replié pour ne pas polluer la vue)
 *   - Search par pseudo/ville/instrument
 *   - Copier le n° GUSO dans le presse-papier (raccourci gain de temps)
 *   - Voir la fiche complète du musicien
 */
export default function GusoMusiciansSection() {
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API}/musicians`);
        if (cancelled) return;
        // Filtre côté client : uniquement ceux avec guso_number
        const gusoList = (res.data || []).filter((m) => !!m.guso_number);
        setMusicians(gusoList);
      } catch (err) {
        if (!cancelled) console.error("GusoMusiciansSection fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return musicians;
    const q = search.toLowerCase();
    return musicians.filter((m) => {
      if (m.pseudo?.toLowerCase().includes(q)) return true;
      if (m.city?.toLowerCase().includes(q)) return true;
      if (m.instruments?.some((i) => i.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [musicians, search]);

  const copyGuso = async (number, pseudo) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success(`Numéro GUSO de ${pseudo} copié`);
    } catch {
      toast.error("Impossible de copier — copiez manuellement");
    }
  };

  const count = musicians.length;

  return (
    <div
      data-testid="venue-guso-musicians-section"
      className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent overflow-hidden"
    >
      {/* Header cliquable pour déplier/replier */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-testid="venue-guso-toggle"
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-emerald-500/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl leading-none">🎫</span>
          <div>
            <h3 className="font-heading font-semibold text-emerald-200 text-lg">
              Musiciens GUSO déclarés
            </h3>
            <p className="text-xs text-emerald-300/70 mt-0.5">
              Musiciens PRO prêts à être déclarés GUSO — préparez vos déclarations en 1 clic
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-100 text-sm font-bold min-w-[2.5rem] text-center">
            {loading ? "…" : count}
          </span>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-emerald-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-emerald-300" />
          )}
        </div>
      </button>

      {/* Corps déplié */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-emerald-500/20 pt-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par pseudo, ville, instrument…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="venue-guso-search"
              className="pl-10 bg-black/30 border-emerald-500/20 rounded-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading && (
            <p className="text-sm text-emerald-300/60 italic text-center py-4">
              Chargement des musiciens GUSO…
            </p>
          )}

          {!loading && count === 0 && (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-emerald-300/80">
                Aucun musicien n&apos;a encore déclaré son numéro GUSO.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Le badge <span className="text-emerald-300">🎫 GUSO ✓</span> apparaîtra ici dès qu&apos;un musicien PRO renseignera son n°.
              </p>
            </div>
          )}

          {!loading && count > 0 && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Aucun résultat pour « {search} ».
            </p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  data-testid="venue-guso-musician-card"
                  className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5 hover:border-emerald-500/40 transition-colors"
                >
                  {m.profile_image ? (
                    <LazyImage
                      src={m.profile_image}
                      alt={m.pseudo || "Musicien"}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-emerald-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{m.pseudo || "Musicien"}</p>
                    {m.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{m.city}</span>
                        {m.department && <span>· {m.department}</span>}
                      </p>
                    )}
                    <p
                      className="text-xs font-mono text-emerald-300 mt-0.5 truncate"
                      title={m.guso_number}
                    >
                      🎫 {m.guso_number}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyGuso(m.guso_number, m.pseudo || "musicien")}
                      title="Copier le n° GUSO"
                      data-testid="venue-guso-copy-btn"
                      className="w-8 h-8 rounded-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Link to={`/musician/${m.id}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Voir la fiche"
                        className="w-8 h-8 rounded-full border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
