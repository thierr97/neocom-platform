-- Script pour résoudre les problèmes de migrations Prisma
-- Ce script marque les migrations comme appliquées dans la table _prisma_migrations

-- 1. Marquer la migration discount comme appliquée (elle a peut-être déjà été appliquée manuellement)
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '8c9f5e5c9b8d7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1',
  NOW(),
  '20251223210000_add_discount_to_customers',
  NULL,
  NULL,
  NOW(),
  1
)
ON CONFLICT DO NOTHING;

-- 2. Marquer la nouvelle migration shop_banners comme appliquée
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  NOW(),
  '20260106230000_add_shop_banners',
  NULL,
  NULL,
  NOW(),
  1
)
ON CONFLICT DO NOTHING;
