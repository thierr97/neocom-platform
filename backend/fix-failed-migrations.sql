-- Script pour nettoyer les migrations échouées dans la base de données
-- À exécuter sur la base de données de production via psql ou pgAdmin

-- 1. Voir toutes les migrations et leur statut
SELECT migration_name, finished_at, started_at, applied_steps_count, logs
FROM _prisma_migrations
ORDER BY started_at DESC;

-- 2. Supprimer les migrations échouées (status failed)
DELETE FROM _prisma_migrations
WHERE migration_name = '20251217010000_add_delivery_courier_system';

-- 3. Vérifier qu'il ne reste que les migrations réussies
SELECT migration_name, finished_at
FROM _prisma_migrations
ORDER BY started_at DESC;
