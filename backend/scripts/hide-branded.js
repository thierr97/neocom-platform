/**
 * Masque les produits déjà en ligne dont le titre évoque une marque/IP protégée
 * (contrefaçon probable). Lancement :
 *   cd /opt/render/project/src/backend && node scripts/hide-branded.js
 * ⚠️ Ne détecte que les marques NOMMÉES dans le titre. Les logos présents
 * uniquement dans l'image nécessitent un contrôle visuel manuel.
 */
const { PrismaClient } = require('@prisma/client');
const { isBrandBlocked, BLOCKED_TERMS } = require('../dist/services/brand-blocklist');
const prisma = new PrismaClient();

(async () => {
  const products = await prisma.product.findMany({
    where: { isVisible: true },
    select: { id: true, name: true },
  });
  const hits = products.filter((p) => isBrandBlocked(p.name));
  console.log('Produits visibles :', products.length, '| à masquer (marque protégée) :', hits.length);
  for (const h of hits) {
    await prisma.product.update({ where: { id: h.id }, data: { isVisible: false } });
    console.log('  masqué :', h.name.slice(0, 70));
  }
  console.log('Termes surveillés :', BLOCKED_TERMS.length);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
