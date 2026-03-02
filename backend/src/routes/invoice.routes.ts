import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.post('/from-order', invoiceController.createInvoiceFromOrder);
router.post('/from-cart', invoiceController.createInvoiceFromCart);

// DRAFT/VALIDATION system
router.patch('/:id/draft', invoiceController.upsertInvoiceDraft); // Autosave (DRAFT only)
router.post('/:id/validate', invoiceController.validateInvoiceEndpoint); // DRAFT → FINAL

router.patch('/:id/status', invoiceController.updateInvoiceStatus);
router.get('/:id/pdf', invoiceController.generateInvoicePDF);
router.post('/:id/payments', invoiceController.addPaymentToInvoice);
router.get('/:id/payments', invoiceController.getInvoicePayments);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
