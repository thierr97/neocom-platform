"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = __importDefault(require("./config/database"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const quote_routes_1 = __importDefault(require("./routes/quote.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const purchase_invoice_routes_1 = __importDefault(require("./routes/purchase-invoice.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const vat_routes_1 = __importDefault(require("./routes/vat.routes"));
const accounting_routes_1 = __importDefault(require("./routes/accounting.routes"));
const pricing_routes_1 = __importDefault(require("./routes/pricing.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const gps_routes_1 = __importDefault(require("./routes/gps.routes"));
const rbac_routes_1 = __importDefault(require("./routes/rbac.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const shop_routes_1 = __importDefault(require("./routes/shop.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
// import paymentRoutes from './routes/payment.routes';  // Temporairement désactivé
// import aiRoutes from './routes/ai.routes';  // Temporairement désactivé
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const migration_routes_1 = __importDefault(require("./routes/migration.routes"));
const cloudinary_routes_1 = __importDefault(require("./routes/cloudinary.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const ai_manager_routes_1 = __importDefault(require("./routes/ai-manager.routes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Trust proxy - Required for Render deployment
app.set('trust proxy', true);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});
app.use('/api/', limiter);
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
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
        }
        else if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static files
app.use('/public', express_1.default.static('public'));
app.use('/uploads', express_1.default.static('uploads'));
// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'NEOSERV API est en ligne',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/customers', customer_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/suppliers', supplier_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/quotes', quote_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/purchase-invoices', purchase_invoice_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/stats', stats_routes_1.default);
app.use('/api/vat', vat_routes_1.default);
app.use('/api/accounting', accounting_routes_1.default);
app.use('/api/pricing', pricing_routes_1.default);
app.use('/api/import', import_routes_1.default);
app.use('/api/export', export_routes_1.default);
app.use('/api/gps', gps_routes_1.default);
app.use('/api/rbac', rbac_routes_1.default);
app.use('/api/activities', activity_routes_1.default);
app.use('/api/shop', shop_routes_1.default);
app.use('/api/client', client_routes_1.default);
// app.use('/api/payments', paymentRoutes);  // Temporairement désactivé
// app.use('/api/ai', aiRoutes);  // Temporairement désactivé
app.use('/api/reviews', review_routes_1.default);
app.use('/api/migration', migration_routes_1.default);
app.use('/api/cloudinary', cloudinary_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/ai-manager', ai_manager_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
    });
});
// Error handler
app.use((err, req, res, next) => {
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
        await database_1.default.$connect();
        console.log('✅ Base de données connectée');
        app.listen(PORT, () => {
            console.log(`🚀 NEOSERV API démarrée sur le port ${PORT}`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Erreur de démarrage du serveur:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Arrêt du serveur...');
    await database_1.default.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n👋 Arrêt du serveur...');
    await database_1.default.$disconnect();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map