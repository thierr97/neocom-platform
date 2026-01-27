#!/bin/bash

# Script de test du système logistique NEOSERV
# Usage: ./test-logistics.sh

API_URL="https://neocom-backend.onrender.com/api"
# Pour test local: API_URL="http://localhost:4000/api"

echo "=========================================="
echo "🧪 TEST SYSTÈME LOGISTIQUE NEOSERV"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Fonction pour attendre
wait_for_deploy() {
    echo -e "${YELLOW}⏳ Attente du déploiement Render (30 secondes)...${NC}"
    sleep 30
}

echo "📋 ÉTAPE 1: Vérification de l'API"
echo "-----------------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/../health")
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ API en ligne${NC}"
else
    echo -e "${RED}❌ API hors ligne (code: $response)${NC}"
    echo "Attente du déploiement..."
    wait_for_deploy
fi
echo ""

echo "🔐 ÉTAPE 2: Connexion Admin"
echo "-----------------------------------"
echo "Email: admin@neoserv.com"
echo "Mot de passe: (utilise ton mot de passe admin)"
echo ""
echo "👉 Récupère ton TOKEN avec cette commande:"
echo ""
echo "curl -X POST $API_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"admin@neoserv.com\",\"password\":\"TON_MOT_DE_PASSE\"}'"
echo ""
read -p "Colle ton TOKEN ici: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ TOKEN manquant. Test arrêté.${NC}"
    exit 1
fi

echo "📦 ÉTAPE 3: Création d'utilisateurs de test"
echo "-----------------------------------"

# 3.1: Créer STAFF_PREPA
echo "Création STAFF_PREPA..."
STAFF_RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prepa@neoserv.com",
    "password": "Prepa123!",
    "firstName": "Marie",
    "lastName": "Préparation",
    "role": "STAFF_PREPA"
  }')

STAFF_ID=$(echo $STAFF_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$STAFF_ID" ]; then
    echo -e "${GREEN}✅ STAFF_PREPA créé (ID: $STAFF_ID)${NC}"
else
    echo -e "${YELLOW}⚠️  STAFF_PREPA existe peut-être déjà${NC}"
    STAFF_ID="staff-prepa-id"
fi

# 3.2: Créer SUB_ADMIN
echo "Création SUB_ADMIN..."
SUBADMIN_RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@neoserv.com",
    "password": "Super123!",
    "firstName": "Jean",
    "lastName": "Superviseur",
    "role": "SUB_ADMIN"
  }')

SUBADMIN_ID=$(echo $SUBADMIN_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$SUBADMIN_ID" ]; then
    echo -e "${GREEN}✅ SUB_ADMIN créé (ID: $SUBADMIN_ID)${NC}"
else
    echo -e "${YELLOW}⚠️  SUB_ADMIN existe peut-être déjà${NC}"
    SUBADMIN_ID="sub-admin-id"
fi

# 3.3: Récupérer un livreur existant
echo "Récupération d'un livreur DELIVERY..."
COURIER_RESPONSE=$(curl -s "$API_URL/users?role=DELIVERY" \
  -H "Authorization: Bearer $TOKEN")

COURIER_ID=$(echo $COURIER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ ! -z "$COURIER_ID" ]; then
    echo -e "${GREEN}✅ Livreur trouvé (ID: $COURIER_ID)${NC}"
else
    echo -e "${RED}❌ Aucun livreur DELIVERY trouvé. Créez-en un via le dashboard.${NC}"
fi
echo ""

echo "📦 ÉTAPE 4: Test des commandes avec flux logistique"
echo "-----------------------------------"

# 4.1: Récupérer une commande existante
echo "Récupération d'une commande..."
ORDERS_RESPONSE=$(curl -s "$API_URL/orders" \
  -H "Authorization: Bearer $TOKEN")

ORDER_ID=$(echo $ORDERS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -z "$ORDER_ID" ]; then
    echo -e "${RED}❌ Aucune commande trouvée. Créez-en une d'abord.${NC}"
    exit 1
fi

ORDER_NUMBER=$(echo $ORDERS_RESPONSE | grep -o '"number":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✅ Commande récupérée: $ORDER_NUMBER (ID: $ORDER_ID)${NC}"
echo ""

echo "🚢 ÉTAPE 5: Test du workflow INBOUND (France → Guadeloupe)"
echo "-----------------------------------"

# 5.1: Marquer la commande comme INBOUND_THEN_LAST_MILE
echo "Mise à jour du flux de la commande..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fulfillmentFlow": "INBOUND_THEN_LAST_MILE"
  }')

echo -e "${GREEN}✅ Commande configurée en flux INBOUND_THEN_LAST_MILE${NC}"

# 5.2: Expédier depuis France
echo "Expédition depuis France..."
SHIP_RESPONSE=$(curl -s -X POST "$API_URL/logistics/orders/$ORDER_ID/inbound/ship" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "carrier": "Chronopost International",
    "trackingNumber": "FR123456789GP",
    "notes": "Palette de 50kg - Fragile"
  }')

echo $SHIP_RESPONSE | grep -q "success.*true"
check_result $? "Expédition depuis France"

# 5.3: Réceptionner en Guadeloupe
echo "Réception en Guadeloupe..."
RECEIVE_RESPONSE=$(curl -s -X POST "$API_URL/logistics/orders/$ORDER_ID/inbound/receive" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proofUrl": "https://example.com/proof-reception.jpg",
    "notes": "Marchandise en bon état - Vérifiée par Marie"
  }')

echo $RECEIVE_RESPONSE | grep -q "success.*true"
check_result $? "Réception en Guadeloupe"
echo ""

echo "🚚 ÉTAPE 6: Test de la transformation en livraison locale"
echo "-----------------------------------"

# 6.1: Transformer en livraison interne
if [ ! -z "$COURIER_ID" ]; then
    echo "Transformation en livraison par coursier interne..."
    TRANSFORM_RESPONSE=$(curl -s -X POST "$API_URL/logistics/orders/$ORDER_ID/last-mile/transform" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"INTERNAL_DRIVER\",
        \"courierId\": \"$COURIER_ID\",
        \"notes\": \"Livraison urgente demain matin\"
      }")

    echo $TRANSFORM_RESPONSE | grep -q "success.*true"
    check_result $? "Transformation en livraison interne"
else
    echo -e "${YELLOW}⚠️  Test livraison interne ignoré (pas de livreur)${NC}"
fi
echo ""

echo "📋 ÉTAPE 7: Test de la gestion des tâches"
echo "-----------------------------------"

# 7.1: Lister les tâches
echo "Récupération des tâches..."
TASKS_RESPONSE=$(curl -s "$API_URL/tasks" \
  -H "Authorization: Bearer $TOKEN")

TASK_COUNT=$(echo $TASKS_RESPONSE | grep -o '"id":"[^"]*' | wc -l)
echo -e "${GREEN}✅ $TASK_COUNT tâches trouvées${NC}"

TASK_ID=$(echo $TASKS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# 7.2: Créer une tâche manuelle
echo "Création d'une tâche manuelle..."
CREATE_TASK_RESPONSE=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"type\": \"RECEPTION_INBOUND\",
    \"title\": \"Vérification qualité produits\",
    \"description\": \"Contrôle qualité après réception\",
    \"assignedToId\": \"$STAFF_ID\"
  }")

NEW_TASK_ID=$(echo $CREATE_TASK_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$NEW_TASK_ID" ]; then
    echo -e "${GREEN}✅ Tâche créée (ID: $NEW_TASK_ID)${NC}"

    # 7.3: Ajouter une preuve
    echo "Ajout d'une preuve à la tâche..."
    PROOF_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$NEW_TASK_ID/proofs" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "type": "PHOTO",
        "fileUrl": "https://example.com/photo-controle.jpg",
        "noteText": "Produits conformes aux attentes"
      }')

    echo $PROOF_RESPONSE | grep -q "success.*true"
    check_result $? "Ajout de preuve"
else
    echo -e "${YELLOW}⚠️  Création de tâche échouée${NC}"
fi
echo ""

echo "📊 ÉTAPE 8: Consultation du statut logistique"
echo "-----------------------------------"
curl -s "$API_URL/logistics/orders/$ORDER_ID/logistics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=========================================="
echo -e "${GREEN}✅ TESTS TERMINÉS${NC}"
echo "=========================================="
echo ""
echo "📖 Résumé des endpoints testés:"
echo "  ✅ POST /api/logistics/orders/:id/inbound/ship"
echo "  ✅ POST /api/logistics/orders/:id/inbound/receive"
echo "  ✅ POST /api/logistics/orders/:id/last-mile/transform"
echo "  ✅ GET  /api/logistics/orders/:id/logistics"
echo "  ✅ GET  /api/tasks"
echo "  ✅ POST /api/tasks"
echo "  ✅ POST /api/tasks/:id/proofs"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Tester les reviews SUB_ADMIN: POST /api/tasks/:id/review"
echo "  2. Tester la réassignation: POST /api/tasks/:id/reassign"
echo "  3. Tester les mises à jour de statut: PATCH /api/tasks/:id/status"
echo ""
echo "📱 Pour tester l'interface web, ouvre:"
echo "  https://neoserv.fr/dashboard/orders/$ORDER_ID"
echo ""
