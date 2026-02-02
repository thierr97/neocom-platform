import { Router } from 'express';
import * as gpsController from '../controllers/gps.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All GPS routes require authentication
router.use(authenticateToken);

// Visit routes
router.post('/visits', gpsController.upload.single('photo'), gpsController.createVisit);
router.get('/visits', gpsController.getAllVisits);
router.get('/visits/trip/:tripId', gpsController.getVisitsByTrip);

// GPS tracking routes
router.post('/', gpsController.createGpsTracking);
router.post('/batch', gpsController.batchCreateGpsTracking);
router.get('/', gpsController.getAllGpsTracking);
router.get('/today', gpsController.getTodayTracking);
router.get('/statistics', gpsController.getGpsStatistics);
router.get('/customer/:customerId', gpsController.getCustomerGpsTracking);
router.get('/:id', gpsController.getGpsTrackingById);
router.delete('/:id', gpsController.deleteGpsTracking);

export default router;
