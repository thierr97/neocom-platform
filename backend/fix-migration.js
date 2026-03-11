/**
 * Script pour résoudre la migration échouée sur Render
 *
 * Ce script se connecte directement à PostgreSQL et supprime l'entrée
 * de la migration échouée pour permettre à Prisma de continuer.
 */

const { Client } = require('pg');

async function fixFailedMigration() {
  // URL de connexion - à remplacer par la DATABASE_URL de Render
  const DATABASE_URL = process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ Erreur : DATABASE_URL non trouvée');
    console.error('Usage: DATABASE_URL_PRODUCTION="postgres://..." node fix-migration.js');
    process.exit(1);
  }

  console.log('🔧 Connexion à la base de données de production...');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Render utilise SSL
    }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // 1. Vérifier l'état actuel des migrations
    console.log('\n📋 État des migrations avant nettoyage :');
    const beforeResult = await client.query(
      `SELECT migration_name, finished_at, logs
       FROM "_prisma_migrations"
       WHERE migration_name LIKE '%delivery_courier%'
       ORDER BY started_at DESC`
    );

    if (beforeResult.rows.length === 0) {
      console.log('✅ Aucune migration delivery_courier trouvée (déjà nettoyée ?)');
    } else {
      console.table(beforeResult.rows.map(row => ({
        migration: row.migration_name,
        status: row.finished_at ? '✅ Success' : '❌ Failed',
        error: row.logs ? row.logs.substring(0, 100) + '...' : 'N/A'
      })));
    }

    // 2. Supprimer la migration échouée
    console.log('\n🧹 Suppression de la migration échouée...');
    const deleteResult = await client.query(
      `DELETE FROM "_prisma_migrations"
       WHERE migration_name = '20251217010000_add_delivery_courier_system'
       RETURNING migration_name`
    );

    if (deleteResult.rowCount > 0) {
      console.log(`✅ Migration échouée supprimée : ${deleteResult.rows[0].migration_name}`);
    } else {
      console.log('ℹ️  Aucune migration à supprimer (déjà nettoyée)');
    }

    // 3. Vérifier que les tables n'existent pas déjà
    console.log('\n🔍 Vérification des tables delivery/courier...');
    const tablesResult = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_name IN ('deliveries', 'delivery_events', 'courier_profiles', 'courier_documents')`
    );

    if (tablesResult.rows.length > 0) {
      console.log('⚠️  Certaines tables existent déjà :');
      console.table(tablesResult.rows);
      console.log('ℹ️  La migration échouera si ces tables existent. Considérez les supprimer d\'abord.');
    } else {
      console.log('✅ Les tables n\'existent pas encore - la migration les créera');
    }

    // 4. État final
    console.log('\n📋 État des migrations après nettoyage :');
    const afterResult = await client.query(
      `SELECT migration_name, finished_at
       FROM "_prisma_migrations"
       WHERE migration_name LIKE '%delivery_courier%'
       ORDER BY started_at DESC`
    );

    if (afterResult.rows.length === 0) {
      console.log('✅ Aucune migration delivery_courier (nettoyage réussi)');
    } else {
      console.table(afterResult.rows);
    }

    console.log('\n🎉 Nettoyage terminé avec succès !');
    console.log('\n📌 Prochaine étape :');
    console.log('   1. Allez sur le dashboard Render');
    console.log('   2. Cliquez sur "Manual Deploy" > "Deploy latest commit"');
    console.log('   3. La migration 20251218000000_add_delivery_courier_system s\'appliquera correctement');

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage :', error.message);
    console.error('\nDétails :', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnexion de PostgreSQL');
  }
}

// Exécution
fixFailedMigration().catch(error => {
  console.error('Erreur fatale :', error);
  process.exit(1);
});
