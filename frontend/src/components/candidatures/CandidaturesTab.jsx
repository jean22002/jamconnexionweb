import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Search, MapPin, Loader2, CalendarIcon, Clock, Users, Check, ArrowLeft, MapPinOff, ArrowUpDown } from "lucide-react";
import { REGIONS_FRANCE, DEPARTEMENTS_FRANCE } from "../../data/france-locations";
import { MUSIC_STYLES_LIST } from "../../data/music-styles";

// Composant pour afficher une carte de candidature
function CandidatureCard({ slot, onApply }) {
  return (
    <div className="card-venue p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg">{slot.venue_name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {slot.venue_city}
            {slot.venue_department && ` (${slot.venue_department})`}
          </p>
          {slot.venue_region && (
            <p className="text-xs text-muted-foreground">{slot.venue_region}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span>{slot.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span>{slot.start_time} - {slot.end_time}</span>
        </div>
      </div>

      {slot.music_styles && slot.music_styles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {slot.music_styles.map((style, i) => (
            <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
              {style}
            </span>
          ))}
        </div>
      )}

      {slot.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{slot.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {slot.applications_count || 0} candidature(s)
          </span>
          {slot.accepted_bands_count > 0 && (
            <span className="flex items-center gap-1 text-green-400 mt-1">
              <Check className="w-3 h-3" />
              {slot.accepted_bands_count} acceptée(s)
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onApply(slot.id)}
          className="rounded-full"
          disabled={!slot.is_open}
        >
          {slot.is_open ? 'Candidater' : 'Fermé'}
        </Button>
      </div>
    </div>
  );
}

export default function CandidaturesTab({ 
  candidatures,
  loadingCandidatures,
  candidatureFilters,
  onFiltersChange,
  onSearch,
  onReset,
  onApply
}) {
  const [viewMode, setViewMode] = useState("filters"); // "filters", "region", "department", "all"
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [sortBy, setSortBy] = useState("date_asc"); // "date_asc", "date_desc"

  // Fonction pour trier les candidatures par date
  const sortCandidatures = (slots) => {
    const sorted = [...slots];
    sorted.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortBy === "date_asc" ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  };

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-2xl mb-6 flex items-center gap-2">
        <Search className="w-6 h-6 text-primary" />
        Recherche de Candidatures
      </h2>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => {
        setViewMode(value);
        setSelectedRegion(null);
        setSelectedDepartment(null);
      }} className="w-full mb-6">
        <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1">
          <TabsTrigger value="filters" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Filtres
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Tous ({candidatures.length})
          </TabsTrigger>
          <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Par Région
          </TabsTrigger>
          <TabsTrigger value="department" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Par Département
          </TabsTrigger>
        </TabsList>

        {/* Filters View */}
        <TabsContent value="filters" className="mt-6">
          <h3 className="font-heading font-semibold text-lg mb-4">Rechercher avec des filtres</h3>

          <h3 className="font-heading font-semibold text-lg mb-4">Rechercher avec des filtres</h3>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <Label>Date de début</Label>
          <Input 
            type="date" 
            value={candidatureFilters.dateFrom}
            onChange={(e) => onFiltersChange({...candidatureFilters, dateFrom: e.target.value})}
          />
        </div>
        <div>
          <Label>Date de fin</Label>
          <Input 
            type="date" 
            value={candidatureFilters.dateTo}
            onChange={(e) => onFiltersChange({...candidatureFilters, dateTo: e.target.value})}
          />
        </div>
        <div>
          <Label>Région</Label>
          <Select 
            value={candidatureFilters.region || undefined}
            onValueChange={(value) => onFiltersChange({...candidatureFilters, region: value, department: ''})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les régions" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS_FRANCE.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Département</Label>
          <Select 
            value={candidatureFilters.department || undefined}
            onValueChange={(value) => onFiltersChange({...candidatureFilters, department: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les départements" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTEMENTS_FRANCE.map(dept => (
                <SelectItem key={dept.code} value={dept.code}>
                  {dept.code} - {dept.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Style musical</Label>
          <Select 
            value={candidatureFilters.musicStyle || undefined}
            onValueChange={(value) => onFiltersChange({...candidatureFilters, musicStyle: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les styles" />
            </SelectTrigger>
            <SelectContent>
              {MUSIC_STYLES_LIST.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          </div>

          <div className="flex gap-3 mb-6">
        <Button 
          onClick={onSearch}
          disabled={loadingCandidatures}
          className="rounded-full"
        >
          {loadingCandidatures ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recherche...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={onReset}
          className="rounded-full"
        >
          Réinitialiser
        </Button>
      </div>

      {/* Results */}
      {loadingCandidatures ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Recherche en cours...</p>
        </div>
      ) : candidatures.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune candidature trouvée</p>
          <p className="text-sm mt-2">Ajustez vos filtres et lancez une recherche</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{candidatures.length} résultat(s) trouvé(s)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidatures.map((slot) => (
              <div key={slot.id} className="card-venue p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-lg">{slot.venue_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {slot.venue_city}
                      {slot.venue_department && ` (${slot.venue_department})`}
                    </p>
                    {slot.venue_region && (
                      <p className="text-xs text-muted-foreground">{slot.venue_region}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span>{slot.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{slot.start_time} - {slot.end_time}</span>
                  </div>
                </div>

                {slot.music_styles && slot.music_styles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {slot.music_styles.map((style, i) => (
                      <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                        {style}
                      </span>
                    ))}
                  </div>
                )}

                {slot.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{slot.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {slot.applications_count || 0} candidature(s)
                    </span>
                    {slot.accepted_bands_count > 0 && (
                      <span className="flex items-center gap-1 text-green-400 mt-1">
                        <Check className="w-3 h-3" />
                        {slot.accepted_bands_count} acceptée(s)
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onApply(slot.id)}
                    className="rounded-full"
                    disabled={!slot.is_open}
                  >
                    {slot.is_open ? 'Candidater' : 'Fermé'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
