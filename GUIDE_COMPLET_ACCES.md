# 🔐 GUIDE COMPLET DES ACCÈS - NEOSERV PLATFORM

## 📋 Vue d'ensemble du système d'accès

Le système NEOSERV dispose de **3 niveaux de contrôle d'accès** :
1. **Rôles** : Définissent le type d'utilisateur (Admin, Commercial, etc.)
2. **Permissions granulaires** : 14 sections configurables par utilisateur
3. **Statut de connexion** : Suivi en temps réel de la présence

---

## 👥 LES 5 RÔLES DISPONIBLES

### 1. 🔴 ADMIN (Administrateur)
**Accès complet à toutes les fonctionnalités**

- ✅ Gestion des utilisateurs (création, modification, suppression)
- ✅ Attribution des rôles
- ✅ Configuration des permissions granulaires
- ✅ Accès à toutes les sections
- ✅ Paramètres système
- ✅ Import/Export de données

**Identifiants test** :
```
Email: admin@neoserv.com
Mot de passe: Admin123!
```

---

### 2. 💼 COMMERCIAL
**Gestion commerciale et relation client**

**Accès par défaut** :
- ✅ Dashboard commercial
- ✅ Gestion des clients
- ✅ Création et suivi des commandes
- ✅ Génération de devis
- ✅ Gestion des factures
- ✅ Catalogue produits (consultation)
- ✅ Statistiques commerciales
- ❌ Gestion utilisateurs (sauf si activé)
- ❌ Comptabilité approfondie (sauf si activé)

**Identifiants test** :
```
Email: commercial@neoserv.com
Mot de passe: Commercial123!
```

---

### 3. 🚚 DELIVERY (Livreur)
**Gestion des livraisons et GPS**

**Accès par défaut** :
- ✅ Dashboard livraisons
- ✅ Suivi GPS en temps réel
- ✅ Liste des commandes à livrer
- ✅ Mise à jour statuts de livraison
- ✅ Informations clients (adresses uniquement)
- ❌ Prix et montants
- ❌ Gestion produits
- ❌ Création de commandes

**Identifiants test** :
```
Email: delivery@neoserv.com
Mot de passe: Delivery123!
```

---

### 4. 💰 ACCOUNTANT (Comptable)
**Gestion comptable et financière**

**Accès par défaut** :
- ✅ Dashboard comptabilité
- ✅ Toutes les factures
- ✅ Suivi des paiements
- ✅ Statistiques financières
- ✅ Export comptable
- ✅ Rapports financiers
- ❌ Modification des commandes
- ❌ Gestion des utilisateurs
- ❌ GPS/Livraisons

**Identifiants test** :
```
Email: accountant@neoserv.com
Mot de passe: Accountant123!
```

---

### 5. 🛍️ CLIENT
**Accès boutique en ligne uniquement**

**Accès par défaut** :
- ✅ Boutique en ligne
- ✅ Catalogue produits
- ✅ Panier et commandes
- ✅ Historique de commandes personnelles
- ✅ Profil personnel
- ❌ Back-office
- ❌ Données autres clients
- ❌ Gestion produits

**Identifiants test** :
```
Email: client@neoserv.com
Mot de passe: Client123!
```

---

## 🎯 LES 14 PERMISSIONS GRANULAIRES

Chaque utilisateur peut avoir un accès personnalisé aux sections suivantes :

| Icon | Clé | Section | Description |
|------|-----|---------|-------------|
| 📊 | `dashboard` | Dashboard | Tableau de bord principal |
| 👥 | `customers` | Clients | Gestion de la base clients |
| 🛒 | `orders` | Commandes | Création et suivi des commandes |
| 📄 | `quotes` | Devis | Génération et gestion des devis |
| 💳 | `invoices` | Factures | Facturation et paiements |
| 📦 | `products` | Produits | Catalogue et stock |
| 🏭 | `suppliers` | Fournisseurs | Gestion des fournisseurs |
| 💰 | `accounting` | Comptabilité | Comptabilité approfondie |
| 📈 | `statistics` | Statistiques | Rapports et analyses |
| 🗺️ | `gps` | GPS / Livraisons | Suivi GPS et livraisons |
| 👤 | `users` | Gestion Utilisateurs | Administration utilisateurs |
| ⚙️ | `settings` | Paramètres | Configuration système |
| 📤 | `import_export` | Import / Export | Import/Export de données |
| 🛍️ | `shop` | Boutique en ligne | Boutique client |

---

## 🔧 CONFIGURATION DES PERMISSIONS

### Interface administrateur

1. **Accéder à la gestion** : `http://localhost:3000/dashboard/users`
2. **Sélectionner un utilisateur** : Cliquer sur "Modifier"
3. **Configurer les permissions** :
   - ✓ **Tout sélectionner** : Active toutes les permissions
   - ✗ **Tout désélectionner** : Désactive toutes les permissions
   - **Sélection individuelle** : Cocher/décocher chaque section

### Actions rapides disponibles

```typescript
// Bouton "Tout sélectionner"
{
  dashboard: true,
  customers: true,
  orders: true,
  quotes: true,
  invoices: true,
  products: true,
  suppliers: true,
  accounting: true,
  statistics: true,
  gps: true,
  users: true,
  settings: true,
  import_export: true,
  shop: true
}

// Bouton "Tout désélectionner"
{
  dashboard: false,
  customers: false,
  // ... toutes à false
}
```

---

## 📡 SYSTÈME DE CONNEXION EN TEMPS RÉEL

### Informations de connexion affichées

**Pour chaque utilisateur, vous voyez** :

1. **🟢 Statut en ligne/hors ligne**
   - Indicateur vert : En ligne
   - Indicateur gris : Hors ligne

2. **🕐 Dernière activité**
   - "Vu il y a X min" pour les utilisateurs hors ligne
   - Calcul automatique basé sur `lastSeenAt`

3. **⏰ Horaires de travail (si configurés)**
   - Format : "🕐 09:00 - 18:00"
   - Jours de travail : Lundi à Vendredi
   - Fuseau horaire : Europe/Paris

### Données trackées en base

```typescript
// Champs User
{
  isOnline: boolean,           // true = connecté actuellement
  lastSeenAt: DateTime,        // Dernière activité enregistrée
  currentSessionId: string,    // ID de session actuelle
  lastLoginAt: DateTime,       // Dernière connexion
  workStartTime: string,       // Ex: "09:00"
  workEndTime: string,         // Ex: "18:00"
  workDays: string[],          // Ex: ["Monday", "Tuesday", ...]
  timezone: string             // Ex: "Europe/Paris"
}

// Table ConnectionLog (historique)
{
  id: string,
  userId: string,
  sessionId: string,
  loginAt: DateTime,           // Heure de connexion
  logoutAt: DateTime,          // Heure de déconnexion
  duration: number,            // Durée en secondes
  ipAddress: string,           // IP de connexion
  userAgent: string            // Navigateur/appareil
}
```

### Comment ça fonctionne

**À la connexion** :
1. Création d'un `sessionId` unique
2. Enregistrement dans `ConnectionLog`
3. Mise à jour `isOnline = true`
4. Enregistrement de l'IP et User-Agent

**À la déconnexion** :
1. Calcul de la durée de session
2. Mise à jour `ConnectionLog.logoutAt`
3. Mise à jour `ConnectionLog.duration`
4. Mise à jour `isOnline = false`
5. Enregistrement `lastSeenAt`

---

## 🔌 API ENDPOINTS

### Authentification

```bash
# Inscription
POST /api/auth/register
Body: { email, password, firstName, lastName, phone, role }

# Connexion
POST /api/auth/login
Body: { email, password }
Response: { user, tokens, sessionId }

# Déconnexion
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }

# Profil
GET /api/auth/profile
Headers: { Authorization: Bearer <token> }

# Mise à jour profil
PUT /api/auth/profile
Headers: { Authorization: Bearer <token> }
Body: { firstName, lastName, phone, avatar }
```

### Gestion des utilisateurs (Admin uniquement)

```bash
# Liste des utilisateurs
GET /api/users
Query: ?role=COMMERCIAL (optionnel)
Response: Inclut isOnline, lastSeenAt, workStartTime, etc.

# Détails d'un utilisateur
GET /api/users/:id

# Créer un utilisateur
POST /api/users
Body: { email, password, firstName, lastName, phone, role, status }

# Modifier un utilisateur
PUT /api/users/:id
Body: { email, firstName, lastName, phone, role, status, password }

# Supprimer un utilisateur
DELETE /api/users/:id

# Obtenir les permissions
GET /api/users/:id/permissions
Response: { dashboard: true, customers: true, ... }

# Mettre à jour les permissions
PUT /api/users/:id/permissions
Body: { dashboard: true, customers: false, orders: true, ... }
```

---

## 💻 UTILISATION DANS LE CODE FRONTEND

### Hook pour vérifier les permissions

```typescript
import { usePermissions } from '@/lib/usePermissions';

function MyComponent() {
  const { permissions, hasPermission, loading } = usePermissions();

  if (loading) return <div>Chargement...</div>;

  // Vérifier une permission spécifique
  if (!hasPermission('customers')) {
    return <div>Accès refusé</div>;
  }

  return (
    <div>
      {hasPermission('orders') && <OrdersSection />}
      {hasPermission('invoices') && <InvoicesSection />}
    </div>
  );
}
```

### Vérifier le rôle

```typescript
import { useAuth } from '@/contexts/AuthContext';

function AdminOnlyComponent() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return <div>Accès réservé aux administrateurs</div>;
  }

  return <div>Contenu admin</div>;
}
```

### Appels API

```typescript
import { usersAPI } from '@/lib/api';

// Obtenir les permissions d'un utilisateur
const response = await usersAPI.getPermissions(userId);
console.log(response.data); // { dashboard: true, customers: true, ... }

// Mettre à jour les permissions
await usersAPI.updatePermissions(userId, {
  dashboard: true,
  customers: true,
  orders: false,
  quotes: false,
  // ...
});
```

---

## 📱 INTERFACES UTILISATEUR

### Page de gestion des utilisateurs
**URL** : `http://localhost:3000/dashboard/users`

**Fonctionnalités** :
- ✅ Liste de tous les utilisateurs
- ✅ Filtrage par rôle (ADMIN, COMMERCIAL, DELIVERY, ACCOUNTANT, CLIENT)
- ✅ Affichage du statut de connexion en temps réel
- ✅ Modification du rôle
- ✅ Configuration des permissions granulaires (14 sections)
- ✅ Activation/Désactivation de comptes
- ✅ Affichage des horaires de travail

**Colonnes affichées** :
1. Utilisateur (nom, prénom, avatar)
2. Connexion (🟢/⚪ statut, dernière vue, horaires)
3. Email
4. Rôle
5. Statut (Actif/Inactif)
6. Dernière connexion
7. Actions (Modifier, Activer/Désactiver)

---

## 🔐 SÉCURITÉ

### Middleware d'authentification

```typescript
// Toutes les routes protégées utilisent ce middleware
import { authenticateToken } from '@/middleware/auth';

router.get('/protected', authenticateToken, controller.method);
```

### Validation des permissions côté backend

```typescript
// Exemple de vérification de permission
export const checkPermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { permissions: true, role: true }
    });

    // Admin a tous les droits
    if (user.role === 'ADMIN') return next();

    // Vérifier la permission spécifique
    const userPermissions = user.permissions as any;
    if (userPermissions && userPermissions[permission]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Permission insuffisante'
    });
  };
};
```

---

## 📊 RÉCAPITULATIF DES ACCÈS PAR RÔLE

| Section | ADMIN | COMMERCIAL | DELIVERY | ACCOUNTANT | CLIENT |
|---------|-------|------------|----------|------------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Clients | ✅ | ✅ | 🔸 Limité | ✅ | ❌ |
| Commandes | ✅ | ✅ | 🔸 Livraison | ✅ | 🔸 Perso |
| Devis | ✅ | ✅ | ❌ | ✅ | ❌ |
| Factures | ✅ | ✅ | ❌ | ✅ | ❌ |
| Produits | ✅ | 🔸 Lecture | ❌ | 🔸 Lecture | ✅ Shop |
| Fournisseurs | ✅ | ❌ | ❌ | ✅ | ❌ |
| Comptabilité | ✅ | ❌ | ❌ | ✅ | ❌ |
| Statistiques | ✅ | ✅ | ❌ | ✅ | ❌ |
| GPS | ✅ | ✅ | ✅ | ❌ | ❌ |
| Utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Paramètres | ✅ | ❌ | ❌ | ❌ | ❌ |
| Import/Export | ✅ | ❌ | ❌ | ✅ | ❌ |
| Boutique | ✅ | ✅ | ❌ | ❌ | ✅ |

**Légende** :
- ✅ = Accès complet
- 🔸 = Accès limité
- ❌ = Pas d'accès

---

## 🚀 MISE EN ROUTE RAPIDE

### 1. Tester tous les rôles

Utilisez les identifiants test fournis ci-dessus pour tester chaque rôle.

### 2. Créer un nouvel utilisateur

1. Connectez-vous en tant qu'Admin : `admin@neoserv.com`
2. Allez sur : `http://localhost:3000/dashboard/users`
3. Cliquez sur "Créer un utilisateur"
4. Remplissez le formulaire
5. Sélectionnez le rôle
6. Cliquez sur "Modifier" > Configurez les permissions

### 3. Personnaliser les permissions

1. Cliquez sur "Modifier" à côté d'un utilisateur
2. Utilisez "Tout sélectionner" ou "Tout désélectionner"
3. Ou cochez individuellement chaque section
4. Cliquez sur "Enregistrer"

### 4. Suivre les connexions

Le tableau des utilisateurs affiche automatiquement :
- 🟢 Qui est en ligne maintenant
- ⏰ Les horaires de travail
- 🕐 La dernière activité

---

## 📞 SUPPORT

Pour toute question sur le système d'accès :
- Documentation : Ce fichier
- Tests : Utilisez les identifiants test fournis
- Développement : Backend sur port 4000, Frontend sur port 3000

---

**Dernière mise à jour** : 2025-11-24
**Version système** : 2.0 (avec permissions granulaires et tracking de connexion)
