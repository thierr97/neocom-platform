/**
 * Nettoyage catalogue (one-shot) :
 *   1. Masque tous les produits présents en base AVANT AliExpress (pas de
 *      DropshipSource, pas de tag 'dropshipping') → isVisible=false.
 *   2. Re-catégorise les produits « À catégoriser » vers de vraies catégories
 *      (module category-guess), en créant les catégories manquantes.
 *   3. Supprime la catégorie « À catégoriser » (et toute catégorie vide/masquée).
 *
 * Lancement (Render Web Shell) :
 *   cd /opt/render/project/src/backend && node scripts/cleanup-catalog.js
 */
const { PrismaClient } = require('@prisma/client');
const { guessCategory } = require('../dist/services/category-guess');
const prisma = new PrismaClient();

function slugify(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function ensureCategory(name) {
  const slug = slugify(name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  const c = await prisma.category.create({ data: { name, slug, isVisible: true } });
  console.log('  + catégorie créée :', name);
  return c.id;
}

(async () => {
  // --- 1. Masquer les anciens produits (pré-AliExpress) ---
  const hidden = await prisma.product.updateMany({
    where: {
      isVisible: true,
      dropshipSource: { is: null },
      NOT: { tags: { has: 'dropshipping' } },
    },
    data: { isVisible: false },
  });
  console.log('1) Anciens produits masqués :', hidden.count);

  // --- 2. Re-catégoriser « À catégoriser » ---
  const acat = await prisma.category.findFirst({
    where: { OR: [{ slug: 'a-categoriser' }, { name: { contains: 'catégoriser', mode: 'insensitive' } }] },
    select: { id: true },
  });

  let recat = 0;
  const cacheByName = new Map();
  if (acat) {
    const toFix = await prisma.product.findMany({
      where: { categoryId: acat.id },
      select: { id: true, name: true },
    });
    console.log('2) Produits à recatégoriser :', toFix.length);
    for (const p of toFix) {
      const catName = guessCategory(p.name);
      let catId = cacheByName.get(catName);
      if (!catId) { catId = await ensureCategory(catName); cacheByName.set(catName, catId); }
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: catId } });
      recat++;
    }
    console.log('   recatégorisés :', recat);
  } else {
    console.log('2) Pas de catégorie « À catégoriser » trouvée.');
  }

  // --- 3. Supprimer « À catégoriser » (désormais vide) ---
  if (acat) {
    const remaining = await prisma.product.count({ where: { categoryId: acat.id } });
    if (remaining === 0) {
      await prisma.category.delete({ where: { id: acat.id } });
      console.log('3) Catégorie « À catégoriser » supprimée.');
    } else {
      console.log('3) « À catégoriser » non supprimée, reste', remaining, 'produits.');
    }
  }

  // --- Bonus : masquer les catégories qui n'ont plus aucun produit visible ---
  const cats = await prisma.category.findMany({ select: { id: true, name: true, isVisible: true } });
  let hiddenCats = 0;
  for (const c of cats) {
    const visibleCount = await prisma.product.count({ where: { categoryId: c.id, isVisible: true } });
    if (visibleCount === 0 && c.isVisible) {
      await prisma.category.update({ where: { id: c.id }, data: { isVisible: false } });
      hiddenCats++;
    }
  }
  console.log('4) Catégories vides masquées :', hiddenCats);

  const totalVisible = await prisma.product.count({ where: { isVisible: true } });
  const totalCatsVisible = await prisma.category.count({ where: { isVisible: true } });
  console.log('=== FINAL : produits visibles', totalVisible, '| catégories visibles', totalCatsVisible);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
