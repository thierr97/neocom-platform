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
  const count = await prisma.quote.count();
  return generateDocumentNumber('DEV', count + 1);
};

export const generateOrderNumber = async (): Promise<string> => {
  const count = await prisma.order.count();
  return generateDocumentNumber('CMD', count + 1);
};

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.invoice.count();
  return generateDocumentNumber('FACT', count + 1);
};

export const generateAccountingEntryNumber = async (): Promise<string> => {
  const count = await prisma.accountingEntry.count();
  return generateDocumentNumber('ECR', count + 1);
};
