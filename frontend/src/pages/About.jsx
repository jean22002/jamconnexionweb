import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, Music, Heart, Users, MapPin, Sparkles } from "lucide-react";

/**
 * Page À propos publique — Build 95.7
 *
 * Signal E-E-A-T (Expertise, Experience, Authoritativeness, Trustworthiness)
 * pour Google : humanise le site, montre qu'il y a une équipe derrière le contenu.
 * Aide à qualifier AdSense et à éviter le classement "scaled content".
 */
export default function About() {
  return (
    <div className="min-h-screen bg-background" data-testid="about-page">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-gradient">
            À propos
          </h1>
        </div>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          {/* Notre histoire */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Notre histoire
            </h2>
            <p className="mb-4">
              Jam Connexion est né d&apos;un constat simple : organiser une jam
              session, trouver des musiciens, ou démarcher une salle de concert
              relève souvent du parcours du combattant en France. Les outils
              existants sont éparpillés, parfois obsolètes, et rarement pensés
              pour les <strong className="text-white">musiciens vivants</strong>{" "}
              de tous niveaux.
            </p>
            <p>
              Lancée en 2024 par une équipe de musiciens et de développeurs
              passionnés, la plateforme rassemble aujourd&apos;hui musiciens
              amateurs, semi-professionnels, intermittents, mélomanes et
              établissements partout en France pour faciliter les rencontres
              musicales et la programmation locale.
            </p>
          </section>

          {/* Notre mission */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Notre mission
            </h2>
            <p className="mb-4">
              Faire vivre la musique live partout, plus simplement. Concrètement :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Aider les <strong className="text-white">musiciens</strong> à trouver des concerts, des jams et des partenaires de scène</li>
              <li>Permettre aux <strong className="text-white">établissements</strong> (bars, salles, restaurants) de programmer facilement des soirées musicales</li>
              <li>Offrir aux <strong className="text-white">mélomanes</strong> une vue claire sur les événements musicaux près de chez eux</li>
              <li>Centraliser l&apos;<strong className="text-white">administratif</strong> (cachets, GUSO, facturation) pour soulager les musiciens</li>
            </ul>
          </section>

          {/* Nos valeurs */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Nos valeurs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glassmorphism rounded-xl p-4 border border-white/10">
                <Sparkles className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-semibold text-white mb-1">Authenticité</h3>
                <p className="text-sm">Chaque concert, chaque profil, chaque jam est créé par de vraies personnes pour de vrais musiciens.</p>
              </div>
              <div className="glassmorphism rounded-xl p-4 border border-white/10">
                <Users className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-semibold text-white mb-1">Communauté</h3>
                <p className="text-sm">Pas de pression commerciale ni de filtre algorithmique opaque. La musique vivante reste un échange humain.</p>
              </div>
              <div className="glassmorphism rounded-xl p-4 border border-white/10">
                <MapPin className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-semibold text-white mb-1">Ancrage local</h3>
                <p className="text-sm">Notre attention va aux scènes locales : Paris, Lyon, Marseille, mais aussi villes moyennes et zones rurales.</p>
              </div>
              <div className="glassmorphism rounded-xl p-4 border border-white/10">
                <Heart className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-semibold text-white mb-1">Accessibilité</h3>
                <p className="text-sm">La plateforme est gratuite pour les musiciens et mélomanes. Un abonnement PRO existe pour les usages professionnels.</p>
              </div>
            </div>
          </section>

          {/* Notre approche éditoriale */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Notre approche éditoriale
            </h2>
            <p className="mb-4">
              Les articles de notre blog sont rédigés par notre équipe et
              s&apos;appuient sur l&apos;expérience concrète de musiciens et
              d&apos;organisateurs de concerts en France. Lorsque nous utilisons
              des outils d&apos;assistance à la rédaction (correction, recherche,
              synthèse), <strong className="text-white">le contenu est toujours
              relu, vérifié et validé manuellement</strong> avant publication.
            </p>
            <p>
              Notre objectif : produire des guides honnêtes, actionnables et
              spécifiques au contexte français — statut intermittent, GUSO,
              démarches administratives, scènes locales. Pas de copié-collé, pas
              de bourrage de mots-clés, pas de chasse aux clics.
            </p>
          </section>

          {/* Nous contacter */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-white mb-4">
              Nous contacter
            </h2>
            <p className="mb-4">
              Une question, une suggestion, un bug à signaler, une opportunité
              de partenariat ? Nous sommes joignables&nbsp;:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Depuis votre <strong className="text-white">profil utilisateur</strong> (menu &gt; aide / contact)</li>
              <li>Par email à <a href="mailto:contact@jamconnexion.com" className="text-primary underline hover:text-primary/80">contact@jamconnexion.com</a></li>
              <li>Pour les signalements urgents (contenu inapproprié, bug critique) : <a href="mailto:bugjamconnexion@gmail.com" className="text-primary underline hover:text-primary/80">bugjamconnexion@gmail.com</a></li>
            </ul>
          </section>

          {/* CTA */}
          <div className="mt-12 p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center">
            <p className="font-heading font-semibold text-lg mb-2">
              🎵 Rejoignez la communauté
            </p>
            <p className="text-sm mb-4">
              Que vous soyez musicien, mélomane ou établissement, créez votre compte
              gratuit en moins d&apos;une minute.
            </p>
            <Link to="/auth">
              <Button className="rounded-full bg-primary hover:bg-primary/90" data-testid="about-cta-signup">
                Créer mon compte
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
