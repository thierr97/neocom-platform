import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.get('/:id/product-history', customerController.getCustomerProductHistory);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;
