import { Router } from 'express';
import * as rbacController from '../controllers/rbac.controller';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/permissions';

const router = Router();

// All RBAC routes require authentication and admin role
router.use(authenticateToken);

// Get roles and permissions (any authenticated user)
router.get('/roles', rbacController.getRolesAndPermissions);

// User management routes (admin only)
router.get('/users', requireAdmin, rbacController.getAllUsers);
router.get('/users/statistics', requireAdmin, rbacController.getUserStatistics);
router.get('/users/:id', requireAdmin, rbacController.getUserById);
router.post('/users', requireAdmin, rbacController.createUser);
router.put('/users/:id', requireAdmin, rbacController.updateUser);
router.put('/users/:id/password', requireAdmin, rbacController.updateUserPassword);
router.delete('/users/:id', requireAdmin, rbacController.deleteUser);

export default router;
