-- Clean up failed migration if exists
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20251210131500_add_customer_coordinates';

-- AlterTable: Add latitude and longitude columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'latitude') THEN
        ALTER TABLE "customers" ADD COLUMN "latitude" DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'longitude') THEN
        ALTER TABLE "customers" ADD COLUMN "longitude" DOUBLE PRECISION;
    END IF;
END $$;
