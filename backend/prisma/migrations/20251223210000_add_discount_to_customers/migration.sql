-- AlterTable Customer: Add discount fields for commercial sales representatives
-- This migration adds support for discount management by sales representatives

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;
