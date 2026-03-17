/**
 * fetch-bazar-images.js
 *
 * Récupère les images des produits BAZAR sans image via Open Food Facts (barcode lookup)
 * Upload sur Cloudinary et met à jour la base via l'API admin.
 */

const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neocom-backend.onrender.com/api';
const EMAIL = 'admin@neoserv.com';
const PASSWORD = 'admin123';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getToken() {
  const r = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const d = await r.json();
  if (!d.success) throw new Error('Login failed: ' + JSON.stringify(d));
  return d.tokens.accessToken;
}

async function getProductsWithoutImages(token, page) {
  let retries = 3;
  while (retries > 0) {
    try {
      const r = await fetch(`${API_URL}/shop/products?limit=100&page=${page}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (r.status === 429) {
        console.log('  ⏳ Rate limited, attente 5s...');
        await sleep(5000);
        retries--;
        continue;
      }
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); } catch (e) { console.log('  ⚠️  Parse error:', text.substring(0, 100)); return { products: [], hasNext: false }; }
      if (!d.success) return { products: [], hasNext: false };
      const products = (d.data || []).filter(p => (!p.images || p.images.length === 0) && p.barcode);
      return { products, hasNext: d.pagination?.hasNext || false };
    } catch (err) {
      console.log('  ⚠️  Erreur fetch page:', err.message);
      retries--;
      await sleep(2000);
    }
  }
  return { products: [], hasNext: false };
}

async function lookupImageByBarcode(barcode) {
  try {
    // Try Open Food Facts first
    const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const d = await r.json();
    if (d.status === 1 && d.product) {
      const imgUrl = d.product.image_front_url || d.product.image_url;
      if (imgUrl) return imgUrl;
    }
  } catch (e) {
    // silent
  }

  try {
    // Try Open Beauty Facts
    const r = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`);
    const d = await r.json();
    if (d.status === 1 && d.product) {
      const imgUrl = d.product.image_front_url || d.product.image_url;
      if (imgUrl) return imgUrl;
    }
  } catch (e) {
    // silent
  }

  try {
    // Try Open Products Facts
    const r = await fetch(`https://world.openproductsfacts.org/api/v0/product/${barcode}.json`);
    const d = await r.json();
    if (d.status === 1 && d.product) {
      const imgUrl = d.product.image_front_url || d.product.image_url;
      if (imgUrl) return imgUrl;
    }
  } catch (e) {
    // silent
  }

  return null;
}

async function uploadToCloudinary(imageUrl, sku) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: 'neoserv/products/bazar',
    public_id: `bazar_${sku.replace(/[^a-zA-Z0-9]/g, '_')}`,
    overwrite: true,
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  });
  return result.secure_url;
}

async function updateProduct(productId, cloudUrl, token) {
  const r = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ images: [cloudUrl], thumbnail: cloudUrl }),
  });
  return r.json();
}

async function main() {
  console.log('🔑 Login...');
  const token = await getToken();
  console.log('✅ Logged in\n');

  let totalFound = 0;
  let totalUpdated = 0;
  let totalNotFound = 0;
  let page = 27;
  let hasNext = true;

  while (hasNext) {
    console.log(`\n📄 Page ${page}...`);
    const { products, hasNext: next } = await getProductsWithoutImages(token, page);
    hasNext = next;
    page++;

    if (products.length === 0) {
      console.log('  Aucun produit sans image sur cette page, skip.');
      continue;
    }

    console.log(`  ${products.length} produits sans image à traiter`);

    for (const product of products) {
      const { id, sku, barcode, name } = product;
      process.stdout.write(`  [${sku}] ${name.substring(0, 50)}... `);

      // Lookup image by barcode
      const imageUrl = await lookupImageByBarcode(barcode);

      if (!imageUrl) {
        process.stdout.write('❌ non trouvé\n');
        totalNotFound++;
        await sleep(200);
        continue;
      }

      // Upload to Cloudinary
      let cloudUrl;
      try {
        cloudUrl = await uploadToCloudinary(imageUrl, sku);
      } catch (err) {
        process.stdout.write(`⚠️  Cloudinary erreur: ${err.message}\n`);
        continue;
      }

      // Update product
      const result = await updateProduct(id, cloudUrl, token);
      if (result.success) {
        process.stdout.write(`✅ image trouvée\n`);
        totalFound++;
        totalUpdated++;
      } else {
        process.stdout.write(`⚠️  update failed: ${result.message}\n`);
      }

      await sleep(300); // Rate limiting
    }
  }

  console.log('\n\n========== RÉSUMÉ ==========');
  console.log(`✅ Images trouvées & uploadées : ${totalFound}`);
  console.log(`❌ Images non trouvées         : ${totalNotFound}`);
  console.log(`📦 Total mis à jour            : ${totalUpdated}`);
  console.log('============================\n');
}

main().catch(console.error);
