import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createClientAccount,
  listClientAccounts,
  toggleClientStatus,
  updateDeferredPayment,
} from '../controllers/customerAccount.controller';

const router = Router();

// Toutes ces routes nécessitent d'être connecté en tant qu'ADMIN ou COMMERCIAL
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'COMMERCIAL', 'SUB_ADMIN'));

// Créer un compte client
router.post('/', createClientAccount);

// Lister les comptes clients
router.get('/', listClientAccounts);

// Activer/désactiver un compte
router.patch('/:id/toggle-status', toggleClientStatus);

// Modifier option paiement différé
router.patch('/:id/deferred-payment', updateDeferredPayment);

export default router;
