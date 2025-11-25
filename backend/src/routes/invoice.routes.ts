import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.post('/from-order', invoiceController.createInvoiceFromOrder);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);
router.get('/:id/pdf', invoiceController.generateInvoicePDF);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
