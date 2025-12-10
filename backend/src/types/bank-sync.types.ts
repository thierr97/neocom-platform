/**
 * Types pour la synchronisation bancaire style Pennylane
 */

import { BankConnection, BankAccount, BankTransaction } from '@prisma/client';

// ========================================
// TRANSACTIONS BANCAIRES
// ========================================

export interface RawTransaction {
  externalId: string;
  accountId: string;
  date: Date;
  valueDate?: Date;
  amount: number;
  currency: string;
  label: string;
  counterparty?: string;
  counterpartyIBAN?: string;
}

export interface SyncResult {
  connectionId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  imported?: number;
  processed?: number;
  failed?: number;
  errors?: string[];
  error?: string;
}

// ========================================
// CATÉGORISATION IA
// ========================================

export interface AICategorization {
  category: string;
  accountCode: string;
  accountLabel: string;
  vatRate: number;
  journalCode: string;
  confidence: number;
  reasoning: string;
  isCustomer?: boolean;
  isSupplier?: boolean;
  thirdPartyCode?: string;
}

export interface CategorizationRequest {
  transactionId: string;
  date: Date;
  amount: number;
  label: string;
  counterparty?: string;
}

// ========================================
// PROVIDER API BANCAIRE
// ========================================

export interface BankAPIProvider {
  name: 'bridge' | 'budget_insight' | 'plaid';

  /**
   * Récupérer les transactions depuis une date
   */
  fetchTransactions(
    connection: BankConnection,
    since: Date
  ): Promise<RawTransaction[]>;

  /**
   * Rafraîchir le token d'accès
   */
  refreshToken(connection: BankConnection): Promise<string>;

  /**
   * Vérifier la connexion
   */
  checkConnection(connection: BankConnection): Promise<boolean>;

  /**
   * Récupérer les comptes bancaires
   */
  fetchAccounts(connection: BankConnection): Promise<BankAccountInfo[]>;
}

export interface BankAccountInfo {
  externalId: string;
  accountNumber: string;
  iban?: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit_card';
  currency: string;
  balance: number;
  balanceDate: Date;
}

// ========================================
// RÉCONCILIATION
// ========================================

export interface ReconciliationCandidate {
  documentType: 'invoice' | 'credit_note' | 'quote' | 'expense';
  documentId: string;
  documentNumber: string;
  documentDate: Date;
  amount: number;
  counterparty?: string;
  confidence: number;
  reason: string;
}

export interface ReconciliationResult {
  transactionId: string;
  matches: ReconciliationCandidate[];
  autoMatched?: ReconciliationCandidate;
}

// ========================================
// RÈGLES DE CATÉGORISATION
// ========================================

export interface RuleMatchCriteria {
  matchType: 'contains' | 'starts_with' | 'ends_with' | 'exact' | 'regex';
  matchValue: string;
  matchField: 'rawLabel' | 'cleanLabel' | 'counterparty' | 'amount';
  minAmount?: number;
  maxAmount?: number;
  amountType?: 'debit' | 'credit' | 'both';
}

export interface RuleAction {
  category: string;
  accountingAccountCode: string;
  vatRate?: number;
  journalCode: string;
  customerCode?: string;
  supplierCode?: string;
  autoValidate: boolean;
}

export interface TransactionRuleCreate {
  userId: string;
  name: string;
  description?: string;
  priority?: number;
  criteria: RuleMatchCriteria;
  action: RuleAction;
  isActive?: boolean;
}

// ========================================
// WEBHOOKS
// ========================================

export interface BankWebhookPayload {
  event: 'transaction.created' | 'transaction.updated' | 'account.updated' | 'connection.error';
  connectionId: string;
  data: any;
  signature: string;
  timestamp: string;
}

// ========================================
// STATISTIQUES & RAPPORTS
// ========================================

export interface BankSyncStats {
  connectionId: string;
  lastSync?: Date;
  nextSync?: Date;
  totalTransactions: number;
  pendingTransactions: number;
  processedTransactions: number;
  failedTransactions: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface CategorizationStats {
  totalCategorized: number;
  autoCategorized: number;
  manualCategorized: number;
  averageConfidence: number;
  topCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  ruleUsage: {
    ruleId: string;
    ruleName: string;
    timesApplied: number;
  }[];
}

// ========================================
// EXPORT / IMPORT
// ========================================

export interface BankDataExport {
  connections: BankConnection[];
  accounts: BankAccount[];
  transactions: BankTransaction[];
  exportDate: Date;
  version: string;
}
