# 👑 Guide de Gestion des Rôles et Utilisateurs

## Pour les Administrateurs NEOSERV

---

## 📍 Accès à la gestion des utilisateurs

**URL** : http://localhost:3000/dashboard/users

**Connexion requise** : Administrateur uniquement

```
Email : admin@neoserv.com
Mot de passe : Admin123!
```

---

## 🎯 Fonctionnalités disponibles

### 1. Vue d'ensemble des utilisateurs

La page affiche :
- **Statistiques** : Total, Admins, Commerciaux, Livreurs, Comptables, Actifs
- **Liste complète** de tous les utilisateurs avec leurs informations
- **Filtres** par rôle pour trouver rapidement un type d'utilisateur

### 2. Informations affichées par utilisateur

| Colonne | Description |
|---------|-------------|
| **Utilisateur** | Photo de profil, nom complet, téléphone |
| **Email** | Adresse email de connexion |
| **Rôle** | Badge coloré indiquant le rôle |
| **Statut** | Actif, Inactif ou Suspendu |
| **Dernière connexion** | Date de la dernière connexion |
| **Actions** | Boutons Modifier et Activer/Désactiver |

---

## 🔐 Les 5 rôles disponibles

### 1. 👑 ADMINISTRATEUR (ADMIN)

**Badge** : Violet

**Accès complet** :
- ✅ Gestion de tous les utilisateurs et leurs rôles
- ✅ Accès à toutes les fonctionnalités
- ✅ Voir les données de tous les commerciaux
- ✅ Comptabilité et finances complètes
- ✅ Paramètres système
- ✅ Import/Export de données
- ✅ Peut se connecter en tant que n'importe quel rôle

**Cas d'usage** : Direction, IT, Super-admin

---

### 2. 💼 COMMERCIAL

**Badge** : Bleu

**Accès limité** :
- ✅ Gestion de SES clients uniquement
- ✅ Création de devis et commandes pour ses clients
- ✅ Suivi de ses propres performances
- ✅ Accès à la carte commerciale (ses clients)
- ❌ Ne voit PAS les clients des autres commerciaux
- ❌ Pas d'accès à la comptabilité
- ❌ Pas de modification des paramètres système

**Cas d'usage** : Commerciaux terrain, VRP, Agents commerciaux

---

### 3. 🚚 LIVREUR (DELIVERY)

**Badge** : Vert

**Accès très limité** :
- ✅ Voir les commandes à livrer
- ✅ Mise à jour du statut de livraison
- ✅ Suivi GPS des tournées
- ✅ Scanner de codes-barres
- ❌ Pas d'accès aux prix et marges
- ❌ Pas de création de commandes
- ❌ Pas d'accès à la comptabilité

**Cas d'usage** : Personnel de livraison, chauffeurs, livreurs

---

### 4. 📊 COMPTABLE (ACCOUNTANT)

**Badge** : Orange

**Accès spécialisé** :
- ✅ Module de comptabilité complet
- ✅ Gestion des factures (client et fournisseur)
- ✅ Rapports financiers
- ✅ Export comptable
- ✅ Déclarations TVA
- ❌ Pas de création de commandes
- ❌ Pas de gestion clients
- ❌ Pas de modification des paramètres système

**Cas d'usage** : Service comptabilité, experts-comptables, DAF

---

### 5. 👤 CLIENT

**Badge** : Gris

**Accès minimal** :
- ✅ Suivi de SES commandes uniquement
- ✅ Historique d'achats personnel
- ✅ Téléchargement de ses factures
- ✅ Mise à jour de son profil
- ❌ Pas d'accès au back-office
- ❌ Pas de vue sur les autres clients

**Cas d'usage** : Clients finaux avec un compte dans le système

**Note** : Les clients utilisent normalement l'espace client (http://localhost:3000/client) avec authentification par email.

---

## 📝 Comment modifier le rôle d'un utilisateur

### Étape 1 : Accéder à la gestion
1. Connectez-vous en tant qu'admin
2. Allez dans le menu **"👤 Gestion Utilisateurs"**

### Étape 2 : Trouver l'utilisateur
- Utilisez les **filtres par rôle** en haut de la page
- Ou parcourez la liste complète

### Étape 3 : Modifier
1. Cliquez sur **"Modifier"** dans la colonne Actions
2. Une fenêtre s'ouvre avec les informations de l'utilisateur

### Étape 4 : Changer le rôle
1. Dans le menu déroulant **"Rôle"**, sélectionnez le nouveau rôle :
   - Administrateur
   - Commercial
   - Livreur
   - Comptable
   - Client

2. Modifiez également le **statut** si nécessaire :
   - Actif : Peut se connecter
   - Inactif : Ne peut plus se connecter
   - Suspendu : Temporairement bloqué

3. Cliquez sur **"Enregistrer"**

### Étape 5 : Vérification
- Le changement est **immédiat**
- L'utilisateur doit se **reconnecter** pour que les nouveaux droits soient appliqués
- Vous verrez le nouveau badge de rôle dans la liste

---

## ⚡ Actions rapides

### Activer/Désactiver un utilisateur

Sans ouvrir le formulaire de modification :
1. Cliquez directement sur **"Activer"** ou **"Désactiver"** dans la colonne Actions
2. Le statut change instantanément
3. L'utilisateur ne peut plus se connecter s'il est désactivé

**Cas d'usage** :
- Employé en congé : Désactiver temporairement
- Employé qui quitte l'entreprise : Désactiver définitivement
- Nouveau compte à valider : Passer de Inactif à Actif

---

## 🎨 Code couleur des badges

| Rôle | Couleur | Signification |
|------|---------|---------------|
| Administrateur | 🟣 Violet | Accès total |
| Commercial | 🔵 Bleu | Ventes et clients |
| Livreur | 🟢 Vert | Livraisons |
| Comptable | 🟠 Orange | Finances |
| Client | ⚪ Gris | Accès minimal |

| Statut | Couleur | Signification |
|--------|---------|---------------|
| Actif | 🟢 Vert | Compte actif |
| Inactif | 🔴 Rouge | Compte désactivé |
| Suspendu | 🟡 Jaune | Bloqué temporairement |

---

## 🔒 Sécurité et bonnes pratiques

### ⚠️ Règles importantes

1. **Principe du moindre privilège**
   - N'attribuez que les droits nécessaires
   - Un commercial ne doit pas avoir accès admin juste pour "faciliter"

2. **Gestion des admins**
   - Limitez le nombre d'administrateurs
   - Gardez une trace de qui a accès admin
   - Recommandé : 2-3 admins maximum

3. **Rotation des commerciaux**
   - Si un commercial change de secteur, réassignez ses clients
   - Désactivez le compte en cas de départ

4. **Comptables**
   - Le rôle comptable a accès aux données financières sensibles
   - Attribuez-le uniquement au personnel financier autorisé

5. **Mots de passe**
   - Encouragez l'utilisation de mots de passe forts
   - Changez les mots de passe par défaut immédiatement

---

## 🆘 Scénarios courants

### Scénario 1 : Nouveau commercial embauché

**Problème** : Un nouveau commercial vient d'être embauché.

**Solution** :
1. L'admin crée un nouveau compte via l'API ou demande au commercial de s'inscrire
2. L'admin va dans Gestion Utilisateurs
3. Trouve le nouveau compte (statut: Inactif)
4. Clique sur "Modifier"
5. Sélectionne le rôle "Commercial"
6. Change le statut à "Actif"
7. Enregistre

**Résultat** : Le commercial peut se connecter et gérer ses clients.

---

### Scénario 2 : Commercial promu manager

**Problème** : Un commercial devient responsable et a besoin d'accès complet.

**Solution** :
1. Aller dans Gestion Utilisateurs
2. Trouver le commercial
3. Cliquer sur "Modifier"
4. Changer le rôle de "Commercial" → "Administrateur"
5. Enregistrer

**Résultat** : L'ancien commercial a maintenant tous les droits d'un admin.

---

### Scénario 3 : Employé en congé longue durée

**Problème** : Un commercial part 6 mois en congé parental.

**Solution** :
1. Désactiver son compte (clic rapide sur "Désactiver")
2. Réassigner ses clients à un autre commercial (via Gestion Clients)
3. À son retour, cliquer sur "Activer"

**Résultat** : Le compte est préservé mais inaccessible pendant l'absence.

---

### Scénario 4 : Employé qui quitte l'entreprise

**Problème** : Un employé démissionne.

**Solution** :
1. Désactiver immédiatement son compte
2. Réassigner tous ses clients
3. **Ne pas supprimer** le compte (important pour l'historique)
4. Changer le statut à "Inactif" définitivement

**Résultat** : L'historique des actions est préservé, mais le compte est inutilisable.

---

### Scénario 5 : Donner accès temporaire au comptable

**Problème** : L'expert-comptable externe a besoin d'accès pour la clôture annuelle.

**Solution** :
1. Créer un compte temporaire
2. Attribuer le rôle "Comptable"
3. Statut "Actif"
4. Après la clôture, passer le statut à "Inactif"

**Résultat** : Accès temporaire aux données comptables sans compromettre la sécurité.

---

## 📊 Statistiques et surveillance

### Tableau de bord des utilisateurs

La page affiche en temps réel :
- **Total** : Nombre total d'utilisateurs
- **Par rôle** : Répartition par type
- **Actifs** : Combien de comptes sont utilisables

**Utilisez ces statistiques pour** :
- Surveiller la croissance de l'équipe
- Vérifier qu'il n'y a pas trop d'admins
- S'assurer que les anciens comptes sont bien désactivés

---

## 🔍 Filtres et recherche

### Filtres disponibles

Cliquez sur les boutons en haut de la page :
- **Tous** : Affiche tous les utilisateurs
- **Administrateur** : Uniquement les admins
- **Commercial** : Uniquement les commerciaux
- **Livreur** : Uniquement les livreurs
- **Comptable** : Uniquement les comptables

**Astuce** : Utilisez les filtres pour :
- Vérifier qui a accès admin
- Compter le nombre de commerciaux actifs
- Trouver rapidement un type d'utilisateur

---

## 🚨 Avertissements de sécurité

### ⛔ NE JAMAIS

1. **Partager les identifiants admin**
   - Chaque admin doit avoir son propre compte
   - Ne partagez jamais `admin@neoserv.com`

2. **Donner accès admin "par facilité"**
   - Si quelqu'un a besoin d'un accès, créez le rôle approprié
   - N'utilisez pas admin comme solution de contournement

3. **Supprimer un utilisateur avec de l'historique**
   - Désactivez plutôt que de supprimer
   - La suppression efface l'historique des actions

4. **Oublier de désactiver les anciens comptes**
   - Créez une procédure de départ d'employé
   - Désactivez immédiatement les comptes des partants

---

## 📞 Support et questions

Pour toute question sur la gestion des rôles :

- **Documentation technique** : `/ARCHITECTURE_LIAISONS.md`
- **Identifiants de test** : `/IDENTIFIANTS_TEST.md`
- **Support** : support@neoserv.com

---

## 🎓 Formation recommandée pour les admins

### Checklist de formation

Avant de gérer les utilisateurs, assurez-vous de comprendre :

- [x] Les 5 types de rôles et leurs différences
- [x] Comment modifier un rôle
- [x] La différence entre Désactiver et Supprimer
- [x] Le principe du moindre privilège
- [x] Comment réassigner les clients d'un commercial
- [x] Les implications sécuritaires de chaque rôle

---

**Dernière mise à jour** : 24 novembre 2025
**Version NEOSERV** : 2.0.0
**Auteur** : Claude Code
