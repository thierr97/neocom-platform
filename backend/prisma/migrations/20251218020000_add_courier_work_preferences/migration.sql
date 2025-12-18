-- Add work preferences and performance metrics to courier_profiles

-- Préférences de travail
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "maxDeliveriesPerDay" INTEGER DEFAULT 10;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "maxRadius" DOUBLE PRECISION DEFAULT 20.0;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "workingDays" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "workingHoursStart" TEXT;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "workingHoursEnd" TEXT;

-- Statistiques supplémentaires
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "failedDeliveries" INTEGER DEFAULT 0;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "totalEarnings" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "currentMonthEarnings" DOUBLE PRECISION DEFAULT 0.0;

-- Scores de performance
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "onTimeRate" DOUBLE PRECISION;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "acceptanceRate" DOUBLE PRECISION;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "completionRate" DOUBLE PRECISION;
ALTER TABLE "courier_profiles" ADD COLUMN IF NOT EXISTS "customerSatisfaction" DOUBLE PRECISION;
