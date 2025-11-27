# 🎨 Guide: Génération d'Images IA pour Produits

Ce guide explique comment générer des images professionnelles pour vos produits en utilisant l'IA.

## 📋 Prérequis

### 1. Créer un compte Replicate

1. Allez sur https://replicate.com
2. Créez un compte (gratuit pour commencer)
3. Naviguez vers **Account → API Tokens**
4. Copiez votre token API (format: `r8_xxx...`)

### 2. Installer les dépendances

```bash
cd backend
npm install replicate node-fetch
```

### 3. Configuration

Ajoutez votre token dans le fichier `.env`:

```bash
# AI Image Generation
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloudinary (déjà configuré normalement)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🚀 Utilisation

### Test en mode DRY RUN (recommandé d'abord)

```bash
DRY_RUN=true MAX_PRODUCTS=5 npx ts-node generate-ai-images.ts
```

Cela va montrer ce qui serait généré sans consommer de crédits API.

### Génération réelle (10 premiers produits)

```bash
MAX_PRODUCTS=10 npx ts-node generate-ai-images.ts
```

### Génération pour tous les produits sans images

```bash
npx ts-node generate-ai-images.ts
```

## 🎯 Ce que fait le script

Pour chaque produit, le script génère **3 images professionnelles**:

1. **Vue de face** - Image centrée du produit
2. **Vue en angle** - Vue à 45° pour montrer la profondeur
3. **Lifestyle** - Produit en situation d'utilisation

### Caractéristiques des images générées:

- ✅ Résolution: 1024x1024px (haute qualité)
- ✅ Fond blanc professionnel
- ✅ Éclairage studio
- ✅ Style e-commerce comme Temu/Amazon
- ✅ Optimisées automatiquement par Cloudinary
- ✅ Format WebP automatique

## 💰 Coûts

### Replicate (Stable Diffusion XL):
- ~$0.01 par image générée
- 3 images par produit = ~$0.03 par produit
- 100 produits = ~$3.00
- 1000 produits = ~$30.00

### Crédits gratuits:
- Nouveau compte Replicate: $5 gratuits
- Permet de générer ~500 images gratuitement

## 📊 Exemple de résultat

```
🎨 GÉNÉRATION D'IMAGES IA POUR PRODUITS E-COMMERCE

📦 Traitement: LOTS DE 3 VALISE PS Crème
   SKU: K92001-CREME
   🎨 Génération avec prompt: "Professional product photography, luggage, front view..."
   ✓ Image générée: front
   ✓ Uploadé vers Cloudinary
   🎨 Génération avec prompt: "Professional product photography, luggage, 45 degree..."
   ✓ Image générée: angle
   ✓ Uploadé vers Cloudinary
   🎨 Génération avec prompt: "Professional product photography, luggage, lifestyle..."
   ✓ Image générée: lifestyle
   ✓ Uploadé vers Cloudinary
   ✓ Base de données mise à jour
   Progression: 1/10

✅ GÉNÉRATION TERMINÉE
📊 Produits traités: 10
✓ Succès: 10
🎨 Total images générées: 30
```

## 🎛️ Options avancées

### Modifier les prompts

Éditez le fichier `generate-ai-images.ts`, section `PRODUCT_ANGLES`:

```typescript
const PRODUCT_ANGLES = [
  {
    name: 'front',
    prompt: 'front view, centered, professional product photography'
  },
  {
    name: 'detail',
    prompt: 'close-up detail shot, macro photography'
  },
  {
    name: 'packaging',
    prompt: 'product with packaging, unboxing style'
  }
];
```

### Ajuster la qualité

Dans la fonction `generateImage()`, modifiez:

```typescript
guidance_scale: 7.5,    // Plus haut = plus fidèle au prompt (5-15)
num_inference_steps: 50, // Plus haut = meilleure qualité (30-100)
width: 1024,            // Taille de l'image
height: 1024
```

## ⚠️ Limites et considérations

### ✅ Avantages:
- Images cohérentes et professionnelles
- Plusieurs angles automatiquement
- Pas de problèmes de droits d'auteur
- Style personnalisable

### ⚠️ Limitations:
- L'IA peut ne pas comprendre tous les produits spécifiques
- Nécessite des crédits API (payant après les crédits gratuits)
- Peut nécessiter des ajustements de prompts pour certains produits
- Temps de génération: ~30-60 secondes par image

## 🔄 Workflow recommandé

1. **Test avec 5-10 produits** en DRY_RUN
2. **Vérifier les prompts** générés
3. **Ajuster si nécessaire** les prompts dans le code
4. **Générer pour 10-20 produits** réels
5. **Vérifier la qualité** des images
6. **Lancer en masse** si satisfait

## 🆘 Dépannage

### "REPLICATE_API_TOKEN manquant"
→ Vérifiez que votre token est bien dans `.env`

### "Rate limit exceeded"
→ Augmentez le délai entre les générations (ligne `setTimeout`)

### Images de mauvaise qualité
→ Ajustez les paramètres `guidance_scale` et `num_inference_steps`

### Prompts non adaptés
→ Personnalisez la fonction `generateProductPrompt()` pour vos types de produits

## 💡 Alternative: OpenAI DALL-E 3

Si vous préférez DALL-E 3 (meilleure qualité mais plus cher):

```bash
npm install openai
```

Ajoutez dans `.env`:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

Un script alternatif peut être créé sur demande.

## 📞 Support

Pour des questions ou problèmes:
1. Vérifiez ce guide
2. Consultez la documentation Replicate: https://replicate.com/docs
3. Testez d'abord en DRY_RUN mode

---

**Note**: Les images générées par IA n'ont pas de problèmes de droits d'auteur et peuvent être utilisées commercialement. 🎯
