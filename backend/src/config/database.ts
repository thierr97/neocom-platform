import { PrismaClient } from '@prisma/client';
import { createDeliveryAuditMiddleware } from '../middleware/delivery-audit.middleware';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Register middleware for automatic delivery audit trail
prisma.$use(createDeliveryAuditMiddleware(prisma));

console.log('✅ [Prisma] Middleware d\'audit des livraisons activé');

export default prisma;
