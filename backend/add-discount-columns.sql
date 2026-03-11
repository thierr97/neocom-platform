-- Ajouter les colonnes de remise à la table Customer
-- Ces colonnes peuvent être absentes si la base a été restaurée avant la migration

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE',
ADD COLUMN IF NOT EXISTS "discountReason" TEXT,
ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Customer' AND column_name LIKE 'discount%'
ORDER BY column_name;
