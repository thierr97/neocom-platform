# Guide Complet d'Utilisation - Plateforme NEOSERV

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Guide Client - Boutique en ligne](#guide-client---boutique-en-ligne)
3. [Guide Interne - Dashboard Administrateur](#guide-interne---dashboard-administrateur)
4. [Guide Commercial - Application Mobile](#guide-commercial---application-mobile)

---

## Vue d'ensemble

### URLs de la plateforme

**Frontend (Client):**
- Production: https://neoserv.fr
- Page d'accueil: `/`
- Boutique: `/shop`
- Panier: `/cart`

**Backend (API):**
- Production: https://neocom-backend.onrender.com/api
- Health Check: https://neocom-backend.onrender.com/health

**Dashboard Administrateur:**
- URL: https://neoserv.fr/dashboard
- Nécessite authentification avec compte admin

---

## Guide Client - Boutique en ligne

### 1. Page d'accueil (/)

**Description:**
La page d'accueil présente votre boutique avec une mise en page moderne et responsive.

**Éléments visibles:**
- **Header (en haut):**
  - Logo NEOSERV (à gauche)
  - Menu de navigation: Accueil | Boutique | Contact
  - Icône panier avec badge du nombre d'articles (à droite)
  - Bouton "Se connecter" ou profil utilisateur si connecté

- **Hero Section (bannière principale):**
  - Grande image d'accueil
  - Titre principal: "Bienvenue sur NEOSERV"
  - Sous-titre décrivant vos services
  - Bouton "Découvrir la boutique" → redirige vers `/shop`

- **Section Catégories populaires:**
  - Grille de cartes avec les catégories principales
  - Images de catégories
  - Nombre de produits par catégorie
  - Clic sur une carte → redirige vers `/shop?category={id}`

- **Footer (pied de page):**
  - Informations de contact
  - Liens utiles
  - Réseaux sociaux

**Actions possibles:**
- Cliquer sur "Boutique" dans le menu → Accéder au catalogue complet
- Cliquer sur une catégorie → Voir les produits de cette catégorie
- Cliquer sur l'icône panier → Voir le panier

---

### 2. Boutique (/shop)

**Description:**
Page principale du catalogue avec tous les produits disponibles.

**Éléments visibles:**

**A. Menu Catégories (à gauche ou en dropdown mobile):**
```
📁 Toutes les catégories
  📦 ALIMENTAIRE
  📦 ANIMALERIE
  📦 ART DE LA TABLE
  📦 ACCESSOIRES TÉLÉPHONIES
     └─ 🔹 Coques et Protections
     └─ 🔹 Chargeurs et Câbles
     └─ 🔹 Écouteurs et Casques
  📦 BRICOLAGE
     └─ 🔹 Outils à Main
     └─ 🔹 Quincaillerie
     └─ 🔹 Électricité et Plomberie
  📦 BEAUTÉ ET PARFUMS
     └─ 🔹 Maquillage
     └─ 🔹 Parfums
     └─ 🔹 Soins du Visage
     └─ 🔹 Soins du Corps
  📦 CUISINE
  📦 DÉCORATION
  📦 HIGH TECH
  📦 JARDINAGE
  📦 MODE
  📦 SPORT
  ... (et plus de 40 autres catégories)
```

**B. Barre de recherche et filtres (en haut):**
- 🔍 Champ de recherche: "Rechercher un produit..."
- Filtre par prix: Min €__ - Max €__
- Tri: "Trier par: Prix croissant / Prix décroissant / Nouveautés / Popularité"
- Bouton "Réinitialiser les filtres"

**C. Grille de produits (au centre):**

Chaque carte produit affiche:
```
┌─────────────────────────┐
│                         │
│   [Image du produit]    │
│                         │
├─────────────────────────┤
│ Nom du produit          │
│ Courte description      │
│                         │
│ Prix: 15,99 €          │
│ Stock: ● En stock       │
│                         │
│ [+ Ajouter au panier]   │
└─────────────────────────┘
```

**D. Pagination (en bas):**
- ← Précédent | 1 2 3 ... 10 | Suivant →
- Affichage: "Produits 1-20 sur 534"

**Actions possibles:**

1. **Naviguer par catégories:**
   - Cliquer sur une catégorie principale → Filtre les produits
   - Cliquer sur une sous-catégorie → Filtre encore plus précisément
   - Cliquer sur "Toutes les catégories" → Réinitialise le filtre

2. **Rechercher un produit:**
   - Taper dans la barre de recherche
   - Les résultats s'affichent en temps réel

3. **Filtrer par prix:**
   - Entrer un prix minimum et/ou maximum
   - Cliquer sur "Appliquer" → Seuls les produits dans cette fourchette s'affichent

4. **Trier les résultats:**
   - Sélectionner un tri dans le menu déroulant
   - Les produits se réorganisent automatiquement

5. **Ajouter au panier:**
   - Cliquer sur "Ajouter au panier" sur une carte produit
   - Une notification s'affiche: "✓ Produit ajouté au panier"
   - Le badge du panier dans le header s'incrémente

**Responsive Mobile:**
- Le menu des catégories devient un menu hamburger (☰)
- Les produits s'affichent en 1 colonne au lieu de 3-4
- Les filtres sont accessibles via un bouton "Filtres" en haut

---

### 3. Panier (/cart)

**Description:**
Page récapitulative du panier avec possibilité de passer commande.

**Layout de la page:**

```
┌────────────────────────────────────────────────────────────┐
│                    MON PANIER (3 articles)                 │
├────────────────────────────────────────┬───────────────────┤
│                                        │                   │
│  LISTE DES PRODUITS                    │  RÉCAPITULATIF   │
│                                        │                   │
│  ┌──────────────────────────────────┐ │  Sous-total:      │
│  │ [Image] Produit 1                │ │    45,00 €       │
│  │ Prix unitaire: 15,00 €           │ │                   │
│  │ Quantité: [1] [▲] [▼]           │ │  TVA (20%):       │
│  │ Sous-total: 15,00 €             │ │    9,00 €        │
│  │                        [🗑 Retirer]│ │                   │
│  └──────────────────────────────────┘ │  Total TTC:       │
│                                        │    54,00 €       │
│  ┌──────────────────────────────────┐ │                   │
│  │ [Image] Produit 2                │ │  [Commander]      │
│  │ Prix unitaire: 20,00 €           │ │                   │
│  │ Quantité: [1] [▲] [▼]           │ │  [Vider panier]   │
│  │ Sous-total: 20,00 €             │ │                   │
│  │                        [🗑 Retirer]│ │                   │
│  └──────────────────────────────────┘ │                   │
│                                        │                   │
│  ┌──────────────────────────────────┐ │                   │
│  │ [Image] Produit 3                │ │                   │
│  │ Prix unitaire: 10,00 €           │ │                   │
│  │ Quantité: [1] [▲] [▼]           │ │                   │
│  │ Sous-total: 10,00 €             │ │                   │
│  │                        [🗑 Retirer]│ │                   │
│  └──────────────────────────────────┘ │                   │
│                                        │                   │
│  [← Continuer mes achats]             │                   │
│                                        │                   │
└────────────────────────────────────────┴───────────────────┘
```

**Actions possibles:**

1. **Modifier la quantité:**
   - Cliquer sur ▲ pour augmenter
   - Cliquer sur ▼ pour diminuer
   - Taper directement un nombre
   - Le sous-total se met à jour automatiquement
   - Le total général se recalcule

2. **Retirer un produit:**
   - Cliquer sur l'icône 🗑 (corbeille)
   - Le produit disparaît du panier
   - Les totaux se recalculent

3. **Vider le panier:**
   - Cliquer sur "Vider le panier"
   - Confirmation: "Êtes-vous sûr de vouloir vider votre panier ?"
   - Si Oui → Tous les produits sont supprimés

4. **Commander:**
   - Cliquer sur le bouton "Commander"
   - Un modal (fenêtre pop-up) s'ouvre pour créer le compte client

---

### 4. Modal de création de compte client

**Description:**
Lorsque vous cliquez sur "Commander", un formulaire s'affiche pour créer votre compte client.

**Formulaire affiché:**

```
┌──────────────────────────────────────────────────┐
│         CRÉER VOTRE COMPTE CLIENT                │
├──────────────────────────────────────────────────┤
│                                                  │
│  Type de client:                                 │
│  ⚪ Particulier     ⚫ Entreprise               │
│                                                  │
│  ─────── Informations personnelles ──────────   │
│                                                  │
│  Nom:           [_________________________]      │
│  Prénom:        [_________________________]      │
│  Email:         [_________________________]      │
│  Téléphone:     [_________________________]      │
│                                                  │
│  ─────── Adresse ─────────────────────────       │
│                                                  │
│  Adresse:       [_________________________]      │
│  Ville:         [_________________________]      │
│  Code postal:   [_________________________]      │
│  Pays:          [France ▼]                       │
│                                                  │
│  [📍 Localiser sur la carte]                     │
│                                                  │
│  Si entreprise uniquement:                       │
│  ─────── Informations entreprise ────────        │
│                                                  │
│  Nom société:   [_________________________]      │
│  SIRET:         [_________________________]      │
│                                                  │
│  ─────── Paiement ────────────────────────       │
│                                                  │
│  Mode de paiement:                               │
│  ⚫ Stripe (CB)    ⚪ Sur place               │
│                                                  │
│  [Annuler]              [Valider la commande]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Champs obligatoires:**
- ✓ Nom
- ✓ Email
- ✓ Téléphone
- ✓ Adresse complète

**Champs optionnels:**
- Prénom
- SIRET (obligatoire si entreprise)

**Fonctionnalité "Localiser sur la carte":**

1. Remplir l'adresse complète (adresse, ville, code postal)
2. Cliquer sur "📍 Localiser sur la carte"
3. Une carte interactive s'affiche en dessous avec:
   - Un marqueur 📍 sur votre adresse
   - Popup affichant l'adresse et les coordonnées GPS
   - Zoom sur la localisation

**Validation et paiement:**

**Si "Stripe (CB)" est sélectionné:**
1. Cliquer sur "Valider la commande"
2. Une page de paiement Stripe s'ouvre
3. Entrer les informations de carte bancaire
4. Stripe valide le paiement
5. Redirection vers page de confirmation
6. Email de confirmation envoyé

**Si "Sur place" est sélectionné:**
1. Cliquer sur "Valider la commande"
2. La commande est créée avec statut "En attente"
3. Redirection vers page de confirmation
4. Message: "Votre commande a été enregistrée. Vous pourrez payer en magasin."
5. Email de confirmation envoyé

---

### 5. Page de confirmation de commande

**Layout:**

```
┌─────────────────────────────────────────┐
│    ✓ COMMANDE CONFIRMÉE                │
│                                         │
│  Merci pour votre commande !            │
│                                         │
│  Numéro de commande: #CMD-2025-0042     │
│  Date: 10/12/2025 à 21:30              │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  Récapitulatif de la commande:          │
│                                         │
│  • Produit 1 x1        15,00 €         │
│  • Produit 2 x1        20,00 €         │
│  • Produit 3 x1        10,00 €         │
│                                         │
│  Sous-total:           45,00 €         │
│  TVA (20%):             9,00 €         │
│  ─────────────────────────────          │
│  Total TTC:            54,00 €         │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  Informations client:                   │
│  Jean Dupont                            │
│  jean.dupont@email.com                  │
│  +33 6 12 34 56 78                     │
│  123 Rue de la Paix, 75001 Paris       │
│                                         │
│  Mode de paiement: Stripe              │
│  Statut: ✓ Payée                       │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  Un email de confirmation a été envoyé  │
│  à jean.dupont@email.com               │
│                                         │
│  [Retour à la boutique]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Guide Interne - Dashboard Administrateur

### Accès au Dashboard

**URL:** https://neoserv.fr/dashboard

**Connexion:**

```
┌────────────────────────────────────┐
│      NEOSERV - Connexion          │
├────────────────────────────────────┤
│                                    │
│  Email:    [__________________]    │
│  Mot de passe: [______________]    │
│                                    │
│  ☐ Se souvenir de moi             │
│                                    │
│  [Se connecter]                    │
│                                    │
│  Mot de passe oublié ?            │
│                                    │
└────────────────────────────────────┘
```

**Comptes par défaut:**
- **Admin:** admin@neoserv.com / Admin123!
- **Commercial:** commercial@neoserv.com / (mot de passe défini lors de la création)

---

### Layout du Dashboard

Une fois connecté, vous accédez au dashboard avec ce layout:

```
┌──────────────────────────────────────────────────────────────────┐
│  NEOSERV                                    👤 Admin  [Déconnexion]│
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                      │
│  SIDEBAR   │  CONTENU PRINCIPAL                                  │
│            │                                                      │
│  📊 Dashboard                                                     │
│  🛒 Boutique │                                                     │
│  👥 Clients  │                                                     │
│  📦 Commandes│                                                     │
│  💰 Devis    │                                                     │
│  📄 Factures │                                                     │
│  📝 Avoirs   │                                                     │
│  🏢 Fournisseurs                                                  │
│  📊 Stats    │                                                     │
│  ⚙️ Paramètres                                                    │
│  👨‍💼 Commerciaux                                                  │
│  🗺️ Suivi GPS │                                                    │
│  🤖 AI Manager                                                    │
│            │                                                      │
│            │                                                      │
└────────────┴─────────────────────────────────────────────────────┘
```

**Responsive Mobile:**
- La sidebar devient un menu hamburger (☰) en haut à gauche
- Elle s'ouvre en overlay (superposition) par-dessus le contenu
- Un fond semi-transparent permet de fermer le menu en cliquant dessus

---

### 1. Page Dashboard (Vue d'ensemble)

**URL:** `/dashboard`

**Contenu de la page:**

```
┌─────────────────────────────────────────────────────────────────┐
│  TABLEAU DE BORD                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │    💰    │  │    📦    │  │    👥    │  │    📄    │      │
│  │ CA du mois│  │ Commandes│  │ Clients  │  │  Devis   │      │
│  │  45 780€ │  │    127   │  │    89    │  │    34    │      │
│  │  +12% ↗  │  │   +8% ↗  │  │  +15% ↗  │  │   -2% ↘  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  ───────────────────────────────────────────────────────        │
│                                                                 │
│  GRAPHIQUE DU CHIFFRE D'AFFAIRES (6 derniers mois)             │
│                                                                 │
│  €                                                              │
│  50k │                              ●────●                      │
│      │                         ●────                            │
│  40k │                    ●────                                 │
│      │               ●────                                      │
│  30k │          ●────                                           │
│      │     ●────                                                │
│  20k │●────                                                     │
│      │                                                          │
│   0  └───┬────┬────┬────┬────┬────┬────                       │
│         Jul  Août Sept Oct  Nov  Déc                           │
│                                                                 │
│  ───────────────────────────────────────────────────────        │
│                                                                 │
│  COMMANDES RÉCENTES                                             │
│                                                                 │
│  ┌─────┬───────────────┬────────┬──────────┬─────────────┐    │
│  │ N°  │ Client        │ Montant│  Statut  │    Date     │    │
│  ├─────┼───────────────┼────────┼──────────┼─────────────┤    │
│  │#042 │ Jean Dupont   │ 54,00€ │🟢 Payée  │ 10/12/2025  │    │
│  │#041 │ Marie Martin  │ 89,50€ │🟡 En cours│ 10/12/2025  │    │
│  │#040 │ Société ABC   │234,00€ │🟢 Payée  │ 09/12/2025  │    │
│  │#039 │ Pierre Durand │ 45,00€ │🔴 Annulée│ 09/12/2025  │    │
│  └─────┴───────────────┴────────┴──────────┴─────────────┘    │
│                                                                 │
│  [Voir toutes les commandes →]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Informations affichées:**
- Cartes KPI (indicateurs clés) avec évolution
- Graphique d'évolution du CA
- Liste des dernières commandes
- Alertes si nécessaire (stock bas, devis expirés, etc.)

---

### 2. Gestion de la Boutique

**URL:** `/dashboard/shop`

**Sous-menus:**
- Produits
- Catégories
- Stock

#### 2.1 Liste des produits

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES PRODUITS                       [+ Nouveau produit] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Rechercher: [_________________]  Catégorie: [Toutes ▼]     │
│                                                                 │
│  ┌────┬──────────┬──────────────┬─────────┬────────┬─────────┐│
│  │    │ Image    │ Nom          │ Prix    │ Stock  │ Actions ││
│  ├────┼──────────┼──────────────┼─────────┼────────┼─────────┤│
│  │ ☐  │ [img]   │ iPhone 15 Pro│ 1199€   │ 5 ✓   │ ✏️ 🗑️   ││
│  │ ☐  │ [img]   │ Samsung S24  │ 899€    │ 12 ✓  │ ✏️ 🗑️   ││
│  │ ☐  │ [img]   │ MacBook Pro  │ 2499€   │ 0 ⚠️  │ ✏️ 🗑️   ││
│  │ ☐  │ [img]   │ AirPods Pro  │ 249€    │ 25 ✓  │ ✏️ 🗑️   ││
│  └────┴──────────┴──────────────┴─────────┴────────┴─────────┘│
│                                                                 │
│  Sélection: [Actions groupées ▼]                               │
│                                                                 │
│  ← Préc | 1 2 3 ... 45 | Suiv →                  534 produits  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Actions possibles:**

1. **Ajouter un produit:**
   - Cliquer sur "+ Nouveau produit"
   - Remplir le formulaire (voir section suivante)

2. **Modifier un produit:**
   - Cliquer sur l'icône ✏️ (crayon)
   - Le formulaire d'édition s'ouvre avec les données pré-remplies

3. **Supprimer un produit:**
   - Cliquer sur l'icône 🗑️ (corbeille)
   - Confirmation: "Êtes-vous sûr ?"
   - Si Oui → Produit supprimé

4. **Actions groupées:**
   - Cocher plusieurs produits
   - Sélectionner une action dans le menu déroulant
   - Options: Supprimer / Changer catégorie / Modifier prix / Activer-Désactiver

5. **Rechercher/Filtrer:**
   - Taper dans la barre de recherche → Filtre en temps réel
   - Sélectionner une catégorie → Affiche uniquement cette catégorie

#### 2.2 Formulaire d'ajout/modification de produit

```
┌─────────────────────────────────────────────────────────────────┐
│  NOUVEAU PRODUIT                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ──────── Informations générales ────────                       │
│                                                                 │
│  Nom du produit: *                                              │
│  [_________________________________________________]            │
│                                                                 │
│  Description courte:                                            │
│  [_________________________________________________]            │
│                                                                 │
│  Description détaillée:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Éditeur de texte riche avec formatage]                │   │
│  │                                                         │   │
│  │ Gras | Italique | Liste | Lien | Image                │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ──────── Catégorisation ────────                              │
│                                                                 │
│  Catégorie principale: *                                        │
│  [Sélectionner... ▼]                                           │
│                                                                 │
│  Sous-catégorie:                                               │
│  [Sélectionner... ▼]                                           │
│                                                                 │
│  ──────── Prix et stock ────────                               │
│                                                                 │
│  Prix HT: *          Prix TTC: *        TVA: *                 │
│  [________] €        [________] €       [20% ▼]               │
│                                                                 │
│  Quantité en stock: * Seuil d'alerte:                          │
│  [________]          [________]                                │
│                                                                 │
│  ──────── Images ────────                                      │
│                                                                 │
│  Image principale: *                                            │
│  ┌──────────────────────┐                                      │
│  │                      │                                      │
│  │  [📷 Télécharger]   │                                      │
│  │                      │                                      │
│  └──────────────────────┘                                      │
│                                                                 │
│  Galerie (images supplémentaires):                             │
│  [+ Ajouter des images]                                        │
│                                                                 │
│  ──────── Options ────────                                     │
│                                                                 │
│  ☑ Produit visible sur la boutique                             │
│  ☐ Produit en promotion                                        │
│  ☐ Nouveau produit (badge "Nouveau")                           │
│  ☐ Produit phare (mis en avant sur l'accueil)                 │
│                                                                 │
│  ───────────────────────────────────────────────────            │
│                                                                 │
│  [Annuler]                          [Enregistrer le produit]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Champs obligatoires (*):**
- Nom du produit
- Catégorie principale
- Prix HT ou TTC (l'autre se calcule automatiquement)
- TVA
- Quantité en stock
- Image principale

**Upload d'images:**
- Cliquer sur "📷 Télécharger"
- Sélectionner une image depuis votre ordinateur
- Formats acceptés: JPG, PNG, WEBP
- Taille max: 5 MB
- L'image est uploadée sur Cloudinary automatiquement
- Une miniature s'affiche une fois l'upload terminé

#### 2.3 Gestion des catégories

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES CATÉGORIES                  [+ Nouvelle catégorie] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Vue arborescente:                                              │
│                                                                 │
│  📁 ALIMENTAIRE (75 produits)                           ✏️ 🗑️   │
│    ├─ 📂 Boissons (46)                                  ✏️ 🗑️   │
│    ├─ 📂 Épicerie Salée (15)                           ✏️ 🗑️   │
│    └─ 📂 Snacks et Confiseries (0)                     ✏️ 🗑️   │
│                                                                 │
│  📁 ACCESSOIRES TÉLÉPHONIES (116 produits)              ✏️ 🗑️   │
│    ├─ 📂 Coques et Protections (8)                     ✏️ 🗑️   │
│    ├─ 📂 Chargeurs et Câbles (71)                      ✏️ 🗑️   │
│    ├─ 📂 Écouteurs et Casques (30)                     ✏️ 🗑️   │
│    └─ 📂 Supports et Accessoires (5)                   ✏️ 🗑️   │
│                                                                 │
│  📁 BEAUTÉ ET PARFUMS (784 produits)                    ✏️ 🗑️   │
│    ├─ 📂 Maquillage (53)                               ✏️ 🗑️   │
│    ├─ 📂 Parfums (11)                                  ✏️ 🗑️   │
│    ├─ 📂 Soins du Visage (6)                           ✏️ 🗑️   │
│    └─ 📂 Soins du Corps (25)                           ✏️ 🗑️   │
│                                                                 │
│  📁 BRICOLAGE (795 produits)                            ✏️ 🗑️   │
│  📁 CUISINE (1017 produits)                             ✏️ 🗑️   │
│  📁 DÉCORATION (538 produits)                           ✏️ 🗑️   │
│  ... (et 35+ autres catégories)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Actions possibles:**

1. **Créer une catégorie:**
   - Cliquer sur "+ Nouvelle catégorie"
   - Remplir le formulaire:
     - Nom *
     - Slug (URL-friendly, généré auto)
     - Description
     - Image
     - Catégorie parente (si sous-catégorie)
     - ☑ Visible sur la boutique

2. **Modifier une catégorie:**
   - Cliquer sur ✏️
   - Modifier les informations
   - Enregistrer

3. **Supprimer une catégorie:**
   - Cliquer sur 🗑️
   - ⚠️ ATTENTION: Si la catégorie contient des produits, vous devez d'abord les déplacer ou les supprimer

4. **Réorganiser l'arborescence:**
   - Glisser-déposer une catégorie sur une autre pour la rendre sous-catégorie
   - Glisser vers la racine pour la rendre catégorie principale

---

### 3. Gestion des Clients

**URL:** `/dashboard/clients`

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES CLIENTS                           [+ Nouveau client]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Rechercher: [_________________]  Type: [Tous ▼]            │
│                                                                 │
│  ┌─────┬───────────────┬──────────────────┬──────────┬────────┐│
│  │ ID  │ Nom           │ Email/Tel        │ Type     │ Actions││
│  ├─────┼───────────────┼──────────────────┼──────────┼────────┤│
│  │#089 │ Jean Dupont   │ jean@email.com   │👤 Particulier│ 👁️ ✏️││
│  │     │               │ 06 12 34 56 78   │          │        ││
│  │#088 │ Marie Martin  │ marie@email.com  │👤 Particulier│ 👁️ ✏️││
│  │     │               │ 06 98 76 54 32   │          │        ││
│  │#087 │ Société ABC   │ contact@abc.fr   │🏢 Entreprise │ 👁️ ✏️││
│  │     │ SIRET: 123... │ 01 23 45 67 89   │          │        ││
│  └─────┴───────────────┴──────────────────┴──────────┴────────┘│
│                                                                 │
│  ← Préc | 1 2 3 ... 9 | Suiv →                     89 clients  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Actions:**

1. **Voir le détail d'un client:**
   - Cliquer sur l'icône 👁️ (œil)
   - Affiche toutes les informations + historique des commandes

2. **Modifier un client:**
   - Cliquer sur ✏️
   - Formulaire d'édition (similaire au formulaire de création depuis le panier)

3. **Filtrer:**
   - Par type: Particulier / Entreprise
   - Par recherche: Nom, email, téléphone, SIRET

#### 3.1 Fiche détaillée d'un client

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT #089 - Jean Dupont                              [Modifier]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────┬──────────────────────────┐ │
│  │ INFORMATIONS                   │ CARTE                    │ │
│  │                                │                          │ │
│  │ 👤 Particulier                 │ ┌──────────────────────┐│ │
│  │                                │ │                      ││ │
│  │ Jean Dupont                    │ │   [Carte Leaflet]    ││ │
│  │ jean@email.com                 │ │   📍 Marqueur sur    ││ │
│  │ +33 6 12 34 56 78             │ │      l'adresse       ││ │
│  │                                │ │                      ││ │
│  │ 123 Rue de la Paix             │ └──────────────────────┘│ │
│  │ 75001 Paris, France            │                          │ │
│  │                                │ GPS:                     │ │
│  │ Créé le: 01/12/2025           │ 48.8566, 2.3522         │ │
│  │                                │                          │ │
│  └────────────────────────────────┴──────────────────────────┘ │
│                                                                 │
│  ─────────────────────────────────────────────────────          │
│                                                                 │
│  HISTORIQUE DES COMMANDES                                       │
│                                                                 │
│  ┌─────┬────────────┬────────┬──────────┬─────────┐           │
│  │ N°  │ Date       │ Montant│ Statut   │ Actions │           │
│  ├─────┼────────────┼────────┼──────────┼─────────┤           │
│  │#042 │ 10/12/2025 │ 54,00€ │🟢 Payée  │ 👁️ 📄  │           │
│  │#038 │ 05/12/2025 │ 89,50€ │🟢 Payée  │ 👁️ 📄  │           │
│  │#032 │ 28/11/2025 │125,00€ │🟢 Payée  │ 👁️ 📄  │           │
│  └─────┴────────────┴────────┴──────────┴─────────┘           │
│                                                                 │
│  Total dépensé: 268,50 €       Nombre de commandes: 3          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Éléments affichés:**
- Informations complètes du client
- Carte interactive avec localisation GPS
- Historique de toutes les commandes
- Statistiques (CA généré, nombre de commandes)
- Boutons d'action: 👁️ (voir commande), 📄 (télécharger facture)

---

### 4. Gestion des Commandes

**URL:** `/dashboard/orders`

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES COMMANDES                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Rechercher: [_______]  Statut: [Tous ▼]  Période: [30j ▼] │
│                                                                 │
│  ┌─────┬───────────┬──────────────┬────────┬──────────┬───────┐│
│  │ N°  │ Date      │ Client       │ Montant│ Statut   │Actions││
│  ├─────┼───────────┼──────────────┼────────┼──────────┼───────┤│
│  │#042 │10/12/2025 │ Jean Dupont  │ 54,00€ │🟢 Payée  │👁️ ✏️ 📄││
│  │#041 │10/12/2025 │ Marie Martin │ 89,50€ │🟡 En cours│👁️ ✏️ 📄││
│  │#040 │09/12/2025 │ Société ABC  │234,00€ │🟢 Payée  │👁️ ✏️ 📄││
│  │#039 │09/12/2025 │ P. Durand    │ 45,00€ │🔴 Annulée│👁️ ✏️ 📄││
│  │#038 │08/12/2025 │ J. Dupont    │ 89,50€ │🟢 Payée  │👁️ ✏️ 📄││
│  └─────┴───────────┴──────────────┴────────┴──────────┴───────┘│
│                                                                 │
│  ← Préc | 1 2 3 ... 13 | Suiv →                  127 commandes │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Statuts des commandes:**
- 🟢 Payée (Paid)
- 🟡 En attente de paiement (Pending)
- 🔵 En préparation (Processing)
- 🟣 Expédiée (Shipped)
- ⚪ Livrée (Delivered)
- 🔴 Annulée (Cancelled)

**Actions:**

1. **Voir détail:** 👁️ → Affiche tous les détails de la commande
2. **Modifier statut:** ✏️ → Change le statut de la commande
3. **Télécharger facture:** 📄 → Génère et télécharge le PDF de facture

#### 4.1 Détail d'une commande

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMANDE #042                               [Modifier] [Facture]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Statut: [Payée ▼]          Mode: Stripe                │  │
│  │ Date: 10/12/2025 21:30     Transaction: pi_3Abc123...  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ──────── Client ────────                                       │
│                                                                 │
│  Jean Dupont (#089)                                             │
│  jean@email.com | +33 6 12 34 56 78                            │
│  123 Rue de la Paix, 75001 Paris                               │
│                                                                 │
│  ──────── Produits commandés ────────                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Image] iPhone 15 Pro - 128GB                           │  │
│  │         Prix unitaire: 15,00 € × 1    = 15,00 €        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Image] Coque protection iPhone                         │  │
│  │         Prix unitaire: 20,00 € × 1    = 20,00 €        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Image] Chargeur rapide USB-C                           │  │
│  │         Prix unitaire: 10,00 € × 1    = 10,00 €        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ──────── Récapitulatif ────────                               │
│                                                                 │
│  Sous-total HT:                         37,50 €                │
│  TVA (20%):                              7,50 €                │
│  ─────────────────────────────────────────────                 │
│  Total TTC:                             45,00 €                │
│                                                                 │
│  ──────── Actions ────────                                      │
│                                                                 │
│  [📧 Envoyer confirmation]  [📄 Télécharger facture]           │
│  [❌ Annuler la commande]   [💰 Créer un avoir]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Actions disponibles:**

1. **Modifier le statut:**
   - Changer dans le menu déroulant en haut
   - Auto-enregistré
   - Email automatique envoyé au client

2. **Télécharger la facture:**
   - Génère un PDF professionnel
   - Inclut: Logo, infos société, RIB, détails commande
   - Téléchargement immédiat

3. **Créer un avoir:**
   - Pour retours/remboursements
   - Crée une facture d'avoir (credit note)
   - Déduit du CA

4. **Annuler la commande:**
   - Change le statut à "Annulée"
   - Rembourse si paiement effectué (selon configuration)

---

### 5. Gestion des Devis

**URL:** `/dashboard/quotes`

**Layout similaire aux commandes:**

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES DEVIS                              [+ Nouveau devis]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Rechercher: [_______]  Statut: [Tous ▼]  Période: [30j ▼] │
│                                                                 │
│  ┌─────┬───────────┬──────────────┬────────┬──────────┬───────┐│
│  │ N°  │ Date      │ Client       │ Montant│ Statut   │Actions││
│  ├─────┼───────────┼──────────────┼────────┼──────────┼───────┤│
│  │D034 │10/12/2025 │ Société XYZ  │1200€   │🟢 Accepté│👁️ ✏️ 📄││
│  │D033 │09/12/2025 │ ABC Corp     │ 850€   │🟡 En attente│👁️ ✏️ 📄││
│  │D032 │08/12/2025 │ Martin SARL  │2100€   │🟢 Accepté│👁️ ✏️ 📄││
│  │D031 │07/12/2025 │ Tech Inc     │ 650€   │🔴 Refusé │👁️ ✏️ 📄││
│  │D030 │05/12/2025 │ Innovate Ltd │ 990€   │⚪ Expiré │👁️ ✏️ 📄││
│  └─────┴───────────┴──────────────┴────────┴──────────┴───────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Création d'un devis:**

1. Cliquer sur "+ Nouveau devis"
2. Sélectionner ou créer un client
3. Ajouter des produits (recherche + sélection)
4. Définir les quantités et prix (modifiables)
5. Ajouter des remises si nécessaire
6. Définir la date de validité
7. Ajouter des notes/conditions
8. Générer le devis → PDF automatique

**Actions sur un devis:**

- **Accepter:** Transforme automatiquement en commande
- **Refuser:** Archive le devis
- **Envoyer par email:** Envoi automatique au client
- **Dupliquer:** Crée un nouveau devis avec les mêmes lignes
- **Télécharger PDF:** Document professionnel

---

### 6. Gestion des Factures

**URL:** `/dashboard/invoices`

**Fonctionnement:**

Les factures sont générées **automatiquement** à partir des commandes payées.

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES FACTURES                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Rechercher: [_______]  Statut: [Tous ▼]  Période: [30j ▼] │
│                                                                 │
│  ┌─────┬───────────┬──────────────┬────────┬──────────┬───────┐│
│  │ N°  │ Date      │ Client       │ Montant│ Statut   │Actions││
│  ├─────┼───────────┼──────────────┼────────┼──────────┼───────┤│
│  │F042 │10/12/2025 │ Jean Dupont  │ 54,00€ │🟢 Payée  │👁️ 📄 📧││
│  │F041 │10/12/2025 │ Marie Martin │ 89,50€ │🟡 En attente│👁️ 📄 📧││
│  │F040 │09/12/2025 │ Société ABC  │234,00€ │🟢 Payée  │👁️ 📄 📧││
│  └─────┴───────────┴──────────────┴────────┴──────────┴───────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Statuts:**
- 🟢 Payée: Paiement reçu
- 🟡 En attente: Commande créée mais pas encore payée
- 🔴 Impayée: Échéance dépassée
- ⚪ Annulée: Facture annulée (avoir créé)

**Actions:**
- 👁️ Voir le détail
- 📄 Télécharger PDF
- 📧 Envoyer par email
- 💰 Créer un avoir (remboursement partiel ou total)

**Format du PDF de facture:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  NEOSERV                          FACTURE N° F042            │
│  [Logo]                           Date: 10/12/2025           │
│                                                              │
│  123 Avenue des Champs-Élysées    CLIENT:                    │
│  75008 Paris, France              Jean Dupont                │
│  SIRET: 123 456 789 00012         123 Rue de la Paix        │
│  contact@neoserv.fr               75001 Paris                │
│  +33 1 23 45 67 89               jean@email.com             │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  DÉTAIL DES PRESTATIONS                                      │
│                                                              │
│  ┌────────────────────┬────┬─────────┬──────┬──────────┐   │
│  │ Désignation        │ Qté│ PU HT   │ TVA  │ Total HT │   │
│  ├────────────────────┼────┼─────────┼──────┼──────────┤   │
│  │ iPhone 15 Pro      │ 1  │ 12,50 € │ 20% │ 12,50 € │   │
│  │ Coque protection   │ 1  │ 16,67 € │ 20% │ 16,67 € │   │
│  │ Chargeur USB-C     │ 1  │  8,33 € │ 20% │  8,33 € │   │
│  └────────────────────┴────┴─────────┴──────┴──────────┘   │
│                                                              │
│                                         Sous-total HT: 37,50€│
│                                         TVA 20%:       7,50€│
│                                         ──────────────────── │
│                                         TOTAL TTC:    45,00€│
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  COORDONNÉES BANCAIRES (RIB)                                 │
│                                                              │
│  Banque: [Nom de la banque]                                  │
│  IBAN: FR76 XXXX XXXX XXXX XXXX XXXX XXX                    │
│  BIC: XXXXXXXX                                               │
│  Titulaire: NEOSERV                                          │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  Facture acquittée par Stripe le 10/12/2025                 │
│  Transaction ID: pi_3AbcDefGhiJklMnoPqrStuVw                │
│                                                              │
│  Merci pour votre confiance.                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 7. Gestion des Avoirs (Credit Notes)

**URL:** `/dashboard/credit-notes`

**Description:**
Les avoirs sont des factures négatives utilisées pour les remboursements, retours ou corrections.

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES AVOIRS                             [+ Nouvel avoir] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┬───────────┬────────────────┬────────┬─────────┬──────┐│
│  │ N°  │ Date      │ Client/Facture │ Montant│ Motif   │Actions││
│  ├─────┼───────────┼────────────────┼────────┼─────────┼──────┤│
│  │A005 │10/12/2025 │ J. Dupont/F038 │-20,00€ │ Retour  │👁️ 📄││
│  │A004 │08/12/2025 │ ABC/F035       │-50,00€ │ Erreur  │👁️ 📄││
│  │A003 │05/12/2025 │ Martin/F030    │-15,00€ │ Gest.com│👁️ 📄││
│  └─────┴───────────┴────────────────┴────────┴─────────┴──────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Création d'un avoir:**

1. Depuis une facture, cliquer sur "💰 Créer un avoir"
2. Formulaire pré-rempli avec les lignes de la facture originale
3. Options:
   - Avoir total (toute la facture)
   - Avoir partiel (sélectionner les lignes)
   - Modifier les quantités
4. Indiquer le motif: Retour / Erreur de facturation / Geste commercial
5. Valider → Avoir créé et PDF généré

**Impact comptable:**
- Déduit du chiffre d'affaires
- Lié à la facture originale
- Traçabilité complète

---

### 8. Gestion des Fournisseurs

**URL:** `/dashboard/suppliers`

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES FOURNISSEURS                  [+ Nouveau fournisseur]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┬──────────────────┬─────────────────────┬────────────┐ │
│  │ ID  │ Nom              │ Contact             │ Actions    │ │
│  ├─────┼──────────────────┼─────────────────────┼────────────┤ │
│  │#012 │ Tech Wholesale   │ contact@tech.com    │ 👁️ ✏️ 🗑️  │ │
│  │#011 │ Beauty Supply Co │ info@beauty.fr      │ 👁️ ✏️ 🗑️  │ │
│  │#010 │ Food Import Ltd  │ sales@food.com      │ 👁️ ✏️ 🗑️  │ │
│  └─────┴──────────────────┴─────────────────────┴────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Formulaire fournisseur:**
- Nom *
- Contact (nom, email, téléphone)
- Adresse complète
- SIRET
- Conditions de paiement
- Délai de livraison moyen
- Notes

**Fonctionnalités:**
- Associer des produits à un fournisseur
- Créer des factures d'achat
- Suivre les paiements fournisseurs
- Historique des achats

---

### 9. Statistiques et Reporting

**URL:** `/dashboard/stats`

```
┌─────────────────────────────────────────────────────────────────┐
│  STATISTIQUES ET RAPPORTS                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Période: [Aujourd'hui ▼] [Ce mois ▼] [Cette année ▼] [Perso] │
│                                                                 │
│  ──────── Vue d'ensemble ────────                              │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐│
│  │    💰      │  │    📦      │  │    👥      │  │   📈     ││
│  │ CA Total   │  │  Commandes │  │  Nouveaux  │  │ Taux de  ││
│  │ 125 450€   │  │    287     │  │  clients   │  │conversion││
│  │   +18% ↗   │  │   +12% ↗   │  │     45     │  │  2.8%    ││
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘│
│                                                                 │
│  ──────── Graphiques ────────                                  │
│                                                                 │
│  [Onglets: CA | Commandes | Produits | Clients]                │
│                                                                 │
│  CHIFFRE D'AFFAIRES PAR MOIS                                    │
│  €                                                              │
│  60k │                                          ●               │
│      │                                     ●────                │
│  50k │                                ●────                     │
│      │                           ●────                          │
│  40k │                      ●────                               │
│      │                 ●────                                    │
│  30k │            ●────                                         │
│      │       ●────                                              │
│  20k │  ●────                                                   │
│      │●                                                         │
│   0  └──┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬── │
│        J   F   M   A   M   J   J   A   S   O   N   D          │
│                                                                 │
│  ──────── Top produits ────────                                │
│                                                                 │
│  ┌──────────────────────────────┬────────┬──────┬───────────┐ │
│  │ Produit                      │ Ventes │ CA   │ Evolution │ │
│  ├──────────────────────────────┼────────┼──────┼───────────┤ │
│  │ iPhone 15 Pro               │   45   │6750€ │  +25% ↗   │ │
│  │ Samsung Galaxy S24           │   38   │5890€ │  +18% ↗   │ │
│  │ MacBook Pro M3               │   12   │4200€ │   -5% ↘   │ │
│  └──────────────────────────────┴────────┴──────┴───────────┘ │
│                                                                 │
│  [Exporter rapport PDF] [Exporter Excel]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rapports disponibles:**

1. **Chiffre d'affaires:**
   - Par jour/semaine/mois/année
   - Évolution et tendances
   - Comparaison avec périodes précédentes

2. **Commandes:**
   - Nombre total
   - Panier moyen
   - Taux de conversion
   - Répartition par statut

3. **Produits:**
   - Top ventes
   - Stock faible
   - Produits non vendus
   - Marges par produit

4. **Clients:**
   - Nouveaux clients
   - Clients fidèles (récurrence)
   - CA par client
   - Segmentation

5. **Export:**
   - PDF (rapport complet)
   - Excel (données brutes)
   - Périodes personnalisées

---

### 10. Gestion des Utilisateurs/Commerciaux

**URL:** `/dashboard/users`

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES UTILISATEURS                  [+ Nouvel utilisateur]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┬──────────────┬──────────────────┬──────────┬────────┐ │
│  │ ID  │ Nom          │ Email            │ Rôle     │ Actions│ │
│  ├─────┼──────────────┼──────────────────┼──────────┼────────┤ │
│  │#001 │ Admin        │ admin@neoserv.com│ 👑 Admin │ ✏️     │ │
│  │#002 │ Paul Martin  │ paul@neoserv.com │ 💼 Commercial│👁️ ✏️││
│  │#003 │ Sophie Blanc │sophie@neoserv.com│ 💼 Commercial│👁️ ✏️││
│  │#004 │ Luc Durand   │ luc@neoserv.com  │ 📊 Manager│👁️ ✏️  │ │
│  └─────┴──────────────┴──────────────────┴──────────┴────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rôles disponibles:**

1. **👑 Admin (Administrateur):**
   - Accès complet à tout
   - Gestion des utilisateurs
   - Configuration système
   - Exports et rapports

2. **📊 Manager:**
   - Vue sur toutes les données
   - Gestion commerciale
   - Validation des devis/factures
   - Pas de modification système

3. **💼 Commercial:**
   - Gestion de ses propres clients
   - Création de devis
   - Suivi de ses commandes
   - Vue limitée aux stats personnelles

4. **👤 Comptable:**
   - Accès factures/avoirs
   - Suivi paiements
   - Exports comptables
   - Pas d'accès aux produits

**Création d'un utilisateur:**

```
┌──────────────────────────────────────────┐
│  NOUVEL UTILISATEUR                      │
├──────────────────────────────────────────┤
│                                          │
│  Informations:                           │
│  Nom:      [___________________]         │
│  Prénom:   [___________________]         │
│  Email:    [___________________]         │
│  Téléphone:[___________________]         │
│                                          │
│  Accès:                                  │
│  Rôle: [Sélectionner ▼]                 │
│  ⚪ Admin                                │
│  ⚪ Manager                              │
│  ⚫ Commercial                           │
│  ⚪ Comptable                            │
│                                          │
│  Mot de passe: [___________________]     │
│  Confirmer:    [___________________]     │
│                                          │
│  Options:                                │
│  ☑ Envoyer email d'activation           │
│  ☑ Actif                                 │
│                                          │
│  [Annuler]          [Créer l'utilisateur]│
│                                          │
└──────────────────────────────────────────┘
```

---

### 11. Suivi GPS des Commerciaux

**URL:** `/dashboard/tracking`

**Description:**
Suivi en temps réel de la position des commerciaux sur le terrain (style Uber Eats).

```
┌─────────────────────────────────────────────────────────────────┐
│  SUIVI GPS EN TEMPS RÉEL                                        │
├──────┬──────────────────────────────────────────────────────────┤
│      │                                                          │
│ LISTE│  ┌────────────────────────────────────────────────────┐ │
│ DES  │  │                                                    │ │
│ COMM.│  │                                                    │ │
│      │  │             [Carte Leaflet Interactive]           │ │
│ ✓ Paul│  │                                                    │ │
│   Martin│  │                                                    │ │
│   Actif │  │         📍 Paul (en déplacement)                │ │
│   🚗   │  │                                                    │ │
│        │  │                                                    │ │
│ ✓ Sophie│  │                  📍 Sophie (chez client)         │ │
│   Blanc │  │                                                    │ │
│   Actif │  │                                                    │ │
│   🏢   │  │                                                    │ │
│        │  │                                                    │ │
│ ☐ Luc  │  │                                                    │ │
│   Durand│  │     ─── Trajet de Paul (ligne bleue) ───         │ │
│   Inactif│  │                                                   │ │
│   ⚪   │  │                                                    │ │
│        │  └────────────────────────────────────────────────────┘ │
│ Filtre:│                                                          │
│ [Tous▼]│  DÉTAILS: Paul Martin                                   │
│        │                                                          │
│        │  Position actuelle: 48.8566, 2.3522                     │
│        │  Dernière mise à jour: Il y a 30s                       │
│        │  Vitesse: 45 km/h                                       │
│        │  Précision GPS: ±5m                                     │
│        │                                                          │
│        │  Trajet en cours:                                       │
│        │  • Départ: Agence NEOSERV (09:00)                       │
│        │  • Visite 1: Client ABC - ✓ Terminée (10:30)           │
│        │  • Visite 2: Client XYZ - 🔵 En cours (11:15)          │
│        │  • Retour: Agence (prévu 14:00)                         │
│        │                                                          │
│        │  Distance parcourue: 47 km                              │
│        │                                                          │
└────────┴──────────────────────────────────────────────────────────┘
```

**Fonctionnalités:**

1. **Carte en temps réel:**
   - Marqueurs pour chaque commercial actif
   - Couleurs différentes par commercial
   - Trajet affiché (trail des 20 dernières positions)
   - Mise à jour automatique toutes les 5-10 secondes

2. **Informations affichées:**
   - Position GPS précise
   - Vitesse de déplacement
   - Précision du signal
   - Heure de dernière mise à jour
   - Statut: En déplacement / Chez un client / À l'arrêt

3. **Historique:**
   - Voir le trajet complet d'une journée
   - Points de visite (check-in clients)
   - Temps passé chez chaque client
   - Kilométrage total

4. **Filtres:**
   - Par commercial
   - Par statut (actif/inactif)
   - Par date/période

**Fonctionnement technique:**
- WebSocket (Socket.IO) pour temps réel
- L'application mobile envoie la position GPS toutes les 5-10s
- Les positions sont stockées en base (table checkpoints)
- Affichage avec Leaflet.js (OpenStreetMap)

---

### 12. AI Manager (Assistant IA)

**URL:** `/dashboard/ai-manager`

**Description:**
Assistant intelligent powered by Claude (Anthropic) pour vous aider à gérer votre activité.

```
┌─────────────────────────────────────────────────────────────────┐
│  AI MANAGER - Assistant Intelligent                       [🤖]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  🤖 Bonjour ! Je suis votre assistant IA.             │   │
│  │     Comment puis-je vous aider aujourd'hui ?           │   │
│  │                                                         │   │
│  │  Exemples de questions :                               │   │
│  │  • "Quel est mon CA du mois ?"                        │   │
│  │  • "Quels sont mes produits les plus vendus ?"        │   │
│  │  • "Liste les commandes en attente"                   │   │
│  │  • "Crée un devis pour le client ABC"                │   │
│  │  • "Analyse mes performances de décembre"             │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Vous: "Quel est mon CA du mois ?"                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 AI: Voici votre chiffre d'affaires pour décembre:  │   │
│  │                                                         │   │
│  │ • CA Total: 125 450 €                                  │   │
│  │ • Progression: +18% par rapport à novembre             │   │
│  │ • Nombre de commandes: 287                             │   │
│  │ • Panier moyen: 437 €                                  │   │
│  │                                                         │   │
│  │ Vos 3 meilleurs clients ce mois:                       │   │
│  │ 1. Société ABC - 15 890 € (34 commandes)              │   │
│  │ 2. Tech Corp - 12 450 € (18 commandes)                │   │
│  │ 3. XYZ Ltd - 9 870 € (22 commandes)                   │   │
│  │                                                         │   │
│  │ Voulez-vous un rapport détaillé ?                      │   │
│  │ [Oui, générer le rapport] [Non, merci]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Posez votre question...                           [🎤] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Capacités de l'AI Manager:**

1. **Analyse de données:**
   - Statistiques CA, commandes, produits
   - Comparaisons de périodes
   - Identification de tendances
   - Prédictions

2. **Aide à la décision:**
   - Recommandations de prix
   - Suggestions de promotions
   - Optimisation du stock
   - Ciblage clients

3. **Actions automatiques:**
   - Génération de rapports
   - Création de devis
   - Envoi d'emails
   - Export de données

4. **Réponses intelligentes:**
   - Compréhension du langage naturel
   - Contexte conversationnel
   - Multi-langues (français/anglais)

**Configuration:**
- Utilise l'API Claude 3.5 Sonnet (Anthropic)
- Clé API configurée dans le `.env` backend
- Rate limiting pour éviter les abus

---

### 13. Paramètres

**URL:** `/dashboard/settings`

**Sections:**

#### 13.1 Informations de l'entreprise

```
┌─────────────────────────────────────────────────────────────────┐
│  PARAMÈTRES - Informations entreprise                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Logo de l'entreprise:                                          │
│  ┌──────────────┐                                              │
│  │              │                                              │
│  │   [Logo]     │  [📷 Modifier le logo]                       │
│  │              │                                              │
│  └──────────────┘                                              │
│                                                                 │
│  Nom: [NEOSERV_____________________________]                   │
│  Slogan: [____________________________________]                 │
│                                                                 │
│  Adresse:                                                       │
│  [123 Avenue des Champs-Élysées_____________]                   │
│  Ville: [Paris__________] Code postal: [75008]                 │
│  Pays: [France ▼]                                              │
│                                                                 │
│  Contact:                                                       │
│  Téléphone: [+33 1 23 45 67 89______________]                   │
│  Email: [contact@neoserv.fr_________________]                   │
│                                                                 │
│  Informations légales:                                          │
│  SIRET: [123 456 789 00012__________________]                   │
│  N° TVA: [FR12345678900____________________]                   │
│  Code NAF: [_______________________________]                   │
│  Capital: [_______________________________]                   │
│                                                                 │
│  [Enregistrer les modifications]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 13.2 Coordonnées bancaires (RIB)

```
┌─────────────────────────────────────────────────────────────────┐
│  PARAMÈTRES - Coordonnées bancaires                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ces informations apparaîtront sur les factures.                │
│                                                                 │
│  Nom de la banque: [____________________________]               │
│                                                                 │
│  IBAN: [FR__ ____ ____ ____ ____ ____ ___]                     │
│  BIC/SWIFT: [________]                                          │
│                                                                 │
│  Titulaire du compte: [NEOSERV______________]                   │
│                                                                 │
│  Détails RIB (ancienne norme):                                  │
│  Code banque: [_____]                                           │
│  Code guichet: [_____]                                          │
│  N° de compte: [___________]                                    │
│  Clé RIB: [__]                                                  │
│                                                                 │
│  [Enregistrer]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 13.3 Paiements (Stripe)

```
┌─────────────────────────────────────────────────────────────────┐
│  PARAMÈTRES - Moyens de paiement                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔵 Stripe (Cartes bancaires)                                   │
│                                                                 │
│  Statut: ☑ Activé                                               │
│                                                                 │
│  Mode: ⚪ Test     ⚫ Production (LIVE)                         │
│                                                                 │
│  Clés API:                                                      │
│  Clé publique: [pk_live_•••••••••••••••••••] [👁️]             │
│  Clé secrète:  [sk_live_•••••••••••••••••••] [👁️]             │
│                                                                 │
│  ⚠️ Les clés de production sont actuellement configurées.      │
│     Les paiements réels seront effectués.                       │
│                                                                 │
│  ──────────────────────────────────────────────────             │
│                                                                 │
│  💵 Paiement sur place                                          │
│                                                                 │
│  Statut: ☑ Activé                                               │
│                                                                 │
│  Permet aux clients de passer commande et de payer en magasin.  │
│                                                                 │
│  [Enregistrer]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 13.4 Emails

```
┌─────────────────────────────────────────────────────────────────┐
│  PARAMÈTRES - Configuration email                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SMTP (Serveur d'envoi):                                        │
│                                                                 │
│  Hôte: [smtp.gmail.com__________________]                       │
│  Port: [587]  Sécurité: [TLS ▼]                                │
│                                                                 │
│  Authentification:                                              │
│  Utilisateur: [demo@neoserv.com__________]                      │
│  Mot de passe: [••••••••••••] [👁️]                            │
│                                                                 │
│  Email expéditeur:                                              │
│  Nom: [NEOSERV______________________]                           │
│  Email: [neoserv@yourdomain.com______]                          │
│                                                                 │
│  [Tester la configuration] [Enregistrer]                        │
│                                                                 │
│  ──────────────────────────────────────────────────             │
│                                                                 │
│  Templates d'emails:                                            │
│                                                                 │
│  ☑ Email de confirmation de commande                            │
│  ☑ Email d'expédition                                           │
│  ☑ Email de facture                                             │
│  ☑ Email de devis                                               │
│                                                                 │
│  [Personnaliser les templates]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 13.5 TVA et Taxes

```
┌─────────────────────────────────────────────────────────────────┐
│  PARAMÈTRES - TVA et Taxes                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Taux de TVA disponibles:                                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Taux     │ Nom               │ Par défaut │ Actions   │    │
│  ├──────────┼───────────────────┼────────────┼───────────┤    │
│  │ 20,00%   │ Taux normal      │     ⚫     │ ✏️ 🗑️     │    │
│  │ 10,00%   │ Taux intermédiaire│    ⚪     │ ✏️ 🗑️     │    │
│  │  5,50%   │ Taux réduit       │    ⚪     │ ✏️ 🗑️     │    │
│  │  2,10%   │ Taux super-réduit │    ⚪     │ ✏️ 🗑️     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [+ Ajouter un taux de TVA]                                     │
│                                                                 │
│  Options:                                                       │
│  ☑ Afficher les prix TTC sur la boutique                       │
│  ☐ Afficher les prix HT sur la boutique                        │
│  ☑ Mention "TVA non applicable" si auto-entrepreneur            │
│                                                                 │
│  [Enregistrer]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Guide Commercial - Application Mobile

### Présentation

**Application:** NEOSERV Commercial (React Native / Expo)

**Disponible sur:**
- 📱 iOS (App Store)
- 🤖 Android (Google Play)

**Connexion:**
Les commerciaux utilisent leurs identifiants du dashboard.

---

### Écrans principaux

#### 1. Écran d'accueil

```
┌─────────────────────────────────┐
│  ☰  NEOSERV       👤 Paul   ⚙️ │
├─────────────────────────────────┤
│                                 │
│  Bonjour Paul 👋                │
│  Mardi 10 Décembre 2025         │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │    📦    │  │    💰    │    │
│  │ Rendez-  │  │ CA du    │    │
│  │ vous     │  │ mois     │    │
│  │    5     │  │ 12 450€  │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  ───── Mes rendez-vous ─────    │
│                                 │
│  🔵 09:00 - Client ABC          │
│      123 Rue de la Paix, Paris  │
│      [Voir sur la carte 🗺]     │
│                                 │
│  🔵 14:00 - Client XYZ          │
│      456 Avenue Victor Hugo     │
│      [Voir sur la carte 🗺]     │
│                                 │
│  [+ Ajouter un rendez-vous]     │
│                                 │
│  ───── Actions rapides ─────    │
│                                 │
│  [📍 Check-in client]           │
│  [💰 Créer un devis]            │
│  [📋 Mes clients]               │
│  [📊 Mes statistiques]          │
│                                 │
└─────────────────────────────────┘
```

#### 2. Check-in chez un client

Lorsque le commercial arrive chez un client, il peut faire un check-in:

```
┌─────────────────────────────────┐
│  ←  CHECK-IN CLIENT             │
├─────────────────────────────────┤
│                                 │
│  Où êtes-vous ?                 │
│                                 │
│  📍 Position actuelle:          │
│  48.8566, 2.3522               │
│  123 Rue de la Paix, 75001     │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   [Mini carte Leaflet]    │ │
│  │   avec marqueur           │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  Client visité:                 │
│  [Sélectionner un client ▼]    │
│                                 │
│  Ou scannez la carte du client: │
│  [📷 Scanner QR Code]           │
│                                 │
│  Type de visite:                │
│  ⚫ Prospection                 │
│  ⚪ Suivi                       │
│  ⚪ Livraison                   │
│  ⚪ SAV                         │
│                                 │
│  Notes (optionnel):             │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  [Valider le check-in]          │
│                                 │
└─────────────────────────────────┘
```

**Après validation:**
- L'heure d'arrivée est enregistrée
- La position GPS est sauvegardée
- Le manager peut voir en temps réel sur le dashboard
- Une notification peut être envoyée

#### 3. Création de devis en mobilité

```
┌─────────────────────────────────┐
│  ←  NOUVEAU DEVIS               │
├─────────────────────────────────┤
│                                 │
│  Client:                        │
│  [Client ABC ▼]                 │
│  ou [+ Créer nouveau client]    │
│                                 │
│  ───── Produits ─────           │
│                                 │
│  🔍 Rechercher produit...       │
│                                 │
│  ┌───────────────────────────┐ │
│  │ iPhone 15 Pro        x 2  │ │
│  │ 1199€ × 2 = 2398€        │ │
│  │ [－] [+] [🗑]            │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Coque iPhone         x 2  │ │
│  │ 25€ × 2 = 50€            │ │
│  │ [－] [+] [🗑]            │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Ajouter un produit]         │
│                                 │
│  ───── Total ─────              │
│                                 │
│  Sous-total HT:    2 040,00€    │
│  TVA (20%):          408,00€    │
│  ─────────────────────────      │
│  Total TTC:        2 448,00€    │
│                                 │
│  Remise: [0]% ou [0]€           │
│                                 │
│  Validité: [30 jours ▼]         │
│                                 │
│  Notes:                         │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  [Enregistrer brouillon]        │
│  [Générer et envoyer]           │
│                                 │
└─────────────────────────────────┘
```

**Actions après création:**
- Le devis est créé dans le système
- PDF généré automatiquement
- Envoyé par email au client
- Notification au manager
- Visible dans le dashboard

#### 4. Liste des clients

```
┌─────────────────────────────────┐
│  ←  MES CLIENTS                 │
├─────────────────────────────────┤
│                                 │
│  🔍 Rechercher...               │
│                                 │
│  [Tous ▼] [📍 À proximité]     │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🏢 Client ABC             │ │
│  │ contact@abc.fr            │ │
│  │ 📍 2.3 km                 │ │
│  │ Dernière visite: 05/12    │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🏢 Client XYZ             │ │
│  │ info@xyz.com              │ │
│  │ 📍 5.8 km                 │ │
│  │ Dernière visite: 28/11    │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 👤 Jean Dupont            │ │
│  │ jean@email.com            │ │
│  │ 📍 8.2 km                 │ │
│  │ Dernière visite: 15/11    │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Ajouter un client]          │
│                                 │
└─────────────────────────────────┘
```

**Fonctionnalité "À proximité":**
- Utilise le GPS du téléphone
- Affiche les clients dans un rayon de 10 km
- Triés par distance
- Option d'itinéraire GPS

#### 5. Suivi GPS actif

Pendant les déplacements, l'application envoie la position en temps réel:

```
┌─────────────────────────────────┐
│  SUIVI GPS ACTIF           🟢   │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   [Carte avec votre       │ │
│  │    position et trajet]    │ │
│  │                           │ │
│  │   📍 Vous êtes ici        │ │
│  │                           │ │
│  │   ─── Trajet parcouru     │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  Position actuelle:             │
│  48.8566, 2.3522               │
│                                 │
│  Vitesse: 45 km/h              │
│  Précision: ±5m                 │
│                                 │
│  Trajet aujourd'hui:            │
│  Distance: 47 km                │
│  Durée: 2h15                    │
│  Visites: 2                     │
│                                 │
│  ⚠️ Votre position est visible  │
│     par votre manager           │
│                                 │
│  [⏸ Mettre en pause]           │
│                                 │
└─────────────────────────────────┘
```

**Paramètres GPS:**
- Fréquence d'envoi: 10 secondes
- Précision: High accuracy (GPS + WiFi + Cellular)
- Fonctionnement en arrière-plan
- Économie de batterie optimisée

#### 6. Statistiques personnelles

```
┌─────────────────────────────────┐
│  ←  MES STATISTIQUES            │
├─────────────────────────────────┤
│                                 │
│  Période: [Ce mois ▼]           │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │    💰    │  │    📦    │    │
│  │ CA réalisé│  │ Devis    │    │
│  │ 12 450€  │  │ créés    │    │
│  │  +15% ↗  │  │   18     │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │    👥    │  │    🗺️    │    │
│  │ Clients  │  │Kilomètres│    │
│  │ visités  │  │parcourus │    │
│  │   24     │  │  412 km  │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  ───── Mes meilleurs clients ───│
│                                 │
│  1️⃣ Client ABC - 3 450€        │
│  2️⃣ Client XYZ - 2 890€        │
│  3️⃣ Tech Corp - 2 120€         │
│                                 │
│  ───── Objectifs ─────          │
│                                 │
│  CA mensuel:                    │
│  ████████░░ 82% (12 450€/15k)  │
│                                 │
│  Visites:                       │
│  ████████████ 96% (24/25)      │
│                                 │
│  [Voir rapport détaillé]        │
│                                 │
└─────────────────────────────────┘
```

---

## Cas d'usage complets

### Scénario 1: Un client passe commande en ligne

1. **Client arrive sur neoserv.fr**
   - Page d'accueil avec catégories
   - Clique sur "Boutique"

2. **Navigation dans le catalogue**
   - Filtre par catégorie "HIGH TECH > Smartphones"
   - Trouve un iPhone 15 Pro
   - Clique sur "Ajouter au panier"
   - Badge du panier passe de 0 à 1

3. **Ajout d'accessoires**
   - Continue ses achats
   - Ajoute une coque de protection
   - Ajoute un chargeur rapide
   - Badge du panier: 3 articles

4. **Visualisation du panier**
   - Clique sur l'icône panier
   - Voit les 3 produits
   - Modifie les quantités si besoin
   - Vérifie le total: 54,00 €

5. **Passage de commande**
   - Clique sur "Commander"
   - Modal de création de compte s'ouvre
   - Remplit les informations:
     - Type: Particulier
     - Nom: Jean Dupont
     - Email: jean@email.com
     - Téléphone: 06 12 34 56 78
     - Adresse: 123 Rue de la Paix, 75001 Paris
   - Clique sur "Localiser sur la carte"
   - Une carte s'affiche avec sa position
   - Sélectionne "Stripe (CB)" comme mode de paiement
   - Clique sur "Valider la commande"

6. **Paiement Stripe**
   - Page Stripe s'ouvre
   - Entre les infos de CB
   - Valide le paiement
   - Redirection vers page de confirmation

7. **Confirmation**
   - Page affiche: "✓ COMMANDE CONFIRMÉE"
   - Numéro de commande: #CMD-2025-0042
   - Récapitulatif complet
   - Email de confirmation envoyé automatiquement

8. **Côté backend (automatique)**
   - Client créé en base avec coordonnées GPS
   - Commande créée avec statut "Payée"
   - Facture générée automatiquement
   - Stock décompté
   - Visible immédiatement dans le dashboard admin

---

### Scénario 2: Un administrateur gère une commande

1. **Connexion au dashboard**
   - Va sur https://neoserv.fr/dashboard
   - Entre email: admin@neoserv.com
   - Mot de passe: Admin123!
   - Clique sur "Se connecter"

2. **Vue d'ensemble**
   - Tableau de bord s'affiche
   - Voit les KPIs du mois
   - Remarque une nouvelle commande (#042) dans "Commandes récentes"
   - Statut: 🟢 Payée

3. **Consultation de la commande**
   - Clique sur "Voir toutes les commandes"
   - Trouve la commande #042
   - Clique sur l'icône 👁️ (voir détail)

4. **Page détaillée**
   - Voit toutes les informations:
     - Client: Jean Dupont
     - Produits commandés (3)
     - Total: 54,00 €
     - Statut: Payée
     - Transaction Stripe validée

5. **Téléchargement de la facture**
   - Clique sur "📄 Télécharger facture"
   - PDF professionnel se génère
   - Contient: Logo, infos société, RIB, détails

6. **Modification du statut**
   - Change le statut de "Payée" à "En préparation"
   - Email automatique envoyé au client
   - Puis "Expédiée" quand le colis part
   - Puis "Livrée" à réception

7. **Consultation du client**
   - Clique sur le nom du client "Jean Dupont"
   - Fiche client s'affiche avec:
     - Toutes ses infos
     - Sa position GPS sur une carte
     - Historique de ses commandes
     - Total dépensé

---

### Scénario 3: Un commercial crée un devis sur le terrain

1. **Connexion à l'app mobile**
   - Ouvre NEOSERV Commercial
   - Se connecte avec ses identifiants
   - paul@neoserv.com

2. **Début de journée**
   - Voit ses 5 rendez-vous du jour
   - Active le suivi GPS
   - L'app commence à envoyer sa position

3. **Trajet vers le premier client**
   - Le manager voit en temps réel sa position sur le dashboard
   - Trajet affiché en bleu sur la carte
   - Vitesse: 60 km/h

4. **Arrivée chez le client**
   - Paul arrive chez Client ABC
   - Ouvre l'app
   - Clique sur "📍 Check-in client"
   - Sélectionne "Client ABC"
   - Valide le check-in
   - Heure d'arrivée: 09:02

5. **Présentation des produits**
   - Discute avec le client
   - Le client est intéressé par des smartphones

6. **Création du devis**
   - Clique sur "💰 Créer un devis"
   - Sélectionne "Client ABC"
   - Recherche "iPhone 15"
   - Ajoute 2× iPhone 15 Pro (1199€)
   - Ajoute 2× Coque protection (25€)
   - Total: 2 448€ TTC
   - Ajoute une remise de 10%
   - Nouveau total: 2 203,20€
   - Validité: 30 jours
   - Clique sur "Générer et envoyer"

7. **Envoi du devis**
   - PDF généré automatiquement
   - Email envoyé à contact@abc.fr
   - Notification envoyée au manager
   - Le devis apparaît dans le dashboard

8. **Check-out**
   - Meeting terminé à 10:30
   - Paul fait un check-out
   - Durée de visite: 1h28 enregistrée

9. **Suite de la journée**
   - Paul se rend au prochain client
   - Le dashboard affiche son trajet
   - Distance parcourue mise à jour
   - 4 autres visites dans la journée

10. **Fin de journée**
    - Paul désactive le suivi GPS
    - Consulte ses stats:
      - 5 clients visités
      - 3 devis créés
      - 85 km parcourus
      - CA potentiel: 8 500€
    - Le manager valide les déplacements

---

### Scénario 4: Gestion d'un retour et création d'un avoir

1. **Client contacte le service client**
   - Jean Dupont veut retourner le chargeur (produit défectueux)
   - Commande #042

2. **Admin consulte la commande**
   - Va dans "Commandes"
   - Recherche #042
   - Ouvre le détail

3. **Création de l'avoir**
   - Clique sur "💰 Créer un avoir"
   - Formulaire pré-rempli avec les 3 produits
   - Sélectionne uniquement le chargeur (10€)
   - Motif: "Produit défectueux - Retour"
   - Clique sur "Créer l'avoir"

4. **Avoir généré**
   - Avoir #A005 créé
   - Montant: -10,00€
   - PDF généré automatiquement
   - Email envoyé au client

5. **Impact comptable**
   - CA du mois diminue de 10€
   - Facture #042 liée à l'avoir #A005
   - Traçabilité complète

6. **Remboursement (selon la configuration)**
   - Si paiement Stripe: remboursement automatique sur la CB
   - Si sur place: remboursement manuel

---

## Points importants pour l'utilisation

### Pour les clients

**Avantages:**
- ✅ Catalogue complet avec recherche et filtres
- ✅ Panier intelligent avec calculs automatiques
- ✅ Paiement sécurisé (Stripe) ou sur place
- ✅ Compte créé automatiquement
- ✅ Géolocalisation pour livraison précise
- ✅ Confirmation par email
- ✅ Facture PDF téléchargeable

**Conseils:**
- Vérifier l'adresse avant validation
- Utiliser la localisation GPS pour précision
- Conserver l'email de confirmation

### Pour les administrateurs

**Bonnes pratiques:**
- 📊 Consulter le dashboard quotidiennement
- 📦 Mettre à jour les statuts des commandes régulièrement
- 📄 Télécharger les factures pour archivage
- 👥 Vérifier les nouveaux clients
- 📈 Analyser les statistiques mensuellement
- 🔧 Maintenir les infos entreprise à jour

**Raccourcis utiles:**
- Dashboard: Vue d'ensemble rapide
- Barre de recherche: Trouver client/commande rapidement
- Filtres: Gagner du temps dans les listes
- Export: Sauvegarder les données régulièrement

### Pour les commerciaux

**Utilisation optimale:**
- 🔋 Charger le téléphone avant départ
- 📍 Activer GPS en début de journée
- ✅ Check-in/out à chaque visite
- 💰 Créer devis immédiatement sur place
- 📊 Consulter stats en fin de journée
- 🔄 Synchroniser régulièrement

**Conseils batterie:**
- Le suivi GPS consomme de la batterie
- Utiliser un chargeur voiture
- Désactiver en pause déjeuner si nécessaire

---

## Support et aide

### Problèmes courants

**"Je ne peux pas me connecter"**
- Vérifier email et mot de passe
- Contacter admin pour réinitialisation
- Vérifier connexion internet

**"Le paiement Stripe ne fonctionne pas"**
- Vérifier les clés API dans Paramètres
- S'assurer que mode Production est activé
- Consulter les logs Stripe

**"Les emails ne partent pas"**
- Vérifier configuration SMTP
- Tester avec "Tester la configuration"
- Vérifier que Gmail autorise l'app

**"GPS ne fonctionne pas (mobile)"**
- Autoriser localisation dans paramètres téléphone
- Activer GPS/localisation
- Vérifier connexion internet

### Contact support

- 📧 Email: support@neoserv.fr
- 📞 Téléphone: +33 1 23 45 67 89
- 💬 Chat en ligne (dashboard)

---

**Date de dernière mise à jour:** 10 Décembre 2025
**Version de la plateforme:** 2.0
**Auteur:** Documentation NEOSERV
