/**
 * Remplit le champ `brand` des produits dropshipping déjà importés en parsant
 * « Nom de marque : X » dans leur description HTML. Ignore les marques
 * génériques (NONE, OEM…). Lancement :
 *   cd /opt/render/project/src/backend && node scripts/backfill-brands.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isJunk = (b) => !b || b.length < 2 || b.length > 40 ||
  /^(none|no brand|sans marque|oem|generic|n\/?a|aucun|other|others|no|yes)$/i.test(b);

(async () => {
  const products = await prisma.product.findMany({
    where: { tags: { has: 'dropshipping' }, brand: null, description: { not: null } },
    select: { id: true, description: true },
  });
  console.log('Produits à traiter :', products.length);

  let set = 0;
  for (const p of products) {
    const m = (p.description || '').match(/Nom de marque\s*:?\s*<\/strong>?\s*([^<;,\n]+)/i)
      || (p.description || '').match(/Nom de marque\s*:?\s*([^<;,\n]+)/i);
    const brand = m ? m[1].trim() : null;
    if (isJunk(brand)) continue;
    await prisma.product.update({ where: { id: p.id }, data: { brand } });
    set++;
  }
  console.log('Marques renseignées :', set);

  const distinct = await prisma.product.groupBy({
    by: ['brand'], where: { brand: { not: null } }, _count: { brand: true },
    orderBy: { _count: { brand: 'desc' } }, take: 15,
  });
  console.log('Top marques :', distinct.map((d) => `${d.brand}(${d._count.brand})`).join(', '));
  await prisma.$disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
