import express from 'express';
import { authMiddleware } from '../middleware/auth';
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

// Get all users (with optional role filter)
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Get user permissions
router.get('/:id/permissions', getUserPermissions);

// Update user permissions
router.put('/:id/permissions', updateUserPermissions);

export default router;
