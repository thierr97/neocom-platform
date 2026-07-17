-- Migration: Module Sourcing & Dropshipping IA
-- Date: 2026-07-16
-- Ajout : sources dropshipping, file d'import IA, règles de prix,
--         commandes fournisseurs, chatbot, assainissement catalogue.
-- SQL idempotent (IF NOT EXISTS / DO blocks) pour déploiement sans risque.

-- ===== ENUMS =====
DO $$ BEGIN
  CREATE TYPE "DropshipPlatform" AS ENUM ('ALIEXPRESS', 'CJDROPSHIPPING', 'TEMU', 'SHEIN', 'AUTRE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ImportJobStatus" AS ENUM ('QUEUED', 'ANALYZING', 'DRAFT', 'APPROVED', 'REJECTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupplierOrderStatus" AS ENUM ('PENDING', 'PLACED', 'MANUAL_REQUIRED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== dropship_sources =====
CREATE TABLE IF NOT EXISTS "dropship_sources" (
  "id" TEXT NOT NULL,
  "platform" "DropshipPlatform" NOT NULL,
  "externalId" TEXT,
  "sourceUrl" TEXT,
  "variantKey" TEXT,
  "costPrice" DOUBLE PRECISION,
  "shippingCost" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "stockQty" INTEGER,
  "deliveryDaysMin" INTEGER,
  "deliveryDaysMax" INTEGER,
  "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP(3),
  "syncError" TEXT,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dropship_sources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dropship_sources_productId_key" ON "dropship_sources"("productId");
CREATE INDEX IF NOT EXISTS "dropship_sources_platform_idx" ON "dropship_sources"("platform");
CREATE INDEX IF NOT EXISTS "dropship_sources_syncEnabled_idx" ON "dropship_sources"("syncEnabled");
DO $$ BEGIN
  ALTER TABLE "dropship_sources" ADD CONSTRAINT "dropship_sources_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== import_jobs =====
CREATE TABLE IF NOT EXISTS "import_jobs" (
  "id" TEXT NOT NULL,
  "platform" "DropshipPlatform" NOT NULL,
  "sourceUrl" TEXT,
  "externalId" TEXT,
  "rawText" TEXT,
  "status" "ImportJobStatus" NOT NULL DEFAULT 'QUEUED',
  "proposal" JSONB,
  "confidence" INTEGER,
  "error" TEXT,
  "productId" TEXT,
  "createdById" TEXT,
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "import_jobs_status_idx" ON "import_jobs"("status");
CREATE INDEX IF NOT EXISTS "import_jobs_platform_idx" ON "import_jobs"("platform");
CREATE INDEX IF NOT EXISTS "import_jobs_createdAt_idx" ON "import_jobs"("createdAt");

-- ===== dropship_pricing_rules =====
CREATE TABLE IF NOT EXISTS "dropship_pricing_rules" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" "DropshipPlatform",
  "categoryId" TEXT,
  "marginPct" DOUBLE PRECISION NOT NULL DEFAULT 120,
  "fixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shippingEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "roundEnding" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
  "minPrice" DOUBLE PRECISION,
  "minMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 30,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dropship_pricing_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "dropship_pricing_rules_isActive_priority_idx" ON "dropship_pricing_rules"("isActive", "priority");

-- ===== supplier_orders =====
CREATE TABLE IF NOT EXISTS "supplier_orders" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "platform" "DropshipPlatform" NOT NULL,
  "status" "SupplierOrderStatus" NOT NULL DEFAULT 'PENDING',
  "externalOrderId" TEXT,
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,
  "carrier" TEXT,
  "costTotal" DOUBLE PRECISION,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "notes" TEXT,
  "placedAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supplier_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_orders_orderItemId_key" ON "supplier_orders"("orderItemId");
CREATE INDEX IF NOT EXISTS "supplier_orders_orderId_idx" ON "supplier_orders"("orderId");
CREATE INDEX IF NOT EXISTS "supplier_orders_status_idx" ON "supplier_orders"("status");

-- ===== chat_conversations / chat_messages =====
CREATE TABLE IF NOT EXISTS "chat_conversations" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "customerEmail" TEXT,
  "resolved" BOOLEAN,
  "rating" INTEGER,
  "escalated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_sessionId_key" ON "chat_conversations"("sessionId");
CREATE INDEX IF NOT EXISTS "chat_conversations_createdAt_idx" ON "chat_conversations"("createdAt");

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");
DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== catalog_cleanup_runs =====
CREATE TABLE IF NOT EXISTS "catalog_cleanup_runs" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "dryRun" BOOLEAN NOT NULL DEFAULT true,
  "totalProducts" INTEGER NOT NULL DEFAULT 0,
  "processed" INTEGER NOT NULL DEFAULT 0,
  "updated" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "lastProductId" TEXT,
  "error" TEXT,
  "startedById" TEXT,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_cleanup_runs_pkey" PRIMARY KEY ("id")
);
