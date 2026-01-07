import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import prisma from './config/database';
import { initializeWebSocket } from './services/tracking.service';

// Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import supplierRoutes from './routes/supplier.routes';
import orderRoutes from './routes/order.routes';
import quoteRoutes from './routes/quote.routes';
import invoiceRoutes from './routes/invoice.routes';
import purchaseInvoiceRoutes from './routes/purchase-invoice.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';
import statsRoutes from './routes/stats.routes';
import vatRoutes from './routes/vat.routes';
import accountingRoutes from './routes/accounting.routes';
import pricingRoutes from './routes/pricing.routes';
import importRoutes from './routes/import.routes';
import exportRoutes from './routes/export.routes';
import gpsRoutes from './routes/gps.routes';
import tripRoutes from './routes/trip.routes';
import trackingRoutes from './routes/tracking.routes';
import rbacRoutes from './routes/rbac.routes';
import activityRoutes from './routes/activity.routes';
import shopRoutes from './routes/shop.routes';
import clientRoutes from './routes/client.routes';
// import paymentRoutes from './routes/payment.routes';  // Temporairement désactivé
// import aiRoutes from './routes/ai.routes';  // Temporairement désactivé
import reviewRoutes from './routes/review.routes';
import migrationRoutes from './routes/migration.routes';
import cloudinaryRoutes from './routes/cloudinary.routes';
import settingsRoutes from './routes/settings.routes';
import aiManagerRoutes from './routes/ai-manager.routes';
import creditNotesRoutes from './routes/credit-notes';
import deliveryNoteRoutes from './routes/deliveryNote.routes';
import deliveryRoutes from './routes/delivery.routes';
import courierRoutes from './routes/courier.routes';
import shopBannerRoutes from './routes/shop-banner.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Trust proxy - Required for Render deployment
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased for testing/admin work)
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { trustProxy: false }, // Disable validation for trust proxy - Required for Render
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      process.env.MOBILE_APP_URL || 'exp://localhost:19000',
      'http://localhost:19006', // Expo web
      'http://localhost:8081', // React Native
      'https://neoserv.fr',
      'http://neoserv.fr',
    ];

    // Allow if no origin (server-to-server requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow Vercel preview deployments and neoserv.fr subdomains
    if (origin.endsWith('.vercel.app') || origin.endsWith('neoserv.fr') || origin.includes('neoserv.fr')) {
      callback(null, true);
      return;
    }

    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Reject all others
    console.log(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'NEOSERV API est en ligne',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/credit-notes', creditNotesRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/courier', courierRoutes);
app.use('/api/purchase-invoices', purchaseInvoiceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/vat', vatRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api', tripRoutes);
app.use('/api', trackingRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/shop/banners', shopBannerRoutes);
app.use('/api/client', clientRoutes);
// app.use('/api/payments', paymentRoutes);  // Temporairement désactivé
// app.use('/api/ai', aiRoutes);  // Temporairement désactivé
app.use('/api/reviews', reviewRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai-manager', aiManagerRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection with retry logic
    console.log('🔌 Connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Base de données connectée');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 NEOSERV API démarrée sur le port ${PORT}`);
      console.log(`📍 URL: http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize WebSocket server for real-time GPS tracking
    initializeWebSocket(server);
    console.log('🔌 WebSocket server initialized for real-time tracking');

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Erreur du serveur:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Le port ${PORT} est déjà utilisé`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
