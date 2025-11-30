# Script de Création des Sous-Catégories

## Description

Ce script crée automatiquement des sous-catégories pour organiser les produits de manière plus granulaire dans la boutique NEOSERV.

## Sous-catégories créées

Le script crée 70+ sous-catégories réparties sous les catégories principales :

### Informatique & Technologie
- **Informatique**: Ordinateurs Portables, Ordinateurs de Bureau, Composants PC, Périphériques, Stockage
- **Électronique**: Smartphones, Tablettes, Audio, Photo & Vidéo, Accessoires Électroniques
- **Réseau**: Routeurs, Switches, Points d'accès WiFi, Câbles Réseau, Modems

### Maison & Bureau
- **Mobilier**: Bureaux, Chaises, Rangements, Tables, Canapés
- **Électroménager**: Gros Électroménager, Petit Électroménager, Cuisine, Entretien, Climatisation

### Loisirs & Culture
- **Livres**: Romans, Livres Professionnels, BD & Comics, Livres pour Enfants, Magazines
- **Jouets**: Jouets d'éveil, Jeux de Construction, Jeux de Société, Poupées & Figurines, Jeux d'Extérieur
- **Sports**: Fitness & Musculation, Sports Collectifs, Sports de Raquette, Cyclisme, Sports Nautiques

### Mode & Beauté
- **Vêtements**: Vêtements Homme, Femme, Enfant, Sous-vêtements, Vêtements de Sport
- **Chaussures**: Chaussures Homme, Femme, Enfant, Baskets, Chaussures de Sport
- **Beauté**: Soins du Visage, Maquillage, Parfums, Soins du Corps, Soins Cheveux

### Autres
- **Alimentation**: Produits Frais, Épicerie Salée, Épicerie Sucrée, Boissons, Produits Bio
- **Automobile**: Pièces Détachées, Accessoires Auto, Entretien Auto, Équipements Électroniques, Pneus & Jantes
- **Jardin**: Plantes & Graines, Outils de Jardin, Mobilier de Jardin, Barbecue, Décoration Jardin
- **Bricolage**: Outillage à Main, Outillage Électroportatif, Quincaillerie, Peinture, Plomberie

## Comment exécuter ce script en PRODUCTION (Render)

### Option 1: Via le Shell Render (Recommandé)

1. Aller sur [Render Dashboard](https://dashboard.render.com/)
2. Sélectionner le service `neoserv-backend`
3. Aller dans l'onglet "Shell"
4. Exécuter la commande :
   ```bash
   npx ts-node scripts/create-subcategories-production.ts
   ```

### Option 2: Via un déploiement

1. Commiter et pusher ce script :
   ```bash
   git add backend/scripts/create-subcategories-production.ts
   git commit -m "Add subcategories creation script"
   git push
   ```

2. Une fois déployé, accéder au shell Render et exécuter le script (voir Option 1)

## Sécurité

- ⚠️ **CE SCRIPT MODIFIE LA BASE DE DONNÉES DE PRODUCTION**
- Le script crée uniquement de nouvelles sous-catégories (ne supprime rien)
- Si une sous-catégorie existe déjà, elle est ignorée
- Les produits existants sont automatiquement réassignés aux sous-catégories appropriées basé sur des mots-clés

## Vérification après exécution

Une fois le script exécuté, vérifiez sur le site :
- https://neoserv.fr/shop
- Les catégories devraient maintenant afficher leurs sous-catégories
- Les produits devraient être répartis dans les sous-catégories

## Rollback (en cas de problème)

Si besoin de supprimer les sous-catégories créées :

```sql
-- Se connecter à la base de données Render
-- Supprimer toutes les sous-catégories (catégories avec parentId)
DELETE FROM categories WHERE "parentId" IS NOT NULL;

-- Réassigner les produits aux catégories parentes
-- (Les produits garderont automatiquement leur categoryId,
--  il faudra manuellement les réassigner si nécessaire)
```

## Support

Pour toute question ou problème, consulter la documentation technique dans le projet.
