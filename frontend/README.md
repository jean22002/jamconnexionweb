# ⚛️ Jam Connexion - Frontend Documentation

**React 18 + Tailwind CSS + Shadcn UI**

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Configuration](#configuration)
5. [Composants principaux](#composants-principaux)
6. [Context & State Management](#context--state-management)
7. [Routing](#routing)
8. [API Integration](#api-integration)
9. [WebSocket (Socket.IO)](#websocket-socketio)
10. [Deployment](#deployment)

---

## 🎯 Vue d'ensemble

Le frontend Jam Connexion est une **Single Page Application (SPA)** construite avec **React 18** qui offre :
- Authentification utilisateur (JWT)
- Dashboards pour musiciens, établissements, mélomanes
- Carte interactive (Leaflet)
- Messagerie temps réel (Socket.IO)
- Upload d'images
- Notifications push
- Design responsive (mobile-first)

---

## 🛠️ Stack technique

| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 18.2+ | Framework UI |
| **React Router** | 6.22+ | Navigation |
| **Axios** | 1.6+ | Requêtes HTTP |
| **Tailwind CSS** | 3.4+ | Styling |
| **Shadcn UI** | Latest | Composants UI |
| **Leaflet** | 1.9+ | Carte interactive |
| **Socket.IO Client** | 4.7+ | WebSocket |
| **Sonner** | 1.4+ | Toasts/notifications |
| **Lucide React** | Latest | Icônes |

---

## 📁 Structure des fichiers

```
/app/frontend/
├── public/                       # Assets statiques
│   ├── index.html
│   ├── manifest.json
│   └── icons/
│
├── src/
│   ├── components/              # Composants réutilisables
│   │   ├── ui/                 # Shadcn UI components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── card.jsx
│   │   │   └── ...
│   │   ├── venue/              # Composants établissements
│   │   ├── candidatures/       # Système de candidatures
│   │   │   └── BandSelectionModal.jsx  # NEW
│   │   ├── accounting/         # Facturation
│   │   ├── applications/       # Candidatures
│   │   ├── ChatPopupManager.jsx
│   │   ├── PWAPrompt.jsx
│   │   └── ...
│   │
│   ├── features/               # Features complexes
│   │   ├── musician-dashboard/
│   │   │   ├── tabs/
│   │   │   │   ├── MapTab.jsx          # Carte interactive (filtres, GUSO)
│   │   │   │   ├── InfoTab.jsx
│   │   │   │   ├── PlanningTab.jsx
│   │   │   │   └── ...
│   │   │   ├── profile/
│   │   │   │   ├── BandTab.jsx         # Gestion groupes
│   │   │   │   └── ...
│   │   │   └── hooks/
│   │   │
│   │   └── venue-dashboard/
│   │       ├── tabs/
│   │       ├── dialogs/
│   │       └── hooks/
│   │
│   ├── pages/                  # Pages principales
│   │   ├── Landing.jsx         # Page d'accueil
│   │   ├── Auth.jsx            # Login/Register
│   │   ├── MusicianDashboard.jsx
│   │   ├── VenueDashboard.jsx
│   │   ├── MelomaneDashboard.jsx
│   │   ├── MessagesImproved.jsx      # NEW: Scroll infini + recherche
│   │   ├── ModerationSettingsPage.jsx # NEW: Admin settings
│   │   ├── VerifyEmail.jsx
│   │   ├── MapExplorer.jsx
│   │   ├── BadgesPage.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── ...
│   │
│   ├── context/                # React Contexts
│   │   ├── AuthContext.jsx    # Authentification
│   │   └── BadgeContext.jsx   # Badges
│   │
│   ├── hooks/                  # Hooks personnalisés
│   │   └── ...
│   │
│   ├── App.js                  # Router principal
│   ├── App.css                 # Styles globaux
│   ├── index.js                # Point d'entrée
│   └── index.css               # Tailwind imports
│
├── .env                        # Variables d'environnement
├── package.json                # Dépendances
├── tailwind.config.js          # Config Tailwind
└── README.md                   # Ce fichier
```

---

## ⚙️ Configuration

### Variables d'environnement (`.env`)

```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://jamconnexion.com

# OU en preview Emergent :
# REACT_APP_BACKEND_URL=https://collapsible-map.preview.emergentagent.com

# OU en local :
# REACT_APP_BACKEND_URL=http://localhost:8001
```

⚠️ **Important** : Les variables `REACT_APP_*` sont **compilées dans le build** au moment de `yarn build`. Pour changer l'URL en production, il faut rebuild.

### Démarrage

```bash
# Installation des dépendances
yarn install

# Démarrer le serveur de développement
yarn start
# → http://localhost:3000

# Build pour production
yarn build
# → /build/

# Linter
yarn lint
```

---

## 🧩 Composants principaux

### Shadcn UI Components

Tous les composants UI sont dans `/src/components/ui/` :

```jsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

<Button variant="primary" size="lg">
  Postuler
</Button>
```

**Composants disponibles** :
- `button.jsx`
- `input.jsx`
- `card.jsx`
- `dialog.jsx`
- `select.jsx`
- `textarea.jsx`
- `label.jsx`
- `separator.jsx`
- `badge.jsx`
- Et bien d'autres...

### Composants métier

#### BandSelectionModal (NEW)

Permet de choisir avec quel groupe postuler :

```jsx
import BandSelectionModal from '@/components/candidatures/BandSelectionModal';

<BandSelectionModal
  isOpen={showBandModal}
  onClose={() => setShowBandModal(false)}
  bands={userBands}
  onSelectBand={(band) => handleApply(slotId, band?.id)}
/>
```

#### MapTab

Carte interactive avec filtres :

```jsx
// features/musician-dashboard/tabs/MapTab.jsx
- Carte Leaflet
- Filtres par style musical
- Filtre GUSO
- Clustering des markers
- Popup détails établissement
```

---

## 🔄 Context & State Management

### AuthContext

Gestion de l'authentification globale :

```jsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, token, login, logout, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <div>Non connecté</div>;

  return <div>Bonjour {user.name}</div>;
}
```

**Fonctions disponibles** :
- `login(email, password)` : Connexion
- `logout()` : Déconnexion
- `refreshUser()` : Rafraîchir les données utilisateur
- `user` : Objet utilisateur
- `token` : JWT token
- `loading` : État de chargement

### BadgeContext

Gestion des badges :

```jsx
import { useBadges } from '@/context/BadgeContext';

function MyComponent() {
  const { badges, unlockedBadges, checkAndUnlockBadges } = useBadges();

  useEffect(() => {
    checkAndUnlockBadges();
  }, []);

  return (
    <div>
      Badges débloqués : {unlockedBadges.length}
    </div>
  );
}
```

---

## 🗺️ Routing

### Routes principales

```jsx
// App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  {/* Public */}
  <Route path="/" element={<Landing />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/verify-email" element={<VerifyEmail />} />

  {/* Protected */}
  <Route 
    path="/musician" 
    element={<ProtectedRoute allowedRole="musician"><MusicianDashboard /></ProtectedRoute>} 
  />
  <Route 
    path="/venue" 
    element={<ProtectedRoute allowedRole="venue"><VenueDashboard /></ProtectedRoute>} 
  />
  <Route 
    path="/melomane" 
    element={<ProtectedRoute allowedRole="melomane"><MelomaneDashboard /></ProtectedRoute>} 
  />

  {/* Admin */}
  <Route 
    path="/admin/moderation-settings" 
    element={<ProtectedRoute allowedRole="admin"><ModerationSettingsPage /></ProtectedRoute>} 
  />

  {/* Messages */}
  <Route path="/messages" element={<ProtectedRoute><MessagesImproved /></ProtectedRoute>} />
</Routes>
```

### ProtectedRoute

Composant pour protéger les routes :

```jsx
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} />;
  }

  return children;
};
```

---

## 🔌 API Integration

### Configuration Axios

```jsx
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Requête authentifiée
const fetchData = async () => {
  const response = await axios.get(`${API}/musicians`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
```

### Gestion des erreurs

```jsx
import { toast } from 'sonner';

try {
  const response = await axios.post(`${API}/messages`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  toast.success('Message envoyé !');
} catch (error) {
  if (error.response?.status === 401) {
    // Token expiré
    logout();
  } else if (error.response?.status === 403) {
    toast.error('Accès refusé. Passez en PRO !');
  } else {
    toast.error('Erreur lors de l\'envoi');
  }
}
```

### Pagination (Scroll infini)

Exemple dans `MessagesImproved.jsx` :

```jsx
const [messages, setMessages] = useState([]);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);
const LIMIT = 50;

const loadMoreMessages = async () => {
  const response = await axios.get(
    `${API}/messages/conversation/${partnerId}?limit=${LIMIT}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  setMessages(prev => [...response.data, ...prev]);
  setOffset(offset + LIMIT);
  setHasMore(response.data.length === LIMIT);
};

// IntersectionObserver
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMessages();
      }
    },
    { threshold: 0.1 }
  );

  if (messagesTopRef.current) {
    observer.observe(messagesTopRef.current);
  }

  return () => observer.disconnect();
}, [hasMore, offset]);
```

---

## 🔔 WebSocket (Socket.IO)

### Configuration

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, {
      path: '/api/socket.io',
      transports: ['websocket'],
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  return socket;
}
```

### Écoute des événements

```jsx
function NotificationListener({ socket }) {
  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (notification) => {
      toast.info(notification.title, {
        description: notification.message,
        action: {
          label: 'Voir',
          onClick: () => navigate(notification.link)
        }
      });
    });

    socket.on('new_message', (message) => {
      // Mettre à jour la conversation
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('new_notification');
      socket.off('new_message');
    };
  }, [socket]);

  return null;
}
```

---

## 🎨 Styling

### Tailwind CSS

Configuration dans `tailwind.config.js` :

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Inter", "sans-serif"],
      }
    }
  },
  plugins: []
}
```

### Classes utilitaires

```jsx
<div className="glassmorphism rounded-xl p-6 border border-white/10">
  <h1 className="font-heading font-bold text-3xl text-primary">
    Titre
  </h1>
  <p className="text-muted-foreground text-sm">
    Description
  </p>
</div>
```

### Responsive

Mobile-first approach :

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 col mobile, 2 cols tablette, 3 cols desktop */}
</div>

<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Titre responsive
</h1>
```

---

## 📱 PWA (Progressive Web App)

### Manifest

```json
// public/manifest.json
{
  "short_name": "Jam Connexion",
  "name": "Jam Connexion - Plateforme musiciens",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#8B5CF6",
  "background_color": "#0F0A1F"
}
```

### Service Worker

Géré automatiquement par Create React App via `workbox`.

---

## 🧪 Tests

### Structure

```bash
/src/__tests__/
├── components/
│   ├── Button.test.jsx
│   └── ...
├── pages/
│   ├── Landing.test.jsx
│   └── ...
└── utils/
```

### Exécution

```bash
# Tous les tests
yarn test

# Mode watch
yarn test --watch

# Coverage
yarn test --coverage
```

### Exemple de test

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '@/pages/Auth';

test('renders login form', () => {
  render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  );

  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
  const submitButton = screen.getByRole('button', { name: /connexion/i });

  expect(emailInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();
});
```

---

## 🚀 Deployment

### Build pour production

```bash
# Build
yarn build

# Le dossier /build/ contient les fichiers statiques
```

### Cloudflare Pages

1. **Connecter le repo GitHub**
2. **Build settings** :
   - Build command: `yarn build`
   - Build output directory: `build`
3. **Environment variables** :
   - `REACT_APP_BACKEND_URL` = `https://jamconnexion.com`

### Nginx (si hébergement custom)

```nginx
server {
    listen 80;
    server_name jamconnexion.com;

    root /var/www/jamconnexion/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Proxy pour le backend
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Dépannage

### "Module not found" errors

```bash
# Nettoyer et réinstaller
rm -rf node_modules yarn.lock
yarn install
```

### Hot reload ne fonctionne pas

```bash
# Vérifier que FAST_REFRESH est activé
echo "FAST_REFRESH=true" >> .env

# Redémarrer
yarn start
```

### Build échoue

```bash
# Augmenter la mémoire Node
export NODE_OPTIONS=--max_old_space_size=4096
yarn build
```

---

## 📚 Ressources

- **React Docs** : https://react.dev/
- **Tailwind CSS** : https://tailwindcss.com/
- **Shadcn UI** : https://ui.shadcn.com/
- **Leaflet** : https://leafletjs.com/
- **Socket.IO Client** : https://socket.io/docs/v4/client-api/

---

**Dernière mise à jour** : 13 avril 2026  
**Auteur** : Équipe Jam Connexion
