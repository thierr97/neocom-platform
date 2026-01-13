import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// Get all tasks (filtered by role)
router.get('/', taskController.getAllTasks);

// Get single task
router.get('/:id', taskController.getTaskById);

// Create task (ADMIN/SUB_ADMIN only)
router.post('/', taskController.createTask);

// Update task status
router.patch('/:id/status', taskController.updateTaskStatus);

// Add proof to task
router.post('/:id/proofs', taskController.addTaskProof);

// Review task (SUB_ADMIN only)
router.post('/:id/review', taskController.reviewTask);

// Reassign task (SUB_ADMIN only)
router.post('/:id/reassign', taskController.reassignTask);

export default router;
