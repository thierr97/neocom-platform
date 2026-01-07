import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (accessible sans authentification pour le checkout)
router.post('/stripe/webhook', paymentController.stripeWebhook);
router.get('/methods', paymentController.getPaymentMethods);
router.post('/stripe/create-intent', paymentController.createStripePaymentIntent);
router.post('/stripe/confirm', paymentController.confirmStripePayment);

// PayPal routes (publiques pour le checkout)
router.post('/paypal/create-order', paymentController.createPayPalOrder);
router.post('/paypal/capture', paymentController.capturePayPalPayment);

export default router;
