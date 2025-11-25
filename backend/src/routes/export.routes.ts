import { Router } from 'express';
import * as exportController from '../controllers/export.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All export routes require authentication
router.use(authenticateToken);

// Export routes
router.get('/orders', exportController.exportOrders);
router.get('/orders/:id', exportController.exportOrderDetails);
router.get('/customers', exportController.exportCustomers);
router.get('/products', exportController.exportProducts);
router.get('/invoices', exportController.exportInvoices);
router.get('/quotes', exportController.exportQuotes);

export default router;
