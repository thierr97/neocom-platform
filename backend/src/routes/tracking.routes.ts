import { Router } from 'express';
import { authenticateToken as auth } from '../middleware/auth';
import {
  getActiveTracking,
  getUserCurrentPosition,
  getActiveTripsWithPositions,
} from '../controllers/tracking.controller';

const router = Router();

// ========================================
// TRACKING ROUTES (Real-time GPS)
// ========================================

// Get all active users with tracking
router.get('/tracking/active', auth, getActiveTracking);

// Get current position of a specific user
router.get('/tracking/user/:userId', auth, getUserCurrentPosition);

// Get all active trips with their latest positions
router.get('/tracking/trips', auth, getActiveTripsWithPositions);

export default router;
