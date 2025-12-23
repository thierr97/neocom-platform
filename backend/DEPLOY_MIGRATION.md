# Migration de Production - Système de Remises

## Contexte

La migration `20251223160956_add_discount_fields_to_customer` ajoute les champs de remises commerciales à la table Customer.

## Option 1: Forcer un nouveau déploiement Render (Recommandé)

Le script `prebuild` dans package.json exécute automatiquement `prisma migrate deploy` avant chaque build.

1. **Via Dashboard Render:**
   - Aller sur le dashboard Render
   - Sélectionner le service backend
   - Cliquer sur "Manual Deploy" > "Deploy latest commit"
   - Render va exécuter `npm run prebuild` qui appliquera les migrations

2. **Via Git (commit vide):**
   ```bash
   git commit --allow-empty -m "chore: trigger deployment for migration"
   git push
   ```

## Option 2: Exécuter manuellement la migration SQL

Si vous avez accès à la base de données PostgreSQL de production:

### Via Dashboard Render

1. Aller dans Render Dashboard
2. Sélectionner votre base de données PostgreSQL
3. Cliquer sur "Connect" > "External Connection"
4. Copier l'URL de connexion interne
5. Utiliser un client PostgreSQL (psql, pgAdmin, DBeaver) pour vous connecter
6. Exécuter le SQL suivant:

```sql
-- Migration: add_discount_fields_to_customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Customer'
AND column_name LIKE 'discount%';
```

### Via Shell Render (si activé)

1. Ouvrir le Shell du service backend sur Render
2. Exécuter:
```bash
npx prisma migrate deploy
```

## Option 3: Via CLI Prisma avec DATABASE_URL de production

⚠️ **ATTENTION: Utiliser uniquement si vous avez l'URL de connexion de production**

```bash
# Définir l'URL de production temporairement
export DATABASE_URL="postgresql://user:password@host:port/database"

# Exécuter les migrations
npx prisma migrate deploy

# Vérifier le statut
npx prisma migrate status
```

## Vérification après migration

Une fois la migration appliquée, testez l'API:

```bash
# Exécuter le script de test
cd backend
./test-discount-api.sh
```

Vous devriez voir:
```
✅ Client créé avec succès! ID: xxx
✅ Remise appliquée correctement
```

## Troubleshooting

### Erreur: "column discountRate does not exist"
- La migration n'a pas été exécutée sur la base de production
- Suivre l'Option 1 ou 2 ci-dessus

### Erreur lors de l'exécution de la migration
```
Error: P3006 Migration failed to apply cleanly
```
- La migration peut déjà avoir été partiellement appliquée
- Vérifier l'état avec: `npx prisma migrate status`
- Si nécessaire, marquer la migration comme appliquée: `npx prisma migrate resolve --applied 20251223160956_add_discount_fields_to_customer`

### Vérifier l'état de la base de données

```sql
-- Lister toutes les colonnes de Customer
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'Customer'
ORDER BY ordinal_position;

-- Vérifier les migrations appliquées
SELECT * FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 5;
```

## Rollback (si nécessaire)

⚠️ **DANGER: Perte de données possible**

Si vous devez annuler la migration:

```sql
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "discountRate";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "discountType";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "discountReason";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "discountValidFrom";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "discountValidTo";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "discountAppliedBy";
```

## Support

Pour toute question, vérifier:
- Logs de déploiement Render
- Logs de l'application backend
- Documentation Prisma: https://www.prisma.io/docs/guides/migrate/production-troubleshooting
