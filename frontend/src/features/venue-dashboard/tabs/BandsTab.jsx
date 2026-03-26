import { Music, Users, MapPin, Calendar } from "lucide-react";

export default function BandsTab({ bands }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl">Groupes</h2>
        <p className="text-muted-foreground text-sm">{bands.length} groupe(s)</p>
      </div>

      {bands.length === 0 ? (
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun groupe</h3>
          <p className="text-muted-foreground">
            Les groupes qui postulent à vos événements apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bands.map((band, idx) => (
            <div key={idx} className="glassmorphism rounded-xl p-4 hover:border-primary/50 transition-all">
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
                  <p className="text-sm text-muted-foreground">{band.band_type || 'Groupe'}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {band.music_styles && band.music_styles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      {band.music_styles.slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}
                {band.members_count && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{band.members_count} membres</span>
                  </div>
                )}
                {band.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{band.city}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
