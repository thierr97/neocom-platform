# 📋 Instructions pour Créer les Sous-Catégories en Production

## ✅ Ce qui a été fait

1. **Script créé et testé en local** : Le script de création des sous-catégories a été développé et testé avec succès sur la base de données locale
2. **15 sous-catégories créées en local** pour valider le fonctionnement
3. **Frontend déjà prêt** : Le code du frontend (shop/page.tsx) affiche automatiquement les sous-catégories dès qu'elles existent
4. **Script de production préparé** : `backend/scripts/create-subcategories-production.ts`

## 📊 Sous-Catégories qui seront créées

Le script créera automatiquement **70+ sous-catégories** réparties dans les catégories principales existantes :

### Catégories Informatique & Technologie (15 sous-catégories)
- **Informatique** : Ordinateurs Portables, Ordinateurs de Bureau, Composants PC, Périphériques, Stockage
- **Électronique** : Smartphones, Tablettes, Audio, Photo & Vidéo, Accessoires Électroniques
- **Réseau** : Routeurs, Switches, Points d'accès WiFi, Câbles Réseau, Modems

### Catégories Maison & Bureau (10 sous-catégories)
- **Mobilier** : Bureaux, Chaises, Rangements, Tables, Canapés
- **Électroménager** : Gros Électroménager, Petit Électroménager, Cuisine, Entretien, Climatisation

### Catégories Loisirs & Culture (15 sous-catégories)
- **Livres** : Romans, Livres Professionnels, BD & Comics, Livres pour Enfants, Magazines
- **Jouets** : Jouets d'éveil, Jeux de Construction, Jeux de Société, Poupées & Figurines, Jeux d'Extérieur
- **Sports** : Fitness & Musculation, Sports Collectifs, Sports de Raquette, Cyclisme, Sports Nautiques

### Catégories Mode & Beauté (15 sous-catégories)
- **Vêtements** : Vêtements Homme, Femme, Enfant, Sous-vêtements, Vêtements de Sport
- **Chaussures** : Chaussures Homme, Femme, Enfant, Baskets, Chaussures de Sport
- **Beauté** : Soins du Visage, Maquillage, Parfums, Soins du Corps, Soins Cheveux

### Autres Catégories (20 sous-catégories)
- **Alimentation** : Produits Frais, Épicerie Salée, Épicerie Sucrée, Boissons, Produits Bio
- **Automobile** : Pièces Détachées, Accessoires Auto, Entretien Auto, Équipements Électroniques, Pneus & Jantes
- **Jardin** : Plantes & Graines, Outils de Jardin, Mobilier de Jardin, Barbecue, Décoration Jardin
- **Bricolage** : Outillage à Main, Outillage Électroportatif, Quincaillerie, Peinture, Plomberie

## 🚀 Comment exécuter le script en PRODUCTION

### Méthode 1 : Via le Shell Render (⭐ Recommandée)

1. **Aller sur Render Dashboard**
   - URL : https://dashboard.render.com/
   - Se connecter avec vos identifiants

2. **Accéder au service backend**
   - Sélectionner le service `neoserv-backend` (ou le nom de votre service backend)

3. **Ouvrir le Shell**
   - Cliquer sur l'onglet "Shell" dans le menu du service
   - Un terminal s'ouvrira dans votre service

4. **Exécuter le script**
   ```bash
   npx ts-node scripts/create-subcategories-production.ts
   ```

5. **Attendre la fin**
   - Le script affichera sa progression
   - Vous verrez combien de sous-catégories ont été créées
   - Vous verrez combien de produits ont été réorganisés

### Méthode 2 : Pousser le code et exécuter via SSH

1. **Commiter et pousser les changements**
   ```bash
   cd ~/neoserv-platform
   git add backend/scripts/
   git commit -m "Add subcategories creation script"
   git push
   ```

2. **Attendre le déploiement sur Render** (automatique)

3. **Exécuter le script via le Shell Render** (voir Méthode 1, étapes 1-5)

## 🔍 Vérification après exécution

1. **Vérifier sur le site**
   - Aller sur https://neoserv.fr/shop
   - Les sous-catégories devraient apparaître dans le menu latéral
   - Chaque catégorie principale devrait montrer ses sous-catégories en dessous

2. **Vérifier que les produits sont bien assignés**
   - Cliquer sur une sous-catégorie
   - Les produits correspondants devraient s'afficher

## ⚠️ Important - Sécurité

- ✅ Le script ne supprime RIEN
- ✅ Les sous-catégories existantes sont ignorées (pas de duplication)
- ✅ Les produits sont automatiquement réassignés aux bonnes sous-catégories
- ✅ Les catégories parentes restent intactes

## 🔄 En cas de problème

Si quelque chose ne fonctionne pas comme prévu, vous pouvez :

1. **Voir les logs du script** pendant son exécution
2. **Supprimer les sous-catégories manuellement** via le Shell Render :
   ```bash
   npx prisma studio
   ```
   Puis supprimer les catégories avec `parentId != null`

3. **Me contacter** pour assistance

## 📝 Notes techniques

- Le script utilise **Prisma** pour interagir avec la base de données
- Il fonctionne sur **n'importe quelle base de données PostgreSQL**
- L'exécution prend environ **30 secondes à 2 minutes** selon le nombre de produits
- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans problème

## 🎯 Résultat attendu

Après l'exécution, sur https://neoserv.fr/shop vous devriez voir :

```
Catégories
  📦 Tous les produits

  📁 Informatique (125)
    ↳ Ordinateurs Portables (45)
    ↳ Ordinateurs de Bureau (30)
    ↳ Composants PC (25)
    ↳ Périphériques (15)
    ↳ Stockage (10)

  📁 Électronique (98)
    ↳ Smartphones (35)
    ↳ Tablettes (20)
    ...
```

---

**Date de création** : 30 Novembre 2025
**Créé par** : Claude Code
**Statut** : ✅ Prêt à déployer
