import { Router } from 'express';
import * as courierController from '../controllers/courier.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { courierDocumentUpload } from '../middleware/courier-upload';

const router = Router();

/**
 * Routes de gestion des coursiers avec contrôle RBAC
 *
 * Structure:
 * - /api/courier/apply          - Candidature publique (sans auth)
 * - /api/courier/profile        - Profil du coursier connecté (DELIVERY)
 * - /api/courier/documents      - Gestion des documents KYC (DELIVERY)
 * - /api/courier/admin/*        - Administration (ADMIN uniquement)
 */

/**
 * POST /api/courier/apply
 * Candidature pour devenir coursier (route publique)
 * Crée un compte User avec role=DELIVERY et un CourierProfile avec status=PENDING
 */
router.post('/apply', courierController.applyCourier);

// ==========================================
// Routes coursier (DELIVERY uniquement)
// ==========================================

/**
 * GET /api/courier/profile
 * Récupère le profil complet du coursier connecté avec statistiques
 * RBAC: DELIVERY uniquement
 */
router.get(
  '/profile',
  authenticateToken,
  requireRole('DELIVERY'),
  courierController.getCourierProfile
);

/**
 * PATCH /api/courier/profile
 * Met à jour le profil du coursier connecté
 * RBAC: DELIVERY uniquement
 */
router.patch(
  '/profile',
  authenticateToken,
  requireRole('DELIVERY'),
  courierController.updateCourierProfile
);

/**
 * POST /api/courier/documents
 * Upload d'un document KYC (ID_CARD, DRIVER_LICENSE, etc.)
 * RBAC: DELIVERY uniquement
 * Requires multipart/form-data with 'file' field
 */
router.post(
  '/documents',
  authenticateToken,
  requireRole('DELIVERY'),
  courierDocumentUpload.single('file'),
  courierController.uploadDocument
);

/**
 * GET /api/courier/documents
 * Liste tous les documents du coursier connecté
 * RBAC: DELIVERY uniquement
 */
router.get(
  '/documents',
  authenticateToken,
  requireRole('DELIVERY'),
  courierController.getMyDocuments
);

// ==========================================
// Routes admin (ADMIN uniquement)
// ==========================================

/**
 * GET /api/courier/admin/pending
 * Liste tous les coursiers en attente de validation KYC
 * RBAC: ADMIN uniquement
 */
router.get(
  '/admin/pending',
  authenticateToken,
  requireRole('ADMIN'),
  courierController.getPendingCouriers
);

/**
 * GET /api/courier/admin/all
 * Liste tous les coursiers avec filtres (status, isAvailable)
 * RBAC: ADMIN uniquement
 */
router.get(
  '/admin/all',
  authenticateToken,
  requireRole('ADMIN'),
  courierController.getAllCouriers
);

/**
 * PATCH /api/courier/documents/:id/status
 * Valide ou rejette un document KYC
 * Déclenche l'activation automatique du profil si tous les documents requis sont validés
 * RBAC: ADMIN uniquement
 */
router.patch(
  '/documents/:id/status',
  authenticateToken,
  requireRole('ADMIN'),
  courierController.validateDocument
);

export default router;
