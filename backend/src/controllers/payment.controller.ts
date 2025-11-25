import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe (you need to set STRIPE_SECRET_KEY in .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// Create Stripe payment intent
export const createStripePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, currency = 'eur' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID et montant requis',
      });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
        customerEmail: order.customer.email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement',
      error: error.message,
    });
  }
};

// Confirm Stripe payment
export const confirmStripePayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID et Order ID requis',
      });
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Le paiement n\'a pas été confirmé',
      });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: paymentIntent.amount / 100,
        method: 'STRIPE',
        status: 'COMPLETED',
        transactionId: paymentIntent.id,
        stripePaymentId: paymentIntent.id,
        paidAt: new Date(),
      },
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        description: `Paiement Stripe reçu pour commande ${order.number}: ${payment.amount}€`,
        userId: order.userId,
      },
    });

    return res.json({
      success: true,
      message: 'Paiement confirmé',
      payment,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement',
      error: error.message,
    });
  }
};

// Stripe webhook handler
export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).send('Signature manquante');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return res.status(500).send('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Create payment record
          await prisma.payment.create({
            data: {
              orderId,
              amount: paymentIntent.amount / 100,
              method: 'STRIPE',
              status: 'COMPLETED',
              transactionId: paymentIntent.id,
              stripePaymentId: paymentIntent.id,
              paidAt: new Date(),
            },
          });

          // Update order
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'PAID' },
          });

          console.log(`Payment succeeded for order ${orderId}`);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${failedPayment.id}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// Create PayPal order
export const createPayPalOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID requis',
      });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    // In a real implementation, you would create a PayPal order here
    // using the PayPal SDK. For now, we'll return a mock response.

    const paypalOrderId = `PAYPAL-${Date.now()}`;

    return res.json({
      success: true,
      paypalOrderId,
      approvalUrl: `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`,
    });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement PayPal',
      error: error.message,
    });
  }
};

// Capture PayPal payment
export const capturePayPalPayment = async (req: Request, res: Response) => {
  try {
    const { paypalOrderId, orderId } = req.body;

    if (!paypalOrderId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'PayPal Order ID et Order ID requis',
      });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // In a real implementation, you would capture the PayPal payment here
    // For now, we'll create the payment record directly

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method: 'PAYPAL',
        status: 'COMPLETED',
        transactionId: paypalOrderId,
        paypalOrderId,
        paidAt: new Date(),
      },
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        description: `Paiement PayPal reçu pour commande ${order.number}: ${payment.amount}€`,
        userId: order.userId,
      },
    });

    return res.json({
      success: true,
      message: 'Paiement PayPal confirmé',
      payment,
    });
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la capture du paiement PayPal',
      error: error.message,
    });
  }
};

// Get payment methods
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const methods = [
      {
        id: 'stripe',
        name: 'Carte bancaire (Stripe)',
        description: 'Paiement sécurisé par carte bancaire',
        icon: '💳',
        enabled: !!process.env.STRIPE_SECRET_KEY,
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Paiement via PayPal',
        icon: '🅿️',
        enabled: true,
      },
      {
        id: 'bank_transfer',
        name: 'Virement bancaire',
        description: 'Paiement par virement',
        icon: '🏦',
        enabled: true,
      },
    ];

    return res.json({
      success: true,
      data: methods.filter(m => m.enabled),
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des moyens de paiement',
      error: error.message,
    });
  }
};
