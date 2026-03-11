import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPermissions,
  updateUserPermissions,
} from '../controllers/user.controller';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User management: ADMIN only (except permissions read which is self-service)
router.get('/', requireRole('ADMIN', 'COMMERCIAL'), getAllUsers);
router.get('/:id', requireRole('ADMIN', 'COMMERCIAL'), getUserById);
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', requireRole('ADMIN'), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

// Permissions: any authenticated user can read their own (controller should enforce self-access)
router.get('/:id/permissions', getUserPermissions);
// Only ADMIN can update permissions
router.put('/:id/permissions', requireRole('ADMIN'), updateUserPermissions);

export default router;
