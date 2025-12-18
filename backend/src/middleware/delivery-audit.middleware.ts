import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Middleware Prisma pour l'audit automatique des livraisons
 *
 * Ce middleware intercepte toutes les opérations update/updateMany sur le modèle Delivery
 * et crée automatiquement un événement DeliveryEvent lorsque le statut change.
 *
 * Fonctionnalités:
 * - Détection automatique des changements de statut
 * - Création d'événements d'audit immutables
 * - Capture de l'acteur (userId) depuis les paramètres de requête
 */

export interface DeliveryUpdateContext {
  userId?: string;
  userRole?: string;
}

export function createDeliveryAuditMiddleware(prismaClient: PrismaClient): Prisma.Middleware {
  return async (params, next) => {
    // Ne traiter que les opérations sur le modèle Delivery
    if (params.model !== 'Delivery') {
      return next(params);
    }

    // Ne traiter que les opérations update et updateMany
    if (params.action === 'update' || params.action === 'updateMany') {
      const updateData = params.args.data;

      // Vérifier si le statut est modifié
      if (updateData && 'status' in updateData) {
        const newStatus = updateData.status;

        try {
          // Récupérer l'ancien statut avant la mise à jour
          let oldDelivery: any = null;

          if (params.action === 'update') {
            // Pour update, on a un seul enregistrement
            oldDelivery = await prismaClient.delivery.findUnique({
              where: params.args.where,
              select: { id: true, status: true, previousStatus: true },
            });
          }

          // Exécuter l'opération de mise à jour originale
          const result = await next(params);

          // Créer l'événement d'audit après le succès de la mise à jour
          if (oldDelivery && oldDelivery.status !== newStatus) {
            // Extraire le contexte utilisateur depuis les paramètres (si fourni)
            const context = (updateData as any).__context as DeliveryUpdateContext | undefined;

            await prismaClient.deliveryEvent.create({
              data: {
                deliveryId: oldDelivery.id,
                type: 'STATUS_CHANGE',
                description: `Statut changé de ${oldDelivery.status} à ${newStatus}`,
                oldStatus: oldDelivery.status,
                newStatus: newStatus,
                userId: context?.userId || null,
                actorRole: context?.userRole as any || null,
                timestamp: new Date(),
                metadata: {
                  previousStatus: oldDelivery.previousStatus,
                  automaticEvent: true,
                },
              },
            });

            console.log(`✅ [DeliveryAudit] Événement créé: ${oldDelivery.id} - ${oldDelivery.status} → ${newStatus}`);
          }

          return result;
        } catch (error) {
          console.error('❌ [DeliveryAudit] Erreur lors de la création de l\'événement:', error);
          // Ne pas bloquer la mise à jour en cas d'erreur d'audit
          return next(params);
        }
      }
    }

    // Pour toutes les autres opérations, passer directement
    return next(params);
  };
}

/**
 * Helper pour attacher le contexte utilisateur à une opération de mise à jour
 *
 * @example
 * await prisma.delivery.update({
 *   where: { id: deliveryId },
 *   data: withAuditContext({
 *     status: 'PICKED_UP',
 *   }, {
 *     userId: req.user.id,
 *     userRole: req.user.role,
 *   }),
 * });
 */
export function withAuditContext<T extends Record<string, any>>(
  data: T,
  context: DeliveryUpdateContext
): T & { __context: DeliveryUpdateContext } {
  return {
    ...data,
    __context: context,
  };
}
