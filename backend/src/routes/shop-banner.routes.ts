import { Router } from 'express';
import {
  getAllBanners,
  getActiveBanner,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} from '../controllers/shop-banner.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes publiques
router.get('/active', getActiveBanner); // Bannière active pour le frontend
router.get('/', getAllBanners); // Liste toutes les bannières (pour admin)

// Routes admin uniquement
router.post('/', authenticateToken, requireRole('ADMIN'), createBanner);
router.get('/:id', authenticateToken, requireRole('ADMIN'), getBannerById);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateBanner);
router.patch('/:id/toggle', authenticateToken, requireRole('ADMIN'), toggleBannerStatus);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteBanner);

export default router;
