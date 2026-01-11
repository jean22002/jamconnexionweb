import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function VenueRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Legal
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const [legalAcceptance, setLegalAcceptance] = useState({
    mentionsLegales: false,
    cgu: false,
    cgv: false,
    confidentialite: false,
    cookies: false
  });

  const allLegalAccepted = Object.values(legalAcceptance).every(val => val === true);
  
  // Debug: Log l'état des checkboxes
  useEffect(() => {
    console.log('Venue Legal Acceptance State:', legalAcceptance);
    console.log('All Legal Accepted:', allLegalAccepted);
  }, [legalAcceptance, allLegalAccepted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validate first step
      if (!formData.email || !formData.password || !formData.name) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Register
    if (!allLegalAccepted) {
      toast.error('Vous devez accepter toutes les conditions pour continuer');
      return;
    }

    setLoading(true);
    try {
      const user = await register(formData.email, formData.password, formData.name, 'venue');
      toast.success('Compte créé avec succès!');
      navigate('/venue');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <h1 className="font-heading font-bold text-xl">Inscription Établissement</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <div className={`flex items-center gap-2 ${
            step === 1 ? 'text-primary' : 'text-green-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'
            }`}>
              {step === 1 ? '1' : <Check className="w-5 h-5" />}
            </div>
            <span className="font-semibold hidden sm:inline">Informations</span>
          </div>
          <div className="w-12 h-0.5 bg-white/20"></div>
          <div className={`flex items-center gap-2 ${
            step === 2 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              2
            </div>
            <span className="font-semibold hidden sm:inline">Conditions</span>
          </div>
        </div>

        {/* Step 1: Info */}
        {step === 1 && (
          <div className="glassmorphism rounded-2xl p-8 border border-white/10">
            <h2 className="font-heading font-bold text-2xl mb-6 text-center">
              Créez votre compte établissement
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'établissement *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom de votre établissement"
                  required
                  className="bg-black/20 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre@email.com"
                  required
                  className="bg-black/20 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="bg-black/20 border-white/10"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 text-lg"
              >
                Continuer
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Vous avez déjà un compte ?{' '}
              <Link to="/auth" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Legal */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="glassmorphism rounded-2xl p-8 border border-white/10">
              <h2 className="font-heading font-bold text-2xl mb-6 text-center">
                Conditions d'utilisation
              </h2>
              
              <p className="text-center text-muted-foreground mb-8">
                Veuillez lire et accepter les conditions suivantes pour finaliser votre inscription
              </p>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                {/* Mentions Légales */}
                <LegalSection
                  title="MENTIONS LÉGALES"
                  content={
                    <div className="space-y-4 text-sm">
                      <p className="font-semibold">Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site Jam Connexion l'identité des différents intervenants.</p>
                      
                      <div>
                        <p className="font-semibold mb-2">Éditeur du site</p>
                        <p>EI Jam Connexion</p>
                        <p>17 rue de l'Égalité</p>
                        <p>34210 Olonzac – France</p>
                        <p>📧 Email : jamconnexion@gmail.com</p>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Responsable de la publication</p>
                        <p>EI Jam Connexion</p>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Propriété intellectuelle</p>
                        <p>L'ensemble des contenus présents sur le site Jam Connexion (textes, graphismes, logos, structure, etc.) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou utilisation non autorisée est interdite.</p>
                      </div>
                    </div>
                  }
                  checked={legalAcceptance.mentionsLegales}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, mentionsLegales: Boolean(checked) })}
                />

                {/* CGU */}
                <LegalSection
                  title="CONDITIONS GÉNÉRALES D'UTILISATION (CGU)"
                  content={
                    <div className="space-y-4 text-sm">
                      <p className="font-semibold">Article 1 – Objet</p>
                      <p>Les présentes CGU définissent les modalités d'accès et d'utilisation de la plateforme Jam Connexion par les établissements souhaitant entrer en relation avec des musiciens.</p>

                      <p className="font-semibold">Article 2 – Accès au service</p>
                      <p>L'accès au service nécessite la création d'un compte établissement. Certaines fonctionnalités sont accessibles gratuitement pendant une période limitée, puis via un abonnement payant.</p>

                      <p className="font-semibold">Article 3 – Création et gestion du compte</p>
                      <p>L'établissement s'engage à fournir des informations exactes, complètes et à jour. Il est responsable de l'utilisation de son compte et de ses identifiants.</p>

                      <p className="font-semibold">Article 4 – Rôle de Jam Connexion</p>
                      <p>Jam Connexion agit exclusivement comme intermédiaire technique de mise en relation. Jam Connexion n'est pas partie aux contrats conclus entre les établissements et les musiciens.</p>

                      <p className="font-semibold">Article 5 – Messagerie interne et modération</p>
                      <p>Une messagerie interne permet les échanges avec les musiciens. Il est interdit d'utiliser la messagerie pour des propos diffamatoires, injurieux ou discriminatoires, du harcèlement ou des menaces, du spam ou du démarchage abusif, des propositions illégales, notamment du travail dissimulé. L'établissement est seul responsable des messages envoyés. Jam Connexion agit en qualité d'hébergeur et peut supprimer tout contenu illicite après signalement.</p>

                      <p className="font-semibold">Article 6 – Suspension ou suppression de compte</p>
                      <p>Jam Connexion se réserve le droit de suspendre ou supprimer un compte établissement en cas de non-respect des présentes CGU.</p>

                      <p className="font-semibold">Article 7 – Outil de statistiques et d'analyse</p>
                      <p>Jam Connexion met à disposition des établissements un outil d'analyse et de suivi leur permettant d'obtenir des indicateurs de rentabilité liés à leurs événements (exemples : historique, statistiques, filtres, comparatif).</p>
                      <p>Cet outil est fourni à titre strictement informatif.</p>
                      <p>Les résultats affichés ne constituent ni un conseil, ni une recommandation, ni une garantie de performance économique ou commerciale.</p>
                      <p>L'établissement demeure seul responsable de l'interprétation et de l'utilisation des résultats.</p>
                      <p>Jam Connexion ne peut être tenu responsable de décisions ou d'actions prises sur la base des informations issues de cet outil.</p>

                      <p className="font-semibold">Article 8 – Responsabilité</p>
                      <p>Jam Connexion est tenu à une obligation de moyens. Aucune garantie n'est donnée quant aux résultats de mise en relation.</p>

                      <p className="font-semibold">Article 9 – Données personnelles</p>
                      <p>Les données sont traitées conformément à la Politique de confidentialité et au RGPD.</p>

                      <p className="font-semibold">Article 10 – Modification des CGU</p>
                      <p>Jam Connexion peut modifier les CGU à tout moment.</p>

                      <p className="font-semibold">Article 11 – Droit applicable</p>
                      <p>Les présentes CGU sont soumises au droit français.</p>
                    </div>
                  }
                  checked={legalAcceptance.cgu}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, cgu: Boolean(checked) })}
                />

                {/* CGV */}
                <LegalSection
                  title="CONDITIONS GÉNÉRALES DE VENTE (CGV)"
                  content={
                    <div className="space-y-4 text-sm">
                      <p className="font-semibold">Article 1 – Objet</p>
                      <p>Les présentes CGV encadrent les conditions d'abonnement payant proposé aux établissements via la plateforme Jam Connexion.</p>

                      <p className="font-semibold">Article 2 – Période d'essai</p>
                      <p>Chaque établissement bénéficie d'une période d'essai gratuite de deux (2) mois. À l'issue de l'essai, l'abonnement débute automatiquement sauf résiliation préalable.</p>

                      <p className="font-semibold">Article 3 – Tarifs</p>
                      <p>Le tarif de l'abonnement est de : <strong>14,99 € TTC par mois</strong></p>

                      <p className="font-semibold">Article 4 – Paiement</p>
                      <p>Le paiement est mensuel et effectué à la date anniversaire de l'abonnement.</p>

                      <p className="font-semibold">Article 5 – Durée et résiliation</p>
                      <p>L'abonnement est sans engagement. La résiliation est possible à tout moment. Elle prend effet à la date anniversaire du mois suivant la demande de résiliation. L'accès au service reste actif jusqu'à cette date.</p>

                      <p className="font-semibold">Article 6 – Remboursement</p>
                      <p>Aucun remboursement automatique n'est prévu. Un remboursement mensuel peut être accordé uniquement en cas de dysfonctionnement technique avéré, imputable au site, ayant empêché l'utilisation normale du service.</p>

                      <p className="font-semibold">Article 7 – Responsabilité</p>
                      <p>Jam Connexion ne garantit ni contacts, ni contrats, ni résultats commerciaux.</p>

                      <p className="font-semibold">Article 8 – Absence de garantie commerciale</p>
                      <p>Les statistiques, indicateurs et informations fournis via l'outil d'analyse ne constituent en aucun cas une garantie de mise en relation, de fréquentation, ou de rentabilité des événements.</p>

                      <p className="font-semibold">Article 9 – Modification des CGV</p>
                      <p>Jam Connexion se réserve le droit de modifier les CGV à tout moment.</p>

                      <p className="font-semibold">Article 10 – Droit applicable</p>
                      <p>Les présentes CGV sont soumises au droit français.</p>
                    </div>
                  }
                  checked={legalAcceptance.cgv}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, cgv: Boolean(checked) })}
                />

                {/* Confidentialité */}
                <LegalSection
                  title="POLITIQUE DE CONFIDENTIALITÉ"
                  content={
                    <div className="space-y-4 text-sm">
                      <p className="font-semibold">Responsable du traitement</p>
                      <p>EI Jam Connexion<br/>17 rue de l'Égalité – 34210 Olonzac<br/>📧 jamconnexion@gmail.com</p>

                      <p className="font-semibold">Données collectées</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Nom de l'établissement</li>
                        <li>Nom du représentant</li>
                        <li>Adresse email</li>
                        <li>Mot de passe (chiffré)</li>
                        <li>Informations du profil</li>
                        <li>Données de connexion</li>
                      </ul>

                      <p className="font-semibold">Finalités</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Création et gestion du compte établissement</li>
                        <li>Mise en relation avec les musiciens</li>
                        <li>Gestion des abonnements</li>
                        <li>Sécurité du site</li>
                      </ul>

                      <p className="font-semibold">Conservation</p>
                      <p>Les données sont conservées pendant la durée du compte et conformément aux obligations légales.</p>

                      <p className="font-semibold">Traitement des données d'événements</p>
                      <p>Dans le cadre de l'outil d'analyse, Jam Connexion peut traiter des informations relatives aux événements organisés par l'établissement (date, type, style, rentabilité estimée, données historiques).</p>
                      <p>Ces données sont utilisées exclusivement pour le fonctionnement de l'outil d'analyse et ne sont ni vendues, ni transmises à des tiers.</p>

                      <p className="font-semibold">Droits</p>
                      <p>Conformément au RGPD, l'établissement dispose de droits d'accès, rectification, suppression et opposition.</p>

                      <p className="font-semibold">Réclamation</p>
                      <p>Une réclamation peut être déposée auprès de la CNIL.</p>
                    </div>
                  }
                  checked={legalAcceptance.confidentialite}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, confidentialite: Boolean(checked) })}
                />

                {/* Cookies */}
                <LegalSection
                  title="POLITIQUE DE COOKIES"
                  content={
                    <div className="space-y-4 text-sm">
                      <p className="font-semibold">Utilisation</p>
                      <p>Jam Connexion utilise des cookies nécessaires au fonctionnement du site, de sécurité, et de mesure d'audience (si activés).</p>

                      <p className="font-semibold">Consentement</p>
                      <p>Un bandeau permet d'accepter ou refuser les cookies non essentiels.</p>

                      <p className="font-semibold">Durée</p>
                      <p>Les cookies sont conservés pour une durée maximale de 13 mois.</p>
                    </div>
                  }
                  checked={legalAcceptance.cookies}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, cookies: Boolean(checked) })}
                />
              </div>

              {/* Warning Message */}
              {!allLegalAccepted && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                  <X className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-500">Toutes les cases doivent être cochées</p>
                    <p className="text-muted-foreground mt-1">
                      Vous devez accepter toutes les conditions pour continuer votre inscription
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 rounded-full py-6"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!allLegalAccepted || loading}
                  className={`flex-1 rounded-full py-6 ${
                    allLegalAccepted 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Création...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> Continuer et créer mon compte</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LegalSection({ title, content, checked, onCheckedChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="p-4 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Checkbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            className="border-white/30"
          />
          <div>
            <p className="font-semibold">{title}</p>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-sm text-primary hover:underline mt-1"
              type="button"
            >
              {isOpen ? 'Masquer' : 'Lire le document'}
            </button>
          </div>
        </div>
        {checked && <Check className="w-5 h-5 text-green-500" />}
      </div>
      
      {isOpen && (
        <div className="p-6 bg-black/20 border-t border-white/10 max-h-96 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}
