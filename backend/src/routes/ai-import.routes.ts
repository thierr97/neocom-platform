import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { analyzeSource, createFromProposal } from '../controllers/ai-import.controller';

const router = Router();

// Import IA dropshipping — réservé aux admins
router.use(authenticateToken, requireRole('ADMIN'));

/**
 * @route POST /api/ai-import/analyze
 * @desc  URL fournisseur (AliExpress/Temu/Shein…) ou texte collé → fiche produit proposée par IA
 */
router.post('/analyze', analyzeSource);

/**
 * @route POST /api/ai-import/create
 * @desc  Fiche validée → images importées sur Cloudinary + produit créé (masqué par défaut)
 */
router.post('/create', createFromProposal);

export default router;
