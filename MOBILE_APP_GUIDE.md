# 📱 Jam Connexion - Guide App Mobile

**Documentation pour le développement de l'application mobile**

---

## 🎯 Vue d'ensemble

Ce document est destiné à l'agent/développeur qui travaillera sur **l'application mobile** (iOS & Android) de Jam Connexion. Il contient toutes les informations nécessaires pour :
- Comprendre l'architecture existante
- Intégrer les APIs backend
- Implémenter les fonctionnalités clés
- Respecter les conventions de l'écosystème Jam Connexion

---

## 📚 Documents de référence

Avant de commencer, lire dans cet ordre :

1. **`/app/README.md`** → Vue d'ensemble globale de l'application
2. **`/app/API_DOCUMENTATION.md`** → Documentation complète des endpoints API
3. **`/app/backend/README.md`** → Architecture backend
4. **Ce document** → Spécificités mobile

---

## 🏗️ Stack technique recommandée

### Option 1 : React Native + Expo (Recommandé)

**Avantages** :
- Code partagé avec le web (composants similaires)
- Écosystème riche
- Expo simplifie le build et déploiement
- Hot reload rapide

**Stack** :
- **React Native** 0.73+
- **Expo** SDK 50+
- **React Navigation** 6+ (navigation)
- **React Query** (cache & sync API)
- **Socket.IO Client** (WebSocket)
- **Expo Location** (géolocalisation)
- **Expo Image Picker** (photos)
- **Expo Notifications** (push)
- **React Native Maps** (carte)

### Option 2 : Flutter (Alternative)

**Avantages** :
- Performance native
- UI cohérente cross-platform

**Stack** :
- **Flutter** 3.x
- **Dio** (HTTP client)
- **Provider/Riverpod** (state management)
- **Socket.IO Dart** (WebSocket)
- **Google Maps Flutter** (carte)

### Option 3 : Native (iOS Swift + Android Kotlin)

Pour performance maximale et accès complet aux APIs natives.

---

## 🔐 Authentification

### Flow de connexion

```
1. User entre email/password
2. POST /api/auth/login
3. Backend retourne JWT token
4. Stocker token en local (SecureStore)
5. Utiliser token dans tous les headers
```

### Implémentation React Native

```javascript
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'https://jamconnexion.com/api';

// Login
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });

  const { token, user } = response.data;

  // Stocker le token de manière sécurisée
  await SecureStore.setItemAsync('jwt_token', token);
  await SecureStore.setItemAsync('user', JSON.stringify(user));

  return { token, user };
};

// Récupérer le token
export const getToken = async () => {
  return await SecureStore.getItemAsync('jwt_token');
};

// Logout
export const logout = async () => {
  await SecureStore.deleteItemAsync('jwt_token');
  await SecureStore.deleteItemAsync('user');
};

// Axios interceptor pour ajouter le token automatiquement
axios.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs 401 (token expiré)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await logout();
      // Rediriger vers login
      navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);
```

---

## 🗺️ Géolocalisation

### Permission & récupération de position

```javascript
import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Permission refusée', 'Activez la localisation pour voir les événements près de vous');
    return false;
  }
  
  return true;
};

export const getCurrentLocation = async () => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  };
};

// Mettre à jour le profil avec la position
export const updateUserLocation = async (latitude, longitude) => {
  const token = await getToken();
  const user = JSON.parse(await SecureStore.getItemAsync('user'));

  let endpoint;
  if (user.role === 'musician') {
    endpoint = `/musicians/${user.id}`;
  } else if (user.role === 'venue') {
    endpoint = `/venues/${user.id}`;
  } else {
    endpoint = `/melomanes/${user.id}`;
  }

  await axios.put(`${API_URL}${endpoint}`, {
    latitude,
    longitude
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
```

---

## 🗺️ Carte interactive

### React Native Maps

```javascript
import MapView, { Marker, Callout } from 'react-native-maps';

function VenuesMap() {
  const [venues, setVenues] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadVenues();
    loadUserLocation();
  }, []);

  const loadVenues = async () => {
    const response = await axios.get(`${API_URL}/venues`);
    setVenues(response.data);
  };

  const loadUserLocation = async () => {
    const location = await getCurrentLocation();
    setUserLocation(location);
  };

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: userLocation?.latitude || 48.8566,
        longitude: userLocation?.longitude || 2.3522,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5
      }}
      showsUserLocation
    >
      {venues.map((venue) => (
        <Marker
          key={venue.id}
          coordinate={{
            latitude: venue.latitude,
            longitude: venue.longitude
          }}
        >
          <Callout onPress={() => navigation.navigate('VenueDetail', { id: venue.id })}>
            <View style={{ width: 200 }}>
              <Text style={{ fontWeight: 'bold' }}>{venue.name}</Text>
              <Text>{venue.city}</Text>
              <Text>{venue.music_styles.join(', ')}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
```

---

## 💬 Messagerie avec scroll infini

```javascript
import { FlashList } from '@shopify/flash-list';

function Conversation({ partnerId }) {
  const [messages, setMessages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const LIMIT = 50;

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async (append = false) => {
    if (loading || (!append && messages.length > 0)) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/messages/conversation/${partnerId}?limit=${LIMIT}&offset=${append ? offset : 0}`
      );

      if (append) {
        setMessages([...response.data, ...messages]);
        setOffset(offset + LIMIT);
      } else {
        setMessages(response.data);
        setOffset(LIMIT);
      }

      setHasMore(response.data.length === LIMIT);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      loadMessages(true);
    }
  };

  return (
    <FlashList
      data={messages}
      renderItem={({ item }) => <MessageItem message={item} />}
      estimatedItemSize={80}
      onEndReached={loadMoreMessages}
      onEndReachedThreshold={0.5}
      inverted  // Messages du plus récent au plus ancien
      ListFooterComponent={
        loading && <ActivityIndicator size="small" color="#8B5CF6" />
      }
    />
  );
}
```

---

## 🔔 Notifications Push (Firebase)

### Setup Firebase

```bash
# Installer Firebase
expo install @react-native-firebase/app @react-native-firebase/messaging
```

### Demander permission & récupérer token

```javascript
import messaging from '@react-native-firebase/messaging';

export const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('✅ Notification permission granted');
    return true;
  }

  return false;
};

export const getFCMToken = async () => {
  const token = await messaging().getToken();
  return token;
};

// Enregistrer le token sur le backend
export const registerDevice = async () => {
  const token = await getFCMToken();
  const platform = Platform.OS; // 'ios' ou 'android'

  await axios.post(`${API_URL}/notifications/register-device`, {
    fcm_token: token,
    platform
  });
};
```

### Écouter les notifications

```javascript
useEffect(() => {
  // Notification en foreground
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('Notification reçue:', remoteMessage);
    
    // Afficher une notification locale
    Alert.alert(
      remoteMessage.notification.title,
      remoteMessage.notification.body
    );
  });

  // Notification en background (tap)
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification ouverte:', remoteMessage);
    
    // Naviguer vers la bonne page
    if (remoteMessage.data?.link) {
      navigation.navigate(remoteMessage.data.link);
    }
  });

  // App fermée (tap sur notification)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App ouverte depuis notification:', remoteMessage);
      }
    });

  return unsubscribe;
}, []);
```

---

## 🔌 WebSocket (Socket.IO)

```javascript
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      const token = await getToken();
      
      const newSocket = io('https://jamconnexion.com', {
        path: '/api/socket.io',
        transports: ['websocket'],
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
        setConnected(false);
      });

      newSocket.on('new_notification', (notification) => {
        // Afficher une notification locale
        console.log('New notification:', notification);
      });

      newSocket.on('new_message', (message) => {
        // Mettre à jour la conversation active
        console.log('New message:', message);
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  return { socket, connected };
}
```

---

## 📷 Upload d'images

```javascript
import * as ImagePicker from 'expo-image-picker';

export const pickImage = async () => {
  // Demander permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie');
    return null;
  }

  // Sélectionner image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }

  return null;
};

export const uploadImage = async (uri, type = 'musician') => {
  const formData = new FormData();
  
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg'
  });

  const endpoint = `/upload/${type}-photo`;
  
  const response = await axios.post(`${API_URL}${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.url;
};

// Utilisation
const handleUploadPhoto = async () => {
  const imageUri = await pickImage();
  if (imageUri) {
    setUploading(true);
    try {
      const url = await uploadImage(imageUri, 'musician');
      console.log('Image uploadée:', url);
      
      // Mettre à jour le profil
      await updateProfile({ profile_image: url });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
    } finally {
      setUploading(false);
    }
  }
};
```

---

## 📊 State Management avec React Query

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch venues
export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/venues`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Fetch mes candidatures
export const useMyApplications = () => {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/planning/applications`);
      return response.data;
    }
  });
};

// Mutation pour postuler
export const useApplyToSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, bandId, message }) => {
      const response = await axios.post(`${API_URL}/planning/${slotId}/apply`, {
        band_id: bandId,
        message
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les candidatures
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    }
  });
};

// Utilisation dans un composant
function ApplicationsScreen() {
  const { data: applications, isLoading, error } = useMyApplications();
  const applyMutation = useApplyToSlot();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const handleApply = (slotId, bandId) => {
    applyMutation.mutate({ slotId, bandId, message: 'Intéressé !' });
  };

  return (
    <FlatList
      data={applications}
      renderItem={({ item }) => <ApplicationItem item={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

---

## 🎨 Design System

### Couleurs (respecter le branding)

```javascript
export const colors = {
  primary: '#8B5CF6',      // Purple
  secondary: '#EC4899',    // Pink
  background: '#0F0A1F',   // Dark
  foreground: '#FFFFFF',   // White
  muted: '#9CA3AF',        // Gray
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B'
};
```

### Typographie

```javascript
export const typography = {
  heading: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: colors.foreground
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.foreground
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.muted
  }
};
```

### Composants UI réutilisables

```javascript
// Button.jsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export function Button({ title, onPress, loading, variant = 'primary', ...props }) {
  const bgColor = variant === 'primary' ? colors.primary : colors.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: bgColor,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        opacity: loading ? 0.6 : 1
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

---

## 📱 Navigation

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs pour musicien
function MusicianTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tab.Screen name="Dashboard" component={MusicianDashboard} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Stack principal
function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {user.role === 'musician' && (
              <Stack.Screen name="MusicianTabs" component={MusicianTabs} />
            )}
            {user.role === 'venue' && (
              <Stack.Screen name="VenueTabs" component={VenueTabs} />
            )}
            <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
            <Stack.Screen name="Conversation" component={ConversationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔧 Gestion des erreurs

```javascript
export const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
  if (error.response) {
    // Erreur HTTP
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.detail || 'Requête invalide';
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      case 403:
        return data.detail || 'Accès refusé';
      case 404:
        return 'Ressource non trouvée';
      case 429:
        return 'Trop de requêtes. Réessayez dans quelques instants.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      default:
        return data.detail || defaultMessage;
    }
  } else if (error.request) {
    // Pas de réponse du serveur
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  } else {
    // Autre erreur
    return error.message || defaultMessage;
  }
};

// Utilisation
try {
  await axios.post(`${API_URL}/messages`, data);
} catch (error) {
  const errorMessage = handleApiError(error);
  Alert.alert('Erreur', errorMessage);
}
```

---

## 🧪 Tests

```javascript
// __tests__/api/auth.test.js
import { login } from '@/services/auth';

describe('Authentication', () => {
  it('should login successfully', async () => {
    const { token, user } = await login('test@gmail.com', 'test');
    
    expect(token).toBeDefined();
    expect(user.email).toBe('test@gmail.com');
    expect(user.role).toBe('musician');
  });

  it('should fail with invalid credentials', async () => {
    await expect(
      login('wrong@gmail.com', 'wrong')
    ).rejects.toThrow();
  });
});
```

---

## 📋 Checklist de développement

### Phase 1 : Setup
- [ ] Initialiser projet React Native / Expo
- [ ] Configurer navigation (React Navigation)
- [ ] Implémenter authentification (JWT + SecureStore)
- [ ] Configurer Axios (interceptors, base URL)
- [ ] Setup React Query

### Phase 2 : Fonctionnalités Core
- [ ] Écrans de login/register
- [ ] Dashboard musicien/établissement/mélomane
- [ ] Carte interactive avec markers
- [ ] Liste des établissements/événements
- [ ] Système de candidatures (avec sélection groupe)
- [ ] Détails établissement/musicien

### Phase 3 : Messagerie
- [ ] Liste des conversations
- [ ] Conversation avec scroll infini
- [ ] Recherche dans messages
- [ ] Socket.IO (temps réel)

### Phase 4 : Notifications
- [ ] Firebase setup
- [ ] Demande de permission
- [ ] Enregistrement token FCM
- [ ] Notifications en foreground/background
- [ ] Navigation depuis notification

### Phase 5 : Features avancées
- [ ] Upload de photos (profil, galerie)
- [ ] Géolocalisation utilisateur
- [ ] Filtres (styles musicaux, région, GUSO)
- [ ] Badges & gamification
- [ ] Leaderboard

### Phase 6 : Polish
- [ ] Mode hors-ligne (cache local)
- [ ] Gestion des erreurs réseau
- [ ] Loading states
- [ ] Pull-to-refresh
- [ ] Design responsive (tablettes)

---

## 🚀 Déploiement

### iOS (App Store)

```bash
# Build avec Expo
eas build --platform ios

# Soumettre à l'App Store
eas submit --platform ios
```

### Android (Google Play)

```bash
# Build avec Expo
eas build --platform android

# Soumettre au Play Store
eas submit --platform android
```

---

## 📞 Support

**Pour toute question technique :**
- Consulter `/app/API_DOCUMENTATION.md` pour les endpoints
- Consulter `/app/README.md` pour l'architecture globale
- Utiliser les identifiants de test dans `/app/memory/test_credentials.md`

**API Base URL** : `https://jamconnexion.com/api`

---

**Bon développement ! 🚀**

---

**Dernière mise à jour** : 13 avril 2026  
**Version** : 1.0.0
