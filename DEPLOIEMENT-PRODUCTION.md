# 🚀 Déploiement en Production

## 📅 Date : 30 Novembre 2025

## ✅ Statut du déploiement

### Frontend (Vercel) ✅
- **URL** : https://frontend-29ttmk9m5-thierr97s-projects.vercel.app
- **Statut** : ✅ Déployé avec succès
- **Build** : Réussi (Build time: 52s)
- **Commit** : `feat: Menu accordéon et produits dans sous-catégories uniquement`

### Backend (Render) 🔄
- **URL** : https://neoserv-backend.onrender.com
- **Statut** : 🔄 En cours de déploiement
- **Commit** : Poussé vers GitHub (master)
- **Action requise** : Synchroniser le schéma Prisma

## 🔧 Actions requises pour terminer le déploiement

### Étape 1 : Attendre le déploiement Render
Le backend se redéploie automatiquement après le push GitHub. Cela peut prendre 2-5 minutes.

**Vérifier le statut** :
```bash
curl https://neoserv-backend.onrender.com/health
```

**Attendu** :
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### Étape 2 : Synchroniser le schéma Prisma avec la BD production

⚠️ **IMPORTANT** : Cette étape est nécessaire car le champ `searchTerms` a été ajouté au schéma Prisma.

#### Option A : Via Render Shell (Recommandé)

1. **Se connecter à Render Dashboard** : https://dashboard.render.com
2. **Sélectionner le service** : `neoserv-backend`
3. **Ouvrir le Shell** : Cliquer sur "Shell" dans le menu
4. **Exécuter le script** :
   ```bash
   chmod +x sync-schema-production.sh
   ./sync-schema-production.sh
   ```

#### Option B : Commande manuelle

Si le script ne fonctionne pas, exécutez directement :

```bash
# Via Render Shell
npx prisma generate
npx prisma db push --accept-data-loss
```

**⚠️ Note** : `--accept-data-loss` est utilisé car nous ajoutons un champ avec une valeur par défaut. Aucune donnée ne sera perdue.

### Étape 3 : Vérifier que l'API fonctionne

Une fois le déploiement et la synchronisation terminés :

```bash
# Test 1 : Health check
curl https://neoserv-backend.onrender.com/health

# Test 2 : API categories (doit retourner les catégories + sous-catégories)
curl https://neoserv-backend.onrender.com/api/shop/categories

# Test 3 : API products (doit retourner une liste, même vide)
curl https://neoserv-backend.onrender.com/api/shop/products
```

**Attendu pour les catégories** :
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Informatique",
      "parentId": null,
      ...
    },
    {
      "id": "...",
      "name": "Ordinateurs Portables",
      "parentId": "...",
      ...
    },
    ...
  ]
}
```

**Attendu pour les produits** :
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

## 🌐 URLs de production

### Frontend
- **Production** : https://frontend-29ttmk9m5-thierr97s-projects.vercel.app
- **Domaine personnalisé** : À configurer si nécessaire (neoserv.fr)

### Backend
- **API Base URL** : https://neoserv-backend.onrender.com
- **Health Check** : https://neoserv-backend.onrender.com/health
- **Shop API** : https://neoserv-backend.onrender.com/api/shop

## 📝 Changements déployés

### Frontend
1. **Menu accordéon dans le shop** (`app/shop/page.tsx`)
   - Les sous-catégories sont cachées par défaut
   - Clic sur catégorie parente = déplier/replier
   - Flèche animée ▶/▼
   - Icône 📁 pour les catégories parentes

2. **Formulaire produit** (`components/ProductModal.tsx`)
   - Seules les sous-catégories sont sélectionnables
   - Catégories parentes affichées comme séparateurs
   - Label "Sous-catégorie *"

### Backend
1. **Schéma Prisma** (`prisma/schema.prisma`)
   - Ajout du champ `searchTerms` (String[])
   - À synchroniser avec la base de données

## 🧪 Tests post-déploiement

### Test 1 : Page Shop
```bash
curl -I https://frontend-29ttmk9m5-thierr97s-projects.vercel.app/shop
# Attendu : 200 OK
```

### Test 2 : Menu accordéon
1. Ouvrir https://frontend-29ttmk9m5-thierr97s-projects.vercel.app/shop
2. Vérifier que les catégories sont affichées avec l'icône 📁
3. Cliquer sur une catégorie parente
4. Vérifier que les sous-catégories se déplient

### Test 3 : Formulaire produit
1. Se connecter au dashboard
2. Aller dans "Produits" > "Nouveau produit"
3. Vérifier que le champ "Sous-catégorie *" affiche :
   - Les catégories parentes comme séparateurs (━━ Nom ━━)
   - Les sous-catégories comme options (↳ Nom)
4. Vérifier qu'on ne peut pas sélectionner une catégorie parente

### Test 4 : API Backend
```bash
# Via terminal ou navigateur
curl https://neoserv-backend.onrender.com/api/shop/categories | jq
curl https://neoserv-backend.onrender.com/api/shop/products | jq
```

## ⚠️ Problèmes connus et solutions

### Problème 1 : Backend Render retourne "Error"
**Cause** : Cold start ou erreur de build
**Solution** :
1. Attendre 30-60 secondes (cold start)
2. Vérifier les logs dans Render Dashboard
3. Si erreur persistante, vérifier que la synchronisation du schéma est faite

### Problème 2 : Erreur "searchTerms does not exist"
**Cause** : Le schéma Prisma n'est pas synchronisé avec la BD
**Solution** : Exécuter `npx prisma db push` via Render Shell (voir Étape 2)

### Problème 3 : Frontend ne se connecte pas au backend
**Cause** : Variable d'environnement NEXT_PUBLIC_API_URL incorrecte
**Solution** :
```bash
# Vérifier la variable dans Vercel
vercel env ls

# Si nécessaire, mettre à jour
vercel env add NEXT_PUBLIC_API_URL production
# Valeur : https://neoserv-backend.onrender.com/api
```

## 📊 Monitoring

### Vérifier les logs
**Frontend (Vercel)** :
```bash
vercel logs https://frontend-29ttmk9m5-thierr97s-projects.vercel.app
```

**Backend (Render)** :
- Aller sur https://dashboard.render.com
- Sélectionner `neoserv-backend`
- Cliquer sur "Logs"

## 🔄 Rollback (si nécessaire)

Si un problème critique survient :

### Frontend
```bash
cd ~/neoserv-platform/frontend
# Redéployer le commit précédent
vercel --prod --yes
```

### Backend
1. Aller sur Render Dashboard
2. Sélectionner `neoserv-backend`
3. Aller dans "Manual Deploy" > "Deploy Previous Commit"
4. Sélectionner le commit précédent

## ✅ Checklist finale

Avant de considérer le déploiement comme terminé :

- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Render
- [ ] Schéma Prisma synchronisé avec la BD production
- [ ] Health check backend répond 200 OK
- [ ] API categories retourne les catégories + sous-catégories
- [ ] API products ne retourne pas d'erreur
- [ ] Page shop s'affiche correctement
- [ ] Menu accordéon fonctionne (déplier/replier)
- [ ] Formulaire produit affiche uniquement les sous-catégories
- [ ] Tests manuels réussis

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs (Vercel + Render)
2. Vérifier que DATABASE_URL est configuré dans Render
3. Vérifier que NEXT_PUBLIC_API_URL est configuré dans Vercel
4. Consulter la documentation : `IMPLEMENTATION-COMPLETE.md`
5. Contacter l'administrateur technique

---

**Statut actuel** : 🔄 En cours
**Frontend** : ✅ Déployé
**Backend** : 🔄 Action requise (synchronisation schéma)
**Date** : 30 Novembre 2025 23:30 UTC
