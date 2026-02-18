import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      suppliers,
    });
  } catch (error: any) {
    console.error('Error in getSuppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fournisseurs',
      error: error.message,
    });
  }
};

export const getSupplierById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé',
      });
    }

    res.json({
      success: true,
      supplier,
    });
  } catch (error: any) {
    console.error('Error in getSupplierById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fournisseur',
      error: error.message,
    });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      mobile,
      website,
      siret,
      vatNumber,
      address,
      addressLine2,
      city,
      postalCode,
      country,
      status,
      paymentTerms,
      paymentMethod,
      notes,
      tags,
    } = req.body;

    // Validation
    if (!companyName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la société et l\'email sont requis',
      });
    }

    // Check if email exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { email },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Un fournisseur avec cet email existe déjà',
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        mobile,
        website,
        siret,
        vatNumber,
        address,
        addressLine2,
        city,
        postalCode,
        country: country || 'France',
        status: status || 'ACTIVE',
        paymentTerms,
        paymentMethod,
        notes,
        tags: tags || [],
      },
    });

    res.status(201).json({
      success: true,
      supplier,
      message: 'Fournisseur créé avec succès',
    });
  } catch (error: any) {
    console.error('Error in createSupplier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du fournisseur',
      error: error.message,
    });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      mobile,
      website,
      siret,
      vatNumber,
      address,
      addressLine2,
      city,
      postalCode,
      country,
      status,
      paymentTerms,
      paymentMethod,
      notes,
      tags,
    } = req.body;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé',
      });
    }

    // Check if email is taken by another supplier
    if (email && email !== existingSupplier.email) {
      const emailTaken = await prisma.supplier.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre fournisseur',
        });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        mobile,
        website,
        siret,
        vatNumber,
        address,
        addressLine2,
        city,
        postalCode,
        country,
        status,
        paymentTerms,
        paymentMethod,
        notes,
        tags,
      },
    });

    res.json({
      success: true,
      supplier,
      message: 'Fournisseur mis à jour avec succès',
    });
  } catch (error: any) {
    console.error('Error in updateSupplier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du fournisseur',
      error: error.message,
    });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé',
      });
    }

    // Check if supplier has products
    if (existingSupplier._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce fournisseur car il est lié à ${existingSupplier._count.products} produit(s)`,
      });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Fournisseur supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error in deleteSupplier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fournisseur',
      error: error.message,
    });
  }
};

// TEMPORARY: Activate supplier by email (for testing)
export const activateSupplierByEmail = async (req: any, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
      });
    }

    const supplier = await prisma.supplier.update({
      where: { email },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Fournisseur activé avec succès',
      supplier: {
        id: supplier.id,
        email: supplier.email,
        companyName: supplier.companyName,
        status: supplier.status,
      },
    });
  } catch (error: any) {
    console.error('Error in activateSupplierByEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du fournisseur',
      error: error.message,
    });
  }
};
