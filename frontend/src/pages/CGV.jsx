import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, Music } from "lucide-react";

export default function CGV() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading font-bold text-4xl mb-8 text-gradient">CONDITIONS GÉNÉRALES DE VENTE (CGV)</h1>
        
        <div className="glassmorphism rounded-3xl p-8 space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 1 – Objet</h2>
            <p>Les présentes Conditions Générales de Vente (CGV) encadrent les conditions d'abonnement payant proposé aux établissements via la plateforme Jam Connexion.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 2 – Services proposés</h2>
            <p className="mb-2">Jam Connexion propose un service d'abonnement mensuel aux établissements incluant :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Accès illimité à la plateforme</li>
              <li>Création et gestion d'événements</li>
              <li>Système de notifications broadcast aux abonnés</li>
              <li>Gestion des candidatures de musiciens</li>
              <li>Messagerie interne illimitée</li>
              <li>Visibilité dans les recherches de musiciens</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 3 – Prix et paiement</h2>
            <p className="mb-2">L'abonnement mensuel est facturé au tarif en vigueur affiché sur la plateforme. Le paiement s'effectue par carte bancaire via un prestataire de paiement sécurisé (Stripe).</p>
            <p>Le prix de l'abonnement peut être modifié à tout moment, mais les modifications ne s'appliqueront qu'aux nouveaux abonnements ou aux renouvellements suivants.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 4 – Période d'essai</h2>
            <p>Une période d'essai gratuite peut être proposée lors de l'inscription. À l'issue de cette période, l'abonnement devient payant sauf résiliation explicite avant la fin de l'essai.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 5 – Durée et renouvellement</h2>
            <p>L'abonnement est souscrit pour une durée d'un mois, renouvelable tacitement. Le prélèvement s'effectue automatiquement chaque mois à la date anniversaire de souscription.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 6 – Résiliation</h2>
            <p>L'établissement peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prendra effet à la fin de la période d'abonnement en cours, sans remboursement de la période non utilisée.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 7 – Droit de rétractation</h2>
            <p>Conformément à l'article L221-28 du Code de la consommation, l'établissement dispose d'un délai de rétractation de 14 jours à compter de la souscription de l'abonnement. Toutefois, ce droit est perdu dès lors que l'établissement a commencé à utiliser les services de la plateforme.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 8 – Facturation</h2>
            <p>Une facture est automatiquement générée et envoyée par email à chaque prélèvement. Les factures sont également accessibles depuis l'espace personnel de l'établissement.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 9 – Suspension pour impayé</h2>
            <p>En cas d'échec de paiement, Jam Connexion se réserve le droit de suspendre l'accès à la plateforme après notification par email. L'accès sera rétabli dès régularisation du paiement.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 10 – Responsabilité</h2>
            <p>Jam Connexion ne peut être tenue responsable des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme. La responsabilité de Jam Connexion est limitée au montant de l'abonnement mensuel.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 11 – Modification des CGV</h2>
            <p>Jam Connexion peut modifier les présentes CGV à tout moment. Les établissements seront informés par email des modifications. La poursuite de l'abonnement après modification vaut acceptation des nouvelles CGV.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 12 – Règlement des litiges</h2>
            <p className="mb-2">En cas de litige, l'établissement peut saisir gratuitement le médiateur de la consommation :</p>
            <ul className="list-none ml-4 space-y-1">
              <li>• Médiateur de la consommation</li>
              <li>• Email : mediation@jamconnexion.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 13 – Droit applicable</h2>
            <p>Les présentes CGV sont soumises au droit français. En cas de litige non résolu à l'amiable, les tribunaux français seront compétents.</p>
          </section>

          <div className="pt-6 mt-6 border-t border-white/10">
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Janvier 2026</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
