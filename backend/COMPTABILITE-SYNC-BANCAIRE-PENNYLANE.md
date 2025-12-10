# Système de Synchronisation Bancaire et Comptabilité Automatisée (Style Pennylane)

## 📋 Vue d'ensemble

Système de comptabilité automatisée avec synchronisation bancaire en temps réel, catégorisation intelligente des transactions par IA (Claude), et génération automatique d'écritures comptables conformes FEC.

**Inspiré de**: Pennylane, Qonto, Indy

---

## 🎯 Fonctionnalités Principales

### 1. **Synchronisation Bancaire Automatique**
- Connexion sécurisée aux banques via API (Bridge/Budget Insight)
- Import automatique des transactions en temps réel
- Support multi-banques et multi-comptes
- Détection automatique des nouveaux mouvements

### 2. **Catégorisation Intelligente (IA Claude)**
- Analyse automatique du libellé de chaque transaction
- Détection du type d'opération (achat, vente, salaire, etc.)
- Attribution automatique du compte comptable
- Suggestion de TVA applicable
- Apprentissage des habitudes (mémorisation des règles)

### 3. **Génération Automatique d'Écritures**
- Création automatique d'écritures comptables validées
- Lettrage automatique client/fournisseur
- Gestion de la TVA (collectée/déductible)
- Export FEC conforme

### 4. **Réconciliation Intelligente**
- Rapprochement automatique factures ↔ paiements
- Détection des écarts et anomalies
- Gestion des paiements partiels
- Historique complet de traçabilité

---

## 🏗️ Architecture Technique

### Nouveaux Modèles Prisma

```prisma
// Connexion bancaire (Bridge API, Budget Insight, etc.)
model BankConnection {
  id              String   @id @default(uuid())
  userId          String   // Utilisateur propriétaire

  // Informations banque
  bankName        String   // "BNP Paribas", "Crédit Agricole", etc.
  bankLogo        String?  // URL du logo

  // Authentification API
  provider        String   // "bridge", "budget_insight", "plaid"
  accessToken     String   @db.Text // Token d'accès (chiffré)
  refreshToken    String?  @db.Text // Token de rafraîchissement
  expiresAt       DateTime?

  // Statut
  status          String   @default("ACTIVE") // ACTIVE, ERROR, DISCONNECTED
  lastSync        DateTime?
  nextSync        DateTime?

  // Métadonnées
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  accounts        BankAccount[]

  @@map("bank_connections")
}

// Compte bancaire
model BankAccount {
  id              String   @id @default(uuid())
  connectionId    String
  connection      BankConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  // Informations compte
  accountNumber   String   // Numéro de compte (masqué: ****1234)
  iban            String?  // IBAN complet (chiffré)
  accountName     String   // "Compte courant", "Compte épargne"
  accountType     String   // "checking", "savings", "credit_card"
  currency        String   @default("EUR")

  // Soldes
  balance         Float    // Solde actuel
  balanceDate     DateTime // Date du solde

  // Mapping comptable
  accountingAccountId String?
  accountingAccount   AccountingAccount? @relation(fields: [accountingAccountId], references: [id])

  // Statut
  status          String   @default("ACTIVE")

  // Métadonnées
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  transactions    BankTransaction[]

  @@map("bank_accounts")
}

// Transaction bancaire brute
model BankTransaction {
  id              String   @id @default(uuid())
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id], onDelete: Cascade)

  // Identifiant unique de la banque
  externalId      String   // ID fourni par l'API bancaire

  // Informations transaction
  date            DateTime // Date de la transaction
  valueDate       DateTime? // Date de valeur
  amount          Float    // Montant (négatif = débit, positif = crédit)
  currency        String   @default("EUR")

  // Description
  rawLabel        String   @db.Text // Libellé brut de la banque
  cleanLabel      String?  @db.Text // Libellé nettoyé (sans codes techniques)
  category        String?  // Catégorie détectée par l'IA

  // Contrepartie
  counterparty    String?  // Nom du tiers (bénéficiaire/émetteur)
  counterpartyIBAN String? // IBAN de la contrepartie

  // Statut de traitement
  status          String   @default("PENDING") // PENDING, PROCESSED, IGNORED, ERROR

  // Catégorisation IA
  aiCategoryConfidence Float? // Confiance de l'IA (0-1)
  aiSuggestedAccount   String? // Compte comptable suggéré
  aiSuggestedVAT       Float?  // TVA suggérée (20%, 10%, 5.5%, etc.)
  aiReasoning          String? @db.Text // Explication de l'IA

  // Mapping comptable
  accountingEntryId    String? @unique
  accountingEntry      AccountingEntry? @relation(fields: [accountingEntryId], references: [id])

  // Règle appliquée (si automatique)
  ruleId          String?
  rule            TransactionRule? @relation(fields: [ruleId], references: [id])

  // Métadonnées
  processedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  reconciliationMatches ReconciliationMatch[]

  @@unique([bankAccountId, externalId])
  @@index([date])
  @@index([status])
  @@map("bank_transactions")
}

// Règles de catégorisation automatique
model TransactionRule {
  id              String   @id @default(uuid())
  userId          String   // Utilisateur propriétaire

  // Conditions de déclenchement
  name            String   // Nom de la règle
  description     String?
  priority        Int      @default(0) // Ordre d'application (0 = haute priorité)

  // Critères de matching
  matchType       String   // "contains", "starts_with", "ends_with", "exact", "regex"
  matchValue      String   // Valeur à chercher dans le libellé
  matchField      String   @default("rawLabel") // rawLabel, counterparty, amount

  // Conditions supplémentaires
  minAmount       Float?   // Montant minimum
  maxAmount       Float?   // Montant maximum
  amountType      String?  // "debit", "credit", "both"
  bankAccountId   String?  // Compte bancaire spécifique

  // Actions à appliquer
  category        String   // Catégorie à appliquer
  accountingAccountCode String // Code du compte comptable
  vatRate         Float?   // Taux de TVA à appliquer
  journalCode     String   // Code journal (VE, AC, BQ, etc.)

  // Tiers
  customerCode    String?  // Code client automatique
  supplierCode    String?  // Code fournisseur automatique

  // Auto-validation
  autoValidate    Boolean  @default(false) // Valider automatiquement l'écriture

  // Statut
  isActive        Boolean  @default(true)

  // Statistiques
  timesApplied    Int      @default(0)
  lastAppliedAt   DateTime?

  // Métadonnées
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  transactions    BankTransaction[]

  @@map("transaction_rules")
}

// Rapprochement (matching facture ↔ paiement)
model ReconciliationMatch {
  id              String   @id @default(uuid())

  // Transaction bancaire
  transactionId   String
  transaction     BankTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  // Document lié (facture, avoir, etc.)
  documentType    String   // "invoice", "credit_note", "quote", "expense"
  documentId      String   // ID du document

  // Montant du rapprochement
  matchedAmount   Float    // Montant rapproché (peut être partiel)

  // Statut
  status          String   @default("MATCHED") // MATCHED, PARTIAL, UNMATCHED
  confidence      Float    // Confiance du matching (0-1)

  // IA
  isAutomatic     Boolean  @default(false) // Matching automatique ou manuel
  aiReasoning     String?  @db.Text // Explication de l'IA

  // Validation
  validatedBy     String?  // ID utilisateur qui a validé
  validatedAt     DateTime?

  // Métadonnées
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("reconciliation_matches")
}

// Historique de synchronisation
model SyncHistory {
  id              String   @id @default(uuid())
  connectionId    String

  // Période synchronisée
  startDate       DateTime
  endDate         DateTime

  // Résultats
  status          String   // SUCCESS, PARTIAL, ERROR
  transactionsImported Int  @default(0)
  transactionsProcessed Int @default(0)
  transactionsFailed Int    @default(0)

  // Erreurs
  errors          Json?    // Liste des erreurs rencontrées

  // Performance
  duration        Int?     // Durée en millisecondes

  // Métadonnées
  createdAt       DateTime @default(now())

  @@map("sync_history")
}
```

---

## 🤖 Services IA avec Claude

### 1. **BankSyncService** (`backend/src/services/bank-sync.service.ts`)

```typescript
import prisma from '../config/database';
import Anthropic from '@anthropic-ai/sdk';

interface BankAPIProvider {
  name: 'bridge' | 'budget_insight' | 'plaid';
  fetchTransactions(connection: BankConnection, since: Date): Promise<RawTransaction[]>;
  refreshToken(connection: BankConnection): Promise<string>;
}

export class BankSyncService {
  private anthropic: Anthropic;
  private providers: Map<string, BankAPIProvider>;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.providers = new Map();
    // TODO: Initialiser les providers (Bridge, Budget Insight, etc.)
  }

  /**
   * Synchroniser toutes les connexions bancaires actives
   */
  async syncAllConnections(): Promise<SyncResult[]> {
    const connections = await prisma.bankConnection.findMany({
      where: { status: 'ACTIVE' },
      include: { accounts: true },
    });

    const results: SyncResult[] = [];

    for (const connection of connections) {
      try {
        const result = await this.syncConnection(connection.id);
        results.push(result);
      } catch (error: any) {
        results.push({
          connectionId: connection.id,
          status: 'ERROR',
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Synchroniser une connexion bancaire spécifique
   */
  async syncConnection(connectionId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      include: { accounts: true },
    });

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    const provider = this.providers.get(connection.provider);
    if (!provider) {
      throw new Error(`Provider ${connection.provider} not configured`);
    }

    let imported = 0;
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // 1. Récupérer les transactions depuis la dernière sync
      const since = connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const rawTransactions = await provider.fetchTransactions(connection, since);

      // 2. Pour chaque compte
      for (const account of connection.accounts) {
        const accountTransactions = rawTransactions.filter(t => t.accountId === account.id);

        for (const rawTx of accountTransactions) {
          try {
            // 3. Vérifier si la transaction existe déjà
            const existing = await prisma.bankTransaction.findUnique({
              where: {
                bankAccountId_externalId: {
                  bankAccountId: account.id,
                  externalId: rawTx.externalId,
                },
              },
            });

            if (existing) {
              continue; // Déjà importée
            }

            // 4. Créer la transaction
            const transaction = await prisma.bankTransaction.create({
              data: {
                bankAccountId: account.id,
                externalId: rawTx.externalId,
                date: rawTx.date,
                valueDate: rawTx.valueDate,
                amount: rawTx.amount,
                currency: rawTx.currency,
                rawLabel: rawTx.label,
                cleanLabel: this.cleanLabel(rawTx.label),
                counterparty: rawTx.counterparty,
                counterpartyIBAN: rawTx.counterpartyIBAN,
                status: 'PENDING',
              },
            });

            imported++;

            // 5. Catégoriser avec l'IA
            await this.categorizeTransaction(transaction.id);
            processed++;

          } catch (error: any) {
            failed++;
            errors.push(`Transaction ${rawTx.externalId}: ${error.message}`);
          }
        }
      }

      // 6. Mettre à jour la connexion
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastSync: new Date(),
          nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000), // +6h
        },
      });

      // 7. Enregistrer l'historique
      await prisma.syncHistory.create({
        data: {
          connectionId,
          startDate: since,
          endDate: new Date(),
          status: failed > 0 ? 'PARTIAL' : 'SUCCESS',
          transactionsImported: imported,
          transactionsProcessed: processed,
          transactionsFailed: failed,
          errors: errors.length > 0 ? errors : null,
          duration: Date.now() - startTime,
        },
      });

      return {
        connectionId,
        status: failed > 0 ? 'PARTIAL' : 'SUCCESS',
        imported,
        processed,
        failed,
        errors,
      };

    } catch (error: any) {
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: { status: 'ERROR' },
      });

      throw error;
    }
  }

  /**
   * Nettoyer le libellé de la transaction
   */
  private cleanLabel(rawLabel: string): string {
    return rawLabel
      .replace(/CB\*?\d+/g, '') // Retirer codes CB
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Retirer dates
      .replace(/CARTE\s+\d+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Catégoriser une transaction avec Claude AI
   */
  async categorizeTransaction(transactionId: string): Promise<void> {
    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      include: {
        bankAccount: {
          include: {
            connection: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 1. Vérifier si une règle existe
    const rule = await this.findMatchingRule(transaction);
    if (rule) {
      await this.applyRule(transaction, rule);
      return;
    }

    // 2. Sinon, utiliser l'IA Claude
    const prompt = `Tu es un expert-comptable français. Analyse cette transaction bancaire et détermine:
1. La catégorie comptable appropriée (Achats, Ventes, Salaires, Charges sociales, etc.)
2. Le compte comptable selon le plan comptable général français
3. Le taux de TVA applicable (20%, 10%, 5.5%, 2.1%, ou aucune)
4. Si c'est un client ou un fournisseur connu

Transaction:
- Date: ${transaction.date.toLocaleDateString('fr-FR')}
- Montant: ${transaction.amount} EUR
- Libellé: ${transaction.cleanLabel || transaction.rawLabel}
- Contrepartie: ${transaction.counterparty || 'Inconnue'}
- Type: ${transaction.amount < 0 ? 'Débit (dépense)' : 'Crédit (recette)'}

Réponds UNIQUEMENT au format JSON suivant:
{
  "category": "nom de la catégorie",
  "accountCode": "code du compte (ex: 607000, 411000)",
  "accountLabel": "libellé du compte",
  "vatRate": taux de TVA en décimal (ex: 0.20),
  "journalCode": "VE, AC, BQ, ou OD",
  "confidence": score de confiance entre 0 et 1,
  "reasoning": "explication courte de ton analyse",
  "isCustomer": true/false,
  "isSupplier": true/false,
  "thirdPartyCode": "code client/fournisseur si identifiable"
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parser la réponse JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const aiResponse = JSON.parse(jsonMatch[0]);

      // 3. Mettre à jour la transaction avec les suggestions IA
      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: {
          category: aiResponse.category,
          aiCategoryConfidence: aiResponse.confidence,
          aiSuggestedAccount: aiResponse.accountCode,
          aiSuggestedVAT: aiResponse.vatRate,
          aiReasoning: aiResponse.reasoning,
        },
      });

      // 4. Si la confiance est élevée (>0.85), créer automatiquement l'écriture
      if (aiResponse.confidence > 0.85) {
        await this.createAccountingEntry(transaction, aiResponse);
      }

    } catch (error: any) {
      console.error('Error categorizing transaction:', error);
      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: { status: 'ERROR' },
      });
    }
  }

  /**
   * Créer l'écriture comptable à partir de la transaction
   */
  private async createAccountingEntry(
    transaction: BankTransaction,
    aiResponse: any
  ): Promise<void> {
    // Récupérer le compte bancaire
    const bankAccount = transaction.bankAccount;

    const isDebit = transaction.amount < 0;
    const absoluteAmount = Math.abs(transaction.amount);

    // Calculer HT et TVA
    const vatRate = aiResponse.vatRate || 0;
    const amountHT = absoluteAmount / (1 + vatRate);
    const amountVAT = absoluteAmount - amountHT;

    // Créer l'écriture
    const entry = await prisma.accountingEntry.create({
      data: {
        number: await this.generateEntryNumber(aiResponse.journalCode),
        date: transaction.date,
        label: transaction.cleanLabel || transaction.rawLabel,
        reference: `BANK-${transaction.externalId}`,
        status: aiResponse.confidence > 0.95 ? 'VALIDATED' : 'DRAFT',

        // FEC
        journalCode: aiResponse.journalCode,
        journalLabel: this.getJournalLabel(aiResponse.journalCode),
        pieceRef: transaction.externalId,
        pieceDate: transaction.date,
        validationDate: aiResponse.confidence > 0.95 ? transaction.date : null,

        // Tiers
        thirdPartyCode: aiResponse.thirdPartyCode,
        thirdPartyLabel: transaction.counterparty,

        lines: {
          create: [
            // Ligne 1: Compte de gestion (charge ou produit)
            {
              accountId: await this.getOrCreateAccountId(aiResponse.accountCode),
              label: transaction.cleanLabel || transaction.rawLabel,
              debit: isDebit ? amountHT : 0,
              credit: isDebit ? 0 : amountHT,
            },
            // Ligne 2: TVA (si applicable)
            ...(amountVAT > 0 ? [{
              accountId: await this.getOrCreateAccountId(isDebit ? '445660' : '445710'),
              label: `TVA ${vatRate * 100}%`,
              debit: isDebit ? amountVAT : 0,
              credit: isDebit ? 0 : amountVAT,
            }] : []),
            // Ligne 3: Compte bancaire
            {
              accountId: bankAccount.accountingAccountId!,
              label: 'Banque',
              debit: isDebit ? 0 : absoluteAmount,
              credit: isDebit ? absoluteAmount : 0,
            },
          ],
        },
      },
    });

    // Lier la transaction à l'écriture
    await prisma.bankTransaction.update({
      where: { id: transaction.id },
      data: {
        accountingEntryId: entry.id,
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Trouver une règle de catégorisation correspondante
   */
  private async findMatchingRule(transaction: BankTransaction): Promise<TransactionRule | null> {
    const rules = await prisma.transactionRule.findMany({
      where: {
        isActive: true,
        // Filtres de montant
        ...(transaction.amount < 0 && {
          amountType: { in: ['debit', 'both'] },
          minAmount: { lte: Math.abs(transaction.amount) },
          maxAmount: { gte: Math.abs(transaction.amount) },
        }),
        ...(transaction.amount >= 0 && {
          amountType: { in: ['credit', 'both'] },
          minAmount: { lte: transaction.amount },
          maxAmount: { gte: transaction.amount },
        }),
      },
      orderBy: { priority: 'asc' },
    });

    for (const rule of rules) {
      const label = transaction.cleanLabel || transaction.rawLabel;
      const matchField = transaction[rule.matchField as keyof BankTransaction] as string;

      let matches = false;
      switch (rule.matchType) {
        case 'contains':
          matches = matchField?.toLowerCase().includes(rule.matchValue.toLowerCase());
          break;
        case 'starts_with':
          matches = matchField?.toLowerCase().startsWith(rule.matchValue.toLowerCase());
          break;
        case 'ends_with':
          matches = matchField?.toLowerCase().endsWith(rule.matchValue.toLowerCase());
          break;
        case 'exact':
          matches = matchField?.toLowerCase() === rule.matchValue.toLowerCase();
          break;
        case 'regex':
          matches = new RegExp(rule.matchValue, 'i').test(matchField || '');
          break;
      }

      if (matches) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Appliquer une règle de catégorisation
   */
  private async applyRule(transaction: BankTransaction, rule: TransactionRule): Promise<void> {
    await prisma.bankTransaction.update({
      where: { id: transaction.id },
      data: {
        category: rule.category,
        aiSuggestedAccount: rule.accountingAccountCode,
        aiSuggestedVAT: rule.vatRate,
        aiCategoryConfidence: 1.0,
        aiReasoning: `Règle automatique: ${rule.name}`,
        ruleId: rule.id,
      },
    });

    // Incrémenter le compteur de la règle
    await prisma.transactionRule.update({
      where: { id: rule.id },
      data: {
        timesApplied: { increment: 1 },
        lastAppliedAt: new Date(),
      },
    });

    // Si auto-validation, créer l'écriture
    if (rule.autoValidate) {
      await this.createAccountingEntry(transaction, {
        accountCode: rule.accountingAccountCode,
        vatRate: rule.vatRate,
        journalCode: rule.journalCode,
        confidence: 1.0,
        thirdPartyCode: rule.customerCode || rule.supplierCode,
      });
    }
  }

  // Helpers
  private async generateEntryNumber(journalCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const lastEntry = await prisma.accountingEntry.findFirst({
      where: { journalCode },
      orderBy: { number: 'desc' },
    });

    const lastNumber = lastEntry ? parseInt(lastEntry.number.split('-')[2]) : 0;
    return `${journalCode}-${year}-${String(lastNumber + 1).padStart(6, '0')}`;
  }

  private getJournalLabel(code: string): string {
    const labels: Record<string, string> = {
      VE: 'Ventes',
      AC: 'Achats',
      BQ: 'Banque',
      CA: 'Caisse',
      OD: 'Opérations diverses',
      AN: 'À-nouveaux',
    };
    return labels[code] || 'Inconnu';
  }

  private async getOrCreateAccountId(accountCode: string): Promise<string> {
    let account = await prisma.accountingAccount.findUnique({
      where: { code: accountCode },
    });

    if (!account) {
      // Créer le compte s'il n'existe pas
      account = await prisma.accountingAccount.create({
        data: {
          code: accountCode,
          name: `Compte ${accountCode}`,
          type: this.getAccountType(accountCode),
        },
      });
    }

    return account.id;
  }

  private getAccountType(code: string): string {
    const firstDigit = code.charAt(0);
    const types: Record<string, string> = {
      '1': 'EQUITY',
      '2': 'ASSET',
      '3': 'ASSET',
      '4': 'LIABILITY',
      '5': 'ASSET',
      '6': 'EXPENSE',
      '7': 'REVENUE',
    };
    return types[firstDigit] || 'ASSET';
  }
}

export default new BankSyncService();
```

---

## 📁 Structure des Fichiers

```
backend/
├── src/
│   ├── services/
│   │   ├── bank-sync.service.ts              # Synchronisation bancaire
│   │   ├── transaction-categorization.service.ts  # Catégorisation IA
│   │   ├── auto-reconciliation.service.ts    # Rapprochement auto
│   │   ├── fec.service.ts                    # Export/Import FEC
│   │   └── accounting-hooks.service.ts       # Hooks événements
│   ├── controllers/
│   │   ├── bank.controller.ts                # Routes connexions bancaires
│   │   ├── transaction.controller.ts         # Routes transactions
│   │   ├── reconciliation.controller.ts      # Routes rapprochement
│   │   └── fec.controller.ts                 # Routes FEC
│   ├── routes/
│   │   ├── bank.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── reconciliation.routes.ts
│   │   └── fec.routes.ts
│   ├── providers/
│   │   ├── bridge.provider.ts                # API Bridge
│   │   ├── budget-insight.provider.ts        # API Budget Insight
│   │   └── base.provider.ts                  # Interface commune
│   └── utils/
│       ├── encryption.util.ts                # Chiffrement tokens
│       └── label-cleaner.util.ts             # Nettoyage libellés

frontend/
└── app/
    └── dashboard/
        └── accounting/
            ├── bank/
            │   ├── connections/page.tsx      # Gestion connexions
            │   └── sync/page.tsx             # Synchronisation
            ├── transactions/
            │   ├── page.tsx                  # Liste transactions
            │   ├── categorize/page.tsx       # Catégorisation
            │   └── rules/page.tsx            # Règles auto
            ├── reconciliation/
            │   └── page.tsx                  # Rapprochement
            └── fec/
                └── export/page.tsx           # Export FEC
```

---

## 🚀 Plan d'Implémentation

### Phase 1: Fondations (1-2 jours)
- [x] Modifier schéma Prisma (modèles bancaires)
- [ ] Créer migrations
- [ ] Installer dépendances (@anthropic-ai/sdk, crypto)

### Phase 2: API Bancaire (2-3 jours)
- [ ] Intégration Bridge API
- [ ] Service de synchronisation
- [ ] Gestion des tokens (chiffrement)
- [ ] Webhook pour notifications temps réel

### Phase 3: Catégorisation IA (2-3 jours)
- [ ] Service de catégorisation avec Claude
- [ ] Système de règles automatiques
- [ ] Interface de gestion des règles
- [ ] Apprentissage des patterns

### Phase 4: Génération Écritures (2 jours)
- [ ] Création automatique d'écritures comptables
- [ ] Gestion de la TVA
- [ ] Lettrage automatique
- [ ] Validation/approbation

### Phase 5: Réconciliation (2 jours)
- [ ] Matching factures ↔ paiements
- [ ] Gestion paiements partiels
- [ ] Détection anomalies
- [ ] Interface de réconciliation

### Phase 6: Frontend (3-4 jours)
- [ ] Page connexions bancaires
- [ ] Page transactions (liste + détail)
- [ ] Page catégorisation
- [ ] Page réconciliation
- [ ] Dashboard de synthèse

### Phase 7: Tests & Déploiement (2 jours)
- [ ] Tests d'intégration
- [ ] Tests de sécurité
- [ ] Documentation utilisateur
- [ ] Déploiement production

**TOTAL**: 14-18 jours

---

## 🔐 Sécurité

### Gestion des Tokens Bancaires
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Variables d'Environnement

```bash
# API bancaire (Bridge)
BRIDGE_CLIENT_ID=your_client_id
BRIDGE_CLIENT_SECRET=your_client_secret
BRIDGE_API_URL=https://api.bridgeapi.io

# Chiffrement
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# IA Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Webhooks
BANK_WEBHOOK_SECRET=your_webhook_secret
```

---

## 📊 Exemple de Workflow Complet

1. **Connexion Bancaire**
   - Utilisateur connecte sa banque via Bridge
   - Token stocké chiffré en BDD

2. **Synchronisation Automatique (toutes les 6h)**
   - BankSyncService récupère nouvelles transactions
   - Transactions stockées avec statut PENDING

3. **Catégorisation IA**
   - Claude analyse chaque transaction
   - Suggère compte comptable + TVA
   - Si confiance > 85%, auto-validation

4. **Génération Écriture**
   - Écriture comptable créée automatiquement
   - Équilibrée (débit = crédit)
   - Conforme FEC

5. **Réconciliation**
   - Matching automatique facture ↔ paiement
   - Lettrage des comptes
   - Notification si écart détecté

6. **Export FEC**
   - Export FEC complet à tout moment
   - Conforme administration fiscale
   - Audit trail complet

---

## 🎯 KPIs à Suivre

- **Taux d'automatisation**: % transactions catégorisées automatiquement
- **Confiance IA**: Score moyen de confiance de Claude
- **Taux de réconciliation**: % factures rapprochées automatiquement
- **Temps de traitement**: Délai moyen de synchronisation
- **Taux d'erreur**: % transactions en erreur

---

**Version**: 1.0
**Date**: 2025-01-09
**Statut**: Spécifications complètes - Prêt pour implémentation
