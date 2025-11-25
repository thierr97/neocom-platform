import express from 'express';
import {
  initializeChartOfAccounts,
  getAccounts,
  createAccountingEntry,
  getAccountingEntries,
  getGeneralLedger,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  getAccountingStats,
  validateEntry,
} from '../controllers/accounting.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Chart of Accounts
router.post('/initialize', initializeChartOfAccounts);
router.get('/accounts', getAccounts);

// Accounting Entries
router.post('/entries', createAccountingEntry);
router.get('/entries', getAccountingEntries);
router.post('/entries/:id/validate', validateEntry);

// Reports
router.get('/reports/general-ledger', getGeneralLedger);
router.get('/reports/trial-balance', getTrialBalance);
router.get('/reports/income-statement', getIncomeStatement);
router.get('/reports/balance-sheet', getBalanceSheet);

// Statistics
router.get('/stats', getAccountingStats);

export default router;
