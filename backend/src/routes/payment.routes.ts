import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/stripe/webhook', paymentController.stripeWebhook);
router.get('/methods', paymentController.getPaymentMethods);

// Protected routes
router.use(authenticateToken);

// Stripe
router.post('/stripe/create-intent', paymentController.createStripePaymentIntent);
router.post('/stripe/confirm', paymentController.confirmStripePayment);

// PayPal
router.post('/paypal/create-order', paymentController.createPayPalOrder);
router.post('/paypal/capture', paymentController.capturePayPalPayment);

export default router;
