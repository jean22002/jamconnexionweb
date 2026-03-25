import React, { useState } from 'react';
import { KeyRound, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const JoinBandWithCode = ({ token, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const joinBand = async () => {
    if (!code.trim() || code.length !== 6) {
      toast.error('Le code doit contenir 6 caractères');
      return;
    }

    setJoining(true);
    try {
      const response = await axios.post(
        `${API}/bands/join`,
        { code: code.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        <div>
          <p className="font-semibold">🎉 Groupe rejoint !</p>
          <p className="text-sm">Vous êtes maintenant membre de "{response.data.band_name}"</p>
        </div>
      );

      setCode('');
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      const message = error.response?.data?.detail || 'Code invalide ou expiré';
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="rounded-full border-primary/30 hover:bg-primary/10"
      >
        <KeyRound className="w-4 h-4 mr-2" />
        Rejoindre un groupe avec un code
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glassmorphism border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Rejoindre un groupe
            </DialogTitle>
            <DialogDescription>
              Entrez le code d'invitation reçu de l'admin du groupe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Code d'invitation (6 caractères)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && joinBand()}
                placeholder="Ex: ABC123"
                className="bg-black/20 border-white/10 text-center text-2xl font-mono tracking-wider"
                maxLength={6}
                disabled={joining}
              />
              <p className="text-xs text-muted-foreground">
                Le code est fourni par l'administrateur du groupe
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <span className="font-semibold">Où trouver le code ?</span><br/>
                • Dans votre boîte de notifications<br/>
                • Demandez-le directement à l'admin du groupe<br/>
                • Le code est valable 7 jours
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={joining}
              >
                Annuler
              </Button>
              <Button
                onClick={joinBand}
                disabled={joining || code.length !== 6}
                className="bg-primary hover:bg-primary/90"
              >
                {joining ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Rejoindre le groupe
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinBandWithCode;
