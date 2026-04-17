import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { 
  MapPin, Search, Calendar, Users, Bell, Trophy, 
  Award, MessageSquare, Heart, Music, Building2, 
  ChevronRight, ChevronLeft, HelpCircle, Locate,
  Radio, Filter, Share2, Star, UserPlus, Music2
} from 'lucide-react';

const GuideModal = ({ isOpen, onClose, userRole }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Guides adaptés selon le profil
  const guides = {
    musician: [
      {
        title: "🎸 Bienvenue Musicien !",
        icon: <Music className="w-12 h-12 text-primary" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Jam Connexion est votre plateforme pour trouver des opportunités de concerts, 
              rencontrer d'autres musiciens et vous faire connaître auprès des établissements locaux.
            </p>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="font-semibold text-primary mb-2">🎁 Votre compte est 100% gratuit !</p>
              <p className="text-sm text-muted-foreground">
                Accédez à toutes les fonctionnalités sans limite.
              </p>
            </div>
          </div>
        )
      },
      {
        title: "🗺️ La Carte Interactive",
        icon: <MapPin className="w-12 h-12 text-cyan-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Découvrez tous les établissements qui recherchent des musiciens près de chez vous.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Filter className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Filtres avancés</p>
                  <p className="text-sm text-muted-foreground">
                    Filtrez par style musical, distance, et type d'établissement
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Recherche géographique</p>
                  <p className="text-sm text-muted-foreground">
                    Cherchez des établissements dans une ville spécifique
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "📍 Mode En Déplacement",
        icon: <Locate className="w-12 h-12 text-orange-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              <strong>Le bouton "Localisation"</strong> vous permet d'activer une géolocalisation temporaire de 24h.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg space-y-3">
              <p className="font-semibold text-orange-400">À quoi ça sert ?</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Vous êtes en vacances ou en déplacement dans une autre ville</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Activez votre position temporaire pour apparaître aux établissements locaux</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Trouvez des opportunités de concerts lors de vos déplacements</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio className="w-4 h-4" />
              <span>Deux options : GPS automatique ou saisie manuelle</span>
            </div>
          </div>
        )
      },
      {
        title: "👥 Groupes Musicaux",
        icon: <Users className="w-12 h-12 text-purple-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Créez ou rejoignez des groupes pour postuler ensemble aux événements.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Créer un groupe</p>
                  <p className="text-sm text-muted-foreground">
                    Définissez votre style, répertoire et durée de spectacle
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Code d'invitation</p>
                  <p className="text-sm text-muted-foreground">
                    Chaque groupe génère automatiquement un code unique pour inviter des membres
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "🏆 Badges & Trophées",
        icon: <Award className="w-12 h-12 text-yellow-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Gagnez des badges en accomplissant des actions sur la plateforme.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Classement général</p>
                  <p className="text-sm text-muted-foreground">
                    Comparez vos performances avec d'autres musiciens
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Badges automatiques</p>
                  <p className="text-sm text-muted-foreground">
                    Débloquez des badges en interagissant avec la communauté
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "📱 Notifications",
        icon: <Bell className="w-12 h-12 text-green-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Recevez des alertes en temps réel pour ne rien manquer.
            </p>
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-green-400">Vous serez notifié pour :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nouvelles candidatures acceptées</li>
                <li>• Nouveaux événements d'établissements suivis</li>
                <li>• Rappels d'événements (J-3 et Jour J à 13h)</li>
                <li>• Nouveaux badges débloqués</li>
                <li>• Messages reçus</li>
              </ul>
            </div>
          </div>
        )
      }
    ],
    venue: [
      {
        title: "🎤 Bienvenue Établissement !",
        icon: <Building2 className="w-12 h-12 text-primary" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Jam Connexion vous aide à trouver des musiciens talentueux pour animer vos soirées.
            </p>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="font-semibold text-primary mb-2">🎁 Offre de lancement</p>
              <p className="text-sm text-muted-foreground">
                Les 100 premiers établissements bénéficient de 6 mois gratuits !
              </p>
            </div>
          </div>
        )
      },
      {
        title: "🗺️ Votre Visibilité",
        icon: <MapPin className="w-12 h-12 text-cyan-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Votre établissement apparaît sur la carte interactive consultée par tous les musiciens.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Recherche géographique</p>
                  <p className="text-sm text-muted-foreground">
                    Les musiciens peuvent vous trouver selon leur localisation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Filter className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Filtres par style</p>
                  <p className="text-sm text-muted-foreground">
                    Vos styles musicaux attirent les bons artistes
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "📅 Créer des Événements",
        icon: <Calendar className="w-12 h-12 text-orange-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Publiez vos événements pour recevoir des candidatures de musiciens.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-orange-400">Fonctionnalités :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Date, heure et durée personnalisables</li>
                <li>• Type d'événement (Concert, Bœuf, Session...)</li>
                <li>• Styles musicaux recherchés</li>
                <li>• Rémunération (ou bénévolat)</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "👥 Candidatures",
        icon: <Users className="w-12 h-12 text-purple-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Gérez les candidatures reçues et choisissez vos artistes.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Accepter ou refuser</p>
                  <p className="text-sm text-muted-foreground">
                    Les musiciens sont notifiés en temps réel
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Messagerie directe</p>
                  <p className="text-sm text-muted-foreground">
                    Contactez les artistes pour discuter des détails
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "📱 Notifications",
        icon: <Bell className="w-12 h-12 text-green-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Restez informé de toutes les activités sur votre profil.
            </p>
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-green-400">Vous serez notifié pour :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nouvelles candidatures reçues</li>
                <li>• Nouveaux abonnés à votre établissement</li>
                <li>• Rappels d'événements (J-3 et Jour J à 13h)</li>
                <li>• Messages reçus</li>
              </ul>
            </div>
          </div>
        )
      }
    ],
    melomane: [
      {
        title: "🎵 Bienvenue Mélomane !",
        icon: <Music2 className="w-12 h-12 text-primary" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Découvrez tous les concerts et événements musicaux près de chez vous, 
              gratuitement et en temps réel.
            </p>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="font-semibold text-primary mb-2">🎁 100% Gratuit</p>
              <p className="text-sm text-muted-foreground">
                Accédez à tous les événements sans limite, pour toujours.
              </p>
            </div>
          </div>
        )
      },
      {
        title: "🗺️ Carte des Événements",
        icon: <MapPin className="w-12 h-12 text-cyan-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Explorez la carte pour découvrir les concerts à proximité.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Filter className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Filtres par style</p>
                  <p className="text-sm text-muted-foreground">
                    Trouvez les événements qui correspondent à vos goûts musicaux
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Calendrier des concerts</p>
                  <p className="text-sm text-muted-foreground">
                    Consultez tous les événements à venir
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "❤️ Suivre des Établissements",
        icon: <Heart className="w-12 h-12 text-pink-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Abonnez-vous à vos bars et salles préférés pour ne manquer aucun concert.
            </p>
            <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-lg">
              <p className="font-semibold text-pink-400 mb-2">Avantages :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Notifications pour les nouveaux événements</li>
                <li>• Accès rapide à vos lieux favoris</li>
                <li>• Ne manquez plus aucun concert</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "📅 Participer aux Événements",
        icon: <Calendar className="w-12 h-12 text-orange-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Marquez votre participation aux concerts pour mieux organiser vos sorties.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Rappels automatiques</p>
                  <p className="text-sm text-muted-foreground">
                    Recevez une notification 3 jours avant et le jour J à 13h
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Voir les participants</p>
                  <p className="text-sm text-muted-foreground">
                    Découvrez combien de mélomanes seront présents
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "📱 Notifications",
        icon: <Bell className="w-12 h-12 text-green-500" />,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Ne manquez plus aucun événement grâce aux notifications en temps réel.
            </p>
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-green-400">Vous serez notifié pour :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nouveaux concerts des établissements suivis</li>
                <li>• Rappels d'événements (J-3 et Jour J à 13h)</li>
                <li>• Messages reçus</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  };

  const currentGuide = guides[userRole] || guides.musician;
  const totalSteps = currentGuide.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <span>Guide d'utilisation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Step Content */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {currentGuide[currentStep].icon}
            </div>
            <h3 className="text-2xl font-heading font-bold mb-4">
              {currentGuide[currentStep].title}
            </h3>
            {currentGuide[currentStep].content}
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2">
            {currentGuide.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {totalSteps}
            </span>

            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Terminer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuideModal;
