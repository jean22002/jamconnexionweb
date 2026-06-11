import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, Music, Cookie, Shield, BarChart3, Megaphone } from "lucide-react";

/**
 * Politique de cookies publique (Build 95.4).
 *
 * Page de transparence détaillée sur les cookies utilisés par Jam Connexion.
 * Conforme aux exigences CNIL (information claire, exhaustive, accessible
 * sans connexion).
 */
export default function Cookies() {
  return (
    <div className="min-h-screen bg-background" data-testid="cookies-page">
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-4xl text-gradient">
            Politique de cookies
          </h1>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          Dernière mise à jour : 9 février 2026
        </p>

        <div className="glassmorphism rounded-3xl p-8 space-y-8 text-muted-foreground">
          {/* Intro */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Qu&apos;est-ce qu&apos;un cookie&nbsp;?
            </h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil
              (ordinateur, smartphone, tablette) lorsque vous visitez un site
              web ou utilisez une application. Il permet au service de mémoriser
              vos préférences, de mesurer son audience ou, avec votre accord,
              d&apos;afficher des publicités adaptées à vos centres d&apos;intérêt.
            </p>
            <p className="mt-3">
              Sur Jam Connexion (web et application mobile), nous utilisons
              différentes catégories de cookies et de technologies similaires
              (localStorage, AsyncStorage, SDK publicitaires). Le détail est
              fourni ci-dessous en toute transparence.
            </p>
          </section>

          {/* Cookies essentiels */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-400" />
              <h2 className="font-heading font-semibold text-2xl text-white">
                Cookies essentiels
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                Obligatoires
              </span>
            </div>
            <p className="mb-4">
              Ces cookies sont strictement nécessaires au fonctionnement du
              service. Ils ne peuvent pas être désactivés. Aucun consentement
              n&apos;est requis (article 82 de la loi Informatique et Libertés).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-white">Nom</th>
                    <th className="text-left py-2 pr-4 text-white">Finalité</th>
                    <th className="text-left py-2 text-white">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4 font-mono text-xs text-primary">jc_auth</td>
                    <td className="py-3 pr-4">Maintenir la session connectée</td>
                    <td className="py-3 text-xs">30 jours</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4 font-mono text-xs text-primary">jc_ad_consent_v1</td>
                    <td className="py-3 pr-4">Mémoriser votre choix de consentement publicitaire</td>
                    <td className="py-3 text-xs">12 mois</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4 font-mono text-xs text-primary">musician_activeTab / melomane_activeTab</td>
                    <td className="py-3 pr-4">Conserver l&apos;onglet actif du tableau de bord</td>
                    <td className="py-3 text-xs">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Cookies publicitaires */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-orange-400" />
              <h2 className="font-heading font-semibold text-2xl text-white">
                Cookies publicitaires
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Consentement requis
              </span>
            </div>
            <p className="mb-4">
              Ces cookies, déposés par Google AdSense (web) et Google AdMob
              (mobile), permettent d&apos;afficher des publicités personnalisées
              en fonction de vos centres d&apos;intérêt. Ils financent la
              version gratuite de Jam Connexion. Vous pouvez les{" "}
              <strong className="text-white">accepter ou refuser à tout moment</strong>{" "}
              depuis le bandeau de consentement ou via{" "}
              <em>Mon profil → Paramètres → Préférences publicitaires</em>.
            </p>

            <div className="space-y-3 mb-4">
              <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="font-semibold text-white">Google AdSense (Web)</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    publisher ID&nbsp;: ca-pub-9998561845977424
                  </span>
                </div>
                <p className="text-sm">
                  Affichage de bannières publicitaires sur le site web pour les
                  utilisateurs mélomanes et musiciens gratuits. Aucune publicité
                  pour les établissements ni pour les abonnés PRO.{" "}
                  <a
                    href="https://policies.google.com/technologies/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Politique Google
                  </a>
                </p>
              </div>

              <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="font-semibold text-white">Google AdMob (Mobile)</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    iOS / Android
                  </span>
                </div>
                <p className="text-sm">
                  Affichage de publicités interstitielles et bannières dans
                  l&apos;application mobile pour les utilisateurs gratuits.
                  Aucune publicité pour les établissements ni pour les
                  abonnés PRO.{" "}
                  <a
                    href="https://support.google.com/admob/answer/7686480"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Politique AdMob
                  </a>
                </p>
              </div>
            </div>

            <div className="text-sm p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="font-semibold text-white mb-1">🛡️ Mode RGPD</p>
              <p>
                Jam Connexion utilise{" "}
                <strong className="text-white">Google Consent Mode v2</strong>{" "}
                : par défaut, tous les signaux publicitaires sont refusés (denied).
                Aucune publicité personnalisée ne peut être affichée tant que vous
                n&apos;avez pas explicitement donné votre accord.
              </p>
              <p className="mt-2">
                En cas de refus, seules des publicités{" "}
                <strong className="text-white">non-personnalisées (NPA)</strong>{" "}
                peuvent éventuellement être affichées, sans collecte de données
                comportementales.
              </p>
            </div>
          </section>

          {/* Mesure d'audience */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h2 className="font-heading font-semibold text-2xl text-white">
                Mesure d&apos;audience
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Consentement requis
              </span>
            </div>
            <p>
              Lorsque vous acceptez le consentement publicitaire, Google peut
              également collecter des données statistiques anonymes
              (<code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">analytics_storage</code>) pour mesurer
              l&apos;audience et améliorer le service. Ces données ne permettent
              pas de vous identifier personnellement.
            </p>
          </section>

          {/* Gestion */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Comment gérer vos cookies&nbsp;?
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-white">Lors de votre 1ʳᵉ visite</strong> :
                un bandeau apparaît en bas d&apos;écran (web) ou un formulaire
                Google (mobile). Vous choisissez Accepter ou Refuser.
              </li>
              <li>
                <strong className="text-white">À tout moment</strong> : depuis{" "}
                <em>Mon profil → Paramètres → Préférences publicitaires</em>{" "}
                (web et mobile). Vous pouvez modifier votre choix librement.
              </li>
              <li>
                <strong className="text-white">Depuis votre navigateur</strong> :
                vous pouvez supprimer les cookies manuellement via les paramètres
                de Chrome, Firefox, Safari, Edge, etc.
              </li>
              <li>
                <strong className="text-white">Sur mobile</strong> : la
                réinitialisation de l&apos;identifiant publicitaire (IDFA iOS /
                AAID Android) est possible dans les réglages de votre appareil.
              </li>
            </ul>
          </section>

          {/* Droits */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Vos droits RGPD
            </h2>
            <p className="mb-3">
              Conformément au Règlement Général sur la Protection des Données
              (RGPD) et à la loi Informatique et Libertés, vous disposez à tout
              moment des droits suivants&nbsp;:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Droit d&apos;accès à vos données personnelles</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
              <li>Droit d&apos;opposition au traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous depuis votre profil ou
              écrivez-nous via les voies habituelles. Vous pouvez également
              introduire une réclamation auprès de la{" "}
              <a
                href="https://www.cnil.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                CNIL
              </a>.
            </p>
          </section>

          {/* Modification */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Modification de cette politique
            </h2>
            <p>
              Jam Connexion peut être amené à modifier cette politique de
              cookies à tout moment, notamment pour se conformer à des
              évolutions légales, réglementaires ou techniques. La date de
              dernière mise à jour figure en haut de cette page.
            </p>
          </section>

          {/* Liens utiles */}
          <section className="pt-6 border-t border-white/10">
            <h2 className="font-heading font-semibold text-xl text-white mb-4">
              Liens utiles
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/cgu"
                className="text-sm px-4 py-2 rounded-full bg-black/20 border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
              >
                Conditions générales d&apos;utilisation
              </Link>
              <a
                href="https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2 rounded-full bg-black/20 border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
              >
                CNIL — Cookies et traceurs
              </a>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2 rounded-full bg-black/20 border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
              >
                Politique de confidentialité Google
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
