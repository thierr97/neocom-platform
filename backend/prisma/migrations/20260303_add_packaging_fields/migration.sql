-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "packagingQuantity" INTEGER DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sellByUnit" BOOLEAN DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sellByPackage" BOOLEAN DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;

-- Update existing products with calculated unitPrice
UPDATE "Product"
SET "unitPrice" = CASE
  WHEN "packagingQuantity" > 1 THEN ROUND((price / "packagingQuantity")::numeric, 2)
  ELSE price
END
WHERE "unitPrice" IS NULL;
