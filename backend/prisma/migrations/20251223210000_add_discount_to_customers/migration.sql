-- AlterTable customers: Add discount fields for commercial sales representatives
-- This migration adds support for discount management by sales representatives

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;
