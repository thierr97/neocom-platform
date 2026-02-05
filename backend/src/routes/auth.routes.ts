import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes pour les utilisateurs internes (admin, commercial, etc.)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Routes pour les clients
router.post('/customer/register', authController.registerCustomer);
router.post('/customer/login', authController.loginCustomer);

// TEMPORARY - Route pour réinitialiser le mot de passe admin
router.post('/reset-admin-password', authController.resetAdminPassword);

export default router;
