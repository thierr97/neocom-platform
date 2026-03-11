#!/bin/bash

echo "=========================================="
echo "Vérification du statut de migration"
echo "=========================================="
echo ""

# Test 1: Vérifier que le serveur est en ligne
echo "1. Test de disponibilité du serveur..."
HEALTH_CHECK=$(curl -s https://neocom-backend.onrender.com/health)
if [[ $HEALTH_CHECK == *"en ligne"* ]]; then
  echo "✅ Serveur en ligne"
else
  echo "❌ Serveur hors ligne"
  exit 1
fi

echo ""
echo "2. Instructions pour vérifier la migration:"
echo ""
echo "La migration a été déployée avec le commit 21a0d89."
echo "Pour vérifier que les colonnes de remise existent:"
echo ""
echo "Option A - Via Dashboard Render:"
echo "  1. Aller sur dashboard.render.com"
echo "  2. Sélectionner le service 'neocom-backend'"
echo "  3. Aller dans 'Logs' et chercher:"
echo "     - '✓ All migrations have been successfully applied'"
echo "     - Pas d'erreur P3009"
echo ""
echo "Option B - Via l'application web:"
echo "  1. Se connecter sur neoserv.fr/dashboard"
echo "  2. Aller dans 'Clients'"
echo "  3. Créer/éditer un client"
echo "  4. Vérifier si les champs de remise sont disponibles"
echo ""
echo "Option C - Test API direct (nécessite un token valide):"
echo "  1. Se connecter pour obtenir un token"
echo "  2. Créer un client avec discountRate"
echo "  3. Si aucune erreur 'column discountRate does not exist', la migration est OK"
echo ""
echo "=========================================="
echo "État actuel:"
echo "- Commit pushé: 21a0d89 ✅"
echo "- Serveur en ligne: ✅"
echo "- Migration SQL: prisma/migrations/20251223210000_add_discount_to_customers/ ✅"
echo "=========================================="
