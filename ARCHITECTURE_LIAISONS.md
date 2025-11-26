# Architecture et Liaisons - Plateforme NEOSERV

## 📋 Vue d'Ensemble

La plateforme NEOSERV est un système e-commerce B2B intégré avec 4 composants principaux :

1. **🛒 Boutique (Shop)** - Accès public, commandes en ligne
2. **👤 Espace Client** - Portal authentifié pour clients
3. **💼 Back-office Admin** - Gestion commerciale et administrative
4. **📱 Application Mobile** - Outil pour commerciaux terrain

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATEFORME NEOSERV                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   BOUTIQUE   │  │ ESPACE CLIENT│  │ BACK-OFFICE  │          │
│  │    (Shop)    │  │   (/client)  │  │   (Admin)    │          │
│  │  Public      │  │  Auth Email  │  │  Role-Based  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │  BACKEND    │                              │
│                    │  REST API   │                              │
│                    │  Port 4000  │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │ PostgreSQL  │                              │
│                    │  Database   │                              │
│                    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Systèmes d'Authentification

### 1. Authentification USERS (Admin/Commercial)

**Route**: `POST /api/auth/login`

```json
{
  "email": "commercial@neoserv.com",
  "password": "motdepasse"
}
```

**Token JWT**:
```json
{
  "userId": "uuid",
  "email": "commercial@neoserv.com",
  "role": "COMMERCIAL" // ou "ADMIN"
}
```

**Stockage**: `localStorage['adminToken']`

**Rôles disponibles**:
- **ADMIN** → Accès total (tous clients, toutes commandes)
- **COMMERCIAL** → Accès filtré (ses clients et commandes uniquement)
- **DELIVERY** → Accès livraison
- **CLIENT** → Non utilisé côté admin

### 2. Authentification CUSTOMERS (Clients)

**Route**: `POST /api/client/login`

```json
{
  "email": "client@entreprise.com"
}
```

**Token JWT**:
```json
{
  "customerId": "uuid",
  "email": "client@entreprise.com",
  "type": "customer"
}
```

**Stockage**: `localStorage['clientToken']`

**Particularité**: Authentification par **email uniquement** (sans mot de passe)

---

## 🗄️ Modèles de Données Unifiés

### Table ORDER (Commandes)

Les commandes **Shop** et **Back-office** utilisent la **même table** :

```typescript
model Order {
  id              String
  number          String    // CMD-xxxxx
  customerId      String    // Lié au Customer
  userId          String    // Commercial OU "public@neoserv.com"

  // Statuts
  status          OrderStatus       // PENDING → CONFIRMED → SHIPPED → DELIVERED
  paymentStatus   PaymentStatus     // PENDING → PAID

  // Montants
  subtotal        Float
  taxAmount       Float
  total           Float

  // Relations
  customer        Customer
  user            User
  items           OrderItem[]
  payments        Payment[]
  invoice         Invoice?          // Relation 1:1 optionnelle
}
```

**Différenciation Shop vs Back-office**:

| Critère | Commande Shop | Commande Back-office |
|---------|---------------|---------------------|
| userId | `"public@neoserv.com"` | ID du commercial |
| Création | `POST /api/shop/orders` | `POST /api/orders` |
| Customer | Auto-créé si besoin | Sélectionné par commercial |
| Auth | ❌ Aucune | ✅ JWT User |

### Table CUSTOMER (Clients)

Les clients sont **unifiés** entre Shop et Back-office :

```typescript
model Customer {
  id          String
  email       String    @unique  // Clé unique
  type        CustomerType        // INDIVIDUAL ou COMPANY
  status      CustomerStatus      // ACTIVE, PROSPECT, etc.

  userId      String              // Commercial responsable

  // Infos perso
  firstName   String
  lastName    String
  companyName String?

  // Adresse
  address     String
  city        String
  postalCode  String

  // Relations
  user        User                // Commercial assigné
  orders      Order[]             // Toutes les commandes (shop + back-office)
  invoices    Invoice[]
  quotes      Quote[]
  reviews     Review[]
}
```

**Points clés**:
- Email **unique** → Même client peut commander via Shop ET avoir un commercial
- `userId` → Shop met `"public@neoserv.com"`, Back-office met ID du commercial
- Un Customer peut avoir des commandes des 2 sources

---

## 🔄 Flux de Données Détaillés

### Flux 1: Commande Shop → Back-office

```
1. CLIENT BOUTIQUE (/shop)
   ├─ Remplit panier (localStorage)
   ├─ Checkout: entre email + adresse
   └─ POST /api/shop/orders
        ├─ Cherche Customer par email
        ├─ Si n'existe pas → Créer avec userId="public@neoserv.com"
        ├─ Créer Order:
        │   ├─ userId = "public@neoserv.com"
        │   ├─ status = PENDING
        │   ├─ paymentStatus = PENDING
        │   └─ items = articles du panier
        ├─ Décrémenter stock produits
        ├─ Créer StockMovement (type=SALE)
        └─ Log Activity (ORDER_CREATED)

2. BACK-OFFICE ADMIN
   ├─ Voit la nouvelle commande dans dashboard
   ├─ Status: PENDING
   ├─ Commercial peut assigner commande:
   │   └─ PUT /api/orders/:id { userId: commercial_id }
   ├─ Progression statuts:
   │   ├─ CONFIRMED → Commande validée
   │   ├─ PROCESSING → En préparation
   │   ├─ SHIPPED → Expédiée
   │   └─ DELIVERED → Livrée
   └─ Création facture optionnelle:
       └─ POST /api/invoices { orderId }

3. CLIENT RETOUR (/client)
   ├─ Login avec même email
   ├─ GET /api/client/orders
   ├─ Voit la commande shop
   ├─ Suivi statut en temps réel
   └─ Accès facture si générée
```

### Flux 2: Création Commande Back-office

```
1. COMMERCIAL (Dashboard)
   ├─ Login email + password
   ├─ Accès /dashboard/orders/new
   ├─ Sélectionne customer (filtrés par son userId)
   ├─ Sélectionne produits
   └─ POST /api/orders
        ├─ customerId = client choisi
        ├─ userId = req.user.userId (commercial)
        ├─ status = PENDING
        └─ items = []

2. PROGRESSION
   ├─ Commercial met à jour statuts
   ├─ Crée facture depuis commande
   └─ Enregistre paiements

3. CLIENT VOIT LA COMMANDE
   ├─ Login /client avec son email
   ├─ GET /api/client/orders
   └─ Voit commande créée par commercial
```

---

## 🌐 Routes API

### Routes Shop (Public)

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/shop/products` | GET | ❌ | Liste produits (pagination) |
| `/api/shop/products/:id` | GET | ❌ | Détail produit |
| `/api/shop/categories` | GET | ❌ | Liste catégories |
| `/api/shop/orders` | POST | ❌ | Créer commande panier |

### Routes Client (Authentifié)

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/client/login` | POST | ❌ | Login par email |
| `/api/client/profile` | GET | ✅ | Profil client |
| `/api/client/orders` | GET | ✅ | Toutes ses commandes |
| `/api/client/invoices` | GET | ✅ | Toutes ses factures |
| `/api/client/statistics` | GET | ✅ | Stats personnelles |

### Routes Admin/Commercial (Role-Based)

| Route | Méthode | Commercial | Admin |
|-------|---------|------------|-------|
| `/api/orders` | GET | Ses commandes | Toutes |
| `/api/orders` | POST | Crée pour ses clients | Crée pour tous |
| `/api/customers` | GET | Ses clients | Tous |
| `/api/customers/:id` | PUT | Son client | Tous |
| `/api/invoices` | GET | Ses factures | Toutes |

**Filtrage automatique par rôle**:
```typescript
// Exemple dans order.controller.ts
export const getOrders = async (req: AuthRequest, res: Response) => {
  const where: any = {};

  // COMMERCIAL voit SEULEMENT ses commandes
  if (req.user.role === 'COMMERCIAL') {
    where.userId = req.user.userId;
  }
  // ADMIN voit TOUTES les commandes (pas de filtre)

  const orders = await prisma.order.findMany({ where });
};
```

---

## 📱 Pages Frontend

### Shop Frontend

**Route**: `/shop`
**Auth**: ❌ Public

```
/shop/page.tsx
├─ Affiche produits (pagination)
├─ Filtres catégories
├─ Recherche
├─ Panier localStorage
└─ Lien checkout

/shop/checkout/page.tsx
├─ Récupère cart localStorage
├─ Formulaire client (email, adresse)
└─ POST /api/shop/orders

/shop/cart/page.tsx
├─ Affiche items panier
└─ Modification quantités

/shop/success/page.tsx
└─ Confirmation commande
```

### Client Portal

**Route**: `/client`
**Auth**: ✅ JWT Client (email only)

```
/client/page.tsx
├─ Login form (email)
│  └─ POST /api/client/login
│
└─ Dashboard (si connecté):
    ├─ GET /api/client/statistics
    │  └─ Total commandes, dépenses, factures impayées
    │
    ├─ GET /api/client/orders
    │  └─ Liste commandes (Shop + Back-office)
    │
    ├─ GET /api/client/invoices
    │  └─ Liste factures avec statuts
    │
    └─ GET /api/client/profile
       └─ Infos modifiables
```

### Admin Dashboard

**Route**: `/dashboard`
**Auth**: ✅ JWT User (ADMIN/COMMERCIAL)

```
/dashboard/page.tsx
├─ Stats globales
├─ Charts (ventes, commandes)
└─ Actions rapides

/dashboard/orders/page.tsx
├─ GET /api/orders (filtré par role)
├─ Tableau commandes
└─ CRUD complet

/dashboard/customers/page.tsx
├─ GET /api/customers (filtré par role)
├─ Tableau clients
└─ CRUD complet

/dashboard/invoices/page.tsx
├─ GET /api/invoices (filtré par role)
└─ Gestion facturation
```

---

## 🔗 Liaisons Clés

### 1. Email = Identifiant Universel

```
Customer.email (unique)
├─ Login Shop (création auto)
├─ Login Client Portal (même email)
└─ Visible Back-office (commercial peut gérer)
```

### 2. Commandes Unifiées

```
Order table unique
├─ Shop orders (userId="public@neoserv.com")
├─ Back-office orders (userId=commercial_id)
└─ Client voit TOUTES ses commandes via /api/client/orders
```

### 3. Clients Partagés

```
Customer table unique
├─ Créé automatiquement via Shop
├─ OU créé manuellement par commercial
├─ Peut avoir commandes des 2 sources
└─ userId = commercial responsable (ou "public@neoserv.com")
```

### 4. Facturation Optionnelle

```
Invoice (optionnelle)
├─ Peut être créée depuis Order (orderId)
├─ OU créée indépendamment
├─ Visible client dans /api/client/invoices
└─ Gestion paiements via Payment[]
```

---

## 🎯 Use Cases Typiques

### Use Case 1: Client Shop → Suivi Commande

```
1. Client commande sur /shop
   └─ Créé Order + Customer (auto)

2. Commercial voit commande dans dashboard
   └─ Peut assigner la commande (change userId)

3. Client se connecte sur /client
   └─ Voit sa commande + progression statut

4. Commercial crée facture depuis commande
   └─ Client voit facture dans /client/invoices
```

### Use Case 2: Commercial Crée Commande

```
1. Commercial login dashboard
   └─ Accès ses clients uniquement

2. Crée commande pour client existant
   └─ Order avec userId=commercial_id

3. Client peut voir commande
   └─ Login /client avec email → voit order

4. Progression → Facture → Paiement
   └─ Tout visible client
```

### Use Case 3: Client Multi-Sources

```
Client fait 2 commandes:
├─ 1 via Shop (userId="public@neoserv.com")
└─ 1 via Commercial (userId=commercial_id)

Dans /client/orders:
└─ Voit LES 2 commandes (même customerId)

Dans Dashboard Commercial:
├─ Voit SEULEMENT sa commande
└─ Ne voit PAS la commande shop (filtre userId)

Dans Dashboard Admin:
└─ Voit LES 2 commandes (pas de filtre)
```

---

## 📊 Tableau Récapitulatif

| Composant | Auth | Données | Filtrage |
|-----------|------|---------|----------|
| **Shop** | ❌ Public | Products, Categories | isVisible=true |
| **Client Portal** | ✅ Email (JWT) | Orders, Invoices personnels | customerId |
| **Commercial** | ✅ Email+Pass (JWT) | Ses clients/commandes | userId |
| **Admin** | ✅ Email+Pass (JWT) | Toutes données | Aucun |
| **Mobile** | ✅ Email+Pass (JWT) | Commercial tools | userId |

---

## 🔧 Fichiers Importants

### Backend

```
/backend/
├── src/
│   ├── index.ts                          # Point d'entrée
│   ├── routes/
│   │   ├── shop.routes.ts                # Routes boutique
│   │   ├── client.routes.ts              # Routes client portal
│   │   ├── order.routes.ts               # Routes commandes admin
│   │   ├── customer.routes.ts            # Routes clients admin
│   │   └── invoice.routes.ts             # Routes factures
│   ├── controllers/
│   │   ├── shop.controller.ts            # Logique boutique
│   │   ├── client.controller.ts          # Logique client portal
│   │   ├── order.controller.ts           # Logique commandes
│   │   └── customer.controller.ts        # Logique clients
│   ├── middleware/
│   │   ├── auth.ts                       # Auth Users (admin/commercial)
│   │   └── clientAuth.ts                 # Auth Customers (clients)
│   └── prisma/
│       └── schema.prisma                 # Modèles de données
```

### Frontend

```
/frontend/
├── app/
│   ├── shop/
│   │   ├── page.tsx                      # Liste produits
│   │   ├── cart/page.tsx                 # Panier
│   │   ├── checkout/page.tsx             # Checkout
│   │   └── products/[id]/page.tsx        # Détail produit
│   ├── client/
│   │   └── page.tsx                      # Portal client (dashboard + login)
│   └── dashboard/
│       ├── page.tsx                      # Dashboard admin
│       ├── orders/page.tsx               # Gestion commandes
│       ├── customers/page.tsx            # Gestion clients
│       └── invoices/page.tsx             # Gestion factures
```

---

## ✅ Points Clés à Retenir

1. **Une seule base de données** pour tout
2. **Deux systèmes d'auth** séparés (Users vs Customers)
3. **Tables partagées** (Order, Customer) entre Shop et Back-office
4. **Email = clé unique** pour clients
5. **Filtrage automatique** par rôle pour commerciaux
6. **Audit complet** via Activity logs
7. **Client voit tout** via /client (shop + back-office)
8. **Commercial voit filtré** (seulement ses données)
9. **Admin voit tout** (accès complet)

---

## 🚀 Pour Aller Plus Loin

### Amélioration Possible: Assignation Automatique

Quand une commande shop est créée, **assigner automatiquement un commercial** :

```typescript
// shop.controller.ts - createPublicOrder
const order = await prisma.order.create({
  data: {
    // ... autres champs
    userId: await assignCommercialToCustomer(existingCustomer.id)
  }
});

async function assignCommercialToCustomer(customerId: string) {
  // Logique: round-robin, géographie, charge, etc.
  const commercial = await prisma.user.findFirst({
    where: { role: 'COMMERCIAL' },
    orderBy: { orders: { _count: 'asc' } } // Moins chargé
  });

  return commercial?.id || 'public@neoserv.com';
}
```

### Amélioration Possible: Notification Temps Réel

Notifier commercial quand commande shop arrive :

```typescript
// Utiliser Socket.io ou Webhooks
io.to(`commercial-${commercialId}`).emit('new-order', order);
```

---

**Date**: 21 novembre 2024
**Version**: 2.0.0
**Auteur**: NEOSERV Platform
