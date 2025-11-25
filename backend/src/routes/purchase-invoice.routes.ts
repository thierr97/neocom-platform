import express from 'express';
import {
  getPurchaseInvoices,
  getPurchaseInvoiceById,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  validatePurchaseInvoice,
  markAsPaid,
  deletePurchaseInvoice,
  getStockMovements,
} from '../controllers/purchase-invoice.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Purchase Invoice routes
router.get('/', getPurchaseInvoices);
router.get('/:id', getPurchaseInvoiceById);
router.post('/', createPurchaseInvoice);
router.put('/:id', updatePurchaseInvoice);
router.post('/:id/validate', validatePurchaseInvoice);
router.post('/:id/pay', markAsPaid);
router.delete('/:id', deletePurchaseInvoice);

// Stock movements routes
router.get('/stock/movements', getStockMovements);

export default router;
