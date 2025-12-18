import { Router } from 'express';
import * as deliveryController from '../controllers/delivery.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

/**
 * Routes de gestion des livraisons avec contrôle RBAC
 *
 * Permissions:
 * - ADMIN: Accès complet à toutes les routes
 * - COMMERCIAL: Peut créer et voir ses propres livraisons
 * - DELIVERY: Peut voir et mettre à jour ses livraisons assignées
 * - CLIENT: Peut voir ses propres livraisons (lecture seule)
 */

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * GET /api/deliveries
 * Liste toutes les livraisons accessibles selon le rôle
 * RBAC: ADMIN, COMMERCIAL, DELIVERY, CLIENT
 */
router.get('/', deliveryController.getAllDeliveries);

/**
 * GET /api/deliveries/:id
 * Récupère les détails d'une livraison avec historique complet
 * RBAC: ADMIN, COMMERCIAL (propriétaire), DELIVERY (assigné), CLIENT (propriétaire)
 */
router.get('/:id', deliveryController.getDeliveryById);

/**
 * POST /api/deliveries
 * Crée une nouvelle livraison
 * RBAC: ADMIN, COMMERCIAL uniquement
 */
router.post(
  '/',
  requireRole('ADMIN', 'COMMERCIAL'),
  deliveryController.createDelivery
);

/**
 * PATCH /api/deliveries/:id/status
 * Met à jour le statut d'une livraison
 * Déclenche automatiquement la création d'un DeliveryEvent via le middleware
 * RBAC: ADMIN, COMMERCIAL (propriétaire), DELIVERY (assigné)
 */
router.patch('/:id/status', deliveryController.updateDeliveryStatus);

/**
 * PATCH /api/deliveries/:id/assign
 * Assigne un coursier à une livraison
 * RBAC: ADMIN uniquement
 */
router.patch(
  '/:id/assign',
  requireRole('ADMIN'),
  deliveryController.assignCourier
);

/**
 * PATCH /api/deliveries/:id/location
 * Met à jour la position GPS du coursier en temps réel
 * RBAC: DELIVERY uniquement
 */
router.patch(
  '/:id/location',
  requireRole('DELIVERY'),
  deliveryController.updateLocation
);

/**
 * POST /api/deliveries/:id/proof
 * Ajoute une preuve de livraison (photo ou signature)
 * RBAC: DELIVERY uniquement
 */
router.post(
  '/:id/proof',
  requireRole('DELIVERY'),
  deliveryController.addDeliveryProof
);

/**
 * DELETE /api/deliveries/:id
 * Annule une livraison (soft delete via status CANCELED)
 * RBAC: ADMIN, COMMERCIAL (propriétaire)
 */
router.delete('/:id', deliveryController.cancelDelivery);

export default router;
