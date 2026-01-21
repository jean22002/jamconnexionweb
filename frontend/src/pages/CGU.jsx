import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, Music } from "lucide-react";

export default function CGU() {
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
        <h1 className="font-heading font-bold text-4xl mb-8 text-gradient">CONDITIONS GÉNÉRALES D'UTILISATION (CGU)</h1>
        
        <div className="glassmorphism rounded-3xl p-8 space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 1 – Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme Jam Connexion par tous les utilisateurs (musiciens, mélomanes, et établissements).</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 2 – Accès à la plateforme</h2>
            <p>L'accès à Jam Connexion nécessite la création d'un compte utilisateur. L'utilisateur doit fournir des informations exactes et complètes lors de son inscription. Il est responsable de la confidentialité de ses identifiants de connexion.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 3 – Services proposés</h2>
            <p className="mb-2">Jam Connexion met en relation des musiciens et des établissements de spectacle vivant. Les services incluent :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Création de profils publics (musiciens, établissements)</li>
              <li>Recherche et découverte de musiciens ou d'établissements</li>
              <li>Système de messagerie interne</li>
              <li>Gestion d'événements (concerts, jams, spectacles, karaoké)</li>
              <li>Système de notifications</li>
              <li>Abonnement aux établissements</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 4 – Obligations des utilisateurs</h2>
            <p className="mb-2">L'utilisateur s'engage à :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Utiliser la plateforme de manière conforme à la loi et aux bonnes mœurs</li>
              <li>Ne pas diffuser de contenu illégal, offensant, discriminatoire ou diffamatoire</li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>Ne pas usurper l'identité d'un tiers</li>
              <li>Utiliser la messagerie de manière professionnelle et respectueuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 5 – Propriété intellectuelle</h2>
            <p>Tous les contenus présents sur Jam Connexion (textes, images, logos, etc.) sont protégés par le droit d'auteur. Toute reproduction ou utilisation sans autorisation est interdite. L'utilisateur conserve la propriété intellectuelle des contenus qu'il publie sur la plateforme.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 6 – Données personnelles</h2>
            <p>Jam Connexion collecte et traite des données personnelles conformément au RGPD. Pour plus d'informations, consultez notre Politique de confidentialité.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 7 – Responsabilité</h2>
            <p>Jam Connexion ne peut être tenue responsable des relations contractuelles ou conflits qui pourraient survenir entre utilisateurs. La plateforme agit uniquement en tant qu'intermédiaire de mise en relation.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 8 – Suspension ou suppression de compte</h2>
            <p>Jam Connexion se réserve le droit de suspendre ou supprimer un compte utilisateur en cas de non-respect des présentes CGU, d'utilisation abusive ou de comportement illégal.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 9 – Modification des CGU</h2>
            <p>Jam Connexion peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par notification ou email. La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles CGU.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 10 – Droit applicable et juridiction</h2>
            <p>Les présentes CGU sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront compétents.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">Article 11 – Contact</h2>
            <p>Pour toute question concernant les présentes CGU, vous pouvez nous contacter via la plateforme ou à l'adresse : support@jamconnexion.fr</p>
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
