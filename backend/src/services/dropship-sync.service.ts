import cron from 'node-cron';
import prisma from '../config/database';
import { getConnector, PlatformKey } from './connectors';
import { computeSalePrice } from './dropship-pricing.service';

/**
 * Synchronisation planifiée stock & prix des produits dropshipping.
 *
 * Règles automatiques :
 *   - rupture fournisseur  → availabilityStatus = UNAVAILABLE (+ masquage optionnel)
 *   - retour en stock      → availabilityStatus = AVAILABLE
 *   - variation de coût    → recalcul du prix de vente via le moteur de règles
 *   - marge sous le seuil  → syncError renseigné (alerte visible au back-office)
 *
 * Variables d'environnement :
 *   DROPSHIP_SYNC_ENABLED=1        — active la planification au démarrage
 *   DROPSHIP_SYNC_CRON=0 *\/6 * * * — fréquence (défaut : toutes les 6 h)
 *   DROPSHIP_SYNC_HIDE_OOS=1       — masque les produits en rupture
 */

let running = false;
let lastRun: { at: Date; checked: number; updated: number; errors: number } | null = null;

export function getSyncStatus() {
  return { running, lastRun, scheduled: process.env.DROPSHIP_SYNC_ENABLED === '1' };
}

export async function runSyncOnce(): Promise<{ checked: number; updated: number; errors: number }> {
  if (running) throw new Error('Une synchronisation est déjà en cours');
  running = true;
  let checked = 0, updated = 0, errors = 0;

  try {
    const sources = await prisma.dropshipSource.findMany({
      where: { syncEnabled: true },
      include: { product: { select: { id: true, price: true, categoryId: true, isVisible: true, availabilityStatus: true } } },
      orderBy: { lastSyncAt: 'asc' },
      take: 500, // lot maximal par exécution
    });

    for (const src of sources) {
      checked++;
      try {
        const connector = getConnector(src.platform as PlatformKey);
        if (!connector.isConfigured()) continue;

        const fresh = await connector.refreshPricingStock({
          externalId: src.externalId,
          url: src.sourceUrl,
          variantKey: src.variantKey,
        });

        const data: any = { lastSyncAt: new Date(), syncError: null };
        const productData: any = {};

        // Stock
        if (fresh.stockQty !== null) {
          data.stockQty = fresh.stockQty;
          if (fresh.stockQty <= 0) {
            productData.availabilityStatus = 'UNAVAILABLE';
            if (process.env.DROPSHIP_SYNC_HIDE_OOS === '1') productData.isVisible = false;
          } else if (src.product.availabilityStatus === 'UNAVAILABLE') {
            productData.availabilityStatus = 'AVAILABLE';
          }
          productData.stock = Math.max(0, fresh.stockQty);
        }

        // Coût → recalcul du prix de vente
        if (fresh.costPrice !== null && fresh.costPrice !== src.costPrice) {
          data.costPrice = fresh.costPrice;
          const pricing = await computeSalePrice({
            platform: src.platform,
            categoryId: src.product.categoryId,
            costPrice: fresh.costPrice,
            shippingCost: fresh.shippingCost ?? src.shippingCost,
          });
          if (pricing.price !== null) {
            productData.price = pricing.price;
            productData.costPrice = fresh.costPrice;
          }
          if (pricing.belowMinMargin) {
            data.syncError = `⚠ Marge sous le seuil après hausse fournisseur (${pricing.details})`;
          }
        }

        await prisma.dropshipSource.update({ where: { id: src.id }, data });
        if (Object.keys(productData).length) {
          await prisma.product.update({ where: { id: src.productId }, data: productData });
          updated++;
        }
      } catch (e: any) {
        errors++;
        await prisma.dropshipSource.update({
          where: { id: src.id },
          data: { syncError: String(e.message || e).slice(0, 500), lastSyncAt: new Date() },
        }).catch(() => undefined);
      }
      // Espacement anti rate-limit fournisseur
      await new Promise((r) => setTimeout(r, 300));
    }
  } finally {
    running = false;
    lastRun = { at: new Date(), checked, updated, errors };
  }

  console.log(`[dropship-sync] terminé : ${checked} vérifiés, ${updated} mis à jour, ${errors} erreurs`);
  return { checked, updated, errors };
}

/** À appeler au démarrage du serveur. */
export function scheduleDropshipSync() {
  if (process.env.DROPSHIP_SYNC_ENABLED !== '1') {
    console.log('[dropship-sync] planification désactivée (DROPSHIP_SYNC_ENABLED != 1)');
    return;
  }
  const expr = process.env.DROPSHIP_SYNC_CRON || '0 */6 * * *';
  cron.schedule(expr, () => {
    runSyncOnce().catch((e) => console.error('[dropship-sync]', e.message));
  });
  console.log(`[dropship-sync] planifié : ${expr}`);
}
