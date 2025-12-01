# 🤖 AI Manager - Gestion Intelligente Automatisée

## Vue d'ensemble

L'AI Manager est un système d'intelligence artificielle intégré à NEOSERV qui permet une gestion automatisée et intelligente du site e-commerce. Il utilise l'API Claude d'Anthropic pour analyser, optimiser et maintenir le site.

## Fonctionnalités

### 1. Analyse de contenu
- ✅ Détection des produits sans description
- ✅ Vérification des informations d'entreprise
- ✅ Optimisation SEO automatique
- ✅ Génération de descriptions de produits

### 2. Gestion d'inventaire
- ✅ Prédiction des ruptures de stock
- ✅ Recommandations de réapprovisionnement
- ✅ Analyse des tendances de vente
- ✅ Calcul des quantités optimales

### 3. Analyse client
- ✅ Détection du risque de churn
- ✅ Segmentation automatique
- ✅ Recommandations de campagnes
- ✅ Analyse du comportement d'achat

### 4. Monitoring du site
- ✅ Vérification de la qualité du contenu
- ✅ Détection des problèmes de performance
- ✅ Surveillance des conversions
- ✅ Optimisation continue

## Configuration

### Variables d'environnement

Ajoutez votre clé API Anthropic dans `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### Installation

```bash
# Backend
cd backend
npm install @anthropic-ai/sdk

# Les routes sont déjà configurées dans src/index.ts
```

## Utilisation

### API Endpoints

Tous les endpoints nécessitent une authentification ADMIN.

#### 1. Statut de l'IA
```bash
GET /api/ai-manager/status
```

Retourne:
```json
{
  "success": true,
  "status": {
    "enabled": true,
    "lastCheck": "2025-12-01T...",
    "pendingTasks": 5,
    "recommendations": ["..."]
  }
}
```

#### 2. Analyse complète
```bash
POST /api/ai-manager/analyze/all
```

Retourne:
```json
{
  "success": true,
  "summary": {
    "total": 15,
    "critical": 2,
    "high": 5,
    "medium": 6,
    "low": 2
  },
  "decisions": [...],
  "categories": {
    "content": 5,
    "inventory": 4,
    "customers": 3,
    "performance": 3
  }
}
```

#### 3. Recommandations intelligentes
```bash
POST /api/ai-manager/recommendations
```

Utilise Claude pour générer des recommandations personnalisées basées sur les statistiques du site.

#### 4. Génération de description produit
```bash
POST /api/ai-manager/product/:productId/description
```

Génère automatiquement une description optimisée pour un produit.

#### 5. Exécution automatique
```bash
POST /api/ai-manager/execute/safe-tasks
```

Exécute automatiquement des tâches sûres:
- Génération de descriptions manquantes
- Mise à jour du contenu
- Monitoring des statistiques

Retourne:
```json
{
  "success": true,
  "executed": 3,
  "results": [
    {
      "task": "generate_description",
      "productId": "...",
      "productName": "...",
      "success": true,
      "description": "..."
    }
  ]
}
```

#### 6. Analyses spécifiques
```bash
POST /api/ai-manager/analyze/content      # Analyse du contenu
POST /api/ai-manager/analyze/inventory    # Analyse d'inventaire
POST /api/ai-manager/analyze/customers    # Analyse clients
POST /api/ai-manager/analyze/performance  # Performance du site
```

## Interface d'administration

Accédez au tableau de bord IA:
```
https://neoserv.fr/admin/ai-manager
```

### Fonctionnalités du tableau de bord

#### 1. Dashboard
- Statut de l'IA en temps réel
- Nombre de tâches en attente
- Dernière vérification
- Actions rapides

#### 2. Analyse complète
- Rapport détaillé de tous les aspects du site
- Priorisation automatique des actions
- Visualisation par catégorie
- Métriques de confiance

#### 3. Recommandations IA
- Conseils personnalisés générés par Claude
- Basés sur les statistiques réelles du site
- Actionnables et chiffrés

#### 4. Exécution automatique
- Lancement manuel de tâches sûres
- Historique des exécutions
- Résultats détaillés

## Exemples d'utilisation

### Cas 1: Mise à jour automatique du contenu

```typescript
// L'IA détecte 10 produits sans description
// Génère automatiquement des descriptions optimisées
// Met à jour la base de données
// Rapport: 10 descriptions générées avec succès
```

### Cas 2: Prévention de rupture de stock

```typescript
// L'IA analyse:
// - Stock actuel: 8 unités
// - Ventes moyennes: 2/jour
// - Délai de réapprovisionnement: 30 jours
//
// Recommandation: Commander 60 unités (priorité: CRITICAL)
// Raisonnement: Stock insuffisant pour 30 jours
```

### Cas 3: Réactivation de clients

```typescript
// L'IA détecte:
// - 45 clients inactifs depuis 90+ jours
// - Historique d'achat moyen: 150€
//
// Recommandation: Campagne de réactivation avec -10%
// Impact estimé: 7-9 clients réactivés (15-20%)
```

## Architecture

```
backend/
├── src/
│   ├── services/
│   │   ├── ai-manager.service.ts    # Logique IA principale
│   │   └── ai.service.ts             # Recommandations produits
│   ├── controllers/
│   │   └── ai-manager.controller.ts  # Endpoints API
│   └── routes/
│       └── ai-manager.routes.ts      # Routes protégées

frontend/
└── app/
    └── admin/
        └── ai-manager/
            └── page.tsx              # Interface admin
```

## Sécurité

- ✅ Authentification obligatoire (rôle ADMIN)
- ✅ Validation des entrées
- ✅ Rate limiting sur l'API
- ✅ Clé API sécurisée (variable d'environnement)
- ✅ Logs d'audit des actions automatiques
- ✅ Confirmation utilisateur pour actions sensibles

## Performance

- ⚡ Analyses en mémoire (< 2s)
- ⚡ Génération Claude (< 5s par description)
- ⚡ Exécution par lots (5 produits/batch)
- ⚡ Cache des recommandations
- ⚡ Requêtes optimisées Prisma

## Limitations actuelles

- 🔸 Nécessite une clé API Anthropic valide
- 🔸 Exécution manuelle (pas encore de cron jobs)
- 🔸 Limite de 5 produits par exécution automatique
- 🔸 Pas de notifications push (prévu v2)

## Roadmap v2

- [ ] Exécution programmée (cron jobs)
- [ ] Notifications email des actions
- [ ] Webhooks pour intégrations
- [ ] Dashboard analytics avancé
- [ ] A/B testing automatique
- [ ] Prédictions de chiffre d'affaires
- [ ] Optimisation automatique des prix
- [ ] Génération d'images avec DALL-E

## Support

Pour toute question ou problème:
- 📧 Email: support@neoserv.fr
- 📞 Téléphone: 0590 25 90 05
- 🌐 Site: https://neoserv.fr

## Licence

© 2024 NEOSERV - Tous droits réservés
