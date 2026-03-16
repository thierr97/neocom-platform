const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Map: SKU without image -> base SKU that has an image
const SIBLINGS = {
  'K40875-TV':   'K40875',
  'K40875-BR':   'K40875',
  'K40875-NB':   'K40875',
  'K40875(T)':   'K40875',
  'K40875(V)':   'K40875',
  'K40875(B)':   'K40875',
  'K40875(R)':   'K40875',
  'K42405-3':    'K42405-1',
  'K42405-4':    'K42405-1',
  'K42405-5':    'K42405-1',
  'K42405-6':    'K42405-1',
  'K42405-7':    'K42405-1',
  'K41461N':     'K41461',
  'K41468':      'K41468N',
  'K45916':      'K45916-COUVER',
  'MC096-2':     'MC096-1',
  'PRE0542':     'PRE0542',
  'D5402071':    'D5402071',
};

async function main() {
  let updated = 0, notFound = 0;

  for (const [sku, parentSku] of Object.entries(SIBLINGS)) {
    const product = await prisma.product.findFirst({ where: { sku }, select: { id: true, images: true } });
    if (!product) { console.log('SKIP no product: ' + sku); continue; }
    if (product.images && product.images.length > 0) { console.log('SKIP has image: ' + sku); continue; }

    const parent = await prisma.product.findFirst({
      where: { sku: parentSku },
      select: { images: true, thumbnail: true }
    });

    if (!parent || !parent.images || parent.images.length === 0) {
      console.log('NO IMAGE on parent ' + parentSku + ' for ' + sku);
      notFound++;
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { images: parent.images, thumbnail: parent.thumbnail }
    });
    updated++;
    console.log('OK: ' + sku + ' <- ' + parentSku);
  }

  console.log('=============================');
  console.log('Updated: ' + updated + ' | Not found: ' + notFound);
  console.log('=============================');
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
