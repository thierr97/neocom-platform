/**
 * render-link-hjk.js
 * Lancer sur Render Shell: node scripts/render-link-hjk.js
 *
 * 1. Trouve ou crée le fournisseur HJK DISTRIBUTION
 * 2. Met à jour supplierId de tous les produits avec SKU commençant par K
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Trouver ou créer HJK DISTRIBUTION
  let supplier = await prisma.supplier.findFirst({
    where: { companyName: { contains: 'HJK', mode: 'insensitive' } }
  });

  if (!supplier) {
    console.log('Création du fournisseur HJK DISTRIBUTION...');
    supplier = await prisma.supplier.create({
      data: {
        companyName: 'HJK DISTRIBUTION',
        contactName: 'HJK Distribution',
        email: 'contact@hjk-distribution.com',
        status: 'ACTIVE',
      }
    });
    console.log('Créé:', supplier.id);
  } else {
    console.log('Trouvé:', supplier.companyName, supplier.id);
  }

  // 2. Mettre à jour tous les produits avec SKU commençant par K (HJK)
  const result = await prisma.product.updateMany({
    where: {
      OR: [
        { sku: { startsWith: 'K' } },
        { sku: { startsWith: 'k' } },
      ]
    },
    data: { supplierId: supplier.id }
  });

  console.log('Produits mis à jour:', result.count);

  // Vérification
  const count = await prisma.product.count({ where: { supplierId: supplier.id } });
  console.log('Total produits liés à HJK:', count);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
