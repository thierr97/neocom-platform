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
// ❌ Inscription publique DÉSACTIVÉE — seul un commercial peut créer un compte client
router.post('/customer/register', (_req, res) => {
  res.status(403).json({
    success: false,
    message: "L'inscription en ligne n'est pas disponible. Contactez votre commercial NEOSERV pour obtenir un accès.",
  });
});
router.post('/customer/login', authController.loginCustomer);

// TEMPORARY - Route pour réinitialiser le mot de passe admin
router.post('/reset-admin-password', authController.resetAdminPassword);

export default router;
