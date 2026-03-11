# 🔧 Guide de Résolution Manuelle - Migration P3009

## ❌ Problème

L'erreur **P3009** sur Render indique qu'une migration a échoué:
```
The '20251223160956_add_discount_fields_to_customer' migration started at 2025-12-23 20:11:30 UTC failed
```

Le déploiement échoue avec **"Build failed"** à cause de cette migration marquée comme failed dans la table `_prisma_migrations`.

---

## ✅ Solution: Exécuter le Script SQL Manuellement

### Option A: Via l'Interface Render (Recommandé)

#### Étape 1: Accéder à la Base de Données

1. **Aller sur** https://dashboard.render.com
2. **Cliquer sur** le service PostgreSQL (nom: `neocom-db` ou similaire)
3. **Trouver** la section **"Connect"** dans la sidebar
4. **Copier** l'URL de connexion externe (External Database URL)

#### Étape 2: Se Connecter avec un Client PostgreSQL

**Option 1 - Utiliser psql (Terminal):**
```bash
# Coller l'URL de connexion copiée depuis Render
psql "postgresql://user:password@host:5432/database"
```

**Option 2 - Utiliser pgAdmin (Interface graphique):**
1. Ouvrir pgAdmin
2. Créer une nouvelle connexion
3. Coller les informations depuis l'URL Render:
   - Host: `xxx.render.com`
   - Port: `5432`
   - Database: `neocom_xxx`
   - Username: depuis l'URL
   - Password: depuis l'URL

**Option 3 - Utiliser DBeaver:**
1. Nouvelle connexion PostgreSQL
2. Coller l'URL complète depuis Render

#### Étape 3: Exécuter le Script SQL

Une fois connecté, exécuter le script `FIX_PRODUCTION_MIGRATION.sql`:

```sql
-- 1. Vérifier l'état des migrations
SELECT
  migration_name,
  started_at,
  finished_at,
  CASE
    WHEN finished_at IS NULL THEN '❌ FAILED'
    ELSE '✅ SUCCESS'
  END as status
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 10;
```

Tu devrais voir la migration `20251223160956_add_discount_fields_to_customer` avec `finished_at = NULL` (failed).

```sql
-- 2. Supprimer la migration échouée
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251223160956_add_discount_fields_to_customer';
```

Résultat attendu: `DELETE 1`

```sql
-- 3. Créer les colonnes manuellement (sûr avec IF NOT EXISTS)
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'PERCENTAGE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidFrom" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountValidTo" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discountAppliedBy" TEXT;
```

Chaque commande devrait retourner `ALTER TABLE`.

```sql
-- 4. Vérifier que tout est OK
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Customer' AND column_name LIKE 'discount%'
ORDER BY column_name;
```

Tu devrais voir **6 colonnes**:
- discountAppliedBy
- discountRate
- discountReason
- discountType
- discountValidFrom
- discountValidTo

#### Étape 4: Redéployer sur Render

1. Retourner sur https://dashboard.render.com
2. Sélectionner le service **neocom-backend**
3. Cliquer sur **"Manual Deploy"**
4. Sélectionner **"Clear build cache & deploy"**

Cette fois, le déploiement devrait réussir car:
- La migration échouée a été supprimée de `_prisma_migrations`
- Les colonnes existent déjà dans la base
- Prisma ne tentera pas de recréer les colonnes

---

### Option B: Via le Shell Render (Si activé)

Si le shell est activé sur Render:

1. **Dashboard Render** → Service `neocom-backend`
2. **Cliquer sur "Shell"** dans le menu
3. **Exécuter**:
   ```bash
   npx prisma migrate resolve --applied 20251223160956_add_discount_fields_to_customer
   npx prisma migrate deploy
   ```

---

## 🔍 Vérification Finale

Une fois le déploiement réussi, tester l'API:

```bash
# Obtenir un token
curl -X POST https://neocom-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"commercial@neoserv.com","password":"TON_MOT_DE_PASSE"}'

# Créer un client avec remise (remplacer TOKEN)
curl -X POST https://neocom-backend.onrender.com/api/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Remise",
    "email": "test@example.com",
    "phone": "0690000001",
    "discountRate": 10,
    "discountType": "PERCENTAGE",
    "discountReason": "Test"
  }'
```

**Résultat attendu**: Status 201, client créé avec `discountRate: 10`

---

## 📋 Résumé des Fichiers

- **`FIX_PRODUCTION_MIGRATION.sql`** - Script SQL complet à exécuter
- **`prisma/migrations/20251223210000_add_discount_to_customers/`** - Nouvelle migration (pour référence)
- **`REMISES_COMMERCIALES.md`** - Documentation complète du système

---

## ❓ Troubleshooting

### "Error: column discountRate does not exist"
→ Les colonnes n'ont pas été créées. Réexécuter l'étape 3 du script SQL.

### "Build failed" persiste
→ Vérifier que la migration échouée a bien été supprimée de `_prisma_migrations` (étape 2).

### Impossible de se connecter à la base
→ Vérifier que l'URL de connexion externe est bien copiée depuis Render Dashboard > Database > Connect.

---

## 📞 Support

En cas de problème, vérifier:
- Logs Render: https://dashboard.render.com → neocom-backend → Logs
- Documentation Prisma: https://www.prisma.io/docs/guides/migrate/production-troubleshooting
