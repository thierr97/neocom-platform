import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getUserStats,
  getAllUsersStats,
  getUserConnectionStats,
  getTeamConnectionStats,
  getDashboardStats,
} from '../controllers/stats.controller';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get dashboard stats for current user (mobile app)
router.get('/dashboard', getDashboardStats);

// Get all users stats summary
router.get('/users', getAllUsersStats);

// Get specific user stats
router.get('/users/:userId', getUserStats);

// Get connection statistics for a user
router.get('/users/:userId/connections', getUserConnectionStats);

// Get team connection overview
router.get('/team/connections', getTeamConnectionStats);

export default router;
