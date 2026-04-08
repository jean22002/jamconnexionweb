# Guide d'Implémentation : httpOnly Cookies pour JWT

## ⚠️ CRITIQUE - À Implémenter Avant Production

### Problème Actuel
Les tokens JWT sont stockés dans `localStorage`, ce qui les expose aux attaques XSS (Cross-Site Scripting).

### Solution
Migrer vers des cookies httpOnly qui ne sont pas accessibles au JavaScript côté client.

---

## Étape 1 : Backend (FastAPI)

### 1.1 Modifier l'endpoint de login (`/app/backend/routes/auth.py`)

```python
from fastapi import Response, status
from datetime import timedelta

@router.post("/login")
async def login(credentials: LoginRequest, response: Response):
    # ... validation existante ...
    
    # Générer le token JWT (code existant)
    token = create_access_token(data={"user_id": user["id"]})
    
    # NOUVEAU : Définir le cookie httpOnly au lieu de renvoyer le token
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,              # ← Empêche JavaScript d'accéder au cookie
        secure=True,                # ← HTTPS uniquement (production)
        samesite="lax",             # ← Protection CSRF
        max_age=3600 * 24 * 7,      # ← 7 jours
        path="/"
    )
    
    # Retourner les infos user SANS le token
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user.get("name")
        }
        # ❌ SUPPRIMER : "token": token
    }
```

### 1.2 Modifier le middleware d'authentification (`/app/backend/middleware/auth.py`)

```python
from fastapi import Request, HTTPException

def get_current_user_from_cookie(request: Request):
    # Lire le token depuis le cookie au lieu du header Authorization
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Non authentifié"
        )
    
    # Valider le token (code existant)
    payload = verify_token(token)
    return payload
```

### 1.3 Ajouter un endpoint de logout

```python
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Déconnexion réussie"}
```

---

## Étape 2 : Frontend (React)

### 2.1 Modifier AuthContext (`/app/frontend/src/context/AuthContext.jsx`)

**AVANT** :
```javascript
const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);  // ❌ À SUPPRIMER
    setToken(token);                        // ❌ À SUPPRIMER
    setUser(user);
};
```

**APRÈS** :
```javascript
const login = async (email, password) => {
    const response = await axios.post(
        `${API}/auth/login`, 
        { email, password },
        { withCredentials: true }  // ← Permet d'envoyer/recevoir les cookies
    );
    
    const { user } = response.data;
    // Le token est maintenant dans un cookie httpOnly
    // ❌ Plus de localStorage.setItem('token', ...)
    
    setUser(user);
    setIsAuthenticated(true);
};

const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    setIsAuthenticated(false);
};

// Supprimer complètement l'état `token`
// const [token, setToken] = useState(null);  ❌ À SUPPRIMER
```

### 2.2 Configurer Axios pour envoyer les cookies (`/app/frontend/src/App.js` ou `index.js`)

```javascript
import axios from 'axios';

// Configurer axios globalement pour envoyer les cookies
axios.defaults.withCredentials = true;
```

### 2.3 Supprimer tous les usages de localStorage

**Fichiers à modifier** :
- `/app/frontend/src/context/AuthContext.jsx` (lignes 14, 19, 42, 56)
- `/app/frontend/src/pages/VenueAccounting.jsx` (ligne 23)
- `/app/frontend/src/pages/AdminAnalytics.jsx` (ligne 23)
- `/app/frontend/src/hooks/useNotifications.js` (lignes 21, 35)
- `/app/frontend/src/hooks/useOnlineStatus.js` (ligne 17)

**Pattern de remplacement** :
```javascript
// ❌ AVANT
const token = localStorage.getItem('token');
axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

// ✅ APRÈS
axios.get(url, { withCredentials: true });
// Le cookie est envoyé automatiquement
```

---

## Étape 3 : Configuration CORS

### 3.1 Backend - Autoriser les credentials (`/app/backend/server.py`)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://collapsible-map.preview.emergentagent.com",
        "http://localhost:3000"  # Pour développement
    ],
    allow_credentials=True,      # ← CRUCIAL pour les cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Étape 4 : Testing

### 4.1 Test du flux complet

```bash
# 1. Login
curl -X POST https://collapsible-map.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test"}' \
  -c cookies.txt  # Sauvegarder les cookies

# 2. Appel authentifié
curl https://collapsible-map.preview.emergentagent.com/api/musicians/me \
  -b cookies.txt  # Envoyer les cookies

# 3. Logout
curl -X POST https://collapsible-map.preview.emergentagent.com/api/auth/logout \
  -b cookies.txt
```

### 4.2 Vérifier dans le navigateur

1. Ouvrir DevTools → Application → Cookies
2. Vérifier que `access_token` existe avec :
   - `HttpOnly` : ✅ Coché
   - `Secure` : ✅ Coché (en production)
   - `SameSite` : Lax

---

## Avantages de cette solution

✅ **Sécurité** : Token inaccessible au JavaScript (protection XSS)
✅ **Automatique** : Cookies envoyés automatiquement avec chaque requête
✅ **Standard** : Pratique recommandée pour l'authentification web
✅ **CSRF Protection** : SameSite=Lax protège contre les attaques CSRF

## Inconvénients

⚠️ **Mobile Apps** : Ne fonctionne pas pour des apps mobiles natives (mais OK pour web mobile)
⚠️ **Migration** : Nécessite de déconnecter tous les utilisateurs actuels

---

## Checklist de Migration

- [ ] Backend : Modifier endpoint `/auth/login`
- [ ] Backend : Modifier middleware d'authentification
- [ ] Backend : Ajouter endpoint `/auth/logout`
- [ ] Backend : Configurer CORS avec `allow_credentials=True`
- [ ] Frontend : Supprimer `localStorage.setItem/getItem('token')`
- [ ] Frontend : Configurer `axios.defaults.withCredentials = true`
- [ ] Frontend : Modifier AuthContext
- [ ] Frontend : Modifier tous les hooks utilisant le token
- [ ] Testing : Tester login/logout/requêtes authentifiées
- [ ] Production : Forcer déconnexion de tous les utilisateurs

---

## Estimation

**Temps total** : 1-2 jours
- Backend : 2-3 heures
- Frontend : 3-4 heures
- Testing : 2 heures
- Déploiement : 1 heure
