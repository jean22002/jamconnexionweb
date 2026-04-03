# ⭐ Système d'Avis et Notation - Jam Connexion

**Date de mise en place** : 3 avril 2025  
**Status** : ✅ Backend opérationnel | ⏳ Frontend en intégration

---

## 📋 Vue d'ensemble

Système complet d'avis et de notation permettant aux **musiciens** de noter les **établissements** après avoir participé à un événement.

### Règles métier

✅ **Qui peut noter ?** Musiciens uniquement  
✅ **Qui est noté ?** Établissements uniquement  
✅ **Quand ?** Uniquement après la fin de l'événement  
✅ **Combien ?** Un seul avis par événement  
✅ **Réponse ?** Les établissements peuvent répondre aux avis  

---

## 🎯 Fonctionnalités

### Pour les Musiciens
- ⭐ Noter un établissement (1-5 étoiles)
- 📝 Laisser un commentaire (1000 caractères max)
- 📊 Noter selon 3 critères :
  - 🎵 **Ambiance** (optionnel)
  - 🎸 **Qualité** (optionnel)
  - 💼 **Professionnalisme** (optionnel)
- ✏️ Modifier son avis (TODO)
- 🗑️ Supprimer son avis

### Pour les Établissements
- 📖 Voir tous leurs avis
- 📊 Statistiques détaillées :
  - Note moyenne globale
  - Moyennes par critère
  - Distribution des notes (1-5)
  - Nombre total d'avis
- 💬 Répondre aux avis
- 🚩 Signaler un avis inapproprié

### Pour tous
- 👀 Consulter les avis publics d'un établissement
- 📈 Voir les statistiques agrégées

---

## 🔧 Backend - Architecture

### Modèle de données : `/app/backend/models/review.py`

#### ReviewCreate (Création d'avis)
```python
{
    "venue_id": "venue-123",           # ID établissement (requis)
    "event_id": "event-456",           # ID événement (requis)
    "overall_rating": 4.5,             # Note globale 1-5 (requis)
    "ambiance_rating": 5.0,            # Optionnel
    "quality_rating": 4.0,             # Optionnel
    "professionalism_rating": 4.5,     # Optionnel
    "comment": "Super soirée !"        # Optionnel (1000 car max)
}
```

#### Review (Document MongoDB)
```python
{
    "id": "review-789",
    "venue_id": "venue-123",
    "musician_id": "user-abc",
    "event_id": "event-456",
    "event_title": "Jam Session Blues",
    
    # Ratings
    "overall_rating": 4.5,
    "ambiance_rating": 5.0,
    "quality_rating": 4.0,
    "professionalism_rating": 4.5,
    
    # Content
    "comment": "Super soirée !",
    
    # Metadata
    "created_at": "2025-04-03T20:30:00Z",
    "updated_at": null,
    
    # Venue response
    "venue_response": "Merci pour votre retour !",
    "venue_response_date": "2025-04-04T10:15:00Z",
    
    # Moderation
    "is_reported": false
}
```

---

### Routes API : `/app/backend/routes/reviews.py`

#### `POST /api/reviews`
**Créer un avis**

**Authentification** : Bearer Token (Musicien uniquement)

**Body** :
```json
{
  "venue_id": "venue-123",
  "event_id": "event-456",
  "overall_rating": 4.5,
  "ambiance_rating": 5.0,
  "quality_rating": 4.0,
  "professionalism_rating": 4.5,
  "comment": "Excellent établissement !"
}
```

**Validations** :
1. ✅ Utilisateur = Musicien
2. ✅ Établissement existe
3. ✅ Événement existe
4. ✅ **Événement est terminé** (date dans le passé)
5. ✅ Événement est lié à cet établissement
6. ✅ Musicien n'a pas déjà noté cet événement

**Réponse** :
```json
{
  "id": "review-789",
  "venue_id": "venue-123",
  "musician_id": "user-abc",
  "musician_name": "John Doe",
  "musician_image": "https://.../profile.webp",
  "event_id": "event-456",
  "event_title": "Jam Session Blues",
  "overall_rating": 4.5,
  "ambiance_rating": 5.0,
  "quality_rating": 4.0,
  "professionalism_rating": 4.5,
  "comment": "Excellent établissement !",
  "venue_response": null,
  "venue_response_date": null,
  "is_reported": false,
  "created_at": "2025-04-03T20:30:00Z"
}
```

**Erreurs possibles** :
- `400` : Événement non terminé
- `400` : Avis déjà créé pour cet événement
- `403` : Utilisateur n'est pas musicien
- `404` : Établissement ou événement introuvable

---

#### `GET /api/reviews/venue/{venue_id}`
**Récupérer tous les avis d'un établissement**

**Paramètres** :
- `venue_id` : ID de l'établissement
- `limit` : Nombre max d'avis (default: 50)

**Réponse** :
```json
[
  {
    "id": "review-789",
    "venue_id": "venue-123",
    "musician_id": "user-abc",
    "musician_name": "John Doe",
    "musician_image": "https://.../profile.webp",
    "event_id": "event-456",
    "event_title": "Jam Session Blues",
    "overall_rating": 4.5,
    "ambiance_rating": 5.0,
    "quality_rating": 4.0,
    "professionalism_rating": 4.5,
    "comment": "Excellent établissement !",
    "venue_response": "Merci !",
    "venue_response_date": "2025-04-04T10:15:00Z",
    "is_reported": false,
    "created_at": "2025-04-03T20:30:00Z"
  }
]
```

**Note** : Les avis signalés (`is_reported: true`) sont exclus

---

#### `GET /api/reviews/venue/{venue_id}/stats`
**Statistiques des avis d'un établissement**

**Réponse** :
```json
{
  "total_reviews": 25,
  "average_overall": 4.3,
  "average_ambiance": 4.5,
  "average_quality": 4.2,
  "average_professionalism": 4.1,
  "rating_distribution": {
    "1": 0,
    "2": 1,
    "3": 3,
    "4": 8,
    "5": 13
  }
}
```

**Calculs** :
- Moyennes arrondies à 2 décimales
- Seuls les avis non signalés sont comptés
- Distribution basée sur `overall_rating` arrondi

---

#### `POST /api/reviews/{review_id}/respond`
**Établissement répond à un avis**

**Authentification** : Bearer Token (Établissement uniquement)

**Body** :
```json
{
  "response": "Merci pour votre retour positif !"
}
```

**Validations** :
1. ✅ Utilisateur = Établissement
2. ✅ Avis existe
3. ✅ Avis concerne cet établissement

**Réponse** :
```json
{
  "message": "Response added successfully"
}
```

---

#### `DELETE /api/reviews/{review_id}`
**Supprimer un avis**

**Authentification** : Bearer Token (Auteur uniquement)

**Validations** :
1. ✅ Avis existe
2. ✅ Utilisateur = Auteur de l'avis

**Réponse** :
```json
{
  "message": "Review deleted"
}
```

---

#### `POST /api/reviews/{review_id}/report`
**Signaler un avis inapproprié**

**Authentification** : Bearer Token

**Réponse** :
```json
{
  "message": "Review reported"
}
```

**Effet** : L'avis est marqué `is_reported: true` et exclu des listes publiques

---

## 🎨 Frontend - Composants

### 1. ReviewModal

**Fichier** : `/app/frontend/src/components/ui/ReviewModal.jsx`

Modal de création d'avis avec notation par étoiles

#### Props
```javascript
{
  open: boolean,                 // État ouvert/fermé
  onOpenChange: (bool) => void,  // Callback changement état
  venue: {                       // Objet établissement
    id: string,
    name: string
  },
  event: {                       // Objet événement
    id: string,
    title: string,
    date: string
  },
  token: string,                 // JWT token
  onSuccess: () => void          // Callback après succès
}
```

#### Exemple d'utilisation
```jsx
import ReviewModal from '../components/ui/ReviewModal';

const [reviewModalOpen, setReviewModalOpen] = useState(false);

<ReviewModal
  open={reviewModalOpen}
  onOpenChange={setReviewModalOpen}
  venue={{ id: 'venue-123', name: 'Le Jazz Club' }}
  event={{ id: 'event-456', title: 'Jam Session', date: '15 mars 2025' }}
  token={token}
  onSuccess={() => {
    // Rafraîchir la liste des avis
    fetchReviews();
  }}
/>
```

#### Features
- ⭐ Note globale obligatoire (1-5 étoiles)
- 📊 3 critères optionnels (Ambiance, Qualité, Professionnalisme)
- 💬 Commentaire optionnel (1000 caractères max)
- 🔄 Loading state pendant soumission
- ✅ Validation avant envoi
- 🎉 Toast de succès/erreur

---

### 2. ReviewComponents

**Fichier** : `/app/frontend/src/components/ui/ReviewComponents.jsx`

Composants d'affichage des avis

#### a) StarDisplay

Affichage étoiles en lecture seule

```jsx
import { StarDisplay } from '../components/ui/ReviewComponents';

<StarDisplay rating={4.5} />
```

#### b) ReviewCard

Carte d'avis individuel

```jsx
import { ReviewCard } from '../components/ui/ReviewComponents';

<ReviewCard review={reviewObject} />
```

**Affiche** :
- Photo + nom du musicien
- Date de l'avis
- Titre de l'événement
- Note globale + critères détaillés
- Commentaire
- Réponse de l'établissement (si existe)

#### c) ReviewStats

Statistiques agrégées

```jsx
import { ReviewStats } from '../components/ui/ReviewComponents';

<ReviewStats stats={statsObject} />
```

**Affiche** :
- Note moyenne grande + étoiles
- Total d'avis
- Moyennes par critère (Ambiance, Qualité, Pro)
- Distribution graphique (barres de progression 1-5 étoiles)

---

## 🏗️ Intégrations à faire

### ⏳ Dashboard Musicien

**Où ?** Onglet "Historique" ou "Mes Participations"

**À ajouter** :
1. Bouton "Laisser un avis" sur événements passés
2. Condition : Événement terminé + Pas encore noté
3. Ouvrir `ReviewModal` au clic
4. Rafraîchir liste après soumission

**Exemple** :
```jsx
{event.isPast && !event.hasReviewed && (
  <Button onClick={() => {
    setSelectedEvent(event);
    setReviewModalOpen(true);
  }}>
    ⭐ Laisser un avis
  </Button>
)}

<ReviewModal
  open={reviewModalOpen}
  onOpenChange={setReviewModalOpen}
  venue={{ id: event.venue_id, name: event.venue_name }}
  event={{ id: event.id, title: event.title, date: event.date }}
  token={token}
  onSuccess={() => {
    // Marquer comme noté
    fetchEvents();
  }}
/>
```

---

### ⏳ Dashboard Établissement

**Où ?** Onglet "Avis" (existe déjà mais vide)

**À ajouter** :
1. Fetch des avis : `GET /api/reviews/venue/{venue_id}`
2. Fetch des stats : `GET /api/reviews/venue/{venue_id}/stats`
3. Afficher `<ReviewStats>` en haut
4. Afficher liste de `<ReviewCard>` en bas
5. Pagination ou lazy loading si > 20 avis

**Exemple** :
```jsx
import { ReviewStats, ReviewCard } from '../components/ui/ReviewComponents';
import { useEffect, useState } from 'react';
import axios from 'axios';

function ReviewsTab({ venueId, token }) {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          axios.get(`${API}/api/reviews/venue/${venueId}/stats`),
          axios.get(`${API}/api/reviews/venue/${venueId}`)
        ]);
        
        setStats(statsRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [venueId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <ReviewStats stats={stats} />
      
      {/* Liste des avis */}
      <div className="space-y-4">
        <h3 className="font-semibold text-xl">Tous les avis</h3>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">Aucun avis pour le moment</p>
        ) : (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 🔐 Sécurité

### Authentification
Tous les endpoints nécessitent un **Bearer Token JWT** valide

### Contrôles d'accès
```python
# Créer un avis
if current_user["role"] != "musician":
    raise HTTPException(403, "Seuls les musiciens peuvent laisser des avis")

# Répondre à un avis
if current_user["role"] != "venue":
    raise HTTPException(403, "Seuls les établissements peuvent répondre")

# Supprimer un avis
if review["musician_id"] != current_user["id"]:
    raise HTTPException(403, "Non autorisé")
```

### Validations métier
```python
# Événement terminé uniquement
if event_date > datetime.now(timezone.utc):
    raise HTTPException(
        400, 
        "Vous ne pouvez laisser un avis qu'après la fin de l'événement"
    )

# Pas de doublon
existing = await db.reviews.find_one({
    "event_id": event_id,
    "musician_id": user_id
})
if existing:
    raise HTTPException(400, "Vous avez déjà laissé un avis pour cet événement")
```

---

## 🧪 Tests

### Test création d'avis (curl)

```bash
API_URL="https://your-domain.preview.emergentagent.com/api"
TOKEN="musician-jwt-token"

curl -X POST "$API_URL/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "venue_id": "venue-123",
    "event_id": "event-456",
    "overall_rating": 4.5,
    "ambiance_rating": 5.0,
    "quality_rating": 4.0,
    "professionalism_rating": 4.5,
    "comment": "Super établissement, excellente ambiance !"
  }'
```

**Réponse attendue** : Code 200 + objet ReviewResponse

---

### Test récupération avis

```bash
curl -X GET "$API_URL/reviews/venue/venue-123"
```

**Réponse attendue** : Array d'avis

---

### Test statistiques

```bash
curl -X GET "$API_URL/reviews/venue/venue-123/stats"
```

**Réponse attendue** :
```json
{
  "total_reviews": 25,
  "average_overall": 4.3,
  "average_ambiance": 4.5,
  "average_quality": 4.2,
  "average_professionalism": 4.1,
  "rating_distribution": {
    "1": 0, "2": 1, "3": 3, "4": 8, "5": 13
  }
}
```

---

### Test restriction événement non terminé

```bash
# Créer un avis pour un événement futur
curl -X POST "$API_URL/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "venue_id": "venue-123",
    "event_id": "future-event-789",
    "overall_rating": 5.0
  }'
```

**Réponse attendue** : Code 400 + message d'erreur
```json
{
  "detail": "Vous ne pouvez laisser un avis qu'après la fin de l'événement"
}
```

---

## 🐛 Résolution de problèmes

### Erreur "Vous ne pouvez laisser un avis qu'après la fin de l'événement"

**Cause** : Date de l'événement dans le futur

**Solution** : Attendre la fin de l'événement ou utiliser un événement passé pour les tests

---

### Erreur "Vous avez déjà laissé un avis pour cet événement"

**Cause** : Doublon détecté

**Solution** : Utiliser un autre event_id ou supprimer l'avis existant

---

### Statistiques vides malgré des avis

**Cause** : Avis signalés (`is_reported: true`) sont exclus

**Solution** : Vérifier que les avis ne sont pas marqués comme signalés

---

## 📊 Statistiques d'usage

### Moyennes attendues
- Note globale moyenne : **4.0 - 4.5**/5
- Taux de réponse établissements : **~30-40%**
- Temps moyen de notation : **~2-3 minutes**

### Limites système
- Avis par établissement : **Illimité**
- Avis affichés par défaut : **50** (pagination recommandée)
- Taille commentaire : **1000 caractères max**

---

## 🚀 Évolutions futures

### Court terme (TODO)
- [ ] Intégrer dans Dashboard Musicien (bouton "Laisser un avis")
- [ ] Intégrer dans Dashboard Établissement (onglet Avis)
- [ ] Modifier un avis existant
- [ ] Pagination/lazy loading pour > 50 avis

### Moyen terme
- [ ] Filtres avancés (par note, par date, par musicien)
- [ ] Tri (plus récent, meilleure note, pire note)
- [ ] Photos dans les avis (musiciens peuvent uploader des photos de la soirée)
- [ ] Likes sur les avis (utile/pas utile)

### Long terme
- [ ] IA de modération automatique (détection contenu inapproprié)
- [ ] Système de récompenses (badges pour musiciens actifs)
- [ ] Tendances temporelles (graphique évolution note)
- [ ] Comparaison avec établissements similaires

---

## 📝 Changelog

### Version 1.0 (3 avril 2025)
- ✅ Modèle de données complet
- ✅ CRUD avis (Create, Read, Delete)
- ✅ Statistiques agrégées
- ✅ Restriction événement terminé
- ✅ Un avis par événement
- ✅ Réponse établissement
- ✅ Système de signalement
- ✅ Composants frontend (ReviewModal, ReviewCard, ReviewStats)

---

## 👥 Support

### Logs à vérifier
```bash
# Backend
tail -f /var/log/supervisor/backend.err.log | grep -i review

# MongoDB
mongo --eval 'db.reviews.find().pretty()'
```

### Commandes utiles
```bash
# Compter les avis
mongo --eval 'db.reviews.countDocuments()'

# Moyenne globale d'un établissement
mongo --eval 'db.reviews.aggregate([
  {$match: {"venue_id": "venue-123"}},
  {$group: {_id: null, avg: {$avg: "$overall_rating"}}}
])'
```

---

**Documentation complète et à jour** ✅  
**Système backend prêt pour production** 🚀  
**Frontend en intégration** ⏳
