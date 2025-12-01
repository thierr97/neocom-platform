import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Client registration
export const clientRegister = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      phone,
      mobile,
      address,
      addressLine2,
      city,
      postalCode,
      country,
      type, // 'INDIVIDUAL' or 'COMPANY'
    } = req.body;

    // Validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, prénom et nom sont requis',
      });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Un compte client existe déjà avec cet email',
      });
    }

    // Find or create public user
    let publicUser = await prisma.user.findFirst({
      where: { email: 'public@neoserv.com' },
    });

    if (!publicUser) {
      publicUser = await prisma.user.create({
        data: {
          email: 'public@neoserv.com',
          password: await bcrypt.hash('public123', 10),
          role: 'CLIENT',
          firstName: 'Public',
          lastName: 'User',
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        type: type || (companyName ? 'COMPANY' : 'INDIVIDUAL'),
        email,
        password: hashedPassword,
        firstName,
        lastName,
        companyName,
        phone,
        mobile,
        address,
        addressLine2,
        city,
        postalCode,
        country: country || 'France',
        status: 'ACTIVE',
        userId: publicUser.id,
      },
    });

    // Generate token
    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, type: 'customer' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        companyName: customer.companyName,
      },
    });
  } catch (error: any) {
    console.error('Error in client registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message,
    });
  }
};

// Client registration/login with Google
export const clientGoogleAuth = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, googleId } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, prénom et nom sont requis',
      });
    }

    // Check if customer exists
    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      // Find or create public user
      let publicUser = await prisma.user.findFirst({
        where: { email: 'public@neoserv.com' },
      });

      if (!publicUser) {
        publicUser = await prisma.user.create({
          data: {
            email: 'public@neoserv.com',
            password: await bcrypt.hash('public123', 10),
            role: 'CLIENT',
            firstName: 'Public',
            lastName: 'User',
          },
        });
      }

      // Create new customer
      customer = await prisma.customer.create({
        data: {
          type: 'INDIVIDUAL',
          email,
          firstName,
          lastName,
          status: 'ACTIVE',
          userId: publicUser.id,
          notes: `Inscrit via Google (ID: ${googleId})`,
        },
      });
    }

    // Generate token
    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, type: 'customer' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        companyName: customer.companyName,
      },
    });
  } catch (error: any) {
    console.error('Error in Google auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification Google',
      error: error.message,
    });
  }
};

// Client login with email and password
export const clientLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Check if customer has a password set
    if (!customer.password) {
      return res.status(401).json({
        success: false,
        message: 'Aucun mot de passe défini pour ce compte. Veuillez contacter l\'administrateur.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Generate token
    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, type: 'customer' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        companyName: customer.companyName,
      },
    });
  } catch (error: any) {
    console.error('Error in client login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// Get client orders
export const getClientOrders = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Error fetching client orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message,
    });
  }
};

// Get client order by ID
export const getClientOrder = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error fetching client order:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message,
    });
  }
};

// Get client invoices
export const getClientInvoices = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
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

    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    console.error('Error fetching client invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message,
    });
  }
};

// Get client invoice by ID
export const getClientInvoice = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        order: {
          select: {
            number: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error fetching client invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error.message,
    });
  }
};

// Get client quotes
export const getClientQuotes = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const quotes = await prisma.quote.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    console.error('Error fetching client quotes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message,
    });
  }
};

// Get client profile
export const getClientProfile = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error('Error fetching client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// Update client profile
export const updateClientProfile = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;
    const {
      firstName,
      lastName,
      companyName,
      phone,
      mobile,
      address,
      addressLine2,
      city,
      postalCode,
      country,
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName,
        lastName,
        companyName,
        phone,
        mobile,
        address,
        addressLine2,
        city,
        postalCode,
        country,
      },
    });

    return res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: customer,
    });
  } catch (error: any) {
    console.error('Error updating client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// Get client statistics
export const getClientStatistics = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const [orders, invoices, quotes] = await Promise.all([
      prisma.order.findMany({ where: { customerId } }),
      prisma.invoice.findMany({ where: { customerId } }),
      prisma.quote.findMany({ where: { customerId } }),
    ]);

    const totalSpent = orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;

    const stats = {
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      totalSpent,
      totalInvoices: invoices.length,
      unpaidInvoices: invoices.filter(i => i.status !== 'PAID').length,
      totalQuotes: quotes.length,
      pendingQuotes: quotes.filter(q => q.status === 'SENT').length,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching client statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};
