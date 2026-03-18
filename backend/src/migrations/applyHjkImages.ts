/**
 * Migration one-shot: applique les images HJK (Cloudinary) sur les produits sans image
 * S'exécute une fois au démarrage du backend si le flag n'est pas déjà posé
 */
import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

interface ImageMapping {
  [sku: string]: { url: string; name: string };
}

export async function applyHjkImages() {
  const mappingPath = path.join(__dirname, '../data/hjk_images_mapping.json');

  if (!fs.existsSync(mappingPath)) {
    return; // Pas de fichier de mapping, on ignore
  }

  // Vérifier si déjà appliqué (via un flag en base ou juste en comptant les produits avec image)
  const productsWithImages = await prisma.product.count({
    where: {
      images: { isEmpty: false },
      NOT: { images: { has: '' } },
    },
  }).catch(() => 0);

  // Si plus de 100 produits ont déjà des images Cloudinary, c'est probablement déjà fait
  const cloudinaryProducts = await prisma.product.count({
    where: {
      images: { has: 'res.cloudinary.com' },
    },
  }).catch(() => 0);

  if (cloudinaryProducts > 100) {
    console.log(`ℹ️  [HJK Migration] Déjà ${cloudinaryProducts} produits avec images Cloudinary, migration ignorée`);
    return;
  }

  console.log('🖼️  [HJK Migration] Application des images produits HJK...');

  const mapping: ImageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  const skus = Object.keys(mapping);

  let updated = 0;
  let skipped = 0;

  for (const sku of skus) {
    const { url } = mapping[sku];

    try {
      // Update uniquement les produits sans image ou avec data: URI
      const result = await prisma.$executeRaw`
        UPDATE "products"
        SET images = ARRAY[${url}]::text[]
        WHERE sku = ${sku}
          AND (
            images IS NULL
            OR images = '{}'
            OR (array_length(images, 1) > 0 AND images[1] LIKE 'data:%')
            OR array_length(images, 1) = 0
          )
      `;

      if (result > 0) {
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      // Ignorer les erreurs individuelles
    }
  }

  console.log(`✅ [HJK Migration] ${updated} produits mis à jour, ${skipped} ignorés`);

  // Supprimer le fichier de mapping après application pour ne pas re-exécuter
  try {
    fs.unlinkSync(mappingPath);
    console.log('🗑️  [HJK Migration] Fichier de mapping supprimé');
  } catch {
    // Ignore
  }
}
