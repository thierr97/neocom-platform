# Résumé de l'Implémentation - Système FEC

**Date**: 2025-01-09
**Statut**: Phase 1 complétée, Phase 2-5 à implémenter
**Progression**: 15% (Fondations terminées)

---

## ✅ Ce qui a été fait (Phase 1 - Fondations)

### 1. Documents créés

#### a) `COMPTABILITE-FEC-SPECIFICATIONS.md`
Document complet de 450+ lignes contenant:
- Structure complète du format FEC (18 colonnes)
- Architecture technique détaillée
- 7 types d'écritures automatiques documentées
- Plan d'implémentation en 5 phases
- Exemples de codes journal
- Documentation des obligations légales

#### b) `RESUME-IMPLEMENTATION-FEC.md` (ce document)
Guide de reprise et d'avancement du projet

### 2. Modifications du schéma Prisma (`prisma/schema.prisma`)

#### Modèle `AccountingEntry` enrichi avec:
```prisma
// Champs FEC ajoutés
journalCode    String    // VE, AC, BQ, CA, OD, AN
journalLabel   String    // "Ventes", "Achats", etc.
pieceRef       String?   // Référence pièce justificative
pieceDate      DateTime? // Date de la pièce
validationDate DateTime? // Date de validation

// Lettrage
lettrage     String?   // Code lettrage (A, B, C...)
lettrageDate DateTime? // Date du lettrage

// Tiers
thirdPartyCode  String?   // Code auxiliaire client/fournisseur
thirdPartyLabel String?   // Nom du tiers
customerId      String?   // Relation client
customer        Customer?
supplierId      String?   // Relation fournisseur
supplier        Supplier?
```

#### Modèle `AccountingEntryLine` enrichi avec:
```prisma
// Devise (pour opérations en devises étrangères)
amountCurrency Float?  // Montant en devise
currency       String? // Code ISO (EUR, USD, GBP...)
```

#### Nouveau modèle `FECExport`:
```prisma
model FECExport {
  id       String @id @default(uuid())
  filename String // fec_SIREN_YYYYMMDD_HHMMSS.txt
  siren    String // 9 chiffres

  startDate DateTime // Période couverte
  endDate   DateTime

  format   String @default("txt") // txt ou csv
  filePath String?
  status   String @default("PENDING") // PENDING, COMPLETED, ERROR

  // Statistiques
  totalEntries Int?
  totalLines   Int?
  totalDebit   Float?
  totalCredit  Float?

  createdBy String?
  createdAt DateTime @default(now())
}
```

#### Relations ajoutées:
- `Customer.accountingEntries` → `AccountingEntry[]`
- `Supplier.accountingEntries` → `AccountingEntry[]`

---

## 🚧 Prochaines étapes immédiates

### Phase 1 (Suite) - À compléter

#### 1. Créer les migrations Prisma
```bash
cd backend
npx prisma migrate dev --name add_fec_fields
npx prisma generate
```

#### 2. Créer les types TypeScript (`backend/src/types/fec.types.ts`)
```typescript
// Format FEC - 18 colonnes
export interface FECLine {
  JournalCode: string;      // Code journal
  JournalLib: string;       // Libellé journal
  EcritureNum: string;      // Numéro écriture
  EcritureDate: string;     // YYYYMMDD
  CompteNum: string;        // Compte général
  CompteLib: string;        // Libellé compte
  CompAuxNum: string;       // Compte auxiliaire
  CompAuxLib: string;       // Libellé auxiliaire
  PieceRef: string;         // Référence pièce
  PieceDate: string;        // YYYYMMDD
  EcritureLib: string;      // Libellé écriture
  Debit: string;            // Montant débit
  Credit: string;           // Montant crédit
  EcritureLet: string;      // Code lettrage
  DateLet: string;          // Date lettrage YYYYMMDD
  ValidDate: string;        // Date validation YYYYMMDD
  Montantdevise: string;    // Montant devise
  Idevise: string;          // Code devise ISO
}

export interface FECExportOptions {
  startDate: Date;
  endDate: Date;
  siren: string;
  format?: 'txt' | 'csv';
  separator?: '|' | ';' | '\t';
}

export interface FECImportResult {
  success: boolean;
  totalLines: number;
  importedLines: number;
  errors: string[];
  warnings: string[];
}
```

---

## 📅 Plan d'implémentation détaillé

### Phase 2: Service FEC (2-3 jours)

#### Fichiers à créer:

##### 1. `backend/src/services/fec.service.ts`
```typescript
import prisma from '../config/database';
import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

export class FECService {
  /**
   * Export FEC complet
   */
  async exportFEC(options: FECExportOptions): Promise<string> {
    // 1. Récupérer toutes les écritures validées dans la période
    const entries = await prisma.accountingEntry.findMany({
      where: {
        status: 'VALIDATED',
        date: {
          gte: options.startDate,
          lte: options.endDate,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
        customer: true,
        supplier: true,
      },
      orderBy: [
        { date: 'asc' },
        { number: 'asc' },
      ],
    });

    // 2. Convertir en lignes FEC
    const fecLines: FECLine[] = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        fecLines.push({
          JournalCode: entry.journalCode,
          JournalLib: entry.journalLabel,
          EcritureNum: entry.number,
          EcritureDate: format(entry.date, 'yyyyMMdd'),
          CompteNum: line.account.code,
          CompteLib: line.account.name,
          CompAuxNum: entry.thirdPartyCode || '',
          CompAuxLib: entry.thirdPartyLabel || '',
          PieceRef: entry.pieceRef || entry.reference || '',
          PieceDate: entry.pieceDate ? format(entry.pieceDate, 'yyyyMMdd') : format(entry.date, 'yyyyMMdd'),
          EcritureLib: line.label || entry.label,
          Debit: line.debit.toFixed(2).replace('.', ','),
          Credit: line.credit.toFixed(2).replace('.', ','),
          EcritureLet: entry.lettrage || '',
          DateLet: entry.lettrageDate ? format(entry.lettrageDate, 'yyyyMMdd') : '',
          ValidDate: entry.validationDate ? format(entry.validationDate, 'yyyyMMdd') : format(entry.date, 'yyyyMMdd'),
          Montantdevise: line.amountCurrency ? line.amountCurrency.toFixed(2).replace('.', ',') : '',
          Idevise: line.currency || 'EUR',
        });
      }
    }

    // 3. Générer le fichier
    const filename = `fec_${options.siren}_${format(options.endDate, 'yyyyMMdd')}_${format(new Date(), 'HHmmss')}.txt`;
    const filePath = path.join(process.cwd(), 'exports', filename);

    // Créer le répertoire exports s'il n'existe pas
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // 4. Écrire le fichier
    const separator = options.separator || '|';
    const header = Object.keys(fecLines[0]).join(separator);
    const content = fecLines.map(line => Object.values(line).join(separator)).join('\n');

    fs.writeFileSync(filePath, `${header}\n${content}`, 'utf-8');

    // 5. Enregistrer dans l'historique
    await prisma.fECExport.create({
      data: {
        filename,
        siren: options.siren,
        startDate: options.startDate,
        endDate: options.endDate,
        format: options.format || 'txt',
        filePath,
        status: 'COMPLETED',
        totalEntries: entries.length,
        totalLines: fecLines.length,
        totalDebit: fecLines.reduce((sum, line) => sum + parseFloat(line.Debit.replace(',', '.')), 0),
        totalCredit: fecLines.reduce((sum, line) => sum + parseFloat(line.Credit.replace(',', '.')), 0),
      },
    });

    return filePath;
  }

  /**
   * Import FEC
   */
  async importFEC(filePath: string): Promise<FECImportResult> {
    // TODO: Implémenter l'import
    throw new Error('Not implemented');
  }

  /**
   * Validation format FEC
   */
  validateFECLine(line: FECLine): string[] {
    const errors: string[] = [];

    // Vérifications obligatoires
    if (!line.JournalCode) errors.push('JournalCode manquant');
    if (!line.EcritureNum) errors.push('EcritureNum manquant');
    if (!line.CompteNum) errors.push('CompteNum manquant');

    // Vérifier format date
    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(line.EcritureDate)) errors.push('EcritureDate invalide');

    // Vérifier montants
    const debit = parseFloat(line.Debit.replace(',', '.'));
    const credit = parseFloat(line.Credit.replace(',', '.'));
    if (isNaN(debit)) errors.push('Debit invalide');
    if (isNaN(credit)) errors.push('Credit invalide');

    return errors;
  }
}

export default new FECService();
```

##### 2. `backend/src/controllers/fec.controller.ts`
```typescript
import { Request, Response } from 'express';
import fecService from '../services/fec.service';

export const exportFEC = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, siren, format } = req.body;

    const filePath = await fecService.exportFEC({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      siren,
      format: format || 'txt',
    });

    // Envoyer le fichier en téléchargement
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Erreur lors du téléchargement' });
      }
    });
  } catch (error: any) {
    console.error('Error exporting FEC:', error);
    res.status(500).json({ message: error.message });
  }
};

export const importFEC = async (req: Request, res: Response) => {
  try {
    // TODO: Implémenter
    res.status(501).json({ message: 'Not implemented' });
  } catch (error: any) {
    console.error('Error importing FEC:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getFECExports = async (req: Request, res: Response) => {
  try {
    const exports = await prisma.fECExport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ data: exports });
  } catch (error: any) {
    console.error('Error fetching FEC exports:', error);
    res.status(500).json({ message: error.message });
  }
};
```

##### 3. `backend/src/routes/fec.routes.ts`
```typescript
import express from 'express';
import * as fecController from '../controllers/fec.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Export FEC
router.post('/export', fecController.exportFEC);

// Import FEC
router.post('/import', fecController.importFEC);

// Liste des exports
router.get('/exports', fecController.getFECExports);

export default router;
```

##### 4. Ajouter les routes dans `backend/src/index.ts`
```typescript
import fecRoutes from './routes/fec.routes';

// ...
app.use('/api/fec', fecRoutes);
```

---

### Phase 3: Écritures Automatiques (3-4 jours)

Créer `backend/src/services/automatic-entries.service.ts` avec hooks pour:
1. Facture client (VE)
2. Achat fournisseur (AC)
3. Encaissement (BQ)
4. Paiement (BQ)
5. Avoir (VE)
6. Mouvement stock (OD)

---

### Phase 4: Lettrage et Rapprochement (2 jours)

Créer `backend/src/services/reconciliation.service.ts`

---

### Phase 5: Frontend (2-3 jours)

Créer:
- `frontend/app/dashboard/accounting/fec/export/page.tsx`
- `frontend/app/dashboard/accounting/fec/import/page.tsx`
- `frontend/app/dashboard/accounting/reconciliation/page.tsx`

---

## 📊 Estimation globale

| Phase | Durée | Difficulté | Priorité |
|-------|-------|------------|----------|
| Phase 1 (Fondations) | ✅ Fait | Moyenne | Critique |
| Phase 2 (FEC Service) | 2-3 jours | Moyenne | Haute |
| Phase 3 (Écritures auto) | 3-4 jours | Haute | Haute |
| Phase 4 (Lettrage) | 2 jours | Moyenne | Moyenne |
| Phase 5 (Frontend) | 2-3 jours | Faible | Moyenne |
| **TOTAL** | **10-15 jours** | - | - |

---

## 🔧 Commandes utiles

```bash
# Créer la migration
cd backend
npx prisma migrate dev --name add_fec_fields

# Générer le client Prisma
npx prisma generate

# Créer le répertoire d'exports
mkdir -p backend/exports

# Tester l'export FEC (une fois implémenté)
curl -X POST http://localhost:5000/api/fec/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "siren": "123456789"
  }'
```

---

## 📚 Ressources

### Documentation officielle FEC
- [BOFiP - Fichier des écritures comptables](https://bofip.impots.gouv.fr/bofip/2728-PGP.html)
- [Format FEC détaillé](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000027804775)

### Exemples de FEC
Voir le dossier `backend/templates/accounting/examples/` (à créer)

---

## ⚠️ Points d'attention

1. **Numérotation séquentielle**: Les écritures doivent avoir des numéros séquentiels sans trou
2. **Équilibrage**: Chaque écriture doit être équilibrée (débit = crédit)
3. **Dates cohérentes**: La date de validation ne peut pas être antérieure à la date d'écriture
4. **Conservation**: Les FEC doivent être conservés 6 ans minimum
5. **Inaltérabilité**: Une fois validées, les écritures ne peuvent plus être modifiées

---

## 🎯 Prochaine action recommandée

**Continuer par Phase 2**: Implémenter le FECService en créant les 3 fichiers:
1. `fec.service.ts` (logique métier)
2. `fec.controller.ts` (endpoints API)
3. `fec.routes.ts` (routes Express)

Puis tester l'export avec quelques écritures de test.

---

**Version**: 1.0
**Auteur**: Claude Code
**Dernière mise à jour**: 2025-01-09
