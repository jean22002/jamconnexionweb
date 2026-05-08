import { useState, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Music, Users, MapPin, ArrowLeft, MapPinOff, X, Send, Eye, Facebook, Instagram, Youtube, Globe, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { REGIONS_FRANCE, DEPARTEMENTS_FRANCE } from "../../../data/france-locations";
import { MUSIC_STYLES_LIST } from "../../../data/music-styles";
import { BAND_MEMBER_PROFILES } from "../../../data/musician-constants";
import { enrichWithLocation } from "../../../data/city-to-location";

// Composant pour afficher une carte de groupe
function BandCard({ band, onContact, onViewProfile }) {
  return (
    <div className="glassmorphism rounded-xl p-4 hover:border-primary/50 transition-all">
      <div className="flex items-start gap-3 mb-3">
        {band.photo && (
          <img 
            src={band.photo} 
            alt={band.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{band.name}</h3>
          <p className="text-sm text-muted-foreground">{band.type || 'Groupe'}</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        {band.music_styles && band.music_styles.length > 0 && (
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            <div className="flex flex-wrap gap-1">
              {band.music_styles.slice(0, 3).map((style, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}
        {band.members_count && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{band.members_count} membre{band.members_count > 1 ? 's' : ''}</span>
          </div>
        )}
        {band.city && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              {band.city}
              {band.department && ` (${band.department})`}
            </span>
          </div>
        )}
      </div>

      {band.looking_for_members && (
        <div className="mt-3 space-y-2">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1 w-fit">
            <Users className="w-3 h-3" />
            Cherche des membres
          </span>
          {Array.isArray(band.looking_for_profiles) && band.looking_for_profiles.length > 0 && (
            <div className="flex flex-wrap gap-1" data-testid={`band-looking-profiles-${band.id}`}>
              {band.looking_for_profiles.slice(0, 4).map((profile, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[10px] sm:text-xs"
                >
                  🎯 {profile}
                </span>
              ))}
              {band.looking_for_profiles.length > 4 && (
                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400/70 rounded-full text-[10px] sm:text-xs">
                  +{band.looking_for_profiles.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button
          onClick={() => onViewProfile(band)}
          variant="outline"
          className="rounded-full border-primary/30 hover:bg-primary/10"
          data-testid={`view-band-profile-${band.id}`}
        >
          <Eye className="w-4 h-4 mr-2" />
          Voir le profil
        </Button>
        <Button
          onClick={() => onContact(band)}
          className="rounded-full bg-primary hover:bg-primary/90"
          data-testid={`contact-band-${band.id}`}
        >
          <Send className="w-4 h-4 mr-2" />
          Contacter
        </Button>
      </div>
    </div>
  );
}


// Modale détaillée du profil d'un groupe
function BandProfileModal({ band, open, onOpenChange, onContact }) {
  if (!band) return null;
  const socials = [
    { key: "facebook", icon: Facebook, color: "text-blue-500" },
    { key: "instagram", icon: Instagram, color: "text-pink-500" },
    { key: "youtube", icon: Youtube, color: "text-red-500" },
    { key: "website", icon: Globe, color: "text-green-500" },
    { key: "bandcamp", icon: Music, color: "text-cyan-500" },
  ].filter(s => band[s.key]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="band-profile-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {band.photo ? (
              <img src={band.photo} alt={band.name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Music className="w-7 h-7 text-primary" />
              </div>
            )}
            <div className="text-left">
              <p className="text-xl font-heading">{band.name}</p>
              <p className="text-sm text-muted-foreground font-normal">
                {band.band_type || band.type || "Groupe"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {band.description && (
            <p className="text-sm text-muted-foreground italic">{band.description}</p>
          )}

          {/* Infos principales */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {band.members_count && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{band.members_count} membre{band.members_count > 1 ? "s" : ""}</span>
              </div>
            )}
            {band.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{band.city}{band.department && ` (${band.department})`}</span>
              </div>
            )}
            {band.region && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{band.region}</span>
              </div>
            )}
            {band.show_duration && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{band.show_duration}</span>
              </div>
            )}
          </div>

          {/* Styles musicaux */}
          {band.music_styles && band.music_styles.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Styles musicaux</p>
              <div className="flex flex-wrap gap-2">
                {band.music_styles.map((style, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Type de répertoire */}
          {band.repertoire_type && (
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Répertoire</p>
              <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs rounded-full">
                {band.repertoire_type}
              </span>
            </div>
          )}

          {/* Statuts / recherches */}
          <div className="flex flex-wrap gap-2">
            {band.looking_for_concerts && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                🎤 Cherche des concerts
              </span>
            )}
            {band.looking_for_members && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                👥 Cherche des membres
              </span>
            )}
          </div>

          {/* Profils recherchés (section dédiée si des profils sont définis) */}
          {band.looking_for_members && Array.isArray(band.looking_for_profiles) && band.looking_for_profiles.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <p className="text-xs uppercase text-orange-400 tracking-wide mb-3 font-semibold">
                🎯 Profils recherchés
              </p>
              <div className="flex flex-wrap gap-2">
                {band.looking_for_profiles.map((profile, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-full text-sm font-medium"
                  >
                    {profile}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {band.has_sound_engineer && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                🎚️ Ingénieur son
              </span>
            )}
            {band.is_association && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                Association{band.association_name ? ` — ${band.association_name}` : ""}
              </span>
            )}
            {band.has_label && (
              <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">
                Label{band.label_name ? ` — ${band.label_name}` : ""}
              </span>
            )}
          </div>

          {/* Réseaux sociaux */}
          {socials.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Réseaux</p>
              <div className="flex flex-wrap gap-2">
                {socials.map(({ key, icon: Icon, color }) => (
                  <a
                    key={key}
                    href={String(band[key]).startsWith("http") ? band[key] : `https://${band[key]}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2 rounded-full bg-white/5 hover:bg-white/10 transition ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Equipement / paiement */}
          {band.equipment && band.equipment.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Équipement</p>
              <p className="text-sm text-muted-foreground">{band.equipment.join(" • ")}</p>
            </div>
          )}
          {band.payment_methods && band.payment_methods.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Modes de paiement acceptés</p>
              <p className="text-sm text-muted-foreground capitalize">{band.payment_methods.join(" • ")}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
            <Button
              className="flex-1 rounded-full bg-primary hover:bg-primary/90"
              onClick={() => {
                onOpenChange(false);
                onContact(band);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Contacter le groupe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BandsTab({ 
  bands,
  bandsLoading,
  bandTypes,
  repertoireTypes,
  onViewDetails,
  bandFilters,
  onFiltersChange
}) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [profileBand, setProfileBand] = useState(null);

  // Wraps onViewDetails (= "Contacter") so we can also use it from the modal
  const handleContact = (band) => onViewDetails?.(band);
  const handleViewProfile = (band) => setProfileBand(band);

  // Enrichit les groupes avec leur région/département via leur ville
  // quand ces champs sont manquants. Évite des groupes "fantômes"
  // qui n'apparaissent ni dans Régions ni dans Départements.
  const enrichedBands = useMemo(
    () => (Array.isArray(bands) ? bands.map(enrichWithLocation) : []),
    [bands]
  );

  // Fonction pour filtrer les groupes selon les critères
  const getFilteredBands = (bandsToFilter) => {
    return bandsToFilter.filter(band => {
      // Filtre : Cherche des membres
      if (bandFilters.lookingForMembers && !band.looking_for_members) {
        return false;
      }

      // Filtre : Profil recherché (uniquement si "Cherche des membres" activé)
      if (bandFilters.lookingForMembers && bandFilters.lookingForProfile) {
        const profiles = Array.isArray(band.looking_for_profiles) ? band.looking_for_profiles : [];
        if (!profiles.includes(bandFilters.lookingForProfile)) {
          return false;
        }
      }

      // Filtre : Style musical
      if (bandFilters.musicStyle && (!band.music_styles || !band.music_styles.includes(bandFilters.musicStyle))) {
        return false;
      }

      // Filtre : Type de groupe (compat band_type / type, comparaison "starts with"
      // pour matcher "Duo" avec "Duo electro acoustique", "Trio" avec "Trio Jazz", etc.)
      if (bandFilters.bandType) {
        const filter = String(bandFilters.bandType).toLowerCase().trim();
        const bt1 = String(band.band_type || "").toLowerCase().trim();
        const bt2 = String(band.type || "").toLowerCase().trim();
        const matches = (bt) =>
          bt === filter ||
          bt.startsWith(filter + " ") ||
          bt.startsWith(filter + "-") ||
          bt.includes(" " + filter);
        if (!matches(bt1) && !matches(bt2)) {
          return false;
        }
      }

      // Filtre : Type de répertoire (comparaison incluse insensible à la casse)
      if (bandFilters.repertoireType) {
        const rt = String(band.repertoire_type || "").toLowerCase();
        if (!rt.includes(String(bandFilters.repertoireType).toLowerCase())) {
          return false;
        }
      }

      // Filtre : Ville
      if (bandFilters.city && !band.city?.toLowerCase().includes(bandFilters.city.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête et filtres communs */}
      <div className="glassmorphism rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-xl mb-4">🎸 Répertoire des Groupes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Découvrez les groupes de musique de votre région et contactez-les directement
        </p>

        {/* Filtres classiques (toujours visibles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Style musical */}
          <div className="space-y-2">
            <Label>Style musical</Label>
            <Select 
              value={bandFilters.musicStyle || undefined} 
              onValueChange={(value) => onFiltersChange({ ...bandFilters, musicStyle: value })}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Tous les styles" />
              </SelectTrigger>
              <SelectContent className="bg-background border-white/10 max-h-[300px]">
                {MUSIC_STYLES_LIST.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de groupe */}
          <div className="space-y-2">
            <Label>Type de groupe</Label>
            <Select 
              value={bandFilters.bandType || undefined} 
              onValueChange={(value) => onFiltersChange({ ...bandFilters, bandType: value })}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent className="bg-background border-white/10 max-h-[300px]">
                {bandTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de répertoire */}
          <div className="space-y-2">
            <Label>Type de répertoire</Label>
            <Select 
              value={bandFilters.repertoireType || undefined} 
              onValueChange={(value) => onFiltersChange({ ...bandFilters, repertoireType: value })}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent className="bg-background border-white/10">
                {repertoireTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle Cherche membres + Recherche ville */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Cherche membres */}
          <div className="flex items-center gap-2 p-3 bg-black/10 rounded-lg border border-white/10">
            <Switch 
              checked={bandFilters.lookingForMembers} 
              onCheckedChange={(checked) => onFiltersChange({ 
                ...bandFilters, 
                lookingForMembers: checked,
                lookingForProfile: checked ? bandFilters.lookingForProfile : ""
              })}
            />
            <Label className="cursor-pointer text-sm">Cherche des membres</Label>
          </div>

          {/* Recherche par ville */}
          <div className="space-y-2">
            <Input
              placeholder="Rechercher par ville..."
              value={bandFilters.city || ''}
              onChange={(e) => onFiltersChange({ ...bandFilters, city: e.target.value })}
              className="bg-black/20 border-white/10"
            />
          </div>
        </div>

        {/* Profil recherché (apparaît quand "Cherche des membres" est activé) */}
        {bandFilters.lookingForMembers && (
          <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg space-y-2">
            <Label className="text-sm flex items-center gap-2 text-orange-400">
              🎯 Profil recherché par le groupe
            </Label>
            <Select
              value={bandFilters.lookingForProfile || undefined}
              onValueChange={(value) => onFiltersChange({ ...bandFilters, lookingForProfile: value })}
            >
              <SelectTrigger className="bg-black/20 border-white/10" data-testid="filter-looking-for-profile">
                <SelectValue placeholder="Tous les profils" />
              </SelectTrigger>
              <SelectContent className="bg-background border-white/10 max-h-[300px]">
                {BAND_MEMBER_PROFILES.map((profile) => (
                  <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bandFilters.lookingForProfile && (
              <button
                onClick={() => onFiltersChange({ ...bandFilters, lookingForProfile: "" })}
                className="text-xs text-orange-400 hover:text-orange-300 underline"
              >
                Effacer ce critère
              </button>
            )}
          </div>
        )}

        {/* Bouton Réinitialiser */}
        <Button 
          variant="outline" 
          onClick={() => onFiltersChange({ 
            musicStyle: "", 
            bandType: "",
            repertoireType: "",
            lookingForMembers: false,
            lookingForProfile: "",
            city: ""
          })}
          className="rounded-full gap-2"
        >
          <X className="w-4 h-4" />
          Réinitialiser les filtres
        </Button>
      </div>

      {/* Onglets de localisation */}
      <Tabs defaultValue="all" className="w-full" onValueChange={() => {
        setSelectedRegion(null);
        setSelectedDepartment(null);
      }}>
        <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
          <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Tous ({getFilteredBands(enrichedBands).length})
          </TabsTrigger>
          <TabsTrigger value="france" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            France ({getFilteredBands(enrichedBands.filter(b => !b.country || b.country === 'France')).length})
          </TabsTrigger>
          <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Par Région
          </TabsTrigger>
          <TabsTrigger value="department" className="rounded-full">
            Par Département
          </TabsTrigger>
        </TabsList>

        {/* Tous les groupes */}
        <TabsContent value="all" className="mt-6">
          {bandsLoading ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary animate-pulse" />
              <p className="text-muted-foreground">Chargement des groupes...</p>
            </div>
          ) : getFilteredBands(enrichedBands).length === 0 ? (
            <div className="glassmorphism rounded-2xl p-12 text-center">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun groupe trouvé</h3>
              <p className="text-muted-foreground">
                Essayez avec d'autres filtres ou attendez que des groupes rejoignent la plateforme
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredBands(enrichedBands).map((band) => (
                <BandCard key={band.id} band={band} onContact={handleContact} onViewProfile={handleViewProfile} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* France */}
        <TabsContent value="france" className="mt-6">
          {bandsLoading ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary animate-pulse" />
              <p className="text-muted-foreground">Chargement des groupes...</p>
            </div>
          ) : getFilteredBands(enrichedBands.filter(b => !b.country || b.country === 'France')).length === 0 ? (
            <div className="glassmorphism rounded-2xl p-12 text-center">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun groupe trouvé en France</h3>
              <p className="text-muted-foreground">
                Essayez avec d'autres filtres
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredBands(enrichedBands.filter(b => !b.country || b.country === 'France')).map((band) => (
                <BandCard key={band.id} band={band} onContact={handleContact} onViewProfile={handleViewProfile} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Par Région */}
        <TabsContent value="region" className="mt-6">
          {(() => {
            const bandsByRegion = {};
            REGIONS_FRANCE.forEach(region => {
              bandsByRegion[region] = [];
            });
            const franceBands = enrichedBands.filter(b => !b.country || b.country === 'France');
            getFilteredBands(franceBands).forEach(b => {
              if (b.region && bandsByRegion[b.region]) {
                bandsByRegion[b.region].push(b);
              }
            });
            
            if (selectedRegion) {
              return (
                <div>
                  <Button onClick={() => setSelectedRegion(null)} variant="outline" className="mb-4 rounded-full gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour aux régions
                  </Button>
                  <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary" />
                    {selectedRegion} ({bandsByRegion[selectedRegion]?.length || 0} groupe{(bandsByRegion[selectedRegion]?.length || 0) > 1 ? 's' : ''})
                  </h3>
                  {bandsByRegion[selectedRegion]?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bandsByRegion[selectedRegion].map((band) => (
                        <BandCard key={band.id} band={band} onContact={handleContact} onViewProfile={handleViewProfile} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun groupe dans cette région</p>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div>
                <h3 className="font-heading font-semibold text-lg mb-4">Toutes les régions de France</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {REGIONS_FRANCE.map(region => {
                    const count = bandsByRegion[region]?.length || 0;
                    return (
                      <Button
                        key={region}
                        onClick={() => count > 0 && setSelectedRegion(region)}
                        variant="outline"
                        disabled={count === 0}
                        className={`h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all ${count > 0 ? 'hover:bg-primary/10 hover:border-primary' : 'opacity-50'}`}
                      >
                        <MapPin className={`w-5 h-5 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-center">
                          <div className="font-semibold text-sm">{region}</div>
                          <div className={`text-xs mt-1 ${count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            {count} groupe{count > 1 ? 's' : ''}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* Par Département */}
        <TabsContent value="department" className="mt-6">
          {(() => {
            const bandsByDepartment = {};
            DEPARTEMENTS_FRANCE.forEach(dept => {
              bandsByDepartment[dept.code] = {
                nom: dept.nom,
                bands: []
              };
            });
            const franceBands = enrichedBands.filter(b => !b.country || b.country === 'France');
            getFilteredBands(franceBands).forEach(b => {
              if (b.department && bandsByDepartment[b.department]) {
                bandsByDepartment[b.department].bands.push(b);
              }
            });
            
            if (selectedDepartment) {
              const deptData = bandsByDepartment[selectedDepartment];
              return (
                <div>
                  <Button onClick={() => setSelectedDepartment(null)} variant="outline" className="mb-4 rounded-full gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour aux départements
                  </Button>
                  <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-secondary" />
                    {selectedDepartment} - {deptData?.nom} ({deptData?.bands.length || 0} groupe{(deptData?.bands.length || 0) > 1 ? 's' : ''})
                  </h3>
                  {deptData?.bands.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptData.bands.map((band) => (
                        <BandCard key={band.id} band={band} onContact={handleContact} onViewProfile={handleViewProfile} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun groupe dans ce département</p>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div>
                <h3 className="font-heading font-semibold text-lg mb-4">Tous les départements de France</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {DEPARTEMENTS_FRANCE.map(dept => {
                    const count = bandsByDepartment[dept.code]?.bands.length || 0;
                    return (
                      <Button
                        key={dept.code}
                        onClick={() => count > 0 && setSelectedDepartment(dept.code)}
                        variant="outline"
                        disabled={count === 0}
                        className={`h-auto py-3 px-3 flex flex-col items-center gap-2 transition-all ${count > 0 ? 'hover:bg-secondary/10 hover:border-secondary' : 'opacity-50'}`}
                      >
                        <div className={`text-lg font-bold ${count > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                          {dept.code}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-xs leading-tight">{dept.nom}</div>
                          <div className={`text-xs mt-1 ${count > 0 ? 'text-secondary font-semibold' : 'text-muted-foreground'}`}>
                            {count} groupe{count > 1 ? 's' : ''}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      <BandProfileModal
        band={profileBand}
        open={!!profileBand}
        onOpenChange={(open) => !open && setProfileBand(null)}
        onContact={handleContact}
      />
    </div>
  );
}
