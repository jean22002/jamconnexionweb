import { useState, useEffect } from "react";
import axios from "axios";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Bell, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NotificationPreferences({ token }) {
  const [preferences, setPreferences] = useState({
    new_participants: true,
    new_applications: true,
    application_cancellation: true,
    new_messages: true,
    new_followers: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get(`${API}/venues/me/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data.notification_preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      toast.error("Erreur lors du chargement des préférences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    
    setPreferences(newPreferences);
    setSaving(true);

    try {
      await axios.put(
        `${API}/venues/me/notification-preferences`,
        newPreferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Préférences enregistrées");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Erreur lors de la sauvegarde");
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: "new_participants",
      label: "Nouveaux participants",
      description: "Lorsqu'un utilisateur marque sa participation à un de vos événements"
    },
    {
      key: "new_applications",
      label: "Candidatures reçues",
      description: "Lorsqu'un musicien postule à un de vos événements"
    },
    {
      key: "application_cancellation",
      label: "Annulation de candidature",
      description: "Lorsqu'un musicien annule sa candidature"
    },
    {
      key: "new_messages",
      label: "Messages",
      description: "Lorsque vous recevez un nouveau message"
    },
    {
      key: "new_followers",
      label: "Nouveaux abonnés",
      description: "Lorsqu'un utilisateur suit votre établissement"
    }
  ];

  return (
    <div className="glassmorphism rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Préférences de notifications</h3>
          <p className="text-sm text-muted-foreground">
            Choisissez les notifications que vous souhaitez recevoir
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <div
            key={type.key}
            className="flex items-start justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            <div className="flex-1 mr-4">
              <Label
                htmlFor={type.key}
                className="font-medium cursor-pointer"
              >
                {type.label}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {type.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saving && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
              <Switch
                id={type.key}
                checked={preferences[type.key]}
                onCheckedChange={() => handleToggle(type.key)}
                disabled={saving}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary mb-1">À propos des notifications</p>
          <p className="text-muted-foreground">
            Ces paramètres s'appliquent aux notifications sur la plateforme. 
            Les notifications push mobiles peuvent être configurées séparément dans l'application mobile.
          </p>
        </div>
      </div>
    </div>
  );
}
