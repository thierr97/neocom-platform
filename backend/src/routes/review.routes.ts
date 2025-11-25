import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getReviewStatistics,
} from '../controllers/review.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/reviews/product/:productId
 * @desc Get reviews for a product (public - published only)
 * @access Public
 */
router.get('/product/:productId', getProductReviews);

/**
 * @route POST /api/reviews/product/:productId
 * @desc Create a new review for a product (public)
 * @access Public
 */
router.post('/product/:productId', createReview);

/**
 * @route GET /api/reviews
 * @desc Get all reviews (admin only - includes unpublished)
 * @access Private (Admin)
 */
router.get('/', authenticateToken, getAllReviews);

/**
 * @route GET /api/reviews/statistics
 * @desc Get review statistics
 * @access Private (Admin)
 */
router.get('/statistics', authenticateToken, getReviewStatistics);

/**
 * @route PATCH /api/reviews/:id/status
 * @desc Update review status (approve/reject/publish)
 * @access Private (Admin)
 */
router.patch('/:id/status', authenticateToken, updateReviewStatus);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review
 * @access Private (Admin)
 */
router.delete('/:id', authenticateToken, deleteReview);

export default router;
