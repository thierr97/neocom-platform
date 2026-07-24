/**
 * Script d'application des images HJK en production
 * Usage: npx ts-node scripts/apply_hjk_images.ts
 */
import prisma from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

interface ImageMapping {
  [sku: string]: { url: string; name: string };
}

async function main() {
  const mappingPath = path.join(__dirname, 'hjk_images_mapping.json');

  if (!fs.existsSync(mappingPath)) {
    console.error('❌ Fichier hjk_images_mapping.json non trouvé');
    process.exit(1);
  }

  const mapping: ImageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  const skus = Object.keys(mapping);
  console.log(`📦 ${skus.length} produits à mettre à jour`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const sku of skus) {
    const { url, name } = mapping[sku];

    // Chercher le produit par SKU
    const product = await prisma.product.findFirst({
      where: { sku },
      select: { id: true, name: true, images: true },
    });

    if (!product) {
      console.log(`  ⚠️  Non trouvé: ${sku} (${name.substring(0, 40)})`);
      notFound++;
      continue;
    }

    // Ignorer si déjà une vraie image (pas data: URI et pas vide)
    const hasRealImage = product.images?.length > 0 &&
      !product.images[0].startsWith('data:') &&
      product.images[0].startsWith('http');

    if (hasRealImage) {
      skipped++;
      continue;
    }

    // Mettre à jour
    await prisma.product.update({
      where: { id: product.id },
      data: { images: [url] },
    });

    console.log(`  ✅ ${sku} | ${product.name.substring(0, 40)}`);
    updated++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ ${updated} produits mis à jour`);
  console.log(`⏭️  ${skipped} ignorés (déjà une image)`);
  console.log(`⚠️  ${notFound} non trouvés en base`);
  console.log('='.repeat(50));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
