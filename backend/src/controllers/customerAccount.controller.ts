import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { generateClientRef } from '../utils/clientRef';
import { sendClientWelcomeEmail } from '../services/notification.service';
import crypto from 'crypto';

/**
 * CHANTIER 1 — Création de compte client par le commercial
 * Route réservée aux rôles ADMIN et COMMERCIAL uniquement
 */
export const createClientAccount = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      contactFirstName,
      contactLastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      allowDeferredPayment,
    } = req.body;

    if (!companyName && !contactFirstName) {
      return res.status(400).json({ success: false, message: 'Raison sociale ou nom du contact requis' });
    }

    // Vérifier doublon email (seulement si email fourni)
    if (email) {
      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Un client avec cet email existe déjà' });
      }
    }

    // Générer mot de passe temporaire
    const tempPassword = crypto.randomBytes(6).toString('hex').toUpperCase();
    const hashedPassword = await hashPassword(tempPassword);

    // Générer référence client CLI-XXXXXX
    const clientRef = await generateClientRef();

    // ID du commercial connecté
    const commercialId = (req as any).user?.id;

    const customer = await prisma.customer.create({
      data: {
        clientRef,
        type: companyName ? 'COMPANY' : 'INDIVIDUAL',
        status: 'ACTIVE',
        companyName: companyName || null,
        firstName: contactFirstName || null,
        lastName: contactLastName || null,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || 'France',
        password: hashedPassword,
        mustChangePassword: true,
        allowDeferredPayment: allowDeferredPayment || false,
        userId: commercialId,
      },
    });

    // Envoyer email de bienvenue avec identifiants
    await sendClientWelcomeEmail(customer, tempPassword);

    return res.status(201).json({
      success: true,
      message: `Compte client créé. Référence: ${clientRef}`,
      customer: {
        id: customer.id,
        clientRef: customer.clientRef,
        email: customer.email,
        companyName: customer.companyName,
        firstName: customer.firstName,
        lastName: customer.lastName,
        allowDeferredPayment: customer.allowDeferredPayment,
        status: customer.status,
        createdAt: customer.createdAt,
      },
    });
  } catch (error: any) {
    console.error('createClientAccount error:', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' });
  }
};

/**
 * Liste des clients avec leur référence CLI
 */
export const listClientAccounts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { clientRef: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { companyName: { contains: String(search), mode: 'insensitive' } },
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        clientRef: true,
        email: true,
        type: true,
        status: true,
        companyName: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        allowDeferredPayment: true,
        mustChangePassword: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, customers });
  } catch (error: any) {
    console.error('listClientAccounts error:', error);
    return res.status(500).json({ success: false, message: 'Erreur de chargement' });
  }
};

/**
 * Activer / désactiver un compte client
 */
export const toggleClientStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Client non trouvé' });

    const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await prisma.customer.update({ where: { id }, data: { status: newStatus } });

    return res.json({ success: true, status: newStatus });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Erreur' });
  }
};

/**
 * Mettre à jour le paiement différé d'un client
 */
export const updateDeferredPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { allowDeferredPayment } = req.body;

    await prisma.customer.update({
      where: { id },
      data: { allowDeferredPayment: Boolean(allowDeferredPayment) },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Erreur' });
  }
};
