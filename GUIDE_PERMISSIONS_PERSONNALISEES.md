# 🔐 Guide du Système de Permissions Personnalisées

## Pour les Administrateurs NEOSERV

**Date de création** : 24 novembre 2025
**Version NEOSERV** : 2.0.0

---

## 📍 Vue d'ensemble

Le système de permissions personnalisées permet aux administrateurs de contrôler **exactement** quelles sections de l'application chaque utilisateur peut voir et utiliser, **indépendamment de leur rôle**.

### Avant vs Après

**Avant** :
- Un commercial avait accès à TOUTES les fonctionnalités d'un commercial
- Pas de granularité fine
- Impossible de restreindre l'accès à certaines sections spécifiques

**Après** :
- Un administrateur peut sélectionner précisément quelles sections un utilisateur peut voir
- Contrôle section par section
- Flexibilité maximale pour chaque utilisateur

---

## 🎯 Accès au système de permissions

1. **Connexion** : Connectez-vous en tant qu'administrateur
   - Email : `admin@neoserv.com`
   - Mot de passe : `Admin123!`

2. **Navigation** : Allez dans **"👤 Gestion Utilisateurs"**
   - URL : http://localhost:3000/dashboard/users

3. **Édition** : Cliquez sur **"Modifier"** pour un utilisateur

4. **Permissions** : Cliquez sur **"▼ Afficher"** dans la section "Permissions d'accès"

---

## 🔧 Les 14 sections configurables

Chaque utilisateur peut avoir accès (ou non) aux sections suivantes :

| Section | Icône | Description |
|---------|-------|-------------|
| **Dashboard** | 📊 | Page d'accueil avec statistiques générales |
| **Clients** | 👥 | Gestion des clients (prospects, actifs, inactifs) |
| **Commandes** | 🛒 | Suivi et gestion des commandes |
| **Devis** | 📄 | Création et gestion des devis |
| **Factures** | 💳 | Facturation client |
| **Produits** | 📦 | Catalogue produits |
| **Fournisseurs** | 🏭 | Gestion des fournisseurs |
| **Comptabilité** | 💰 | Module comptable complet |
| **Statistiques** | 📈 | Analyses et rapports |
| **GPS / Livraisons** | 🗺️ | Suivi GPS et tournées |
| **Gestion Utilisateurs** | 👤 | Administration des utilisateurs (Admin uniquement recommandé) |
| **Paramètres** | ⚙️ | Configuration système |
| **Import / Export** | 📤 | Import et export de données |
| **Boutique en ligne** | 🛍️ | Gestion de la boutique e-commerce |

---

## 📝 Comment configurer les permissions d'un utilisateur

### Étape 1 : Ouvrir l'édition

1. Dans la **Gestion Utilisateurs**, trouvez l'utilisateur à modifier
2. Cliquez sur le bouton **"Modifier"**
3. Une fenêtre modale s'ouvre

### Étape 2 : Afficher les permissions

1. Faites défiler jusqu'à la section **"Permissions d'accès"**
2. Cliquez sur **"▼ Afficher"**
3. Une grille de 14 cases à cocher apparaît

### Étape 3 : Sélectionner les permissions

Vous avez plusieurs options :

#### Option A : Sélection manuelle
- Cochez les cases des sections auxquelles l'utilisateur doit avoir accès
- Les cases cochées sont **bleues** (accès autorisé)
- Les cases décochées sont **grises** (accès refusé)

#### Option B : Raccourcis rapides
- **"✓ Tout sélectionner"** : Active toutes les permissions
- **"✗ Tout désélectionner"** : Désactive toutes les permissions

### Étape 4 : Sauvegarder

1. Cliquez sur **"Enregistrer"**
2. Les permissions sont sauvegardées immédiatement
3. L'utilisateur doit **se reconnecter** pour que les changements prennent effet

---

## 🎨 Interface de sélection

### Visuel

Chaque permission est représentée par une **carte cliquable** :

```
┌─────────────────────────────────┐
│ ☑️  📊  Dashboard               │  <- Activé (fond bleu)
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ☐  👥  Clients                  │  <- Désactivé (fond gris)
└─────────────────────────────────┘
```

### États visuels

| État | Apparence | Signification |
|------|-----------|---------------|
| ✅ Coché + Fond bleu | Bordure bleue épaisse | Accès **autorisé** |
| ☐ Décoché + Fond blanc | Bordure grise fine | Accès **refusé** |

---

## 💡 Cas d'usage pratiques

### Cas 1 : Commercial terrain limité

**Contexte** : Un commercial qui ne doit gérer que ses clients et créer des devis.

**Configuration** :
- ✅ Dashboard
- ✅ Clients
- ✅ Devis
- ❌ Commandes
- ❌ Factures
- ❌ Produits
- ❌ Fournisseurs
- ❌ Comptabilité
- ❌ Statistiques
- ❌ GPS / Livraisons
- ❌ Gestion Utilisateurs
- ❌ Paramètres
- ❌ Import / Export
- ❌ Boutique en ligne

**Résultat** : Le commercial voit uniquement Dashboard, Clients et Devis dans le menu.

---

### Cas 2 : Gestionnaire de stock

**Contexte** : Un employé qui gère uniquement les produits et fournisseurs.

**Configuration** :
- ✅ Dashboard
- ❌ Clients
- ❌ Commandes
- ❌ Devis
- ❌ Factures
- ✅ Produits
- ✅ Fournisseurs
- ❌ Comptabilité
- ❌ Statistiques
- ❌ GPS / Livraisons
- ❌ Gestion Utilisateurs
- ❌ Paramètres
- ✅ Import / Export (pour importer des catalogues)
- ❌ Boutique en ligne

**Résultat** : Vue limitée à la gestion de stock.

---

### Cas 3 : Commercial senior avec accès étendu

**Contexte** : Un commercial expérimenté qui a besoin d'accès aux statistiques et peut gérer les commandes.

**Configuration** :
- ✅ Dashboard
- ✅ Clients
- ✅ Commandes
- ✅ Devis
- ✅ Factures
- ✅ Produits (consultation uniquement)
- ❌ Fournisseurs
- ❌ Comptabilité
- ✅ Statistiques
- ❌ GPS / Livraisons
- ❌ Gestion Utilisateurs
- ❌ Paramètres
- ❌ Import / Export
- ❌ Boutique en ligne

**Résultat** : Accès complet aux fonctions commerciales + analyses.

---

### Cas 4 : Livreur avec GPS uniquement

**Contexte** : Un livreur qui doit seulement voir ses tournées.

**Configuration** :
- ✅ Dashboard (juste pour voir l'accueil)
- ❌ Clients
- ❌ Commandes
- ❌ Devis
- ❌ Factures
- ❌ Produits
- ❌ Fournisseurs
- ❌ Comptabilité
- ❌ Statistiques
- ✅ GPS / Livraisons
- ❌ Gestion Utilisateurs
- ❌ Paramètres
- ❌ Import / Export
- ❌ Boutique en ligne

**Résultat** : Menu minimaliste avec uniquement le GPS.

---

### Cas 5 : Stagiaire en formation

**Contexte** : Un stagiaire qui observe mais ne doit pas modifier de données critiques.

**Configuration** :
- ✅ Dashboard
- ✅ Clients (consultation uniquement via les permissions de son rôle CLIENT)
- ✅ Commandes (consultation)
- ✅ Devis (consultation)
- ✅ Factures (consultation)
- ✅ Produits (consultation)
- ❌ Fournisseurs
- ❌ Comptabilité
- ✅ Statistiques
- ❌ GPS / Livraisons
- ❌ Gestion Utilisateurs
- ❌ Paramètres
- ❌ Import / Export
- ❌ Boutique en ligne

**Résultat** : Accès en lecture seule aux principales sections.

---

## 🔒 Bonnes pratiques de sécurité

### ⚠️ Règles importantes

1. **Principe du moindre privilège**
   - N'activez que les permissions **strictement nécessaires**
   - Demandez-vous : "Cet utilisateur a-t-il VRAIMENT besoin de cette section ?"

2. **Gestion Utilisateurs = Admin uniquement**
   - ⚠️ Ne donnez JAMAIS accès à "Gestion Utilisateurs" à un non-admin
   - Cela permettrait à l'utilisateur de modifier ses propres permissions !

3. **Comptabilité = Personnel financier uniquement**
   - Données sensibles (marges, coûts, bénéfices)
   - Réservé aux comptables et directeurs financiers

4. **Paramètres = Admin ou IT uniquement**
   - Peut affecter le fonctionnement global de l'application
   - Risque de configuration incorrecte

5. **Import / Export = Utilisez avec prudence**
   - Risque de fuite de données via export
   - Risque d'erreur via import massif
   - Recommandé pour les admins et gestionnaires de stock uniquement

---

## 🔄 Interaction Rôles vs Permissions

### Comment ça marche ?

Le système fonctionne avec **2 niveaux de contrôle** :

1. **Niveau Rôle** (ADMIN, COMMERCIAL, LIVREUR, etc.)
   - Définit les **actions possibles** dans chaque section
   - Exemple : Un COMMERCIAL peut créer des devis, un LIVREUR non

2. **Niveau Permissions** (ce nouveau système)
   - Définit **quelles sections sont visibles**
   - Exemple : On peut cacher la section "Devis" même à un COMMERCIAL

### Matrice de décision

```
┌─────────────────────────────────────────────────────┐
│ Permission désactivée → Section INVISIBLE           │
│ Permission activée + Rôle insuffisant → LECTURE     │
│ Permission activée + Rôle suffisant → MODIFICATION  │
└─────────────────────────────────────────────────────┘
```

### Exemples

**Exemple 1** :
- Rôle : COMMERCIAL
- Permission "Clients" : ❌ Désactivée
- **Résultat** : Section "Clients" **invisible** dans le menu

**Exemple 2** :
- Rôle : COMMERCIAL
- Permission "Clients" : ✅ Activée
- **Résultat** : Section "Clients" **visible**, l'utilisateur peut **modifier** ses clients

**Exemple 3** :
- Rôle : CLIENT (rôle basique)
- Permission "Statistiques" : ✅ Activée
- **Résultat** : Section "Statistiques" **visible**, mais l'utilisateur peut seulement **consulter** (car son rôle CLIENT n'a pas les droits de modification)

---

## 🛠️ Fonctionnement technique

### Backend

**Base de données** :
- Nouveau champ `permissions` dans la table `users`
- Type : JSON
- Contenu : `{"dashboard": true, "customers": false, ...}`

**API Endpoints** :
- `GET /api/users/:id/permissions` - Récupérer les permissions
- `PUT /api/users/:id/permissions` - Modifier les permissions

**Exemple de réponse** :
```json
{
  "success": true,
  "data": {
    "dashboard": true,
    "customers": true,
    "orders": false,
    "quotes": true,
    // ...
  }
}
```

### Frontend

**Hook React** : `usePermissions()`
```typescript
import { usePermissions } from '@/lib/usePermissions';

const { permissions, hasPermission, loading } = usePermissions();

if (hasPermission('customers')) {
  // Afficher le lien "Clients"
}
```

**Composant** : `Dashboard Layout`
- Charge les permissions au démarrage
- Masque les liens de menu pour les sections non autorisées
- L'utilisateur ne voit que ce à quoi il a accès

---

## 🚨 Dépannage

### Problème 1 : Les permissions ne s'appliquent pas

**Symptôme** : J'ai modifié les permissions mais l'utilisateur voit toujours les mêmes sections.

**Solution** :
1. L'utilisateur doit **se déconnecter**
2. Puis **se reconnecter**
3. Les permissions sont chargées au login

**Vérification** :
```bash
# Vérifier les permissions en base de données
psql neoserv_db
SELECT id, email, permissions FROM users WHERE email = 'commercial@neoserv.com';
```

---

### Problème 2 : Toutes les sections sont visibles par défaut

**Symptôme** : Un nouvel utilisateur voit toutes les sections.

**Cause** : Aucune permission n'est définie pour cet utilisateur.

**Solution** :
- **Par conception**, si aucune permission n'est définie, tout est activé par défaut
- Allez modifier l'utilisateur et configurez ses permissions

**Pourquoi ?** :
- Évite de bloquer accidentellement un utilisateur
- Compatible avec les anciens utilisateurs créés avant ce système

---

### Problème 3 : Un utilisateur ne peut plus accéder à rien

**Symptôme** : L'utilisateur se connecte mais ne voit aucun menu.

**Cause** : Toutes les permissions ont été désactivées.

**Solution** :
1. Connectez-vous en tant qu'admin
2. Allez dans Gestion Utilisateurs
3. Modifiez l'utilisateur
4. Cliquez sur **"✓ Tout sélectionner"**
5. Enregistrez
6. Demandez à l'utilisateur de se reconnecter

---

### Problème 4 : Le backend retourne une erreur 500

**Symptôme** : Erreur lors de la sauvegarde des permissions.

**Solution** :
```bash
# Régénérer le client Prisma
cd backend
npx prisma generate

# Vérifier que la migration est appliquée
npx prisma migrate status

# Si nécessaire, appliquer la migration
npx prisma migrate deploy
```

---

## 📊 Migration des utilisateurs existants

### Pour les utilisateurs créés AVANT ce système

Tous les utilisateurs existants **conservent un accès complet** par défaut.

**Si vous voulez appliquer des restrictions** :
1. Allez dans Gestion Utilisateurs
2. Pour chaque utilisateur, cliquez sur "Modifier"
3. Configurez ses permissions
4. Enregistrez

### Script de migration (optionnel)

Si vous voulez définir des permissions par défaut pour tous les utilisateurs d'un certain rôle :

```typescript
// backend/scripts/set-default-permissions.ts
import prisma from '../src/config/database';

async function setDefaultPermissionsForCommercials() {
  const commercials = await prisma.user.findMany({
    where: { role: 'COMMERCIAL' }
  });

  const commercialPermissions = {
    dashboard: true,
    customers: true,
    orders: true,
    quotes: true,
    invoices: true,
    products: true,
    suppliers: false,
    accounting: false,
    statistics: false,
    gps: false,
    users: false,
    settings: false,
    import_export: false,
    shop: false,
  };

  for (const commercial of commercials) {
    await prisma.user.update({
      where: { id: commercial.id },
      data: { permissions: commercialPermissions }
    });
  }

  console.log(`✅ Permissions définies pour ${commercials.length} commerciaux`);
}

setDefaultPermissionsForCommercials();
```

Exécution :
```bash
npx ts-node backend/scripts/set-default-permissions.ts
```

---

## 🎓 Formation recommandée

Avant de gérer les permissions, assurez-vous de comprendre :

- [x] Les 5 types de rôles (ADMIN, COMMERCIAL, DELIVERY, ACCOUNTANT, CLIENT)
- [x] La différence entre rôle et permission
- [x] Le principe du moindre privilège
- [x] Comment ouvrir et modifier les permissions d'un utilisateur
- [x] Que les changements nécessitent une reconnexion
- [x] Les sections sensibles (Gestion Utilisateurs, Comptabilité, Paramètres)

---

## 📞 Support

### Documentation liée

- **Gestion des rôles** : `/GUIDE_GESTION_ROLES.md`
- **Identifiants de test** : `/IDENTIFIANTS_TEST.md`
- **Architecture** : `/ARCHITECTURE_LIAISONS.md`

### En cas de problème

- Vérifiez que le backend est démarré sur le port 4000
- Vérifiez que la base de données PostgreSQL est accessible
- Consultez les logs du backend : `cd backend && npm run dev`
- Consultez les logs du frontend : `cd frontend && npm run dev`

---

## 🔮 Évolutions futures possibles

- [ ] Permissions au niveau des actions (créer, modifier, supprimer, consulter)
- [ ] Templates de permissions par rôle
- [ ] Historique des modifications de permissions
- [ ] Expiration temporaire de permissions
- [ ] Permissions basées sur des conditions (horaires, IP, etc.)
- [ ] Export / Import de configurations de permissions

---

**Dernière mise à jour** : 24 novembre 2025
**Version NEOSERV** : 2.0.0
**Auteur** : Claude Code

---

## ✅ Checklist rapide

### Pour configurer les permissions d'un utilisateur :

1. [ ] Me connecter en tant qu'admin
2. [ ] Aller dans "👤 Gestion Utilisateurs"
3. [ ] Cliquer sur "Modifier" pour l'utilisateur
4. [ ] Cliquer sur "▼ Afficher" dans "Permissions d'accès"
5. [ ] Cocher/décocher les sections selon les besoins
6. [ ] Cliquer sur "Enregistrer"
7. [ ] Demander à l'utilisateur de se reconnecter

✅ C'est fait !
