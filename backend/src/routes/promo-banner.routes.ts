import express from 'express';
import {
  getAllPromoBanners,
  getActiveBanner,
  getPromoBannerById,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  togglePromoBanner,
} from '../controllers/promo-banner.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.get('/active', getActiveBanner); // Bannière active pour le shop

// Routes protégées (ADMIN uniquement)
router.get('/', authenticateToken, requireRole('ADMIN'), getAllPromoBanners);
router.get('/:id', authenticateToken, requireRole('ADMIN'), getPromoBannerById);
router.post('/', authenticateToken, requireRole('ADMIN'), createPromoBanner);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updatePromoBanner);
router.put('/:id/toggle', authenticateToken, requireRole('ADMIN'), togglePromoBanner);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deletePromoBanner);

export default router;
