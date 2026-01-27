# 🧪 Guide de Test - Système Logistique NEOSERV

## 📋 Prérequis

- Backend déployé sur Render (vérifie: https://neocom-backend.onrender.com/health)
- Compte admin actif
- Postman ou curl installé

---

## ✅ Méthode 1: Test Automatique (Recommandé)

```bash
cd ~/Documents/neocom-backend/backend
./test-logistics.sh
```

Le script va automatiquement tester tous les endpoints.

---

## 🔧 Méthode 2: Test Manuel avec Postman/Insomnia

### **Étape 1: Obtenir un token d'authentification**

```bash
POST https://neocom-backend.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "admin@neoserv.com",
  "password": "TON_MOT_DE_PASSE"
}
```

**Réponse:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc..."
}
```

💡 **Copie le `accessToken` pour les requêtes suivantes**

---

### **Étape 2: Créer les utilisateurs de test**

#### 2.1 Créer un STAFF_PREPA

```bash
POST https://neocom-backend.onrender.com/api/users
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "email": "prepa@neoserv.com",
  "password": "Prepa123!",
  "firstName": "Marie",
  "lastName": "Préparation",
  "role": "STAFF_PREPA"
}
```

#### 2.2 Créer un SUB_ADMIN

```bash
POST https://neocom-backend.onrender.com/api/users
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "email": "supervisor@neoserv.com",
  "password": "Super123!",
  "firstName": "Jean",
  "lastName": "Superviseur",
  "role": "SUB_ADMIN"
}
```

---

### **Étape 3: Récupérer une commande existante**

```bash
GET https://neocom-backend.onrender.com/api/orders
Authorization: Bearer TON_TOKEN
```

💡 **Note l'ID d'une commande** (ex: `ORDER_ID = abc123...`)

---

### **Étape 4: Tester le flux INBOUND (France → Guadeloupe)**

#### 4.1 Marquer la commande comme flux logistique

```bash
PATCH https://neocom-backend.onrender.com/api/orders/ORDER_ID
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "fulfillmentFlow": "INBOUND_THEN_LAST_MILE"
}
```

#### 4.2 Expédier depuis France

```bash
POST https://neocom-backend.onrender.com/api/logistics/orders/ORDER_ID/inbound/ship
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "carrier": "Chronopost International",
  "trackingNumber": "FR123456789GP",
  "notes": "Palette de 50kg - Fragile"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Commande expédiée depuis France",
  "order": {
    "inboundStatus": "SHIPPED",
    "inboundCarrier": "Chronopost International",
    "inboundTrackingNumber": "FR123456789GP"
  }
}
```

#### 4.3 Réceptionner en Guadeloupe

```bash
POST https://neocom-backend.onrender.com/api/logistics/orders/ORDER_ID/inbound/receive
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "proofUrl": "https://example.com/proof-reception.jpg",
  "notes": "Marchandise en bon état - Vérifiée par Marie"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Commande réceptionnée avec succès",
  "order": {
    "inboundStatus": "RECEIVED",
    "inboundReceivedAt": "2025-01-12T..."
  }
}
```

---

### **Étape 5: Transformer en livraison locale**

#### Option A: Livraison par coursier interne

D'abord, récupère un ID de livreur:
```bash
GET https://neocom-backend.onrender.com/api/users?role=DELIVERY
Authorization: Bearer TON_TOKEN
```

Puis transforme:
```bash
POST https://neocom-backend.onrender.com/api/logistics/orders/ORDER_ID/last-mile/transform
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "type": "INTERNAL_DRIVER",
  "courierId": "ID_DU_LIVREUR",
  "notes": "Livraison urgente demain matin"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Commande assignée au livreur interne",
  "order": {
    "lastMileType": "INTERNAL_DRIVER"
  },
  "delivery": {
    "id": "...",
    "status": "CREATED"
  }
}
```

#### Option B: Livraison par transporteur externe

```bash
POST https://neocom-backend.onrender.com/api/logistics/orders/ORDER_ID/last-mile/transform
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "type": "EXTERNAL_CARRIER",
  "carrier": "DHL Guadeloupe",
  "trackingNumber": "GP987654321",
  "notes": "Livraison standard 48h"
}
```

---

### **Étape 6: Tester la gestion des tâches**

#### 6.1 Lister toutes les tâches

```bash
GET https://neocom-backend.onrender.com/api/tasks
Authorization: Bearer TON_TOKEN
```

#### 6.2 Créer une tâche manuelle

```bash
POST https://neocom-backend.onrender.com/api/tasks
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "orderId": "ORDER_ID",
  "type": "RECEPTION_INBOUND",
  "title": "Vérification qualité produits",
  "description": "Contrôle qualité après réception",
  "assignedToId": "ID_STAFF_PREPA",
  "scheduledAt": "2025-01-13T09:00:00Z"
}
```

#### 6.3 Ajouter une preuve à une tâche

```bash
POST https://neocom-backend.onrender.com/api/tasks/TASK_ID/proofs
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "type": "PHOTO",
  "fileUrl": "https://example.com/photo-controle.jpg",
  "noteText": "Produits conformes aux attentes",
  "latitude": 16.2410,
  "longitude": -61.5330
}
```

#### 6.4 Mettre à jour le statut d'une tâche

```bash
PATCH https://neocom-backend.onrender.com/api/tasks/TASK_ID/status
Authorization: Bearer TON_TOKEN
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "notes": "Contrôle en cours..."
}
```

Statuts possibles: `TODO`, `IN_PROGRESS`, `DONE`, `APPROVED`, `REJECTED`, `ISSUE`

#### 6.5 Valider une tâche (SUB_ADMIN uniquement)

```bash
POST https://neocom-backend.onrender.com/api/tasks/TASK_ID/review
Authorization: Bearer TOKEN_SUB_ADMIN
Content-Type: application/json

{
  "status": "APPROVED",
  "comments": "Excellent travail, tout est conforme",
  "actionsTaken": {
    "validated": true,
    "timestamp": "2025-01-12T14:30:00Z"
  }
}
```

Statuts de review: `APPROVED`, `REJECTED`, `PENDING_INFO`

#### 6.6 Réassigner une tâche (SUB_ADMIN uniquement)

```bash
POST https://neocom-backend.onrender.com/api/tasks/TASK_ID/reassign
Authorization: Bearer TOKEN_SUB_ADMIN
Content-Type: application/json

{
  "assignedToId": "AUTRE_USER_ID",
  "notes": "Réassignation car Marie en congés"
}
```

---

### **Étape 7: Consulter le statut logistique complet**

```bash
GET https://neocom-backend.onrender.com/api/logistics/orders/ORDER_ID/logistics
Authorization: Bearer TON_TOKEN
```

**Réponse attendue:**
```json
{
  "success": true,
  "logistics": {
    "fulfillmentFlow": "INBOUND_THEN_LAST_MILE",
    "timeline": [
      {
        "phase": "INBOUND",
        "status": "RECEIVED",
        "carrier": "Chronopost International",
        "trackingNumber": "FR123456789GP",
        "shippedAt": "2025-01-10T...",
        "receivedAt": "2025-01-12T..."
      },
      {
        "phase": "LAST_MILE",
        "type": "INTERNAL_DRIVER",
        "delivery": {
          "id": "...",
          "status": "CREATED",
          "courier": {
            "firstName": "Pierre",
            "lastName": "Livreur"
          }
        }
      }
    ],
    "tasks": [
      {
        "id": "...",
        "type": "RECEPTION_INBOUND",
        "status": "DONE",
        "title": "Réception commande CMD-2025-001",
        "proofs": [...]
      },
      {
        "id": "...",
        "type": "DELIVERY_LAST_MILE",
        "status": "TODO",
        "title": "Livraison locale commande CMD-2025-001"
      }
    ],
    "canTransformToLastMile": false
  }
}
```

---

## 🎯 Scénarios de Test Recommandés

### **Scénario 1: Workflow complet avec coursier interne**
1. ✅ Expédier depuis France
2. ✅ Réceptionner en Guadeloupe (auto-crée tâche RECEPTION)
3. ✅ Transformer en livraison interne (crée livraison + tâche DELIVERY)
4. ✅ Livreur ajoute preuve de livraison
5. ✅ SUB_ADMIN valide la tâche

### **Scénario 2: Workflow avec transporteur externe**
1. ✅ Expédier depuis France
2. ✅ Réceptionner en Guadeloupe
3. ✅ Transformer en livraison externe (crée tâche SHIP)
4. ✅ Marquer comme livré

### **Scénario 3: Gestion des incidents**
1. ✅ Créer une tâche
2. ✅ Marquer statut = ISSUE
3. ✅ SUB_ADMIN réassigne à quelqu'un d'autre
4. ✅ Nouveau assigné complète et ajoute preuves
5. ✅ SUB_ADMIN valide

---

## 🚨 Tests de Sécurité

### Test 1: STAFF_PREPA ne peut pas créer de tâches
```bash
# Se connecter comme STAFF_PREPA
POST /api/auth/login
{
  "email": "prepa@neoserv.com",
  "password": "Prepa123!"
}

# Essayer de créer une tâche (doit échouer avec 403)
POST /api/tasks
Authorization: Bearer TOKEN_STAFF_PREPA
{...}

# Résultat attendu: 403 Forbidden
```

### Test 2: DELIVERY ne voit que ses tâches
```bash
# Se connecter comme livreur
GET /api/tasks
Authorization: Bearer TOKEN_DELIVERY

# Résultat attendu: Seulement les tâches assignées à ce livreur
```

### Test 3: Transformation idempotente
```bash
# Transformer une commande
POST /api/logistics/orders/ORDER_ID/last-mile/transform
{...}

# Essayer de transformer à nouveau (doit échouer)
POST /api/logistics/orders/ORDER_ID/last-mile/transform
{...}

# Résultat attendu: 400 "Cette commande a déjà été transformée"
```

---

## 📊 Vérifications dans la Base de Données

Si tu as accès à la base PostgreSQL:

```sql
-- Vérifier les nouveaux rôles
SELECT email, role FROM users WHERE role IN ('STAFF_PREPA', 'SUB_ADMIN');

-- Vérifier les commandes avec flux logistique
SELECT number, "fulfillmentFlow", "inboundStatus", "lastMileType"
FROM orders
WHERE "fulfillmentFlow" = 'INBOUND_THEN_LAST_MILE';

-- Vérifier les tâches
SELECT id, type, status, title, "assignedToId" FROM tasks;

-- Vérifier les preuves
SELECT * FROM task_proofs;

-- Vérifier les reviews
SELECT * FROM task_reviews;
```

---

## 📱 Interface Web (À venir)

Pour tester l'interface web une fois développée:
1. https://neoserv.fr/dashboard/logistics - Vue d'ensemble SUB_ADMIN
2. https://neoserv.fr/dashboard/tasks - Liste des tâches
3. https://neoserv.fr/dashboard/orders/[ORDER_ID] - Détail commande avec section logistique

---

## ❓ Problèmes Fréquents

### Erreur 401 Unauthorized
- Vérifie que le token est valide
- Renouvelle le token si expiré (POST /api/auth/login)

### Erreur 403 Forbidden
- Vérifie que l'utilisateur a le bon rôle
- SUB_ADMIN pour reviews/réassignations
- ADMIN pour créer des tâches

### Erreur 400 "Commande doit d'abord être réceptionnée"
- Assure-toi que inboundStatus = "RECEIVED" avant transformation

### Erreur 404 "Livreur invalide"
- Vérifie que l'ID du livreur existe
- Vérifie que l'utilisateur a bien le rôle DELIVERY

---

## 📞 Support

Si tu rencontres des problèmes:
1. Vérifie les logs Render: https://dashboard.render.com
2. Consulte les activities: GET /api/activities
3. Vérifie la structure des données dans la base

Bon test ! 🚀
