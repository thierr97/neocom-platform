const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env' });

const API_URL = 'https://neocom-backend.onrender.com/api';
const EMAIL = 'admin@neoserv.com';
const PASSWORD = 'admin123';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PRODUCTS = [
  {
    sku: 'K45916',
    imageUrl: 'https://www.chomette.com/media/catalog/product/E/C/ECF_32943_F20_web_image_f766.jpeg',
  },
  {
    sku: 'PRE0542',
    imageUrl: 'https://laboutiquemalik.com/cdn/shop/products/macadamia.png-laboutiquemalik_1024x1024.png?v=1665132247',
  },
  {
    sku: 'D5402071',
    imageUrl: 'https://m.media-amazon.com/images/I/41B+tft2FbL._SS75_.jpg',
  },
];

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

async function getProductBySku(sku, token) {
  const r = await fetch(`${API_URL}/products?limit=20000`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  const d = await r.json();
  return (d.products || []).find(p => p.sku === sku) || null;
}

async function main() {
  const token = await getToken();
  console.log('Logged in');

  for (const { sku, imageUrl } of PRODUCTS) {
    console.log(`\nProcessing ${sku}...`);

    // Upload to Cloudinary
    let cloudUrl;
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'neoserv/products/hjk',
        public_id: `hjk_${sku.replace(/[^a-zA-Z0-9]/g, '_')}`,
        overwrite: true,
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      });
      cloudUrl = result.secure_url;
      console.log('Uploaded to Cloudinary:', cloudUrl);
    } catch (err) {
      console.log('Cloudinary upload failed:', err.message);
      continue;
    }

    // Get product
    const product = await getProductBySku(sku, token);
    if (!product) { console.log('Product not found in API'); continue; }

    // Update product
    const r = await fetch(`${API_URL}/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ images: [cloudUrl], thumbnail: cloudUrl }),
    });
    const result = await r.json();
    if (result.success) console.log('Updated product', sku);
    else console.log('Update failed:', result.message);
  }

  console.log('\nDone!');
}

main().catch(console.error);
