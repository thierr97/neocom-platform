import { Router } from 'express';
import aiManagerController from '../controllers/ai-manager.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

/**
 * AI Manager Routes - Admin only
 * All routes require ADMIN role
 */

// Get AI system status
router.get(
  '/status',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.getStatus.bind(aiManagerController)
);

// Analyze site content
router.post(
  '/analyze/content',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.analyzeContent.bind(aiManagerController)
);

// Analyze inventory
router.post(
  '/analyze/inventory',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.analyzeInventory.bind(aiManagerController)
);

// Analyze customers
router.post(
  '/analyze/customers',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.analyzeCustomers.bind(aiManagerController)
);

// Analyze performance
router.post(
  '/analyze/performance',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.analyzePerformance.bind(aiManagerController)
);

// Get AI recommendations
router.post(
  '/recommendations',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.getRecommendations.bind(aiManagerController)
);

// Generate product description
router.post(
  '/product/:productId/description',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.generateProductDescription.bind(aiManagerController)
);

// Execute safe automated tasks
router.post(
  '/execute/safe-tasks',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.executeSafeTasks.bind(aiManagerController)
);

// Run full analysis
router.post(
  '/analyze/all',
  authenticateToken,
  requireRole('ADMIN'),
  aiManagerController.analyzeAll.bind(aiManagerController)
);

export default router;
