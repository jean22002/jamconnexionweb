import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Flag, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const REPORT_REASONS = [
  "Comportement inapproprié / Harcèlement",
  "Contenu offensant / Langage inapproprié",
  "Faux profil / Usurpation d'identité",
  "Spam / Publicité non sollicitée",
  "Non-respect du règlement",
  "Contenu illégal",
  "Autre"
];

export default function ReportProfileDialog({ 
  isOpen, 
  onClose, 
  reportedUserId, 
  reportedProfileType,
  reportedProfileName,
  token 
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    if (!details.trim()) {
      toast.error("Veuillez fournir des détails sur le signalement");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/reports/`,
        {
          reported_user_id: reportedUserId,
          reported_profile_type: reportedProfileType,
          reason: reason,
          details: details.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(true);
      toast.success("Signalement envoyé avec succès");
      
      // Fermer après 2 secondes
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error("Error submitting report:", error);
      const errorMessage = error.response?.data?.detail || "Erreur lors de l'envoi du signalement";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDetails("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Flag className="w-5 h-5 text-red-500" />
            Signaler ce profil
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-lg font-semibold">Signalement envoyé</h3>
            <p className="text-sm text-muted-foreground text-center">
              Merci pour votre signalement. Notre équipe va examiner ce profil rapidement.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Important</p>
                  <p>Vous êtes sur le point de signaler <strong>{reportedProfileName}</strong>.</p>
                  <p className="mt-2">Les faux signalements peuvent entraîner des sanctions. Veuillez n'utiliser cette fonction qu'en cas de réel problème.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison du signalement *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Sélectionnez une raison" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Détails du signalement *</Label>
                <Textarea
                  id="details"
                  placeholder="Décrivez précisément le problème rencontré avec ce profil..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={5}
                  className="bg-background resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {details.length}/1000 caractères
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !reason || !details.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Envoyer le signalement
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
