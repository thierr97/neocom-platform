async function testProductImages() {
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

  const token = tokenData.tokens?.accessToken || tokenData.token || tokenData.data?.token;
  if (!token) {
    console.log('❌ Pas de token dans la réponse');
    console.log('Response:', JSON.stringify(tokenData, null, 2).substring(0, 200));
    return;
  }
  console.log('✓ Token obtenu');

  // Récupérer quelques produits
  const productsResponse = await fetch('https://neocom-backend.onrender.com/api/products?page=1&limit=3', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const productsData = await productsResponse.json();

  console.log('Response:', JSON.stringify(productsData, null, 2).substring(0, 500));

  if (productsData.products && productsData.products.length > 0) {
    console.log('\n📦 Produits avec images optimisées:\n');

    for (const product of productsData.products) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Prix: ${product.price}€`);
      console.log(`   Images: ${product.images?.length || 0}`);

      if (product.thumbnail) {
        console.log(`   ✓ Thumbnail: ${product.thumbnail.substring(0, 100)}...`);

        // Tester si l'image charge
        const imgTest = await fetch(product.thumbnail, { method: 'HEAD' });
        console.log(`   ${imgTest.ok ? '✓' : '✗'} Status: ${imgTest.status} ${imgTest.statusText}`);
      } else {
        console.log(`   ✗ Pas de thumbnail`);
      }

      console.log('');
    }
  } else {
    console.log('❌ Aucun produit trouvé');
  }
}

testProductImages().catch(console.error);
