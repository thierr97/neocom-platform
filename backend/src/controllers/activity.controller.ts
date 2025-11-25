import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all activities with filtering
export const getAllActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const {
      type,
      userId: filterUserId,
      customerId,
      startDate,
      endDate,
      search,
      limit = '50',
      offset = '0',
    } = req.query;

    const where: any = {};

    // Commercial users only see their own activities
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    } else if (filterUserId) {
      // Admin can filter by user
      where.userId = filterUserId;
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by customer
    if (customerId) {
      where.customerId = customerId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Search in description
    if (search) {
      where.description = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.activity.count({ where }),
    ]);

    return res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + activities.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités',
      error: error.message,
    });
  }
};

// Get activity by ID
export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activité non trouvée',
      });
    }

    return res.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité',
      error: error.message,
    });
  }
};

// Get activities for a specific customer
export const getCustomerActivities = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const activities = await prisma.activity.findMany({
      where: { customerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: activities,
      count: activities.length,
    });
  } catch (error: any) {
    console.error('Error fetching customer activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités client',
      error: error.message,
    });
  }
};

// Get activity statistics
export const getActivityStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { startDate, endDate, userId: filterUserId } = req.query;

    const where: any = {};

    // Commercial users only see their own stats
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    } else if (filterUserId) {
      where.userId = filterUserId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const activities = await prisma.activity.findMany({ where });

    // Count by type
    const byType: Record<string, number> = {};
    activities.forEach(activity => {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    });

    // Count by user
    const userActivities: Record<string, { count: number; name: string }> = {};
    for (const activity of activities) {
      if (activity.userId) {
        if (!userActivities[activity.userId]) {
          const user = await prisma.user.findUnique({
            where: { id: activity.userId },
            select: { firstName: true, lastName: true },
          });
          userActivities[activity.userId] = {
            count: 0,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          };
        }
        userActivities[activity.userId].count++;
      }
    }

    // Daily activity (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = activities.filter(a => {
        const activityDate = new Date(a.createdAt);
        return activityDate >= date && activityDate < nextDate;
      }).length;

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    const stats = {
      total: activities.length,
      byType,
      byUser: Object.entries(userActivities).map(([userId, data]) => ({
        userId,
        name: data.name,
        count: data.count,
      })),
      last7Days,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching activity statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};

// Get activity types
export const getActivityTypes = async (req: Request, res: Response) => {
  try {
    const types = await prisma.activity.findMany({
      select: { type: true },
      distinct: ['type'],
    });

    const typesList = types.map(t => t.type);

    return res.json({
      success: true,
      data: typesList,
    });
  } catch (error: any) {
    console.error('Error fetching activity types:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types d\'activité',
      error: error.message,
    });
  }
};

// Delete activity (admin only)
export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;

    // Only admins can delete activities
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Action non autorisée',
      });
    }

    await prisma.activity.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Activité supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'activité',
      error: error.message,
    });
  }
};

// Create activity (manual log)
export const createActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { type, description, customerId, metadata } = req.body;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type et description requis',
      });
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        userId,
        customerId,
        metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Activité créée avec succès',
      data: activity,
    });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'activité',
      error: error.message,
    });
  }
};

// Export activities to CSV
export const exportActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { type, startDate, endDate } = req.query;

    const where: any = {};

    // Commercial users only see their own activities
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV
    const csvLines = [
      'Date,Type,Description,Utilisateur,Email utilisateur,Client,Email client',
      ...activities.map(activity => {
        const date = new Date(activity.createdAt).toLocaleString('fr-FR');
        const userName = activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : '';
        const userEmail = activity.user?.email || '';
        const customerName = activity.customer?.companyName ||
          (activity.customer ? `${activity.customer.firstName} ${activity.customer.lastName}` : '');
        const customerEmail = activity.customer?.email || '';

        return `"${date}","${activity.type}","${activity.description}","${userName}","${userEmail}","${customerName}","${customerEmail}"`;
      }),
    ];

    const csv = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=activites_${Date.now()}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support

  } catch (error: any) {
    console.error('Error exporting activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};
