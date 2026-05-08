import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MapPin, ArrowLeft, MapPinOff, Heart, X } from "lucide-react";
import LazyImage from "../LazyImage";
import { REGIONS_FRANCE, DEPARTEMENTS_FRANCE } from "../../data/france-locations";

// VenueCard component
function VenueCard({ venue, onSubscribe, onUnsubscribe, subscriptions }) {
  const isSubscribed = subscriptions?.some(sub => sub.venue_id === venue.id);

  return (
    <div className="card-venue p-5">
      <Link to={`/venue/${venue.id}`}>
        {venue.profile_image && (
          <LazyImage 
            src={venue.profile_image} 
            alt={venue.name} 
            className="w-full h-32 object-cover rounded-lg mb-3 hover:opacity-90 transition" 
          />
        )}
        <h3 className="font-heading font-semibold hover:text-primary transition">{venue.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" />
          {venue.city}
          {venue.department && ` (${venue.department})`}
        </p>
        {venue.music_styles?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {venue.music_styles.slice(0, 3).map((style, i) => (
              <span key={i} className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs rounded-full">{style}</span>
            ))}
          </div>
        )}
      </Link>
      <div className="mt-4">
        {isSubscribed ? (
          <Button 
            onClick={() => onUnsubscribe(venue.id)} 
            variant="outline" 
            className="w-full rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-2" /> Se déconnecter
          </Button>
        ) : (
          <Button 
            onClick={() => onSubscribe(venue.id)} 
            variant="default" 
            className="w-full rounded-full bg-primary hover:bg-primary/90"
          >
            <Heart className="w-4 h-4 mr-2" /> Se connecter
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VenuesTab({ venues, subscriptions, onSubscribe, onUnsubscribe }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Pré-calculer les listes filtrées avec useMemo pour optimiser les performances
  const franceVenues = useMemo(() => 
    venues.filter(v => !v.country || v.country === 'France'),
    [venues]
  );

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-2xl mb-6">Établissements</h2>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
        setSelectedRegion(null);
        setSelectedDepartment(null);
      }}>
        <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
          <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Tous ({venues.length})
          </TabsTrigger>
          <TabsTrigger value="france" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            France ({franceVenues.length})
          </TabsTrigger>
          <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
            Par Région
          </TabsTrigger>
          <TabsTrigger value="department" className="rounded-full">
            Par Département
          </TabsTrigger>
        </TabsList>

        {/* Tous les établissements */}
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <VenueCard 
                key={venue.id} 
                venue={venue}
                onSubscribe={onSubscribe}
                onUnsubscribe={onUnsubscribe}
                subscriptions={subscriptions}
              />
            ))}
          </div>
        </TabsContent>

        {/* France */}
        <TabsContent value="france" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {franceVenues.map((venue) => (
              <VenueCard 
                key={venue.id} 
                venue={venue}
                onSubscribe={onSubscribe}
                onUnsubscribe={onUnsubscribe}
                subscriptions={subscriptions}
              />
            ))}
          </div>
        </TabsContent>

        {/* Par Région */}
        <TabsContent value="region" className="mt-6">
          {(() => {
            const venuesByRegion = {};
            REGIONS_FRANCE.forEach(region => {
              venuesByRegion[region] = [];
            });
            venues.filter(v => !v.country || v.country === 'France').forEach(v => {
              if (v.region && venuesByRegion[v.region]) {
                venuesByRegion[v.region].push(v);
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
                    {selectedRegion} ({venuesByRegion[selectedRegion]?.length || 0} établissement{(venuesByRegion[selectedRegion]?.length || 0) > 1 ? 's' : ''})
                  </h3>
                  {venuesByRegion[selectedRegion]?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {venuesByRegion[selectedRegion].map((venue) => (
                        <VenueCard 
                          key={venue.id} 
                          venue={venue}
                          onSubscribe={onSubscribe}
                          onUnsubscribe={onUnsubscribe}
                          subscriptions={subscriptions}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun établissement dans cette région</p>
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
                    const count = venuesByRegion[region]?.length || 0;
                    return (
                      <Button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        variant="outline"
                        className={`h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all ${count > 0 ? 'hover:bg-primary/10 hover:border-primary' : 'opacity-50 hover:bg-muted/10'}`}
                      >
                        <MapPin className={`w-5 h-5 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-center">
                          <div className="font-semibold text-sm">{region}</div>
                          <div className={`text-xs mt-1 ${count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            {count} établissement{count > 1 ? 's' : ''}
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
            const venuesByDepartment = {};
            DEPARTEMENTS_FRANCE.forEach(dept => {
              venuesByDepartment[dept.code] = {
                nom: dept.nom,
                venues: []
              };
            });
            venues.filter(v => !v.country || v.country === 'France').forEach(v => {
              if (v.department && venuesByDepartment[v.department]) {
                venuesByDepartment[v.department].venues.push(v);
              }
            });
            
            if (selectedDepartment) {
              const deptData = venuesByDepartment[selectedDepartment];
              return (
                <div>
                  <Button onClick={() => setSelectedDepartment(null)} variant="outline" className="mb-4 rounded-full gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour aux départements
                  </Button>
                  <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-secondary" />
                    {selectedDepartment} - {deptData?.nom} ({deptData?.venues.length || 0} établissement{(deptData?.venues.length || 0) > 1 ? 's' : ''})
                  </h3>
                  {deptData?.venues.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptData.venues.map((venue) => (
                        <VenueCard 
                          key={venue.id} 
                          venue={venue}
                          onSubscribe={onSubscribe}
                          onUnsubscribe={onUnsubscribe}
                          subscriptions={subscriptions}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun établissement dans ce département</p>
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
                    const count = venuesByDepartment[dept.code]?.venues.length || 0;
                    return (
                      <Button
                        key={dept.code}
                        onClick={() => setSelectedDepartment(dept.code)}
                        variant="outline"
                        className={`h-auto py-3 px-3 flex flex-col items-center gap-2 transition-all ${count > 0 ? 'hover:bg-secondary/10 hover:border-secondary' : 'opacity-50 hover:bg-muted/10'}`}
                      >
                        <div className={`text-lg font-bold ${count > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                          {dept.code}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-xs leading-tight">{dept.nom}</div>
                          <div className={`text-xs mt-1 ${count > 0 ? 'text-secondary font-semibold' : 'text-muted-foreground'}`}>
                            {count} établissement{count > 1 ? 's' : ''}
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
    </div>
  );
}
