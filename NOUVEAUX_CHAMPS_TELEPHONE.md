# 📞 Nouveaux Champs de Téléphone pour les Clients

## Modification effectuée le 24 novembre 2025

### 🎯 Objectif
Ajouter plusieurs champs de téléphone optionnels lors de la création et modification de clients dans le système NEOCOM.

---

## 📊 Champs ajoutés au modèle Customer

### Avant (1 seul champ obligatoire)
- `phone` : Téléphone (obligatoire)

### Après (5 champs optionnels)
- `phone` : Téléphone fixe (optionnel)
- `mobile` : Mobile (optionnel)
- `phone2` : Téléphone secondaire (optionnel)
- `fax` : Fax (optionnel)
- `whatsapp` : WhatsApp (optionnel)

---

## 🔧 Modifications techniques

### 1. Base de données (Prisma Schema)

**Fichier** : `/backend/prisma/schema.prisma`

```prisma
model Customer {
  // ... autres champs

  // Contact
  email           String          @unique
  phone           String?
  mobile          String?
  phone2          String?         // Téléphone secondaire
  fax             String?
  whatsapp        String?

  // ... autres champs
}
```

**Migration créée** : `20251124193013_add_additional_phone_fields`

### 2. Frontend - Formulaire de création/modification

**Fichier** : `/frontend/components/CustomerModal.tsx`

#### Interface utilisateur mise à jour :
- Section dédiée "📞 Numéros de téléphone"
- Layout en grille 2 colonnes
- Tous les champs avec placeholders explicites
- Aucun champ de téléphone n'est obligatoire

#### Champs affichés :
1. **Téléphone fixe** : Pour le numéro fixe principal
2. **Mobile** : Pour le portable
3. **Téléphone 2** : Pour un numéro secondaire
4. **Fax** : Pour le numéro de fax
5. **WhatsApp** : Pour le numéro WhatsApp (peut être différent du mobile)

---

## 📝 Utilisation

### Créer un nouveau client

1. Aller sur : http://localhost:3000/dashboard/customers
2. Cliquer sur "Nouveau client"
3. Dans la section "📞 Numéros de téléphone", remplir les champs souhaités :
   - Aucun n'est obligatoire
   - Vous pouvez en remplir un seul, plusieurs, ou aucun
   - Format suggéré : `+33 X XX XX XX XX`

### Exemples de cas d'usage

#### Cas 1 : Client particulier simple
```
Téléphone fixe : [vide]
Mobile : +33 6 12 34 56 78
Téléphone 2 : [vide]
Fax : [vide]
WhatsApp : +33 6 12 34 56 78
```

#### Cas 2 : Entreprise complète
```
Téléphone fixe : +33 1 23 45 67 89
Mobile : +33 6 98 76 54 32
Téléphone 2 : +33 1 23 45 67 90
Fax : +33 1 23 45 67 91
WhatsApp : +33 6 98 76 54 32
```

#### Cas 3 : Client international
```
Téléphone fixe : +1 555 123 4567 (USA)
Mobile : +33 6 12 34 56 78 (France)
Téléphone 2 : [vide]
Fax : [vide]
WhatsApp : +1 555 987 6543 (USA)
```

---

## ✅ Avantages

1. **Flexibilité** : Adaptable à tous types de clients (particuliers, PME, grandes entreprises)
2. **Pas de contrainte** : Aucun champ obligatoire, l'utilisateur choisit
3. **Organisation** : Interface claire avec labels explicites
4. **Multi-canal** : Support de différents moyens de communication (WhatsApp, fax, etc.)
5. **International** : Peut stocker des numéros de tous formats

---

## 🔍 Points d'attention

### Validation
- Aucune validation stricte de format (pour accepter tous types de numéros internationaux)
- Le format est libre : `+33 1 23 45 67 89` ou `01 23 45 67 89` ou `0123456789`

### Recherche
- La recherche de clients fonctionne avec tous les champs de téléphone
- Pour chercher par téléphone dans le dashboard, utiliser n'importe quel numéro

### Export
- Tous les champs de téléphone sont exportés dans les fichiers CSV
- Utile pour les campagnes marketing ou SMS

---

## 📱 Affichage dans l'interface

### Dashboard des clients
Les numéros sont affichés dans l'ordre suivant :
1. Téléphone fixe (si renseigné)
2. Mobile (si renseigné)
3. Autres numéros disponibles via la fiche détaillée

### Fiche client détaillée
Tous les numéros de téléphone sont visibles dans la section "Contact"

---

## 🔄 Rétrocompatibilité

### Clients existants
- Les clients créés avant cette mise à jour conservent leurs données
- Seul le champ `phone` était renseigné auparavant
- Les nouveaux champs sont vides par défaut
- Vous pouvez les compléter en éditant la fiche client

### API Backend
- L'API accepte les nouveaux champs sans modification nécessaire
- Le contrôleur `customer.controller.ts` gère automatiquement tous les champs définis dans le schéma Prisma

---

## 🧪 Test rapide

Pour tester les nouveaux champs :

```bash
# 1. Aller sur le dashboard
http://localhost:3000/dashboard/customers

# 2. Créer un nouveau client
# Cliquer sur "Nouveau client"

# 3. Remplir les informations
Email: test@example.com
Téléphone fixe: +33 1 23 45 67 89
Mobile: +33 6 12 34 56 78
WhatsApp: +33 6 12 34 56 78

# 4. Sauvegarder et vérifier
# Le client doit s'afficher avec tous les numéros
```

---

## 📄 Fichiers modifiés

1. `/backend/prisma/schema.prisma` - Ajout des champs
2. `/backend/prisma/migrations/20251124193013_add_additional_phone_fields/` - Migration SQL
3. `/frontend/components/CustomerModal.tsx` - Formulaire mis à jour

---

## 🚀 Prochaines améliorations possibles

- [ ] Validation de format par pays (optionnel)
- [ ] Indicatif pays automatique (dropdown)
- [ ] Bouton "Appeler" ou "WhatsApp" direct
- [ ] Historique des communications par numéro
- [ ] Import/Export avec mapping des colonnes

---

**Auteur** : Claude Code
**Date** : 24 novembre 2025
**Version NEOCOM** : 2.0.0
