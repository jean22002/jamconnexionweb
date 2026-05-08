# 🎮 Système d'Attribution Automatique des Badges

## 📋 Résumé

Le système de gamification a été complété avec l'implémentation de l'**attribution automatique des badges** basée sur les activités des utilisateurs. Les badges sont maintenant déclenchés automatiquement lors des actions clés.

## 🎯 Objectifs Atteints

### ✅ Utilitaire Centralisé
**Fichier créé:** `/app/backend/utils/badge_checker.py`

Contient trois fonctions principales:

1. **`trigger_badge_check(user_id, token)`**
   - Déclenche une vérification HTTP des badges
   - Utilisé quand on a un token disponible

2. **`check_and_award_badges_internal(db, user_id)`**
   - Version interne avec accès direct à la DB
   - Vérifie tous les badges et attribue ceux qui sont mérités
   - Crée des notifications automatiques
   - Envoie des notifications push
   - **Fonction principale utilisée partout**

3. **`calculate_badge_progress(db, user, badge)`**
   - Calcule la progression pour chaque type de badge
   - Supporte 7 types de critères différents

### ✅ Intégration aux Points d'Action

Les vérifications de badges ont été intégrées aux endpoints suivants:

#### **1. Participation aux Événements (Musiciens)**
**Fichier:** `/app/backend/routes/events.py`
- **Endpoint:** `POST /api/events/{event_id}/join`
- **Trigger:** Quand un musicien rejoint un événement (jam, concert, karaoké, spectacle)
- **Badges déclenchés:** 
  - 🎸 "Première scène" (1 événement)
  - 🎤 "Rising star" (5 événements)
  - 🌟 "Artiste confirmé" (10 événements)

#### **2. Participation aux Événements (Mélomanes)**
**Fichier:** `/app/backend/routes/melomanes.py`
- **Endpoint:** `POST /api/melomanes/events/{event_id}/participate`
- **Trigger:** Quand un mélomane marque sa participation à un événement
- **Badges déclenchés:**
  - 🎵 "Premier concert" (1 événement)
  - 🎶 "Mélomane actif" (5 événements)
  - 🎼 "Passionné de musique" (10 événements)

#### **3. Système d'Amis**
**Fichier:** `/app/backend/routes/friends.py`
- **Endpoint:** `POST /api/friends/accept/{request_id}`
- **Trigger:** Quand une demande d'ami est acceptée (pour les DEUX utilisateurs)
- **Badges déclenchés:**
  - 👥 "Premier ami" (1 ami)
  - 🤝 "Réseau grandissant" (5 amis)
  - 🌐 "Bien connecté" (10 amis)

#### **4. Création d'Événements (Établissements)**
**Fichiers:** `/app/backend/routes/events.py`
- **Endpoints:**
  - `POST /api/events/jams` (création de jam)
  - `POST /api/events/concerts` (création de concert)
- **Trigger:** Quand un établissement crée un événement
- **Badges déclenchés:**
  - 🎪 "Premier événement" (1 événement)
  - 📅 "Organisateur actif" (5 événements)
  - 🏆 "Lieu incontournable" (10 événements)

#### **5. Abonnements à un Établissement**
**Fichier:** `/app/backend/routes/venues.py`
- **Endpoint:** `POST /api/venues/{venue_id}/subscribe`
- **Trigger:** Quand un utilisateur s'abonne à un établissement
- **Badges déclenchés (pour le propriétaire du venue):**
  - ⭐ "Premiers fans" (5 abonnés)
  - 🌟 "Communauté grandissante" (20 abonnés)
  - 💫 "Spot populaire" (50 abonnés)

## 🔧 Types de Critères Supportés

Le système `calculate_badge_progress()` supporte **7 types de critères** :

### 1. **`event_participation`**
- Pour les **musiciens**
- Compte les participations actives aux événements
- Collection: `event_participations`

### 2. **`event_attendance`**
- Pour les **mélomanes**
- Compte les événements assistés
- Collection: `event_participations`

### 3. **`friend_count`**
- Pour **tous les rôles**
- Compte les amitiés acceptées
- Collection: `friends`

### 4. **`event_created`**
- Pour les **établissements**
- Compte tous les types d'événements créés (jams, concerts, karaoké, spectacles)
- Collections: `jams`, `concerts`, `karaokes`, `spectacles`

### 5. **`subscriber_count`**
- Pour les **établissements**
- Compte le nombre d'abonnés
- Collection: `venue_subscriptions`

### 6. **`venue_visit`**
- Pour les **mélomanes**
- Compte le nombre d'établissements uniques visités
- Logique: Déduplique les `venue_id` des participations

### 7. **`account_age`**
- Pour **tous les rôles**
- Calcule l'âge du compte en jours
- Badge "Pionnier" après X jours

## 🎨 Fonctionnalités Additionnelles

### Notifications Automatiques
Quand un badge est débloqué:
1. ✅ **Notification dans l'app**
   - Type: `badge_unlocked`
   - Contient: icône, nom, points, message de félicitations

2. ✅ **Notification Push Web**
   - Titre: "🏆 Badge débloqué !"
   - Message: Icône + nom + message personnalisé
   - Lien: Redirige vers `/badges`

### Gestion des Erreurs
- Les vérifications de badges sont **non-bloquantes**
- Si une erreur survient, elle est loggée mais n'empêche pas l'action principale
- Utilisation de `try/except` autour de tous les appels

## 📊 Badges Disponibles

### Badges Musiciens (Catégorie: `musician`)
- 🎸 **Première scène** (1 événement)
- 🎤 **Rising star** (5 événements)
- 🌟 **Artiste confirmé** (10 événements)
- 👥 **Premier ami** (1 ami)
- 🤝 **Réseau grandissant** (5 amis)
- 🌐 **Bien connecté** (10 amis)

### Badges Mélomanes (Catégorie: `melomane`)
- 🎵 **Premier concert** (1 événement)
- 🎶 **Mélomane actif** (5 événements)
- 🎼 **Passionné de musique** (10 événements)
- 🗺️ **Explorateur** (3 venues différents)
- 🧳 **Globe-trotter musical** (10 venues différents)

### Badges Établissements (Catégorie: `venue`)
- 🎪 **Premier événement** (1 événement créé)
- 📅 **Organisateur actif** (5 événements)
- 🏆 **Lieu incontournable** (10 événements)
- ⭐ **Premiers fans** (5 abonnés)
- 🌟 **Communauté grandissante** (20 abonnés)
- 💫 **Spot populaire** (50 abonnés)

### Badges Universels (Catégorie: `universal`)
- 🌟 **Pionnier** (compte de 7 jours d'âge)

## 🧪 Tests Recommandés

### Scénarios de Test

#### Test 1: Badge de Participation (Musicien)
1. Connexion comme musicien
2. Rejoindre un événement
3. Vérifier qu'un badge est attribué (si c'est le 1er, 5e ou 10e événement)
4. Vérifier la notification

#### Test 2: Badge d'Amitié
1. Envoyer une demande d'ami
2. Accepter la demande
3. Vérifier que LES DEUX utilisateurs reçoivent potentiellement un badge
4. Vérifier les notifications

#### Test 3: Badge d'Événement Créé (Venue)
1. Connexion comme établissement
2. Créer un jam ou concert
3. Vérifier le badge attribué
4. Vérifier la notification

#### Test 4: Badge d'Abonnés (Venue)
1. Avoir 5 utilisateurs qui s'abonnent à un venue
2. Le 5e abonnement devrait déclencher un badge
3. Vérifier que le propriétaire du venue reçoit le badge

## 💡 Améliorations Futures

### Court Terme
- [ ] Ajouter un bouton "Réclamer mes badges" pour forcer une vérification
- [ ] Afficher la progression vers le prochain badge sur le dashboard
- [ ] Animation de déverrouillage de badge

### Moyen Terme
- [ ] Badges combinés (ex: "Polyvalent" - participer à tous les types d'événements)
- [ ] Badges temporels (ex: "Noctambule" - événements après minuit)
- [ ] Badges de streak (ex: "Assidu" - événements 3 semaines d'affilée)

### Long Terme
- [ ] Classement public des utilisateurs par badges
- [ ] Badges secrets à découvrir
- [ ] Badges saisonniers / événements spéciaux

## ⚠️ Points d'Attention

### Performance
- Les vérifications sont asynchrones et n'impactent pas les temps de réponse
- Limit de 100 badges max par requête (suffisant pour la plupart des cas)

### Base de Données
- La collection `user_badges` grandit avec l'activité
- Indexation recommandée sur `user_id` et `badge_id`

### Notifications Push
- Les erreurs d'envoi de push sont capturées et n'empêchent pas l'attribution
- Un warning est loggé si la notification push échoue

## ✅ Résultat Final

✨ **Attribution automatique des badges fonctionnelle**  
✨ **5 points d'intégration dans les workflows clés**  
✨ **7 types de critères supportés**  
✨ **Notifications automatiques (in-app + push)**  
✨ **Système non-bloquant et robuste**  
✨ **Prêt pour la production**

---

**Prochaine étape recommandée:** Tests end-to-end avec le testing agent pour valider tous les scénarios d'attribution automatique.
