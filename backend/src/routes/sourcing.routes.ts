import { Router } from 'express';
import * as sourcing from '../controllers/sourcing.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

/**
 * /api/sourcing — Back-office "Sourcing & Imports" (dropshipping + IA).
 * Réservé aux administrateurs.
 */
const router = Router();

router.use(authenticateToken, requireRole('ADMIN'));

// Connecteurs
router.get('/connectors', sourcing.getConnectors);

// Imports (file d'attente IA)
router.post('/import', sourcing.createImport);
router.post('/import/bulk', sourcing.createBulkImport);
router.get('/jobs', sourcing.getJobs);
router.get('/jobs/:id', sourcing.getJob);
router.post('/jobs/:id/approve', sourcing.approve);
router.post('/jobs/:id/reject', sourcing.reject);

// Sources dropshipping liées aux produits
router.get('/sources', sourcing.getSources);
router.patch('/sources/:id', sourcing.updateSource);

// Règles de prix
router.get('/pricing-rules', sourcing.getPricingRules);
router.post('/pricing-rules', sourcing.createPricingRule);
router.put('/pricing-rules/:id', sourcing.updatePricingRule);
router.delete('/pricing-rules/:id', sourcing.deletePricingRule);

// Synchronisation stock/prix
router.get('/sync/status', sourcing.syncStatus);
router.post('/sync/run', sourcing.syncRun);

// Commandes fournisseurs (auto-fulfillment)
router.get('/supplier-orders', sourcing.getSupplierOrders);
router.patch('/supplier-orders/:id', sourcing.updateSupplierOrder);
router.post('/fulfillment/run', sourcing.fulfillmentRun);

// Assainissement IA du catalogue existant
router.post('/cleanup/start', sourcing.cleanupStart);
router.get('/cleanup/status', sourcing.cleanupStatus);
router.post('/cleanup/stop', sourcing.cleanupStop);

export default router;
