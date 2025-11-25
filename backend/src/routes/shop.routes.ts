import { Router } from 'express';
import * as shopController from '../controllers/shop.controller';

const router = Router();

// Public routes (no authentication required)
router.get('/products', shopController.getPublicProducts);
router.get('/products/featured', shopController.getFeaturedProducts);
router.get('/products/search', shopController.searchProducts);
router.get('/products/:id', shopController.getPublicProduct);
router.get('/categories', shopController.getPublicCategories);
router.post('/orders', shopController.createPublicOrder);

export default router;
