# Fix Migration Échouée sur Render

## Problème

Erreur P3009: `migrate found failed migrations in the target database`

La migration `20251223160956_add_discount_fields_to_customer` a été marquée comme échouée dans `_prisma_migrations`.

## Solution 1: Via Shell Render (Recommandé)

### Étape 1: Ouvrir le Shell
1. Dashboard Render → Service `neocom-backend`
2. Cliquer sur "Shell" dans le menu à gauche
3. Une console s'ouvre

### Étape 2: Vérifier l'état des migrations
```bash
npx prisma migrate status
```

### Étape 3: Marquer la migration comme résolue
```bash
npx prisma migrate resolve --applied 20251223160956_add_discount_fields_to_customer
```

### Étape 4: Exécuter à nouveau les migrations
```bash
npx prisma migrate deploy
```

### Étape 5: Redéployer
Cliquer sur "Manual Deploy" dans Render Dashboard

## Solution 2: Via SQL Direct (Si Shell pas disponible)

### Se connecter à PostgreSQL

Depuis Render Dashboard → Database → Connect → PSQL Command

### Exécuter les commandes SQL

```sql
-- 1. Vérifier l'état actuel
SELECT * FROM "_prisma_migrations"
WHERE migration_name = '20251223160956_add_discount_fields_to_customer';

-- 2. Si la migration est marquée comme "failed", supprimer l'entrée
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251223160956_add_discount_fields_to_customer';

-- 3. Vérifier si les colonnes existent déjà
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Customer' AND column_name LIKE 'discount%';

-- 4. Si les colonnes n'existent pas, les créer manuellement
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;

-- 5. Marquer la migration comme appliquée manuellement
INSERT INTO "_prisma_migrations" (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
) VALUES (
  gen_random_uuid(),
  'manually_applied',
  NOW(),
  '20251223160956_add_discount_fields_to_customer',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Vérifier
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Customer' AND column_name LIKE 'discount%';
```

Devrait retourner 6 colonnes.

## Solution 3: Rollback et Recréer (Dernier recours)

### Via Shell Render

```bash
# Rollback de la migration échouée
npx prisma migrate resolve --rolled-back 20251223160956_add_discount_fields_to_customer

# Supprimer le dossier de migration localement (sur ta machine)
rm -rf prisma/migrations/20251223160956_add_discount_fields_to_customer

# Créer une nouvelle migration
npx prisma migrate dev --name add_discount_fields_v2 --create-only

# Commit et push
git add prisma/migrations
git commit -m "fix: Nouvelle migration pour remises commerciales"
git push
```

## Vérification Après Fix

Une fois la migration résolue, tester l'API:

```bash
# Test création client avec remise
curl -X POST https://neocom-backend.onrender.com/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Remise",
    "email": "test@example.com",
    "discountRate": 10,
    "discountType": "PERCENTAGE",
    "discountReason": "Test"
  }'
```

Devrait retourner status 201 avec le client créé incluant `discountRate: 10`.

## Logs à Surveiller

Dans Render Logs, après le fix, tu devrais voir:
```
✓ Prisma schema loaded from prisma/schema.prisma
✓ 16 migrations found in prisma/migrations
✓ All migrations have been successfully applied
```

## Support

Problème P3009: https://www.prisma.io/docs/guides/migrate/production-troubleshooting#migration-failed
