# 🆕 NOUVEAUX COMPOSANTS WEB - Parité avec Mobile

**Date** : 17 avril 2026  
**Objectif** : Atteindre la parité fonctionnelle entre Web et Mobile

---

## ✅ COMPOSANTS AJOUTÉS

### 1. 💳 **Stripe Billing Portal** (ProSubscriptionCard.jsx)

**Modification** : `/app/frontend/src/components/ProSubscriptionCard.jsx`

**Fonctionnalité** :
- Bouton "Gérer mon abonnement" pour les utilisateurs déjà PRO
- Lien direct vers Stripe Billing Portal : `https://billing.stripe.com/p/login/28E7sKfFj7peek49XjafS00`
- Permet aux utilisateurs de :
  - Modifier leur moyen de paiement
  - Annuler leur abonnement
  - Voir l'historique de facturation
  - Mettre à jour les informations

**Condition d'affichage** :
```javascript
{profile?.tier === 'pro' || profile?.subscription_status === 'active' ? (
  // Bouton "Gérer mon abonnement"
) : (
  // Bouton "Commencer l'essai gratuit"
)}
```

**Bouton** :
- Icône : Settings (⚙️)
- Texte : "Gérer mon abonnement"
- Style : Gradient primary/cyan/purple + effet hover scale
- Action : Ouvre Stripe Billing Portal dans un nouvel onglet

---

### 2. 🎁 **PromoBanner.jsx** (Nouveau composant)

**Fichier** : `/app/frontend/src/components/PromoBanner.jsx`

**Fonctionnalité** :
- Bannière promotionnelle avec **compteur temps réel**
- Rafraîchissement automatique toutes les 30 secondes
- Adaptation selon le rôle (musicien / établissement)
- Bouton de fermeture
- Animation gradient

**Props** :
```javascript
<PromoBanner 
  userRole="musician"  // ou "venue"
  onClose={() => setShowBanner(false)} 
/>
```

**Endpoints utilisés** :
- Musiciens : `GET /api/stats/promo-musicians` → 200 places
- Établissements : `GET /api/stats/promo` → 100 places

**Affichage** :
- **Musiciens** : "Les 200 premiers musiciens : 2 mois PRO gratuits"
- **Établissements** : "Les 100 premiers établissements : 6 mois gratuits"
- **Compteur** : "79/200" avec icône Users
- **Places restantes** : "Plus que 121 places !"

**Design** :
- Musiciens : Gradient cyan → blue → purple
- Établissements : Gradient orange → pink → purple
- Animation shimmer sur fond
- Responsive mobile/desktop

**Intégration suggérée** :
```javascript
// Dans MusicianDashboard ou VenueDashboard
const [showPromoBanner, setShowPromoBanner] = useState(true);

{showPromoBanner && !isPro && (
  <PromoBanner 
    userRole={user.role}
    onClose={() => setShowPromoBanner(false)}
  />
)}
```

---

### 3. 🔔 **NotificationBadge.jsx** (Nouveau composant)

**Fichier** : `/app/frontend/src/components/NotificationBadge.jsx`

**Fonctionnalité** :
- Badge avec icône Bell (🔔)
- Compteur de notifications non-lues
- Animation pulse + bounce si notifications
- Affichage "99+" si > 99 notifications

**Props** :
```javascript
<NotificationBadge 
  count={unreadCount}
  onClick={() => setShowNotifications(true)}
  className="custom-class"
/>
```

**Design** :
- Badge rouge en position absolute (top-right)
- Icône Bell avec pulse si unread > 0
- Animation bounce du compteur
- Accessible (aria-label)

**Intégration dans header** :
```javascript
import NotificationBadge from '../components/NotificationBadge';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

// Dans le composant
const { unreadCount } = useUnreadNotifications(token);

// Dans le render
<NotificationBadge 
  count={unreadCount}
  onClick={() => setShowNotificationsDialog(true)}
/>
```

---

### 4. 🪝 **useUnreadNotifications.js** (Nouveau hook)

**Fichier** : `/app/frontend/src/hooks/useUnreadNotifications.js`

**Fonctionnalité** :
- Hook React pour gérer le compteur de notifications
- **Temps réel** : via Socket.IO (prop `socketUnreadCount`)
- **Fallback** : Polling API toutes les 30 secondes
- Méthodes : increment, decrement, reset, refresh

**Usage** :
```javascript
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

// Dans le composant
const { 
  unreadCount,      // Nombre de notifications non-lues
  loading,          // État de chargement
  refresh,          // Forcer un refresh manuel
  increment,        // +1 notification
  decrement,        // -1 notification
  reset             // Reset à 0 (tout lu)
} = useUnreadNotifications(token, socketUnreadCount);

// Utilisation
useEffect(() => {
  // Incrémenter quand nouvelle notification WebSocket
  socket.on('new_notification', () => {
    increment();
  });
}, [socket]);
```

**Endpoint utilisé** :
```
GET /api/notifications/unread-count
Headers: Authorization: Bearer {token}
Response: { count: 5 }
```

**⚠️ Note** : Cet endpoint doit exister côté backend. Si absent, le créer :

```python
# backend/routes/notifications.py
@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "read": False
    })
    return {"count": count}
```

---

## 📊 COMPARAISON WEB vs MOBILE (Mise à jour)

| Fonctionnalité | Web (Avant) | Web (Après) | Mobile |
|---|---|---|---|
| Billing Portal | ❌ | ✅ | ✅ |
| Compteur promo temps réel | ⚠️ Statique | ✅ Dynamique | ✅ |
| Badge notifications | ⚠️ Basique | ✅ Temps réel | ✅ |
| Guide interactif | ✅ | ✅ | ⚠️ À faire |
| Localisation header | ✅ | ✅ | ⚠️ À faire |

---

## 🚀 INTÉGRATION COMPLÈTE (Exemple MusicianDashboard)

```javascript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBadge from '../components/NotificationBadge';
import PromoBanner from '../components/PromoBanner';
import ProSubscriptionCard from '../components/ProSubscriptionCard';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

export default function MusicianDashboard() {
  const { user, token } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  
  // Hook notifications
  const { unreadCount, increment, reset } = useUnreadNotifications(token);
  
  const isPro = user?.tier === 'pro';

  return (
    <div>
      {/* Bannière promo */}
      {showPromoBanner && !isPro && (
        <PromoBanner 
          userRole="musician"
          onClose={() => setShowPromoBanner(false)}
        />
      )}

      {/* Header */}
      <header className="flex items-center gap-4">
        <h1>Dashboard Musicien</h1>
        
        {/* Badge notifications */}
        <NotificationBadge 
          count={unreadCount}
          onClick={() => setShowNotifications(true)}
        />
      </header>

      {/* Carte abonnement PRO */}
      <ProSubscriptionCard 
        token={token}
        currentTier={user?.tier}
        profile={user}
        onSuccess={() => console.log('Subscribed!')}
      />
    </div>
  );
}
```

---

## 📝 CHECKLIST D'INTÉGRATION

### Pour compléter l'implémentation :

- [ ] **Backend** : Créer endpoint `GET /api/notifications/unread-count` (si absent)
- [ ] **MusicianDashboard** : Intégrer PromoBanner en haut
- [ ] **MusicianDashboard** : Remplacer bouton Bell par NotificationBadge
- [ ] **VenueDashboard** : Intégrer PromoBanner en haut
- [ ] **VenueDashboard** : Remplacer bouton Bell par NotificationBadge
- [ ] **Socket.IO** : Connecter `useUnreadNotifications` au WebSocket
- [ ] **ProSubscriptionCard** : ✅ Déjà fait (Billing Portal intégré)
- [ ] **Tests** : Vérifier compteur temps réel fonctionne
- [ ] **Tests** : Vérifier lien Billing Portal fonctionne

---

## 🔧 ENDPOINT BACKEND REQUIS

Si l'endpoint `/api/notifications/unread-count` n'existe pas, le créer :

```python
# backend/routes/notifications.py
from fastapi import APIRouter, Depends
from ..utils.auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """
    Retourne le nombre de notifications non-lues de l'utilisateur
    """
    db = get_db()
    
    count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "read": False
    })
    
    return {"count": count}
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Composants créés
2. ⏳ Intégration dans les dashboards
3. ⏳ Tests utilisateur
4. ⏳ Push GitHub
5. ⏳ Déploiement production

---

**Créé le** : 17 avril 2026  
**Status** : Composants prêts, intégration en attente
