import { useState, useEffect, useMemo } from "react";
import { Loader2, Save, Trash2, X, Euro, FileText, Calculator } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { musicianAccountingApi } from "../../services/musicianAccounting";

const PAYMENT_METHODS = [
  { value: "guso", label: "GUSO" },
  { value: "facture", label: "Facture" },
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
  { value: "promotion", label: "Promotion / Bénévolat" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmé" },
  { value: "paid", label: "Payé" },
];

const GUSO_CHARGES_RATE = 0.22;

const DEFAULT_FORM = {
  amount: "",
  payment_method: "",
  payment_status: "",
  is_guso: false,
  notes: "",
};

export default function MusicianAccountingEditModal({
  open,
  onOpenChange,
  token,
  event,
  initialEntry,
  onSaved,
  onDeleted,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Hydrate the form whenever the modal opens for a new event
  useEffect(() => {
    if (!open) return;
    if (initialEntry) {
      setForm({
        amount: initialEntry.amount != null ? String(initialEntry.amount) : "",
        payment_method: initialEntry.payment_method || "",
        payment_status: initialEntry.payment_status || "",
        is_guso: !!initialEntry.is_guso,
        notes: initialEntry.notes || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, initialEntry]);

  const numericAmount = useMemo(() => {
    const n = parseFloat(form.amount);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [form.amount]);

  const gusoPreview = useMemo(() => {
    if (!form.is_guso || numericAmount == null) return null;
    const charges = Math.round(numericAmount * GUSO_CHARGES_RATE * 100) / 100;
    const net = Math.round((numericAmount - charges) * 100) / 100;
    return { brut: numericAmount, charges, net };
  }, [form.is_guso, numericAmount]);

  const handleSave = async () => {
    if (!event?.id) {
      toast.error("Événement introuvable");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        event_id: String(event.id),
        event_type: event.type || event.event_type || undefined,
        amount: numericAmount,
        payment_method: form.payment_method || "",
        payment_status: form.payment_status || "",
        is_guso: !!form.is_guso,
        notes: form.notes || "",
      };
      const saved = await musicianAccountingApi.save(token, payload);
      toast.success("Comptabilité enregistrée");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    if (!window.confirm("Supprimer les données comptables de cette prestation ?")) return;
    setDeleting(true);
    try {
      await musicianAccountingApi.remove(token, String(event.id));
      toast.success("Données comptables supprimées");
      onDeleted?.(String(event.id));
      onOpenChange(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glassmorphism border-white/10 max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="musician-accounting-edit-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Comptabilité — {event?.title || "Prestation"}
          </DialogTitle>
          <DialogDescription>
            Saisissez les informations financières de cette prestation. Les calculs GUSO sont
            automatiques (charges sociales ~22%).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="ma-amount">Montant brut</Label>
            <div className="relative">
              <Input
                id="ma-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="ex: 150.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="bg-black/20 border-white/10 pr-8"
                data-testid="musician-accounting-amount-input"
              />
              <Euro className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Méthode */}
          <div className="space-y-2">
            <Label>Méthode de paiement</Label>
            <Select
              value={form.payment_method || undefined}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  payment_method: v,
                  is_guso: v === "guso" ? true : form.is_guso,
                })
              }
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GUSO toggle + preview */}
          <div className="p-4 border-2 border-amber-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-amber-400 font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Déclaration GUSO
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calcule automatiquement les charges et le net.
                </p>
              </div>
              <Switch
                checked={form.is_guso}
                onCheckedChange={(checked) => setForm({ ...form, is_guso: checked })}
                data-testid="musician-accounting-guso-toggle"
              />
            </div>
            {gusoPreview && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Brut</p>
                  <p className="text-base font-bold">{gusoPreview.brut.toFixed(2)}€</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Charges</p>
                  <p className="text-base font-bold text-orange-400">
                    -{gusoPreview.charges.toFixed(2)}€
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Net</p>
                  <p className="text-base font-bold text-green-400">
                    {gusoPreview.net.toFixed(2)}€
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut de paiement</Label>
            <Select
              value={form.payment_status || undefined}
              onValueChange={(v) => setForm({ ...form, payment_status: v })}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="ma-notes">Notes</Label>
            <Textarea
              id="ma-notes"
              maxLength={500}
              rows={3}
              placeholder="Notes personnelles sur cette prestation…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-black/20 border-white/10"
              data-testid="musician-accounting-notes-input"
            />
            <p className="text-xs text-muted-foreground text-right">
              {(form.notes || "").length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {initialEntry && (
              <Button
                variant="outline"
                className="rounded-full border-red-500/40 text-red-500 hover:bg-red-500/10"
                onClick={handleDelete}
                disabled={deleting || saving}
                data-testid="musician-accounting-delete-btn"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Effacer
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={saving || deleting}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              className="rounded-full bg-primary hover:bg-primary/90 sm:ml-auto"
              onClick={handleSave}
              disabled={saving || deleting}
              data-testid="musician-accounting-save-btn"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
