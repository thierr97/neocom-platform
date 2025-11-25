import { Request, Response } from 'express';
import prisma from '../config/database';

// Get stats for a specific user (commercial/delivery)
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Get counts
    const customersCount = await prisma.customer.count({
      where: { userId },
    });

    const quotesCount = await prisma.quote.count({
      where: { userId },
    });

    const quotesAccepted = await prisma.quote.count({
      where: { userId, status: 'ACCEPTED' },
    });

    const quotesRejected = await prisma.quote.count({
      where: { userId, status: 'REJECTED' },
    });

    const ordersCount = await prisma.order.count({
      where: { userId },
    });

    const ordersDelivered = await prisma.order.count({
      where: { userId, status: 'DELIVERED' },
    });

    const invoicesCount = await prisma.invoice.count({
      where: { userId },
    });

    const invoicesPaid = await prisma.invoice.count({
      where: { userId, status: 'PAID' },
    });

    // Calculate total sales (sum of paid invoices)
    const paidInvoices = await prisma.invoice.findMany({
      where: { userId, status: 'PAID' },
      select: { total: true },
    });

    const totalSales = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });

    // Get recent quotes
    const recentQuotes = await prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        user,
        stats: {
          customersCount,
          quotesCount,
          quotesAccepted,
          quotesRejected,
          ordersCount,
          ordersDelivered,
          invoicesCount,
          invoicesPaid,
          totalSales,
        },
        recentActivities,
        recentOrders,
        recentQuotes,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
};

// Get all users stats summary (for team overview)
export const getAllUsersStats = async (req: Request, res: Response) => {
  try {
    // Get all commercial and delivery users
    const users = await prisma.user.findMany({
      where: {
        OR: [{ role: 'COMMERCIAL' }, { role: 'DELIVERY' }],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        avatar: true,
        isOnline: true,
        lastSeenAt: true,
        lastLoginAt: true,
        workStartTime: true,
        workEndTime: true,
        workDays: true,
        currentSessionId: true,
      },
    });

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const customersCount = await prisma.customer.count({
          where: { userId: user.id },
        });

        const quotesCount = await prisma.quote.count({
          where: { userId: user.id },
        });

        const ordersCount = await prisma.order.count({
          where: { userId: user.id },
        });

        const invoicesCount = await prisma.invoice.count({
          where: { userId: user.id },
        });

        // Calculate total sales
        const paidInvoices = await prisma.invoice.findMany({
          where: { userId: user.id, status: 'PAID' },
          select: { total: true },
        });

        const totalSales = paidInvoices.reduce(
          (sum, invoice) => sum + invoice.total,
          0
        );

        return {
          ...user,
          stats: {
            customersCount,
            quotesCount,
            ordersCount,
            invoicesCount,
            totalSales,
          },
        };
      })
    );

    // Sort by total sales
    usersWithStats.sort((a, b) => b.stats.totalSales - a.stats.totalSales);

    return res.json({
      success: true,
      data: usersWithStats,
    });
  } catch (error: any) {
    console.error('Error fetching all users stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
};

// Get connection statistics for a user
export const getUserConnectionStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get connection logs
    const connectionLogs = await prisma.connectionLog.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { loginAt: dateFilter }),
      },
      orderBy: { loginAt: 'desc' },
    });

    // Calculate statistics
    const totalConnections = connectionLogs.length;
    const totalDuration = connectionLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const averageDuration = totalConnections > 0 ? totalDuration / totalConnections : 0;

    // Get current session duration if online
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isOnline: true,
        currentSessionId: true,
      },
    });

    let currentSessionDuration = 0;
    if (user?.isOnline && user.currentSessionId) {
      const currentSession = await prisma.connectionLog.findUnique({
        where: { sessionId: user.currentSessionId },
      });
      if (currentSession) {
        currentSessionDuration = Math.floor((new Date().getTime() - currentSession.loginAt.getTime()) / 1000);
      }
    }

    // Group by day
    const connectionsByDay: any = {};
    connectionLogs.forEach((log) => {
      const day = log.loginAt.toISOString().split('T')[0];
      if (!connectionsByDay[day]) {
        connectionsByDay[day] = {
          date: day,
          connections: 0,
          totalDuration: 0,
        };
      }
      connectionsByDay[day].connections += 1;
      connectionsByDay[day].totalDuration += log.duration || 0;
    });

    const dailyStats = Object.values(connectionsByDay).sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );

    return res.json({
      success: true,
      data: {
        totalConnections,
        totalDuration,
        averageDuration,
        currentSessionDuration,
        isOnline: user?.isOnline || false,
        recentConnections: connectionLogs.slice(0, 10),
        dailyStats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user connection stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de connexion',
    });
  }
};

// Get team connection overview
export const getTeamConnectionStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get all team members
    const users = await prisma.user.findMany({
      where: {
        OR: [{ role: 'COMMERCIAL' }, { role: 'DELIVERY' }],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isOnline: true,
        lastSeenAt: true,
        workStartTime: true,
        workEndTime: true,
      },
    });

    // Get connection logs for all users
    const allConnectionLogs = await prisma.connectionLog.findMany({
      where: {
        user: {
          OR: [{ role: 'COMMERCIAL' }, { role: 'DELIVERY' }],
        },
        ...(Object.keys(dateFilter).length > 0 && { loginAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Calculate team statistics
    const totalConnections = allConnectionLogs.length;
    const totalDuration = allConnectionLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const averageDuration = totalConnections > 0 ? totalDuration / totalConnections : 0;

    // Online/offline counts
    const onlineCount = users.filter(u => u.isOnline).length;
    const offlineCount = users.length - onlineCount;

    // By role
    const commercialCount = users.filter(u => u.role === 'COMMERCIAL').length;
    const deliveryCount = users.filter(u => u.role === 'DELIVERY').length;
    const commercialOnline = users.filter(u => u.role === 'COMMERCIAL' && u.isOnline).length;
    const deliveryOnline = users.filter(u => u.role === 'DELIVERY' && u.isOnline).length;

    // Group connections by user
    const userStats: any = {};
    allConnectionLogs.forEach((log) => {
      if (!userStats[log.userId]) {
        userStats[log.userId] = {
          userId: log.userId,
          userName: `${log.user.firstName} ${log.user.lastName}`,
          role: log.user.role,
          connections: 0,
          totalDuration: 0,
        };
      }
      userStats[log.userId].connections += 1;
      userStats[log.userId].totalDuration += log.duration || 0;
    });

    const topUsers = Object.values(userStats)
      .sort((a: any, b: any) => b.totalDuration - a.totalDuration)
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        teamSize: users.length,
        onlineCount,
        offlineCount,
        commercialCount,
        deliveryCount,
        commercialOnline,
        deliveryOnline,
        totalConnections,
        totalDuration,
        averageDuration,
        topUsers,
        users,
      },
    });
  } catch (error: any) {
    console.error('Error fetching team connection stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de l\'équipe',
    });
  }
};
