# Guide de Test - Boutique en Ligne NEOSERV

## Démarrage Rapide

### 1. Démarrer le Backend
```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/backend
npm run dev
```
**URL**: http://localhost:4000

### 2. Démarrer le Frontend
```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/frontend
npm run dev
```
**URL**: http://localhost:3000

### 3. Accéder à la Boutique
**URL Boutique**: http://localhost:3000/shop

---

## Tests par Fonctionnalité

### ✅ 1. Header Professionnel

**Actions à tester**:
1. Scroller la page vers le bas
   - ✓ Header doit devenir blanc avec ombre
   - ✓ Barre supérieure bleue doit disparaître

2. Utiliser la barre de recherche
   - ✓ Taper "produit" et valider
   - ✓ Résultats filtrés doivent s'afficher

3. Tester menu mobile (réduire navigateur < 768px)
   - ✓ Hamburger menu doit apparaître
   - ✓ Click ouvre le menu
   - ✓ Liens fonctionnent
   - ✓ Compteur panier visible

4. Vérifier compteur panier
   - ✓ Ajouter produit au panier
   - ✓ Badge rouge avec nombre doit apparaître

**URL**: http://localhost:3000/shop

---

### ✅ 2. Footer Complet

**Actions à tester**:
1. Scroller tout en bas de la page
   - ✓ 4 colonnes visible desktop
   - ✓ 1 colonne sur mobile
   - ✓ Liens réseaux sociaux présents

2. Vérifier trust badges
   - ✓ Logos paiement (CB, PayPal, Virement)
   - ✓ Logos transporteurs (Chronopost, etc.)
   - ✓ 3 badges de confiance

**URL**: http://localhost:3000/shop (scroll en bas)

---

### ✅ 3. Galerie d'Images Produit

**Actions à tester**:
1. Cliquer sur un produit
   - ✓ Page produit s'ouvre
   - ✓ Grande image principale visible

2. Cliquer sur miniatures
   - ✓ Image principale change
   - ✓ Bordure bleue sur miniature sélectionnée
   - ✓ Transition fluide

3. Hover sur image principale
   - ✓ Zoom léger au survol

**URL**: http://localhost:3000/shop/products/[ID_PRODUIT]

---

### ✅ 4. Paiement Stripe

**Prérequis**: Avoir des produits dans le panier

**Actions à tester**:
1. Aller au panier et cliquer "Passer la commande"
   ```
   http://localhost:3000/shop/cart
   → "Passer la commande"
   ```

2. Remplir formulaire de livraison
   - Prénom, Nom, Email, Adresse, Ville, CP

3. Sélectionner "Carte Bancaire"
   - ✓ Champs Stripe doivent apparaître (iframe)
   - ✓ 3 champs: Numéro, Date, CVV

4. Tester paiement succès
   ```
   Carte: 4242 4242 4242 4242
   Date: 12/25
   CVV: 123
   ```
   - ✓ Loader "Paiement en cours..."
   - ✓ Redirection vers /shop/success
   - ✓ Message de confirmation
   - ✓ Panier vidé

5. Tester paiement échec
   ```
   Carte: 4000 0000 0000 0002
   Date: 12/25
   CVV: 123
   ```
   - ✓ Message d'erreur rouge
   - ✓ Pas de redirection
   - ✓ Possibilité de réessayer

**URL**: http://localhost:3000/shop/checkout

---

### ✅ 5. Système d'Avis Produits

#### A. Création d'Avis (Public)

**Actions à tester**:
1. Aller sur une page produit
   ```
   http://localhost:3000/shop/products/[ID_PRODUIT]
   → Scroller en bas
   ```

2. Cliquer "Écrire un avis"
   - ✓ Formulaire s'ouvre
   - ✓ Étoiles interactives

3. Remplir le formulaire
   ```
   Note: 5 étoiles (cliquer)
   Nom: Jean Dupont
   Email: jean@example.com
   Titre: Excellent produit
   Commentaire: Très satisfait de mon achat, qualité exceptionnelle
   ```

4. Soumettre
   - ✓ Message succès "Avis soumis, en attente de modération"
   - ✓ Formulaire se ferme
   - ✓ Avis PAS ENCORE visible (modération)

#### B. Modération d'Avis (Admin)

**Actions à tester**:
1. Se connecter en admin
   ```bash
   # Obtenir token admin
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@neoserv.com",
       "password": "Admin123!"
     }'
   ```
   **Copier le token retourné**

2. Voir tous les avis
   ```bash
   curl -H "Authorization: Bearer VOTRE_TOKEN" \
     http://localhost:4000/api/reviews
   ```
   - ✓ Liste de tous les avis (même non approuvés)

3. Approuver et publier un avis
   ```bash
   curl -X PATCH http://localhost:4000/api/reviews/[REVIEW_ID]/status \
     -H "Authorization: Bearer VOTRE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "isApproved": true,
       "isPublished": true
     }'
   ```

4. Vérifier publication
   - ✓ Retourner sur page produit
   - ✓ Avis maintenant visible publiquement

#### C. Statistiques

**Actions à tester**:
1. Voir statistiques globales
   ```bash
   curl -H "Authorization: Bearer VOTRE_TOKEN" \
     http://localhost:4000/api/reviews/statistics
   ```
   - ✓ Total avis
   - ✓ Moyenne notes
   - ✓ Avis en attente

2. Vérifier affichage frontend
   - ✓ Moyenne en gros (ex: 4.5)
   - ✓ Barres distribution par étoiles
   - ✓ Total avis affiché

---

### ✅ 6. Pagination

**Prérequis**: Au moins 13 produits dans la DB

**Actions à tester**:
1. Aller sur la boutique
   ```
   http://localhost:3000/shop
   ```
   - ✓ Max 12 produits affichés
   - ✓ Boutons pagination en bas si > 12 produits
   - ✓ Texte "Affichage 1-12 sur X produits"

2. Cliquer "Suivant" ou page 2
   - ✓ Nouveaux produits chargés
   - ✓ Scroll automatique en haut
   - ✓ Page 2 mise en évidence (bleue)
   - ✓ "Précédent" devient actif

3. Aller à dernière page
   - ✓ "Suivant" désactivé (grisé)
   - ✓ Numéro page active correct

4. Changer de catégorie
   - ✓ Pagination reset à page 1
   - ✓ Total pages recalculé

5. Faire une recherche
   - ✓ Pagination reset à page 1
   - ✓ Seulement résultats recherche paginés

**URL**: http://localhost:3000/shop

---

### ✅ 7. Responsive Mobile

#### Test Desktop → Mobile

**Actions à tester**:
1. Ouvrir DevTools (F12)
2. Activer "Device Toolbar" (Ctrl+Shift+M)
3. Sélectionner "iPhone 12 Pro" ou "Responsive"

#### A. Page Boutique Mobile

**URL**: http://localhost:3000/shop

**Vérifications**:
- ✓ Bouton "Filtres et Catégories" visible en haut
- ✓ Sidebar catégories cachée par défaut
- ✓ Grid produits: 1 colonne

**Actions**:
1. Cliquer "Filtres et Catégories"
   - ✓ Overlay noir semi-transparent
   - ✓ Sidebar s'ouvre depuis gauche
   - ✓ Bouton × visible en haut à droite

2. Sélectionner une catégorie
   - ✓ Sidebar se ferme automatiquement
   - ✓ Produits filtrés

3. Cliquer sur overlay noir
   - ✓ Sidebar se ferme

#### B. Panier Mobile

**URL**: http://localhost:3000/shop/cart

**Vérifications**:
- ✓ Items empilés verticalement
- ✓ Image produit plus petite (20×20)
- ✓ Tous les textes lisibles
- ✓ Boutons +/- accessibles
- ✓ Récapitulatif en dessous (pas sticky)

#### C. Pagination Mobile

**URL**: http://localhost:3000/shop

**Vérifications**:
- ✓ Boutons empilés si trop petits
- ✓ Texte abrégé (← / → au lieu de "Précédent/Suivant")
- ✓ Numéros pages cliquables
- ✓ Pas de débordement horizontal

#### D. Header Mobile

**Vérifications**:
- ✓ Hamburger menu visible
- ✓ Search bar en dessous du logo
- ✓ Click hamburger ouvre menu
- ✓ Navigation dans menu mobile
- ✓ Compteur panier visible

---

## Checklist Complète

### Avant de Tester
- [ ] Backend démarré sur port 4000
- [ ] Frontend démarré sur port 3000
- [ ] Base de données avec produits (min 13)
- [ ] Stripe keys configurées (.env)
- [ ] Migration Reviews appliquée (`npx prisma db push`)

### Tests Fonctionnels
- [ ] Header scroll animation
- [ ] Menu mobile ouvre/ferme
- [ ] Search bar filtre produits
- [ ] Footer affiché correctement
- [ ] Galerie images change image
- [ ] Miniatures avec bordure active
- [ ] Pagination change page
- [ ] Scroll automatique pagination
- [ ] Filtres reset pagination
- [ ] Création avis fonctionne
- [ ] Avis modération obligatoire
- [ ] Statistiques avis correctes
- [ ] Paiement Stripe succès
- [ ] Paiement Stripe échec géré
- [ ] Redirection après paiement

### Tests Responsive Mobile
- [ ] Sidebar mobile ouvrable
- [ ] Grid 1 colonne mobile
- [ ] Panier items empilés
- [ ] Pagination mobile lisible
- [ ] Header mobile avec hamburger
- [ ] Footer 1 colonne mobile
- [ ] Textes lisibles (pas trop petits)
- [ ] Touch targets >= 44px
- [ ] Pas de scroll horizontal

---

## URLs de Test Rapides

| Fonctionnalité | URL |
|---------------|-----|
| Boutique principale | http://localhost:3000/shop |
| Page produit | http://localhost:3000/shop/products/[ID] |
| Panier | http://localhost:3000/shop/cart |
| Checkout | http://localhost:3000/shop/checkout |
| Succès paiement | http://localhost:3000/shop/success |
| API Health | http://localhost:4000/health |
| API Produits | http://localhost:4000/api/shop/products |
| API Catégories | http://localhost:4000/api/shop/categories |

---

## Commandes Utiles

### Créer Token Admin
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@neoserv.com","password":"Admin123!"}'
```

### Lister Avis (Admin)
```bash
TOKEN="votre_token_ici"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/reviews
```

### Voir Avis Produit (Public)
```bash
curl http://localhost:4000/api/reviews/product/[PRODUCT_ID]
```

### Créer Avis Test
```bash
curl -X POST http://localhost:4000/api/reviews/product/[PRODUCT_ID] \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "title": "Test avis",
    "comment": "Ceci est un commentaire de test pour valider le système",
    "customerName": "Test User",
    "customerEmail": "test@example.com"
  }'
```

### Approuver Avis
```bash
TOKEN="votre_token_ici"
curl -X PATCH http://localhost:4000/api/reviews/[REVIEW_ID]/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isApproved":true,"isPublished":true}'
```

---

## Résolution Problèmes Courants

### Stripe Elements ne s'affiche pas
```bash
# Vérifier installation
cd frontend
npm list @stripe/stripe-js @stripe/react-stripe-js

# Réinstaller si besoin
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Reviews n'apparaissent pas
```bash
# Vérifier migration
cd backend
npx prisma db push

# Vérifier table existe
npx prisma studio
# → Chercher table "reviews"
```

### Pagination ne fonctionne pas
```bash
# Vérifier que la BDD a assez de produits
# Il faut > 12 produits pour voir pagination

# Tester API directement
curl "http://localhost:4000/api/shop/products?page=1&limit=12"
```

### Sidebar mobile ne s'ouvre pas
```bash
# Vérifier console navigateur (F12)
# Chercher erreurs JavaScript

# Rafraîchir cache
Ctrl+Shift+R (hard reload)
```

---

## Critères de Validation

### ✅ Toutes les fonctionnalités OK si:
1. Header change au scroll
2. Menu mobile fonctionnel
3. Galerie images change d'image
4. Pagination charge nouvelles pages
5. Avis peuvent être créés
6. Avis nécessitent modération
7. Paiement Stripe fonctionne
8. Mobile responsive (pas de débordement)
9. Footer complet affiché
10. Aucune erreur console

---

**Date**: 21 novembre 2024
**Version**: 2.0.0
**Status**: ✅ Prêt pour tests
