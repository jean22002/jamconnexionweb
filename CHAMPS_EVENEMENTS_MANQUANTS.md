# 📋 Champs Manquants dans les Formulaires d'Événements

Document de référence pour restaurer tous les champs des formulaires de création/édition d'événements.

---

## 🎸 CONCERTS

### Champs obligatoires
- ✅ `date` : Date (YYYY-MM-DD)
- ✅ `start_time` : Heure de début
- ✅ `end_time` : Heure de fin (optionnel)
- ✅ `title` : Titre du concert (optionnel)
- ✅ `description` : Description (optionnel)

### Groupes/Artistes
- ❌ `bands` : Liste des groupes
  - `name` : Nom du groupe
  - `musician_id` : ID du musicien (optionnel)
  - `members_count` : Nombre de membres (optionnel)
  - `photo` : Photo du groupe (optionnel)
  - `facebook` : Page Facebook (optionnel)
  - `instagram` : Compte Instagram (optionnel)

### Informations publiques
- ❌ `price` : Prix d'entrée (optionnel, ex: "Gratuit", "10€", "5-15€")
- ❌ `music_styles` : Styles musicaux (liste)

### 🍽️ Restauration (Catering)
- ❌ `has_catering` : Restauration proposée (oui/non)
- ❌ `catering_drinks` : Nombre de boissons offertes
- ❌ `catering_respect` : Repas respectueux proposé (oui/non)
- ❌ `catering_tbd` : À définir avec l'établissement (oui/non)

### 🏠 Hébergement (Accommodation)
- ❌ `has_accommodation` : Hébergement proposé (oui/non)
- ❌ `accommodation_capacity` : Capacité d'hébergement (nombre de personnes)
- ❌ `accommodation_tbd` : À définir avec l'établissement (oui/non)

### 💰 GUSO / Comptabilité
- ❌ `is_guso` : Concert avec contrat GUSO (oui/non)
- ❌ `cachet_type` : Type de cachet
  - Options : "isolé" | "groupé"
- ❌ `guso_contract_type` : Type de contrat GUSO
  - Options : "CDDU" | "CDD" | "Autre"

### Comptabilité (backend)
- `payment_method` : Méthode de paiement (chèque, espèces, virement, etc.)
- `amount` : Montant payé à l'artiste
- `payment_status` : Statut (paid, pending, cancelled)
- `invoice_file` : Fichier de facture

---

## 🎭 SPECTACLES

### Champs obligatoires
- ✅ `date` : Date (YYYY-MM-DD)
- ✅ `start_time` : Heure de début
- ✅ `end_time` : Heure de fin (optionnel)
- ❌ `type` : Type de spectacle ⚠️ **MANQUANT CRITIQUE**
  - Options possibles :
    - "One-man show"
    - "Magie"
    - "Théâtre"
    - "Humour"
    - "Conte"
    - "Danse"
    - "Cirque"
    - "Cabaret"
    - "Autre"
- ❌ `artist_name` : Nom de l'artiste ⚠️ **MANQUANT CRITIQUE**
- ✅ `description` : Description (optionnel)

### Informations publiques
- ❌ `price` : Prix d'entrée (optionnel, ex: "Gratuit", "10€", "5-15€")

### Comptabilité (backend)
- `payment_method` : Méthode de paiement
- `amount` : Montant payé
- `payment_status` : Statut
- `invoice_file` : Fichier de facture

---

## 📅 CRÉNEAUX DE CANDIDATURE (Planning Slots)

### Champs obligatoires
- ✅ `date` : Date du créneau
- ✅ `time` : Heure du créneau (optionnel)
- ✅ `title` : Titre du créneau (optionnel)
- ❌ `music_styles` : Styles musicaux recherchés ⚠️ **MANQUANT**
- ✅ `description` : Description (optionnel)

### Conditions & Attentes
- ❌ `expected_band_style` : Style de groupe attendu (optionnel)
- ❌ `expected_attendance` : Fréquentation attendue (optionnel)
  - Options : "< 50 personnes", "50-100", "100-200", "> 200"
- ❌ `payment` : Rémunération proposée (optionnel)
  - Exemples : "50€", "100€", "Au chapeau", "Gratuit", "À négocier"
- ❌ `artist_categories` : Catégories d'artistes recherchés
  - Options : "Solo", "Duo", "Trio", "Groupe (4+)", "Tous"
- ❌ `num_bands_needed` : Nombre de groupes recherchés (défaut: 1)
- ❌ `application_type` : Type de candidature
  - Options : "bands" (groupes) | "solo" (solo uniquement)

### 🍽️ Restauration (Catering)
- ❌ `has_catering` : Restauration proposée (oui/non)
- ❌ `catering_drinks` : Nombre de boissons offertes
- ❌ `catering_respect` : Repas respectueux proposé (oui/non)
- ❌ `catering_tbd` : À définir avec l'établissement (oui/non)

### 🏠 Hébergement (Accommodation)
- ❌ `has_accommodation` : Hébergement proposé (oui/non)
- ❌ `accommodation_capacity` : Capacité d'hébergement
- ❌ `accommodation_tbd` : À définir avec l'établissement (oui/non)

---

## 🎯 PRIORITÉS DE CORRECTION

### P0 - Champs critiques manquants
1. **Spectacles** :
   - ❌ `type` : Type de spectacle (OBLIGATOIRE)
   - ❌ `artist_name` : Nom de l'artiste (OBLIGATOIRE)

2. **Créneaux de candidature** :
   - ❌ `music_styles` : Styles musicaux recherchés
   - ❌ `payment` : Rémunération proposée
   - ❌ `artist_categories` : Catégories recherchées
   - ❌ `application_type` : Type de candidature

### P1 - Champs importants
1. **Concerts** :
   - ❌ `bands` : Liste des groupes avec infos complètes
   - ❌ `music_styles` : Styles musicaux
   - ❌ `price` : Prix d'entrée
   - ❌ GUSO fields (`is_guso`, `cachet_type`, `guso_contract_type`)

2. **Tous les événements** :
   - ❌ Catering (restauration)
   - ❌ Accommodation (hébergement)

---

## 📝 EXEMPLES DE FORMULAIRES

### Concert - Exemple complet

```jsx
<form>
  {/* Infos de base */}
  <input name="date" type="date" />
  <input name="start_time" type="time" />
  <input name="end_time" type="time" />
  <input name="title" placeholder="Soirée Rock" />
  <textarea name="description" />
  
  {/* Groupes */}
  <div>
    <h3>Groupes programmés</h3>
    {bands.map((band, i) => (
      <div key={i}>
        <input name={`band_name_${i}`} placeholder="Nom du groupe" />
        <input name={`band_members_${i}`} type="number" placeholder="Nb membres" />
        <input name={`band_photo_${i}`} placeholder="URL photo" />
      </div>
    ))}
    <button onClick={addBand}>+ Ajouter un groupe</button>
  </div>
  
  {/* Prix & Styles */}
  <input name="price" placeholder="ex: 10€, Gratuit, PAF" />
  <select name="music_styles" multiple>
    <option>Rock</option>
    <option>Jazz</option>
    <option>Blues</option>
    {/* ... */}
  </select>
  
  {/* Restauration */}
  <label>
    <input type="checkbox" name="has_catering" />
    Restauration proposée
  </label>
  {hasCatering && (
    <>
      <input name="catering_drinks" type="number" placeholder="Nb boissons" />
      <label>
        <input type="checkbox" name="catering_respect" />
        Repas respectueux (végétarien/vegan)
      </label>
      <label>
        <input type="checkbox" name="catering_tbd" />
        À définir avec l'artiste
      </label>
    </>
  )}
  
  {/* Hébergement */}
  <label>
    <input type="checkbox" name="has_accommodation" />
    Hébergement proposé
  </label>
  {hasAccommodation && (
    <>
      <input name="accommodation_capacity" type="number" placeholder="Nb personnes" />
      <label>
        <input type="checkbox" name="accommodation_tbd" />
        À définir avec l'artiste
      </label>
    </>
  )}
  
  {/* GUSO */}
  <label>
    <input type="checkbox" name="is_guso" />
    Concert avec contrat GUSO
  </label>
  {isGuso && (
    <>
      <select name="cachet_type">
        <option value="">-- Type de cachet --</option>
        <option value="isolé">Cachet isolé</option>
        <option value="groupé">Cachet groupé</option>
      </select>
      <select name="guso_contract_type">
        <option value="">-- Type de contrat --</option>
        <option value="CDDU">CDDU</option>
        <option value="CDD">CDD</option>
        <option value="autre">Autre</option>
      </select>
    </>
  )}
</form>
```

### Spectacle - Exemple complet

```jsx
<form>
  <input name="date" type="date" />
  <input name="start_time" type="time" />
  <input name="end_time" type="time" />
  
  {/* ⚠️ CHAMPS CRITIQUES MANQUANTS */}
  <select name="type" required>
    <option value="">-- Type de spectacle --</option>
    <option value="One-man show">One-man show</option>
    <option value="Magie">Magie</option>
    <option value="Théâtre">Théâtre</option>
    <option value="Humour">Humour</option>
    <option value="Conte">Conte</option>
    <option value="Danse">Danse</option>
    <option value="Cirque">Cirque</option>
    <option value="Cabaret">Cabaret</option>
    <option value="Autre">Autre</option>
  </select>
  
  <input name="artist_name" placeholder="Nom de l'artiste" required />
  <textarea name="description" placeholder="Description du spectacle" />
  <input name="price" placeholder="Prix (ex: 15€, Gratuit)" />
</form>
```

### Créneau de candidature - Exemple complet

```jsx
<form>
  <input name="date" type="date" />
  <input name="time" type="time" />
  <input name="title" placeholder="Soirée jam blues" />
  
  {/* ⚠️ CHAMPS MANQUANTS */}
  <select name="music_styles" multiple>
    <option>Rock</option>
    <option>Jazz</option>
    <option>Blues</option>
    {/* ... */}
  </select>
  
  <textarea name="description" />
  
  <input name="payment" placeholder="ex: 50€, Au chapeau, Gratuit" />
  
  <select name="expected_attendance">
    <option value="">-- Fréquentation attendue --</option>
    <option value="< 50 personnes">Moins de 50 personnes</option>
    <option value="50-100">50-100 personnes</option>
    <option value="100-200">100-200 personnes</option>
    <option value="> 200">> 200 personnes</option>
  </select>
  
  <div>
    <label>Catégories recherchées :</label>
    <label><input type="checkbox" value="Solo" /> Solo</label>
    <label><input type="checkbox" value="Duo" /> Duo</label>
    <label><input type="checkbox" value="Trio" /> Trio</label>
    <label><input type="checkbox" value="Groupe (4+)" /> Groupe (4+)</label>
  </div>
  
  <input name="num_bands_needed" type="number" min="1" placeholder="Nb groupes recherchés" />
  
  <select name="application_type">
    <option value="bands">Groupes uniquement</option>
    <option value="solo">Solo uniquement</option>
  </select>
  
  {/* Restauration & Hébergement (même structure que concerts) */}
</form>
```

---

## 🔧 FICHIERS À MODIFIER

### Frontend
1. `/app/frontend/src/features/venue-dashboard/tabs/ConcertsTab.jsx` (ou modal associé)
2. `/app/frontend/src/features/venue-dashboard/tabs/SpectaclesTab.jsx` (ou modal associé)
3. `/app/frontend/src/features/venue-dashboard/tabs/CandidaturesTab.jsx` (ou modal associé)
4. Potentiellement des fichiers dans `/app/frontend/src/features/venue-dashboard/components/`

### Backend (déjà OK)
- ✅ `/app/backend/models/event.py` → Modèles Pydantic complets
- ✅ `/app/backend/routes/events.py` → Routes API fonctionnelles

---

## ✅ VÉRIFICATION FINALE

Après correction, vérifier que :
- [ ] Tous les champs P0 sont présents
- [ ] Les champs P1 sont ajoutés
- [ ] Les formulaires soumettent correctement les données
- [ ] Les événements créés s'affichent avec toutes les infos
- [ ] Les filtres/recherche fonctionnent avec les nouveaux champs
- [ ] La compatibilité avec les anciens événements est maintenue

---

**Date de création** : 7 avril 2026  
**Objectif** : Restaurer tous les champs des formulaires d'événements qui ont été perdus
