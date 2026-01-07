#!/bin/bash

# Script pour résoudre les problèmes de migrations Prisma
# Utilise prisma migrate resolve pour marquer les migrations échouées comme appliquées

echo "🔧 Résolution des migrations échouées..."

# Marquer la migration discount comme appliquée
echo "Marquage de la migration 20251223210000_add_discount_to_customers comme appliquée..."
npx prisma migrate resolve --applied 20251223210000_add_discount_to_customers

# Vérifier l'état des migrations
echo ""
echo "📊 État des migrations après résolution:"
npx prisma migrate status

# Appliquer les nouvelles migrations
echo ""
echo "🚀 Application des nouvelles migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Résolution terminée!"
