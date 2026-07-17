import cron from 'node-cron';
import prisma from '../config/database';
import { getConnector, PlatformKey, UnsupportedOperationError } from './connectors';

/**
 * Auto-fulfillment : dès qu'une commande client est PAYÉE, chaque ligne liée à
 * un produit dropshipping génère une commande fournisseur.
 *
 *   - AliExpress / CJ : placement automatique via API (statut PLACED),
 *     puis récupération du tracking à chaque passage du cron.
 *   - Temu / Shein    : pas d'API → statut MANUAL_REQUIRED, l'admin passe la
 *     commande à la main puis renseigne le n° fournisseur au back-office.
 *
 * Idempotent : contrainte unique sur orderItemId (jamais deux commandes
 * fournisseur pour la même ligne client).
 *
 * Variables d'environnement :
 *   DROPSHIP_FULFILL_ENABLED=1        — active la planification
 *   DROPSHIP_FULFILL_CRON=*\/10 * * * * — fréquence (défaut : toutes les 10 min)
 *   DROPSHIP_AUTO_PLACE=1             — passe RÉELLEMENT les commandes API.
 *     Sans ce flag, les lignes restent en PENDING (revue humaine) : sécurité
 *     par défaut car une commande fournisseur engage un paiement réel.
 */

let lastRun: { at: Date; created: number; placed: number; tracked: number; errors: number } | null = null;

export function getFulfillmentStatus() {
  return {
    lastRun,
    scheduled: process.env.DROPSHIP_FULFILL_ENABLED === '1',
    autoPlace: process.env.DROPSHIP_AUTO_PLACE === '1',
  };
}

/** 1. Détecte les lignes payées sans commande fournisseur et les crée. */
async function createPendingSupplierOrders(): Promise<number> {
  const paidOrders = await prisma.order.findMany({
    where: {
      paymentStatus: 'PAID',
      status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) }, // 30 derniers jours
    },
    include: {
      items: { include: { product: { include: { dropshipSource: true } } } },
      customer: true,
    },
    take: 100,
  });

  let created = 0;
  for (const order of paidOrders) {
    for (const item of order.items) {
      const src = item.product?.dropshipSource;
      if (!src) continue;

      const exists = await prisma.supplierOrder.findUnique({ where: { orderItemId: item.id } });
      if (exists) continue;

      const connector = getConnector(src.platform as PlatformKey);
      await prisma.supplierOrder.create({
        data: {
          orderId: order.id,
          orderItemId: item.id,
          platform: src.platform,
          status: connector.supportsAutoOrder() ? 'PENDING' : 'MANUAL_REQUIRED',
          notes: connector.supportsAutoOrder()
            ? null
            : `${src.platform} sans API : commander manuellement sur ${src.sourceUrl || 'la plateforme'} puis renseigner le n° fournisseur`,
        },
      });
      created++;
    }
  }
  return created;
}

/** 2. Place les commandes PENDING via l'API du fournisseur (si DROPSHIP_AUTO_PLACE=1). */
async function placePendingOrders(): Promise<{ placed: number; errors: number }> {
  if (process.env.DROPSHIP_AUTO_PLACE !== '1') return { placed: 0, errors: 0 };

  const pending = await prisma.supplierOrder.findMany({
    where: { status: 'PENDING', attempts: { lt: 3 } },
    take: 20,
  });

  let placed = 0, errors = 0;
  for (const so of pending) {
    try {
      const item = await prisma.orderItem.findUnique({
        where: { id: so.orderItemId },
        include: { product: { include: { dropshipSource: true } }, order: { include: { customer: true } } },
      });
      const src = item?.product?.dropshipSource;
      const order = item?.order;
      if (!item || !src || !order) throw new Error('Ligne de commande ou source dropshipping introuvable');
      if (!src.externalId) throw new Error('externalId fournisseur manquant sur la source');

      const connector = getConnector(src.platform as PlatformKey);
      const result = await connector.placeOrder({
        externalProductId: src.externalId,
        variantKey: src.variantKey,
        quantity: item.quantity,
        recipient: {
          fullName: [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ')
            || order.customer?.companyName || 'Client NeoServ',
          phone: order.customer?.phone || null,
          address: order.shippingAddress || order.customer?.address || '',
          city: order.shippingCity || order.customer?.city || '',
          postalCode: order.shippingPostalCode || order.customer?.postalCode || '',
          country: order.shippingCountry || 'GP',
        },
        internalRef: order.number,
      });

      await prisma.supplierOrder.update({
        where: { id: so.id },
        data: {
          status: result.placed ? 'PLACED' : 'FAILED',
          externalOrderId: result.externalOrderId,
          placedAt: result.placed ? new Date() : null,
          attempts: { increment: 1 },
          lastError: result.placed ? null : result.message,
        },
      });
      if (result.placed) placed++;
    } catch (e: any) {
      errors++;
      await prisma.supplierOrder.update({
        where: { id: so.id },
        data: { attempts: { increment: 1 }, lastError: String(e.message || e).slice(0, 500), status: e instanceof UnsupportedOperationError ? 'MANUAL_REQUIRED' : 'PENDING' },
      }).catch(() => undefined);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return { placed, errors };
}

/** 3. Récupère les numéros de suivi des commandes PLACED. */
async function refreshTracking(): Promise<number> {
  const placedOrders = await prisma.supplierOrder.findMany({
    where: { status: 'PLACED', externalOrderId: { not: null } },
    take: 50,
  });

  let tracked = 0;
  for (const so of placedOrders) {
    try {
      const connector = getConnector(so.platform as PlatformKey);
      const t = await connector.getTracking(so.externalOrderId!);
      if (t.trackingNumber && t.trackingNumber !== so.trackingNumber) {
        await prisma.supplierOrder.update({
          where: { id: so.id },
          data: {
            trackingNumber: t.trackingNumber,
            trackingUrl: t.trackingUrl,
            carrier: t.carrier,
            status: 'SHIPPED',
            shippedAt: new Date(),
          },
        });
        tracked++;
      } else if (t.delivered) {
        await prisma.supplierOrder.update({ where: { id: so.id }, data: { status: 'DELIVERED' } });
      }
    } catch {
      /* le tracking peut mettre plusieurs jours à apparaître : silencieux */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return tracked;
}

export async function runFulfillmentOnce() {
  const created = await createPendingSupplierOrders();
  const { placed, errors } = await placePendingOrders();
  const tracked = await refreshTracking();
  lastRun = { at: new Date(), created, placed, tracked, errors };
  if (created + placed + tracked + errors > 0) {
    console.log(`[fulfillment] ${created} créées, ${placed} placées, ${tracked} trackées, ${errors} erreurs`);
  }
  return lastRun;
}

export function scheduleFulfillment() {
  if (process.env.DROPSHIP_FULFILL_ENABLED !== '1') {
    console.log('[fulfillment] planification désactivée (DROPSHIP_FULFILL_ENABLED != 1)');
    return;
  }
  const expr = process.env.DROPSHIP_FULFILL_CRON || '*/10 * * * *';
  cron.schedule(expr, () => {
    runFulfillmentOnce().catch((e) => console.error('[fulfillment]', e.message));
  });
  console.log(`[fulfillment] planifié : ${expr}`);
}
