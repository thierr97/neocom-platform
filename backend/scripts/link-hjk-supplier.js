/**
 * link-hjk-supplier.js
 *
 * 1. Vérifie si HJK DISTRIBUTION existe comme fournisseur
 * 2. Le crée si absent
 * 3. Lie tous les produits HJK à ce fournisseur (supplierId)
 *
 * Les produits HJK sont identifiés par leur SKU commençant par K (ex: K40875, K42405)
 * ou les SKUs issus de l'import HJK.
 */

const API_URL = 'https://neocom-backend.onrender.com/api';
const EMAIL = 'admin@neoserv.com';
const PASSWORD = 'admin123';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function safeJson(r) {
  const text = await r.text();
  try { return JSON.parse(text); } catch(e) { throw new Error('Non-JSON response: ' + text.substring(0, 100)); }
}

async function getToken() {
  let retries = 5;
  while (retries > 0) {
    const r = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (r.status === 429) { console.log('⏳ Rate limit, wait 90s...'); await sleep(90000); retries--; continue; }
    const d = await safeJson(r);
    if (!d.success) throw new Error('Login failed: ' + JSON.stringify(d));
    return d.tokens.accessToken;
  }
  throw new Error('Cannot login');
}

async function findOrCreateHJKSupplier(token) {
  // Search existing suppliers
  const r = await fetch(`${API_URL}/suppliers?limit=100`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const d = await safeJson(r);
  const suppliers = d.suppliers || d.data || [];

  // Find HJK
  const hjk = suppliers.find(s =>
    s.companyName?.toLowerCase().includes('hjk') ||
    s.name?.toLowerCase().includes('hjk')
  );

  if (hjk) {
    console.log(`✅ Fournisseur HJK trouvé: ${hjk.companyName || hjk.name} (${hjk.id})`);
    return hjk.id;
  }

  // Create HJK DISTRIBUTION
  console.log('➕ Création du fournisseur HJK DISTRIBUTION...');
  const r2 = await fetch(`${API_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({
      companyName: 'HJK DISTRIBUTION',
      contactName: 'HJK Distribution',
      email: 'contact@hjk-distribution.com',
      phone: '',
      address: '',
      status: 'ACTIVE',
    }),
  });
  const d2 = await safeJson(r2);
  if (!d2.success) throw new Error('Cannot create supplier: ' + JSON.stringify(d2));
  const newSupplier = d2.supplier || d2.data;
  console.log(`✅ Fournisseur créé: ${newSupplier.companyName} (${newSupplier.id})`);
  return newSupplier.id;
}

async function fetchAllHJKProducts(token) {
  console.log('\n📦 Récupération des produits HJK...');
  const hjkProducts = [];
  let page = 1;

  while (true) {
    const r = await fetch(`${API_URL}/shop/products?limit=200&page=${page}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (r.status === 429) { await sleep(10000); continue; }
    const d = await safeJson(r);
    if (!d.success || !d.data?.length) break;

    // HJK products: SKU starts with K (uppercase) + digits, or k (lowercase)
    // Based on the HJK Excel import: K40875, K42405, K46258, k42865, etc.
    const hjk = d.data.filter(p => {
      const sku = (p.sku || '').toUpperCase();
      return (
        /^K\d/.test(sku) ||           // K followed by digits
        /^HJK/.test(sku) ||           // HJK prefix
        (p.supplierId === null && /^K[0-9A-Z]/.test(p.sku || '')) // K prefix no supplier
      );
    });
    hjkProducts.push(...hjk);

    process.stdout.write(`\r  Page ${page}, ${hjkProducts.length} produits HJK trouvés...`);
    if (!d.pagination?.hasNext) break;
    page++;
    await sleep(300);
  }

  console.log(`\n✅ ${hjkProducts.length} produits HJK identifiés\n`);
  return hjkProducts;
}

async function linkProductsToSupplier(products, supplierId, token) {
  console.log(`🔗 Liaison de ${products.length} produits au fournisseur HJK...\n`);
  let updated = 0, failed = 0;

  for (const product of products) {
    // Skip if already linked to this supplier
    if (product.supplierId === supplierId) {
      updated++;
      continue;
    }

    let retries = 3;
    let success = false;
    while (retries > 0) {
      const r = await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ supplierId }),
      });
      if (r.status === 429) { await sleep(10000); retries--; continue; }
      if (r.status === 401) { token = await getToken(); retries--; continue; }
      const d = await safeJson(r);
      if (d.success) { success = true; break; }
      retries--;
      await sleep(500);
    }

    if (success) {
      updated++;
      if (updated % 50 === 0) process.stdout.write(`  ✅ ${updated}/${products.length} liés...\n`);
    } else {
      failed++;
      console.log(`  ⚠️  Échec: ${product.sku}`);
    }

    await sleep(300);
  }

  return { updated, failed };
}

async function main() {
  console.log('🔑 Login...');
  const token = await getToken();
  console.log('✅ Connecté\n');

  const supplierId = await findOrCreateHJKSupplier(token);
  const hjkProducts = await fetchAllHJKProducts(token);

  if (hjkProducts.length === 0) {
    console.log('⚠️  Aucun produit HJK trouvé. Vérifiez les SKUs.');
    return;
  }

  const { updated, failed } = await linkProductsToSupplier(hjkProducts, supplierId, token);

  console.log('\n========== RÉSUMÉ ==========');
  console.log(`✅ Produits liés   : ${updated}`);
  console.log(`❌ Échecs          : ${failed}`);
  console.log(`🔗 Fournisseur ID  : ${supplierId}`);
  console.log('============================\n');
}

main().catch(console.error);
