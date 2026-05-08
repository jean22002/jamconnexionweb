# 📊 Onglet Comptabilité - Filtres et Gestion des Factures

## 🎯 Vue d'ensemble

L'onglet **Comptabilité** de Jam Connexion permet aux établissements de gérer et suivre tous leurs événements passés avec un système de filtrage avancé et de génération automatique de factures PDF.

---

## ✨ Fonctionnalités

### 1. **Tableau de bord financier**
Affichage en temps réel des statistiques financières :
- 💚 **Payé** : Total des paiements reçus + nombre d'événements
- 🟠 **En attente** : Paiements en cours + nombre d'événements
- 🔴 **Annulé** : Montant annulé + nombre d'événements
- 🟣 **Total** : Chiffre d'affaires global + nombre total d'événements

### 2. **Système de filtrage multi-critères**

#### 💳 Filtre par méthode de paiement :
- **Toutes les méthodes** (par défaut)
- **GUSO** (Guichet Unique du Spectacle Occasionnel)
- **Facture**
- **Espèces**
- **Virement**
- **Chèque**
- **Promotion**

#### 📊 Filtre par statut :
- **Tous les statuts** (par défaut)
- **Payé**
- **En attente**
- **Annulé**

#### 🎭 Filtre par type d'événement :
- **Tous les types** (par défaut)
- **Jam Session**
- **Concert**
- **Karaoké**
- **Spectacle**

### 3. **Téléchargement ZIP des factures (VERSION 2.0)**

Génération automatique d'un fichier ZIP contenant :
- ✅ **Factures PDF générées dynamiquement** (via ReportLab)
- ✅ **Filtrage intelligent** : Seules les factures correspondant aux filtres sélectionnés sont incluses
- ✅ **Nomenclature claire** : Chaque PDF porte le nom `{invoice_number}.pdf`

#### Contenu d'une facture PDF :
```
📄 Facture #INV-XXX-XXXX

Établissement : [Nom du venue]
Adresse : [Ville, Département]

Événement : [Titre de l'événement]
Date : [Date]
Type : [Jam/Concert/Karaoké/Spectacle]

Méthode de paiement : [Chèque/Espèces/etc.]
Montant : [XX.XX €]
Statut : [Payé/En attente/Annulé]
```

### 4. **Export CSV**
Export de tous les événements filtrés au format CSV pour analyse externe (Excel, Google Sheets, etc.).

---

## 🛠️ Architecture technique

### Backend (FastAPI + MongoDB Atlas)

#### Routes API principales :

**`GET /api/venues/{venue_id}/jams`**  
**`GET /api/venues/{venue_id}/concerts`**  
**`GET /api/venues/{venue_id}/karaoke`**  
**`GET /api/venues/{venue_id}/spectacle`**  
Retournent les événements d'un établissement avec tous les champs comptables.

**`GET /api/venues/me/accounting/invoices/download`**  
Génère et retourne un fichier ZIP contenant les factures PDF filtrées.

**Query Parameters :**
- `payment_method` : Filtre par méthode de paiement
- `payment_status` : Filtre par statut de paiement
- `event_type` : Filtre par type d'événement

#### Modèles de données (Pydantic)

Chaque type d'événement possède les champs comptables suivants :

```python
{
  "id": str,                    # ID unique
  "venue_id": str,              # ID de l'établissement
  "title": str,                 # Titre de l'événement
  "date": str,                  # Date (YYYY-MM-DD)
  "start_time": str,            # Heure de début
  "created_at": str,            # Date de création
  
  # Champs comptables
  "payment_method": Optional[str],    # Méthode de paiement
  "amount": Optional[float],          # Montant en euros
  "payment_status": Optional[str],    # Statut (paid/pending/cancelled)
  "invoice_number": Optional[str],    # Numéro de facture
  "invoice_file": Optional[str]       # Nom du fichier PDF
}
```

#### Génération de factures PDF

**Fichier** : `/app/backend/utils/invoice_generator.py`

Utilise la bibliothèque **ReportLab** pour créer des factures PDF professionnelles à la volée.

```python
from utils.invoice_generator import generate_invoice_pdf

# Génération d'une facture
pdf_buffer = generate_invoice_pdf(
    invoice_number="INV-JAM-001",
    venue_name="Mon Établissement",
    event_title="Jam Session Blues",
    event_date="2026-01-15",
    amount=150.00,
    payment_method="Chèque",
    payment_status="paid"
)
```

### Frontend (React + Tailwind CSS)

#### Composant principal :
**`/app/frontend/src/features/venue-dashboard/tabs/AccountingTab.jsx`**

**Props reçues du parent (`VenueDashboard.jsx`) :**
```javascript
{
  jams: [],          // Liste des jams
  concerts: [],      // Liste des concerts
  karaokes: [],      // Liste des karaokés
  spectacles: []     // Liste des spectacles
}
```

**État local (filtres) :**
```javascript
const [accountingFilters, setAccountingFilters] = useState({
  payment_method: 'all',
  payment_status: 'all',
  event_type: 'all'
});
```

**Logique de filtrage :**
```javascript
const filteredEvents = allEvents.filter(event => {
  // Filtre par date (événements passés uniquement)
  if (event.date > today) return false;
  
  // Filtre par méthode de paiement
  if (accountingFilters.payment_method !== 'all' && 
      event.payment_method !== accountingFilters.payment_method) {
    return false;
  }
  
  // Filtre par statut
  if (accountingFilters.payment_status !== 'all' && 
      event.payment_status !== accountingFilters.payment_status) {
    return false;
  }
  
  // Filtre par type d'événement
  if (accountingFilters.event_type !== 'all') {
    const eventType = event.type || /* logique de mapping */;
    if (eventType !== accountingFilters.event_type) return false;
  }
  
  return true;
});
```

---

## 📦 Dépendances

### Backend
```txt
reportlab==4.4.10    # Génération de PDF
motor               # Driver MongoDB async
fastapi             # Framework web
pydantic            # Validation de données
```

### Frontend
```json
{
  "axios": "^1.x",
  "react": "^18.x",
  "tailwindcss": "^3.x"
}
```

---

## 🧪 Données de test

### Événements fictifs ajoutés

**32 événements de test** ont été créés dans MongoDB Atlas avec :

| Type | Quantité | Méthodes de paiement |
|------|----------|---------------------|
| Jams | 8 | Chèque (2), Espèces (2), Virement (2), Promotion (2) |
| Concerts | 8 | Chèque (2), Espèces (2), Virement (2), Promotion (2) |
| Karaoké | 8 | Chèque (2), Espèces (2), Virement (2), Promotion (2) |
| Spectacles | 8 | Chèque (2), Espèces (2), Virement (2), Promotion (2) |

**Caractéristiques des événements de test :**
- ✅ Dates dans le passé (6 derniers mois)
- ✅ Montants aléatoires entre 50€ et 500€
- ✅ Statuts variés (50% payés, 50% en attente)
- ✅ Numéros de facture générés : `INV-{TYPE}-{METHODE}-{XXXX}`
- ✅ Tous les champs Pydantic requis remplis

---

## 🚀 Utilisation

### 1. Accéder à l'onglet Comptabilité

```
1. Se connecter en tant qu'établissement (bar@gmail.com / test)
2. Aller sur le Dashboard Établissement
3. Cliquer sur l'onglet "💰 Comptabilité"
```

### 2. Filtrer les événements

```
1. Sélectionner une méthode de paiement (ex: "Chèque")
2. Sélectionner un statut (ex: "Payé")
3. Sélectionner un type d'événement (ex: "Jam Session")
4. Les événements et statistiques se mettent à jour automatiquement
```

### 3. Télécharger les factures

```
1. Appliquer les filtres souhaités
2. Cliquer sur "📦 Télécharger les factures (ZIP)"
3. Le fichier ZIP est généré et téléchargé automatiquement
4. Ouvrir le ZIP pour accéder aux factures PDF individuelles
```

---

## 🐛 Résolution de problèmes

### Les événements n'apparaissent pas

**Cause possible** : Les événements sont dans MongoDB Local au lieu de MongoDB Atlas.

**Solution** :
```bash
# Vérifier que le script utilise bien python-dotenv
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

MONGO_URL = os.environ.get('MONGO_URL')
# Doit pointer vers mongodb+srv://... (Atlas), pas localhost
```

### Les factures PDF sont vides ou manquantes

**Cause possible** : Champs `invoice_number` ou `invoice_file` manquants dans MongoDB.

**Solution** :
```javascript
// Vérifier que chaque événement a ces champs
{
  "invoice_number": "INV-JAM-1234",
  "invoice_file": "INV-JAM-1234.pdf"
}
```

### Le filtre ne fonctionne pas

**Cause possible** : Normalisation des chaînes (accents, casse).

**Solution** : Le backend utilise une fonction `normalize()` pour gérer les accents :
```python
def normalize(text: str) -> str:
    """Normalise une chaîne en enlevant les accents et en mettant en minuscules"""
    if not text:
        return ""
    import unicodedata
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.lower()
```

---

## 📈 Statistiques actuelles (Production)

Au **5 avril 2026** :

- **Total événements** : 59 événements
- **Payé** : 8 698,81 € (27 événements)
- **En attente** : 6 496,40 € (21 événements)
- **Chiffre d'affaires total** : 15 195,21 €

**Répartition par méthode de paiement :**
- GUSO : 8 événements
- Facture : 10 événements
- Chèque : 8 événements
- Espèces : 8 événements
- Virement : 8 événements
- Promotion : 8 événements

---

## 👨‍💻 Auteurs

Développé pour **Jam Connexion** - Plateforme de mise en relation pour musiciens et établissements.

---

## 📝 Licence

Propriété intellectuelle de Jam Connexion © 2026

---

## 🔗 Liens utiles

- **URL Production** : https://www.jamconnexion.com
- **URL Preview** : https://collapsible-map.preview.emergentagent.com
- **MongoDB Atlas** : Base de données production
- **Documentation ReportLab** : https://www.reportlab.com/docs/reportlab-userguide.pdf
