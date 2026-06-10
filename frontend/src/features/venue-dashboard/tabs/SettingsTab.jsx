import OnlineStatusSelector from "../../../components/OnlineStatusSelector";
import BackgroundSyncSettings from "../../../components/BackgroundSyncSettings";
import AdConsentPreferences from "../../../components/AdConsentPreferences";
import ModerationSettingsCard from "../components/ModerationSettingsCard";

export default function SettingsTab({ venueId, token }) {
  return (
    <div className="space-y-6">
      <div className="glassmorphism rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-xl mb-6">Paramètres</h2>
        <div className="space-y-6">
          <OnlineStatusSelector />
          <BackgroundSyncSettings />
          {/* Build 95.3 — Préférences publicitaires RGPD (visible même si les
              venues ne voient jamais de pub, pour transparence + parité Mobile) */}
          <AdConsentPreferences />
        </div>
      </div>
      
      {/* Moderation Settings */}
      <ModerationSettingsCard venueId={venueId} token={token} />
    </div>
  );
}
