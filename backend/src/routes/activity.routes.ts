import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All activity routes require authentication
router.use(authenticateToken);

// Activity routes
router.get('/', activityController.getAllActivities);
router.get('/types', activityController.getActivityTypes);
router.get('/statistics', activityController.getActivityStatistics);
router.get('/export', activityController.exportActivities);
router.get('/customer/:customerId', activityController.getCustomerActivities);
router.get('/:id', activityController.getActivityById);
router.post('/', activityController.createActivity);
router.delete('/:id', activityController.deleteActivity);

export default router;
