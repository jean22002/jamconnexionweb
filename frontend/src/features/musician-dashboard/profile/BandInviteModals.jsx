import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useState } from "react";
import { Copy, Check, Loader2, Calendar, Users } from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function ShareBandModal({ open, onClose, band, token }) {
  const [inviteCode, setInviteCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [membersJoined, setMembersJoined] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  // Générer ou récupérer le code d'invitation
  const fetchInviteCode = async () => {
    if (inviteCode) return; // Déjà chargé
    
    setLoading(true);
    try {
      // D'abord essayer de récupérer un code existant
      const response = await axios.get(
        `${API_URL}/api/bands/${band.band_id || band.id}/invite-code`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteCode(response.data);
    } catch (error) {
      // Si pas de code existant, en créer un nouveau
      if (error.response?.status === 404) {
        try {
          const response = await axios.post(
            `${API_URL}/api/bands/${band.band_id || band.id}/invite-code`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setInviteCode(response.data);
        } catch (createError) {
          console.error("Erreur lors de la création du code:", createError);
          alert("Impossible de créer le code d'invitation");
        }
      } else {
        console.error("Erreur lors de la récupération du code:", error);
        alert("Impossible de récupérer le code d'invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les membres ayant rejoint via code
  const fetchMembers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/bands/${band.band_id || band.id}/invite-code/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembersJoined(response.data);
      setShowMembers(true);
    } catch (error) {
      console.error("Erreur lors de la récupération des membres:", error);
    }
  };

  // Copier le code dans le presse-papier
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode?.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Charger le code dès l'ouverture
  useState(() => {
    if (open && !inviteCode) {
      fetchInviteCode();
    }
  }, [open]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager "{band.name}"</DialogTitle>
          <DialogDescription>
            Partagez ce code avec les musiciens que vous souhaitez inviter à rejoindre votre groupe.
            Le code est valable 7 jours.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : inviteCode ? (
          <div className="space-y-4">
            {/* Code d'invitation */}
            <div className="space-y-2">
              <Label>Code d'invitation</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteCode.code}
                  readOnly
                  className="text-2xl font-mono font-bold text-center tracking-wider"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  title="Copier le code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Informations */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expire le :</span>
                <span className="font-medium">{formatDate(inviteCode.expires_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Membres ayant rejoint :</span>
                <span className="font-medium">{inviteCode.members_joined}</span>
              </div>
            </div>

            {/* Liste des membres */}
            {!showMembers && inviteCode.members_joined > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMembers}
                className="w-full"
              >
                Voir les membres ayant rejoint
              </Button>
            )}

            {showMembers && membersJoined.length > 0 && (
              <div className="space-y-2">
                <Label>Membres ayant rejoint via ce code :</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {membersJoined.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                      {member.profile_image ? (
                        <img
                          src={`${API_URL}${member.profile_image}`}
                          alt={member.pseudo}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold">{member.pseudo?.[0]}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.pseudo}</p>
                        <p className="text-xs text-muted-foreground">
                          Rejoint le {formatDate(member.joined_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function JoinBandModal({ open, onClose, token, onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!code || code.length !== 6) {
      setError("Le code doit contenir 6 caractères");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/api/bands/join`,
        { code: code.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ ${response.data.message}`);
      onSuccess();
      onClose();
      setCode("");
    } catch (error) {
      console.error("Erreur lors de la jointure:", error);
      setError(
        error.response?.data?.detail ||
        "Impossible de rejoindre le groupe. Vérifiez le code et réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejoindre un groupe</DialogTitle>
          <DialogDescription>
            Entrez le code d'invitation à 6 caractères que vous avez reçu de l'administrateur du groupe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Code d'invitation</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="ABC123"
              maxLength={6}
              className="text-2xl font-mono font-bold text-center tracking-wider uppercase"
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            💡 Le code est sensible à la casse et doit contenir exactement 6 caractères.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={handleClose} variant="outline" disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || code.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              "Rejoindre"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
