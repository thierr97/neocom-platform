import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import prisma from './config/database';

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

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
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
    ];

    // Allow Vercel preview deployments
    if (origin && (origin.endsWith('.vercel.app') || origin.endsWith('neoserv.fr'))) {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
app.use('/api/rbac', rbacRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/shop', shopRoutes);
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
    // Test database connection
    await prisma.$connect();
    console.log('✅ Base de données connectée');

    app.listen(PORT, () => {
      console.log(`🚀 NEOSERV API démarrée sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
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
