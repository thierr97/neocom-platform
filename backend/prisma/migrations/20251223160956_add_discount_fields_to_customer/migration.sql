-- AlterTable Customer: Add discount fields
ALTER TABLE "Customer" ADD COLUMN "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "Customer" ADD COLUMN "discountReason" TEXT;
ALTER TABLE "Customer" ADD COLUMN "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "discountValidTo" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "discountAppliedBy" TEXT;
