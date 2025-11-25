import { Router } from 'express';
import * as vatController from '../controllers/vat.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/report', vatController.getVatReport);
router.get('/year-summary', vatController.getYearVatSummary);

export default router;
