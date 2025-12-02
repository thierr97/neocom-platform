import { Router } from 'express';
import * as shopController from '../controllers/shop.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/products', shopController.getPublicProducts);
router.get('/products/featured', shopController.getFeaturedProducts);
router.get('/products/search', shopController.searchProducts);
router.get('/products/:id', shopController.getPublicProduct);
router.get('/categories', shopController.getPublicCategories);
router.post('/orders', shopController.createPublicOrder);

// Admin routes (authentication required)
router.post('/categories/add-missing-subcategories', authenticateToken, requireRole('ADMIN'), shopController.addMissingSubcategories);

export default router;
