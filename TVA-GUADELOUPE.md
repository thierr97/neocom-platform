# 💰 Configuration TVA Guadeloupe

## 📍 Taux applicables en Guadeloupe (DROM)

La Guadeloupe, en tant que département et région d'outre-mer (DROM), applique des taux de TVA spécifiques, différents de ceux de la métropole.

### Taux de TVA en vigueur :

| Type | Taux Guadeloupe | Taux Métropole | Utilisation |
|------|----------------|----------------|-------------|
| **Normal** | **8,5%** | 20% | Biens et services standard |
| **Réduit** | **2,1%** | 5,5% | Produits alimentaires, services essentiels |
| **Particulier 1** | **1,75%** | - | Médicaments remboursables |
| **Particulier 2** | **1,05%** | - | Presse, livres |
| **Exonéré** | **0%** | 0% | Exportations, certains services |

## 🔧 Implémentation technique

### Fichier de configuration : `backend/src/config/tax.config.ts`

```typescript
export const TAX_CONFIG = {
  STANDARD_RATE: 8.5,      // Taux normal Guadeloupe
  REDUCED_RATE: 2.1,       // Taux réduit
  SPECIAL_RATE_1: 1.75,    // Taux particulier 1
  SPECIAL_RATE_2: 1.05,    // Taux particulier 2
  DEFAULT_RATE: 8.5,       // Taux par défaut
};
```

### Fonctions utilitaires :

- `getDefaultTaxRate()` : Retourne 8.5%
- `calculateTax(amount, taxRate?)` : Calcule la TVA
- `calculateTTC(amountHT, taxRate?)` : Calcule le montant TTC
- `calculateHT(amountTTC, taxRate?)` : Calcule le montant HT

## 📦 Fichiers modifiés

### Backend :
1. **`src/config/tax.config.ts`** - Nouvelle configuration TVA
2. **`src/controllers/shop.controller.ts`** - Commandes publiques
3. **`src/controllers/order.controller.ts`** - Gestion des commandes
4. **`src/controllers/invoice.controller.ts`** - Facturation
5. **`src/controllers/purchase-invoice.controller.ts`** - Factures fournisseurs

### Changements appliqués :
- ❌ `taxRate || 20` → ✅ `taxRate || getDefaultTaxRate()`
- ❌ `* 0.2` (20%) → ✅ `* (getDefaultTaxRate() / 100)` (8.5%)

## 🎯 Impact sur le système

### Nouveaux calculs (exemples) :

**Produit à 100€ HT :**
- Avant (20%) : 100€ + 20€ TVA = **120€ TTC**
- Après (8.5%) : 100€ + 8.50€ TVA = **108.50€ TTC**

**Commande de 1000€ HT :**
- Avant (20%) : 1000€ + 200€ TVA = **1200€ TTC**
- Après (8.5%) : 1000€ + 85€ TVA = **1085€ TTC**

## ⚠️ Points d'attention

### 1. Taux personnalisés
Le système permet de définir un taux personnalisé par produit ou ligne de commande.
Si aucun taux n'est spécifié, le taux par défaut (8.5%) est appliqué.

### 2. Factures existantes
Les factures déjà émises avec l'ancien taux (20%) ne sont **PAS modifiées**.
Seules les **nouvelles** commandes/factures utilisent le taux 8.5%.

### 3. Migration des données
Si vous souhaitez recalculer les factures existantes avec le nouveau taux :
```bash
# ATTENTION : Cette opération est irréversible !
# Créer un backup avant d'exécuter
cd ~/neoserv-platform/backend
node scripts/recalculate-tax.js --dry-run  # Test
node scripts/recalculate-tax.js --execute  # Exécution
```

## 📊 Formulaires et interfaces

### Options de taux disponibles :
Dans les formulaires de création de commandes, factures, etc., les options suivantes sont proposées :

- ✅ 8,5% - Taux normal Guadeloupe (défaut)
- ✅ 2,1% - Taux réduit
- ✅ 1,75% - Taux particulier 1
- ✅ 1,05% - Taux particulier 2
- ✅ 0% - Exonéré

## 🔗 Références légales

- [Service-Public.fr - TVA dans les DOM](https://www.service-public.fr/professionnels-entreprises/vosdroits/F23567)
- [Impots.gouv.fr - TVA DOM-TOM](https://www.impots.gouv.fr/professionnel/questions/quels-sont-les-taux-de-tva-applicables-dans-les-dom)
- [Direction générale des Finances publiques - TVA Guadeloupe](https://www.impots.gouv.fr/www2/territoires/guadeloupe/)

---

**Date de mise à jour** : 1er Décembre 2025
**Version** : 1.0
**Statut** : ✅ Appliqué en production
**Taux par défaut** : **8,5%** (Guadeloupe)
