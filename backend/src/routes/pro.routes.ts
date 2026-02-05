import { Router } from 'express';
import * as proController from '../controllers/pro.controller';
import { authenticateProCustomer } from '../middleware/proAuth';

const router = Router();

// Toutes les routes PRO nécessitent une authentification PRO
router.use(authenticateProCustomer);

/**
 * Dashboard PRO
 * GET /api/pro/dashboard
 */
router.get('/dashboard', proController.getDashboard);

/**
 * Profil et gestion entreprise
 */
router.get('/profile', proController.getProfile);
router.put('/profile', proController.updateProfile);
router.post('/shipping-addresses', proController.addShippingAddress);

/**
 * Catalogue produits avec prix B2B
 * GET /api/pro/catalog?categoryId=xxx&search=xxx&page=1&limit=20
 */
router.get('/catalog', proController.getCatalog);

/**
 * Gestion des commandes
 */
router.get('/orders', proController.getOrders);
router.get('/orders/:orderId', proController.getOrderDetail);
router.post('/orders', proController.createOrder);

/**
 * Suivi des livraisons
 */
router.get('/deliveries', proController.getDeliveries);

/**
 * Gestion des factures
 */
router.get('/invoices', proController.getInvoices);
router.get('/invoices/:invoiceId', proController.getInvoiceDetail);
router.post('/invoices/:invoiceId/payment', proController.declarePayment);

export default router;
