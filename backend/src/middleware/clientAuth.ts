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
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('FATAL: JWT_SECRET is not set');
        return res.status(500).json({ success: false, message: 'Erreur de configuration serveur' });
      }
      const decoded = jwt.verify(token, jwtSecret) as any;

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
