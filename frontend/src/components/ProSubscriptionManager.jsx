import React, { useState } from 'react';
import axios from 'axios';
import { Crown, Calendar, CreditCard, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const ProSubscriptionManager = ({ token, subscriptionData, onUpdate }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const response = await axios.post(
        `${API}/api/musicians/me/cancel-subscription`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Abonnement annulé. Vous conservez l\'accès jusqu\'à la fin de la période.');
      setShowCancelDialog(false);
      
      // Refresh subscription data
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'annulation');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (subscriptionData.tier !== 'pro') {
    return null;
  }

  const isActive = subscriptionData.status === 'active';
  const isCanceled = subscriptionData.status === 'canceled';
  const inTrial = subscriptionData.in_trial;

  return (
    <>
      <div className="glassmorphism rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-xl">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Abonnement Musicien PRO
                {isActive && !isCanceled && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    Actif
                  </span>
                )}
                {isCanceled && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                    Expire bientôt
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">6,99€/mois • Annulable à tout moment</p>
            </div>
          </div>
        </div>

        {/* Trial Info */}
        {inTrial && subscriptionData.trial_ends && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Période d'essai gratuite</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscriptionData.trial_days_remaining} jour(s) restant(s)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Premier paiement le {formatDate(subscriptionData.trial_ends)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Canceled Info */}
        {isCanceled && subscriptionData.expires && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Abonnement annulé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Accès PRO jusqu'au {formatDate(subscriptionData.expires)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>Badge PRO vérifié</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>Comptabilité & Factures</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>Analytics avancées</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>Badge GUSO visible</span>
          </div>
        </div>

        {/* Actions */}
        {isActive && !isCanceled && (
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              className="flex-1 rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => setShowCancelDialog(true)}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler l'abonnement
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler l'abonnement PRO ?</DialogTitle>
            <DialogDescription>
              Votre abonnement sera annulé mais vous conserverez l'accès à toutes les fonctionnalités PRO jusqu'à la fin de votre période payée.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-400 mb-1">Que se passe-t-il après l'annulation ?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Vous conservez l'accès PRO jusqu'à {formatDate(subscriptionData.trial_ends || subscriptionData.expires)}</li>
                  <li>• Aucun nouveau paiement ne sera prélevé</li>
                  <li>• Vous perdrez l'accès aux fonctionnalités PRO après cette date</li>
                  <li>• Vous pourrez vous réabonner à tout moment</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={canceling}
            >
              Conserver mon abonnement
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="bg-red-500 hover:bg-red-600"
            >
              {canceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Annulation...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Confirmer l'annulation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProSubscriptionManager;
