/**
 * Upload HJK product images to Cloudinary + update products via API
 */
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

require('dotenv').config({ path: '.env' });

const API_URL = 'https://neocom-backend.onrender.com/api';
const EMAIL = 'admin@neoserv.com';
const PASSWORD = 'admin123';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SKU_IMAGES = JSON.parse(fs.readFileSync('/tmp/hjk-sku-images.json', 'utf-8'));

let token = null;
let tokenExpiry = 0;

async function getToken() {
  if (token && Date.now() < tokenExpiry - 60000) return token;
  const r = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const d = await r.json();
  if (!d.success) throw new Error('Login failed: ' + JSON.stringify(d));
  token = d.tokens.accessToken;
  tokenExpiry = Date.now() + 14 * 60 * 1000;
  return token;
}

async function uploadToCloudinary(filePath, sku) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'neoserv/products/hjk',
    public_id: `hjk_${sku.replace(/[^a-zA-Z0-9]/g, '_')}`,
    overwrite: true,
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  });
  return result.secure_url;
}

// Cache product list to avoid repeated API calls
let productCache = null;

async function getProductBySku(sku) {
  if (!productCache) {
    const tok = await getToken();
    const r = await fetch(`${API_URL}/products?limit=20000`, {
      headers: { 'Authorization': 'Bearer ' + tok },
    });
    const d = await r.json();
    productCache = {};
    (d.products || []).forEach(p => { productCache[p.sku] = p; });
    console.log(`Cached ${Object.keys(productCache).length} products`);
  }
  return productCache[sku] || null;
}

async function updateProductImage(productId, imageUrl) {
  const tok = await getToken();
  const r = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
    body: JSON.stringify({ images: [imageUrl], thumbnail: imageUrl }),
  });
  return r.json();
}

async function main() {
  console.log(`Starting upload of ${SKU_IMAGES.length} images...`);

  // Pre-load product cache
  await getProductBySku('__init__');

  let uploaded = 0, updated = 0, skipped = 0, errors = 0;

  for (let i = 0; i < SKU_IMAGES.length; i++) {
    const { sku, file } = SKU_IMAGES[i];

    if (!fs.existsSync(file)) { skipped++; continue; }

    const product = await getProductBySku(sku);
    if (!product) { skipped++; continue; }

    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file, sku);
      uploaded++;

      // Update product via API
      await updateProductImage(product.id, imageUrl);
      updated++;

      if (uploaded % 50 === 0) {
        console.log(`${uploaded}/${SKU_IMAGES.length} images uploadées...`);
      }

      // Delay to avoid Cloudinary + API rate limits
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      errors++;
      if (errors <= 10) console.log(`ERR ${sku}: ${err.message.substring(0, 100)}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('=============================');
  console.log(`Uploadées: ${uploaded} | Mises à jour: ${updated} | Ignorées: ${skipped} | Erreurs: ${errors}`);
  console.log('=============================');
}

main().catch(console.error);
