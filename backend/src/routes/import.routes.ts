import { Router } from 'express';
import * as importController from '../controllers/import.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All import routes require authentication and at least COMMERCIAL role
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'COMMERCIAL'));

// Import routes
router.post('/customers', importController.importCustomers);
router.post('/products', importController.importProducts);

// Get import history
router.get('/history', importController.getImportHistory);

export default router;
