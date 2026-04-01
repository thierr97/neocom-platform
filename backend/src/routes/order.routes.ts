import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { serveHJKOrderPDF } from '../services/pdfGenerator.service';

const router = Router();

router.use(authenticateToken);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.get('/:id/delivery-note-pdf', orderController.generateDeliveryNotePDF);

// CHANTIER 3 — Bon de commande HJK anonymisé avec photos, sans montants
// Réservé aux rôles internes (jamais accessible au client)
router.get(
  '/:id/hjk-purchase-order',
  requireRole('ADMIN', 'COMMERCIAL', 'SUB_ADMIN'),
  async (req, res) => {
    try {
      await serveHJKOrderPDF(req.params.id, res);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// CHANTIER 3 — Envoi du bon HJK par email (internal use)
router.post(
  '/:id/hjk-send-email',
  requireRole('ADMIN', 'COMMERCIAL', 'SUB_ADMIN'),
  async (req, res) => {
    try {
      const { generateHJKPurchaseOrderPDF } = await import('../services/pdfGenerator.service');
      const { sendEmail } = await import('../services/notification.service');

      const pdfBuffer = await generateHJKPurchaseOrderPDF(req.params.id);
      const { to } = req.body;

      await sendEmail(
        to || process.env.HJK_EMAIL || '',
        `Bon de commande NEOSERV — ${req.params.id}`,
        `<p>Veuillez trouver ci-joint le bon de commande NEOSERV.</p>`,
        // attachment inline — nodemailer
      );

      // Envoyer avec pièce jointe via nodemailer directement
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });

      await transporter.sendMail({
        from: `"NEOSERV" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: to || process.env.HJK_EMAIL || '',
        subject: `Bon de commande NEOSERV — Commande ${req.params.id}`,
        html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint le bon de commande.</p><p>Cordialement,<br>NEOSERV</p>`,
        attachments: [
          { filename: `BC-NEOSERV-${req.params.id}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
        ],
      });

      res.json({ success: true, message: 'Bon de commande envoyé par email' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
