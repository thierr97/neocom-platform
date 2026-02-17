import { PrismaClient } from '@prisma/client';
import { createDeliveryAuditMiddleware } from '../middleware/delivery-audit.middleware';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Register middleware for automatic delivery audit trail (skip if disabled)
if (!process.env.DISABLE_MIDDLEWARE) {
  prisma.$use(createDeliveryAuditMiddleware(prisma));
  console.log('✅ [Prisma] Middleware d\'audit des livraisons activé');
} else {
  console.log('⚠️ [Prisma] Middleware désactivé pour ce script');
}

export default prisma;
