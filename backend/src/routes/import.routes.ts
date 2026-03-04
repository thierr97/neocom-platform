import { Router } from 'express';
import * as importController from '../controllers/import.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Temp: Allow products-excel without auth for one-time import
router.post('/products-excel', importController.importProductsFromExcel);

// All other import routes require authentication
router.use(authenticateToken);

// Import routes
router.post('/customers', importController.importCustomers);
router.post('/products', importController.importProducts);

// Get import history
router.get('/history', importController.getImportHistory);

export default router;
