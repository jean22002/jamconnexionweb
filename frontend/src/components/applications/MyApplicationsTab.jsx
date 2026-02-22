import { Button } from "../ui/button";
import { MapPin, Send, Loader2, CalendarIcon, Clock, Music, Check, X } from "lucide-react";

function ApplicationCard({ app, onCancel }) {
  return (
    <div className="card-venue p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg">{app.slot_venue_name || "Établissement"}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {app.slot_venue_city || "Ville"}
          </p>
        </div>
        <div>
          {app.status === "pending" && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              En attente
            </span>
          )}
          {app.status === "accepted" && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Acceptée
            </span>
          )}
          {app.status === "rejected" && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
              <X className="w-3 h-3" />
              Refusée
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span>{app.slot_date || "Date"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span>{app.slot_start_time || ""} - {app.slot_end_time || ""}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-primary" />
          <span className="font-medium">{app.band_name}</span>
        </div>
      </div>

      {app.message && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{app.message}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="text-xs text-muted-foreground">
          Envoyée le {new Date(app.created_at).toLocaleDateString('fr-FR')}
        </div>
        {app.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(app.id)}
            className="rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            <X className="w-3 h-3 mr-1" />
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyApplicationsTab({
  myApplications,
  loadingMyApplications,
  onRefresh,
  onCancelApplication
}) {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-2xl flex items-center gap-2">
          <Send className="w-6 h-6 text-primary" />
          Mes Candidatures
        </h2>
        <Button 
          onClick={onRefresh}
          variant="outline"
          className="rounded-full"
          disabled={loadingMyApplications}
        >
          {loadingMyApplications ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Chargement...
            </>
          ) : (
            "Actualiser"
          )}
        </Button>
      </div>

      {loadingMyApplications ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de vos candidatures...</p>
        </div>
      ) : myApplications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Vous n'avez pas encore envoyé de candidature</p>
          <p className="text-sm mt-2">Consultez l'onglet "Candidatures" pour postuler</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{myApplications.length} candidature(s) envoyée(s)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApplications.map((app) => (
              <ApplicationCard 
                key={app.id} 
                app={app} 
                onCancel={onCancelApplication}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
