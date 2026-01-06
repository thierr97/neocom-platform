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
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Routes publiques
router.get('/active', getActiveBanner); // Bannière active pour le frontend
router.get('/', getAllBanners); // Liste toutes les bannières (pour admin)

// Routes admin uniquement
router.post('/', authenticate, authorize(['ADMIN']), createBanner);
router.get('/:id', authenticate, authorize(['ADMIN']), getBannerById);
router.put('/:id', authenticate, authorize(['ADMIN']), updateBanner);
router.patch('/:id/toggle', authenticate, authorize(['ADMIN']), toggleBannerStatus);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteBanner);

export default router;
