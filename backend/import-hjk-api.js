const XLSX = require('xlsx');

const API_URL = 'https://neocom-backend.onrender.com/api';
const EMAIL = 'admin@neoserv.com';
const PASSWORD = 'admin123';
const EXCEL_FILE = '/Users/thierrycyrillefrancillette/Downloads/HJK - NOUVEAU PRODUITS  2.xlsx';

// Default category: Quincaillerie (articles bazar/divers)
const DEFAULT_CATEGORY_ID = 'fc0bb719-94a3-464d-aaed-a293cbb487ee';

// Category mapping based on keywords
const CATEGORY_MAP = [
  { keywords: ['gant', 'vetement', 'veste', 'habit', 'chaussure', 'bonnet', 'chapeau', 'sac à main'], id: 'ef6a45ab-ba4d-4a99-8a0c-f5832ba88c86' }, // MODE
  { keywords: ['jouet', 'ballon', 'bille', 'enfant', 'bébé', 'pompe à ballon', 'crayons'], id: '0732d85a-09bb-44e9-9d06-7f5b0f815863' }, // ENFANT
  { keywords: ['pot', 'fleur', 'arrosoir', 'jardinage', 'graine', 'terreau', 'pelle'], id: '62a8beb0-6eaf-430e-a900-11688c494ef4' }, // JARDINAGE
  { keywords: ['assiette', 'bol', 'verre', 'carafe', 'couvert', 'fourchette', 'cuillere', 'cuillère', 'couteau', 'rape', 'râpe', 'casserole', 'poele'], id: '765cea77-8a9d-4823-8f07-f96d40f972cf' }, // Accessoires Cuisson
  { keywords: ['brosse', 'dent', 'savon', 'shampoo', 'hygiene', 'hygiène', 'coton', 'santé', 'sante', 'masque'], id: '72f534e1-ba96-4b39-86ba-f26dedde2967' }, // HYGIENE
  { keywords: ['stylo', 'cahier', 'agenda', 'bureau', 'classeur'], id: '4e25b740-8c9c-4d7a-8b76-9bfb8a4b9c64' }, // BUREAU
  { keywords: ['peluche', 'animal', 'chat', 'chien', 'poisson', 'oiseau'], id: '231eb0d8-0502-4d3b-b880-ad9b06143561' }, // ANIMALERIE
  { keywords: ['lampe', 'ampoule', 'cable', 'prise', 'electricite', 'électricité', 'plomberie', 'robinet'], id: '82f0e7a1-20bc-4848-ac44-89f193e35835' }, // Électricité
  { keywords: ['marteau', 'tournevis', 'clé', 'cle', 'outil', 'perceuse', 'scie'], id: '3a90cb69-65c8-41b4-858e-7950a1d81147' }, // Outils à Main
  { keywords: ['cadre', 'deco', 'décoration', 'decoration', 'bougie', 'vase'], id: '209e1e4d-255d-420e-863f-191d613691bc' }, // DÉCORATION
];

function getCategoryId(name) {
  const lower = name.toLowerCase();
  for (const { keywords, id } of CATEGORY_MAP) {
    if (keywords.some(k => lower.includes(k))) return id;
  }
  return DEFAULT_CATEGORY_ID;
}

function parsePrice(val) {
  if (!val) return 0;
  const str = String(val).replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function parseStock(val) {
  if (!val) return 0;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? 0 : n;
}

function generateSlug(name, sku) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
    + '-' + sku.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
}

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
  tokenExpiry = Date.now() + 14 * 60 * 1000; // refresh avant 15min
  return token;
}

async function createProduct(data) {
  const tok = await getToken();
  const r = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
    body: JSON.stringify(data),
  });
  return r.json();
}

async function main() {
  console.log('📖 Lecture du fichier Excel...');
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const headers = rows[0];
  const data = rows.slice(1).filter(r => r[0]);

  console.log(`✅ ${data.length} produits trouvés`);

  const COL = {
    sku: 0, barcode: 1, name: 3, color: 5, size: 6, stock: 7, price: 8
  };

  // Get existing SKUs to avoid duplicates
  console.log('🔍 Récupération des SKUs existants...');
  const tok = await getToken();
  const existingRes = await fetch(`${API_URL}/products?limit=10000`, {
    headers: { 'Authorization': 'Bearer ' + tok }
  });
  const existingData = await existingRes.json();
  const existingSkus = new Set(existingData.products.map(p => p.sku));
  const existingBarcodes = new Set(existingData.products.map(p => p.barcode).filter(Boolean));
  console.log(`📦 ${existingSkus.size} produits déjà en base\n`);

  let created = 0, skipped = 0, errors = 0;
  const errorList = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const sku = String(row[COL.sku] || '').trim();
    const barcode = String(row[COL.barcode] || '').trim() || null;
    const name = String(row[COL.name] || '').trim();
    const price = parsePrice(row[COL.price]);
    const stock = parseStock(row[COL.stock]);
    const color = String(row[COL.color] || '').trim();
    const size = String(row[COL.size] || '').trim();

    if (!sku || !name) { skipped++; continue; }
    if (existingSkus.has(sku) || (barcode && existingBarcodes.has(barcode))) {
      process.stdout.write('⏭');
      skipped++;
      continue;
    }

    const slug = generateSlug(name, sku);
    const tags = [color, size].filter(Boolean);
    const categoryId = getCategoryId(name);

    const productData = {
      sku,
      barcode: barcode || undefined,
      name,
      slug,
      price,
      stock,
      categoryId,
      status: 'ACTIVE',
      isVisible: true,
      images: [],
      ...(tags.length ? { tags } : {}),
    };

    try {
      const result = await createProduct(productData);
      if (result.success) {
        created++;
        existingSkus.add(sku);
        if (barcode) existingBarcodes.add(barcode);
        if (created % 50 === 0) console.log(`\n✅ ${created}/${data.length} créés...`);
        else process.stdout.write('.');
      } else {
        // Slug conflict? Try with timestamp
        if (result.message && result.message.includes('slug')) {
          productData.slug = slug + '-' + Date.now();
          const retry = await createProduct(productData);
          if (retry.success) {
            created++;
            process.stdout.write('+');
          } else {
            errors++;
            errorList.push({ sku, name, error: retry.message });
            process.stdout.write('✗');
          }
        } else {
          errors++;
          errorList.push({ sku, name, error: result.message });
          process.stdout.write('✗');
        }
      }
    } catch (err) {
      errors++;
      errorList.push({ sku, name, error: err.message });
      process.stdout.write('✗');
    }

    // Small delay to avoid overwhelming the API
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n\n=============================');
  console.log(`✅ Créés:   ${created}`);
  console.log(`⏭  Ignorés: ${skipped} (déjà existants)`);
  console.log(`❌ Erreurs: ${errors}`);
  if (errorList.length > 0) {
    console.log('\nDétail des erreurs:');
    errorList.slice(0, 20).forEach(e => console.log(` - ${e.sku}: ${e.name} → ${e.error}`));
  }
  console.log('=============================');
}

main().catch(console.error);
