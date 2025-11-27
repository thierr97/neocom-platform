async function runSearchMigration() {
  console.log('🔄 Étape 1: Ajout du champ searchTerms...\n');

  // Étape 1: Ajouter le champ searchTerms
  const migrationResponse = await fetch('https://neocom-backend.onrender.com/api/migration/add-search-terms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: 'neoserv-migration-2024' })
  });

  const migrationData = await migrationResponse.json();
  console.log('Résultat migration:');
  console.log(JSON.stringify(migrationData, null, 2));
  console.log('\n');

  if (!migrationData.success) {
    console.error('❌ La migration a échoué. Arrêt.');
    return;
  }

  console.log('✅ Migration réussie! Le champ searchTerms a été ajouté.');
  console.log('\n📝 Prochaine étape: Exécutez le script de génération des termes:');
  console.log('   DATABASE_URL="votre_db_url" npx ts-node generate-search-terms.ts');
  console.log('\n💡 Ou utilisez le script generate-search-terms-prod.js pour le faire via l\'API');
}

runSearchMigration().catch(console.error);
