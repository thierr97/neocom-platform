#!/bin/bash

# Script pour débloquer tous les trajets IN_PROGRESS
# Nécessite un token d'administrateur

echo "🔓 Déblocage des trajets IN_PROGRESS..."
echo ""

# Token admin (se connecter avec admin@neoserv.com / admin123 pour obtenir le token)
read -p "Entrez le token admin: " TOKEN

curl -X POST https://neocom-backend.onrender.com/api/trips/fix-active \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | json_pp

echo ""
echo "✨ Terminé !"
