import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Génère un numéro unique pour les documents (devis, factures, commandes)
 */
export const generateDocumentNumber = (prefix: string, id: number): string => {
  const year = new Date().getFullYear();
  const paddedId = String(id).padStart(6, '0');
  return `${prefix}${year}${paddedId}`;
};

export const generateQuoteNumber = async (): Promise<string> => {
  // Chercher le dernier numéro de devis de l'année en cours
  const year = new Date().getFullYear();
  const prefix = `DEV${year}`;

  const lastQuote = await prisma.quote.findFirst({
    where: {
      number: {
        startsWith: prefix
      }
    },
    orderBy: {
      number: 'desc'
    }
  });

  if (lastQuote) {
    // Extraire le numéro séquentiel et incrémenter
    const lastNumber = parseInt(lastQuote.number.replace(prefix, ''));
    return generateDocumentNumber('DEV', lastNumber + 1);
  }

  // Premier devis de l'année
  return generateDocumentNumber('DEV', 1);
};

export const generateOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `CMD${year}`;

  const lastOrder = await prisma.order.findFirst({
    where: {
      number: {
        startsWith: prefix
      }
    },
    orderBy: {
      number: 'desc'
    }
  });

  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.number.replace(prefix, ''));
    return generateDocumentNumber('CMD', lastNumber + 1);
  }

  return generateDocumentNumber('CMD', 1);
};

export const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `FACT${year}`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      number: {
        startsWith: prefix
      }
    },
    orderBy: {
      number: 'desc'
    }
  });

  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.number.replace(prefix, ''));
    return generateDocumentNumber('FACT', lastNumber + 1);
  }

  return generateDocumentNumber('FACT', 1);
};

export const generateAccountingEntryNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `ECR${year}`;

  const lastEntry = await prisma.accountingEntry.findFirst({
    where: {
      number: {
        startsWith: prefix
      }
    },
    orderBy: {
      number: 'desc'
    }
  });

  if (lastEntry) {
    const lastNumber = parseInt(lastEntry.number.replace(prefix, ''));
    return generateDocumentNumber('ECR', lastNumber + 1);
  }

  return generateDocumentNumber('ECR', 1);
};
