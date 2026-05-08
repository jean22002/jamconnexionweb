# IMPLÉMENTATION RAPIDE : httpOnly Cookies - PRÊT À COPIER-COLLER

## ⚠️ IMPORTANT
Ces modifications sont prêtes à être appliquées. Suivez l'ordre exact.

---

## BACKEND

### 1. Modifier `/app/backend/routes/auth.py`

#### Ligne 1 - Ajouter Response dans les imports
```python
from fastapi import APIRouter, HTTPException, Depends, Request, Response  # ← Ajouter Response
```

#### Lignes 124-188 - Remplacer l'endpoint /login
```python
@router.post("/login")  # ← Supprimer response_model=TokenResponse
@limiter.limit("10/5minutes")
async def login(request: Request, response: Response, data: UserLogin):  # ← Ajouter response: Response
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if not user:
        logger.warning(f"Login attempt for non-existent email: {data.email}")
        await log_action(
            user_id=data.email,
            user_role="unknown",
            action="login",
            resource_type="auth",
            details={"email": data.email, "reason": "user_not_found"},
            request=request,
            status="failed"
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    password_valid = verify_password(data.password, user["password"])
    logger.info(f"Password verification for {data.email}: {password_valid}")
    
    if not password_valid:
        logger.warning(f"Invalid password for {data.email}")
        await log_action(
            user_id=data.email,
            user_role="unknown",
            action="login",
            resource_type="auth",
            details={"email": data.email, "reason": "invalid_password"},
            request=request,
            status="failed"
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    email_verified = user.get("email_verified")
    if email_verified is not None and not email_verified:
        raise HTTPException(
            status_code=403, 
            detail="Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte mail."
        )
    
    await log_action(
        user_id=user["id"],
        user_role=user["role"],
        action="login",
        resource_type="auth",
        request=request,
        status="success"
    )
    
    token = create_token(user["id"], user["email"], user["role"])
    
    # NOUVEAU : Définir le cookie httpOnly
    is_production = os.environ.get('ENVIRONMENT') == 'production'
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,  # HTTPS uniquement en production
        samesite="lax",
        max_age=3600 * 24 * 7,  # 7 jours
        path="/"
    )
    
    # Retourner UNIQUEMENT les infos user (PAS le token)
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", user["email"]),
            "role": user["role"],
            "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"],
            "subscription_status": user.get("subscription_status"),
            "trial_end": user.get("trial_end").isoformat() if isinstance(user.get("trial_end"), datetime) else user.get("trial_end")
        }
    }
```

#### Ajouter un endpoint logout APRÈS /login
```python
@router.post("/logout")
async def logout(response: Response):
    """Déconnexion - Supprime le cookie httpOnly"""
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Déconnexion réussie"}
```

### 2. Modifier `/app/backend/utils/auth.py`

Trouvez la fonction `get_current_user` et modifiez-la :

```python
async def get_current_user(request: Request) -> dict:
    """Extraire et valider le token depuis le cookie httpOnly"""
    # Lire le token depuis le cookie
    token = request.cookies.get("access_token")
    
    if not token:
        # Fallback : Essayer aussi le header Authorization (compatibilité)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    try:
        # Le reste du code existant (validation JWT)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Récupérer l'utilisateur depuis MongoDB
        user = await get_db().users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
```

### 3. Modifier `/app/backend/server.py` - CORS

Trouvez la configuration CORS et ajoutez `allow_credentials=True` :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://collapsible-map.preview.emergentagent.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,  # ← AJOUTER CETTE LIGNE (CRUCIAL !)
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## FRONTEND

### 4. Configurer Axios - `/app/frontend/src/index.js` OU `/app/frontend/src/App.js`

Ajouter TOUT EN HAUT après les imports :

```javascript
import axios from 'axios';

// Configuration globale pour envoyer les cookies
axios.defaults.withCredentials = true;
```

### 5. Modifier `/app/frontend/src/context/AuthContext.jsx`

#### SUPPRIMER toutes les lignes localStorage

Cherchez et SUPPRIMEZ :
- Ligne 14 : `localStorage.setItem('token', ...)`
- Ligne 19 : `const savedToken = localStorage.getItem('token')`
- Ligne 42 : `localStorage.setItem('token', ...)`
- Ligne 56 : `localStorage.removeItem('token')`

#### Remplacer la fonction login :

```javascript
const login = async (email, password) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/auth/login`, 
            { email, password },
            { withCredentials: true }  // ← Permet cookies
        );
        
        const { user } = response.data;
        // Le token est maintenant dans un cookie httpOnly
        // Plus besoin de localStorage !
        
        setUser(user);
        setIsAuthenticated(true);
        navigate('/dashboard');
    } catch (error) {
        throw error;
    }
};
```

#### Remplacer la fonction logout :

```javascript
const logout = async () => {
    try {
        await axios.post(
            `${API_URL}/api/auth/logout`,
            {},
            { withCredentials: true }
        );
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        setUser(null);
        setIsAuthenticated(false);
        navigate('/auth');
    }
};
```

#### SUPPRIMER complètement l'état token :

```javascript
// ❌ SUPPRIMER CETTE LIGNE
// const [token, setToken] = useState(null);

// Supprimer aussi token du return :
return (
    <AuthContext.Provider value={{ 
        user, 
        // token,  ← SUPPRIMER
        isAuthenticated, 
        login, 
        logout, 
        refreshUser 
    }}>
```

### 6. Modifier tous les autres fichiers

#### `/app/frontend/src/pages/VenueAccounting.jsx` (ligne 23)
#### `/app/frontend/src/pages/AdminAnalytics.jsx` (ligne 23)
#### `/app/frontend/src/hooks/useNotifications.js` (lignes 21, 35)
#### `/app/frontend/src/hooks/useOnlineStatus.js` (ligne 17)

**Pattern de remplacement** :

```javascript
// ❌ AVANT
const token = localStorage.getItem('token');
axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

// ✅ APRÈS
axios.get(url, { withCredentials: true });
// Le cookie est envoyé automatiquement !
```

---

## TESTING

### Test Backend (Curl)

```bash
API_URL="https://collapsible-map.preview.emergentagent.com"

# 1. Login - Sauvegarder cookies
curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test"}' \
  -c cookies.txt -v

# 2. Requête authentifiée
curl "$API_URL/api/musicians/me" \
  -b cookies.txt

# 3. Logout
curl -X POST "$API_URL/api/auth/logout" \
  -b cookies.txt
```

### Test Frontend (DevTools)

1. Login dans l'app
2. Ouvrir DevTools → Application → Cookies
3. Vérifier `access_token` avec :
   - `HttpOnly`: ✅
   - `Secure`: ✅ (production)
   - `SameSite`: Lax

---

## CHECKLIST

### Backend
- [ ] `routes/auth.py` : Import Response
- [ ] `routes/auth.py` : Modifier /login (set_cookie)
- [ ] `routes/auth.py` : Ajouter /logout
- [ ] `utils/auth.py` : Modifier get_current_user (cookies)
- [ ] `server.py` : CORS allow_credentials=True
- [ ] Redémarrer backend : `sudo supervisorctl restart backend`

### Frontend
- [ ] `index.js` ou `App.js` : axios.defaults.withCredentials = True
- [ ] `AuthContext.jsx` : Supprimer localStorage
- [ ] `AuthContext.jsx` : Supprimer état token
- [ ] `AuthContext.jsx` : Modifier login/logout
- [ ] `VenueAccounting.jsx` : Supprimer token
- [ ] `AdminAnalytics.jsx` : Supprimer token
- [ ] `useNotifications.js` : Supprimer token
- [ ] `useOnlineStatus.js` : Supprimer token
- [ ] Redémarrer frontend : `sudo supervisorctl restart frontend`

### Tests
- [ ] curl : Login + requête authentifiée
- [ ] Browser : Vérifier cookie httpOnly
- [ ] Testing agent : Tester tous les flows

---

## ROLLBACK (Si problème)

```bash
git diff > /tmp/httponly_changes.patch
git checkout -- .
sudo supervisorctl restart backend frontend
```

---

**Temps estimé** : 2-3 heures (si vous suivez ce guide étape par étape)
