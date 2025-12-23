#!/bin/bash

# Script de test pour l'API de remises commerciales

API_URL="https://neocom-backend.onrender.com/api"

echo "========================================="
echo "TEST DU SYSTÈME DE REMISES COMMERCIALES"
echo "========================================="
echo ""

# Étape 1: Login
echo "1. Connexion avec le compte commercial..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"commercial@neoserv.com","password":"Commercial123!"}')

echo "Réponse: $LOGIN_RESPONSE"
echo ""

# Extraire le token (si présent)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Impossible de se connecter"
  echo "Essayons avec admin@neoserv.com..."

  LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@neoserv.com","password":"Admin123!"}')

  echo "Réponse: $LOGIN_RESPONSE"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

  if [ -z "$TOKEN" ]; then
    echo "❌ Erreur: Impossible de se connecter avec admin non plus"
    exit 1
  fi
fi

echo "✅ Connexion réussie!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Étape 2: Créer un client avec remise
echo "2. Création d'un client avec remise de 10%..."
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Remise",
    "email": "test.remise@example.com",
    "phone": "+33612345678",
    "companyName": "Test Discount SARL",
    "discountRate": 10,
    "discountType": "PERCENTAGE",
    "discountReason": "Test du système de remises",
    "discountValidFrom": "2025-01-01T00:00:00.000Z",
    "discountValidTo": "2025-12-31T23:59:59.999Z"
  }')

echo "Réponse: $CREATE_RESPONSE" | head -c 500
echo ""
echo ""

# Extraire l'ID du client
CUSTOMER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$CUSTOMER_ID" ]; then
  echo "✅ Client créé avec succès! ID: $CUSTOMER_ID"
  echo ""

  # Étape 3: Vérifier que la remise a été appliquée
  echo "3. Vérification des données du client..."
  GET_RESPONSE=$(curl -s "${API_URL}/customers/${CUSTOMER_ID}" \
    -H "Authorization: Bearer $TOKEN")

  echo "Client: $GET_RESPONSE" | head -c 500
  echo ""
  echo ""

  # Étape 4: Modifier la remise
  echo "4. Modification de la remise à 15%..."
  UPDATE_RESPONSE=$(curl -s -X PATCH "${API_URL}/customers/${CUSTOMER_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "discountRate": 15,
      "discountReason": "Remise augmentée pour fidélisation"
    }')

  echo "Réponse: $UPDATE_RESPONSE" | head -c 500
  echo ""
  echo ""

  # Étape 5: Vérifier les activités
  echo "5. Vérification des logs d'activités..."
  ACTIVITIES_RESPONSE=$(curl -s "${API_URL}/activities?customerId=${CUSTOMER_ID}" \
    -H "Authorization: Bearer $TOKEN")

  echo "Activités: $ACTIVITIES_RESPONSE"
  echo ""

else
  echo "❌ Erreur: Client non créé"
  echo "Détails: $CREATE_RESPONSE"
fi

echo ""
echo "========================================="
echo "FIN DES TESTS"
echo "========================================="
