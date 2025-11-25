import express from 'express';
import {
  getProductMargins,
  getMarginsByCategory,
  suggestPrice,
  updateProductPrice,
  bulkUpdatePrices,
} from '../controllers/pricing.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Margin analysis
router.get('/margins', getProductMargins);
router.get('/margins/by-category', getMarginsByCategory);

// Price suggestions
router.post('/suggest/:productId', suggestPrice);

// Price updates
router.put('/products/:productId', updateProductPrice);
router.post('/bulk-update', bulkUpdatePrices);

export default router;
