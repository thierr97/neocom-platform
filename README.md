# NEOCOM - Plateforme Complète de Gestion Commerciale

Plateforme de gestion commerciale moderne avec CRM, facturation, commandes, e-commerce et application mobile.

## 🚀 Fonctionnalités Principales

- ✅ **Gestion des clients (CRM)** - Gestion complète des clients (particuliers et entreprises)
- ✅ **Gestion des produits** - Catalogue produits avec catégories, stock, images
- ✅ **Commandes & Devis** - Création et suivi des commandes et devis
- ✅ **Facturation automatique** - Génération de factures avec PDF
- ✅ **Authentification JWT** - Sécurité avec tokens access/refresh
- ✅ **Dashboard temps réel** - Statistiques et analyses en temps réel
- 🚧 **Paiements** - Intégration Stripe, PayPal, Paylib (à implémenter)
- 🚧 **GPS Tracking** - Suivi géolocalisation des actions commerciales (à implémenter)
- 🚧 **Import massif** - Import CSV/Excel pour produits et clients (à implémenter)
- 🚧 **Application mobile** - App React Native (à créer)

## 📁 Structure du Projet

```
neocom-platform/
├── backend/              # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/  # Contrôleurs (auth, customer, product, order)
│   │   ├── routes/       # Routes API
│   │   ├── middleware/   # Middleware (auth, upload)
│   │   ├── services/     # Services (pdf, import, gps, payment)
│   │   ├── utils/        # Utilitaires (jwt, password, generateNumber)
│   │   ├── config/       # Configuration database
│   │   └── index.ts      # Point d'entrée serveur
│   ├── prisma/
│   │   ├── schema.prisma # Schéma base de données
│   │   └── seed.ts       # Données initiales
│   └── package.json
│
├── frontend/             # Application Web Next.js 14
│   ├── app/
│   │   ├── dashboard/    # Pages dashboard
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   └── page.tsx
│   ├── lib/
│   │   ├── api.ts        # Client API
│   │   └── auth.ts       # Gestion auth
│   └── package.json
│
├── mobile-app/           # Application Mobile React Native (à créer)
│
└── README.md
```

## 🗄️ Base de Données

### Modèles Prisma

- **Users** (ADMIN, COMMERCIAL, CLIENT)
- **Customers** (INDIVIDUAL, COMPANY)
- **Products** (avec catégories, stock, images)
- **Categories**
- **Orders** (commandes avec items)
- **Quotes** (devis)
- **Invoices** (factures)
- **Payments** (paiements Stripe/PayPal)
- **GpsTracking** (géolocalisation)
- **Activity** (logs d'activité)
- **Import** (historique imports)
- **Settings** (paramètres système)

## 🛠️ Installation & Démarrage

### Prérequis

- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer la base de données
createdb neocom_db

# Configurer .env (déjà créé)
# DATABASE_URL="postgresql://user@localhost:5432/neocom_db"
# JWT_SECRET=neocom-super-secret-jwt-key-2025

# Générer le client Prisma
npx prisma generate

# Lancer les migrations
npx prisma migrate dev

# Seed (données initiales)
npm run seed

# Démarrer le serveur (port 4000)
npm run dev
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer .env.local (déjà créé)
# NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Démarrer le dev server (port 3000)
npm run dev
```

### Accès

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 👤 Comptes de Démonstration

### Admin
- Email: `admin@neocom.com`
- Password: `Admin123!`

### Commercial
- Email: `commercial@neocom.com`
- Password: `Commercial123!`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `PUT /api/auth/profile` - Mise à jour profil

### Customers (CRM)
- `GET /api/customers` - Liste clients
- `GET /api/customers/:id` - Détail client
- `POST /api/customers` - Créer client
- `PUT /api/customers/:id` - Modifier client
- `DELETE /api/customers/:id` - Supprimer client

### Products
- `GET /api/products` - Liste produits
- `GET /api/products/:id` - Détail produit
- `POST /api/products` - Créer produit (ADMIN)
- `PUT /api/products/:id` - Modifier produit (ADMIN)
- `DELETE /api/products/:id` - Supprimer produit (ADMIN)
- `GET /api/products/categories/all` - Liste catégories
- `POST /api/products/categories` - Créer catégorie (ADMIN)

### Orders
- `GET /api/orders` - Liste commandes
- `GET /api/orders/:id` - Détail commande
- `POST /api/orders` - Créer commande
- `PATCH /api/orders/:id/status` - Mettre à jour statut

## 🔧 Technologies

### Backend
- Node.js 20
- Express.js 4
- TypeScript 5
- Prisma ORM 5
- PostgreSQL 15
- JWT (jsonwebtoken)
- bcrypt
- Helmet (sécurité)
- CORS
- Multer (upload fichiers)
- Sharp (traitement images)
- PDFKit (génération PDF)
- Stripe SDK
- node-cron
- nodemailer

### Frontend
- Next.js 14.2 (App Router)
- React 18
- TypeScript 5
- TailwindCSS 3
- Axios

### Mobile (à implémenter)
- React Native
- Expo

## 📝 Prochaines Étapes

### À Implémenter

1. **Génération PDF**
   - Devis (quotes)
   - Factures (invoices)
   - Bons de livraison (delivery notes)
   - Bons de réception (receipt notes)

2. **Système d'Importation Massive**
   - Import CSV/Excel produits
   - Import clients
   - Import commandes
   - Validation des données
   - Gestion des erreurs

3. **Intégration Paiements**
   - Stripe
   - PayPal
   - Paylib
   - Webhooks

4. **GPS Tracking**
   - Enregistrement localisation
   - Historique déplacements commerciaux
   - Cartographie

5. **Application Mobile**
   - Initialisation React Native + Expo
   - Pages de connexion
   - Dashboard mobile
   - Gestion clients en déplacement
   - Création commandes/devis offline
   - Synchronisation

6. **E-Commerce**
   - Catalogue produits public
   - Panier
   - Checkout
   - Paiements en ligne

7. **Backoffice Avancé**
   - Gestion utilisateurs
   - Paramètres entreprise
   - Personnalisation templates PDF
   - Rapports avancés
   - Exports Excel

## 🐛 Problèmes Connus & Solutions

### TypeScript Errors dans le Backend

Si le backend ne démarre pas à cause d'erreurs TypeScript:

**Erreur: "Not all code paths return a value"**

Ajouter `return` avant les appels `res.json()` dans tous les contrôleurs:

```typescript
// Dans middleware/auth.ts
return res.status(401).json({ ... });
return next();
```

**Alternative rapide:** Désactiver le mode strict dans `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitReturns": false
  }
}
```

## 📚 Documentation

### Schéma Base de Données
Voir `/backend/prisma/schema.prisma` pour le schéma complet.

### Postman Collection
À créer: collection Postman avec tous les endpoints.

## 🤝 Contribution

Le projet est en cours de développement. Toutes les contributions sont les bienvenues!

## 📄 Licence

MIT

---

**NEOCOM** - Plateforme de Gestion Commerciale Moderne
Version 1.0.0 - 2025
