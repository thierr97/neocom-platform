import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'CLIENT',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      user,
      tokens,
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé ou suspendu',
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Créer une session de connexion
    const sessionId = randomUUID();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Créer le log de connexion
    await prisma.connectionLog.create({
      data: {
        userId: user.id,
        sessionId,
        ipAddress,
        userAgent,
        loginAt: new Date(),
      },
    });

    // Mettre à jour l'utilisateur comme en ligne
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        isOnline: true,
        lastSeenAt: new Date(),
        currentSessionId: sessionId,
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Connexion réussie',
      user: { ...userWithoutPassword, isOnline: true, sessionId },
      tokens,
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName,
        lastName,
        phone,
        avatar,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
      },
    });

    return res.json({
      success: true,
      message: 'Profil mis à jour',
      user,
    });
  } catch (error: any) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Récupérer la session actuelle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentSessionId: true },
    });

    if (user && user.currentSessionId) {
      // Récupérer le log de connexion
      const connectionLog = await prisma.connectionLog.findUnique({
        where: { sessionId: user.currentSessionId },
      });

      if (connectionLog) {
        // Calculer la durée de la session
        const duration = Math.floor((new Date().getTime() - connectionLog.loginAt.getTime()) / 1000);

        // Mettre à jour le log avec l'heure de déconnexion
        await prisma.connectionLog.update({
          where: { sessionId: user.currentSessionId },
          data: {
            logoutAt: new Date(),
            duration,
          },
        });
      }
    }

    // Marquer l'utilisateur comme hors ligne
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeenAt: new Date(),
        currentSessionId: null,
      },
    });

    return res.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error: any) {
    console.error('Error in logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message,
    });
  }
};
