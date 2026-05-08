# 💳 Réponse : Stripe Phase 2 - Paiements in-app

<div align="center">

**Informations Complètes pour l'Agent Mobile**

Configuration Stripe + Endpoints + Recommandations

</div>

---

## ✅ Réponses à vos Questions

### 1️⃣ README/Documentation Stripe

**OUI, il existe déjà :** `/app/README_STRIPE.md`

**Contenu :**
- Vue d'ensemble complète du système de paiement
- Configuration actuelle (Live mode)
- Phase 1 (MVP) : Lecture seule - ✅ **Déjà documentée**
- Phase 2 (In-app payments) : ⚠️ **À implémenter**

---

### 2️⃣ Endpoints Backend Disponibles

**✅ Endpoints EXISTANTS :**

| Endpoint | Méthode | Description | Statut |
|----------|---------|-------------|--------|
| `POST /api/payments/checkout` | POST | Créer session Stripe Checkout | ✅ Opérationnel |
| `GET /api/payments/status/{session_id}` | GET | Vérifier statut paiement | ✅ Opérationnel |
| `POST /api/payments/cancel-renewal` | POST | Annuler renouvellement abonnement | ✅ Opérationnel |
| `POST /api/payments/reactivate-renewal` | POST | Réactiver renouvellement | ✅ Opérationnel |

**⚠️ Endpoints MANQUANTS (pour SDK natif) :**

| Endpoint | Nécessaire pour | Statut |
|----------|-----------------|--------|
| `POST /api/stripe/create-payment-intent` | SDK Stripe natif (Payment Sheet) | ❌ À créer |
| `POST /api/stripe/create-subscription` | Abonnement direct in-app | ❌ À créer |
| `GET /api/stripe/payment-methods` | Gérer cartes sauvegardées | ❌ À créer |

---

### 3️⃣ Clés Stripe

**✅ Clés disponibles (LIVE MODE) :**

```env
# Clé SECRÈTE (Backend only)
STRIPE_SECRET_KEY=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

# Clé PUBLIQUE (Mobile app)
# ⚠️ ATTENTION: La clé publique n'est pas dans le .env backend
# Elle doit être récupérée depuis le Dashboard Stripe
```

**🔍 Comment obtenir la clé publique (pk_live_...) :**

1. Aller sur https://dashboard.stripe.com/apikeys
2. Vous verrez :
   - **Clé publique** : `pk_live_...` ← **CELLE-CI pour l'app mobile**
   - **Clé secrète** : `sk_live_...` (déjà dans `.env`)

**Pour les tests (optionnel) :**
- Mode test : `pk_test_...` et `sk_test_...`
- Recommandé de commencer en mode test pour développement

---

### 4️⃣ Comportement Recommandé

**🎯 Ma Recommandation : OPTION A (Redirection Web)**

**Pourquoi ?**

| Critère | Redirection Web | SDK Natif |
|---------|----------------|-----------|
| ⏱️ **Temps d'implémentation** | 1-2 heures | 2-3 jours |
| 🔧 **Complexité** | Très simple | Moyenne-Élevée |
| 🔒 **Sécurité** | ✅ Gérée par Stripe | ✅ Gérée par Stripe |
| 💳 **PCI Compliance** | ✅ Automatique | ✅ Automatique |
| 📱 **UX Mobile** | ⭐⭐⭐ (Redirect) | ⭐⭐⭐⭐⭐ (Natif) |
| 🐛 **Maintenance** | Facile | Nécessite mises à jour SDK |
| 💰 **Coûts Stripe** | Identiques | Identiques |
| 🚀 **MVP** | ✅ Parfait | Overkill |

**Verdict :**
- **Phase MVP** : Redirection Web (Option A)
- **Phase 2** : SDK Natif (Option B) - si demandé par utilisateur

---

## 🚀 Implémentation Recommandée (Option A - Redirection Web)

### Flux Utilisateur

```
1. Utilisateur dans l'app mobile
   ↓
2. Clique "Passer PRO" ou "S'abonner"
   ↓
3. Appel API : POST /api/payments/checkout
   ← Response : { url: "https://checkout.stripe.com/c/pay/..." }
   ↓
4. Ouvre URL dans navigateur (Linking.openURL)
   ↓
5. Utilisateur paie sur Stripe Checkout (sécurisé)
   ↓
6. Stripe redirige vers Success URL
   ↓
7. App détecte retour (Deep Link)
   ↓
8. Rafraîchit profil → `subscription_status: "active"`
```

### Code Mobile (React Native)

```javascript
import { Linking, Alert } from 'react-native';
import api from './services/api';

const handleUpgradeToPro = async () => {
  try {
    // 1. Créer session Stripe
    const response = await api.post('/payments/checkout', {
      origin_url: 'jamconnexion://payment' // Deep link pour retour
    });
    
    const { url } = response.data;
    
    // 2. Ouvrir Stripe Checkout dans le navigateur
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le paiement');
    }
    
  } catch (error) {
    console.error('Erreur paiement:', error);
    Alert.alert('Erreur', 'Impossible de démarrer le paiement');
  }
};

// Gérer le retour après paiement (Deep Link)
useEffect(() => {
  const handleDeepLink = (event) => {
    const { url } = event;
    
    if (url.includes('payment/success')) {
      // Extraire session_id
      const sessionId = url.split('session_id=')[1];
      
      // Vérifier statut paiement
      checkPaymentStatus(sessionId);
    } else if (url.includes('payment/cancel')) {
      Alert.alert('Paiement annulé', 'Vous pouvez réessayer à tout moment.');
    }
  };
  
  // Écouter les deep links
  const subscription = Linking.addEventListener('url', handleDeepLink);
  
  return () => subscription.remove();
}, []);

const checkPaymentStatus = async (sessionId) => {
  try {
    const response = await api.get(`/payments/status/${sessionId}`);
    
    if (response.data.payment_status === 'paid') {
      Alert.alert(
        'Paiement réussi ! 🎉',
        'Votre abonnement est maintenant actif.',
        [{ text: 'OK', onPress: () => {
          // Rafraîchir le profil
          fetchProfile();
          // Naviguer vers dashboard
          navigation.navigate('Dashboard');
        }}]
      );
    }
  } catch (error) {
    console.error('Erreur vérification:', error);
  }
};
```

### Configuration Deep Links

**iOS - Info.plist :**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>jamconnexion</string>
    </array>
  </dict>
</array>
```

**Android - AndroidManifest.xml :**
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="jamconnexion" android:host="payment" />
</intent-filter>
```

---

## 🔮 Option B - SDK Natif (Phase 2)

**Si vous voulez vraiment implémenter le SDK natif maintenant** (pas recommandé pour MVP), voici ce qu'il faut :

### 1. Créer les Endpoints Manquants

**Fichier à créer : `/app/backend/routes/stripe_mobile.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import stripe
import os

router = APIRouter(prefix="/stripe", tags=["Stripe Mobile"])

STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
stripe.api_key = STRIPE_SECRET_KEY

class CreatePaymentIntentRequest(BaseModel):
    amount: int  # en centimes (1299 = 12.99€)
    currency: str = "eur"

@router.post("/create-payment-intent")
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Créer un PaymentIntent pour le SDK mobile
    """
    try:
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            metadata={
                "user_id": current_user["id"],
                "integration_check": "accept_a_payment"
            }
        )
        
        return {
            "clientSecret": intent.client_secret,
            "publishableKey": "pk_live_..." # À remplacer par vraie clé
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### 2. Installation Mobile

```bash
npm install @stripe/stripe-react-native
```

### 3. Code Mobile

```javascript
import { useStripe, StripeProvider } from '@stripe/stripe-react-native';

// Wrapper App
const App = () => (
  <StripeProvider publishableKey="pk_live_...">
    <YourApp />
  </StripeProvider>
);

// Payment Screen
const PaymentScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const handlePayment = async () => {
    // 1. Créer PaymentIntent
    const response = await api.post('/stripe/create-payment-intent', {
      amount: 1299,
      currency: 'eur'
    });
    
    const { clientSecret } = response.data;
    
    // 2. Init Payment Sheet
    await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Jam Connexion',
      style: 'alwaysDark'
    });
    
    // 3. Présenter Payment Sheet
    const { error } = await presentPaymentSheet();
    
    if (error) {
      Alert.alert('Paiement annulé');
    } else {
      Alert.alert('Paiement réussi !');
    }
  };
  
  return <Button title="Payer" onPress={handlePayment} />;
};
```

---

## 📊 Comparaison Finale

| Aspect | Redirection Web | SDK Natif |
|--------|----------------|-----------|
| **Pour MVP** | ✅ **Recommandé** | ❌ Trop complexe |
| **Code à écrire** | ~50 lignes | ~300 lignes |
| **Endpoints backend** | ✅ Déjà prêts | ❌ À créer |
| **Testing** | Facile | Nécessite vrais paiements |
| **Maintenance** | Minimale | SDK updates régulières |
| **UX** | Bonne | Excellente |

---

## 🎯 Ma Recommandation Finale

### Pour le MVP (maintenant) :

**✅ OPTION A - Redirection Web**

**Raisons :**
1. Backend déjà prêt (endpoints existants)
2. Implémentation rapide (1-2h)
3. Sécurisé et conforme PCI
4. Maintenance facile
5. UX acceptable

**Code simple :**
```javascript
const upgradeToPro = async () => {
  const { url } = await api.post('/payments/checkout', {
    origin_url: 'jamconnexion://payment'
  });
  Linking.openURL(url);
};
```

### Pour Phase 2 (après MVP validé) :

**⭐ OPTION B - SDK Natif**

**Seulement si :**
- Utilisateur demande une UX premium
- Budget pour maintenance SDK
- Temps disponible (2-3 jours dev)

---

## 🚀 Action Immédiate

**Ce que je vous recommande de faire MAINTENANT :**

1. **Récupérer la clé publique Stripe**
   - Aller sur https://dashboard.stripe.com/apikeys
   - Copier `pk_live_...`
   - Me la fournir ici

2. **Choisir l'option**
   - **Option A** (Web redirect) → Je peux implémenter en 1-2h
   - **Option B** (SDK natif) → Je dois créer backend d'abord

3. **Ou bien...**
   - Passer à autre chose pour le MVP
   - Implémenter Stripe Phase 2 plus tard

**Qu'en pensez-vous ?** 🤔

---

<div align="center">

**En Résumé :**

✅ Backend Stripe existe déjà  
✅ Endpoints `/payments/checkout` opérationnels  
✅ Clés Stripe configurées (besoin de pk_live_...)  
✅ Recommandation : Redirection Web (MVP)  
⏸️ SDK Natif : Phase 2 (optionnel)

**Prêt à implémenter Option A dès que vous me donnez la clé publique !** 🚀

</div>
