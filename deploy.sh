#!/bin/bash

# Script de déploiement NEOCOM Platform
# Ce script vous guide à travers le processus de déploiement

echo "🚀 NEOCOM Platform - Script de Déploiement"
echo "=========================================="
echo ""

# Vérifier si git est initialisé
if [ ! -d ".git" ]; then
    echo "❌ Git n'est pas initialisé. Initialisation..."
    git init
    git add .
    git commit -m "Initial commit - NEOCOM Platform"
    echo "✅ Git initialisé"
fi

echo "📋 Étapes de déploiement:"
echo ""
echo "1️⃣  BACKEND (Railway)"
echo "   → https://railway.app"
echo "   → New Project > Deploy from GitHub"
echo "   → Ajoutez PostgreSQL"
echo "   → Configurez les variables d'environnement"
echo ""

echo "2️⃣  FRONTEND (Vercel)"
echo "   → Installez Vercel CLI: npm install -g vercel"
echo "   → Exécutez: cd frontend && vercel --prod"
echo ""

echo "📖 Pour plus de détails, consultez DEPLOYMENT.md"
echo ""

read -p "Voulez-vous installer Vercel CLI maintenant? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installé"
fi

echo ""
read -p "Voulez-vous déployer le frontend sur Vercel maintenant? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Déploiement du frontend..."
    cd frontend

    # Vérifier si .env.production existe
    if [ ! -f ".env.production" ]; then
        echo "⚠️  Fichier .env.production manquant!"
        echo "📝 Créez .env.production avec:"
        echo "   NEXT_PUBLIC_API_URL=https://votre-backend.up.railway.app/api"
        read -p "Appuyez sur Entrée quand c'est fait..."
    fi

    vercel --prod
    cd ..
    echo "✅ Frontend déployé!"
fi

echo ""
echo "🎉 Déploiement terminé!"
echo ""
echo "📝 N'oubliez pas de:"
echo "   1. Configurer les variables d'environnement sur Railway"
echo "   2. Mettre à jour FRONTEND_URL dans Railway avec votre URL Vercel"
echo "   3. Seed la base de données avec: npx ts-node prisma/seed-accounting.ts"
echo "   4. Changer les secrets JWT en production"
echo ""
echo "📖 Documentation complète: DEPLOYMENT.md"
