# 💳 Stripe - Intégration Paiements

<div align="center">

![Stripe](https://img.shields.io/badge/Stripe-Live_Mode-635BFF?style=for-the-badge&logo=stripe&logoColor=white)

**Documentation Stripe pour Jam Connexion Mobile**

</div>

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Utilisation dans l'App](#-utilisation-dans-lapp)
- [Phase 1 : MVP (Lecture seule)](#-phase-1--mvp-lecture-seule)
- [Phase 2 : Paiements in-app](#-phase-2--paiements-in-app)
- [Configuration](#-configuration)
- [Endpoints API](#-endpoints-api)

---

## 🎯 Vue d'ensemble

**Stripe** est utilisé pour gérer les **abonnements** dans Jam Connexion :

### Qui paie ?

| Rôle | Abonnement | Prix | Fonctionnalités |
|------|------------|------|-----------------|
| 🎤 **Établissement** | ✅ Obligatoire | 12,99 €/mois | Accès complet dashboard |
| 🎸 **Musicien PRO** | ⚡ Optionnel | À définir | Comptabilité + Analytics |
| 🎵 **Mélomane** | ❌ Gratuit | 0 € | Accès limité |

### Flux de Paiement (Web)

```
Établissement s'inscrit
    ↓
Période d'essai (14 jours)
    ↓
Email : "Votre essai se termine bientôt"
    ↓
Clic sur lien Stripe → Page paiement Stripe
    ↓
Paiement CB (Stripe Checkout)
    ↓
Webhook → Backend → Mise à jour `subscription_status`
    ↓
Dashboard débloqué ✅
```

---

## 📱 Utilisation dans l'App

### Configuration Actuelle

**Stripe est en LIVE MODE** (production) :

```env
STRIPE_API_KEY=sk_live_51SpGb6Bykagrg...
STRIPE_PRICE_ID=price_1SpH8aBykagr...
STRIPE_WEBHOOK_SECRET=whsec_ipa4aCdZBH...
```

**Lien de paiement direct** :
```
https://buy.stripe.com/aFa6oG9gV4d20te2uRafS02
```

---

## 🚀 Phase 1 : MVP (Lecture seule)

### ⚠️ Important pour l'Agent Mobile

**Pour la Phase 1 (MVP), l'app mobile N'A PAS BESOIN d'intégrer Stripe.**

**Pourquoi ?**
1. Les **établissements** s'abonnent via le **site web** (`jamconnexion.com`)
2. Les **musiciens PRO** upgradent via le **site web**
3. L'app mobile **lit seulement** le statut d'abonnement via l'API

### Vérification du Statut PRO/Abonné

L'app mobile doit simplement **lire** ces champs :

**Pour Établissements :**
```javascript
GET /api/venues/me

Response:
{
  "id": "venue_123",
  "name": "Le Blue Note",
  "subscription_status": "active",  // ← Important !
  "trial_days_left": 0,
  "subscription_end_date": "2024-12-31"
}
```

**Pour Musiciens :**
```javascript
GET /api/musicians/me

Response:
{
  "id": "mus_456",
  "pseudo": "John Doe",
  "is_pro": true,  // ← Important !
  "pro_subscription_end": "2024-12-31"
}
```

### Gestion dans l'App Mobile

**1. Dashboard Établissement**

```javascript
const VenueDashboard = () => {
  const [venue, setVenue] = useState(null);
  
  useEffect(() => {
    fetchVenue();
  }, []);
  
  const fetchVenue = async () => {
    const response = await api.get('/venues/me');
    setVenue(response.data);
  };
  
  // Vérifier si abonnement expiré
  const isSubscriptionExpired = venue?.subscription_status !== 'active';
  
  if (isSubscriptionExpired) {
    return (
      <View style={styles.expiredOverlay}>
        <Text style={styles.title}>Abonnement expiré</Text>
        <Text style={styles.message}>
          Votre période d'essai est terminée. 
          Abonnez-vous pour continuer à utiliser Jam Connexion.
        </Text>
        <Button 
          title="S'abonner (12,99 €/mois)" 
          onPress={() => Linking.openURL('https://jamconnexion.com/tarifs')}
        />
      </View>
    );
  }
  
  // Dashboard normal si actif
  return <VenueDashboardContent venue={venue} />;
};
```

**2. Dashboard Musicien (PRO)**

```javascript
const MusicianDashboard = () => {
  const [musician, setMusician] = useState(null);
  
  useEffect(() => {
    fetchMusician();
  }, []);
  
  const fetchMusician = async () => {
    const response = await api.get('/musicians/me');
    setMusician(response.data);
  };
  
  return (
    <Tabs>
      <Tab label="Carte" component={MapTab} />
      <Tab label="Planning" component={PlanningTab} />
      
      {/* Onglets PRO uniquement */}
      {musician?.is_pro ? (
        <>
          <Tab label="💼 Comptabilité" component={AccountingTab} />
          <Tab label="📊 Analytics" component={AnalyticsTab} />
        </>
      ) : (
        <Tab label="💼 Passer PRO" component={UpgradeToPROTab} />
      )}
      
      <Tab label="Candidatures" component={CandidaturesTab} />
      {/* ... autres onglets */}
    </Tabs>
  );
};
```

**3. Écran "Passer PRO"**

```javascript
const UpgradeToPROTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.proBadge}>
        <Icon name="star" size={48} color="#FFD700" />
        <Text style={styles.title}>Passez PRO</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Débloquez des fonctionnalités premium :
      </Text>
      
      <View style={styles.features}>
        <FeatureItem icon="💼" text="Comptabilité complète" />
        <FeatureItem icon="📊" text="Analytics et statistiques" />
        <FeatureItem icon="⭐" text="Badge PRO visible" />
        <FeatureItem icon="🚀" text="Priorité dans les résultats" />
      </View>
      
      <Text style={styles.price}>À partir de 9,99 €/mois</Text>
      
      <Button 
        title="Voir les offres PRO" 
        onPress={() => Linking.openURL('https://jamconnexion.com/tarifs')}
        style={styles.upgradeButton}
      />
      
      <Text style={styles.note}>
        Le paiement s'effectue sur le site web sécurisé.
      </Text>
    </View>
  );
};
```

---

## 🔮 Phase 2 : Paiements in-app

### ⚠️ À implémenter plus tard (pas MVP)

Pour permettre les paiements **directement dans l'app mobile**, il faudra :

### Installation

```bash
npm install @stripe/stripe-react-native
```

### Configuration

```javascript
// App.js
import { StripeProvider } from '@stripe/stripe-react-native';

const App = () => {
  return (
    <StripeProvider publishableKey="pk_live_...">
      {/* Votre app */}
    </StripeProvider>
  );
};
```

### Flux de Paiement in-app

```javascript
import { useStripe } from '@stripe/stripe-react-native';

const PaymentScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const handlePayment = async () => {
    // 1. Créer PaymentIntent sur le backend
    const response = await api.post('/stripe/create-payment-intent', {
      amount: 1299, // 12,99 €
      currency: 'eur'
    });
    
    const { clientSecret } = response.data;
    
    // 2. Initialiser Payment Sheet
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Jam Connexion',
    });
    
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    
    // 3. Afficher Payment Sheet
    const { error: paymentError } = await presentPaymentSheet();
    
    if (paymentError) {
      Alert.alert('Paiement annulé', paymentError.message);
    } else {
      Alert.alert('Succès', 'Abonnement activé !');
      // Rafraîchir le profil
      fetchProfile();
    }
  };
  
  return (
    <View>
      <Button title="Payer 12,99 €/mois" onPress={handlePayment} />
    </View>
  );
};
```

### Endpoints Backend à Créer (Phase 2)

```http
POST /api/stripe/create-payment-intent
POST /api/stripe/create-subscription
POST /api/stripe/cancel-subscription
GET /api/stripe/payment-methods
```

---

## 🔌 Endpoints API (Actuels)

### Vérification Statut Abonnement

```http
GET /api/venues/me
Authorization: Bearer {token}

Response:
{
  "subscription_status": "active" | "trial" | "expired" | "cancelled",
  "trial_days_left": 5,
  "subscription_end_date": "2024-12-31"
}
```

```http
GET /api/musicians/me
Authorization: Bearer {token}

Response:
{
  "is_pro": true | false,
  "pro_subscription_end": "2024-12-31"
}
```

---

## 📊 Statuts d'Abonnement

### Pour Établissements

| Statut | Description | Accès Dashboard |
|--------|-------------|-----------------|
| `trial` | Période d'essai (14 jours) | ✅ Complet |
| `active` | Abonnement payé et actif | ✅ Complet |
| `expired` | Essai terminé, pas payé | ❌ Bloqué |
| `cancelled` | Abonnement annulé | ❌ Bloqué |

### Pour Musiciens

| Statut | Description | Onglets PRO |
|--------|-------------|-------------|
| `is_pro: false` | Compte gratuit | ❌ Non |
| `is_pro: true` | Abonnement PRO actif | ✅ Oui |

---

## 🎯 Résumé pour l'Agent Mobile

### Phase 1 (MVP) - À faire maintenant

✅ **PAS besoin d'intégrer Stripe SDK**
✅ **Lire seulement** les statuts d'abonnement via API
✅ **Afficher overlay** si abonnement expiré
✅ **Rediriger vers site web** pour paiement (`Linking.openURL`)
✅ **Cacher onglets PRO** si `is_pro: false`

**Code minimal nécessaire :**
```javascript
// Vérifier statut
const isActive = venue.subscription_status === 'active';
const isPro = musician.is_pro;

// Si expiré, afficher message + lien vers site web
if (!isActive) {
  return <ExpiredOverlay />;
}

// Cacher onglets PRO
{isPro && <Tab label="Comptabilité" />}
```

### Phase 2 (Future) - Plus tard

⏳ Installer `@stripe/stripe-react-native`
⏳ Créer endpoints backend Stripe
⏳ Implémenter PaymentSheet in-app
⏳ Gérer webhooks Stripe

---

## 🔐 Sécurité

⚠️ **JAMAIS** exposer `STRIPE_SECRET_KEY` dans l'app mobile
✅ **Toujours** passer par le backend pour créer PaymentIntents
✅ **Valider** les paiements côté serveur (webhooks)

---

## 🌐 Liens Utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe React Native](https://stripe.dev/stripe-react-native/)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

<div align="center">

**Phase 1 : Pas besoin d'intégrer Stripe** ✅  
**Phase 2 : Paiements in-app avec Stripe SDK** ⏳

</div>
