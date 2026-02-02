import { Router } from 'express';
import { authenticateToken as auth } from '../middleware/auth';
import {
  startTrip,
  endTrip,
  getTrips,
  getTripById,
  updateTrip,
  getActiveTrip,
  addCheckpoint,
  createVisit,
  checkInVisit,
  checkOutVisit,
  getVisits,
  validateTrip,
  reimburseTrip,
  fixActiveTrips,
} from '../controllers/trip.controller';

const router = Router();

// ========================================
// TRIP ROUTES
// ========================================

// Démarrer un nouveau trajet
router.post('/trips/start', auth, startTrip);

// Terminer un trajet
router.post('/trips/:id/end', auth, endTrip);

// Récupérer tous les trajets (avec filtres)
router.get('/trips', auth, getTrips);

// Récupérer le trajet actif de l'utilisateur
router.get('/trips/active', auth, getActiveTrip);

// Récupérer un trajet par ID
router.get('/trips/:id', auth, getTripById);

// Mettre à jour un trajet
router.put('/trips/:id', auth, updateTrip);

// Valider un trajet (admin/manager)
router.post('/trips/:id/validate', auth, validateTrip);

// Rembourser un trajet (admin/manager)
router.post('/trips/:id/reimburse', auth, reimburseTrip);

// Terminer tous les trajets actifs (admin only - pour débloquer les trajets bloqués)
router.post('/trips/fix-active', auth, fixActiveTrips);

// ========================================
// CHECKPOINT ROUTES
// ========================================

// Ajouter un point GPS
router.post('/trips/checkpoints', auth, addCheckpoint);

// ========================================
// VISIT ROUTES
// ========================================

// Créer une nouvelle visite
router.post('/visits', auth, createVisit);

// Check-in visite
router.post('/visits/:id/checkin', auth, checkInVisit);

// Check-out visite
router.post('/visits/:id/checkout', auth, checkOutVisit);

// Récupérer toutes les visites
router.get('/visits', auth, getVisits);

export default router;
