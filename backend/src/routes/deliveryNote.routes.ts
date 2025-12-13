import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAllDeliveryNotes,
  getDeliveryNoteById,
} from '../controllers/deliveryNote.controller';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all delivery notes (returns empty array for now)
router.get('/', getAllDeliveryNotes);

// Get delivery note by ID
router.get('/:id', getDeliveryNoteById);

export default router;
