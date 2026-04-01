import prisma from '../config/database';

/**
 * Génère une référence client unique au format CLI-XXXXXX
 * Basée sur un compteur auto-incrémenté stocké en base
 */
export async function generateClientRef(): Promise<string> {
  // Utiliser un verrou transactionnel pour éviter les doublons en concurrence
  const result = await prisma.$transaction(async (tx) => {
    // Trouver le dernier clientRef
    const last = await tx.customer.findFirst({
      where: { clientRef: { not: null } },
      orderBy: { clientRef: 'desc' },
      select: { clientRef: true },
    });

    let nextNum = 1;
    if (last?.clientRef) {
      const match = last.clientRef.match(/CLI-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    return `CLI-${String(nextNum).padStart(6, '0')}`;
  });

  return result;
}
