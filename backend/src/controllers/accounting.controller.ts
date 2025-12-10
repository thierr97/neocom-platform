import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AccountType } from '@prisma/client';

// Initialize French Chart of Accounts (Plan Comptable Général)
export const initializeChartOfAccounts = async (req: AuthRequest, res: Response) => {
  try {
    // Check if already initialized
    const existing = await prisma.accountingAccount.count();
    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: 'Le plan comptable est déjà initialisé',
      });
    }

    // French Chart of Accounts (simplified)
    const accounts: Array<{ code: string; name: string; type: AccountType }> = [
      // Classe 1 - Capitaux
      { code: '101000', name: 'Capital social', type: AccountType.EQUITY },
      { code: '106000', name: 'Réserves', type: AccountType.EQUITY },
      { code: '120000', name: 'Résultat de l\'exercice', type: AccountType.EQUITY },
      { code: '164000', name: 'Emprunts auprès des établissements de crédit', type: AccountType.LIABILITY },

      // Classe 2 - Immobilisations
      { code: '213000', name: 'Constructions', type: AccountType.ASSET },
      { code: '218000', name: 'Matériel de bureau et informatique', type: AccountType.ASSET },
      { code: '281300', name: 'Amortissements des constructions', type: AccountType.ASSET },

      // Classe 3 - Stocks
      { code: '370000', name: 'Stock de marchandises', type: AccountType.ASSET },
      { code: '371000', name: 'Stock de matières premières', type: AccountType.ASSET },

      // Classe 4 - Tiers
      { code: '401000', name: 'Fournisseurs', type: AccountType.LIABILITY },
      { code: '411000', name: 'Clients', type: AccountType.ASSET },
      { code: '421000', name: 'Personnel - Rémunérations dues', type: AccountType.LIABILITY },
      { code: '437000', name: 'Autres organismes sociaux', type: AccountType.LIABILITY },
      { code: '445510', name: 'TVA à décaisser', type: AccountType.LIABILITY },
      { code: '445660', name: 'TVA déductible', type: AccountType.ASSET },
      { code: '445710', name: 'TVA collectée', type: AccountType.LIABILITY },

      // Classe 5 - Financiers
      { code: '512000', name: 'Banque', type: AccountType.ASSET },
      { code: '530000', name: 'Caisse', type: AccountType.ASSET },

      // Classe 6 - Charges
      { code: '601000', name: 'Achats de matières premières', type: AccountType.EXPENSE },
      { code: '607000', name: 'Achats de marchandises', type: AccountType.EXPENSE },
      { code: '611000', name: 'Sous-traitance générale', type: AccountType.EXPENSE },
      { code: '613000', name: 'Locations', type: AccountType.EXPENSE },
      { code: '621000', name: 'Personnel extérieur', type: AccountType.EXPENSE },
      { code: '626000', name: 'Frais postaux et télécommunications', type: AccountType.EXPENSE },
      { code: '641000', name: 'Rémunérations du personnel', type: AccountType.EXPENSE },
      { code: '645000', name: 'Charges de sécurité sociale', type: AccountType.EXPENSE },
      { code: '661000', name: 'Charges d\'intérêts', type: AccountType.EXPENSE },

      // Classe 7 - Produits
      { code: '701000', name: 'Ventes de produits finis', type: AccountType.REVENUE },
      { code: '707000', name: 'Ventes de marchandises', type: AccountType.REVENUE },
      { code: '708000', name: 'Produits des activités annexes', type: AccountType.REVENUE },
      { code: '761000', name: 'Produits financiers', type: AccountType.REVENUE },
    ];

    // Create accounts
    await prisma.accountingAccount.createMany({
      data: accounts,
    });

    res.json({
      success: true,
      message: 'Plan comptable initialisé avec succès',
      count: accounts.length,
    });
  } catch (error: any) {
    console.error('Error in initializeChartOfAccounts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initialisation du plan comptable',
      error: error.message,
    });
  }
};

// Get all accounts
export const getAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const { type, search } = req.query;

    const where: any = { isActive: true };

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { code: { contains: search as string } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const accounts = await prisma.accountingAccount.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error('Error in getAccounts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des comptes',
      error: error.message,
    });
  }
};

// Create accounting entry
export const createAccountingEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { date, label, journal, lines, reference } = req.body;

    // Validate: debit must equal credit
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Le total des débits doit être égal au total des crédits',
        debit: totalDebit,
        credit: totalCredit,
      });
    }

    // Generate entry number
    const year = new Date(date).getFullYear();
    const count = await prisma.accountingEntry.count({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    const number = `${journal}-${year}-${String(count + 1).padStart(6, '0')}`;

    // Map journal type to code and label for FEC compliance
    const getJournalCodeAndLabel = (journal: string): { journalCode: string; journalLabel: string } => {
      const mapping: Record<string, { journalCode: string; journalLabel: string }> = {
        VENTE: { journalCode: 'VE', journalLabel: 'Ventes' },
        ACHAT: { journalCode: 'AC', journalLabel: 'Achats' },
        BANQUE: { journalCode: 'BQ', journalLabel: 'Banque' },
        CAISSE: { journalCode: 'CA', journalLabel: 'Caisse' },
        OD: { journalCode: 'OD', journalLabel: 'Opérations Diverses' },
      };
      return mapping[journal] || { journalCode: 'OD', journalLabel: 'Opérations Diverses' };
    };

    const { journalCode, journalLabel } = getJournalCodeAndLabel(journal);

    const entry = await prisma.accountingEntry.create({
      data: {
        number,
        date: new Date(date),
        label,
        journal,
        journalCode,
        journalLabel,
        reference,
        lines: {
          create: lines.map((line: any) => ({
            accountId: line.accountId,
            label: line.label || label,
            debit: line.debit || 0,
            credit: line.credit || 0,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Écriture comptable créée avec succès',
      data: entry,
    });
  } catch (error: any) {
    console.error('Error in createAccountingEntry:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'écriture',
      error: error.message,
    });
  }
};

// Get accounting entries
export const getAccountingEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { journal, status, startDate, endDate, accountId } = req.query;

    const where: any = {};

    if (journal) where.journal = journal;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (accountId) {
      where.lines = {
        some: {
          accountId: accountId as string,
        },
      };
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    console.error('Error in getAccountingEntries:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des écritures',
      error: error.message,
    });
  }
};

// Generate general ledger (Grand livre)
export const getGeneralLedger = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, accountCode } = req.query;

    const where: any = { status: 'VALIDATED' };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
          where: accountCode ? {
            account: {
              code: { startsWith: accountCode as string },
            },
          } : undefined,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by account
    const ledger: any = {};

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!ledger[line.account.code]) {
          ledger[line.account.code] = {
            account: line.account,
            balance: 0,
            movements: [],
          };
        }

        const movement = {
          date: entry.date,
          label: line.label || entry.label,
          reference: entry.number,
          debit: line.debit,
          credit: line.credit,
        };

        ledger[line.account.code].movements.push(movement);
        ledger[line.account.code].balance += line.debit - line.credit;
      });
    });

    res.json({
      success: true,
      data: Object.values(ledger),
    });
  } catch (error: any) {
    console.error('Error in getGeneralLedger:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du grand livre',
      error: error.message,
    });
  }
};

// Generate trial balance (Balance)
export const getTrialBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { status: 'VALIDATED' };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Calculate balance for each account
    const balance: any = {};

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!balance[line.account.code]) {
          balance[line.account.code] = {
            account: line.account,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
          };
        }

        balance[line.account.code].totalDebit += line.debit;
        balance[line.account.code].totalCredit += line.credit;
        balance[line.account.code].balance += line.debit - line.credit;
      });
    });

    const sortedBalance = Object.values(balance).sort((a: any, b: any) =>
      a.account.code.localeCompare(b.account.code)
    );

    res.json({
      success: true,
      data: sortedBalance,
    });
  } catch (error: any) {
    console.error('Error in getTrialBalance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la balance',
      error: error.message,
    });
  }
};

// Generate income statement (Compte de résultat)
export const getIncomeStatement = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { status: 'VALIDATED' };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
          where: {
            account: {
              OR: [
                { type: 'REVENUE' },
                { type: 'EXPENSE' },
              ],
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    const revenues: any[] = [];
    const expenses: any[] = [];

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.account.type === 'REVENUE') {
          // Revenue accounts: credit increases revenue
          const amount = line.credit - line.debit;
          totalRevenue += amount;
          revenues.push({
            account: line.account,
            amount,
            date: entry.date,
            label: line.label || entry.label,
          });
        } else if (line.account.type === 'EXPENSE') {
          // Expense accounts: debit increases expense
          const amount = line.debit - line.credit;
          totalExpense += amount;
          expenses.push({
            account: line.account,
            amount,
            date: entry.date,
            label: line.label || entry.label,
          });
        }
      });
    });

    const netIncome = totalRevenue - totalExpense;

    res.json({
      success: true,
      data: {
        revenues,
        expenses,
        totalRevenue,
        totalExpense,
        netIncome,
      },
    });
  } catch (error: any) {
    console.error('Error in getIncomeStatement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du compte de résultat',
      error: error.message,
    });
  }
};

// Validate entry
export const validateEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await prisma.accountingEntry.update({
      where: { id },
      data: { status: 'VALIDATED' },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Écriture validée avec succès',
      data: entry,
    });
  } catch (error: any) {
    console.error('Error in validateEntry:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'écriture',
      error: error.message,
    });
  }
};

// Generate balance sheet (Bilan)
export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
  try {
    const { endDate } = req.query;

    const where: any = { status: 'VALIDATED' };

    if (endDate) {
      where.date = { lte: new Date(endDate as string) };
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
          where: {
            account: {
              OR: [
                { type: 'ASSET' },
                { type: 'LIABILITY' },
                { type: 'EQUITY' },
              ],
            },
          },
        },
      },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    const accountBalances: any = {};

    // Calculate balance for each account
    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!accountBalances[line.account.code]) {
          accountBalances[line.account.code] = {
            account: line.account,
            balance: 0,
          };
        }
        accountBalances[line.account.code].balance += line.debit - line.credit;
      });
    });

    // Classify accounts
    Object.values(accountBalances).forEach((item: any) => {
      if (item.account.type === 'ASSET') {
        totalAssets += item.balance;
        assets.push(item);
      } else if (item.account.type === 'LIABILITY') {
        totalLiabilities += Math.abs(item.balance);
        liabilities.push({ ...item, balance: Math.abs(item.balance) });
      } else if (item.account.type === 'EQUITY') {
        totalEquity += Math.abs(item.balance);
        equity.push({ ...item, balance: Math.abs(item.balance) });
      }
    });

    res.json({
      success: true,
      data: {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      },
    });
  } catch (error: any) {
    console.error('Error in getBalanceSheet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du bilan',
      error: error.message,
    });
  }
};

// Get accounting statistics/dashboard
export const getAccountingStats = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { status: 'VALIDATED' };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    // Get all entries
    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Calculate stats
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        totalDebit += line.debit;
        totalCredit += line.credit;

        if (line.account.type === 'REVENUE') {
          totalRevenue += line.credit - line.debit;
        } else if (line.account.type === 'EXPENSE') {
          totalExpense += line.debit - line.credit;
        }
      });
    });

    const netIncome = totalRevenue - totalExpense;

    // Count entries by journal
    const entriesByJournal = await prisma.accountingEntry.groupBy({
      by: ['journal'],
      where,
      _count: { id: true },
    });

    // Count entries by status
    const entriesByStatus = await prisma.accountingEntry.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpense,
        netIncome,
        totalDebit,
        totalCredit,
        totalEntries: entries.length,
        entriesByJournal,
        entriesByStatus,
      },
    });
  } catch (error: any) {
    console.error('Error in getAccountingStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};
