# 🚀 Guide de Déploiement Rapide - NEOCOM Platform

## ⏱️ Temps estimé: 15-20 minutes

---

## 📋 Étape 1: Préparer GitHub (5 min)

### 1.1 Créer un dépôt GitHub
1. Allez sur [github.com](https://github.com)
2. Cliquez sur "New repository"
3. Nom: `neocom-platform`
4. **Cochez "Public"** (ou Private si vous préférez)
5. **NE PAS** initialiser avec README
6. Cliquez "Create repository"

### 1.2 Pousser votre code
```bash
cd /Users/thierrycyrillefrancillette/neocom-platform

# Ajoutez l'origine GitHub (remplacez VOTRE_USERNAME)
git remote add origin https://github.com/VOTRE_USERNAME/neocom-platform.git

# Poussez votre code
git push -u origin master
```

✅ Votre code est maintenant sur GitHub!

---

## 🚂 Étape 2: Déployer le Backend sur Railway (7 min)

### 2.1 Créer un compte
1. Allez sur [railway.app](https://railway.app)
2. Cliquez "Login" → "Login with GitHub"
3. Autorisez Railway à accéder à vos repos

### 2.2 Créer un nouveau projet
1. Cliquez "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez `neocom-platform`
4. Railway commencera automatiquement le déploiement

### 2.3 Ajouter PostgreSQL
1. Dans votre projet Railway, cliquez "+ New"
2. Sélectionnez "Database"
3. Choisissez "Add PostgreSQL"
4. ✅ La base de données est créée!

### 2.4 Configurer les variables d'environnement

Dans Railway, cliquez sur votre service backend → Variables:

**Variables OBLIGATOIRES:**
```env
NODE_ENV=production
PORT=4000

# JWT Secrets (IMPORTANT: Utilisez les vôtres depuis PRODUCTION_SECRETS.txt)
JWT_SECRET=QHaxe0muw69j3n9RSCOIl/AzvuaFZc7TJaxd1rnnQsxSHgM74n+GYEsTAxc/H/v9go6PxZ3+fXtI8HUWghj5Zw==
JWT_REFRESH_SECRET=zcRUo7TxYtuUjf9a5taA0Sy0FiWOqcKUd+yuh7Mp1l/1CMs4T7wXEBhRsRieGZZoQ5MXFbVgjjWApSerhs3WLw==

# CORS (mettre à jour après le déploiement Vercel)
FRONTEND_URL=https://votre-app.vercel.app
```

**Note**: `DATABASE_URL` est ajoutée automatiquement par Railway!

### 2.5 Configurer le Root Directory
1. Dans Settings → "Root Directory"
2. Entrez: `/backend`
3. Cliquez "Update"

### 2.6 Redéployer
1. Cliquez sur "Deployments"
2. Cliquez "Redeploy" sur le dernier déploiement
3. Attendez 2-3 minutes

### 2.7 Noter l'URL du backend
1. Allez dans Settings → "Networking"
2. Cliquez "Generate Domain"
3. **Notez cette URL**: `https://votre-backend.up.railway.app`

✅ Votre backend est en ligne!

---

## 🎨 Étape 3: Déployer le Frontend sur Vercel (5 min)

### 3.1 Installer Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Se connecter
```bash
vercel login
```
Suivez les instructions (vérifiez votre email)

### 3.3 Créer le fichier .env.production
```bash
cd /Users/thierrycyrillefrancillette/neocom-platform/frontend

# Créez le fichier avec votre URL Railway
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://votre-backend.up.railway.app/api
EOF
```

⚠️ **IMPORTANT**: Remplacez `votre-backend.up.railway.app` par l'URL Railway de l'étape 2.7!

### 3.4 Déployer
```bash
vercel --prod
```

Répondez aux questions:
- Set up and deploy: **Yes**
- Which scope: **Votre compte**
- Link to existing project: **No**
- Project name: **neocom-platform** (ou laissez par défaut)
- In which directory is your code located: **./**
- Want to override settings: **No**

### 3.5 Noter l'URL du frontend
Vercel affichera: `✅ Production: https://neocom-platform-xxx.vercel.app`

**Notez cette URL!**

✅ Votre frontend est en ligne!

---

## 🔄 Étape 4: Finaliser (3 min)

### 4.1 Mettre à jour CORS sur Railway
1. Retournez sur Railway
2. Allez dans Variables
3. Modifiez `FRONTEND_URL` avec votre URL Vercel
4. Exemple: `FRONTEND_URL=https://neocom-platform-xxx.vercel.app`

### 4.2 Seed la base de données
Sur Railway:
1. Allez dans votre service backend
2. Cliquez sur "Deployments"
3. Ouvrez le dernier déploiement
4. Cliquez sur "View Logs"
5. En haut, cliquez sur l'icône terminal
6. Exécutez:
```bash
npx ts-node prisma/seed-accounting.ts
```

✅ Comptabilité initialisée!

---

## 🎉 C'est terminé! Testez votre application

### Accédez à votre application
Visitez: `https://votre-app.vercel.app`

### Créez un compte admin
1. Cliquez sur "S'inscrire"
2. Créez un compte
3. Connectez-vous

### Testez la comptabilité automatique
1. Allez dans "Factures"
2. Créez une facture de vente
3. Allez dans "Comptabilité" → "Validation"
4. Vous devriez voir l'écriture automatique en brouillon! ✨

---

## 📊 URLs à conserver

Backend Railway: _______________________________________________

Frontend Vercel: _______________________________________________

Database: *(visible dans Railway)*

---

## 🔧 Commandes utiles

### Voir les logs du backend
```bash
# Sur Railway Dashboard → Deployments → View Logs
```

### Redéployer après des modifications
```bash
# Backend: push sur GitHub → déploiement automatique
git add .
git commit -m "Update"
git push

# Frontend: redéployer manuellement
cd frontend
vercel --prod
```

### Accéder à la base de données
```bash
# Sur Railway Dashboard → PostgreSQL → Connect
```

---

## ⚠️ Important - Après le premier déploiement

1. **Changez les mots de passe** des comptes de test
2. **Vérifiez les secrets JWT** (dans PRODUCTION_SECRETS.txt)
3. **Configurez HTTPS uniquement** (activé par défaut)
4. **Testez tous les modules** (factures, commandes, comptabilité)

---

## 🆘 Problèmes courants

### Backend ne démarre pas
- Vérifiez que Root Directory = `/backend` dans Railway
- Vérifiez les variables d'environnement
- Consultez les logs Railway

### Frontend ne se connecte pas
- Vérifiez `NEXT_PUBLIC_API_URL` dans Vercel
- Vérifiez `FRONTEND_URL` dans Railway
- Testez l'URL backend directement: `https://votre-backend.up.railway.app/health`

### "Comptes comptables manquants"
- Exécutez le seed: `npx ts-node prisma/seed-accounting.ts`

---

## 💡 Prochaines étapes

Une fois déployé:
1. 📧 Configurez l'email (SMTP) pour les notifications
2. 💳 Configurez Stripe pour les paiements
3. 👥 Créez les comptes utilisateurs
4. 🎨 Personnalisez les couleurs/logo
5. 📱 Testez sur mobile

---

**Besoin d'aide?** Consultez `DEPLOYMENT.md` pour le guide détaillé.

**Bravo! 🎊 Votre plateforme NEOCOM est en ligne!**
