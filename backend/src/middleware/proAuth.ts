import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

/**
 * Middleware pour authentifier les clients PRO (B2B)
 * Vérifie que le client a un profil PRO approuvé
 */
export const authenticateProCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant ou invalide',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

      // Vérifier que c'est un customer
      if (decoded.type !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Accès réservé aux clients PRO',
        });
      }

      // Récupérer le customer avec son profil PRO
      const customer = await prisma.customer.findUnique({
        where: { id: decoded.userId },
        include: {
          proProfile: true,
        },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      // Vérifier que le client a un profil PRO
      if (!customer.proProfile) {
        return res.status(403).json({
          success: false,
          message: 'Accès réservé aux clients PRO',
        });
      }

      // Vérifier que le profil PRO est approuvé
      if (customer.proProfile.status !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          message: 'Votre compte PRO est en attente de validation',
          status: customer.proProfile.status,
        });
      }

      // Ajouter le customer et son profil PRO à la requête
      (req as any).customer = customer;
      (req as any).proProfile = customer.proProfile;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    console.error('Error in authenticateProCustomer:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
    });
  }
};

/**
 * Middleware pour vérifier le statut du profil PRO
 * Permet de restreindre certaines routes selon le statut
 */
export const requireProStatus = (...statuses: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const proProfile = (req as any).proProfile;

    if (!proProfile) {
      return res.status(403).json({
        success: false,
        message: 'Profil PRO requis',
      });
    }

    if (!statuses.includes(proProfile.status)) {
      return res.status(403).json({
        success: false,
        message: 'Statut de compte PRO insuffisant',
        currentStatus: proProfile.status,
        requiredStatuses: statuses,
      });
    }

    next();
  };
};
