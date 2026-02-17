import { Request, Response, NextFunction } from 'express';
import { verifySupplierAccessToken, SupplierTokenPayload } from '../utils/supplier-jwt';

// Interface pour ajouter le supplier au request
export interface SupplierAuthRequest extends Request {
  supplier?: SupplierTokenPayload;
  body: any;
  query: any;
  params: any;
  headers: any;
}

// Middleware d'authentification pour les fournisseurs
export const authenticateSupplier = (
  req: SupplierAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification manquant',
    });
  }

  try {
    const payload = verifySupplierAccessToken(token);
    req.supplier = payload;
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
};

// Middleware pour vérifier que le fournisseur est ACTIVE (approuvé)
export const requireApprovedSupplier = (
  req: SupplierAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.supplier) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié',
    });
  }

  if (req.supplier.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: 'Votre compte doit être approuvé pour accéder à cette ressource',
      status: req.supplier.status,
    });
  }

  return next();
};

// Middleware combiné : authentification + statut approuvé
export const authenticateApprovedSupplier = [
  authenticateSupplier,
  requireApprovedSupplier,
];
