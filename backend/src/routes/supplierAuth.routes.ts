import express from 'express';
import * as supplierAuthController from '../controllers/supplierAuth.controller';
import { authenticateSupplier } from '../middleware/supplierAuth';

const router = express.Router();

/**
 * @route POST /api/suppliers/auth/register
 * @desc Inscription d'un nouveau fournisseur (candidature marketplace)
 * @access Public
 */
router.post('/register', supplierAuthController.registerSupplier);

/**
 * @route POST /api/suppliers/auth/login
 * @desc Connexion fournisseur
 * @access Public
 */
router.post('/login', supplierAuthController.loginSupplier);

/**
 * @route POST /api/suppliers/auth/logout
 * @desc Déconnexion fournisseur
 * @access Private (Supplier)
 */
router.post('/logout', authenticateSupplier, supplierAuthController.logoutSupplier);

/**
 * @route GET /api/suppliers/auth/me
 * @desc Obtenir le profil du fournisseur connecté
 * @access Private (Supplier)
 */
router.get('/me', authenticateSupplier, supplierAuthController.getSupplierProfile);

/**
 * @route PUT /api/suppliers/auth/profile
 * @desc Mettre à jour le profil du fournisseur
 * @access Private (Supplier)
 */
router.put('/profile', authenticateSupplier, supplierAuthController.updateSupplierProfile);

export default router;
