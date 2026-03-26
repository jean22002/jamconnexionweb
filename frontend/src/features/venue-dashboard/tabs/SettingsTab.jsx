import OnlineStatusSelector from "../../../components/OnlineStatusSelector";
import BackgroundSyncSettings from "../../../components/BackgroundSyncSettings";

export default function SettingsTab() {
  return (
    <div className="glassmorphism rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-xl mb-6">Paramètres</h2>
      <div className="space-y-6">
        <OnlineStatusSelector />
        <BackgroundSyncSettings />
      </div>
    </div>
  );
}
