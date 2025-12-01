import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { authenticateClient } from '../middleware/clientAuth';

const router = Router();

// Public routes - no authentication required
router.post('/register', clientController.clientRegister);
router.post('/login', clientController.clientLogin);
router.post('/google-auth', clientController.clientGoogleAuth);

// Protected routes - require client authentication
router.use(authenticateClient);

router.get('/profile', clientController.getClientProfile);
router.put('/profile', clientController.updateClientProfile);
router.get('/statistics', clientController.getClientStatistics);
router.get('/orders', clientController.getClientOrders);
router.get('/orders/:id', clientController.getClientOrder);
router.get('/invoices', clientController.getClientInvoices);
router.get('/invoices/:id', clientController.getClientInvoice);
router.get('/quotes', clientController.getClientQuotes);

export default router;
