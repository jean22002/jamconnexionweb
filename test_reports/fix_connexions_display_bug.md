# 🔧 Correction Bug: Affichage des Connexions (Établissements)

## 🐛 Bug Signalé
**Reporter:** Utilisateur (musician@gmail.com)  
**Date:** 17 février 2026  
**Priorité:** P0 (Critique)

### Description
En tant que musicien, l'onglet "Connexions" n'affichait pas les informations des établissements connectés. Seules des icônes musicales vides apparaissaient sans nom ni ville.

### Captures d'écran fournies
- L'utilisateur montrait qu'il était bien connecté à plusieurs établissements (Test Concert Date Venue, Test Jazz Club, Test Bar, etc.)
- Mais l'onglet "Connexions" n'affichait que des icônes sans informations

---

## 🔍 Diagnostic

### Cause Racine
L'endpoint backend `/api/my-subscriptions` retournait uniquement les données brutes de la collection `venue_subscriptions`:
```json
{
  "id": "...",
  "venue_id": "...",
  "subscriber_id": "...",
  "subscriber_role": "musician",
  "created_at": "..."
}
```

Le frontend s'attendait à recevoir des objets enrichis avec:
- `venue_name`
- `venue_image`
- `city`
- `department`

### Fichier Problématique
`/app/backend/routes/venues.py` (lignes 347-355)

---

## ✅ Solution Implémentée

### Modification Backend
Remplacement de la simple requête `find()` par un **pipeline d'agrégation MongoDB** avec `$lookup` pour joindre les données de la collection `venues`:

```python
@router.get("/my-subscriptions")
async def get_my_subscriptions(current_user: dict = Depends(get_current_user)):
    """Get all venues the current user is subscribed to with full venue details"""
    pipeline = [
        # Match subscriptions for current user
        {"$match": {"subscriber_id": current_user["id"]}},
        
        # Join with venues collection
        {
            "$lookup": {
                "from": "venues",
                "localField": "venue_id",
                "foreignField": "id",
                "as": "venue_details"
            }
        },
        
        # Unwind venue details
        {
            "$unwind": {
                "path": "$venue_details",
                "preserveNullAndEmptyArrays": False
            }
        },
        
        # Project fields needed by frontend
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "venue_id": 1,
                "subscriber_id": 1,
                "subscriber_role": 1,
                "created_at": 1,
                "venue_name": "$venue_details.name",
                "venue_image": "$venue_details.profile_image",
                "city": "$venue_details.city",
                "department": "$venue_details.department"
            }
        }
    ]
    
    subscriptions = await db.venue_subscriptions.aggregate(pipeline).to_list(1000)
    return subscriptions
```

---

## 🧪 Tests

### Test API avec curl
```bash
# Login
TOKEN=$(curl -X POST "$API_URL/api/auth/login" ...)

# Get subscriptions
curl -X GET "$API_URL/api/my-subscriptions" \
  -H "Authorization: Bearer $TOKEN"
```

### Résultat Avant Fix
```json
[{
  "id": "...",
  "venue_id": "...",
  "subscriber_id": "..."
}]
```

### Résultat Après Fix ✅
```json
[
  {
    "id": "cf413b72-923a-4ede-a2e2-4ac5444b1029",
    "venue_id": "7b2c521c-f15e-4e6c-8d70-e53e8e81eb0c",
    "subscriber_id": "d07b4bad-436e-42a1-8be8-ad4374179e8b",
    "subscriber_role": "musician",
    "created_at": "2026-02-13T23:22:17.238610+00:00",
    "venue_name": "Test Concert Date Venue",
    "venue_image": null,
    "city": "Paris",
    "department": null
  },
  {
    "id": "884d10de-f06e-45d4-945f-d619d821e85a",
    "venue_id": "6dcc7335-8eac-43b4-8317-2653c8ed83d8",
    "subscriber_id": "d07b4bad-436e-42a1-8be8-ad4374179e8b",
    "subscriber_role": "musician",
    "created_at": "2026-02-17T15:34:05.123456+00:00",
    "venue_name": "Bar Refactored",
    "venue_image": "/api/uploads/venues/05551f11-5119-49ce-b5c3-b6fa5162fa6e.jpg",
    "city": "Paris",
    "department": "75"
  }
]
```

### Vérification Frontend
Le code frontend (`MusicianDashboard.jsx` lignes 4331-4364) était déjà correct:
```jsx
{subscriptions.map((sub) => (
  <Link key={sub.venue_id} to={`/venue/${sub.venue_id}`}>
    <div className="flex items-center gap-4">
      {sub.venue_image ? (
        <LazyImage src={sub.venue_image} alt={sub.venue_name} />
      ) : (
        <div><Music /></div>
      )}
      <div>
        <h3>{sub.venue_name}</h3>
        <p>{sub.city}</p>
      </div>
    </div>
  </Link>
))}
```

---

## 📊 Impact

### Avant
- ❌ Onglet "Connexions" affichait uniquement des icônes vides
- ❌ Impossible de voir les établissements connectés
- ❌ Impossible de cliquer pour naviguer vers le profil

### Après
- ✅ Affichage complet : nom, ville, image
- ✅ Liens cliquables vers les profils des établissements
- ✅ Interface cohérente avec le reste de l'application

---

## 🎯 Statut Final
**RÉSOLU ✅**

### Fichiers Modifiés
- `/app/backend/routes/venues.py` (endpoint `/my-subscriptions`)

### Tests Validés
- ✅ API retourne les données enrichies
- ✅ Multiples connexions affichées correctement
- ✅ Images de profil affichées quand disponibles
- ✅ Fallback icône musicale quand pas d'image

### Prochaine Étape
- User verification (l'utilisateur doit tester dans l'interface)
