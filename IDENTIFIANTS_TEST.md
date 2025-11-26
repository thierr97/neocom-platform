# 🔐 Identifiants de Test NEOSERV Platform

## 📍 Accès à la Plateforme

**URL principale** : http://localhost:3000 (redirige vers la boutique)
**Page de connexion** : http://localhost:3000/login
**API Backend** : http://localhost:4000

---

## 👥 Comptes Utilisateurs Disponibles

### 1. 👑 ADMINISTRATEUR (Accès complet)

**Type de compte** : Admin principal avec tous les droits
**URL de connexion** : http://localhost:3000/login?role=admin

```
Email    : admin@neoserv.com
Mot de passe : Admin123!
```

**Accès** :
- ✅ Toutes les fonctionnalités du back-office
- ✅ Gestion des utilisateurs et permissions
- ✅ Accès à la comptabilité
- ✅ Statistiques complètes
- ✅ Configuration système
- ✅ Import/Export de données
- ✅ Peut se connecter en tant que n'importe quel rôle

---

### 2. 💼 COMMERCIAL (Back-Office Ventes)

**Type de compte** : Commercial terrain
**URL de connexion** : http://localhost:3000/login?role=commercial

```
Email    : commercial@neoserv.com
Mot de passe : Commercial123!
```

**Accès** :
- ✅ Gestion de SES clients uniquement
- ✅ Création de devis et commandes
- ✅ Suivi des commandes
- ✅ Statistiques personnelles
- ❌ Ne voit PAS les clients des autres commerciaux
- ❌ Pas d'accès à la comptabilité
- ❌ Pas d'accès aux paramètres système

---

### 3. 🚚 LIVREUR (Gestion Livraisons)

**Type de compte** : Personnel de livraison
**URL de connexion** : http://localhost:3000/login?role=delivery

```
Email    : livreur@neoserv.com
Mot de passe : Livreur123!
```

**Accès** :
- ✅ Visualisation des commandes à livrer
- ✅ Mise à jour du statut de livraison
- ✅ Suivi GPS des livraisons
- ✅ Scanner de codes-barres
- ❌ Pas d'accès aux prix et marges
- ❌ Pas d'accès à la comptabilité
- ❌ Pas de création de commandes

---

### 4. 📊 COMPTABLE (Finance & Comptabilité)

**Type de compte** : Service comptabilité
**URL de connexion** : http://localhost:3000/login?role=accountant

```
Email    : comptable@neoserv.com
Mot de passe : Comptable123!
```

**Accès** :
- ✅ Module de comptabilité complet
- ✅ Gestion des factures
- ✅ Factures d'achat fournisseurs
- ✅ Rapports financiers
- ✅ Export comptable
- ❌ Pas de création de commandes
- ❌ Pas de gestion clients
- ❌ Pas d'accès aux paramètres système

---

### 5. 👤 CLIENT (Espace Client Public)

**Type de compte** : Client final (authentification par email)
**URL de connexion** : http://localhost:3000/client

```
Email    : client@example.com
Code envoyé par email (simulation)
```

**Accès** :
- ✅ Suivi de SES commandes uniquement
- ✅ Historique d'achats
- ✅ Téléchargement de factures
- ✅ Informations de compte
- ❌ Pas d'accès au back-office
- ❌ Pas d'accès aux autres clients

**Note** : L'espace client utilise une authentification par email (code de vérification), pas de mot de passe.

---

## 🛒 Accès Public (Sans Connexion)

### Boutique en Ligne

**URL** : http://localhost:3000/shop
**Accès** : Ouvert à tous (aucune connexion requise)

**Fonctionnalités** :
- Parcourir le catalogue produits
- Ajouter au panier
- Passer commande
- Consulter les avis produits
- Laisser un avis (après achat)

---

## 🎯 Guide de Test par Scénario

### Scénario 1 : Test Admin Complet
1. Aller sur http://localhost:3000/login?role=admin
2. Se connecter avec `admin@neoserv.com` / `Admin123!`
3. Explorer toutes les sections du dashboard
4. Tester la gestion des permissions (à venir)

### Scénario 2 : Test Commercial
1. Aller sur http://localhost:3000/login?role=commercial
2. Se connecter avec `commercial@neoserv.com` / `Commercial123!`
3. Créer un nouveau client
4. Créer un devis pour ce client
5. Convertir le devis en commande

### Scénario 3 : Test Livreur
1. Aller sur http://localhost:3000/login?role=delivery
2. Se connecter avec `livreur@neoserv.com` / `Livreur123!`
3. Voir les commandes à livrer
4. Mettre à jour le statut de livraison
5. Scanner un code-barres (si disponible)

### Scénario 4 : Test Comptable
1. Aller sur http://localhost:3000/login?role=accountant
2. Se connecter avec `comptable@neoserv.com` / `Comptable123!`
3. Consulter les factures
4. Générer un rapport comptable
5. Exporter les données

### Scénario 5 : Test Client Final
1. D'abord, faire un achat sur la boutique (http://localhost:3000/shop)
2. Noter l'email utilisé lors de l'achat
3. Aller sur http://localhost:3000/client
4. Entrer l'email et valider avec le code reçu
5. Consulter l'historique de commandes

### Scénario 6 : Test Boutique Publique
1. Aller sur http://localhost:3000 (redirige vers /shop)
2. Parcourir les catégories
3. Ajouter des produits au panier
4. Aller au checkout
5. Passer commande (avec ou sans compte)

---

## 🔄 Réinitialisation des Données de Test

Pour réinitialiser la base de données avec les données de test :

```bash
cd /Users/thierrycyrillefrancillette/neoserv-platform/backend
npx prisma migrate reset
npm run seed
npx ts-node prisma/add-test-users.ts
```

---

## 📱 Application Mobile (Commerciaux)

**Note** : L'application mobile utilise les mêmes identifiants que le back-office.

Les commerciaux peuvent utiliser :
```
Email    : commercial@neoserv.com
Mot de passe : Commercial123!
```

---

## ⚠️ Notes de Sécurité

- Ces identifiants sont **uniquement pour le développement**
- **NE JAMAIS** utiliser ces mots de passe en production
- Changer tous les mots de passe avant le déploiement
- Activer l'authentification à deux facteurs en production

---

## 🆘 Dépannage

### Problème : "Email ou mot de passe incorrect"
- Vérifiez que la base de données a été seedée : `npm run seed`
- Vérifiez que les utilisateurs manquants ont été ajoutés : `npx ts-node prisma/add-test-users.ts`

### Problème : "Accès refusé"
- Vérifiez que vous êtes connecté avec le bon rôle
- L'admin peut accéder à tout, les autres rôles ont des restrictions

### Problème : "Token expiré"
- Reconnectez-vous
- Videz le localStorage du navigateur (F12 > Console > `localStorage.clear()`)

---

## 📞 Support

Pour toute question ou problème :
- Email : support@neoserv.com
- Documentation : /ARCHITECTURE_LIAISONS.md

---

**Dernière mise à jour** : 24 novembre 2025
**Version** : 2.0.0
