async function runMigration() {
  const response = await fetch('https://neocom-backend.onrender.com/api/migration/add-availability-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: 'neoserv-migration-2024' })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

runMigration();
