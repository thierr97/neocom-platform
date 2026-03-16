const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'https://res.cloudinary.com/dcckh4zyh/image/upload/c_limit,h_800,q_auto,w_800/neoserv/products/hjk/';

const SKUS = [
  'K41464','K47841/R','K47841/B','5049009','5513005','12011121',
  'K46137','K42755','K42755BLEU','MC096-1','K45916','MC096-2',
  'PRE0542','D5402071','K40875-TV','K40875-BR','K40875-NB',
  'K40875(T)','K40875(V)','K40875(B)','K40875(R)',
  'K41461N','K41468','K42405-7','K42405-6','K42405-5','K42405-4','K42405-3'
];

function safeId(sku) {
  return sku.replace(/[^a-zA-Z0-9]/g, '_');
}

async function checkUrl(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch { return false; }
}

async function main() {
  let updated = 0, notFound = 0;

  for (const sku of SKUS) {
    const product = await prisma.product.findFirst({ where: { sku }, select: { id: true, images: true } });
    if (!product) { console.log('SKIP (no product): ' + sku); continue; }
    if (product.images && product.images.length > 0) { console.log('SKIP (has image): ' + sku); continue; }

    const safe = safeId(sku);
    // Try png then jpg
    const urlPng = BASE + 'hjk_' + safe + '.png';
    const urlJpg = BASE + 'hjk_' + safe + '.jpg';

    let imageUrl = null;
    if (await checkUrl(urlPng)) imageUrl = urlPng;
    else if (await checkUrl(urlJpg)) imageUrl = urlJpg;

    if (!imageUrl) {
      console.log('NOT FOUND on Cloudinary: ' + sku + ' (tried hjk_' + safe + '.png/.jpg)');
      notFound++;
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { images: [imageUrl], thumbnail: imageUrl }
    });
    updated++;
    console.log('OK: ' + sku + ' -> hjk_' + safe);
  }

  console.log('=============================');
  console.log('Updated: ' + updated + ' | Not on Cloudinary: ' + notFound);
  console.log('=============================');
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
