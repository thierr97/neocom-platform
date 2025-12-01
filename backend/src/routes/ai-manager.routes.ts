import { Router } from 'express';
import aiManagerController from '../controllers/ai-manager.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

/**
 * AI Manager Routes - Admin only
 * All routes require ADMIN role
 */

// Get AI system status
router.get(
  '/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.getStatus.bind(aiManagerController)
);

// Analyze site content
router.post(
  '/analyze/content',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.analyzeContent.bind(aiManagerController)
);

// Analyze inventory
router.post(
  '/analyze/inventory',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.analyzeInventory.bind(aiManagerController)
);

// Analyze customers
router.post(
  '/analyze/customers',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.analyzeCustomers.bind(aiManagerController)
);

// Analyze performance
router.post(
  '/analyze/performance',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.analyzePerformance.bind(aiManagerController)
);

// Get AI recommendations
router.post(
  '/recommendations',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.getRecommendations.bind(aiManagerController)
);

// Generate product description
router.post(
  '/product/:productId/description',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.generateProductDescription.bind(aiManagerController)
);

// Execute safe automated tasks
router.post(
  '/execute/safe-tasks',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.executeSafeTasks.bind(aiManagerController)
);

// Run full analysis
router.post(
  '/analyze/all',
  authenticateToken,
  authorizeRoles('ADMIN'),
  aiManagerController.analyzeAll.bind(aiManagerController)
);

export default router;
