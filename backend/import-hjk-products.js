const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

const EXCEL_FILE = '/Users/thierrycyrillefrancillette/Downloads/HJK - NOUVEAU PRODUITS  2.xlsx';

function parsePrice(val) {
  if (!val) return 0;
  const str = String(val).replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function parseStock(val) {
  if (!val) return 0;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? 0 : n;
}

function generateSlug(name, sku) {
  const base = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  return `${base}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

async function main() {
  console.log('📖 Lecture du fichier Excel...');
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const headers = rows[0];
  const data = rows.slice(1).filter(r => r[0]); // skip empty rows

  console.log(`✅ ${data.length} produits trouvés`);
  console.log('Colonnes:', headers.join(' | '));

  // Indexes des colonnes
  const COL = {
    sku:      headers.indexOf('货号'),
    barcode:  headers.indexOf('条码1'),
    name:     headers.indexOf('产品名称1'),
    color:    headers.indexOf('颜色'),
    size:     headers.indexOf('尺码'),
    stock:    headers.indexOf('数量'),
    price:    headers.indexOf('售价(€)'),
    supplier: headers.indexOf('供货商'),
  };

  // Trouver ou créer la catégorie HJK
  let category = await prisma.category.findFirst({
    where: { name: { contains: 'HJK', mode: 'insensitive' } },
  });

  if (!category) {
    // Chercher catégorie Divers ou Autres
    category = await prisma.category.findFirst({
      where: { name: { in: ['Divers', 'Autres', 'Bazar', 'General', 'Général'] } },
    });
  }

  if (!category) {
    // Prendre la première catégorie disponible
    category = await prisma.category.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  if (!category) {
    console.error('❌ Aucune catégorie trouvée dans la base. Créez au moins une catégorie avant d\'importer.');
    process.exit(1);
  }

  console.log(`📁 Catégorie utilisée: ${category.name} (${category.id})`);

  // Trouver ou créer le fournisseur HJK DISTRIBUTION
  let supplier = await prisma.supplier.findFirst({
    where: { name: { contains: 'HJK', mode: 'insensitive' } },
  });

  if (supplier) {
    console.log(`🏭 Fournisseur trouvé: ${supplier.name} (${supplier.id})`);
  } else {
    console.log('🏭 Fournisseur HJK DISTRIBUTION non trouvé, import sans fournisseur lié');
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const sku = String(row[COL.sku] || '').trim();
    const barcode = String(row[COL.barcode] || '').trim() || null;
    const name = String(row[COL.name] || '').trim();
    const price = parsePrice(row[COL.price]);
    const stock = parseStock(row[COL.stock]);
    const color = String(row[COL.color] || '').trim();
    const size = String(row[COL.size] || '').trim();

    if (!sku || !name) {
      console.log(`⚠️  Ligne ${i + 2}: SKU ou nom manquant, ignorée`);
      skipped++;
      continue;
    }

    // Vérifier si le produit existe déjà
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku },
          ...(barcode ? [{ barcode }] : []),
        ],
      },
    });

    if (existing) {
      process.stdout.write(`⏭️  `);
      skipped++;
      continue;
    }

    const slug = generateSlug(name, sku);
    // S'assurer que le slug est unique
    const slugExists = await prisma.product.findFirst({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    // Tags: couleur + taille si présents
    const tags = [];
    if (color) tags.push(color);
    if (size) tags.push(size);

    try {
      await prisma.product.create({
        data: {
          sku,
          barcode: barcode || undefined,
          name,
          slug: finalSlug,
          price,
          stock,
          categoryId: category.id,
          supplierId: supplier?.id || undefined,
          status: 'ACTIVE',
          isVisible: true,
          tags,
          images: [],
        },
      });
      created++;
      if (created % 50 === 0) {
        console.log(`\n✅ ${created} produits créés...`);
      } else {
        process.stdout.write('.');
      }
    } catch (err) {
      console.log(`\n❌ Ligne ${i + 2} (${sku}): ${err.message}`);
      errors++;
    }
  }

  console.log('\n\n=============================');
  console.log(`✅ Créés:  ${created}`);
  console.log(`⏭️  Ignorés: ${skipped} (déjà existants ou données manquantes)`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log('=============================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
