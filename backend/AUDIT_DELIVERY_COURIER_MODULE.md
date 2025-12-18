# 📋 AUDIT COMPLET: Système de Livraison / Coursier

**Projet**: neocom platform
**Backend**: https://neocom-backend.onrender.com
**Date**: 2025-12-17
**Objectif**: Audit préalable avant implémentation du module de livraison/coursier complet

---

## 🎯 Résumé Exécutif

La plateforme **neocom** possède déjà un système de tracking GPS en temps réel pour les **commerciaux**, mais **AUCUN système de gestion de livraisons/coursiers** n'existe actuellement. Le système actuel utilise le modèle `Trip` pour les déplacements commerciaux, mais il n'y a:

- ❌ **Aucun modèle Delivery/Shipment** dans la base de données
- ❌ **Aucune gestion de coursiers** (KYC, documents, approbation)
- ❌ **Aucun événement immutable** (delivery_events) pour l'audit trail
- ❌ **Aucune notification système** pour les changements de statut
- ❌ **Aucun système de wallet/payout** pour les coursiers

✅ **Ce qui EXISTE**: Un excellent système de GPS tracking en temps réel via WebSocket qui peut être adapté

---

## 1️⃣ AUDIT DES ROUTES ET PAGES EXISTANTES

### Backend (`/backend/src`)

#### Routes de Tracking (Existantes - Pour COMMERCIAUX uniquement)
📍 **`/api/tracking/active`** ✅ EXISTE
- **Fonction**: Liste des utilisateurs avec tracking actif
- **Controller**: `tracking.controller.ts:getActiveTracking`
- **Utilisation**: Admins voient tous les commerciaux en déplacement
- **⚠️ Limitation**: Pas de scope par rôle (pas de filtre COURIER vs COMMERCIAL)

📍 **`/api/tracking/user/:userId`** ✅ EXISTE
- **Fonction**: Position actuelle d'un utilisateur spécifique
- **Controller**: `tracking.controller.ts:getUserCurrentPosition`
- **Utilisation**: Admins suivent un commercial spécifique

📍 **`/api/tracking/trips`** ✅ EXISTE
- **Fonction**: Liste des trajets en cours avec positions
- **Controller**: `tracking.controller.ts:getActiveTripsWithPositions`
- **Utilisation**: Dashboard admin pour voir tous les trajets actifs

#### Routes de Delivery Notes (Stub - NON IMPLÉMENTÉE)
📦 **`/api/delivery-notes`** ⚠️ STUB SEULEMENT
- **Fichier**: `deliveryNote.routes.ts` + `deliveryNote.controller.ts`
- **État**: Retourne tableau vide `[]` avec TODO dans le code
- **Code**:
```typescript
// Stub controller for delivery notes
// TODO: Implement full delivery notes functionality with database model
export const getAllDeliveryNotes = async (req: Request, res: Response) => {
  return res.json({ success: true, data: [] });
};
```

#### ❌ Routes MANQUANTES (À créer)
- `/api/deliveries` - Gestion des livraisons
- `/api/courier/apply` - Candidature coursier
- `/api/courier/profile` - Profil coursier
- `/api/courier/documents` - Upload KYC documents
- `/api/admin/couriers` - Gestion admin des coursiers
- `/api/admin/deliveries` - Vue admin des livraisons
- `/api/delivery-events` - Événements de livraison (append-only)

### Frontend (`/frontend`)

#### Pages Admin
❌ **AUCUNE page admin** trouvée pour:
- Gestion des livraisons
- Gestion des coursiers
- Validation KYC
- Assignation de missions

✅ **Ce qui EXISTE**:
- `LiveTrackingMap.tsx` - Carte de suivi en temps réel (React + Leaflet + Socket.io)
- Fonctionne actuellement pour les commerciaux uniquement

### Mobile (`/mobile`)

#### Écrans Existants
📱 **`GPSTrackingScreen.tsx`** ✅ EXISTE
- **Pour**: Commerciaux (COMMERCIAL role)
- **Fonctionnalités**:
  - Tracking GPS en temps réel via WebSocket
  - Traçage du parcours (trail)
  - Statistiques (distance, durée, checkpoints)
  - Connexion au service `tracking.service`

📱 **`DeliveryNotesScreen.tsx`** ✅ EXISTE
- **État**: Interface UI complète mais backend stub
- **Fonctionnalités UI**:
  - Liste des delivery notes
  - Détail d'une delivery note
  - Création de delivery note
- **Problème**: Appelle `/api/delivery-notes` qui retourne tableau vide

#### ❌ Écrans MANQUANTS (À créer)
- `CourierApplicationScreen` - Candidature coursier
- `CourierDashboardScreen` - Dashboard coursier
- `CourierMissionScreen` - Détail mission de livraison
- `CourierMissionStepperScreen` - Étapes de livraison (pickup → dropoff)
- `CustomerDeliveryTrackingScreen` - Suivi client de sa livraison

---

## 2️⃣ AUDIT DES MODÈLES DE DONNÉES (Prisma Schema)

### Modèles EXISTANTS

#### `User` Model
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      UserRole @default(CLIENT)
  firstName String?
  lastName  String?
  // ... autres champs
}

enum UserRole {
  ADMIN       // ✓ Existe
  COMMERCIAL  // → À mapper vers SALES dans la spec
  DELIVERY    // → À mapper vers COURIER dans la spec
  CLIENT      // → À mapper vers CUSTOMER dans la spec
  ACCOUNTANT
}
```

**✅ Bonne nouvelle**: Le rôle `DELIVERY` existe déjà!
**⚠️ Mapping requis**: `DELIVERY` (existant) → `COURIER` (spec)

#### `Order` Model
```prisma
model Order {
  id            String      @id @default(uuid())
  orderNumber   String      @unique
  customerId    String
  customer      Customer    @relation(fields: [customerId], references: [id])
  status        OrderStatus @default(PENDING)
  items         OrderItem[]
  totalAmount   Float
  // ... autres champs
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED      // ✓ Statut basique de livraison existe
  DELIVERED    // ✓ Statut basique de livraison existe
  CANCELLED
}
```

**⚠️ Limitation**: `SHIPPED` et `DELIVERED` sont trop basiques. Pas de tracking granulaire.

#### `Trip` Model (Pour les COMMERCIAUX)
```prisma
model Trip {
  id                  String       @id @default(uuid())
  userId              String
  user                User         @relation(fields: [userId], references: [id])
  status              TripStatus   @default(IN_PROGRESS)
  purpose             TripPurpose  @default(CLIENT_VISIT)
  startTime           DateTime     @default(now())
  endTime             DateTime?
  startAddress        String?
  endAddress          String?
  startLatitude       Float?
  startLongitude      Float?
  vehicleType         String?
  vehicleRegistration String?
  checkpoints         TripCheckpoint[]
  visits              Visit[]
}

enum TripStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TripPurpose {
  CLIENT_VISIT
  PROSPECTING
  DELIVERY         // ✓ Existe mais pas utilisé pour les coursiers
  AFTER_SALES
  MEETING
  // ...
}

model TripCheckpoint {
  id        String   @id @default(uuid())
  tripId    String
  trip      Trip     @relation(fields: [tripId], references: [id])
  latitude  Float
  longitude Float
  accuracy  Float?
  speed     Float?
  heading   Float?
  timestamp DateTime @default(now())
}
```

**✅ Points positifs**:
- Système de tracking GPS complet avec checkpoints
- Champs de position géographique
- Timestamps pour chaque checkpoint

**⚠️ Limitations**:
- Conçu pour les commerciaux, pas les coursiers
- Pas de lien avec les Order ou Delivery
- Pas d'événements immutables pour l'audit

#### `Customer` Model
```prisma
model Customer {
  id                String       @id @default(uuid())
  name              String
  email             String?      @unique
  phone             String?
  address           String?
  city              String?
  postalCode        String?
  country           String?      @default("France")
  latitude          Float?       // ✓ Coordonnées GPS disponibles
  longitude         Float?       // ✓ Coordonnées GPS disponibles
  type              CustomerType @default(INDIVIDUAL)
  // ... autres champs
}
```

**✅ Bon point**: Coordonnées GPS déjà présentes pour les adresses de livraison!

### ❌ Modèles MANQUANTS (À créer)

#### 1. `Delivery` Model (CRITIQUE)
```prisma
model Delivery {
  id                String         @id @default(uuid())
  deliveryNumber    String         @unique
  orderId           String?        // Lien avec Order (optionnel)
  order             Order?         @relation(fields: [orderId], references: [id])
  courierId         String?        // Coursier assigné
  courier           User?          @relation("CourierDeliveries", fields: [courierId], references: [id])
  commercialId      String?        // Commercial qui a créé la livraison
  commercial        User?          @relation("CommercialDeliveries", fields: [commercialId], references: [id])
  customerId        String
  customer          Customer       @relation(fields: [customerId], references: [id])

  // Adresses
  pickupAddress     String
  pickupLatitude    Float?
  pickupLongitude   Float?
  deliveryAddress   String
  deliveryLatitude  Float
  deliveryLongitude Float

  // Statuts
  status            DeliveryStatus @default(CREATED)
  priority          DeliveryPriority @default(NORMAL)

  // Timing
  createdAt         DateTime       @default(now())
  scheduledPickupAt DateTime?
  actualPickupAt    DateTime?
  scheduledDeliveryAt DateTime?
  actualDeliveryAt  DateTime?
  completedAt       DateTime?

  // Contenu
  description       String?
  weight            Float?         // en kg
  dimensions        String?        // "L x W x H cm"
  fragile           Boolean        @default(false)
  requiresSignature Boolean        @default(true)

  // Preuves
  proofOfPickup     String?        // Base64 ou URL de photo
  proofOfDelivery   String?        // Base64 ou URL de photo
  recipientName     String?
  recipientSignature String?       // Base64

  // Relations
  events            DeliveryEvent[]

  @@index([courierId, status])
  @@index([customerId])
  @@index([commercialId])
}

enum DeliveryStatus {
  CREATED
  OFFERED
  ACCEPTED
  TO_PICKUP
  AT_PICKUP
  PICKED_UP
  TO_DROPOFF
  AT_DROPOFF
  DELIVERED
  COMPLETED
  CANCELED
  FAILED
  INCIDENT
}

enum DeliveryPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

#### 2. `DeliveryEvent` Model (CRITIQUE - Audit Trail Immutable)
```prisma
model DeliveryEvent {
  id          String         @id @default(uuid())
  deliveryId  String
  delivery    Delivery       @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  // Événement
  eventType   DeliveryEventType
  status      DeliveryStatus // Statut APRÈS l'événement
  timestamp   DateTime       @default(now())

  // Acteur
  userId      String?
  user        User?          @relation(fields: [userId], references: [id])

  // Détails
  notes       String?
  location    Json?          // {lat, lng, address}
  metadata    Json?          // Données additionnelles (raison d'échec, etc.)

  @@index([deliveryId, timestamp])
  @@index([timestamp])
}

enum DeliveryEventType {
  CREATED
  OFFERED
  ACCEPTED
  REJECTED
  REASSIGNED
  STARTED_TO_PICKUP
  ARRIVED_AT_PICKUP
  PICKED_UP
  STARTED_TO_DROPOFF
  ARRIVED_AT_DROPOFF
  DELIVERED
  COMPLETED
  CANCELED
  FAILED
  INCIDENT_REPORTED
  LOCATION_UPDATE
}
```

#### 3. `CourierProfile` Model
```prisma
model CourierProfile {
  id                  String               @id @default(uuid())
  userId              String               @unique
  user                User                 @relation(fields: [userId], references: [id])

  // Statut
  status              CourierStatus        @default(DRAFT)
  approvedAt          DateTime?
  approvedBy          String?
  approver            User?                @relation("CourierApprover", fields: [approvedBy], references: [id])

  // Informations personnelles
  dateOfBirth         DateTime?
  nationality         String?
  address             String?
  city                String?
  postalCode          String?

  // Informations professionnelles
  vehicleType         VehicleType?
  vehicleRegistration String?
  vehicleModel        String?
  drivingLicenseNumber String?
  drivingLicenseExpiry DateTime?

  // Bancaire (pour payout)
  iban                String?
  bic                 String?
  bankName            String?

  // Statistiques
  totalDeliveries     Int                  @default(0)
  successfulDeliveries Int                 @default(0)
  rating              Float?               // Note moyenne

  // Relations
  documents           CourierDocument[]

  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
}

enum CourierStatus {
  DRAFT          // Candidature en cours de remplissage
  SUBMITTED      // Candidature soumise
  UNDER_REVIEW   // En cours de vérification
  APPROVED       // Approuvé - peut recevoir des missions
  REJECTED       // Rejeté
  SUSPENDED      // Suspendu (ex: docs expirés)
  INACTIVE       // Inactif volontairement
}

enum VehicleType {
  BIKE
  SCOOTER
  MOTORCYCLE
  CAR
  VAN
  TRUCK
}
```

#### 4. `CourierDocument` Model (KYC)
```prisma
model CourierDocument {
  id                String             @id @default(uuid())
  courierProfileId  String
  courierProfile    CourierProfile     @relation(fields: [courierProfileId], references: [id], onDelete: Cascade)

  type              DocumentType
  status            DocumentStatus     @default(PENDING)

  // Fichier
  fileUrl           String             // Base64 ou URL
  fileName          String
  fileSize          Int                // en bytes
  mimeType          String

  // Validation
  expiryDate        DateTime?
  issuedDate        DateTime?
  issuedBy          String?            // Autorité émettrice
  documentNumber    String?

  // Admin
  reviewedAt        DateTime?
  reviewedBy        String?
  reviewer          User?              @relation(fields: [reviewedBy], references: [id])
  rejectionReason   String?

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([courierProfileId])
}

enum DocumentType {
  IDENTITY_CARD
  PASSPORT
  DRIVING_LICENSE
  VEHICLE_REGISTRATION
  VEHICLE_INSURANCE
  CRIMINAL_RECORD
  RESIDENCE_PERMIT
  PROOF_OF_ADDRESS
  BANK_DETAILS
  OTHER
}

enum DocumentStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

#### 5. `CourierLocation` Model (Live Tracking)
```prisma
model CourierLocation {
  id          String   @id @default(uuid())
  courierId   String
  courier     User     @relation(fields: [courierId], references: [id])
  deliveryId  String?  // Livraison en cours (nullable)

  latitude    Float
  longitude   Float
  accuracy    Float?
  altitude    Float?
  speed       Float?   // en m/s
  heading     Float?   // en degrés

  timestamp   DateTime @default(now())

  @@index([courierId, timestamp])
  @@index([deliveryId])
}
```

#### 6. `Notification` Model
```prisma
model Notification {
  id          String           @id @default(uuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id])

  type        NotificationType
  title       String
  message     String
  data        Json?            // Données additionnelles (deliveryId, etc.)

  isRead      Boolean          @default(false)
  readAt      DateTime?

  createdAt   DateTime         @default(now())

  @@index([userId, isRead, createdAt])
}

enum NotificationType {
  DELIVERY_CREATED
  DELIVERY_ASSIGNED
  DELIVERY_ACCEPTED
  DELIVERY_STARTED
  DELIVERY_PICKED_UP
  DELIVERY_IN_TRANSIT
  DELIVERY_ARRIVING
  DELIVERY_DELIVERED
  DELIVERY_COMPLETED
  DELIVERY_CANCELED
  DELIVERY_FAILED
  COURIER_APPLICATION_SUBMITTED
  COURIER_APPLICATION_APPROVED
  COURIER_APPLICATION_REJECTED
  DOCUMENT_EXPIRED
  SYSTEM_MESSAGE
}
```

#### 7. `Payout` Model (Optionnel - Si implémenté)
```prisma
model Payout {
  id          String        @id @default(uuid())
  courierId   String
  courier     User          @relation(fields: [courierId], references: [id])

  amount      Float         // Montant en euros
  currency    String        @default("EUR")
  status      PayoutStatus  @default(PENDING)

  // Période
  periodStart DateTime
  periodEnd   DateTime

  // Livraisons incluses
  deliveryIds String[]      // Array de delivery IDs

  // Processus de paiement
  processedAt DateTime?
  paidAt      DateTime?

  // Détails bancaires snapshot
  iban        String?
  bic         String?
  bankName    String?

  notes       String?

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([courierId, status])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  CANCELED
}
```

---

## 3️⃣ AUDIT DES STATUTS EXISTANTS

### OrderStatus (Existant)
```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED      // ← Statut de livraison basique
  DELIVERED    // ← Statut de livraison basique
  CANCELLED
}
```

**Analyse**: Trop basique pour un système de livraison granulaire. Manque:
- Statuts intermédiaires (pickup, en route, etc.)
- Statuts d'exception (échec, incident)
- Pas de notion de mission offerte/acceptée

### TripStatus (Existant - Pour Commerciaux)
```prisma
enum TripStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

**Analyse**: Simple mais suffisant pour les trajets commerciaux. Pas adapté aux livraisons.

### ❌ DeliveryStatus (MANQUANT - Spec requise)

**Workflow complet requis par la spec**:
```
CREATED → OFFERED → ACCEPTED → TO_PICKUP → AT_PICKUP → PICKED_UP
→ TO_DROPOFF → AT_DROPOFF → DELIVERED → COMPLETED

Exceptions: CANCELED, FAILED, INCIDENT
```

---

## 4️⃣ SERVICES ET INFRASTRUCTURE EXISTANTS

### WebSocket / Tracking Service ✅ EXCELLENT

**Fichier**: `/backend/src/services/tracking.service.ts`

**Fonctionnalités**:
- ✅ Connexion WebSocket (Socket.io)
- ✅ Événements `join-tracking`, `position-update`, `leave-tracking`
- ✅ Stockage en mémoire des positions actives
- ✅ Sauvegarde auto en BDD (TripCheckpoint)
- ✅ Broadcast aux admins (`admin-tracking` room)
- ✅ Support pour utilisateurs et trajets (tripId)

**🎯 Réutilisable pour les coursiers!** Juste besoin d'adapter:
- Ajouter room `courier-tracking`
- Lier les positions aux `deliveryId` au lieu de `tripId`
- Créer `CourierLocation` au lieu de `TripCheckpoint`

### GPS Service (Mobile) ✅

**Fichier**: `/mobile/src/services/gps.service.ts`

**Fonctionnalités présumées**:
- `getCurrentLocation()` - Position actuelle
- `watchPosition()` - Suivi continu
- `stopWatchingPosition()` - Arrêt du suivi
- `requestLocationPermission()` - Demande de permission

**🎯 Réutilisable tel quel** pour les coursiers!

### Socket Service (Mobile) ✅

**Fichier**: `/mobile/src/services/socket.service.ts`

**Fonctionnalités présumées**:
- `connectSocket()` - Connexion WebSocket
- `disconnectSocket()` - Déconnexion
- `sendPositionUpdate()` - Envoi position
- `joinTracking()` - Rejoindre room de tracking

**🎯 Réutilisable tel quel** pour les coursiers!

---

## 5️⃣ TABLEAU DE MAPPING : Existant → Spec

| **Concept Spec** | **Existant dans Code** | **Action Requise** |
|------------------|------------------------|-------------------|
| **SALES** (rôle) | `COMMERCIAL` | ✅ Mapping simple |
| **COURIER** (rôle) | `DELIVERY` | ✅ Mapping simple |
| **CUSTOMER** (rôle) | `CLIENT` | ✅ Mapping simple |
| **MERCHANT** (rôle) | ❌ N'existe pas | ⚠️ Créer ou ignorer |
| **Delivery** (modèle) | ❌ N'existe pas | 🔴 À CRÉER |
| **DeliveryEvent** (modèle) | ❌ N'existe pas | 🔴 À CRÉER |
| **CourierProfile** (modèle) | ❌ N'existe pas | 🔴 À CRÉER |
| **CourierDocument** (modèle) | ❌ N'existe pas | 🔴 À CRÉER |
| **CourierLocation** (modèle) | `TripCheckpoint` | 🟡 Adapter / créer nouveau |
| **Notification** (modèle) | ❌ N'existe pas | 🔴 À CRÉER |
| **Payout** (modèle) | ❌ N'existe pas | 🔴 À CRÉER (optionnel) |
| **DeliveryStatus** (enum) | `OrderStatus` (partiel) | 🔴 Créer enum complet |
| **GPS Tracking** | ✅ Existe (tracking.service.ts) | ✅ Réutiliser |
| **WebSocket** | ✅ Existe (Socket.io) | ✅ Réutiliser + adapter |
| **Admin Panel** | ❌ N'existe pas | 🔴 À CRÉER |
| **Courier App (mobile)** | ❌ N'existe pas | 🔴 À CRÉER |
| **Customer Tracking** | ❌ N'existe pas | 🔴 À CRÉER |

---

## 6️⃣ ANALYSE DES MANQUES VS SPEC

### 🔴 CRITIQUE (Bloquants)

1. **Aucun modèle Delivery** → Impossible de gérer les livraisons
2. **Aucun DeliveryEvent** → Pas d'audit trail immutable
3. **Aucun CourierProfile** → Pas de gestion des coursiers
4. **Aucun système de KYC** → Pas de validation des documents
5. **Aucune route admin** → Admins ne peuvent rien gérer

### 🟡 IMPORTANT (Manque de fonctionnalités)

6. **Pas de notifications** → Utilisateurs non informés des changements
7. **Pas de statuts granulaires** → Tracking grossier uniquement
8. **Pas de système de payout** → Coursiers ne peuvent pas être payés
9. **Pas d'UI mobile coursier** → Coursiers ne peuvent pas utiliser l'app
10. **Pas de tracking client** → Clients ne voient pas où est leur livraison

### ✅ POINTS POSITIFS (À préserver et réutiliser)

- ✅ **Excellente infrastructure WebSocket** déjà fonctionnelle
- ✅ **Services GPS mobile** déjà implémentés
- ✅ **Carte en temps réel** (Leaflet) déjà fonctionnelle
- ✅ **Rôle DELIVERY** existe déjà dans UserRole
- ✅ **Coordonnées GPS** dans Customer pour adresses de livraison
- ✅ **Architecture backend** propre et extensible

---

## 7️⃣ STRATÉGIE D'IMPLÉMENTATION RECOMMANDÉE

### Phase 1: Base de données et Backend Core (CRITIQUE)

**Tâche 1.1**: Migration Prisma - Créer tous les modèles manquants
```bash
npx prisma migrate dev --name add_delivery_courier_system
```

**Tâche 1.2**: Créer `DeliveryEvent` avec auto-write sur changement de statut
- Middleware Prisma pour intercepter UPDATE sur Delivery.status
- Créer automatiquement un DeliveryEvent à chaque changement

**Tâche 1.3**: Créer les routes `/api/deliveries`
- CRUD deliveries avec RBAC
- Filtres par rôle (admin voit tout, commercial voit ses clients, courier voit ses missions)

**Tâche 1.4**: Créer les routes `/api/courier/*`
- `/apply` - Candidature
- `/profile` - Profil
- `/documents` - Upload documents KYC

**Tâche 1.5**: Adapter le WebSocket pour les coursiers
- Ajouter `courier-tracking` room
- Lier positions à `deliveryId`
- Sauvegarder dans `CourierLocation` au lieu de `TripCheckpoint`

### Phase 2: Admin Panel (Frontend)

**Tâche 2.1**: Page `/admin/deliveries`
- Liste des livraisons avec filtres (statut, coursier, date)
- Détail livraison avec timeline d'événements

**Tâche 2.2**: Page `/admin/couriers`
- Liste des coursiers avec statuts
- Validation KYC (approve/reject documents)

**Tâche 2.3**: Page `/admin/deliveries/:id`
- Timeline complète des événements
- Carte avec trajet du coursier
- Actions admin (reassign, cancel, etc.)

### Phase 3: Customer Tracking

**Tâche 3.1**: Page publique `/track/:deliveryId`
- Statut actuel de la livraison
- Timeline des événements (filtrée pour client)
- Carte avec position du coursier (si status ≥ PICKED_UP)
- ETA estimation

**Tâche 3.2**: Intégration dans app mobile client
- Écran "Mes livraisons" dans l'onglet client
- Notifications push pour changements de statut

### Phase 4: Courier Mobile App

**Tâche 4.1**: Écran de candidature (`CourierApplicationScreen`)
- Formulaire de candidature
- Upload des documents KYC

**Tâche 4.2**: Dashboard coursier (`CourierDashboardScreen`)
- Missions disponibles (OFFERED)
- Missions en cours
- Historique

**Tâche 4.3**: Stepper de mission (`CourierMissionStepperScreen`)
- Étapes: TO_PICKUP → AT_PICKUP → PICKED_UP → TO_DROPOFF → AT_DROPOFF → DELIVERED
- Boutons d'action pour avancer dans le workflow
- Upload photo proof of pickup/delivery
- Capture signature

**Tâche 4.4**: Tracking GPS automatique
- Démarrer tracking auto quand mission = ACCEPTED
- Envoi position toutes les 10-15 secondes
- Arrêt auto quand mission = COMPLETED

### Phase 5: Commercial View

**Tâche 5.1**: Page `/commercial/deliveries`
- Liste des livraisons pour les clients du commercial
- Création de nouvelle livraison pour un client
- Suivi des livraisons créées

### Phase 6: Notifications

**Tâche 6.1**: Service de notifications in-app
- Créer Notification au changement de statut delivery
- API `/api/notifications` (GET, PATCH mark as read)

**Tâche 6.2**: UI notifications
- Badge avec count non-lues
- Liste déroulante des notifications
- Deep links vers delivery detail

### Phase 7: KYC et Validation Admin

**Tâche 7.1**: Workflow de validation documents
- Admin approve/reject chaque document
- Email notification au coursier
- Auto-suspension si doc expiré

**Tâche 7.2**: Vérification automatique expiration
- Cron job quotidien
- Suspend coursiers avec docs expirés
- Email de rappel 30 jours avant expiration

### Phase 8: Wallet et Payout (Optionnel)

**Tâche 8.1**: Modèle Payout + routes
- Calcul auto des payouts (ex: chaque fin de semaine)
- Liste des payouts pour coursier
- Export CSV pour admin

**Tâche 8.2**: Admin payout management
- Marquer payout comme payé
- Génération bordereau de paiement

---

## 8️⃣ RECOMMANDATIONS TECHNIQUES

### Ne PAS casser l'existant

1. **Conserver le modèle Trip** pour les commerciaux
2. **Ne PAS renommer les rôles** dans UserRole (utiliser mapping)
3. **Garder tracking.service.ts** et l'étendre au lieu de le remplacer
4. **Garder les routes `/api/tracking/*`** pour les commerciaux

### Réutiliser l'existant

1. **WebSocket**: Ajouter rooms et événements au lieu de créer nouveau service
2. **GPS Service mobile**: Utiliser tel quel pour les coursiers
3. **LiveTrackingMap.tsx**: Créer variante pour afficher coursiers + commerciaux
4. **TripCheckpoint pattern**: S'en inspirer pour CourierLocation

### Bonnes pratiques

1. **DeliveryEvent = Append-only**: JAMAIS de DELETE ou UPDATE
2. **RBAC strict**: Vérifier permissions côté serveur sur CHAQUE endpoint
3. **Scoped queries**: Coursier ne voit que ses deliveries, commercial que ses clients
4. **Rate limit GPS**: 1 position update / 10-15 secondes max
5. **Customer tracking map**: Montrer seulement si status ≥ PICKED_UP

---

## 9️⃣ RISQUES IDENTIFIÉS

### Techniques

1. **Performance WebSocket**: Avec 100+ coursiers actifs, risque de charge
   - **Mitigation**: Redis pub/sub pour scaling horizontal

2. **Taille des images Base64**: Photos de proof peuvent être lourdes
   - **Mitigation**: Compression côté mobile avant upload, ou passage à S3

3. **Précision GPS**: Peut varier selon device et conditions
   - **Mitigation**: Filtrer positions avec accuracy > 50m

### Fonctionnels

4. **Coursiers malveillants**: Fake GPS, fausses preuves
   - **Mitigation**: Historique complet dans DeliveryEvent, système de rating

5. **Expiration documents**: Docs expirés = coursier bloqué
   - **Mitigation**: Emails de rappel automatiques, workflow de renouvellement

### Légaux (À vérifier avec juridique)

6. **RGPD**: Documents d'identité = données sensibles
   - **Mitigation**: Chiffrement, durée de rétention limitée

7. **Responsabilité**: Accidents, vol, dommages
   - **Mitigation**: CGU claires, assurance obligatoire

---

## 🎯 CONCLUSION

### État actuel: 20% prêt
- ✅ Infrastructure GPS tracking excellente
- ✅ Architecture backend propre
- ❌ Aucun modèle de livraison
- ❌ Aucune UI pour coursiers/admin

### Priorité absolue: Backend Core
1. Migration Prisma (tous les modèles)
2. DeliveryEvent avec auto-write
3. Routes API CRUD avec RBAC
4. Adapter WebSocket pour coursiers

### Estimation effort
- **Phase 1 (Backend Core)**: 5-7 jours
- **Phase 2 (Admin Panel)**: 3-4 jours
- **Phase 3 (Customer Tracking)**: 2-3 jours
- **Phase 4 (Courier Mobile)**: 5-6 jours
- **Phase 5 (Commercial View)**: 2 jours
- **Phase 6 (Notifications)**: 2 jours
- **Phase 7 (KYC)**: 2-3 jours
- **Phase 8 (Payout)**: 3-4 jours

**TOTAL**: ~25-35 jours de développement

### Prochaine étape
✅ **Audit terminé** - Rapport complet créé
➡️ **Démarrer Phase 1**: Migration Prisma + DeliveryEvent + Routes API

---

**Fin du rapport d'audit**
*Généré par: Claude Code*
*Date: 2025-12-17*
