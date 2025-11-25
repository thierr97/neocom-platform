import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.get('/:id/delivery-note-pdf', orderController.generateDeliveryNotePDF);

export default router;
