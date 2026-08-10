import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import LazyImage from "../LazyImage";
import { ChevronDown, ChevronRight, Copy, Eye, MapPin, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PAGE_SIZE = 20;

/**
 * Section "🎫 Musiciens GUSO déclarés" — Build 152.4
 *
 * Affichée en haut de la tab Candidatures du VenueDashboard.
 * Utilise l'endpoint dédié `GET /api/venues/me/gusotools/musicians` qui
 * renvoie les musiciens PRO ayant renseigné leur numéro GUSO, triés par
 * proximité géographique de la venue connectée.
 */
export default function GusoMusiciansSection() {
  const { token } = useAuth() || {};
  const [musicians, setMusicians] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, has_next: false, has_prev: false });
  const [venueLocation, setVenueLocation] = useState({ has_geo: false });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [maxRadius, setMaxRadius] = useState(null); // null = illimité

  // Fetch when expanded (lazy) OR when page/search/radius change
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const params = { page, limit: PAGE_SIZE };
        if (search) params.search = search;
        if (maxRadius !== null) params.max_radius_km = maxRadius;
        const res = await axios.get(`${API}/venues/me/gusotools/musicians`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        if (cancelled) return;
        setMusicians(res.data.musicians || []);
        setPagination(res.data.pagination || {});
        setVenueLocation(res.data.venue_location || { has_geo: false });
      } catch (err) {
        if (!cancelled) console.error("GusoMusiciansSection fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, page, search, maxRadius]);

  // Reset to page 1 when search or radius changes
  useEffect(() => {
    setPage(1);
  }, [search, maxRadius]);

  const copyGuso = async (number, pseudo) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success(`Numéro GUSO de ${pseudo} copié`);
    } catch {
      toast.error("Impossible de copier — copiez manuellement");
    }
  };

  const total = pagination.total || 0;
  const showPagination = useMemo(() => (pagination.total_pages || 1) > 1, [pagination.total_pages]);

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
            {loading && expanded ? "…" : total}
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

          {/* Filtre "Rayon max" (Build 152.5) — désactivé si la venue n'a pas de coordonnées GPS */}
          {venueLocation.has_geo && (
            <div className="flex items-center gap-2 flex-wrap" data-testid="venue-guso-radius-filter">
              <span className="text-xs text-emerald-300/80 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Rayon max :
              </span>
              {[
                { value: 10, label: "10 km" },
                { value: 25, label: "25 km" },
                { value: 50, label: "50 km" },
                { value: 100, label: "100 km" },
                { value: 200, label: "200 km" },
                { value: null, label: "Illimité" },
              ].map((opt) => {
                const active = maxRadius === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setMaxRadius(opt.value)}
                    data-testid={`venue-guso-radius-${opt.value ?? "none"}`}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-emerald-500/30 border-emerald-400/60 text-emerald-100 font-semibold"
                        : "bg-black/20 border-white/10 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {!venueLocation.has_geo && (
            <p className="text-xs text-yellow-300/80 italic text-center">
              ⚠️ Votre établissement n&apos;a pas de coordonnées GPS — le tri par proximité est désactivé.
            </p>
          )}

          {loading && (
            <p className="text-sm text-emerald-300/60 italic text-center py-4">
              Chargement des musiciens GUSO…
            </p>
          )}

          {!loading && total === 0 && !search && maxRadius === null && (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-emerald-300/80">
                Aucun musicien n&apos;a encore déclaré son numéro GUSO.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Le badge <span className="text-emerald-300">🎫 GUSO ✓</span> apparaîtra ici dès qu&apos;un musicien PRO renseignera son n°.
              </p>
            </div>
          )}

          {!loading && total === 0 && !search && maxRadius !== null && (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-yellow-300/80">
                Aucun musicien GUSO dans un rayon de {maxRadius} km.
              </p>
              <button
                type="button"
                onClick={() => setMaxRadius(null)}
                className="text-xs underline text-emerald-300 hover:text-emerald-200"
              >
                Élargir la recherche à toutes les distances
              </button>
            </div>
          )}

          {!loading && total === 0 && search && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Aucun résultat pour « {search} »{maxRadius !== null ? ` dans un rayon de ${maxRadius} km` : ""}.
            </p>
          )}

          {!loading && musicians.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {musicians.map((m) => (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{m.pseudo || "Musicien"}</p>
                      {m.distance_km !== null && m.distance_km !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium whitespace-nowrap">
                          📍 {m.distance_km} km
                        </span>
                      )}
                    </div>
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

          {/* Pagination */}
          {showPagination && !loading && (
            <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination.has_prev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="venue-guso-prev-page"
                className="rounded-full border-emerald-500/30 disabled:opacity-40"
              >
                ← Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} / {pagination.total_pages} · {total} musicien{total > 1 ? "s" : ""}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
                data-testid="venue-guso-next-page"
                className="rounded-full border-emerald-500/30 disabled:opacity-40"
              >
                Suivant →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
