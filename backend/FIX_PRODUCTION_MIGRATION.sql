-- =====================================================
-- SCRIPT DE RÉSOLUTION MIGRATION ÉCHOUÉE P3009
-- À exécuter sur la base de données PostgreSQL Render
-- =====================================================

-- ÉTAPE 1: Vérifier l'état actuel des migrations
SELECT
  migration_name,
  started_at,
  finished_at,
  applied_steps_count,
  CASE
    WHEN finished_at IS NULL THEN '❌ FAILED'
    ELSE '✅ SUCCESS'
  END as status
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 10;

-- ÉTAPE 2: Supprimer la migration échouée
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251223160956_add_discount_fields_to_customer';

-- ÉTAPE 3: Vérifier si les colonnes existent déjà
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Customer' AND column_name LIKE 'discount%';

-- ÉTAPE 4: Créer les colonnes si elles n'existent pas
-- (Ces commandes sont sûres car elles utilisent IF NOT EXISTS)
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;

-- ÉTAPE 5: Vérifier que les colonnes ont bien été créées
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'Customer' AND column_name LIKE 'discount%'
ORDER BY column_name;

-- RÉSULTAT ATTENDU: 6 colonnes discount*
-- discountAppliedBy | text | NULL | YES
-- discountRate | double precision | 0 | YES
-- discountReason | text | NULL | YES
-- discountType | text | 'PERCENTAGE'::text | YES
-- discountValidFrom | timestamp(3) without time zone | NULL | YES
-- discountValidTo | timestamp(3) without time zone | NULL | YES

-- =====================================================
-- APRÈS AVOIR EXÉCUTÉ CE SCRIPT:
-- 1. Aller sur dashboard.render.com
-- 2. Sélectionner le service neocom-backend
-- 3. Cliquer sur "Manual Deploy" > "Clear build cache & deploy"
-- =====================================================
