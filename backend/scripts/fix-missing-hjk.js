const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Format: [sku, barcode, name, stock, price, tags]
const MISSING = [
["K41464","7902029414642","bonnet satin NOIR 50cm",24,2.26,[]],
["K47841/R","7902029478415","Sac bretelle biodegradable en rouleau X 300pcs 26,5 X 45.5  Rouge",6,7.07,[]],
["K47841/B","7902029478415","Sac bretelle biodegradable en rouleau X 300pcs 26,5 X 45.5  Bleu",6,7.07,[]],
["5049009","8007315490009","BULLE DE SAVON CARS 60ML",36,0.89,[]],
["5513005","8007315513005","BULLE DE SAVON SPIDER MAN  60ML",36,0.89,[]],
["12011121","8414926112150","CLOCHE MICRO ONDE",12,1.31,[]],
["K46137","790202946136","PLATEAU ALU AVEC POIGNE 48*33*8",12,19.98,[]],
["K42755","7902029427550","guirlande en Pile 20L/2M BLANC",24,1.18,[]],
["K42755BLEU","7902029427550","guirlande en Pile 20L/2M BLEU",24,1.18,[]],
["MC096-1","6926393309350","set 12 crayon couleur",24,1.95,[]],
["K45916","7902029459162","BARQUETTES EN ALU 32,1*26,2*4,5CM",100,0.9,[]],
["MC096-2","6926393309367","set 18 crayon couleur",24,3.26,[]],
["PRE0542","3470320000542","PREPHAR HUILE DE MACADAMIA - 100ML",12,3.19,[]],
["D5402071","8435545720717","SECHOIR SLIP EN ALU 23*32CM",12,4.28,[]],
["K40875-TV","7902029408757","PERLE CHEVEUX TRANS-VIOL",12,0.98,[]],
["K40875-BR","7902029408757","PERLE CHEVEUX ROSE BLANC",12,0.98,[]],
["K40875-NB","7902029408757","PERLE CHEVEUX NOIR BLANC",12,0.98,[]],
["K40875(T)","7902029408757","PERLE DE CHEVEUX ASSORTIS PM TRANSPARENT",12,0.89,[]],
["K40875(V)","7902029408757","PERLE DE CHEVEUX ASSORTIS PM VIOLET",12,0.89,[]],
["K40875(B)","7902029408757","PERLE DE CHEVEUX ASSORTIS PM BLEU",12,0.89,[]],
["K40875(R)","7902029408757","PERLE DE CHEVEUX ASSORTIS PM ROSE",12,0.89,[]],
["K41461N","7902029414611","SCA46BLA HEAD WRAP NOIR",12,2.91,[]],
["K41468","7902029414680","bonnet satin 2291   COULEUR ASS",12,2.81,[]],
["K42405-7","7902029424054","sac banane imprime guadeloupe",12,6.72,[]],
["K42405-6","7902029424054","sac banane imprime guadeloupe",12,6.72,[]],
["K42405-5","7902029424054","sac banane imprime guadeloupe",12,6.72,[]],
["K42405-4","7902029424054","sac banane imprime guadeloupe",12,6.72,[]],
["K42405-3","7902029424054","sac banane imprime guadeloupe",12,6.72,[]]
];

function generateSlug(name, sku) {
  const base = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  return base + '-' + sku.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
}

async function main() {
  // Get category (same logic as original import)
  let category = await prisma.category.findFirst({
    where: { name: { contains: 'HJK', mode: 'insensitive' } }
  });
  if (!category) {
    category = await prisma.category.findFirst({
      where: { name: { in: ['Divers', 'Autres', 'Bazar', 'General', 'Quincaillerie'] } }
    });
  }
  if (!category) {
    category = await prisma.category.findFirst({ orderBy: { createdAt: 'asc' } });
  }
  console.log('Category:', category.name, category.id);

  // Get supplier HJK
  const supplier = await prisma.supplier.findFirst({
    where: { name: { contains: 'HJK', mode: 'insensitive' } }
  });
  console.log('Supplier:', supplier ? supplier.name : 'none');

  // Get existing barcodes to detect conflicts
  const existingBarcodes = new Set(
    (await prisma.product.findMany({ select: { barcode: true } }))
      .map(p => p.barcode).filter(Boolean)
  );

  let created = 0, skipped = 0, errors = 0;

  for (const [sku, barcode, name, stock, price, tags] of MISSING) {
    // Check if already exists
    const existing = await prisma.product.findFirst({ where: { sku } });
    if (existing) {
      console.log('SKIP (exists): ' + sku);
      skipped++;
      continue;
    }

    // Check barcode conflict - if conflict, use null barcode
    const useBarcode = barcode && !existingBarcodes.has(barcode) ? barcode : null;
    if (barcode && !useBarcode) {
      console.log('Barcode conflict for ' + sku + ', importing without barcode');
    }

    const slug = generateSlug(name, sku);
    const slugExists = await prisma.product.findFirst({ where: { slug } });
    const finalSlug = slugExists ? slug + '-' + Date.now() : slug;

    // Apply +13% markup directly at import
    const priceWithMarkup = Math.round(price * 1.13 * 100) / 100;

    try {
      await prisma.product.create({
        data: {
          sku,
          barcode: useBarcode || undefined,
          name,
          slug: finalSlug,
          price: priceWithMarkup,
          stock,
          categoryId: category.id,
          supplierId: supplier ? supplier.id : undefined,
          status: 'ACTIVE',
          isVisible: true,
          tags: tags || [],
          images: []
        }
      });
      if (useBarcode) existingBarcodes.add(useBarcode);
      created++;
      console.log('OK: ' + sku + ' - ' + name + ' - ' + priceWithMarkup + ' EUR');
    } catch (err) {
      errors++;
      console.log('ERR ' + sku + ': ' + err.message.substring(0, 100));
    }
  }

  console.log('=============================');
  console.log('Created: ' + created + ' | Skipped: ' + skipped + ' | Errors: ' + errors);
  console.log('=============================');
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
