# Système de Signalement de Profils - Documentation Technique

## 📋 Résumé

Implémentation d'un système complet de signalement de profils permettant aux utilisateurs de signaler les comportements inappropriés ou non respectueux du règlement.

## 🎯 Fonctionnalités Implémentées

### ✅ Backend

**1. Modèle de Données** (`/app/backend/models/report.py`)
- `ReportCreate` : Modèle pour créer un signalement
- `ReportResponse` : Modèle de réponse avec informations complètes

**2. API Routes** (`/app/backend/routes/reports.py`)
- **POST `/api/reports/`** : Créer un signalement
- **GET `/api/reports/my-reports`** : Récupérer ses propres signalements

**3. Validation & Sécurité**
- ✅ L'utilisateur doit avoir interagi avec le profil signalé (amis, événements communs, messages, abonnements)
- ✅ Maximum 1 signalement par utilisateur par profil
- ✅ Impossible de se signaler soi-même
- ✅ 7 raisons prédéfinies + champ "Autre"

**4. Notifications Administrateur**
- ✅ Email automatique envoyé à l'admin à chaque signalement
- ✅ Email contient toutes les informations pertinentes

### ✅ Frontend

**1. Composant Réutilisable** (`/app/frontend/src/components/ReportProfileDialog.jsx`)
- Dialog modal avec formulaire de signalement
- Liste déroulante des raisons
- Champ texte pour les détails (max 1000 caractères)
- Messages d'avertissement
- Animation de succès après envoi

**2. Intégration dans les Pages**
- ✅ `/app/frontend/src/pages/MusicianDetail.jsx`
- ✅ `/app/frontend/src/pages/VenueDetail.jsx`
- ✅ `/app/frontend/src/pages/MelomaneDetail.jsx`

**3. UX/UI**
- Bouton "Signaler" avec icône Flag (🚩)
- Couleur rouge pour indiquer la gravité
- Dialog avec avertissement sur les faux signalements
- Compteur de caractères
- Animation de succès avec check vert

## 📊 Raisons de Signalement

1. **Comportement inapproprié / Harcèlement**
2. **Contenu offensant / Langage inapproprié**
3. **Faux profil / Usurpation d'identité**
4. **Spam / Publicité non sollicitée**
5. **Non-respect du règlement**
6. **Contenu illégal**
7. **Autre** (avec détails obligatoires)

## 🔒 Restrictions & Validations

### Côté Backend

**Vérification d'Interaction** :
```python
async def check_user_interaction(reporter_user_id, reported_user_id, reported_profile_type):
    # Vérifie :
    - Amitié acceptée
    - Abonnement à un établissement
    - Participation commune à des événements
    - Messages échangés
```

**Protections** :
- ❌ Impossible de se signaler soi-même
- ❌ Maximum 1 signalement par utilisateur par profil
- ❌ Doit avoir interagi avec le profil
- ❌ Raison doit être valide
- ❌ Détails obligatoires

### Côté Frontend

**Validations** :
- Raison obligatoire (sélection dans la liste)
- Détails obligatoires (minimum 1 caractère)
- Maximum 1000 caractères pour les détails
- Bouton désactivé si formulaire incomplet

## 📧 Email Administrateur

**Format de l'email** :
```
Sujet: 🚨 Nouveau Signalement - [Nom du profil]

Contenu:
- Profil Signalé (nom, type, email, ID)
- Signalement par (email, ID)
- Raison du signalement
- Détails
- Date
- ID du signalement
```

**Configuration** :
- Email admin défini dans `ADMIN_EMAIL` (env variable)
- Utilise l'utilitaire d'envoi d'email existant `/app/backend/utils/email.py`
- Échec d'email n'empêche pas la création du signalement

## 🗄️ Structure de la Base de Données

**Collection** : `reports`

```json
{
  "id": "uuid",
  "reporter_user_id": "uuid",
  "reporter_email": "email@example.com",
  "reported_user_id": "uuid",
  "reported_user_email": "email@example.com",
  "reported_profile_type": "musician|venue|melomane",
  "reported_profile_name": "Nom du profil",
  "reason": "Raison du signalement",
  "details": "Détails supplémentaires",
  "status": "pending|reviewed|resolved|dismissed",
  "created_at": "2026-02-14T...",
  "reviewed_at": null,
  "admin_notes": null
}
```

**Statuts possibles** :
- `pending` : En attente de traitement
- `reviewed` : Examiné par un admin
- `resolved` : Traité et résolu
- `dismissed` : Rejeté (faux signalement)

## 🎨 Design & UX

### Bouton "Signaler"
```jsx
<Button
  variant="outline"
  onClick={() => setShowReportDialog(true)}
  className="rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10 gap-2"
>
  <Flag className="w-4 h-4" />
  Signaler
</Button>
```

**Placement** :
- **MusicianDetail** : À côté du bouton "Ajouter" (si applicable)
- **VenueDetail** : Sous le bouton "Se connecter"
- **MelomaneDetail** : Dans la section stats

### Dialog Modal

**Étapes** :
1. **Avertissement** : Message important sur les faux signalements
2. **Sélection raison** : Liste déroulante
3. **Détails** : Textarea avec compteur de caractères
4. **Boutons** : Annuler (gris) / Envoyer (rouge)
5. **Succès** : Animation check vert + fermeture automatique

## 🧪 Tests

### Tests Backend
```bash
# Test de création de signalement
curl -X POST "$API_URL/api/reports/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reported_user_id":"user-id-here",
    "reported_profile_type":"musician",
    "reason":"Comportement inapproprié / Harcèlement",
    "details":"Description du problème"
  }'
```

**Réponses attendues** :
- ✅ 200 : Signalement créé avec succès
- ❌ 400 : Raison invalide / Déjà signalé / Auto-signalement
- ❌ 403 : Pas d'interaction avec le profil
- ❌ 404 : Utilisateur signalé non trouvé

### Tests Frontend
**Scénarios à tester** :
1. Cliquer sur "Signaler" → Dialog s'ouvre
2. Sélectionner une raison → Bouton "Envoyer" toujours désactivé
3. Ajouter des détails → Bouton "Envoyer" s'active
4. Envoyer → Toast de succès + Animation check
5. Essayer de signaler à nouveau → Erreur "déjà signalé"

## 📁 Fichiers Créés/Modifiés

### Backend
- ✅ `/app/backend/models/report.py` (NOUVEAU)
- ✅ `/app/backend/routes/reports.py` (NOUVEAU)
- ✅ `/app/backend/server.py` (MODIFIÉ - ajout du router)

### Frontend
- ✅ `/app/frontend/src/components/ReportProfileDialog.jsx` (NOUVEAU)
- ✅ `/app/frontend/src/pages/MusicianDetail.jsx` (MODIFIÉ)
- ✅ `/app/frontend/src/pages/VenueDetail.jsx` (MODIFIÉ)
- ✅ `/app/frontend/src/pages/MelomaneDetail.jsx` (MODIFIÉ)

### Documentation
- ✅ `/app/summary/REPORT_SYSTEM.md` (ce fichier)

## 🔮 Améliorations Futures

### Phase 2 (Optionnel)
1. **Dashboard Admin**
   - Page web pour voir tous les signalements
   - Filtres (status, raison, date)
   - Actions : marquer comme examiné, résolu, rejeté
   - Notes administratives

2. **Statistiques**
   - Nombre de signalements par utilisateur
   - Raisons les plus fréquentes
   - Temps de résolution moyen

3. **Actions Automatiques**
   - Suspension temporaire après X signalements
   - Mise en quarantaine du profil
   - Notification à l'utilisateur signalé

4. **Historique pour l'utilisateur**
   - Voir ses propres signalements effectués
   - Statut de traitement

## ⚙️ Configuration Requise

### Variables d'Environnement
```env
ADMIN_EMAIL=admin@jamconnexion.com  # Email de l'administrateur
```

### Dépendances
- ✅ Aucune nouvelle dépendance requise
- Utilise les bibliothèques existantes (FastAPI, Pydantic, Motor, etc.)

## ✅ Validation & Linting

**Backend** :
- ✅ `/app/backend/routes/reports.py` : Aucune erreur
- ✅ `/app/backend/models/report.py` : Aucune erreur

**Frontend** :
- ✅ `ReportProfileDialog.jsx` : Aucune erreur
- ✅ `MusicianDetail.jsx` : Aucune erreur
- ✅ `VenueDetail.jsx` : Aucune erreur
- ✅ `MelomaneDetail.jsx` : Aucune erreur

## 📊 Métriques d'Impact

**Sécurité** :
- Protection contre les faux signalements
- Traçabilité complète (qui, quand, pourquoi)
- Limitation 1 signalement par profil

**Modération** :
- Notification immédiate de l'admin
- Toutes les infos nécessaires dans l'email
- Stockage structuré pour traitement ultérieur

**UX** :
- Processus simple (3 étapes)
- Feedback immédiat
- Rassure sur la prise en compte

## 🎯 État Final

**✅ Système Complet et Fonctionnel** :
- Backend API opérationnel
- Frontend intégré sur toutes les pages de profils
- Validations en place
- Emails automatiques configurés
- Tests passés avec succès

**Prêt pour la Production** : ✅ OUI
