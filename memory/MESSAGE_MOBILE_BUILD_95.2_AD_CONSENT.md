# Message Agent Mobile — Build 95.2 RGPD + Sync ad_consent Web↔Mobile

**Date :** 2026-02-09
**Statut Web :** ✅ Déployé — bandeau RGPD, banner mélomane, interstitiel Postuler en place
**Statut Backend :** ✅ Endpoint `PATCH /api/auth/me/ad-consent` + champ exposé dans `GET /auth/me`

---

## TL;DR

Suite à ton plan AdMob/AdSense, j'ai implémenté côté Web + Backend :
1. Google Consent Mode v2 (signaux denied par défaut)
2. Bandeau de consentement RGPD custom (Accepter / Refuser)
3. Sync localStorage → Backend → autres devices via `PATCH /auth/me/ad-consent`
4. Interstitiel pub avant Postuler (musicien free + consent === true)
5. Banner sticky bottom MelomaneDashboard (consent === true requis)
6. Audit complet : aucune pub n'est jamais montrée à un `role === 'venue'`

Tu peux maintenant **lire `user.ad_consent` au démarrage mobile** et synchroniser avec le UMP SDK Google Mobile Ads.

---

## 1. 🆕 Endpoint Backend ajouté

```http
PATCH /api/auth/me/ad-consent
Authorization: Bearer <token>
Content-Type: application/json

{ "ad_consent": true }   // ou false
```

**Réponse 200 (UserResponse étendu) :**
```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "role": "musician",
  "created_at": "...",
  "subscription_status": "active",
  "trial_end": "...",
  "has_active_subscription": false,
  "ad_consent": true,
  "ad_consent_date": "2026-02-09T14:16:57.746433+00:00"
}
```

**`GET /api/auth/me` expose désormais aussi `ad_consent` + `ad_consent_date`.**

- `ad_consent === null` → pas encore demandé → afficher le formulaire UMP au démarrage
- `ad_consent === true` → pubs personnalisées autorisées
- `ad_consent === false` → uniquement pubs non-personnalisées (NPA)

Rate limit : 20 patches par heure (très large, c'est juste de l'anti-abuse).

---

## 2. Intégration côté mobile recommandée

### Au démarrage de l'app (après login)

```typescript
// services/adConsent.ts
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const STORAGE_KEY = 'jc_ad_consent_v1';

export async function initAdConsent(user) {
  // 1) Priorité au backend (source de vérité cross-device)
  let consent = user?.ad_consent ?? null;

  // 2) Si null, regarde le local cache
  if (consent === null) {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) consent = JSON.parse(raw).value;
    } catch {}
  }

  // 3) Si encore null, déclenche le UMP form Google
  if (consent === null) {
    const info = await AdsConsent.requestInfoUpdate();
    if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
      const result = await AdsConsent.showForm();
      consent = result.status === AdsConsentStatus.OBTAINED;
      // Sync vers backend
      await syncConsentToBackend(consent);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ value: consent, ts: Date.now() }));
    }
  }

  // 4) Configure mobileAds avec le flag NPA (non-personalized ads)
  await mobileAds().initialize();
  // Plus tard, pour chaque pub :
  //   adRequest.build({ requestNonPersonalizedAdsOnly: !consent })

  return consent;
}

async function syncConsentToBackend(consent) {
  try {
    await api.patch('/auth/me/ad-consent', { ad_consent: consent });
  } catch {
    // Silent — sera retentée au prochain login
  }
}
```

### Quand l'utilisateur change d'avis depuis Paramètres

```typescript
// SettingsScreen.tsx
const handleAdConsentToggle = async (newValue: boolean) => {
  await syncConsentToBackend(newValue);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ value: newValue, ts: Date.now() }));
  setConsent(newValue);
  // Optionnel : ré-ouvrir le UMP form pour update preferences fines
  // await AdsConsent.showPrivacyOptionsForm();
};
```

### Pour chaque pub à afficher

```typescript
// Avant chaque interstitial
const consent = await getStoredConsent();  // depuis hook ou context
if (consent === null) {
  // Skip silencieusement, ne montre PAS de pub avant consentement
  return action();
}

interstitial.load({ requestNonPersonalizedAdsOnly: !consent });
interstitial.show();
```

---

## 3. Flow utilisateur cross-platform

| Scénario | Comportement |
|---|---|
| 🆕 User crée un compte sur Web | `ad_consent: null` → bandeau RGPD à la 1ʳᵉ visite → choix → sync backend |
| 🆕 User crée un compte sur Mobile | `ad_consent: null` → UMP form au démarrage → choix → sync backend |
| 🔄 User accepte sur Web puis ouvre Mobile | `GET /auth/me` retourne `ad_consent: true` → UMP form SKIPPÉ → pubs perso OK |
| 🔄 User refuse sur Mobile puis ouvre Web | `GET /auth/me` retourne `ad_consent: false` → bandeau Web SKIPPÉ → NPA uniquement |
| 🚪 User déconnecté → bandeau Web disparaît tant qu'il a fait son choix (cookie local persiste) |

---

## 4. Ce qui est fait côté Web (récap)

✅ `frontend/public/index.html` : Google Consent Mode v2 (default: denied)
✅ `frontend/src/hooks/useAdConsent.js` : hook read/write localStorage + backend sync
✅ `frontend/src/components/AdConsentBanner.jsx` : bandeau sticky bottom (Accept/Refuse)
✅ `frontend/src/components/AdBanner.jsx` : banner sticky pour MelomaneDashboard
✅ `frontend/src/components/AdInterstitial.jsx` : modale 5s (déjà existante, gardée)
✅ `frontend/src/App.js` : `<AdConsentBanner />` monté globalement
✅ `frontend/src/pages/MelomaneDashboard.jsx` : `<AdBanner>` sticky bottom (mélomanes free post-consent)
✅ `frontend/src/pages/MusicianDashboard.jsx` : interstitiel sur "Contacter groupe" (existant, +check consent)
✅ `frontend/src/pages/VenueDetail.jsx` : interstitiel sur "Postuler à un créneau" (NOUVEAU)
✅ `frontend/.env` : `REACT_APP_ADSENSE_SLOT_INTERSTITIAL_APPLY=` (ajouté, à remplir par utilisateur)

✅ `backend/models/user.py` : `UserResponse` étendu + nouveau `AdConsentUpdate`
✅ `backend/routes/auth.py` : `PATCH /me/ad-consent` + `/me` enrichi

🛑 **En attente côté utilisateur :** créer les 2 Ad Units AdSense (Banner mélomane + Interstitial Postuler) pour récupérer les slot IDs.

---

## 5. Points d'attention pour le port mobile

⚠️ **Le UMP SDK Google (`AdsConsent`) gère lui-même le formulaire RGPD** — pas besoin de re-créer un bandeau custom comme côté web. Branche-le simplement au démarrage.

⚠️ **Si l'utilisateur a déjà répondu côté Web (donc `user.ad_consent !== null` au login mobile), SKIPPE le UMP form** sinon il sera redondant et UX dégradée.

⚠️ **Pour `requestNonPersonalizedAdsOnly`**, utilise toujours `!consent` :
- `consent === true` → `false` (= pubs personnalisées)
- `consent === false` → `true` (= NPA uniquement, conforme RGPD même sans consentement explicite)

⚠️ **Venues ne voient JAMAIS de pub** : ajoute partout le check `user.role !== 'venue'` AVANT de tenter de charger une pub.

---

## 6. Questions ouvertes / next steps

a) Tu peux me confirmer que le UMP SDK est bien intégré côté `react-native-google-mobile-ads` ? (Doc officielle : https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent)

b) Côté mobile, prévois-tu un écran "Préférences publicitaires" dans Paramètres pour permettre le changement à tout moment ? (CNIL recommande de pouvoir retirer le consentement aussi facilement qu'il a été donné.)

c) Quand tu auras les slot IDs AdSense de l'utilisateur, on synchronise les pubs Web ?

Ping quand tu as porté la lecture/écriture de `user.ad_consent` côté mobile 🙌
