import prisma from '../config/database';
import { generateAccountingEntryNumber } from '../utils/generateNumber';

/**
 * Service de comptabilité automatique
 * Génère automatiquement les écritures comptables pour toutes les opérations commerciales
 */

interface AccountingLineData {
  accountCode: string;
  label: string;
  debit: number;
  credit: number;
}

/**
 * Génère une écriture comptable automatique pour une facture de vente
 */
export const generateSaleInvoiceEntry = async (invoiceId: string) => {
  try {
    // Récupérer la facture avec ses détails
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    // Calculer les montants
    const totalHT = invoice.subtotal;
    const totalTVA = invoice.tax;
    const totalTTC = invoice.total;

    // Récupérer les comptes nécessaires
    const compteClient = await prisma.accountingAccount.findFirst({
      where: { code: '411000' }, // Clients
    });

    const compteVente = await prisma.accountingAccount.findFirst({
      where: { code: '707000' }, // Ventes de marchandises
    });

    const compteTVACollectee = await prisma.accountingAccount.findFirst({
      where: { code: '445710' }, // TVA collectée
    });

    if (!compteClient || !compteVente || !compteTVACollectee) {
      throw new Error('Comptes comptables manquants');
    }

    // Générer le numéro d'écriture
    const entryNumber = await generateAccountingEntryNumber();

    // Créer l'écriture comptable
    const entry = await prisma.accountingEntry.create({
      data: {
        number: entryNumber,
        date: invoice.createdAt,
        reference: `FAC-${invoice.number}`,
        label: `Facture de vente n°${invoice.number} - ${invoice.customer?.companyName || invoice.customer?.firstName + ' ' + invoice.customer?.lastName}`,
        journal: 'VENTE',
        status: 'DRAFT', // Brouillon pour validation par comptable
        lines: {
          create: [
            // Débit - Client (Créance)
            {
              accountId: compteClient.id,
              label: `Facture ${invoice.number}`,
              debit: totalTTC,
              credit: 0,
            },
            // Crédit - Ventes HT
            {
              accountId: compteVente.id,
              label: `Vente ${invoice.number}`,
              debit: 0,
              credit: totalHT,
            },
            // Crédit - TVA collectée
            {
              accountId: compteTVACollectee.id,
              label: `TVA s/vente ${invoice.number}`,
              debit: 0,
              credit: totalTVA,
            },
          ],
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Lier l'écriture à la facture
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        accountingEntryId: entry.id,
      },
    });

    return entry;
  } catch (error) {
    console.error('Erreur génération écriture vente:', error);
    throw error;
  }
};

/**
 * Génère une écriture comptable pour une facture d'achat
 */
export const generatePurchaseInvoiceEntry = async (purchaseInvoiceId: string) => {
  try {
    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id: purchaseInvoiceId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchaseInvoice) {
      throw new Error('Facture d\'achat non trouvée');
    }

    const totalHT = purchaseInvoice.subtotal;
    const totalTVA = purchaseInvoice.tax;
    const totalTTC = purchaseInvoice.total;

    // Récupérer les comptes
    const compteAchat = await prisma.accountingAccount.findFirst({
      where: { code: '607000' }, // Achats de marchandises
    });

    const compteTVADeductible = await prisma.accountingAccount.findFirst({
      where: { code: '445660' }, // TVA déductible sur achats
    });

    const compteFournisseur = await prisma.accountingAccount.findFirst({
      where: { code: '401000' }, // Fournisseurs
    });

    if (!compteAchat || !compteTVADeductible || !compteFournisseur) {
      throw new Error('Comptes comptables manquants');
    }

    // Générer le numéro d'écriture
    const entryNumber = await generateAccountingEntryNumber();

    // Créer l'écriture
    const entry = await prisma.accountingEntry.create({
      data: {
        number: entryNumber,
        date: purchaseInvoice.date,
        reference: `ACH-${purchaseInvoice.number}`,
        label: `Facture d'achat n°${purchaseInvoice.number} - ${purchaseInvoice.supplier.companyName}`,
        journal: 'ACHAT',
        status: 'DRAFT',
        lines: {
          create: [
            // Débit - Achats HT
            {
              accountId: compteAchat.id,
              label: `Achat ${purchaseInvoice.number}`,
              debit: totalHT,
              credit: 0,
            },
            // Débit - TVA déductible
            {
              accountId: compteTVADeductible.id,
              label: `TVA s/achat ${purchaseInvoice.number}`,
              debit: totalTVA,
              credit: 0,
            },
            // Crédit - Fournisseur (Dette)
            {
              accountId: compteFournisseur.id,
              label: `Facture ${purchaseInvoice.number}`,
              debit: 0,
              credit: totalTTC,
            },
          ],
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Lier l'écriture à la facture d'achat
    await prisma.purchaseInvoice.update({
      where: { id: purchaseInvoiceId },
      data: {
        accountingEntryId: entry.id,
      },
    });

    return entry;
  } catch (error) {
    console.error('Erreur génération écriture achat:', error);
    throw error;
  }
};

/**
 * Génère une écriture de paiement client
 */
export const generatePaymentReceivedEntry = async (
  invoiceId: string,
  paymentMethod: 'BANK' | 'CASH' | 'CHECK',
  amount: number,
  paymentDate: Date
) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    // Déterminer le compte de trésorerie
    let compteTresorerie;
    let journalType: 'BANQUE' | 'CAISSE';

    if (paymentMethod === 'CASH') {
      compteTresorerie = await prisma.accountingAccount.findFirst({
        where: { code: '530000' }, // Caisse
      });
      journalType = 'CAISSE';
    } else {
      compteTresorerie = await prisma.accountingAccount.findFirst({
        where: { code: '512000' }, // Banque
      });
      journalType = 'BANQUE';
    }

    const compteClient = await prisma.accountingAccount.findFirst({
      where: { code: '411000' }, // Clients
    });

    if (!compteTresorerie || !compteClient) {
      throw new Error('Comptes comptables manquants');
    }

    // Générer le numéro d'écriture
    const entryNumber = await generateAccountingEntryNumber();

    // Créer l'écriture de paiement
    const entry = await prisma.accountingEntry.create({
      data: {
        number: entryNumber,
        date: paymentDate,
        reference: `REG-${invoice.number}`,
        label: `Règlement facture ${invoice.number} - ${invoice.customer?.companyName || invoice.customer?.firstName + ' ' + invoice.customer?.lastName}`,
        journal: journalType,
        status: 'DRAFT',
        lines: {
          create: [
            // Débit - Banque/Caisse (Encaissement)
            {
              accountId: compteTresorerie.id,
              label: `Règlement ${invoice.number}`,
              debit: amount,
              credit: 0,
            },
            // Crédit - Client (Diminution créance)
            {
              accountId: compteClient.id,
              label: `Règlement ${invoice.number}`,
              debit: 0,
              credit: amount,
            },
          ],
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return entry;
  } catch (error) {
    console.error('Erreur génération écriture paiement reçu:', error);
    throw error;
  }
};

/**
 * Génère une écriture de paiement fournisseur
 */
export const generatePaymentMadeEntry = async (
  purchaseInvoiceId: string,
  paymentMethod: 'BANK' | 'CASH' | 'CHECK',
  amount: number,
  paymentDate: Date
) => {
  try {
    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id: purchaseInvoiceId },
      include: { supplier: true },
    });

    if (!purchaseInvoice) {
      throw new Error('Facture d\'achat non trouvée');
    }

    // Déterminer le compte de trésorerie
    let compteTresorerie;
    let journalType: 'BANQUE' | 'CAISSE';

    if (paymentMethod === 'CASH') {
      compteTresorerie = await prisma.accountingAccount.findFirst({
        where: { code: '530000' }, // Caisse
      });
      journalType = 'CAISSE';
    } else {
      compteTresorerie = await prisma.accountingAccount.findFirst({
        where: { code: '512000' }, // Banque
      });
      journalType = 'BANQUE';
    }

    const compteFournisseur = await prisma.accountingAccount.findFirst({
      where: { code: '401000' }, // Fournisseurs
    });

    if (!compteTresorerie || !compteFournisseur) {
      throw new Error('Comptes comptables manquants');
    }

    // Générer le numéro d'écriture
    const entryNumber = await generateAccountingEntryNumber();

    // Créer l'écriture de paiement
    const entry = await prisma.accountingEntry.create({
      data: {
        number: entryNumber,
        date: paymentDate,
        reference: `PAIE-${purchaseInvoice.number}`,
        label: `Paiement facture ${purchaseInvoice.number} - ${purchaseInvoice.supplier.companyName}`,
        journal: journalType,
        status: 'DRAFT',
        lines: {
          create: [
            // Débit - Fournisseur (Diminution dette)
            {
              accountId: compteFournisseur.id,
              label: `Paiement ${purchaseInvoice.number}`,
              debit: amount,
              credit: 0,
            },
            // Crédit - Banque/Caisse (Décaissement)
            {
              accountId: compteTresorerie.id,
              label: `Paiement ${purchaseInvoice.number}`,
              debit: 0,
              credit: amount,
            },
          ],
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return entry;
  } catch (error) {
    console.error('Erreur génération écriture paiement effectué:', error);
    throw error;
  }
};

/**
 * Génère une écriture pour une commande livrée (mouvement de stock)
 */
export const generateStockMovementEntry = async (orderId: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || order.status !== 'DELIVERED') {
      return null; // Ne générer que pour les commandes livrées
    }

    // Calculer le coût des marchandises vendues (COGS)
    let totalCost = 0;
    for (const item of order.items) {
      const costPrice = item.product.costPrice || 0;
      totalCost += costPrice * item.quantity;
    }

    if (totalCost === 0) {
      return null; // Pas d'écriture si pas de coût
    }

    const compteStock = await prisma.accountingAccount.findFirst({
      where: { code: '370000' }, // Stocks de marchandises
    });

    const compteCMV = await prisma.accountingAccount.findFirst({
      where: { code: '607000' }, // Coût d'achat des marchandises vendues
    });

    if (!compteStock || !compteCMV) {
      throw new Error('Comptes de stock manquants');
    }

    // Générer le numéro d'écriture
    const entryNumber = await generateAccountingEntryNumber();

    // Créer l'écriture de sortie de stock
    const entry = await prisma.accountingEntry.create({
      data: {
        number: entryNumber,
        date: new Date(),
        reference: `CMD-${order.number}`,
        label: `Sortie stock - Commande ${order.number}`,
        journal: 'OD', // Opérations diverses
        status: 'DRAFT',
        lines: {
          create: [
            // Débit - Coût des marchandises vendues
            {
              accountId: compteCMV.id,
              label: `CMV commande ${order.number}`,
              debit: totalCost,
              credit: 0,
            },
            // Crédit - Stock
            {
              accountId: compteStock.id,
              label: `Sortie stock ${order.number}`,
              debit: 0,
              credit: totalCost,
            },
          ],
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return entry;
  } catch (error) {
    console.error('Erreur génération écriture mouvement stock:', error);
    throw error;
  }
};

export default {
  generateSaleInvoiceEntry,
  generatePurchaseInvoiceEntry,
  generatePaymentReceivedEntry,
  generatePaymentMadeEntry,
  generateStockMovementEntry,
};
