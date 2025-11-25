import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRole, Permission, getRolePermissions, getPermissionDescription } from '../config/permissions';

const prisma = new PrismaClient();

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
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
        updatedAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message,
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Get user permissions
    const permissions = getRolePermissions(user.role as UserRole);

    return res.json({
      success: true,
      data: {
        ...user,
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message,
    });
  }
};

// Create user (admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role, status } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'COMMERCIAL',
        status: status || 'ACTIVE',
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
        createdAt: true,
      },
    });

    // Log activity
    const adminId = (req as any).user.userId;
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Utilisateur créé: ${email} (${role})`,
        userId: adminId,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: user,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message,
    });
  }
};

// Update user (admin only)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role, status } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        phone,
        role,
        status,
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
        updatedAt: true,
      },
    });

    // Log activity
    const adminId = (req as any).user.userId;
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Utilisateur modifié: ${updatedUser.email}`,
        userId: adminId,
      },
    });

    return res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'utilisateur',
      error: error.message,
    });
  }
};

// Update user password (admin only)
export const updateUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log activity
    const adminId = (req as any).user.userId;
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Mot de passe modifié pour: ${user.email}`,
        userId: adminId,
      },
    });

    return res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du mot de passe',
      error: error.message,
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.userId;

    // Prevent self-deletion
    if (id === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Utilisateur supprimé: ${user.email}`,
        userId: adminId,
      },
    });

    return res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message,
    });
  }
};

// Get all available roles and their permissions
export const getRolesAndPermissions = async (req: Request, res: Response) => {
  try {
    const roles = Object.values(UserRole).map(role => ({
      role,
      name: getRoleName(role),
      permissions: getRolePermissions(role as UserRole).map(permission => ({
        permission,
        description: getPermissionDescription(permission),
      })),
    }));

    return res.json({
      success: true,
      data: roles,
    });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rôles',
      error: error.message,
    });
  }
};

// Get user statistics
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const inactiveUsers = await prisma.user.count({ where: { status: 'INACTIVE' } });
    const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      suspended: suspendedUsers,
      byRole: usersByRole.map(item => ({
        role: item.role,
        name: getRoleName(item.role),
        count: item._count,
      })),
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching user statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};

// Helper function to get role name
const getRoleName = (role: string): string => {
  const names: Record<string, string> = {
    ADMIN: 'Administrateur',
    COMMERCIAL: 'Commercial',
    DELIVERY: 'Livreur',
    CLIENT: 'Client',
  };
  return names[role] || role;
};
