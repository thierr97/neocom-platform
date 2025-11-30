# 🔄 Migration des Produits vers les Sous-Catégories

## 🎯 Objectif

Déplacer automatiquement tous les produits qui sont dans des **catégories parentes** vers les **sous-catégories appropriées**.

## ⚠️ Pourquoi cette migration ?

Depuis la mise à jour du système, **seuls les produits dans les sous-catégories** s'affichent dans le shop.

**Avant** :
- Produits pouvaient être dans "Informatique" (catégorie parente) ❌
- Ces produits ne s'affichent plus dans le shop

**Après** :
- Produits doivent être dans "Ordinateurs Portables" (sous-catégorie) ✅
- Ces produits s'affichent dans le shop

## 🤖 Le Script Automatique

Le script `migrate-products-to-subcategories.js` fait le travail automatiquement :

### Comment ça marche ?

1. **Détecte** tous les produits dans des catégories parentes
2. **Analyse** le nom et la description du produit
3. **Détermine** la meilleure sous-catégorie en fonction de mots-clés
4. **Déplace** le produit vers cette sous-catégorie

### Règles de mapping

Le script utilise des mots-clés intelligents pour choisir la bonne sous-catégorie :

**Informatique** :
- "laptop", "portable", "notebook" → **Ordinateurs Portables**
- "desktop", "tour", "pc fixe" → **Ordinateurs de Bureau**
- "processeur", "cpu", "gpu", "ram" → **Composants PC**
- "clavier", "souris", "casque" → **Périphériques**
- "disque dur", "ssd", "stockage" → **Stockage**

**Électronique** :
- "smartphone", "téléphone", "iphone" → **Smartphones**
- "tablette", "ipad" → **Tablettes**
- "écouteurs", "enceinte" → **Audio**
- "appareil photo", "caméra" → **Photo & Vidéo**
- "câble", "chargeur", "adaptateur" → **Accessoires Électroniques**

**Mobilier** :
- "bureau", "desk" → **Bureaux**
- "chaise", "fauteuil", "siège" → **Chaises**
- "rangement", "armoire", "étagère" → **Rangements**
- "table" → **Tables**
- "canapé", "sofa" → **Canapés**

### Sous-catégories par défaut

Si aucun mot-clé ne correspond, le produit est placé dans :
- **Informatique** → Périphériques
- **Électronique** → Accessoires Électroniques
- **Mobilier** → Rangements

## 📋 Utilisation

### Étape 1 : Test en mode Dry-Run (OBLIGATOIRE)

**En local** :
```bash
cd ~/neoserv-platform/backend
node migrate-products-to-subcategories.js
```

**En production (via Render Shell)** :
```bash
node migrate-products-to-subcategories.js
```

Cela affiche ce qui **serait fait** sans rien modifier.

**Exemple de sortie** :
```
📦 Informatique : 45 produits à migrer
   Sous-catégories disponibles : Ordinateurs Portables, ...

   LAPTOP-PRO-001 - MacBook Pro 16"
   └─> Informatique ➜ Ordinateurs Portables

   MOUSE-GAMING-001 - Souris Gaming RGB
   └─> Informatique ➜ Périphériques

📊 RÉSUMÉ
Total de produits migrés : 45

Détail par catégorie de destination :
  - Ordinateurs Portables : 12 produits
  - Périphériques : 18 produits
  - Composants PC : 10 produits
  - Stockage : 5 produits
```

### Étape 2 : Vérifier les résultats

Regardez attentivement la liste des migrations proposées :
- ✅ Les catégories de destination sont-elles correctes ?
- ✅ Les produits sont-ils bien classés ?
- ⚠️ Y a-t-il des erreurs de classification ?

### Étape 3 : Exécuter la migration

**Une fois que vous êtes satisfait du test** :

**En local** :
```bash
node migrate-products-to-subcategories.js --execute
```

**En production (RECOMMANDÉ via Render Shell)** :
```bash
# 1. Se connecter à Render Dashboard : https://dashboard.render.com
# 2. Sélectionner le service : neoserv-backend
# 3. Cliquer sur "Shell"
# 4. Exécuter :
node migrate-products-to-subcategories.js --execute
```

### Étape 4 : Vérifier le résultat

Après la migration :

1. **Vérifier l'API** :
```bash
curl https://neoserv-backend.onrender.com/api/shop/products | jq '.pagination.total'
# Devrait afficher le nombre total de produits visibles
```

2. **Vérifier le shop** :
Ouvrir https://frontend-mjfbheyya-thierr97s-projects.vercel.app/shop
Tous les produits devraient maintenant être visibles !

## 🔧 Options avancées

### Modifier les règles de mapping

Si vous voulez personnaliser les règles, éditez le fichier `migrate-products-to-subcategories.js` :

```javascript
const MAPPING_RULES = {
  'Ordinateurs Portables': ['laptop', 'portable', 'notebook', 'macbook', 'thinkpad'],
  // Ajouter vos propres mots-clés ici
  'Ma Sous-Catégorie': ['mon-mot-clé', 'autre-mot-clé'],
};
```

### Migration manuelle d'un produit spécifique

Si un produit est mal classé après la migration automatique :

1. Aller sur le dashboard : `/dashboard/products`
2. Cliquer sur "Modifier" pour le produit
3. Changer la "Sous-catégorie"
4. Enregistrer

## 📊 Statistiques après migration

Pour voir l'état après migration :

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const productsInParents = await prisma.product.count({
    where: {
      category: { parentId: null }
    }
  });

  const productsInSubcategories = await prisma.product.count({
    where: {
      category: { parentId: { not: null } }
    }
  });

  console.log('Produits dans catégories parentes:', productsInParents);
  console.log('Produits dans sous-catégories:', productsInSubcategories);

  process.exit(0);
})();
"
```

**Attendu après migration** :
```
Produits dans catégories parentes: 0
Produits dans sous-catégories: [nombre total de produits]
```

## ⚠️ Attention

### Avant d'exécuter en production

1. ✅ **Toujours faire un test** avec le mode dry-run d'abord
2. ✅ **Vérifier** que les sous-catégories existent bien
3. ✅ **Avoir une sauvegarde** de la base de données (Render en fait automatiquement)
4. ✅ **Exécuter pendant une période creuse** si possible

### En cas de problème

Le script ne supprime aucun produit, il ne fait que changer leur `categoryId`.

Si un produit est mal classé :
- Utilisez le dashboard pour le corriger manuellement
- Ou modifiez les règles de mapping et réexécutez le script

## 🎉 Résultat attendu

**Avant la migration** :
```
Shop : 15 produits visibles (ceux déjà dans les sous-catégories)
```

**Après la migration** :
```
Shop : 150+ produits visibles (TOUS les produits actifs)
```

---

**Date** : 30 Novembre 2025
**Script** : `migrate-products-to-subcategories.js`
**Statut** : ✅ Prêt à l'emploi
**Mode** : Test par défaut, `--execute` pour appliquer
