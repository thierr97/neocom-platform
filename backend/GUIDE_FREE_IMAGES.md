# 🖼️ Guide: Recherche d'Images Gratuites Haute Qualité

Ce guide explique comment trouver automatiquement des images professionnelles **GRATUITES** pour vos produits depuis Unsplash, Pexels et Pixabay.

---

## ✅ Avantages

- **100% GRATUIT** - Aucun coût, illimité
- **Légal** - Images libres de droits pour usage commercial
- **Haute qualité** - Photos professionnelles
- **3 sources** - Unsplash + Pexels + Pixabay
- **Automatique** - Recherche et téléchargement automatiques
- **Attribution** - Crédits photographes enregistrés automatiquement

---

## 📋 Étape 1: Obtenir les clés API (GRATUIT)

### 🎨 Unsplash (Recommandé - Meilleure qualité)

1. Allez sur **https://unsplash.com/developers**
2. Cliquez "Register as a developer"
3. Créez une application:
   - Name: "NEOSERV Product Images"
   - Description: "Product photography for e-commerce"
4. Copiez votre **Access Key**
5. Ajoutez dans `.env`:
   ```bash
   UNSPLASH_ACCESS_KEY=votre_access_key
   ```

**Limites:** 50 requêtes/heure (gratuit)

---

### 📸 Pexels

1. Allez sur **https://www.pexels.com/api/**
2. Cliquez "Get Started" puis "Sign up"
3. Une fois connecté, votre API Key apparaît
4. Ajoutez dans `.env`:
   ```bash
   PEXELS_API_KEY=votre_api_key
   ```

**Limites:** 200 requêtes/heure (gratuit)

---

### 🎭 Pixabay

1. Allez sur **https://pixabay.com/api/docs/**
2. Créez un compte si nécessaire
3. Votre API Key est dans votre profil (Settings)
4. Ajoutez dans `.env`:
   ```bash
   PIXABAY_API_KEY=votre_api_key
   ```

**Limites:** 5000 requêtes/heure (gratuit)

---

## 🚀 Utilisation

### Test en mode DRY RUN (recommandé)

```bash
DRY_RUN=true MAX_PRODUCTS=5 npx ts-node search-free-images.ts
```

Montre ce qui serait trouvé sans télécharger.

### Recherche et téléchargement réel

```bash
# 10 premiers produits (3 images chacun)
MAX_PRODUCTS=10 npx ts-node search-free-images.ts

# 50 produits
MAX_PRODUCTS=50 npx ts-node search-free-images.ts

# Personnaliser le nombre d'images par produit
MAX_PRODUCTS=10 IMAGES_PER_PRODUCT=5 npx ts-node search-free-images.ts
```

---

## 🎯 Ce que fait le script

1. **Analyse le produit** - Extrait les mots-clés (valise → suitcase, tapis → rug, etc.)
2. **Cherche sur 3 plateformes** - Unsplash + Pexels + Pixabay en parallèle
3. **Télécharge les meilleures** - Les images les plus pertinentes
4. **Upload vers Cloudinary** - Avec optimisation automatique
5. **Met à jour la BD** - Produit avec nouvelles images
6. **Enregistre l'attribution** - Crédit du photographe dans les métadonnées

---

## 📊 Exemple de résultat

```
🖼️  RECHERCHE D'IMAGES GRATUITES HAUTE QUALITÉ

📊 Configuration:
   - APIs actives: Unsplash, Pexels, Pixabay
   - Max produits: 10
   - Images par produit: 3
   - Mode: PRODUCTION

📦 10 produits à traiter

📦 Recherche pour: LOTS DE 3 VALISE PS Crème
   SKU: K92001-CREME
   🔍 Requête: "suitcase luggage travel bag"
   ✓ 7 images trouvées
   📤 Upload 1/3 de Unsplash...
   ✓ Uploadé: Photo by Anete Lusina (Unsplash)
   📤 Upload 2/3 de Pexels...
   ✓ Uploadé: Photo by Vlada Karpovich (Pexels)
   📤 Upload 3/3 de Pixabay...
   ✓ Uploadé: Photo by StockSnap (Pixabay)
   ✓ Base de données mise à jour (3 images)
   Progression: 1/10

✅ RECHERCHE ET TÉLÉCHARGEMENT TERMINÉS
📊 Produits traités: 10
✓ Succès: 10
🖼️  Total images téléchargées: 30
💰 Coût: GRATUIT
```

---

## 🎨 Correspondances de mots-clés

Le script traduit automatiquement:

| Français | Anglais (recherche) |
|----------|---------------------|
| valise, bagage | suitcase, luggage, travel bag |
| tapis | floor mat, rug, carpet |
| cadenas, serrure | padlock, lock, security |
| balance | scale, luggage scale |
| chariot | trolley, cart |
| corde, sangle | strap, rope, cord |
| étiquette | tag, label, luggage tag |
| protection, housse | cover, protective cover |

---

## 💰 Coûts et limites

### 100% GRATUIT mais avec limites:

| Plateforme | Requêtes/heure | Coût |
|------------|---------------|------|
| Unsplash | 50 | GRATUIT |
| Pexels | 200 | GRATUIT |
| Pixabay | 5000 | GRATUIT |

### Calcul:
- **Avec les 3 APIs**: ~250 requêtes/heure possibles
- **1 produit** = 1 requête par plateforme = 3 requêtes
- **~80 produits/heure** en utilisant les 3 APIs

### Pour traiter beaucoup de produits:
- Lancez le script par lots de 50-80 produits
- Attendez 1 heure entre les lots
- Ou répartissez sur plusieurs jours

---

## ⚖️ Légalité et Attribution

### ✅ Utilisation commerciale:
- **Unsplash**: Libre de droits, usage commercial OK
- **Pexels**: Libre de droits, usage commercial OK
- **Pixabay**: Libre de droits, usage commercial OK

### 📝 Attribution:
- **Pas obligatoire** mais recommandée
- Le script enregistre automatiquement les crédits dans Cloudinary
- Vous pouvez afficher "Photo by [Name] on [Platform]" si vous le souhaitez

### 🚫 Restrictions:
- Ne pas revendre les images seules
- Ne pas prétendre en être l'auteur
- OK pour produits, marketing, site web, etc.

---

## 🔧 Personnalisation

### Modifier les mots-clés

Éditez `search-free-images.ts`, fonction `extractSearchKeywords()`:

```typescript
if (text.includes('votre_mot')) {
  keywords.push('english', 'keywords', 'here');
}
```

### Changer le nombre d'images

```bash
IMAGES_PER_PRODUCT=5 npx ts-node search-free-images.ts
```

### Filtrer par orientation

Dans les fonctions `searchUnsplash`, `searchPexels`, etc., modifiez:
```typescript
orientation=squarish  // ou 'landscape', 'portrait'
```

---

## 🆚 Comparaison avec génération IA

| Aspect | Images gratuites | IA (Replicate) |
|--------|-----------------|----------------|
| **Coût** | GRATUIT | ~$0.03/produit |
| **Qualité** | Très haute | Haute |
| **Vitesse** | Rapide | Moyenne (30-60s/image) |
| **Pertinence** | Variable | Personnalisée |
| **Limites** | 80 produits/heure | Illimité (payant) |
| **Légal** | 100% | 100% |

### Recommandation:
1. **Commencez avec les images gratuites** (ce script)
2. **Vérifiez la qualité** et pertinence
3. **Utilisez l'IA** pour les produits spécifiques si besoin

---

## ⚠️ Dépannage

### "Aucune clé API configurée"
→ Vérifiez que vos clés sont dans `.env`

### "Aucune image trouvée"
→ Les mots-clés ne correspondent pas, ajustez dans `extractSearchKeywords()`

### "Rate limit exceeded"
→ Attendez 1 heure ou réduisez le nombre de produits

### Images non pertinentes
→ Personnalisez les mots-clés de recherche pour vos types de produits

---

## 💡 Astuces PRO

### 1. Combinez les approches:
```bash
# Images gratuites pour produits génériques
MAX_PRODUCTS=50 npx ts-node search-free-images.ts

# IA pour produits spécifiques
MAX_PRODUCTS=10 npx ts-node generate-ai-images.ts
```

### 2. Traitez par catégories:
```sql
-- Modifiez le script pour filtrer par catégorie
WHERE categoryId = 'your-category-id'
```

### 3. Optimisez les recherches:
- Produits de voyage → Unsplash (excellentes photos de voyage)
- Produits maison → Pexels (bonnes photos d'intérieur)
- Produits génériques → Pixabay (grande variété)

---

## 📊 Résumé des APIs

### ⭐ Unsplash (Le meilleur)
- **Avantages**: Qualité exceptionnelle, esthétique professionnelle
- **Limite**: 50/heure mais largement suffisant
- **Idéal pour**: Produits lifestyle, voyage, mode

### 📸 Pexels
- **Avantages**: Bonne qualité, 200 requêtes/heure
- **Idéal pour**: Produits maison, décoration, accessoires

### 🎨 Pixabay
- **Avantages**: 5000 requêtes/heure, grande variété
- **Qualité**: Variable mais généralement bonne
- **Idéal pour**: Volume important, produits génériques

---

## 🎯 Workflow recommandé

1. **Configurez les 3 APIs** (15 min)
2. **Test avec 5 produits** en DRY_RUN (2 min)
3. **Vérifiez les mots-clés** générés (5 min)
4. **Ajustez si nécessaire** (10 min)
5. **Lancez pour 50 produits** (30 min)
6. **Vérifiez la qualité** (10 min)
7. **Continuez par lots** selon besoin

---

## 📞 Support

- **Documentation des APIs**:
  - Unsplash: https://unsplash.com/documentation
  - Pexels: https://www.pexels.com/api/documentation/
  - Pixabay: https://pixabay.com/api/docs/

- **Script**: `search-free-images.ts` (code commenté)

---

**🎉 Profitez de milliers d'images professionnelles GRATUITES pour votre e-commerce!**
