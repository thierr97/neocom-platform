import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExportService } from '../services/export.service';

const prisma = new PrismaClient();

// Export all orders to Excel
export const exportOrders = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Commercial users only see their own orders
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ExportService.exportOrdersToExcel(orders, res);
  } catch (error: any) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};

// Export single order details to Excel
export const exportOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    ExportService.exportOrderDetailsToExcel(order, res);
  } catch (error: any) {
    console.error('Error exporting order details:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};

// Export all customers to Excel
export const exportCustomers = async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Commercial users only see their own customers
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ExportService.exportCustomersToExcel(customers, res);
  } catch (error: any) {
    console.error('Error exporting customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};

// Export all products to Excel
export const exportProducts = async (req: Request, res: Response) => {
  try {
    const { status, categoryId } = req.query;

    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    ExportService.exportProductsToExcel(products, res);
  } catch (error: any) {
    console.error('Error exporting products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};

// Export all invoices to Excel
export const exportInvoices = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate as string);
      }
    }

    // Commercial users only see their own invoices
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            number: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    ExportService.exportInvoicesToExcel(invoices, res);
  } catch (error: any) {
    console.error('Error exporting invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};

// Export all quotes to Excel
export const exportQuotes = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Commercial users only see their own quotes
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ExportService.exportQuotesToExcel(quotes, res);
  } catch (error: any) {
    console.error('Error exporting quotes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message,
    });
  }
};
