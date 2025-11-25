import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '../config/permissions';

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée - Vous n\'avez pas les droits nécessaires',
        requiredPermission: permission,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée - Vous n\'avez pas les droits nécessaires',
        requiredPermissions: permissions,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!hasAllPermissions(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée - Vous n\'avez pas tous les droits nécessaires',
        requiredPermissions: permissions,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific role
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Rôle insuffisant - Accès réservé',
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Check permission without middleware (for use in controllers)
 */
export const checkPermission = (userRole: UserRole, permission: Permission): boolean => {
  return hasPermission(userRole, permission);
};
