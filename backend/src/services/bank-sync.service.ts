/**
 * Service de synchronisation bancaire style Pennylane
 * Synchronise les transactions bancaires, catégorise avec Claude IA,
 * et génère automatiquement des écritures comptables
 */

import prisma from '../config/database';
import Anthropic from '@anthropic-ai/sdk';
import { cleanLabel } from '../utils/label-cleaner.util';
import {
  RawTransaction,
  SyncResult,
  BankAPIProvider,
  AICategorization,
} from '../types/bank-sync.types';
import { BankConnection, BankTransaction, TransactionRule } from '@prisma/client';

export class BankSyncService {
  private anthropic: Anthropic;
  private providers: Map<string, BankAPIProvider>;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.isEnabled = !!apiKey;

    if (this.isEnabled) {
      this.anthropic = new Anthropic({
        apiKey: apiKey!,
      });
      console.log('🤖 BankSyncService: Claude AI enabled');
    } else {
      console.log('⚠️  BankSyncService: Claude AI disabled (no API key)');
    }

    this.providers = new Map();
    // TODO: Initialiser les providers (Bridge, Budget Insight, etc.)
  }

  /**
   * Synchroniser toutes les connexions bancaires actives
   */
  async syncAllConnections(): Promise<SyncResult[]> {
    console.log('🔄 Starting synchronization of all active bank connections...');

    const connections = await prisma.bankConnection.findMany({
      where: { status: 'ACTIVE' },
      include: { accounts: true },
    });

    console.log(`Found ${connections.length} active connections`);

    const results: SyncResult[] = [];

    for (const connection of connections) {
      try {
        const result = await this.syncConnection(connection.id);
        results.push(result);
      } catch (error: any) {
        console.error(`Error syncing connection ${connection.id}:`, error);
        results.push({
          connectionId: connection.id,
          status: 'ERROR',
          error: error.message,
        });
      }
    }

    console.log(`✅ Synchronization complete. Results:`, {
      total: results.length,
      success: results.filter((r) => r.status === 'SUCCESS').length,
      partial: results.filter((r) => r.status === 'PARTIAL').length,
      error: results.filter((r) => r.status === 'ERROR').length,
    });

    return results;
  }

  /**
   * Synchroniser une connexion bancaire spécifique
   */
  async syncConnection(connectionId: string): Promise<SyncResult> {
    const startTime = Date.now();
    console.log(`🔄 Syncing connection ${connectionId}...`);

    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      include: { accounts: true },
    });

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    const provider = this.providers.get(connection.provider);
    if (!provider) {
      console.warn(`Provider ${connection.provider} not configured. Using mock data.`);
      // Pour le moment, retourner un succès avec 0 transactions
      return {
        connectionId,
        status: 'SUCCESS',
        imported: 0,
        processed: 0,
        failed: 0,
        errors: [],
      };
    }

    let imported = 0;
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // 1. Récupérer les transactions depuis la dernière sync
      const since = connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      console.log(`  Fetching transactions since ${since.toISOString()}`);

      const rawTransactions = await provider.fetchTransactions(connection, since);
      console.log(`  Found ${rawTransactions.length} new transactions`);

      // 2. Pour chaque compte
      for (const account of connection.accounts) {
        const accountTransactions = rawTransactions.filter(
          (t) => t.accountId === account.id
        );

        console.log(`  Processing ${accountTransactions.length} transactions for account ${account.accountName}`);

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
                cleanLabel: cleanLabel(rawTx.label),
                counterparty: rawTx.counterparty,
                counterpartyIBAN: rawTx.counterpartyIBAN,
                status: 'PENDING',
              },
            });

            imported++;

            // 5. Catégoriser avec l'IA (async)
            this.categorizeTransaction(transaction.id).catch((err) => {
              console.error(`Error categorizing transaction ${transaction.id}:`, err);
            });

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
          errors: errors.length > 0 ? errors : undefined,
          duration: Date.now() - startTime,
        },
      });

      console.log(`✅ Sync complete for ${connectionId}: ${imported} imported, ${processed} processed, ${failed} failed`);

      return {
        connectionId,
        status: failed > 0 ? 'PARTIAL' : 'SUCCESS',
        imported,
        processed,
        failed,
        errors,
      };
    } catch (error: any) {
      console.error(`❌ Error syncing connection ${connectionId}:`, error);

      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: { status: 'ERROR' },
      });

      throw error;
    }
  }

  /**
   * Catégoriser une transaction avec Claude AI
   */
  async categorizeTransaction(transactionId: string): Promise<void> {
    if (!this.isEnabled) {
      console.warn(`Cannot categorize transaction ${transactionId}: Claude AI not enabled`);
      return;
    }

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

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      // Parser la réponse JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const aiResponse: AICategorization = JSON.parse(jsonMatch[0]);

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

      console.log(`✅ Transaction ${transactionId} categorized: ${aiResponse.category} (confidence: ${aiResponse.confidence})`);

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
    transaction: any,
    aiResponse: AICategorization
  ): Promise<void> {
    console.log(`📝 Creating accounting entry for transaction ${transaction.id}...`);

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
        journal: this.getJournalType(aiResponse.journalCode),

        // FEC
        journalCode: aiResponse.journalCode,
        journalLabel: this.getJournalLabel(aiResponse.journalCode),
        pieceRef: transaction.externalId,
        pieceDate: transaction.date,
        validationDate: aiResponse.confidence > 0.95 ? transaction.date : undefined,

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
            ...(amountVAT > 0.01
              ? [
                  {
                    accountId: await this.getOrCreateAccountId(
                      isDebit ? '445660' : '445710'
                    ),
                    label: `TVA ${vatRate * 100}%`,
                    debit: isDebit ? amountVAT : 0,
                    credit: isDebit ? 0 : amountVAT,
                  },
                ]
              : []),
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

    console.log(`✅ Accounting entry ${entry.number} created successfully`);
  }

  /**
   * Trouver une règle de catégorisation correspondante
   */
  private async findMatchingRule(
    transaction: BankTransaction
  ): Promise<TransactionRule | null> {
    const rules = await prisma.transactionRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    });

    for (const rule of rules) {
      const label = transaction.cleanLabel || transaction.rawLabel;

      let matches = false;
      const matchValue = rule.matchValue.toLowerCase();
      const fieldValue = (label || '').toLowerCase();

      switch (rule.matchType) {
        case 'contains':
          matches = fieldValue.includes(matchValue);
          break;
        case 'starts_with':
          matches = fieldValue.startsWith(matchValue);
          break;
        case 'ends_with':
          matches = fieldValue.endsWith(matchValue);
          break;
        case 'exact':
          matches = fieldValue === matchValue;
          break;
        case 'regex':
          matches = new RegExp(rule.matchValue, 'i').test(fieldValue);
          break;
      }

      if (matches) {
        console.log(`✅ Rule matched: ${rule.name}`);
        return rule;
      }
    }

    return null;
  }

  /**
   * Appliquer une règle de catégorisation
   */
  private async applyRule(
    transaction: BankTransaction,
    rule: TransactionRule
  ): Promise<void> {
    console.log(`Applying rule "${rule.name}" to transaction ${transaction.id}`);

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
      const aiResponse: AICategorization = {
        category: rule.category,
        accountCode: rule.accountingAccountCode,
        accountLabel: rule.category,
        vatRate: rule.vatRate || 0,
        journalCode: rule.journalCode,
        confidence: 1.0,
        reasoning: `Règle automatique: ${rule.name}`,
        thirdPartyCode: rule.customerCode || rule.supplierCode,
      };

      await this.createAccountingEntry(transaction, aiResponse);
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

  private getJournalType(code: string): any {
    const types: Record<string, string> = {
      VE: 'SALES',
      AC: 'PURCHASE',
      BQ: 'BANK',
      CA: 'CASH',
      OD: 'MISC',
      AN: 'OPENING',
    };
    return types[code] || 'MISC';
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

  private getAccountType(code: string): any {
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
