# 📦 Guide : Déplacer les Produits entre Catégories et Sous-Catégories

## ✨ Améliorations apportées

Le sélecteur de catégories a été amélioré pour :
- **Affichage hiérarchique clair** avec icônes 📁 pour les catégories principales et ↳ pour les sous-catégories
- **Organisation automatique** : les sous-catégories apparaissent juste après leur catégorie parente
- **Indentation visuelle** pour faciliter la distinction
- **Police monospace** pour un meilleur alignement

## 🎯 Comment déplacer un produit

### Étape 1 : Accéder à l'interface d'administration

1. Ouvrez votre navigateur et allez sur : **http://localhost:3000/dashboard**
2. Connectez-vous avec vos identifiants admin
3. Cliquez sur **"Produits"** dans le menu de gauche

### Étape 2 : Sélectionner le produit à déplacer

1. Dans la liste des produits, repérez le produit que vous voulez déplacer
2. Cliquez sur le bouton **"✏️ Modifier"** ou sur la ligne du produit

### Étape 3 : Changer la catégorie

1. Dans le formulaire d'édition, localisez le champ **"Catégorie *"**
2. Cliquez sur le menu déroulant
3. Vous verrez la liste organisée ainsi :

```
📁 Informatique
   ↳ Ordinateurs Portables
   ↳ Ordinateurs de Bureau
   ↳ Composants PC
   ↳ Périphériques
   ↳ Stockage

📁 Électronique
   ↳ Smartphones
   ↳ Tablettes
   ↳ Audio
   ↳ Photo & Vidéo
   ↳ Accessoires Électroniques

📁 Mobilier
   ↳ Bureaux
   ↳ Chaises
   ↳ Rangements
   ...
```

4. **Sélectionnez** la catégorie ou sous-catégorie de destination
   - Vous pouvez choisir une **catégorie principale** (📁)
   - Ou une **sous-catégorie** (↳) pour une organisation plus précise

### Étape 4 : Enregistrer les modifications

1. Cliquez sur le bouton **"Enregistrer"** en bas du formulaire
2. Le produit est maintenant dans sa nouvelle catégorie !

## 💡 Exemples d'utilisation

### Exemple 1 : Déplacer un laptop d'une catégorie générale vers une sous-catégorie spécifique

**Avant** : Produit dans "📁 Informatique"
**Action** : Sélectionner "↳ Ordinateurs Portables"
**Résultat** : Le produit apparaît maintenant dans la sous-catégorie "Ordinateurs Portables"

### Exemple 2 : Réorganiser des smartphones

**Avant** : Produit dans "📁 Électronique"
**Action** : Sélectionner "↳ Smartphones"
**Résultat** : Meilleure organisation pour les clients qui cherchent des smartphones

### Exemple 3 : Déplacer un produit d'une sous-catégorie à une autre

**Avant** : Produit dans "↳ Composants PC"
**Action** : Sélectionner "↳ Périphériques"
**Résultat** : Le produit change de sous-catégorie instantanément

## 🔄 Déplacement en masse (futur)

Si vous avez besoin de déplacer plusieurs produits à la fois :

1. **Option 1** : Utiliser l'import CSV avec la colonne `categoryId`
2. **Option 2** : Utiliser l'API REST pour des scripts automatisés
3. **Option 3** : Contacter l'administrateur pour un script personnalisé

## ⚡ Conseils et bonnes pratiques

### ✅ À faire

- **Utilisez les sous-catégories** pour une meilleure organisation
- **Soyez cohérent** dans vos choix de catégories
- **Testez la navigation** côté boutique après avoir déplacé des produits
- **Vérifiez que le produit** apparaît bien dans la nouvelle catégorie sur le site

### ❌ À éviter

- Ne déplacez pas tous les produits dans les catégories principales (utilisez les sous-catégories)
- N'oubliez pas de sauvegarder après avoir sélectionné une nouvelle catégorie
- Ne changez pas trop souvent les catégories (cela peut dérouter les clients)

## 🎨 Interface visuelle

Le sélecteur affiche :

| Symbole | Signification | Exemple |
|---------|---------------|---------|
| 📁 | Catégorie principale | 📁 Informatique |
| ↳ | Sous-catégorie | ↳ Ordinateurs Portables |
| **Gras** | Catégorie principale | **Informatique** |
| Normal | Sous-catégorie | Ordinateurs Portables |
| Indentation | Hiérarchie | `   ↳ Sous-catégorie` |

## 🚀 Impact sur le site

Quand vous déplacez un produit :

1. **Navigation** : Le produit apparaît dans la nouvelle catégorie/sous-catégorie
2. **Recherche** : Le produit reste toujours trouvable par recherche
3. **URL** : L'URL du produit ne change pas
4. **Stock** : Le stock n'est pas affecté
5. **Commandes** : Les commandes existantes ne sont pas affectées

## 🔍 Vérification

Après avoir déplacé un produit :

1. **Allez sur la boutique** : http://localhost:3000/shop (ou https://neoserv.fr/shop en production)
2. **Naviguez vers la nouvelle catégorie** dans le menu latéral
3. **Vérifiez que le produit apparaît** dans la liste

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que le backend est bien démarré
2. Vérifiez que le frontend est bien démarré
3. Vérifiez votre connexion internet
4. Consultez les logs du navigateur (F12 > Console)
5. Contactez l'administrateur technique

---

**Dernière mise à jour** : 30 Novembre 2025
**Version** : 1.0
**Statut** : ✅ Fonctionnel
