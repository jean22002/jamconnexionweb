import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

export default function SettingsTab({ passwordForm, setPasswordForm, handleChangePassword }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
        <h4 className="font-semibold mb-2">🔒 Changer le mot de passe</h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Ancien mot de passe</Label>
            <Input
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              className="bg-black/20 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="bg-black/20 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmer le mot de passe</Label>
            <Input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="bg-black/20 border-white/10"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            className="w-full bg-orange-500 hover:bg-orange-600 rounded-full"
          >
            Changer le mot de passe
          </Button>
        </div>
      </div>
    </div>
  );
}
