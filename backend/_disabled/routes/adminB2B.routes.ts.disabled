import { Router } from 'express';
import * as adminB2BController from '../controllers/adminB2B.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Toutes les routes admin B2B nécessitent une authentification admin
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

/**
 * ============================================
 * GESTION DES CLIENTS PRO
 * ============================================
 */

/**
 * Liste des clients PRO
 * GET /api/admin/b2b/customers?status=PENDING&search=xxx&page=1&limit=20
 */
router.get('/customers', adminB2BController.getProCustomers);

/**
 * Détail d'un client PRO
 * GET /api/admin/b2b/customers/:customerId
 */
router.get('/customers/:customerId', adminB2BController.getProCustomerDetail);

/**
 * Convertir un client standard en client PRO
 * POST /api/admin/b2b/customers/:customerId/convert-to-pro
 */
router.post('/customers/:customerId/convert-to-pro', adminB2BController.convertToProCustomer);

/**
 * Approuver un client PRO
 * POST /api/admin/b2b/customers/:customerId/approve
 */
router.post('/customers/:customerId/approve', adminB2BController.approveProCustomer);

/**
 * Rejeter un client PRO
 * POST /api/admin/b2b/customers/:customerId/reject
 */
router.post('/customers/:customerId/reject', adminB2BController.rejectProCustomer);

/**
 * Suspendre un client PRO
 * POST /api/admin/b2b/customers/:customerId/suspend
 */
router.post('/customers/:customerId/suspend', adminB2BController.suspendProCustomer);

/**
 * Mettre à jour les conditions commerciales
 * PUT /api/admin/b2b/customers/:customerId/terms
 */
router.put('/customers/:customerId/terms', adminB2BController.updateProCustomerTerms);

/**
 * ============================================
 * GESTION DES DOCUMENTS PRO
 * ============================================
 */

/**
 * Documents en attente de validation
 * GET /api/admin/b2b/documents/pending
 */
router.get('/documents/pending', adminB2BController.getPendingDocuments);

/**
 * Approuver un document
 * POST /api/admin/b2b/documents/:documentId/approve
 */
router.post('/documents/:documentId/approve', adminB2BController.approveDocument);

/**
 * Rejeter un document
 * POST /api/admin/b2b/documents/:documentId/reject
 */
router.post('/documents/:documentId/reject', adminB2BController.rejectDocument);

/**
 * ============================================
 * GESTION DES RÈGLES DE PRICING B2B
 * ============================================
 */

/**
 * Liste des règles de pricing
 * GET /api/admin/b2b/pricing-rules?scope=CUSTOMER&isActive=true&page=1&limit=50
 */
router.get('/pricing-rules', adminB2BController.getPricingRules);

/**
 * Créer une règle de pricing
 * POST /api/admin/b2b/pricing-rules
 */
router.post('/pricing-rules', adminB2BController.createPricingRule);

/**
 * Mettre à jour une règle de pricing
 * PUT /api/admin/b2b/pricing-rules/:ruleId
 */
router.put('/pricing-rules/:ruleId', adminB2BController.updatePricingRule);

/**
 * Supprimer une règle de pricing
 * DELETE /api/admin/b2b/pricing-rules/:ruleId
 */
router.delete('/pricing-rules/:ruleId', adminB2BController.deletePricingRule);

/**
 * Prévisualiser le prix pour un produit/client
 * GET /api/admin/b2b/pricing-rules/preview?productId=xxx&customerId=xxx&quantity=10
 */
router.get('/pricing-rules/preview', adminB2BController.previewPricing);

/**
 * ============================================
 * GESTION DES COMMANDES B2B
 * ============================================
 */

/**
 * Liste des commandes B2B
 * GET /api/admin/b2b/orders?status=PENDING&customerId=xxx&page=1&limit=20
 */
router.get('/orders', adminB2BController.getB2BOrders);

/**
 * Mettre à jour le statut d'une commande
 * PUT /api/admin/b2b/orders/:orderId/status
 */
router.put('/orders/:orderId/status', adminB2BController.updateOrderStatus);

/**
 * Créer une livraison pour une commande
 * POST /api/admin/b2b/orders/:orderId/delivery
 */
router.post('/orders/:orderId/delivery', adminB2BController.createDelivery);

/**
 * ============================================
 * GESTION DES LIVRAISONS ET SIGNATURES
 * ============================================
 */

/**
 * Enregistrer une preuve de livraison avec signature
 * POST /api/admin/b2b/deliveries/:deliveryId/proof
 */
router.post('/deliveries/:deliveryId/proof', adminB2BController.recordDeliveryProof);

/**
 * ============================================
 * GESTION DE LA FACTURATION B2B
 * ============================================
 */

/**
 * Générer une facture pour une commande
 * POST /api/admin/b2b/orders/:orderId/invoice
 */
router.post('/orders/:orderId/invoice', adminB2BController.generateInvoice);

/**
 * Valider un paiement déclaré
 * PUT /api/admin/b2b/payments/:paymentId/validate
 */
router.put('/payments/:paymentId/validate', adminB2BController.validatePayment);

/**
 * Exporter les données comptables
 * GET /api/admin/b2b/accounting/export?startDate=xxx&endDate=xxx
 */
router.get('/accounting/export', adminB2BController.exportAccounting);

export default router;
