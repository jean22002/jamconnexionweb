import { Link } from "react-router-dom";
import { Heart, Music } from "lucide-react";
import LazyImage from "../../../components/LazyImage";

export default function SubscriptionsTab({ subscriptions }) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Vous n'êtes connecté à aucun établissement</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subscriptions.map((sub) => (
        <Link 
          key={sub.venue_id} 
          to={`/venue/${sub.venue_id}`}
          className="card-venue p-5 cursor-pointer hover:scale-105 transition-transform block"
        >
          <div className="flex items-center gap-4">
            {sub.venue_image ? (
              <LazyImage 
                src={sub.venue_image} 
                alt={sub.venue_name} 
                className="w-14 h-14 rounded-xl object-cover" 
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Music className="w-7 h-7 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-white">{sub.venue_name || 'Nom non disponible'}</h3>
              <p className="text-sm text-gray-300">{sub.city || 'Ville non disponible'}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
