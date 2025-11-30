#!/bin/bash

# Script pour synchroniser le schéma Prisma avec la base de données de production
# À exécuter via Render Shell

echo "🔄 Synchronisation du schéma Prisma avec la base de données de production..."

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL n'est pas défini"
  echo "Assurez-vous que cette variable est configurée dans Render"
  exit 1
fi

echo "✅ DATABASE_URL trouvé"
echo "📊 Base de données: $(echo $DATABASE_URL | sed 's/:[^@]*@/@/g')"

# Générer le client Prisma
echo ""
echo "1️⃣ Génération du client Prisma..."
npx prisma generate
if [ $? -eq 0 ]; then
  echo "✅ Client Prisma généré avec succès"
else
  echo "❌ Erreur lors de la génération du client"
  exit 1
fi

# Synchroniser le schéma avec la base de données
echo ""
echo "2️⃣ Synchronisation du schéma avec la base de données..."
npx prisma db push --accept-data-loss
if [ $? -eq 0 ]; then
  echo "✅ Schéma synchronisé avec succès"
else
  echo "❌ Erreur lors de la synchronisation"
  exit 1
fi

# Vérifier que le champ searchTerms existe maintenant
echo ""
echo "3️⃣ Vérification..."
psql $DATABASE_URL -c "\d products" | grep searchTerms
if [ $? -eq 0 ]; then
  echo "✅ Le champ searchTerms est présent dans la table products"
else
  echo "⚠️  Le champ searchTerms n'est peut-être pas visible, mais la synchronisation est terminée"
fi

echo ""
echo "🎉 Synchronisation terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Redémarrer l'application Render"
echo "   2. Vérifier que l'API fonctionne : curl https://neoserv-backend.onrender.com/health"
echo "   3. Tester l'API products : curl https://neoserv-backend.onrender.com/api/shop/products"
