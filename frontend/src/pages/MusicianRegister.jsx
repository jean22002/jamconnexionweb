import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function MusicianRegister() {
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
    documentsLegaux: false, // Checkbox 1: Mentions légales + CGU + Confidentialité + Cookies
    rolePlateforme: false, // Checkbox 2
    absenceGarantie: false, // Checkbox 3
    messagerie: false, // Checkbox 4
    responsabilite: false, // Checkbox 5
    statutMusicien: false, // Checkbox 6
    donneesPersonnelles: false // Checkbox 7
  });

  const allLegalAccepted = Object.values(legalAcceptance).every(val => val === true);
  
  // Debug: Log l'état des checkboxes
  useEffect(() => {
    console.log('Legal Acceptance State:', legalAcceptance);
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
      const user = await register(formData.email, formData.password, formData.name, 'musician');
      toast.success('Compte créé avec succès!');
      navigate('/musician');
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
            <h1 className="font-heading font-bold text-xl">Inscription Musicien</h1>
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
              Créez votre compte musicien
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom ou pseudo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Votre nom ou nom de scène"
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

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                {/* 1. Mentions Légales + CGU + Confidentialité */}
                <AcceptanceCheckbox
                  number="1"
                  title="ACCEPTATION OBLIGATOIRE – DOCUMENTS LÉGAUX"
                  description="J'ai lu et j'accepte le Contrat d'utilisation Musicien Jam Connexion, les Conditions Générales d'Utilisation et la Politique de confidentialité. Cette acceptation vaut signature électronique, conformément à l'article 1366 du Code civil."
                  content={
                    <div className="space-y-6 text-sm">
                      <div>
                        <p className="font-bold text-lg mb-3">MENTIONS LÉGALES – MUSICIEN</p>
                        <p className="font-semibold mb-2">Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique</p>
                        <div className="space-y-3 mt-4">
                          <div>
                            <p className="font-semibold">Éditeur du site</p>
                            <p>EI Jam Connexion</p>
                            <p>17 rue de l'Égalité</p>
                            <p>34210 Olonzac – France</p>
                            <p>📧 Email : jamconnexion@gmail.com</p>
                          </div>
                          <div>
                            <p className="font-semibold">Propriété intellectuelle</p>
                            <p>L'ensemble des contenus présents sur le site Jam Connexion est protégé par le droit de la propriété intellectuelle. Toute reproduction ou utilisation non autorisée est interdite.</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-lg mb-3">CONDITIONS GÉNÉRALES D'UTILISATION (CGU) – MUSICIEN</p>
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">Article 1 – Objet</p>
                            <p>Les présentes CGU ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme Jam Connexion par les musiciens.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Article 2 – Accès au service</p>
                            <p>L'inscription et l'utilisation de la plateforme sont gratuites pour les musiciens.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Article 3 – Création et gestion du compte</p>
                            <p>Le musicien s'engage à fournir des informations exactes, sincères et à jour.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Article 4 – Rôle de Jam Connexion</p>
                            <p>Jam Connexion agit exclusivement comme intermédiaire technique de mise en relation. Jam Connexion n'est ni employeur, ni producteur, ni organisateur.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Article 5 – Mise en relation</p>
                            <p>Jam Connexion ne garantit aucune prise de contact, aucun engagement, aucune prestation, aucune rémunération.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Article 6 – Messagerie interne et modération</p>
                            <p>Il est interdit d'utiliser la messagerie pour des propos diffamatoires, du harcèlement, du spam ou des propositions d'activités illégales.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Article 7 – Suspension ou suppression</p>
                            <p>Jam Connexion se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des CGU.</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-lg mb-3">POLITIQUE DE CONFIDENTIALITÉ – MUSICIEN</p>
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">Responsable du traitement</p>
                            <p>EI Jam Connexion - 17 rue de l'Égalité, 34210 Olonzac</p>
                            <p>📧 jamconnexion@gmail.com</p>
                          </div>
                          <div>
                            <p className="font-semibold">Données collectées</p>
                            <p>Nom, prénom ou nom de scène, email, mot de passe (chiffré), informations du profil, données de connexion.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Droits RGPD</p>
                            <p>Droits d'accès, rectification, suppression, opposition. Contact : jamconnexion@gmail.com</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-lg mb-3">POLITIQUE DE COOKIES</p>
                        <p>Cookies nécessaires au fonctionnement, de sécurité, et de mesure d'audience. Durée maximale : 13 mois.</p>
                      </div>
                    </div>
                  }
                  checked={legalAcceptance.documentsLegaux}
                  onCheckedChange={(checked) => setLegalAcceptance({ 
                    ...legalAcceptance, 
                    documentsLegaux: checked
                  })}
                />

                {/* 2. Rôle de la plateforme */}
                <SimpleCheckbox
                  number="2"
                  title="ACCEPTATION OBLIGATOIRE – RÔLE DE LA PLATEFORME"
                  description="Je reconnais que Jam Connexion agit uniquement comme plateforme de mise en relation et n'intervient pas dans les accords conclus avec les établissements."
                  checked={legalAcceptance.rolePlateforme}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, rolePlateforme: checked })}
                />

                {/* 3. Absence de garantie */}
                <SimpleCheckbox
                  number="3"
                  title="ACCEPTATION OBLIGATOIRE – ABSENCE DE GARANTIE"
                  description="Je reconnais que Jam Connexion ne garantit aucun concert, contrat, engagement ni rémunération."
                  checked={legalAcceptance.absenceGarantie}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, absenceGarantie: checked })}
                />

                {/* 4. Messagerie interne */}
                <SimpleCheckbox
                  number="4"
                  title="ACCEPTATION OBLIGATOIRE – MESSAGERIE INTERNE"
                  description="Je m'engage à utiliser la messagerie interne de Jam Connexion de manière professionnelle, respectueuse et conforme à la loi, et j'accepte les règles de modération prévues dans les CGU."
                  checked={legalAcceptance.messagerie}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, messagerie: checked })}
                />

                {/* 5. Responsabilité personnelle */}
                <SimpleCheckbox
                  number="5"
                  title="ACCEPTATION OBLIGATOIRE – RESPONSABILITÉ PERSONNELLE"
                  description="Je reconnais être seul responsable des informations figurant sur mon profil et des messages que j'envoie via la plateforme."
                  checked={legalAcceptance.responsabilite}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, responsabilite: checked })}
                />

                {/* 6. Statut du musicien */}
                <SimpleCheckbox
                  number="6"
                  title="ACCEPTATION RECOMMANDÉE – STATUT DU MUSICIEN"
                  description="Je reconnais que Jam Connexion n'est ni mon employeur, ni mon producteur, ni mon représentant, et que je reste totalement indépendant."
                  checked={legalAcceptance.statutMusicien}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, statutMusicien: checked })}
                />

                {/* 7. Données personnelles */}
                <SimpleCheckbox
                  number="7"
                  title="ACCEPTATION RECOMMANDÉE – DONNÉES PERSONNELLES"
                  description="J'accepte que mes données personnelles soient traitées conformément à la Politique de confidentialité de Jam Connexion et au RGPD."
                  checked={legalAcceptance.donneesPersonnelles}
                  onCheckedChange={(checked) => setLegalAcceptance({ ...legalAcceptance, donneesPersonnelles: checked })}
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

function AcceptanceCheckbox({ number, title, description, content, checked, onCheckedChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="p-4 bg-white/5">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            className="border-white/30 mt-1"
          />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">{number}️⃣ {title}</p>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-sm text-primary hover:underline"
              type="button"
            >
              {isOpen ? 'Masquer les documents' : 'Lire les documents complets'}
            </button>
          </div>
          {checked && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-6 bg-black/20 border-t border-white/10 max-h-96 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}

function SimpleCheckbox({ number, title, description, checked, onCheckedChange }) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/5">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="border-white/30 mt-1"
        />
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">{number}️⃣ {title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {checked && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
      </div>
    </div>
  );
}
