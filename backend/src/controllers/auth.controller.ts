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

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token manquant',
      });
    }

    // Importer la fonction de vérification
    const { verifyRefreshToken, generateTokens } = await import('../utils/jwt');

    // Vérifier le refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur introuvable ou inactif',
      });
    }

    // Générer de nouveaux tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      success: true,
      message: 'Tokens renouvelés',
      tokens,
    });
  } catch (error: any) {
    console.error('Error in refreshToken:', error);
    return res.status(401).json({
      success: false,
      message: 'Refresh token invalide ou expiré',
      error: error.message,
    });
  }
};

// TEMPORARY ENDPOINT - Réinitialiser mot de passe admin
export const resetAdminPassword = async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;

    // Clé secrète pour sécuriser l'endpoint
    if (secretKey !== 'NEOSERV_RESET_2025') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const newPassword = 'admin123';
    const hashedPassword = await hashPassword(newPassword);

    // Trouver et mettre à jour l'admin
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@neoserv.com' },
    });

    if (!admin) {
      // Créer l'admin s'il n'existe pas
      await prisma.user.create({
        data: {
          email: 'admin@neoserv.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'NEOSERV',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      return res.json({
        success: true,
        message: 'Admin créé avec succès',
        credentials: {
          email: 'admin@neoserv.com',
          password: 'admin123',
        },
      });
    }

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword, status: 'ACTIVE' },
    });

    return res.json({
      success: true,
      message: 'Mot de passe admin réinitialisé',
      credentials: {
        email: 'admin@neoserv.com',
        password: 'admin123',
      },
    });
  } catch (error: any) {
    console.error('Error in resetAdminPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation',
      error: error.message,
    });
  }
};

// ============================================
// CUSTOMER AUTHENTICATION
// ============================================

// Inscription client
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      type,
      firstName,
      lastName,
      companyName,
      phone,
      address,
      city,
      postalCode,
      siret,
      vatNumber,
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    if (type === 'COMPANY' && !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Nom de l\'entreprise requis pour un compte professionnel',
      });
    }

    if (type === 'INDIVIDUAL' && (!firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        message: 'Nom et prénom requis pour un compte particulier',
      });
    }

    // Vérifier si l'email existe déjà
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Hash du mot de passe
    const hashedPassword = await hashPassword(password);

    // Trouver un commercial par défaut pour assigner le client
    // (nécessaire car customer.userId est required)
    const defaultCommercial = await prisma.user.findFirst({
      where: { role: 'COMMERCIAL', status: 'ACTIVE' },
    });

    if (!defaultCommercial) {
      return res.status(500).json({
        success: false,
        message: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
      });
    }

    // Créer le client
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        type: type || 'INDIVIDUAL',
        firstName: type === 'INDIVIDUAL' ? firstName : undefined,
        lastName: type === 'INDIVIDUAL' ? lastName : undefined,
        companyName: type === 'COMPANY' ? companyName : undefined,
        siret: type === 'COMPANY' ? siret : undefined,
        vatNumber: type === 'COMPANY' ? vatNumber : undefined,
        phone,
        address,
        city,
        postalCode,
        status: 'ACTIVE',
        userId: defaultCommercial.id, // Assigner au commercial par défaut
      },
      select: {
        id: true,
        email: true,
        type: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        status: true,
        createdAt: true,
      },
    });

    // Générer les tokens (rôle CUSTOMER pour différencier des users internes)
    const tokens = generateTokens({
      userId: customer.id,
      email: customer.email,
      role: 'CUSTOMER' as any, // Type spécial pour les clients
    });

    return res.status(201).json({
      success: true,
      message: 'Compte client créé avec succès',
      customer,
      tokens,
    });
  } catch (error: any) {
    console.error('Error in registerCustomer:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
      error: error.message,
    });
  }
};

// Connexion client
export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Chercher le client
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        type: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        status: true,
      },
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé ou suspendu',
      });
    }

    if (!customer.password) {
      return res.status(401).json({
        success: false,
        message: 'Veuillez contacter votre commercial pour activer votre compte',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Générer les tokens
    const tokens = generateTokens({
      userId: customer.id,
      email: customer.email,
      role: 'CUSTOMER' as any,
    });

    // Retirer le password de la réponse
    const { password: _, ...customerData } = customer;

    return res.json({
      success: true,
      message: 'Connexion réussie',
      customer: customerData,
      tokens,
    });
  } catch (error: any) {
    console.error('Error in loginCustomer:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};
