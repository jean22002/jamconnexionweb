import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MapPin, ArrowLeft, MapPinOff, User, Check, Clock, X, UserPlus, Eye } from "lucide-react";
import LazyImage from "../LazyImage";
import ProBadge, { getBadgeType } from "../ProBadge";
import { REGIONS_FRANCE, DEPARTEMENTS_FRANCE } from "../../data/france-locations";

function MusicianCard({ musician, onSendFriendRequest, onCancelRequest, sentRequests, friends }) {
  // Vérifier si une demande a déjà été envoyée à ce musicien
  const requestSent = sentRequests?.some(req => req.to_user_id === musician.user_id);
  // Trouver l'ID de la demande pour pouvoir l'annuler
  const sentRequest = sentRequests?.find(req => req.to_user_id === musician.user_id);
  // Vérifier si déjà ami (cherche dans user_id ET friend_id pour compatibilité)
  const isFriend = friends?.some(f => 
    f.friend_id === musician.user_id || f.user_id === musician.user_id
  );

  return (
    <div className="card-venue p-5">
      <div className="flex items-start gap-4">
        {musician.profile_image ? (
          <LazyImage 
            src={musician.profile_image} 
            alt={musician.pseudo || "Musicien"} 
            className="w-16 h-16 rounded-full object-cover" 
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-semibold">{musician.pseudo}</h3>
            {getBadgeType(musician) && (
              <ProBadge variant="compact" type={getBadgeType(musician)} showText={false} />
            )}
          </div>
          {musician.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {musician.city}
              {musician.department && ` (${musician.department})`}
            </p>
          )}
          {musician.experience_level && (
            <p className="text-xs text-muted-foreground mt-1">
              🎵 {musician.experience_level}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {musician.instruments?.slice(0, 2).map((inst, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        {isFriend ? (
          <Button variant="outline" className="flex-1 rounded-full border-green-500/50 text-green-500" disabled>
            <Check className="w-4 h-4 mr-2" /> Ami
          </Button>
        ) : requestSent ? (
          <>
            <Button variant="outline" className="flex-1 rounded-full border-orange-500/50 text-orange-500" disabled>
              <Clock className="w-4 h-4 mr-2" /> Envoyé
            </Button>
            <Button 
              onClick={() => onCancelRequest(sentRequest.id)} 
              variant="outline" 
              size="icon"
              className="rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button onClick={() => onSendFriendRequest(musician.user_id)} variant="outline" className="flex-1 rounded-full border-white/20 gap-2">
            <UserPlus className="w-4 h-4" /> Ajouter
          </Button>
        )}
        <Link to={`/musician/${musician.id}`} className="flex-1">
          <Button variant="secondary" className="w-full rounded-full gap-2">
            <Eye className="w-4 h-4" /> Voir
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function MusiciansTab({ 
  musicians, 
  currentUserId,
  onSendFriendRequest, 
  onCancelFriendRequest,
  sentRequests,
  friends
}) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Filtrer le musicien connecté - Optimisé avec useMemo
  const otherMusicians = useMemo(() => 
    musicians.filter(m => m.user_id !== currentUserId),
    [musicians, currentUserId]
  );

  // Pré-calculer les listes filtrées pour éviter les recalculs dans le JSX
  const franceMusicians = useMemo(() => 
    otherMusicians.filter(m => !m.country || m.country === 'France'),
    [otherMusicians]
  );

  const countryMusicians = useMemo(() => 
    otherMusicians.filter(m => m.country && m.country !== 'France'),
    [otherMusicians]
  );

  return (
    <div className="space-y-6">
      {/* Filtres de localisation */}
      <div className="glassmorphism rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-xl mb-4">Filtrer par localisation</h2>
        
        <Tabs defaultValue="all" className="w-full" onValueChange={() => {
          setSelectedRegion(null);
          setSelectedDepartment(null);
        }}>
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
            <TabsTrigger value="all" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              Tous ({otherMusicians.length})
            </TabsTrigger>
            <TabsTrigger value="france" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              France ({franceMusicians.length})
            </TabsTrigger>
            <TabsTrigger value="region" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              Par Région
            </TabsTrigger>
            <TabsTrigger value="department" className="rounded-full whitespace-nowrap flex-shrink-0 px-4">
              Par Département
            </TabsTrigger>
            <TabsTrigger value="country" className="rounded-full">
              Autres Pays
            </TabsTrigger>
          </TabsList>

          {/* Tous les musiciens */}
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherMusicians.map((musician) => (
                <MusicianCard 
                  key={musician.id} 
                  musician={musician} 
                  onSendFriendRequest={onSendFriendRequest}
                  onCancelRequest={onCancelFriendRequest}
                  sentRequests={sentRequests}
                  friends={friends}
                />
              ))}
            </div>
          </TabsContent>

          {/* France */}
          <TabsContent value="france" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {franceMusicians.map((musician) => (
                  <MusicianCard 
                    key={musician.id} 
                    musician={musician} 
                    onSendFriendRequest={onSendFriendRequest}
                    onCancelRequest={onCancelFriendRequest}
                    sentRequests={sentRequests}
                    friends={friends}
                  />
                ))}
            </div>
          </TabsContent>

          {/* Par Région */}
          <TabsContent value="region" className="mt-6">
            {(() => {
              const musiciansByRegion = {};
              REGIONS_FRANCE.forEach(region => {
                musiciansByRegion[region] = [];
              });
              otherMusicians
                .filter(m => !m.country || m.country === 'France')
                .forEach(m => {
                  if (m.region && musiciansByRegion[m.region]) {
                    musiciansByRegion[m.region].push(m);
                  }
                });
              
              if (selectedRegion) {
                return (
                  <div>
                    <Button 
                      onClick={() => setSelectedRegion(null)} 
                      variant="outline" 
                      className="mb-4 rounded-full gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour aux régions
                    </Button>
                    <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-primary" />
                      {selectedRegion} ({musiciansByRegion[selectedRegion]?.length || 0} musicien{(musiciansByRegion[selectedRegion]?.length || 0) > 1 ? 's' : ''})
                    </h3>
                    {musiciansByRegion[selectedRegion]?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {musiciansByRegion[selectedRegion].map((musician) => (
                          <MusicianCard 
                            key={musician.id} 
                            musician={musician} 
                            onSendFriendRequest={onSendFriendRequest}
                            onCancelRequest={onCancelFriendRequest}
                            sentRequests={sentRequests}
                            friends={friends}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun musicien dans cette région pour le moment</p>
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-4">
                    Toutes les régions de France
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {REGIONS_FRANCE.map(region => {
                      const count = musiciansByRegion[region]?.length || 0;
                      return (
                        <Button
                          key={region}
                          onClick={() => setSelectedRegion(region)}
                          variant="outline"
                          className={`h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all ${
                            count > 0 
                              ? 'hover:bg-primary/10 hover:border-primary' 
                              : 'opacity-50 hover:bg-muted/10'
                          }`}
                        >
                          <MapPin className={`w-5 h-5 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="text-center">
                            <div className="font-semibold text-sm">{region}</div>
                            <div className={`text-xs mt-1 ${count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                              {count} musicien{count > 1 ? 's' : ''}
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
              const musiciansByDepartment = {};
              DEPARTEMENTS_FRANCE.forEach(dept => {
                musiciansByDepartment[dept.code] = {
                  nom: dept.nom,
                  musicians: []
                };
              });
              otherMusicians
                .filter(m => !m.country || m.country === 'France')
                .forEach(m => {
                  if (m.department && musiciansByDepartment[m.department]) {
                    musiciansByDepartment[m.department].musicians.push(m);
                  }
                });
              
              if (selectedDepartment) {
                const deptData = musiciansByDepartment[selectedDepartment];
                return (
                  <div>
                    <Button 
                      onClick={() => setSelectedDepartment(null)} 
                      variant="outline" 
                      className="mb-4 rounded-full gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour aux départements
                    </Button>
                    <h3 className="font-heading font-semibold text-xl mb-4 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-secondary" />
                      {selectedDepartment} - {deptData?.nom} ({deptData?.musicians.length || 0} musicien{(deptData?.musicians.length || 0) > 1 ? 's' : ''})
                    </h3>
                    {deptData?.musicians.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deptData.musicians.map((musician) => (
                          <MusicianCard 
                            key={musician.id} 
                            musician={musician} 
                            onSendFriendRequest={onSendFriendRequest}
                            onCancelRequest={onCancelFriendRequest}
                            sentRequests={sentRequests}
                            friends={friends}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun musicien dans ce département</p>
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-4">
                    Tous les départements de France
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {DEPARTEMENTS_FRANCE.map(dept => {
                      const count = musiciansByDepartment[dept.code]?.musicians.length || 0;
                      return (
                        <Button
                          key={dept.code}
                          onClick={() => setSelectedDepartment(dept.code)}
                          variant="outline"
                          className={`h-auto py-3 px-3 flex flex-col items-center gap-2 transition-all ${
                            count > 0 
                              ? 'hover:bg-secondary/10 hover:border-secondary' 
                              : 'opacity-50 hover:bg-muted/10'
                          }`}
                        >
                          <div className={`text-lg font-bold ${count > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                            {dept.code}
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-xs leading-tight">{dept.nom}</div>
                            <div className={`text-xs mt-1 ${count > 0 ? 'text-secondary font-semibold' : 'text-muted-foreground'}`}>
                              {count} musicien{count > 1 ? 's' : ''}
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

          {/* Autres Pays */}
          <TabsContent value="country" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countryMusicians.map((musician) => (
                  <MusicianCard 
                    key={musician.id} 
                    musician={musician} 
                    onSendFriendRequest={onSendFriendRequest}
                    onCancelRequest={onCancelFriendRequest}
                    sentRequests={sentRequests}
                    friends={friends}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
