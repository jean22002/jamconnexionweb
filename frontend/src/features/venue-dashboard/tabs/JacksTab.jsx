import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import LazyImage from "../../../components/LazyImage";
import { Plug, Heart, User, MapPin } from "lucide-react";

export default function JacksTab({ subscribers }) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-2xl mb-6 flex items-center gap-2">
        <Plug className="w-6 h-6 text-primary" />
        Jacks - Abonnés ({subscribers.length})
      </h2>
      
      {subscribers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Vous n'avez pas encore d'abonnés</p>
          <p className="text-sm mt-2">Les musiciens qui se connectent à votre établissement apparaîtront ici</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscribers.map((subscriber) => (
            <div key={subscriber.id} className="card-venue p-5">
              <div className="flex items-start gap-4">
                {subscriber.profile_image ? (
                  <LazyImage 
                    src={subscriber.profile_image} 
                    alt={subscriber.pseudo || "Abonné"} 
                    className="w-16 h-16 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-heading font-semibold">{subscriber.pseudo}</h3>
                  {subscriber.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {subscriber.city}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {subscriber.instruments?.slice(0, 2).map((inst, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link to={subscriber.role === 'musician' ? `/musician/${subscriber.id}` : `/melomane/${subscriber.id}`}>
                  <Button variant="outline" className="w-full rounded-full gap-2">
                    <User className="w-4 h-4" /> Voir profil
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
