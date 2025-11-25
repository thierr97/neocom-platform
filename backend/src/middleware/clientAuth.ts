import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateClient = (req: Request, res: Response, next: NextFunction) => {
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

      if (decoded.type !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        });
      }

      (req as any).customer = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
    });
  }
};
