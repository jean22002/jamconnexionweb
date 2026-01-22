import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [openSection, setOpenSection] = useState(null);
  const [userType, setUserType] = useState('venue'); // 'venue' or 'musician'

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const venueFAQ = [
    {
      question: "L'inscription est-elle payante ?",
      answer: "L'inscription est gratuite et inclut une période d'essai de deux (2) mois. À l'issue de cette période, l'abonnement démarre automatiquement au tarif de 12,99 € TTC par mois, sauf résiliation préalable."
    },
    {
      question: "Puis-je résilier mon abonnement à tout moment ?",
      answer: "Oui. L'abonnement est sans engagement et peut être résilié à tout moment depuis votre espace établissement ou par demande écrite. Toutefois, la résiliation prend effet à la date anniversaire du mois suivant. L'accès au service reste actif jusqu'à cette date."
    },
    {
      question: "Que se passe-t-il après la résiliation ?",
      answer: "Même après la résiliation, vous conservez l'accès aux services jusqu'à la fin de la période mensuelle en cours. Aucun nouveau prélèvement ne sera effectué après cette date."
    },
    {
      question: "Puis-je être remboursé ?",
      answer: "Un remboursement n'est pas automatique. Un remboursement mensuel peut être accordé uniquement en cas de dysfonctionnement technique majeur du site, directement imputable à Jam Connexion, et ayant empêché l'utilisation normale du service. Aucun remboursement ne sera accordé en cas de non-utilisation ou d'absence de mise en relation."
    },
    {
      question: "Jam Connexion garantit-il des musiciens ou des prestations ?",
      answer: "Non. Jam Connexion est une plateforme de mise en relation uniquement. Le site ne garantit : ni le nombre de musiciens contactés, ni la conclusion de contrats, ni la réussite des collaborations."
    },
    {
      question: "Jam Connexion intervient-il dans les contrats avec les musiciens ?",
      answer: "Non. Jam Connexion n'intervient en aucun cas dans les accords conclus entre l'établissement et les musiciens (cachets, horaires, déclarations, matériel, etc.)."
    },
    {
      question: "Comment fonctionne la messagerie interne ?",
      answer: "La messagerie interne permet d'échanger directement avec les musiciens via la plateforme. Les échanges doivent rester professionnels, respectueux et conformes à la loi. Tout abus peut entraîner la suppression de messages ou du compte."
    },
    {
      question: "Les messages sont-ils lus ou modérés ?",
      answer: "Les messages ne sont pas lus de manière systématique. Jam Connexion agit en qualité d'hébergeur et peut intervenir uniquement en cas de signalement ou d'abus avéré, conformément à la loi."
    },
    {
      question: "Puis-je signaler un comportement abusif ?",
      answer: "Oui. Tout message ou comportement abusif peut être signalé à l'adresse suivante : jamconnexion@gmail.com"
    },
    {
      question: "Que deviennent mes données personnelles ?",
      answer: "Les données personnelles sont traitées conformément au RGPD et à la Politique de confidentialité. Vous disposez de droits d'accès, de rectification, de suppression et d'opposition."
    },
    {
      question: "Que se passe-t-il si je ne respecte pas les règles ?",
      answer: "En cas de non-respect des CGU ou d'utilisation abusive de la plateforme, Jam Connexion se réserve le droit de : suspendre temporairement le compte, ou supprimer définitivement le compte établissement."
    },
    {
      question: "Qui puis-je contacter en cas de question ?",
      answer: "Pour toute question, assistance ou réclamation, vous pouvez contacter : jamconnexion@gmail.com"
    }
  ];

  const musicianFAQ = [
    {
      question: "L'inscription est-elle payante ?",
      answer: "Non. L'inscription et l'utilisation de Jam Connexion sont entièrement gratuites pour les musiciens."
    },
    {
      question: "Jam Connexion garantit-il des concerts ou des contrats ?",
      answer: "Non. Jam Connexion est une plateforme de mise en relation uniquement. Aucun concert, contrat ou rémunération n'est garanti."
    },
    {
      question: "Jam Connexion intervient-il dans les accords avec les établissements ?",
      answer: "Non. Jam Connexion n'intervient en aucun cas dans les accords conclus entre le musicien et l'établissement (cachet, horaires, déclarations, matériel, etc.)."
    },
    {
      question: "Suis-je obligé d'accepter toutes les demandes ?",
      answer: "Non. Vous êtes libre d'accepter ou de refuser toute proposition provenant d'un établissement."
    },
    {
      question: "Comment fonctionne la messagerie interne ?",
      answer: "La messagerie interne permet d'échanger directement avec les établissements via la plateforme. Les échanges doivent rester professionnels, respectueux et conformes à la loi."
    },
    {
      question: "Les messages sont-ils surveillés ou lus ?",
      answer: "Les messages ne sont pas lus de manière systématique. Jam Connexion agit en qualité d'hébergeur et peut intervenir uniquement en cas de signalement ou de contenu manifestement illicite."
    },
    {
      question: "Puis-je signaler un message ou un comportement abusif ?",
      answer: "Oui. Tout message ou comportement abusif peut être signalé à : jamconnexion@gmail.com"
    },
    {
      question: "Puis-je supprimer mon compte musicien ?",
      answer: "Oui. Vous pouvez demander la suppression de votre compte à tout moment. Certaines données peuvent être conservées temporairement pour des obligations légales."
    },
    {
      question: "Mes données personnelles sont-elles protégées ?",
      answer: "Oui. Vos données personnelles sont traitées conformément au RGPD et à la Politique de confidentialité de Jam Connexion. Vous disposez de droits d'accès, de rectification, de suppression et d'opposition."
    },
    {
      question: "Puis-je être exclu de la plateforme ?",
      answer: "Oui. En cas de non-respect des CGU, d'utilisation abusive de la messagerie ou de comportement illégal, Jam Connexion se réserve le droit de suspendre ou supprimer un compte musicien."
    },
    {
      question: "Jam Connexion est-il mon employeur ?",
      answer: "Non. Jam Connexion n'est ni employeur, ni producteur, ni organisateur. Le musicien reste totalement indépendant."
    },
    {
      question: "Qui contacter en cas de problème ou question ?",
      answer: "Pour toute question ou assistance, vous pouvez contacter : jamconnexion@gmail.com"
    }
  ];

  const currentFAQ = userType === 'venue' ? venueFAQ : musicianFAQ;

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
            
            <h1 className="font-heading font-bold text-xl">FAQ - Foire Aux Questions</h1>
            
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Type Selector */}
        <div className="flex gap-4 mb-8 justify-center">
          <Button
            onClick={() => setUserType('venue')}
            variant={userType === 'venue' ? 'default' : 'outline'}
            className="rounded-full px-6"
          >
            🎪 Établissements
          </Button>
          <Button
            onClick={() => setUserType('musician')}
            variant={userType === 'musician' ? 'default' : 'outline'}
            className="rounded-full px-6"
          >
            🎸 Musiciens
          </Button>
        </div>

        {/* FAQ Title */}
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-3xl mb-3">
            {userType === 'venue' ? 'FAQ - Établissements' : 'FAQ - Musiciens'}
          </h2>
          <p className="text-muted-foreground">
            Retrouvez les réponses aux questions les plus fréquentes
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {currentFAQ.map((item, index) => (
            <div
              key={index}
              className="glassmorphism rounded-xl border border-white/10 overflow-hidden transition-all hover:border-primary/30"
            >
              <button
                onClick={() => toggleSection(index)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-lg pr-4">
                  🔹 {item.question}
                </span>
                {openSection === index ? (
                  <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              
              {openSection === index && (
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 glassmorphism rounded-2xl p-8 text-center border border-primary/20">
          <h3 className="font-heading font-semibold text-xl mb-3">
            Vous avez d'autres questions ?
          </h3>
          <p className="text-muted-foreground mb-4">
            Notre équipe est là pour vous aider
          </p>
          <a 
            href="mailto:jamconnexion@gmail.com"
            className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors"
          >
            📧 Contactez-nous
          </a>
        </div>
      </main>
    </div>
  );
}
