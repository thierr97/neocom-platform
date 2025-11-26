# Guide de Déploiement NEOSERV Platform

Ce guide vous accompagne pour mettre en ligne votre plateforme NEOSERV.

## 🎯 Architecture de Déploiement

- **Backend + PostgreSQL**: Railway
- **Frontend**: Vercel

## 📦 Étape 1: Déployer le Backend sur Railway

### 1.1 Créer un compte Railway
1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "Start a New Project"
3. Connectez-vous avec GitHub

### 1.2 Déployer le backend
1. Dans Railway, cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Autorisez Railway à accéder à vos repos GitHub
4. Sélectionnez le repo `neoserv-platform`
5. Railway détectera automatiquement le projet

### 1.3 Ajouter PostgreSQL
1. Dans votre projet Railway, cliquez sur "+ New"
2. Sélectionnez "Database" > "Add PostgreSQL"
3. Railway créera automatiquement une base de données
4. La variable `DATABASE_URL` sera automatiquement injectée

### 1.4 Configurer les variables d'environnement

Dans Railway, allez dans l'onglet "Variables" et ajoutez:

```env
# Base de données (déjà fournie automatiquement)
DATABASE_URL=postgresql://...

# JWT Secrets (générez des clés aléatoires sécurisées)
JWT_SECRET=votre_jwt_secret_tres_long_et_securise_ici
JWT_REFRESH_SECRET=votre_refresh_secret_tres_long_et_securise_ici

# Application
NODE_ENV=production
PORT=4000

# CORS (ajoutez l'URL de votre frontend Vercel après l'étape 2)
FRONTEND_URL=https://votre-app.vercel.app

# Stripe (si vous utilisez les paiements)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASS=votre_mot_de_passe
EMAIL_FROM=noreply@neoserv.com
</env>
```

### 1.5 Configurer le build

Railway détectera automatiquement le `railway.json`, mais vous pouvez vérifier:
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npx prisma migrate deploy && node dist/index.js`

### 1.6 Déployer
1. Cliquez sur "Deploy" dans Railway
2. Attendez que le build se termine (2-3 minutes)
3. Notez l'URL de votre API (ex: `https://neoserv-backend.up.railway.app`)

### 1.7 Seed la base de données
Une fois déployé, allez dans l'onglet "Deployments" > "View Logs" et exécutez:
```bash
npx ts-node prisma/seed-accounting.ts
```

## 🌐 Étape 2: Déployer le Frontend sur Vercel

### 2.1 Préparer le frontend
1. Ouvrez le terminal dans le dossier frontend
2. Créez un fichier `.env.production`:

```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/frontend
```

Créez `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://votre-backend.up.railway.app/api
```

### 2.2 Installer Vercel CLI
```bash
npm install -g vercel
```

### 2.3 Se connecter à Vercel
```bash
vercel login
```

### 2.4 Déployer
```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/frontend
vercel --prod
```

Suivez les instructions:
- **Set up and deploy**: Yes
- **Which scope**: Votre compte
- **Link to existing project**: No
- **Project name**: neoserv-platform
- **Directory**: ./
- **Override settings**: No

### 2.5 Configurer les variables d'environnement sur Vercel

Sur le dashboard Vercel:
1. Allez dans votre projet
2. Settings > Environment Variables
3. Ajoutez:
   - `NEXT_PUBLIC_API_URL`: URL de votre backend Railway

## 🔄 Étape 3: Finaliser la configuration

### 3.1 Mettre à jour CORS sur Railway
Retournez dans Railway > Variables et mettez à jour:
```env
FRONTEND_URL=https://votre-app.vercel.app
```

### 3.2 Tester le déploiement
1. Visitez votre URL Vercel
2. Essayez de vous connecter
3. Créez une facture pour tester la comptabilité automatique

## 🔒 Sécurité Post-Déploiement

### Variables d'environnement sensibles à changer:
1. **JWT_SECRET**: Générez avec `openssl rand -base64 64`
2. **JWT_REFRESH_SECRET**: Générez avec `openssl rand -base64 64`
3. **Mots de passe admin**: Changez-les immédiatement

### HTTPS
- Railway et Vercel fournissent automatiquement HTTPS
- Aucune configuration supplémentaire nécessaire

## 📊 Monitoring

### Railway
- Logs en temps réel dans l'onglet "Deployments"
- Métriques dans l'onglet "Metrics"

### Vercel
- Analytics dans l'onglet "Analytics"
- Logs dans l'onglet "Deployments"

## 🚀 Mises à jour continues

### Déploiement automatique
Les deux plateformes sont configurées pour le déploiement continu:
- **Push sur main/master** → Déploiement automatique
- Les migrations Prisma s'exécutent automatiquement

### Déploiement manuel
```bash
# Frontend
cd frontend && vercel --prod

# Backend se redéploie automatiquement via Railway
```

## 💰 Coûts

### Plan Gratuit
- **Railway**: $5 de crédit gratuit/mois (largement suffisant pour démarrer)
- **Vercel**: Illimité pour les projets personnels

### Mise à l'échelle
Quand votre app grandit:
- **Railway**: ~$10-20/mois pour production
- **Vercel**: Gratuit jusqu'à 100GB de bande passante

## 🆘 Problèmes courants

### Backend ne démarre pas
- Vérifiez les logs Railway
- Assurez-vous que `DATABASE_URL` est définie
- Vérifiez que les migrations Prisma ont réussi

### Frontend ne se connecte pas au backend
- Vérifiez `NEXT_PUBLIC_API_URL` dans Vercel
- Vérifiez que le CORS est configuré avec la bonne URL frontend
- Vérifiez les logs du backend

### Base de données vide
- Exécutez le seed: `npx ts-node prisma/seed-accounting.ts`
- Créez un utilisateur admin manuellement si nécessaire

## 📞 Support

Pour toute question:
1. Vérifiez les logs (Railway/Vercel)
2. Consultez la documentation Railway/Vercel
3. Contactez le support technique

---

**Félicitations! 🎉 Votre plateforme NEOSERV est maintenant en ligne!**
