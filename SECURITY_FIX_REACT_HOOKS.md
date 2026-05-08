# Guide de Correction : React Hook Dependencies

## ⚠️ IMPORTANT - Stale Closure Bugs

### Problème
39+ hooks (useCallback, useEffect) ont des dépendances manquantes, causant des bugs de "stale closure" où l'état ancien est utilisé au lieu du nouvel état.

---

## Fichiers Affectés

### 1. `/app/frontend/src/pages/VenueDashboard.jsx`

**Lignes problématiques** : 461, 537, 636, 645, 659, 672

**Exemple de bug (ligne 537)** :
```javascript
// ❌ AVANT - Dépendances manquantes
const fetchEvents = useCallback(async () => {
    const response = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    setJams(response.data.jams);
    setConcerts(response.data.concerts);
    // ... utilise API, axios, token, setJams, setConcerts
}, []); // ← Tableau vide = dépendances manquantes !

// ✅ APRÈS - Toutes les dépendances
const fetchEvents = useCallback(async () => {
    const response = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    setJams(response.data.jams);
    setConcerts(response.data.concerts);
}, [token]); // ← Ajouter toutes les dépendances externes
```

### 2. `/app/frontend/src/pages/VenueDetail.jsx`

**Lignes problématiques** : 119, 139, 164, 176, 186, 204, 260, 273, 327

---

## Solution Automatique (Recommandée)

### Méthode 1 : Utiliser l'outil ESLint

```bash
# Installer la règle si nécessaire
npm install eslint-plugin-react-hooks --save-dev

# Créer .eslintrc.json temporaire
cat > /app/frontend/.eslintrc.json << 'EOF'
{
  "extends": ["react-app"],
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/exhaustive-deps": "error"
  }
}
EOF

# Lancer ESLint et obtenir la liste des erreurs
npx eslint src/pages/VenueDashboard.jsx --format json > /tmp/eslint-errors.json

# Voir les erreurs
cat /tmp/eslint-errors.json | jq '.[] | .messages[] | select(.ruleId == "react-hooks/exhaustive-deps")'
```

---

## Solution Manuelle

### Pattern 1 : useCallback

**Règle** : Ajouter toutes les variables référencées dans la fonction qui viennent de l'extérieur.

```javascript
const myFunction = useCallback(() => {
    // Références externes : API, token, someState
    axios.get(`${API}/endpoint`, { headers: { Authorization: token } });
    console.log(someState);
}, [token, someState]); // ← Ajouter toutes les variables externes (sauf API qui est constant)
```

**Exception** : Les fonctions `setState` de React (setJams, setConcerts, etc.) n'ont PAS besoin d'être dans les dépendances car elles sont stables.

### Pattern 2 : useEffect

```javascript
useEffect(() => {
    if (user && user.id) {
        fetchData(user.id);
    }
}, [user, fetchData]); // ← Ajouter user ET fetchData
```

---

## Corrections Spécifiques

### VenueDashboard.jsx

#### Ligne 461 : fetchProfile
```javascript
const fetchProfile = useCallback(async () => {
    const response = await axios.get(`${API}/venues/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    setProfile(response.data);
}, [token]); // ← Ajouter token
```

#### Ligne 537 : fetchEvents
```javascript
const fetchEvents = useCallback(async () => {
    const response = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    // ...
}, [token]); // ← Ajouter token
```

#### Ligne 636 : fetchMusicians
```javascript
const fetchMusicians = useCallback(async () => {
    const response = await axios.get(`${API}/musicians`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    // ...
}, [token]); // ← Ajouter token
```

#### Ligne 645 : fetchNotifications
```javascript
const fetchNotifications = useCallback(async () => {
    const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    // ...
}, [token]); // ← Ajouter token
```

#### Ligne 659 : fetchUnreadMessages
```javascript
const fetchUnreadMessages = useCallback(async () => {
    const response = await axios.get(`${API}/messages/unread`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    // ...
}, [token]); // ← Ajouter token
```

---

## Pattern Avancé : Circular Dependencies

Si vous avez des dépendances circulaires :

```javascript
// ❌ Problème
const fetchA = useCallback(() => {
    fetchB();
}, [fetchB]);

const fetchB = useCallback(() => {
    fetchA();
}, [fetchA]); // ← Dépendance circulaire !

// ✅ Solution : useRef
const fetchBRef = useRef();

const fetchA = useCallback(() => {
    fetchBRef.current();
}, []);

const fetchB = useCallback(() => {
    // ...
}, []);

fetchBRef.current = fetchB;
```

---

## Testing Après Correction

### 1. Vérifier qu'il n'y a plus d'erreurs ESLint

```bash
npx eslint src/pages/VenueDashboard.jsx | grep "react-hooks/exhaustive-deps"
# Doit retourner 0 erreur
```

### 2. Tester manuellement

- Tester toutes les fonctions qui utilisent les hooks corrigés
- Vérifier que les données se mettent à jour correctement
- S'assurer qu'il n'y a pas de boucles infinies (useEffect qui se déclenche en boucle)

### 3. Utiliser le Testing Agent

```
deep_testing_backend_v2 : Tester tous les flows frontend après correction des hooks
```

---

## Checklist

### VenueDashboard.jsx
- [ ] Ligne 461 : fetchProfile → Ajouter `[token]`
- [ ] Ligne 537 : fetchEvents → Ajouter `[token]`
- [ ] Ligne 636 : fetchMusicians → Ajouter `[token]`
- [ ] Ligne 645 : fetchNotifications → Ajouter `[token]`
- [ ] Ligne 659 : fetchUnreadMessages → Ajouter `[token]`
- [ ] Ligne 672+ : Vérifier tous les useEffect

### VenueDetail.jsx
- [ ] Ligne 119 : Corriger dépendances
- [ ] Ligne 139 : Corriger dépendances
- [ ] Ligne 164 : Corriger dépendances
- [ ] Ligne 176 : Corriger dépendances
- [ ] Ligne 186 : Corriger dépendances
- [ ] Ligne 204 : Corriger dépendances
- [ ] Ligne 260 : Corriger dépendances
- [ ] Ligne 273 : Corriger dépendances
- [ ] Ligne 327 : Corriger dépendances

---

## Estimation

**Temps total** : 1 jour
- Analyse : 2 heures
- Corrections : 4 heures
- Testing : 2 heures
