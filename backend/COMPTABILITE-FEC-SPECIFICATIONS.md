# Système de Comptabilité Complète avec FEC

## 📋 Vue d'ensemble

Système de gestion comptable automatisé conforme aux normes françaises avec génération automatique d'écritures comptables pour chaque action commerciale et export/import FEC.

## 🎯 Objectifs

1. **Conformité FEC** : Export/Import du fichier FEC obligatoire
2. **Automatisation** : Génération automatique d'écritures pour chaque action
3. **Traçabilité** : Lien entre chaque document commercial et son écriture comptable
4. **Intégrité** : Validation et équilibrage automatique des écritures
5. **Rapports** : Génération automatique des états comptables obligatoires

---

## 📊 Structure du FEC (Fichier des Écritures Comptables)

### Champs obligatoires (18 colonnes séparées par |)

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
```

### Détail des champs

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| JournalCode | AN | Oui | Code journal (VE=Ventes, AC=Achats, BQ=Banque, etc.) |
| JournalLib | AN | Oui | Libellé du journal |
| EcritureNum | AN | Oui | Numéro unique de l'écriture |
| EcritureDate | Date | Oui | Date de comptabilisation (YYYYMMDD) |
| CompteNum | AN | Oui | Numéro de compte général (ex: 411000) |
| CompteLib | AN | Oui | Libellé du compte général |
| CompAuxNum | AN | Non | Numéro de compte auxiliaire (client/fournisseur) |
| CompAuxLib | AN | Non | Libellé du compte auxiliaire |
| PieceRef | AN | Oui | Référence de la pièce justificative |
| PieceDate | Date | Oui | Date de la pièce (YYYYMMDD) |
| EcritureLib | AN | Oui | Libellé de l'écriture |
| Debit | Montant | Non | Montant au débit (avec 2 décimales) |
| Credit | Montant | Non | Montant au crédit (avec 2 décimales) |
| EcritureLet | AN | Non | Code de lettrage (pour rapprochements) |
| DateLet | Date | Non | Date de lettrage |
| ValidDate | Date | Oui | Date de validation (YYYYMMDD) |
| Montantdevise | Montant | Non | Montant en devise étrangère |
| Idevise | AN | Non | Code devise ISO (EUR pour euro) |

---

## 🏗️ Architecture Technique

### 1. Modifications du Schéma Prisma

```prisma
// Ajout des champs FEC au modèle AccountingEntry
model AccountingEntry {
  // ... champs existants ...

  // Champs FEC spécifiques
  journalCode    String              // VE, AC, BQ, OD, etc.
  journalLabel   String              // "Ventes", "Achats", etc.
  pieceRef       String?             // FAC-2024-001, etc.
  pieceDate      DateTime?           // Date du document source
  validationDate DateTime?           // Date de validation
  lettrage       String?             // Code de lettrage
  lettrageDate   DateTime?           // Date de lettrage

  // Tiers (client ou fournisseur)
  thirdPartyCode  String?            // Code auxiliaire
  thirdPartyLabel String?            // Nom client/fournisseur
  customerId      String?
  customer        Customer?          @relation(fields: [customerId], references: [id])
  supplierId      String?
  supplier        Supplier?          @relation(fields: [supplierId], references: [id])
}

// Ajout des champs FEC au modèle AccountingEntryLine
model AccountingEntryLine {
  // ... champs existants ...

  // Devise
  amountCurrency Float?              // Montant en devise
  currency       String?              // Code devise (EUR, USD, etc.)
}

// Nouveau modèle pour l'historique FEC
model FECExport {
  id          String   @id @default(uuid())
  filename    String   // fec_SIREN_YYYYMMDD_HHMMSS.txt
  siren       String   // 9 chiffres
  startDate   DateTime // Date début période
  endDate     DateTime // Date fin période
  format      String   @default("txt") // txt ou csv
  filePath    String?  // Chemin du fichier généré
  status      String   @default("PENDING") // PENDING, COMPLETED, ERROR

  // Statistiques
  totalEntries    Int?
  totalLines      Int?
  totalDebit      Float?
  totalCredit     Float?

  // Métadonnées
  createdBy   String?
  createdAt   DateTime @default(now())

  @@map("fec_exports")
}
```

### 2. Services à créer

#### a) **FECService** (`backend/src/services/fec.service.ts`)
- Génération du fichier FEC
- Import de fichier FEC
- Validation du format FEC
- Conversion des écritures au format FEC

#### b) **AutomaticEntriesService** (`backend/src/services/automatic-entries.service.ts`)
- Génération automatique d'écritures pour chaque action
- Hooks sur les événements (vente, achat, paiement, etc.)
- Schémas d'écritures prédéfinis

#### c) **ReconciliationService** (`backend/src/services/reconciliation.service.ts`)
- Lettrage automatique des écritures
- Rapprochement bancaire
- Gestion des impayés

---

## 🔄 Génération Automatique d'Écritures

### Actions Déclenchant des Écritures Automatiques

#### 1. **Vente Client (Facture)**

**Événement** : Création d'une facture
**Journal** : VE (Ventes)
**Écriture** :
```
Débit   411XXX (Clients)                    = Montant TTC
Crédit  707000 (Ventes de marchandises)     = Montant HT
Crédit  445710 (TVA collectée)              = Montant TVA
```

#### 2. **Achat Fournisseur (Facture d'achat)**

**Événement** : Création d'une facture fournisseur
**Journal** : AC (Achats)
**Écriture** :
```
Débit   607000 (Achats de marchandises)     = Montant HT
Débit   445660 (TVA déductible)             = Montant TVA
Crédit  401XXX (Fournisseurs)               = Montant TTC
```

#### 3. **Encaissement Client**

**Événement** : Paiement reçu d'un client
**Journal** : BQ (Banque)
**Écriture** :
```
Débit   512000 (Banque)                     = Montant payé
Crédit  411XXX (Client)                     = Montant payé
```

#### 4. **Paiement Fournisseur**

**Événement** : Paiement à un fournisseur
**Journal** : BQ (Banque)
**Écriture** :
```
Débit   401XXX (Fournisseur)                = Montant payé
Crédit  512000 (Banque)                     = Montant payé
```

#### 5. **Avoir Client (Note de crédit)**

**Événement** : Création d'un avoir
**Journal** : VE (Ventes)
**Écriture** :
```
Débit   707000 (Ventes de marchandises)     = Montant HT
Débit   445710 (TVA collectée)              = Montant TVA
Crédit  411XXX (Client)                     = Montant TTC
```

#### 6. **Mouvement de Stock**

**Événement** : Entrée de stock
**Journal** : OD (Opérations diverses)
**Écriture** :
```
Débit   370000 (Stock de marchandises)      = Coût d'achat
Crédit  603700 (Variation de stock)         = Coût d'achat
```

#### 7. **Salaires et Charges Sociales**

**Événement** : Paiement de salaire
**Journal** : OD (Opérations diverses)
**Écriture** :
```
Débit   641000 (Rémunérations du personnel) = Salaire brut
Débit   645000 (Charges sociales)           = Charges patronales
Crédit  421000 (Personnel - rémunérations)  = Net à payer
Crédit  431000 (Sécurité sociale)           = Charges totales
```

---

## 📁 Structure des Fichiers à Créer

```
backend/
├── src/
│   ├── services/
│   │   ├── fec.service.ts                    # Export/Import FEC
│   │   ├── automatic-entries.service.ts      # Génération auto écritures
│   │   ├── reconciliation.service.ts         # Lettrage/Rapprochement
│   │   └── accounting-hooks.service.ts       # Hooks événements
│   ├── controllers/
│   │   └── fec.controller.ts                 # Routes FEC
│   ├── routes/
│   │   └── fec.routes.ts                     # Endpoints FEC
│   ├── utils/
│   │   ├── fec-validator.ts                  # Validation format FEC
│   │   ├── fec-formatter.ts                  # Formatage FEC
│   │   └── accounting-rules.ts               # Règles comptables
│   └── types/
│       └── fec.types.ts                      # Types TypeScript FEC
│
├── prisma/
│   └── migrations/
│       └── add_fec_fields/                   # Migration BDD
│
└── templates/
    └── accounting/
        ├── fec-template.txt                  # Template FEC
        └── entry-schemas.json                # Schémas d'écritures

frontend/
└── app/
    └── dashboard/
        └── accounting/
            ├── fec/
            │   ├── export/
            │   │   └── page.tsx              # Page export FEC
            │   └── import/
            │       └── page.tsx              # Page import FEC
            ├── reconciliation/
            │   └── page.tsx                  # Page lettrage
            └── automatic-entries/
                └── page.tsx                  # Config écritures auto
```

---

## 🚀 Plan d'Implémentation

### Phase 1 : Fondations (Jour 1)
1. ✅ Modifier le schéma Prisma (ajouter champs FEC)
2. ✅ Créer les migrations
3. ✅ Créer les types TypeScript FEC

### Phase 2 : Service FEC (Jour 2-3)
1. ✅ FECService : Export FEC complet
2. ✅ FECService : Import FEC
3. ✅ Validation format FEC
4. ✅ Tests unitaires

### Phase 3 : Écritures Automatiques (Jour 4-5)
1. ✅ AutomaticEntriesService : Base
2. ✅ Hook sur facture client
3. ✅ Hook sur facture fournisseur
4. ✅ Hook sur paiements
5. ✅ Hook sur avoirs
6. ✅ Hook sur mouvements de stock

### Phase 4 : Lettrage & Rapprochement (Jour 6)
1. ✅ ReconciliationService
2. ✅ Lettrage automatique
3. ✅ Rapprochement bancaire

### Phase 5 : Frontend (Jour 7-8)
1. ✅ Page export FEC
2. ✅ Page import FEC
3. ✅ Configuration écritures automatiques
4. ✅ Page lettrage/rapprochement

### Phase 6 : Tests & Documentation (Jour 9-10)
1. ✅ Tests d'intégration complets
2. ✅ Documentation utilisateur
3. ✅ Formation équipe

---

## 🔐 Sécurité et Conformité

### Obligations légales
- Conservation FEC pendant 6 ans minimum
- Inaltérabilité des données comptables
- Traçabilité complète des modifications
- Archivage sécurisé

### Contrôles automatiques
- Vérification équilibre débit/crédit
- Validation numérotation séquentielle
- Contrôle cohérence dates
- Détection doublons

### Audit trail
- Log de toutes les opérations comptables
- Historique des modifications
- Identification utilisateur pour chaque action

---

## 📊 Exemples de Codes Journal

| Code | Libellé | Utilisation |
|------|---------|-------------|
| VE | Ventes | Factures clients |
| AC | Achats | Factures fournisseurs |
| BQ | Banque | Mouvements bancaires |
| CA | Caisse | Mouvements de caisse |
| OD | Opérations diverses | Écritures diverses |
| AN | À-nouveaux | Reprise soldes N-1 |

---

## 📈 KPIs et Reporting

### Indicateurs à suivre
- Nombre d'écritures générées automatiquement
- Taux d'équilibrage automatique
- Délai moyen de validation
- Nombre d'écritures manuelles vs automatiques
- Taux de lettrage automatique

### Rapports automatiques
- Grand livre
- Balance générale
- Compte de résultat
- Bilan comptable
- Journal centralisateur
- Balance âgée clients/fournisseurs

---

## 🎓 Formation Utilisateur

### Modules de formation
1. Principes de base comptabilité française
2. Utilisation de l'interface comptable
3. Export/Import FEC
4. Validation et contrôle des écritures
5. Rapprochement bancaire
6. Clôture mensuelle et annuelle

---

## 📞 Support

Pour toute question sur l'implémentation :
- Documentation complète : `/docs/accounting/`
- Exemples FEC : `/templates/accounting/examples/`
- FAQ : `/docs/accounting/faq.md`

---

**Version** : 1.0
**Date** : 2025-01-09
**Statut** : En cours d'implémentation
