# Système B2B - Documentation d'implémentation

## Vue d'ensemble

Ce document décrit l'implémentation complète du système B2B pour la marketplace NEOSERV, incluant le back-office client PRO et le back-office admin B2B.

## État actuel de l'implémentation

### ✅ COMPLÉTÉ

#### 1. Models de données Prisma (schema.prisma)

**Nouveaux models créés:**

- **ProCustomerProfile** - Configuration B2B pour les clients professionnels
  - Statut: PENDING/APPROVED/REJECTED/SUSPENDED
  - Conditions de paiement: IMMEDIATE/NET15/NET30/NET45/NET60/NET90
  - Limite de crédit
  - Remise par défaut
  - Contact comptabilité
  - Relations avec documents et adresses

- **ProDocument** - Documents PRO (KBIS, RIB, ID, etc.)
  - Types: KBIS, RIB, ID, VAT_CERT, OTHER
  - Statut de validation: PENDING/APPROVED/REJECTED/EXPIRED
  - Upload et validation par admin

- **ShippingAddress** - Adresses de livraison multiples
  - Label personnalisé
  - Contact dédié
  - Adresse par défaut

- **B2BPricingRule** - Règles de tarification B2B
  - Scope: GLOBAL/CATEGORY/PRODUCT/CUSTOMER
  - Types: FIXED/DISCOUNT_PERCENT/TIERS (paliers)
  - Base de calcul: MSRP/COST/CURRENT_PRICE
  - MOQ (Minimum Order Quantity)
  - Priorité et validité temporelle
  - Support des paliers JSON: `[{"min": 1, "max": 10, "discount": 5}, ...]`

- **DeliveryProof** - Preuve de livraison avec signature
  - Signature (image ou vectorielle)
  - Photos de preuve
  - PDF généré

**Models étendus:**

- **Customer** - Ajout de `proProfile` (relation avec ProCustomerProfile)
- **Order** - Ajout de champs B2B:
  - `isB2B` (boolean)
  - `paymentTerms` (conditions de paiement)
  - `proPricesSnapshot` (JSON des prix au moment de la commande)
- **Delivery** - Ajout de `deliveryProof` (relation avec DeliveryProof)

#### 2. Service de Pricing B2B

**Fichier:** `src/services/b2bPricing.service.ts`

**Fonctionnalités:**

- `calculateB2BPrice()` - Calcul du prix B2B pour un produit unique
  - Applique les règles selon la priorité (CUSTOMER > PRODUCT > CATEGORY > GLOBAL)
  - Support des paliers de quantité
  - Remise par défaut du client PRO
  - Retourne: prix HT, TVA, TTC, remise appliquée, règle utilisée

- `calculateCartB2BPrices()` - Calcul pour un panier complet
  - Prix pour chaque produit
  - Totaux: HT, TVA, TTC, remises

- `applyTierPricing()` - Application des paliers de quantité
  - Trouve automatiquement le palier applicable
  - Applique la remise du palier

- `previewPrice()` - Prévisualisation admin
  - Affiche les prix pour différentes quantités
  - Visualise l'impact des paliers

#### 3. Système d'authentification client

**Fichier:** `src/controllers/auth.controller.ts`

**Routes créées:**

- `POST /api/auth/customer/register` - Inscription client
- `POST /api/auth/customer/login` - Connexion client

**Fonctionnalités:**

- Inscription avec type COMPANY ou INDIVIDUAL
- Validation des champs selon le type
- Assignment automatique à un commercial
- Génération de tokens JWT avec rôle CUSTOMER

### 🚧 EN COURS / À FAIRE

#### 1. Migrations Prisma

**Statut:** En attente (DB Render fermée)

**Action requise:**
```bash
npx prisma migrate dev --name add_b2b_system
npx prisma generate
```

#### 2. APIs Back-office Client PRO

**Routes à créer:**

**Dashboard PRO** (`/api/pro/dashboard`)
- GET `/api/pro/dashboard` - KPIs, stats, actions rapides
- GET `/api/pro/dashboard/suggestions` - Produits à réassort

**Profil PRO** (`/api/pro/profile`)
- GET `/api/pro/profile` - Récupérer profil complet
- PUT `/api/pro/profile` - Mettre à jour infos entreprise
- GET `/api/pro/profile/documents` - Liste des documents
- POST `/api/pro/profile/documents` - Upload document
- GET `/api/pro/profile/shipping-addresses` - Adresses de livraison
- POST `/api/pro/profile/shipping-addresses` - Ajouter adresse
- PUT `/api/pro/profile/shipping-addresses/:id` - Modifier adresse
- DELETE `/api/pro/profile/shipping-addresses/:id` - Supprimer adresse

**Catalogue PRO** (`/api/pro/catalog`)
- GET `/api/pro/catalog/products` - Liste produits avec prix B2B
- GET `/api/pro/catalog/products/:id` - Détail produit avec paliers
- GET `/api/pro/catalog/favorites` - Produits favoris
- POST `/api/pro/catalog/favorites/:productId` - Ajouter aux favoris

**Commandes PRO** (`/api/pro/orders`)
- GET `/api/pro/orders` - Liste des commandes avec filtres
- GET `/api/pro/orders/:id` - Détail commande
- POST `/api/pro/orders/:id/reorder` - Recommander
- GET `/api/pro/orders/:id/documents` - Documents (BL, facture)

**Livraisons** (`/api/pro/deliveries`)
- GET `/api/pro/deliveries` - Liste avec timeline
- GET `/api/pro/deliveries/:id` - Détail + tracking
- GET `/api/pro/deliveries/:id/proof` - Preuve de livraison

**Factures** (`/api/pro/invoices`)
- GET `/api/pro/invoices` - Liste avec filtres
- GET `/api/pro/invoices/:id` - Détail facture
- GET `/api/pro/invoices/:id/pdf` - Télécharger PDF
- POST `/api/pro/invoices/:id/declare-payment` - Déclarer paiement

#### 3. APIs Back-office Admin B2B

**Routes à créer:**

**Clients PRO** (`/api/admin/b2b/customers`)
- GET `/api/admin/b2b/customers` - Liste avec statuts
- GET `/api/admin/b2b/customers/:id` - Fiche détaillée
- PUT `/api/admin/b2b/customers/:id/approve` - Approuver
- PUT `/api/admin/b2b/customers/:id/reject` - Rejeter
- PUT `/api/admin/b2b/customers/:id/suspend` - Suspendre
- PUT `/api/admin/b2b/customers/:id/config` - Modifier config (payment terms, credit limit)

**Documents PRO** (`/api/admin/b2b/documents`)
- GET `/api/admin/b2b/documents/pending` - Docs en attente
- PUT `/api/admin/b2b/documents/:id/approve` - Approuver
- PUT `/api/admin/b2b/documents/:id/reject` - Rejeter

**Règles de Tarification** (`/api/admin/b2b/pricing-rules`)
- GET `/api/admin/b2b/pricing-rules` - Liste des règles
- POST `/api/admin/b2b/pricing-rules` - Créer règle
- PUT `/api/admin/b2b/pricing-rules/:id` - Modifier règle
- DELETE `/api/admin/b2b/pricing-rules/:id` - Supprimer règle
- GET `/api/admin/b2b/pricing-rules/preview` - Prévisualiser prix
- POST `/api/admin/b2b/pricing-rules/test` - Tester règle sur produit/client

**Commandes B2B** (`/api/admin/b2b/orders`)
- GET `/api/admin/b2b/orders` - Liste avec filtres B2B
- PUT `/api/admin/b2b/orders/:id/status` - Modifier statut
- POST `/api/admin/b2b/orders/:id/delivery-note` - Générer BL
- POST `/api/admin/b2b/orders/:id/assign-delivery` - Assigner livraison

**Livraisons & Signature** (`/api/admin/b2b/deliveries`)
- PUT `/api/admin/b2b/deliveries/:id/delivered` - Marquer livré
- POST `/api/admin/b2b/deliveries/:id/signature` - Enregistrer signature
- POST `/api/admin/b2b/deliveries/:id/proof` - Générer preuve PDF

**Facturation B2B** (`/api/admin/b2b/invoicing`)
- GET `/api/admin/b2b/invoicing/pending` - Factures à générer
- POST `/api/admin/b2b/invoicing/generate` - Générer factures
- GET `/api/admin/b2b/invoicing/export` - Export comptable CSV

#### 4. Générateur de PDF

**Fichier à créer:** `src/services/pdfGenerator.service.ts`

**Fonctionnalités requises:**

- **Bon de livraison (BL)**
  - Logo + entête entreprise
  - Infos client (company, adresse livraison)
  - Liste produits + quantités
  - Zone signature + nom + date
  - Numérotation unique

- **Facture B2B**
  - Numéro de facture
  - Mentions légales
  - Client (company, SIRET, VAT)
  - Détail HT/TVA/TTC par ligne
  - Conditions de paiement
  - Échéance

- **Preuve de livraison**
  - BL signé
  - Photo de signature
  - Photos de preuve
  - Date et heure de signature
  - Nom du signataire

**Technologies recommandées:**
- **pdfkit** ou **puppeteer** pour génération PDF
- Templates HTML/CSS pour mise en page
- Stockage sur S3 ou local storage

#### 5. Système de Signature Électronique

**Fichier à créer:** `src/services/signature.service.ts`

**Fonctionnalités:**

- Capture signature sur canvas (mobile/tablette)
- Export en image (PNG) ou vector (SVG/JSON)
- Association à delivery_id
- Génération automatique du PDF BL signé
- Déclenchement des notifications

**Frontend (mobile):**
- Composant React Native avec canvas signature
- Support tactile/stylet
- Boutons: Effacer, Valider
- Preview avant validation

#### 6. Système de Notifications

**Fichier à créer:** `src/services/notification.service.ts`

**Événements à gérer:**

**Création commande B2B:**
- Email → Admin
- Email → Client
- Dashboard notification

**Changement de statut:**
- Email → Client
- Dashboard notification
- SMS optionnel si urgent

**Livraison signée:**
- Email → Compta (accounting_email)
- Email → Admin
- Email → Client
- Attach PDF BL signé

**Approbation/Rejet client PRO:**
- Email → Client
- Explication si rejet

**Document validé/rejeté:**
- Email → Client
- Demande de re-upload si rejet

#### 7. Pages Frontend Client PRO

**Structure recommandée:**

```
frontend/
├── pages/
│   └── pro/
│       ├── dashboard/              # Tableau de bord
│       │   └── index.tsx
│       ├── catalog/                # Catalogue PRO
│       │   ├── index.tsx           # Liste produits
│       │   └── [productId].tsx     # Détail produit
│       ├── orders/                 # Commandes
│       │   ├── index.tsx           # Liste
│       │   └── [orderId].tsx       # Détail
│       ├── deliveries/             # Livraisons
│       │   ├── index.tsx           # Liste
│       │   └── [deliveryId].tsx    # Détail + tracking
│       ├── invoices/               # Factures
│       │   ├── index.tsx           # Liste
│       │   └── [invoiceId].tsx     # Détail
│       └── profile/                # Mon entreprise
│           ├── index.tsx           # Infos
│           ├── documents.tsx       # Documents
│           └── addresses.tsx       # Adresses livraison
```

**Composants clés:**

- `PriceDisplay` - Affichage prix HT + paliers
- `TierPricing` - Tableau des paliers de quantité
- `DeliveryTimeline` - Timeline de livraison
- `InvoiceStatus` - Statut de paiement
- `DocumentUploader` - Upload KBIS/RIB
- `AddressManager` - Gestion adresses multiples
- `OrderRecommander` - Recommander une commande

#### 8. Pages Frontend Admin B2B

**Structure recommandée:**

```
frontend/
├── pages/
│   └── admin/
│       └── b2b/
│           ├── customers/          # Gestion clients PRO
│           │   ├── index.tsx       # Liste
│           │   └── [customerId].tsx # Fiche client
│           ├── pricing/            # Règles de tarification
│           │   ├── index.tsx       # Liste règles
│           │   ├── create.tsx      # Créer règle
│           │   └── [ruleId].tsx    # Modifier règle
│           ├── orders/             # Commandes B2B
│           │   ├── index.tsx       # Liste
│           │   └── [orderId].tsx   # Détail + gestion
│           ├── deliveries/         # Livraisons & signature
│           │   ├── index.tsx       # Liste
│           │   └── [deliveryId]/
│           │       ├── index.tsx   # Détail
│           │       └── signature.tsx # Capture signature
│           └── invoicing/          # Facturation
│               ├── index.tsx       # Génération factures
│               └── export.tsx      # Export comptable
```

**Composants clés:**

- `CustomerApproval` - Validation client PRO
- `DocumentValidator` - Validation documents (KBIS, etc.)
- `PricingRuleBuilder` - Builder de règles de tarification
- `TierEditor` - Éditeur de paliers interactif
- `PricePreview` - Prévisualisation des prix
- `SignatureCanvas` - Canvas de capture signature
- `DeliveryProofViewer` - Visualisation preuve de livraison
- `InvoiceGenerator` - Interface génération factures
- `B2BStats` - Statistiques B2B (CA, clients, commandes)

## Architecture Technique

### Stack

- **Backend:** Node.js + Express + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT
- **PDF:** pdfkit ou puppeteer
- **Storage:** S3-compatible ou local
- **Email:** Nodemailer
- **Frontend:** React/Next.js + TypeScript

### Sécurité

- **RBAC** strict (CUSTOMER role pour clients PRO)
- Validation serveur de toutes les entrées
- Contrôle d'accès par customerId
- Hash des mots de passe (bcrypt)
- Tokens JWT avec expiration
- Audit logs pour actions admin

### Performance

- Pagination sur toutes les listes
- Cache pricing rules (Redis optionnel)
- Indexes DB sur champs fréquemment filtrés
- Lazy loading des relations Prisma

## Workflow Client PRO

### 1. Inscription

1. Client remplit formulaire (type=COMPANY)
2. Upload documents (KBIS, RIB, ID)
3. Statut: PENDING
4. Email de confirmation

### 2. Approbation Admin

1. Admin consulte fiche client
2. Valide documents
3. Configure: payment terms, credit limit, remise
4. Approve → Statut: APPROVED
5. Email au client avec accès

### 3. Commande

1. Client browse catalogue avec prix B2B
2. Voit paliers de quantité
3. Ajoute au panier
4. Prix HT calculés en temps réel
5. Choix adresse livraison
6. Confirmation → Commande créée
7. Email confirmations

### 4. Livraison

1. Admin prépare commande
2. Génère BL PDF
3. Assigne livraison (coursier ou externe)
4. Tracking temps réel
5. À la livraison: signature sur tablette
6. Génération preuve de livraison PDF
7. Emails automatiques (client, compta, admin)

### 5. Facturation

1. Admin génère facture
2. PDF avec mentions légales
3. Conditions de paiement (NET30 etc)
4. Email facture au client + compta
5. Client peut déclarer paiement
6. Admin valide paiement
7. Statut: PAID

## Migration & Déploiement

### Étapes de déploiement

1. **Appliquer migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Déployer backend:**
   - Push vers Git
   - Render redéploie automatiquement
   - Vérifier health check

3. **Seed data (optionnel):**
   ```bash
   npx ts-node scripts/seed-b2b.ts
   ```

4. **Tester:**
   - Créer client test PRO
   - Créer règle de pricing
   - Passer commande test
   - Tester signature

### Rollback Plan

- Migrations réversibles via Prisma
- Backup DB avant migration importante
- Feature flags pour activer/désactiver B2B

## Tests Recommandés

### Unit Tests

- `b2bPricing.service.test.ts` - Calcul des prix
- `auth.controller.test.ts` - Auth client
- `pdfGenerator.service.test.ts` - Génération PDF

### Integration Tests

- Workflow complet: inscription → commande → livraison → facture
- Calcul pricing avec différentes règles
- Upload documents + validation
- Génération PDF

### E2E Tests

- Parcours client PRO complet
- Parcours admin B2B
- Capture signature
- Génération documents

## Support & Maintenance

### Logs à monitorer

- Échecs de calcul pricing
- Erreurs génération PDF
- Problèmes upload documents
- Échecs d'envoi email
- Anomalies de signature

### Métriques importantes

- Nombre de clients PRO PENDING
- Taux d'approbation
- CA B2B vs B2C
- Remise moyenne appliquée
- Temps moyen de livraison
- Satisfaction clients (NPS)

## Notes

- Ce système est EXTENSIBLE pour multi-fournisseurs (champ supplier_id si besoin)
- Les paliers peuvent être très flexibles (JSON)
- Le pricing engine peut évoluer (AI pricing optionnel)
- Les documents peuvent être validés automatiquement via OCR
- La signature peut être biométrique (pression, vélocité)

## Auteur

Implémentation par Claude Code pour NEOSERV
Date: Février 2026
