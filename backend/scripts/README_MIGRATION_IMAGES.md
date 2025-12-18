# 📸 Script de migration des images produits

Ce script permet de migrer automatiquement les images de vos produits depuis un fichier Excel vers la base de données PostgreSQL (encodage Base64).

## 🎯 Objectif

Résoudre le problème des images manquantes sur le site neoserv.fr en convertissant toutes les images en Base64 et en les stockant directement dans la base de données.

## 📋 Prérequis

1. **Fichier Excel** contenant vos produits avec les colonnes suivantes :
   - `sku` (ou `SKU` ou `Sku`) : Le code SKU du produit
   - `images` (ou `Images` ou `IMAGES`) : URL(s) de l'image, séparées par des virgules si plusieurs

   Exemple de contenu Excel :
   ```
   sku          | images
   -------------|-------------------------------------------------------
   PROD-001     | https://example.com/image1.jpg
   PROD-002     | https://example.com/img2.png, https://example.com/img3.jpg
   PROD-003     | https://cloudinary.com/myimage.webp
   ```

2. **Backend accessible** : Votre serveur PostgreSQL doit être accessible
3. **Connexion Internet** : Pour télécharger les images depuis les URLs

## 🚀 Utilisation

### 1. Test en mode "Dry Run" (Simulation)

Avant de modifier la base de données, testez le script pour voir ce qu'il va faire :

```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/backend
node scripts/migrate-images-from-excel.js /chemin/vers/votre/fichier.xlsx --dry-run
```

Cette commande va :
- ✅ Lire le fichier Excel
- ✅ Télécharger les images
- ✅ Les convertir en Base64
- ❌ Mais NE PAS modifier la base de données

### 2. Test sur quelques produits

Pour tester avec seulement les 5 premiers produits :

```bash
node scripts/migrate-images-from-excel.js /chemin/vers/votre/fichier.xlsx --limit 5
```

### 3. Migration complète

Une fois que vous êtes sûr que tout fonctionne, lancez la migration complète :

```bash
node scripts/migrate-images-from-excel.js /chemin/vers/votre/fichier.xlsx
```

## 📊 Résultats du script

Le script affiche un rapport détaillé :

```
╔══════════════════════════════════════════════════════╗
║  Migration des images depuis Excel → Base64         ║
╚══════════════════════════════════════════════════════╝

📖 Lecture du fichier Excel: produits.xlsx
✅ 150 lignes trouvées dans le fichier

[1/150]
🔄 Traitement: PROD-001
  📷 1 image(s) à traiter
  📥 Téléchargement: https://example.com/image1.jpg
  ✅ Converti en Base64 (245.3 KB)
  ✅ Produit mis à jour avec 1 image(s)

[2/150]
🔄 Traitement: PROD-002
  📷 2 image(s) à traiter
  📥 Téléchargement: https://example.com/img2.png
  ✅ Converti en Base64 (189.7 KB)
  📥 Téléchargement: https://example.com/img3.jpg
  ✅ Converti en Base64 (312.1 KB)
  ✅ Produit mis à jour avec 2 image(s)

...

╔══════════════════════════════════════════════════════╗
║                  RÉSUMÉ FINAL                        ║
╚══════════════════════════════════════════════════════╝

Total traité:           150
✅ Succès:              142
❌ Échecs:              8

Détail des échecs:
  - Produit non trouvé: 3
  - Pas d'images:       2
  - Téléchargement KO:  3

✅ Migration terminée!
```

## ⚠️ Points importants

1. **Taille des images** : Le script peut traiter des images jusqu'à plusieurs Mo. Si vous avez des images très lourdes (>5 MB), il est recommandé de les compresser avant.

2. **Temps d'exécution** : Le script traite chaque produit séquentiellement avec une pause de 500ms entre chaque pour ne pas surcharger le serveur. Pour 150 produits, comptez environ 5-10 minutes.

3. **URLs valides** : Les URLs doivent commencer par `http://` ou `https://`. Les chemins relatifs ne sont pas supportés.

4. **Formats supportés** : JPG, JPEG, PNG, GIF, WEBP

## 🔧 Résolution des problèmes

### Erreur "Produit non trouvé"
Le SKU dans votre Excel ne correspond à aucun produit dans la base de données. Vérifiez l'orthographe du SKU.

### Erreur "Téléchargement KO"
L'URL de l'image n'est pas accessible. Vérifiez que :
- L'URL est correcte
- L'image existe toujours
- Le serveur hébergeant l'image est accessible

### Erreur "Erreur BDD"
Problème de connexion à PostgreSQL. Vérifiez :
- Que la base de données est accessible
- Que les credentials dans `.env` sont corrects
- Que le service PostgreSQL est démarré

## 📝 Exemple complet

```bash
# 1. Tester d'abord en mode dry-run
node scripts/migrate-images-from-excel.js ~/Desktop/produits_neoserv.xlsx --dry-run

# 2. Tester sur 5 produits
node scripts/migrate-images-from-excel.js ~/Desktop/produits_neoserv.xlsx --limit 5

# 3. Si tout est OK, lancer la migration complète
node scripts/migrate-images-from-excel.js ~/Desktop/produits_neoserv.xlsx
```

## ✅ Après la migration

Une fois la migration terminée :

1. Allez sur **neoserv.fr/shop/products** pour vérifier que les images s'affichent
2. Testez également sur l'application mobile
3. Si certains produits n'ont pas d'images, relancez le script uniquement pour ces produits

## 🆘 Support

Si vous rencontrez des problèmes, le script affiche des messages d'erreur détaillés pour chaque produit. Notez les SKUs problématiques et corrigez les URLs dans votre Excel avant de relancer le script.
