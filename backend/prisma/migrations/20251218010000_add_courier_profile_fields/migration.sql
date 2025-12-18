-- Add missing columns to courier_profiles table

ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "statusNote" TEXT;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "currentLatitude" DOUBLE PRECISION;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "currentLongitude" DOUBLE PRECISION;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "lastLocationUpdate" TIMESTAMP(3);
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'France';
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "vehicleColor" TEXT;

-- Make vehicleType nullable as it can be set later
ALTER TABLE "courier_profiles" ALTER COLUMN "vehicleType" DROP NOT NULL;
