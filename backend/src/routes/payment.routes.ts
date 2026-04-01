import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';
import { getBankInfo } from '../utils/getCompanySettings';

const router = Router();

// Webhook Stripe — DOIT être public et recevoir le body brut
router.post('/stripe/webhook', paymentController.stripeWebhook);

// Routes publiques checkout
router.get('/methods', paymentController.getPaymentMethods);
router.post('/stripe/create-intent', paymentController.createStripePaymentIntent);
router.post('/stripe/confirm', paymentController.confirmStripePayment);

// CHANTIER 4 — Infos virement bancaire NEOSERV (pour le client connecté)
router.get('/bank-transfer-info', authenticateToken, async (_req, res) => {
  try {
    const bankInfo = await getBankInfo();
    res.json({
      success: true,
      bankInfo: {
        accountHolder: bankInfo.accountHolder,
        iban: bankInfo.iban,
        bic: bankInfo.bic,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur récupération RIB' });
  }
});

// CHANTIER 4 — Paiement différé validé manuellement par le commercial
router.post('/deferred-confirm/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = (req as any).user;

    if (!['ADMIN', 'COMMERCIAL', 'SUB_ADMIN'].includes(user?.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID', status: 'PROCESSING' },
      include: { customer: true },
    });

    await prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        method: 'DEFERRED',
        status: 'COMPLETED',
        transactionId: `DEFERRED-${orderId}-${Date.now()}`,
        paidAt: new Date(),
      } as any,
    });

    try {
      const { sendClientPaymentReceipt } = await import('../services/notification.service');
      await sendClientPaymentReceipt(order.customer, order);
    } catch {}

    return res.json({ success: true, message: 'Paiement différé confirmé, commande en traitement' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
