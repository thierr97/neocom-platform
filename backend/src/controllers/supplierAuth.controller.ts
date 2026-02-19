import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateSupplierTokens } from '../utils/supplier-jwt';

// Inscription d'un nouveau fournisseur (candidature marketplace)
export const registerSupplier = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      companyName,
      contactPerson,
      phone,
      mobile,
      website,
      address,
      city,
      postalCode,
      country,
      legalForm,
      siret,
      vatNumber,
      businessSector,
      estimatedMonthlyRevenue,
    } = req.body;

    // Validation
    if (!email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe et nom de l\'entreprise sont requis',
      });
    }

    // Vérifier si le fournisseur existe déjà
    const existingSupplier = await prisma.supplier.findUnique({
      where: { email },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Un compte fournisseur existe déjà avec cet email',
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer le fournisseur avec statut PENDING
    const supplier = await prisma.supplier.create({
      data: {
        email,
        password: hashedPassword,
        companyName,
        contactPerson,
        phone,
        mobile,
        website,
        address,
        city,
        postalCode,
        country: country || 'France',
        legalForm,
        siret,
        vatNumber,
        businessSector,
        estimatedMonthlyRevenue,
        status: 'PENDING', // En attente de validation admin
      },
      select: {
        id: true,
        email: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    // Générer les tokens (même si PENDING, permet au fournisseur de voir son statut)
    const tokens = generateSupplierTokens({
      supplierId: supplier.id,
      email: supplier.email,
      companyName: supplier.companyName,
      status: supplier.status,
    });

    // Créer une session
    await prisma.supplierSession.create({
      data: {
        supplierId: supplier.id,
        token: tokens.accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // TODO: Envoyer une notification à l'admin pour validation

    return res.status(201).json({
      success: true,
      message: 'Candidature soumise avec succès. Votre compte sera validé par notre équipe sous 24-48h.',
      supplier,
      tokens,
    });
  } catch (error: any) {
    console.error('Error in registerSupplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message,
    });
  }
};

// Connexion fournisseur
export const loginSupplier = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Trouver le fournisseur
    const supplier = await prisma.supplier.findUnique({
      where: { email },
    });

    if (!supplier || !supplier.password) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, supplier.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier le statut
    if (supplier.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été bloqué. Contactez l\'administration.',
      });
    }

    if (supplier.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: 'Votre candidature a été rejetée. Raison: ' + (supplier.rejectedReason || 'Non spécifiée'),
      });
    }

    if (supplier.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est en attente de validation par notre équipe.',
        supplier: {
          id: supplier.id,
          email: supplier.email,
          companyName: supplier.companyName,
          status: supplier.status,
        },
      });
    }

    if (supplier.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est désactivé. Contactez l\'administration.',
      });
    }

    // Générer les tokens
    const tokens = generateSupplierTokens({
      supplierId: supplier.id,
      email: supplier.email,
      companyName: supplier.companyName,
      status: supplier.status,
    });

    // Créer une session
    await prisma.supplierSession.create({
      data: {
        supplierId: supplier.id,
        token: tokens.accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // Retourner les données du fournisseur (sans le password)
    const { password: _, ...supplierData } = supplier;

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      supplier: supplierData,
      tokens,
    });
  } catch (error: any) {
    console.error('Error in loginSupplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// Déconnexion
export const logoutSupplier = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Supprimer la session
      await prisma.supplierSession.deleteMany({
        where: { token },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error: any) {
    console.error('Error in logoutSupplier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message,
    });
  }
};

// Obtenir le profil du fournisseur connecté
export const getSupplierProfile = async (req: any, res: Response) => {
  try {
    const supplierId = req.supplier?.supplierId;

    if (!supplierId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        email: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        mobile: true,
        website: true,
        address: true,
        addressLine2: true,
        city: true,
        postalCode: true,
        country: true,
        legalForm: true,
        siret: true,
        vatNumber: true,
        businessSector: true,
        status: true,
        approvedAt: true,
        rejectedAt: true,
        rejectedReason: true,
        commissionRate: true,
        paymentFrequency: true,
        bankName: true,
        iban: true,
        bic: true,
        accountHolder: true,
        estimatedMonthlyRevenue: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé',
      });
    }

    return res.status(200).json({
      success: true,
      supplier,
    });
  } catch (error: any) {
    console.error('Error in getSupplierProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// Mettre à jour le profil
export const updateSupplierProfile = async (req: any, res: Response) => {
  try {
    const supplierId = req.supplier?.supplierId;
    const {
      contactPerson,
      phone,
      mobile,
      website,
      address,
      addressLine2,
      city,
      postalCode,
      country,
      legalForm,
      vatNumber,
      businessSector,
      bankName,
      iban,
      bic,
      accountHolder,
    } = req.body;

    // Build update data object, only including fields that are provided
    const updateData: any = {};
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (phone !== undefined) updateData.phone = phone;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (website !== undefined) updateData.website = website;
    if (address !== undefined) updateData.address = address;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (country !== undefined) updateData.country = country;
    if (legalForm !== undefined) updateData.legalForm = legalForm;
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber;
    if (businessSector !== undefined) updateData.businessSector = businessSector;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (iban !== undefined) updateData.iban = iban;
    if (bic !== undefined) updateData.bic = bic;
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder;

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
      select: {
        id: true,
        email: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        mobile: true,
        website: true,
        address: true,
        addressLine2: true,
        city: true,
        postalCode: true,
        country: true,
        legalForm: true,
        siret: true,
        vatNumber: true,
        businessSector: true,
        status: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      supplier,
    });
  } catch (error: any) {
    console.error('Error in updateSupplierProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};
