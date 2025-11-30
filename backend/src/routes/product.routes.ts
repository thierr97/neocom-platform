import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Products
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', requireRole('ADMIN'), productController.createProduct);
router.put('/:id', requireRole('ADMIN'), productController.updateProduct);
router.delete('/:id', requireRole('ADMIN'), productController.deleteProduct);
router.patch('/:id/toggle-visibility', requireRole('ADMIN'), productController.toggleProductVisibility);

// Categories
router.get('/categories/all', productController.getCategories);
router.post('/categories', requireRole('ADMIN'), productController.createCategory);
router.put('/categories/:id', requireRole('ADMIN'), productController.updateCategory);
router.delete('/categories/:id', requireRole('ADMIN'), productController.deleteCategory);

export default router;
