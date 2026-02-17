-- AlterEnum: Add new statuses to SupplierStatus
ALTER TYPE "SupplierStatus" ADD VALUE 'PENDING';
ALTER TYPE "SupplierStatus" ADD VALUE 'REJECTED';

-- AlterEnum: Add new statuses to ProductStatus
ALTER TYPE "ProductStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ProductStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "ProductStatus" ADD VALUE 'REJECTED';

-- AlterTable: Add marketplace fields to Supplier
ALTER TABLE "suppliers" ADD COLUMN "legalForm" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "businessSector" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "password" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "suppliers" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "suppliers" ADD COLUMN "rejectedReason" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "commissionRate" DOUBLE PRECISION DEFAULT 10;
ALTER TABLE "suppliers" ADD COLUMN "paymentFrequency" TEXT DEFAULT 'MONTHLY';
ALTER TABLE "suppliers" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "bankName" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "iban" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "bic" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "accountHolder" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "estimatedMonthlyRevenue" DOUBLE PRECISION;

-- AlterTable: Add marketplace validation fields to Product
ALTER TABLE "products" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "products" ADD COLUMN "rejectionReason" TEXT;

-- CreateTable: SupplierSession
CREATE TABLE "supplier_sessions" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupplierNotification
CREATE TABLE "supplier_notifications" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "supplier_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupplierPayout
CREATE TABLE "supplier_payouts" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "transactionId" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "accountHolder" TEXT,
    "stripePayoutId" TEXT,
    "orderIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductVariant
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "compareAtPrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_sessions_token_key" ON "supplier_sessions"("token");
CREATE INDEX "supplier_sessions_supplierId_idx" ON "supplier_sessions"("supplierId");
CREATE INDEX "supplier_sessions_expiresAt_idx" ON "supplier_sessions"("expiresAt");

CREATE INDEX "supplier_notifications_supplierId_idx" ON "supplier_notifications"("supplierId");
CREATE INDEX "supplier_notifications_type_idx" ON "supplier_notifications"("type");
CREATE INDEX "supplier_notifications_isRead_idx" ON "supplier_notifications"("isRead");
CREATE INDEX "supplier_notifications_createdAt_idx" ON "supplier_notifications"("createdAt");

CREATE INDEX "supplier_payouts_supplierId_idx" ON "supplier_payouts"("supplierId");
CREATE INDEX "supplier_payouts_status_idx" ON "supplier_payouts"("status");
CREATE INDEX "supplier_payouts_periodStart_idx" ON "supplier_payouts"("periodStart");
CREATE INDEX "supplier_payouts_periodEnd_idx" ON "supplier_payouts"("periodEnd");

CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- AddForeignKey
ALTER TABLE "supplier_sessions" ADD CONSTRAINT "supplier_sessions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_notifications" ADD CONSTRAINT "supplier_notifications_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_payouts" ADD CONSTRAINT "supplier_payouts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
