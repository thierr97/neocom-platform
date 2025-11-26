# 💰 GUIDE COMPLET DU MODULE COMPTABILITÉ - NEOSERV

## 📋 Vue d'ensemble

Le module comptabilité de NEOSERV est un système complet de gestion comptable conforme au **Plan Comptable Général (PCG) français**. Il permet de gérer l'ensemble de votre comptabilité, de la saisie des écritures à la génération des rapports financiers.

---

## 🎯 Fonctionnalités principales

### 1. **Plan Comptable**
- ✅ Initialisation automatique du PCG français
- ✅ Comptes de classe 1 à 7
- ✅ Hiérarchie des comptes (parents/enfants)
- ✅ Recherche et filtrage par type de compte

### 2. **Écritures Comptables**
- ✅ Saisie d'écritures avec lignes multiples
- ✅ Validation partie double (Débit = Crédit)
- ✅ Statut : Brouillon / Validé
- ✅ Numérotation automatique par journal
- ✅ Journaux : Ventes, Achats, Banque, Caisse, OD

### 3. **Rapports Financiers**
- ✅ **Bilan** (Balance Sheet) : Actif / Passif équilibré
- ✅ **Compte de résultat** (Income Statement) : Produits / Charges
- ✅ **Balance générale** (Trial Balance) : Soldes des comptes
- ✅ **Grand livre** (General Ledger) : Détail des mouvements par compte

### 4. **Intégrations**
- ✅ Génération automatique d'écritures depuis les factures
- ✅ Lien avec les factures d'achat et de vente
- ✅ Gestion de la TVA (collectée et déductible)

---

## 🚀 Accès au module

**URL** : http://localhost:3000/dashboard/accounting

**Permissions requises** :
- Rôle ADMIN ou ACCOUNTANT
- Permission `accounting: true` dans les permissions utilisateur

---

## 📊 Structure du Plan Comptable Français (PCG)

### Classes de comptes

| Classe | Type | Description | Exemples |
|--------|------|-------------|----------|
| **Classe 1** | Capitaux / Passif | Capital, réserves, emprunts | 101000, 164000 |
| **Classe 2** | Immobilisations / Actif | Biens durables | 213000, 218000 |
| **Classe 3** | Stocks / Actif | Marchandises, matières premières | 370000, 371000 |
| **Classe 4** | Tiers | Clients, fournisseurs, TVA | 401000, 411000, 445 |
| **Classe 5** | Financiers / Actif | Banque, caisse | 512000, 530000 |
| **Classe 6** | Charges | Dépenses d'exploitation | 601000, 607000, 641000 |
| **Classe 7** | Produits | Revenus | 701000, 707000 |

### Principaux comptes

```
# CLASSE 1 - CAPITAUX
101000 - Capital social
106000 - Réserves
120000 - Résultat de l'exercice
164000 - Emprunts

# CLASSE 2 - IMMOBILISATIONS
213000 - Constructions
218000 - Matériel informatique

# CLASSE 3 - STOCKS
370000 - Stock de marchandises

# CLASSE 4 - TIERS
401000 - Fournisseurs
411000 - Clients
445510 - TVA à décaisser
445660 - TVA déductible
445710 - TVA collectée

# CLASSE 5 - FINANCIERS
512000 - Banque
530000 - Caisse

# CLASSE 6 - CHARGES
607000 - Achats de marchandises
641000 - Salaires
645000 - Charges sociales
661000 - Charges d'intérêts

# CLASSE 7 - PRODUITS
707000 - Ventes de marchandises
708000 - Produits des activités annexes
```

---

## 🎬 Démarrage rapide

### Étape 1 : Initialiser le plan comptable

1. Accédez au module : http://localhost:3000/dashboard/accounting
2. Cliquez sur **"Initialiser le plan comptable"**
3. Confirmez l'initialisation
4. ✅ Le PCG français est créé avec tous les comptes de base

### Étape 2 : Créer une première écriture comptable

1. Allez dans l'onglet **"Écritures"**
2. Cliquez sur **"Nouvelle écriture"**
3. Remplissez les informations :
   - Date
   - Description
   - Journal (VENTE, ACHAT, BANQUE, CAISSE, OD)
   - Ajoutez des lignes

**Exemple : Vente de marchandises avec TVA**

| Compte | Libellé | Débit | Crédit |
|--------|---------|-------|--------|
| 411000 (Clients) | Vente Client X | 1200.00 € | 0 € |
| 707000 (Ventes) | Vente marchandises | 0 € | 1000.00 € |
| 445710 (TVA collectée) | TVA 20% | 0 € | 200.00 € |

**Total** : Débit = 1200.00 € | Crédit = 1200.00 € ✓

4. Cliquez sur **"Créer l'écriture"**
5. L'écriture est créée en statut **BROUILLON**

### Étape 3 : Valider l'écriture

1. Dans la liste des écritures, cliquez sur **"Valider"**
2. L'écriture passe en statut **VALIDÉ**
3. Elle apparaît maintenant dans les rapports

---

## 📈 Les Rapports Comptables

### 1. 📊 Bilan Comptable (Balance Sheet)

**Objectif** : Photo instantanée de la situation financière

**Structure** :
- **ACTIF** (ce que l'entreprise possède)
  - Classe 2 : Immobilisations
  - Classe 3 : Stocks
  - Classe 4 : Créances clients
  - Classe 5 : Trésorerie (Banque, Caisse)

- **PASSIF** (ce que l'entreprise doit)
  - Capitaux propres (Classe 1)
  - Dettes (Classe 4 : Fournisseurs, TVA)
  - Emprunts (Classe 1)

**Équilibre** : ACTIF = PASSIF + CAPITAUX PROPRES

**Accès** : Onglet "Rapports" > Section "Bilan Comptable"

**Indicateurs** :
- ✓ Bilan équilibré (vert) : ACTIF = PASSIF
- ⚠ Bilan déséquilibré (rouge) : Erreur comptable

---

### 2. 📉 Compte de Résultat (Income Statement)

**Objectif** : Mesurer la performance sur une période

**Structure** :
- **PRODUITS** (Classe 7)
  - 707000 : Ventes de marchandises
  - 708000 : Produits annexes
  - 761000 : Produits financiers

- **CHARGES** (Classe 6)
  - 607000 : Achats
  - 641000 : Salaires
  - 661000 : Charges d'intérêts

**Formule** : RÉSULTAT NET = PRODUITS - CHARGES

**Accès** : Onglet "Rapports" > Section "Compte de Résultat"

**Interprétation** :
- Résultat > 0 : Bénéfice (vert)
- Résultat < 0 : Perte (rouge)

---

### 3. ⚖ Balance Générale (Trial Balance)

**Objectif** : Vérifier l'équilibre comptable

**Structure** : Liste de tous les comptes avec :
- Code du compte
- Nom du compte
- Total Débit
- Total Crédit
- Solde (Débit - Crédit)

**Contrôle** : TOTAL DÉBIT = TOTAL CRÉDIT

**Accès** : Onglet "Rapports" > Section "Balance Générale"

---

### 4. 📚 Grand Livre (General Ledger)

**Objectif** : Détail de tous les mouvements par compte

**Structure** : Pour chaque compte :
- Date de l'écriture
- Libellé
- Référence (numéro d'écriture)
- Débit
- Crédit
- Solde cumulé

**Accès** : Onglet "Rapports" > Section "Grand Livre"

**Filtrage** : Par code de compte (ex: 411*)

---

## 📝 Types de Journaux

### 1. VENTE (Journal des ventes)
**Usage** : Enregistrement des factures de vente

**Écriture type** :
```
Débit  411000 (Clients)         1200.00 €
Crédit 707000 (Ventes)                   1000.00 €
Crédit 445710 (TVA collectée)              200.00 €
```

### 2. ACHAT (Journal des achats)
**Usage** : Enregistrement des factures d'achat

**Écriture type** :
```
Débit  607000 (Achats)          1000.00 €
Débit  445660 (TVA déductible)   200.00 €
Crédit 401000 (Fournisseurs)            1200.00 €
```

### 3. BANQUE (Journal de banque)
**Usage** : Mouvements bancaires

**Écriture type (encaissement client)** :
```
Débit  512000 (Banque)          1200.00 €
Crédit 411000 (Clients)                 1200.00 €
```

### 4. CAISSE (Journal de caisse)
**Usage** : Opérations en espèces

**Écriture type (paiement fournisseur)** :
```
Débit  401000 (Fournisseurs)    1200.00 €
Crédit 530000 (Caisse)                  1200.00 €
```

### 5. OD (Opérations Diverses)
**Usage** : Autres opérations (salaires, amortissements, etc.)

**Écriture type (salaires)** :
```
Débit  641000 (Salaires)        3000.00 €
Débit  645000 (Charges sociales) 1000.00 €
Crédit 421000 (Personnel)               4000.00 €
```

---

## 🔄 Intégration avec les Factures

### Facturation Vente

Lorsqu'une facture de vente est créée, une écriture comptable est automatiquement générée :

**Facture : 1000 € HT + 200 € TVA = 1200 € TTC**

**Écriture générée** :
```
Journal: VENTE
Débit  411000 (Clients)         1200.00 €
Crédit 707000 (Ventes)                   1000.00 €
Crédit 445710 (TVA collectée)              200.00 €
```

### Facturation Achat

Lorsqu'une facture d'achat fournisseur est enregistrée :

**Facture : 1000 € HT + 200 € TVA = 1200 € TTC**

**Écriture générée** :
```
Journal: ACHAT
Débit  607000 (Achats)          1000.00 €
Débit  445660 (TVA déductible)   200.00 €
Crédit 401000 (Fournisseurs)            1200.00 €
```

---

## 🎓 Exemples d'Opérations Courantes

### Exemple 1 : Achat de marchandises

**Contexte** : Achat de 1000 € HT (TVA 20%)

```
Journal: ACHAT
Date: 2025-11-24

Débit  607000 (Achats de marchandises)  1000.00 €
Débit  445660 (TVA déductible)           200.00 €
Crédit 401000 (Fournisseurs)                     1200.00 €
```

### Exemple 2 : Vente de marchandises

**Contexte** : Vente de 2000 € HT (TVA 20%)

```
Journal: VENTE
Date: 2025-11-24

Débit  411000 (Clients)                 2400.00 €
Crédit 707000 (Ventes de marchandises)           2000.00 €
Crédit 445710 (TVA collectée)                      400.00 €
```

### Exemple 3 : Paiement fournisseur par banque

**Contexte** : Règlement d'une facture de 1200 €

```
Journal: BANQUE
Date: 2025-11-24

Débit  401000 (Fournisseurs)            1200.00 €
Crédit 512000 (Banque)                           1200.00 €
```

### Exemple 4 : Encaissement client en espèces

**Contexte** : Réception de 2400 € en espèces

```
Journal: CAISSE
Date: 2025-11-24

Débit  530000 (Caisse)                  2400.00 €
Crédit 411000 (Clients)                          2400.00 €
```

### Exemple 5 : Paiement de salaires

**Contexte** : Salaires bruts 3000 € + Charges 1000 €

```
Journal: OD
Date: 2025-11-24

Débit  641000 (Rémunérations)           3000.00 €
Débit  645000 (Charges sociales)        1000.00 €
Crédit 421000 (Personnel - rémunérations dues)   4000.00 €
```

---

## 🔧 API Backend

### Endpoints disponibles

```bash
# Plan Comptable
POST   /api/accounting/initialize          # Initialiser le PCG
GET    /api/accounting/accounts            # Liste des comptes
GET    /api/accounting/accounts?type=ASSET # Filtrer par type

# Écritures Comptables
POST   /api/accounting/entries             # Créer une écriture
GET    /api/accounting/entries             # Liste des écritures
GET    /api/accounting/entries?journal=VENTE # Filtrer par journal
POST   /api/accounting/entries/:id/validate # Valider une écriture

# Rapports
GET    /api/accounting/reports/general-ledger    # Grand livre
GET    /api/accounting/reports/trial-balance     # Balance
GET    /api/accounting/reports/income-statement  # Compte de résultat
GET    /api/accounting/reports/balance-sheet     # Bilan

# Statistiques
GET    /api/accounting/stats                     # Dashboard stats
```

### Exemple d'appel API : Créer une écriture

```javascript
const response = await fetch('http://localhost:4000/api/accounting/entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    date: '2025-11-24',
    label: 'Vente marchandises Client X',
    journal: 'VENTE',
    lines: [
      {
        accountId: 'uuid-compte-411000',
        label: 'Vente Client X',
        debit: 1200,
        credit: 0
      },
      {
        accountId: 'uuid-compte-707000',
        label: 'Ventes marchandises',
        debit: 0,
        credit: 1000
      },
      {
        accountId: 'uuid-compte-445710',
        label: 'TVA 20%',
        debit: 0,
        credit: 200
      }
    ]
  })
});
```

---

## 🎨 Interface Utilisateur

### Onglets principaux

#### 1. **Plan Comptable (Accounts)**
- Affichage de tous les comptes
- Filtrage par type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- Recherche par code ou nom
- Soldes actuels

#### 2. **Écritures Comptables (Entries)**
- Liste de toutes les écritures
- Création de nouvelles écritures
- Validation/Brouillon
- Filtrage par journal et date

#### 3. **Rapports (Reports)**
- Sélection de la période (année/mois)
- Affichage des 4 rapports :
  - Bilan
  - Compte de résultat
  - Balance générale
  - Grand livre

---

## ⚠️ Règles Comptables Importantes

### 1. Partie Double
**Règle** : Toute écriture doit respecter l'équilibre Débit = Crédit

✅ **BON** :
```
Débit  1200 €
Crédit 1200 €
```

❌ **MAUVAIS** :
```
Débit  1200 €
Crédit 1000 €  // Déséquilibre !
```

### 2. Numérotation des Écritures
**Format** : `{JOURNAL}-{ANNÉE}-{NUMÉRO}`

Exemples :
- `VENTE-2025-000001`
- `ACHAT-2025-000042`
- `BANQUE-2025-000123`

### 3. Validation des Écritures
- **Brouillon** : Modifiable, non inclus dans les rapports
- **Validé** : Immuable, inclus dans les rapports

⚠️ Une écriture validée ne peut plus être modifiée

### 4. Équilibre du Bilan
**Règle** : ACTIF = PASSIF + CAPITAUX PROPRES

Si le bilan est déséquilibré, il y a une erreur comptable.

---

## 🛠️ Maintenance et Bonnes Pratiques

### 1. Sauvegarde
- Les données sont dans la table PostgreSQL
- Faire des sauvegardes régulières de la base

### 2. Clôture d'Exercice
- Valider toutes les écritures avant clôture
- Générer les rapports annuels
- Transférer le résultat en compte 120000

### 3. Contrôles Périodiques
- **Hebdomadaire** : Vérifier la balance (Débit = Crédit)
- **Mensuel** : Générer le compte de résultat
- **Trimestriel** : Vérifier le bilan
- **Annuel** : Clôture comptable complète

---

## 📞 Support et Questions

Pour toute question sur le module comptabilité :

1. **Documentation technique** : Ce fichier
2. **Code source** :
   - Backend : `/backend/src/controllers/accounting.controller.ts`
   - Frontend : `/frontend/app/dashboard/accounting/page.tsx`
   - API : `/backend/src/routes/accounting.routes.ts`

---

## 🚦 État du Module

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Plan Comptable PCG | ✅ Complet | 43 comptes de base |
| Écritures Comptables | ✅ Complet | Saisie et validation |
| Grand Livre | ✅ Complet | Avec filtrage |
| Balance Générale | ✅ Complet | Débit/Crédit/Solde |
| Compte de Résultat | ✅ Complet | Produits/Charges |
| Bilan | ✅ Complet | Actif/Passif |
| Intégration Factures | ✅ Complet | Automatique |
| Export PDF | 🔄 À venir | Prochaine version |
| Clôture Exercice | 🔄 À venir | Prochaine version |

---

**Dernière mise à jour** : 2025-11-24
**Version** : 1.0.0
**Conforme** : Plan Comptable Général (PCG) français
