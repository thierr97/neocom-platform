import { Request, Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

// Get all users (excluding passwords)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        permissions: true,
        workStartTime: true,
        workEndTime: true,
        workDays: true,
        timezone: true,
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
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
      data: user,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
    });
  }
};

// Create new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role, status } = req.body;

    // Check if user exists
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
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role, status, password } = req.body;

    const updateData: any = {
      email,
      firstName,
      lastName,
      phone,
      role,
      status,
    };

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return res.json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès',
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
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
    });
  }
};

// Get user permissions
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        permissions: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // If no permissions set, return default all-enabled permissions
    const defaultPermissions = {
      dashboard: true,
      customers: true,
      orders: true,
      quotes: true,
      invoices: true,
      products: true,
      suppliers: true,
      accounting: true,
      statistics: true,
      gps: true,
      users: true,
      settings: true,
      import_export: true,
      shop: true,
    };

    return res.json({
      success: true,
      data: user.permissions || defaultPermissions,
    });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des permissions',
    });
  }
};

// Update user permissions
export const updateUserPermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permissions = req.body;

    // Validate that permissions is an object
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Les permissions doivent être un objet',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        permissions: permissions,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
      },
    });

    return res.json({
      success: true,
      data: user,
      message: 'Permissions mises à jour avec succès',
    });
  } catch (error: any) {
    console.error('Error updating user permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des permissions',
    });
  }
};
