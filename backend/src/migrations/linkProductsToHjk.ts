/**
 * Migration: lie tous les produits sans supplierId à HJK DISTRIBUTION
 * À exécuter une seule fois
 */
import prisma from '../config/database';

export async function linkProductsToHjk() {
  try {
    // Trouver le fournisseur HJK
    const hjk = await prisma.supplier.findFirst({
      where: {
        OR: [
          { companyName: { contains: 'HJK', mode: 'insensitive' } },
        ]
      },
      select: { id: true, companyName: true }
    });

    if (!hjk) {
      console.log('ℹ️  [LinkProductsHJK] Fournisseur HJK non trouvé, migration ignorée');
      return;
    }

    // Compter les produits sans supplierId
    const unlinked = await prisma.product.count({
      where: {
        OR: [
          { supplierId: null },
          { supplierId: '' },
        ]
      }
    });

    if (unlinked === 0) {
      console.log(`ℹ️  [LinkProductsHJK] Tous les produits ont déjà un fournisseur`);
      return;
    }

    console.log(`🔗 [LinkProductsHJK] Liaison de ${unlinked} produits sans fournisseur → ${hjk.companyName}...`);

    // Lier tous les produits sans supplierId à HJK
    const result = await prisma.product.updateMany({
      where: {
        OR: [
          { supplierId: null },
          { supplierId: '' },
        ]
      },
      data: {
        supplierId: hjk.id
      }
    });

    console.log(`✅ [LinkProductsHJK] ${result.count} produits liés à ${hjk.companyName} (ID: ${hjk.id})`);

  } catch (err: any) {
    console.warn('⚠️  [LinkProductsHJK] Erreur:', err.message);
  }
}
