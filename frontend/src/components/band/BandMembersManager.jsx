import React, { useState } from 'react';
import { UserPlus, Copy, Check, X, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BandMembersManager = ({ bandId, currentMembers = [], token, onUpdate }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState([]);

  // Charger les invitations en attente
  React.useEffect(() => {
    if (bandId) {
      fetchInvitations();
    }
  }, [bandId]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`${API}/bands/${bandId}/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitations(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez entrer un email ou un pseudo');
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(
        `${API}/bands/${bandId}/invite`,
        { email_or_pseudo: inviteEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        <div>
          <p className="font-semibold">Invitation envoyée !</p>
          <p className="text-sm">Code: <span className="font-mono bg-primary/20 px-2 py-0.5 rounded">{response.data.code}</span></p>
          <p className="text-xs mt-1">Le musicien doit entrer ce code pour rejoindre le groupe</p>
        </div>
      );

      setInviteEmail('');
      fetchInvitations();
      if (onUpdate) onUpdate();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'envoi de l\'invitation';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  const cancelInvitation = async (invitationId) => {
    try {
      await axios.delete(`${API}/bands/${bandId}/invitations/${invitationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invitation annulée');
      fetchInvitations();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  return (
    <div className="space-y-4 p-4 border-2 border-primary/20 rounded-xl bg-primary/5">
      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-primary" />
        <h4 className="font-medium text-primary">Membres du groupe</h4>
      </div>

      {/* Membres actuels */}
      {currentMembers && currentMembers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Membres actuels ({currentMembers.length})</Label>
          <div className="space-y-2">
            {currentMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {member.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{member.name || member.pseudo}</p>
                  <p className="text-xs text-muted-foreground">{member.instrument || 'Musicien'}</p>
                </div>
                {member.is_admin && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inviter un membre */}
      <div className="space-y-3">
        <Label>Inviter un musicien</Label>
        <p className="text-xs text-muted-foreground">
          Entrez l'email ou le pseudo d'un musicien inscrit sur JamConnection
        </p>
        
        <div className="flex gap-2">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendInvitation()}
            placeholder="ex: john.doe@email.com ou JohnDoe"
            className="bg-black/20 border-white/10"
            disabled={sending}
          />
          <Button 
            onClick={sendInvitation} 
            disabled={sending || !inviteEmail.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Inviter
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Invitations en attente */}
      {invitations && invitations.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Invitations en attente ({invitations.length})</Label>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{invitation.invited_email || invitation.invited_pseudo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Code: <span className="font-mono bg-black/20 px-2 py-0.5 rounded">{invitation.code}</span>
                    </p>
                    <button
                      onClick={() => copyCode(invitation.code)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Copier le code"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelInvitation(invitation.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-semibold">Comment ça marche ?</span><br/>
          1. Invitez un musicien par email ou pseudo<br/>
          2. Un code unique sera généré et envoyé par notification<br/>
          3. Le musicien entre le code pour rejoindre le groupe<br/>
          4. Il devient membre et peut être ajouté aux concerts
        </p>
      </div>
    </div>
  );
};

export default BandMembersManager;
