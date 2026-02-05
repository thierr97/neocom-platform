-- CreateEnum
CREATE TYPE "ProCustomerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('IMMEDIATE', 'NET15', 'NET30', 'NET45', 'NET60', 'NET90');

-- CreateEnum
CREATE TYPE "ProDocumentType" AS ENUM ('KBIS', 'RIB', 'ID_CARD', 'VAT_CERT');

-- CreateEnum
CREATE TYPE "ProDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "B2BPricingScope" AS ENUM ('GLOBAL', 'CATEGORY', 'PRODUCT', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "B2BPriceType" AS ENUM ('FIXED', 'DISCOUNT_PERCENT', 'TIERS');

-- CreateEnum
CREATE TYPE "B2BBasePrice" AS ENUM ('CURRENT_PRICE', 'MSRP', 'COST');

-- CreateTable
CREATE TABLE "pro_customer_profiles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "ProCustomerStatus" NOT NULL DEFAULT 'PENDING',
    "statusNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'IMMEDIATE',
    "creditLimit" DOUBLE PRECISION DEFAULT 0,
    "defaultDiscount" DOUBLE PRECISION DEFAULT 0,
    "accountingEmail" TEXT,
    "accountingPhone" TEXT,
    "accountingContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pro_customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pro_documents" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "ProDocumentType" NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" "ProDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "rejectedReason" TEXT,

    CONSTRAINT "pro_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_addresses" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'France',
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_pricing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "B2BPricingScope" NOT NULL,
    "targetId" TEXT,
    "customerId" TEXT,
    "priceType" "B2BPriceType" NOT NULL,
    "basePrice" "B2BBasePrice" NOT NULL DEFAULT 'CURRENT_PRICE',
    "value" DOUBLE PRECISION,
    "tiersJson" JSONB,
    "minimumQuantity" INTEGER DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_proofs" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "signedBy" TEXT,
    "signatureImage" TEXT,
    "signatureVector" JSONB,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "pdfUrl" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

-- AlterTable - Add B2B fields to Orders
ALTER TABLE "orders" ADD COLUMN "isB2B" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "paymentTerms" "PaymentTerms";
ALTER TABLE "orders" ADD COLUMN "proPricesSnapshot" JSONB;

-- AlterTable - Add invoice fields
ALTER TABLE "invoices" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "invoices" ADD COLUMN "amount" DOUBLE PRECISION;
ALTER TABLE "invoices" ADD COLUMN "paidAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "dueDate" TIMESTAMP(3);

-- AlterTable - Add payment fields
ALTER TABLE "payments" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "payments" ADD COLUMN "cardLastFourDigits" TEXT;
ALTER TABLE "payments" ADD COLUMN "checkNumber" TEXT;
ALTER TABLE "payments" ADD COLUMN "bankName" TEXT;
ALTER TABLE "payments" ADD COLUMN "reference" TEXT;
ALTER TABLE "payments" ADD COLUMN "paidBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pro_customer_profiles_customerId_key" ON "pro_customer_profiles"("customerId");

-- CreateIndex
CREATE INDEX "pro_documents_profileId_idx" ON "pro_documents"("profileId");

-- CreateIndex
CREATE INDEX "shipping_addresses_profileId_idx" ON "shipping_addresses"("profileId");

-- CreateIndex
CREATE INDEX "b2b_pricing_rules_scope_idx" ON "b2b_pricing_rules"("scope");

-- CreateIndex
CREATE INDEX "b2b_pricing_rules_targetId_idx" ON "b2b_pricing_rules"("targetId");

-- CreateIndex
CREATE INDEX "b2b_pricing_rules_customerId_idx" ON "b2b_pricing_rules"("customerId");

-- CreateIndex
CREATE INDEX "b2b_pricing_rules_isActive_idx" ON "b2b_pricing_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_proofs_deliveryId_key" ON "delivery_proofs"("deliveryId");

-- AddForeignKey
ALTER TABLE "pro_customer_profiles" ADD CONSTRAINT "pro_customer_profiles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_documents" ADD CONSTRAINT "pro_documents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "pro_customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "pro_customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
