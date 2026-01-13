import { Router } from 'express';
import * as logisticsController from '../controllers/logistics.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All logistics routes require authentication
router.use(authenticateToken);

// Inbound logistics (FRANCE → GUADELOUPE)
router.post('/orders/:id/inbound/ship', logisticsController.shipInbound);
router.post('/orders/:id/inbound/receive', logisticsController.receiveInbound);

// Last mile transformation (only after reception)
router.post('/orders/:id/last-mile/transform', logisticsController.transformToLastMile);

// Get order logistics status
router.get('/orders/:id/logistics', logisticsController.getOrderLogistics);

export default router;
