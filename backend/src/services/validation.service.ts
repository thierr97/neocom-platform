import { PrismaClient } from '@prisma/client';
import { generateQuoteNumber, generateInvoiceNumber } from '../utils/generateNumber';

const prisma = new PrismaClient();

interface ValidateResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

/**
 * Valide un devis (DRAFT → FINAL)
 * - Attribue numéro séquentiel unique
 * - Marque comme validé (isValidated = true)
 * - Incrémente version (optimistic lock)
 * - Traçabilité (validatedBy, validatedAt)
 */
export async function validateQuote(
  quoteId: string,
  userId: string,
  currentVersion: number
): Promise<ValidateResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock & vérifier version
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: { items: true },
      });

      if (!quote) {
        return { success: false, error: 'Devis non trouvé', code: 'NOT_FOUND' };
      }

      // Vérifier version (optimistic locking)
      if (quote.version !== currentVersion) {
        return {
          success: false,
          error: 'Le devis a été modifié par un autre utilisateur',
          code: 'VERSION_CONFLICT',
        };
      }

      // Vérifier si déjà validé
      if (quote.isValidated) {
        return {
          success: false,
          error: 'Le devis est déjà validé',
          code: 'ALREADY_VALIDATED',
        };
      }

      // Vérifier qu'il y a des items
      if (!quote.items || quote.items.length === 0) {
        return {
          success: false,
          error: 'Le devis doit contenir au moins un article',
          code: 'EMPTY_QUOTE',
        };
      }

      // 2. Générer numéro unique (atomique)
      const quoteNumber = await generateQuoteNumber();

      // 3. Marquer comme validé
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: {
          number: quoteNumber,
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
          version: { increment: 1 },
          status: quote.status === 'DRAFT' ? 'SENT' : quote.status,
        },
        include: {
          customer: true,
          items: { include: { product: true } },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return { success: true, data: updatedQuote };
    });
  } catch (error: any) {
    console.error('Error validating quote:', error);
    return {
      success: false,
      error: 'Erreur lors de la validation du devis',
      code: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Valide une facture (DRAFT → FINAL)
 * Même logique que validateQuote
 */
export async function validateInvoice(
  invoiceId: string,
  userId: string,
  currentVersion: number
): Promise<ValidateResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true },
      });

      if (!invoice) {
        return { success: false, error: 'Facture non trouvée', code: 'NOT_FOUND' };
      }

      if (invoice.version !== currentVersion) {
        return {
          success: false,
          error: 'La facture a été modifiée par un autre utilisateur',
          code: 'VERSION_CONFLICT',
        };
      }

      if (invoice.isValidated) {
        return {
          success: false,
          error: 'La facture est déjà validée',
          code: 'ALREADY_VALIDATED',
        };
      }

      if (!invoice.items || invoice.items.length === 0) {
        return {
          success: false,
          error: 'La facture doit contenir au moins un article',
          code: 'EMPTY_INVOICE',
        };
      }

      const invoiceNumber = await generateInvoiceNumber();

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          number: invoiceNumber,
          isValidated: true,
          validatedBy: userId,
          validatedAt: new Date(),
          version: { increment: 1 },
          status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
        },
        include: {
          customer: true,
          items: { include: { product: true } },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return { success: true, data: updatedInvoice };
    });
  } catch (error: any) {
    console.error('Error validating invoice:', error);
    return {
      success: false,
      error: 'Erreur lors de la validation de la facture',
      code: 'INTERNAL_ERROR',
    };
  }
}
