async function testIntelligentSearch() {
  // Obtenir un token
  const tokenResponse = await fetch('https://neocom-backend.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@neoserv.com',
      password: 'Admin123!'
    })
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.tokens?.accessToken;

  if (!token) {
    console.log('❌ Pas de token');
    return;
  }

  console.log('✅ Token obtenu\n');

  // Tests de recherche avec différents termes
  const searchTests = [
    { query: 'bagage', desc: 'Cherche "bagage" (devrait trouver les valises via synonyme)' },
    { query: 'sac', desc: 'Cherche "sac" (devrait trouver valises et sacs)' },
    { query: 'pese', desc: 'Cherche "pese" (devrait trouver balance via synonyme)' },
    { query: 'serrure', desc: 'Cherche "serrure" (devrait trouver cadenas via synonyme)' },
    { query: 'black', desc: 'Cherche "black" (devrait trouver produits noirs via synonyme)' },
    { query: 'valise', desc: 'Cherche "valise" (recherche directe)' }
  ];

  for (const test of searchTests) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 ${test.desc}`);
    console.log(`   Query: "${test.query}"\n`);

    const response = await fetch(`https://neocom-backend.onrender.com/api/products?search=${encodeURIComponent(test.query)}&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success && data.products) {
      console.log(`   ✓ ${data.products.length} produits trouvés:`);
      data.products.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name.substring(0, 60)}${p.name.length > 60 ? '...' : ''}`);
      });
    } else {
      console.log(`   ❌ Aucun produit trouvé`);
    }
    console.log('');
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('✅ Tests de recherche intelligente terminés!');
}

testIntelligentSearch().catch(console.error);
