/**
 * import-bazar-images.js
 *
 * Extrait les images embarquées dans ARTICLES BAZAR.xlsx,
 * les upload sur Cloudinary et met à jour les produits via l'API.
 *
 * Usage: node scripts/import-bazar-images.js
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { DOMParser } = require('@xmldom/xmldom');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const XLSX_PATH = '/Users/thierrycyrillefrancillette/Downloads/fichier en csv/ARTICLES BAZAR.xlsx';
const API_URL = 'https://neocom-backend.onrender.com/api';
const EMAIL = 'admin@neoserv.com';
const PASSWORD = 'admin123';
const PROGRESS_FILE = '/tmp/bazar-images-progress.json';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Auth ─────────────────────────────────────────────────────────────────────
let authToken = null;
let tokenExpiry = 0;
async function getToken(force = false) {
  if (!force && authToken && Date.now() < tokenExpiry) return authToken;
  let retries = 5;
  while (retries > 0) {
    try {
      const r = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      });
      if (r.status === 429) { console.log('\n⏳ Rate limit login, wait 90s...'); await sleep(90000); retries--; continue; }
      const text = await r.text();
      const d = JSON.parse(text);
      if (!d.success) throw new Error('Login failed');
      authToken = d.tokens.accessToken;
      tokenExpiry = Date.now() + 50 * 60 * 1000; // refresh every 50min
      return authToken;
    } catch (e) { retries--; await sleep(5000); }
  }
  throw new Error('Cannot login');
}

// ─── Fetch ALL products from API (paginated) ──────────────────────────────────
async function fetchAllProducts() {
  console.log('📡 Fetching all products from API...');
  const token = await getToken();
  const bySkuOrBarcode = {}; // key: sku or barcode → product
  let page = 1;
  let total = 0;

  while (true) {
    let retries = 3;
    let data = null;
    while (retries > 0) {
      try {
        const r = await fetch(`${API_URL}/shop/products?limit=200&page=${page}`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (r.status === 429) { await sleep(10000); retries--; continue; }
        const text = await r.text();
        data = JSON.parse(text);
        break;
      } catch (e) { retries--; await sleep(2000); }
    }
    if (!data?.success || !data.data?.length) break;

    for (const p of data.data) {
      if (p.sku) bySkuOrBarcode[p.sku.toLowerCase()] = p;
      if (p.barcode) bySkuOrBarcode[p.barcode.toLowerCase()] = p;
    }
    total += data.data.length;
    process.stdout.write(`\r  ${total} produits chargés (page ${page})...`);

    if (!data.pagination?.hasNext) break;
    page++;
    await sleep(300);
  }

  console.log(`\n✅ ${total} produits chargés, ${Object.keys(bySkuOrBarcode).length} clés d'index\n`);
  return bySkuOrBarcode;
}

// ─── Parse Excel: row → {ref, barcode, name} ─────────────────────────────────
function parseExcelRows() {
  const zip = new AdmZip(XLSX_PATH);

  // Shared strings
  const ssEntry = zip.getEntry('xl/sharedStrings.xml');
  const strings = [];
  if (ssEntry) {
    const ssDoc = new DOMParser().parseFromString(ssEntry.getData().toString('utf8'), 'text/xml');
    const tElems = ssDoc.getElementsByTagName('t');
    for (let i = 0; i < tElems.length; i++) strings.push(tElems[i].textContent || '');
  }

  // Sheet data
  const sheetEntry = zip.getEntry('xl/worksheets/sheet1.xml');
  const sheetDoc = new DOMParser().parseFromString(sheetEntry.getData().toString('utf8'), 'text/xml');
  const rows = sheetDoc.getElementsByTagName('row');
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = parseInt(rows[i].getAttribute('r') || '0');
    const cells = rows[i].getElementsByTagName('c');
    const rowData = { rowNum, ref: '', barcode: '', name: '' };

    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const ref = cell.getAttribute('r') || '';
      const col = ref.replace(/[0-9]/g, '');
      const t = cell.getAttribute('t');
      const vElem = cell.getElementsByTagName('v');
      if (vElem.length > 0) {
        const raw = vElem[0].textContent || '';
        const val = t === 's' ? (strings[parseInt(raw)] || '') : raw;
        if (col === 'B') rowData.ref = String(val).trim();
        if (col === 'C') rowData.barcode = String(val).trim();
        if (col === 'D') rowData.name = String(val).trim();
      }
    }
    if (rowNum > 1) result.push(rowData);
  }

  return result;
}

// ─── Parse drawing: drawingRow → image path ──────────────────────────────────
function buildRowToImageMap() {
  const zip = new AdmZip(XLSX_PATH);

  const relsEntry = zip.getEntry('xl/drawings/_rels/drawing1.xml.rels');
  const relsDoc = new DOMParser().parseFromString(relsEntry.getData().toString('utf8'), 'text/xml');
  const ridToImg = {};
  const rels = relsDoc.getElementsByTagName('Relationship');
  for (let i = 0; i < rels.length; i++) {
    ridToImg[rels[i].getAttribute('Id')] = rels[i].getAttribute('Target').replace('../', 'xl/');
  }

  const drawingEntry = zip.getEntry('xl/drawings/drawing1.xml');
  const drawingDoc = new DOMParser().parseFromString(drawingEntry.getData().toString('utf8'), 'text/xml');
  const rowToImg = {};

  const NS = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
  const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

  function processAnchors(tagName) {
    const anchors = drawingDoc.getElementsByTagNameNS(NS, tagName);
    for (let i = 0; i < anchors.length; i++) {
      const rowElems = anchors[i].getElementsByTagNameNS(NS, 'row');
      const blips = anchors[i].getElementsByTagNameNS(NS_A, 'blip');
      if (rowElems.length > 0 && blips.length > 0) {
        const row = parseInt(rowElems[0].textContent || '0');
        const rid = blips[0].getAttributeNS(NS_R, 'embed') || blips[0].getAttribute('r:embed');
        if (rid && ridToImg[rid]) rowToImg[row] = ridToImg[rid];
      }
    }
  }
  processAnchors('twoCellAnchor');
  processAnchors('oneCellAnchor');

  return { rowToImg, zip };
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────
async function uploadBuffer(buffer, sku) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'neoserv/products/bazar',
        public_id: `bazar_${sku.replace(/[^a-zA-Z0-9]/g, '_')}`,
        overwrite: true,
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (err, res) => err ? reject(err) : resolve(res.secure_url)
    );
    stream.end(buffer);
  });
}

// ─── Update product ───────────────────────────────────────────────────────────
async function updateProduct(id, cloudUrl) {
  const token = await getToken();
  let retries = 3;
  while (retries > 0) {
    try {
      const r = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ images: [cloudUrl], thumbnail: cloudUrl }),
      });
      if (r.status === 429) { await sleep(10000); retries--; continue; }
      if (r.status === 401) { await getToken(true); retries--; continue; }
      const text = await r.text();
      return JSON.parse(text);
    } catch (e) { retries--; await sleep(2000); }
  }
  return { success: false };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂 Parsing Excel...');
  const excelRows = parseExcelRows();
  const { rowToImg, zip } = buildRowToImageMap();
  console.log(`✅ ${excelRows.length} lignes, ${Object.keys(rowToImg).length} images\n`);

  const productMap = await fetchAllProducts();

  // Load progress
  let progress = {};
  try { progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch(e) {}
  console.log(`📋 Progression précédente: ${Object.keys(progress).length} entrées\n`);

  let stats = { uploaded: 0, skipped: 0, notFound: 0, alreadyHas: 0, noImage: 0, error: 0 };

  for (const row of excelRows) {
    const { rowNum, ref, barcode, name } = row;
    const key = ref || barcode;
    if (!key) continue;

    // Skip already processed
    if (progress[key] && progress[key] !== 'not_found' && progress[key] !== 'error') {
      stats.skipped++;
      continue;
    }

    // Get image from zip
    const imgPath = rowToImg[rowNum - 1]; // drawing is 0-indexed, excel rows are 1-indexed
    if (!imgPath) { stats.noImage++; continue; }
    const imgEntry = zip.getEntry(imgPath);
    if (!imgEntry) { stats.noImage++; continue; }

    // Find product in local map
    const product = productMap[ref.toLowerCase()] || productMap[barcode.toLowerCase()];

    if (!product) {
      stats.notFound++;
      progress[key] = 'not_found';
      continue;
    }

    // Skip if already has image
    if (product.images && product.images.length > 0) {
      stats.alreadyHas++;
      progress[key] = 'has_image';
      continue;
    }

    const label = `[${rowNum}] ${name.substring(0, 42).padEnd(42)}`;
    process.stdout.write(`${label} `);

    // Upload to Cloudinary
    let cloudUrl;
    try {
      const buffer = imgEntry.getData();
      cloudUrl = await uploadBuffer(buffer, product.sku || ref);
    } catch (err) {
      process.stdout.write(`⚠️  cloudinary err\n`);
      stats.error++;
      progress[key] = 'error';
      await sleep(500);
      continue;
    }

    // Update product
    const result = await updateProduct(product.id, cloudUrl);
    if (result.success) {
      process.stdout.write(`✅\n`);
      stats.uploaded++;
      progress[key] = cloudUrl;
      // Update local cache too
      product.images = [cloudUrl];
    } else {
      process.stdout.write(`⚠️  update failed\n`);
      stats.error++;
      progress[key] = 'error';
    }

    if ((stats.uploaded + stats.notFound) % 10 === 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
      process.stdout.write(`  💾 Progress saved (${stats.uploaded} uploads)\n`);
    }

    await sleep(800);
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));

  console.log('\n\n========== RÉSUMÉ ==========');
  console.log(`✅ Images uploadées    : ${stats.uploaded}`);
  console.log(`⏭️  Déjà avec image    : ${stats.alreadyHas}`);
  console.log(`⏭️  Skip (déjà traité) : ${stats.skipped}`);
  console.log(`❓ Produit non trouvé  : ${stats.notFound}`);
  console.log(`🖼️  Pas d'image Excel  : ${stats.noImage}`);
  console.log(`❌ Erreurs             : ${stats.error}`);
  console.log('============================\n');
}

main().catch(console.error);
