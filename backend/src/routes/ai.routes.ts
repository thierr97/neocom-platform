import { Router } from 'express';
import {
  getRecommendations,
  getSimilarProducts,
  predictChurn,
  batchPredictChurn,
  predictOrderQuantity,
  getTrendingProducts,
  getAIInsights,
} from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/ai/recommendations/:customerId
 * @desc Get product recommendations for a customer
 * @access Private
 */
router.get('/recommendations/:customerId', getRecommendations);

/**
 * @route GET /api/ai/similar/:productId
 * @desc Get similar products
 * @access Private
 */
router.get('/similar/:productId', getSimilarProducts);

/**
 * @route GET /api/ai/churn/:customerId
 * @desc Predict customer churn risk
 * @access Private
 */
router.get('/churn/:customerId', predictChurn);

/**
 * @route GET /api/ai/churn/batch
 * @desc Get batch churn predictions
 * @access Private
 */
router.get('/churn-batch', batchPredictChurn);

/**
 * @route GET /api/ai/order-quantity/:productId
 * @desc Predict optimal order quantity
 * @access Private
 */
router.get('/order-quantity/:productId', predictOrderQuantity);

/**
 * @route GET /api/ai/trending
 * @desc Get trending products
 * @access Private
 */
router.get('/trending', getTrendingProducts);

/**
 * @route GET /api/ai/insights
 * @desc Get AI insights dashboard
 * @access Private
 */
router.get('/insights', getAIInsights);

export default router;
