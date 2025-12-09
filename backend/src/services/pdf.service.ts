import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';

interface Company {
  name: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  siret?: string;
  vatNumber?: string;
}

interface Customer {
  type: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email: string;
  phone?: string;
  siret?: string;
  vatNumber?: string;
}

interface QuoteItem {
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

interface Quote {
  number: string;
  createdAt: Date;
  validUntil?: Date;
  customer: Customer;
  items: QuoteItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  termsConditions?: string;
}

interface OrderItem {
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

interface Order {
  number: string;
  createdAt: Date;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  total: number;
  notes?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
}

interface InvoiceItem {
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

interface Invoice {
  number: string;
  issueDate: Date;
  dueDate?: Date;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  notes?: string;
  termsConditions?: string;
}

// Configuration de l'entreprise (à personnaliser)
const COMPANY_INFO: Company = {
  name: 'NEOSERV',
  address: 'Route de Montauban',
  city: 'Abymes',
  zipCode: '97139',
  country: 'Guadeloupe',
  phone: '0690 973710',
  email: 'contact@neoserv.fr',
  siret: '901381062000015',
  vatNumber: 'FR60901381060',
};

// Informations bancaires (RIB)
const BANK_INFO = {
  bankCode: process.env.BANK_CODE || '10107',
  branchCode: process.env.BRANCH_CODE || '00476',
  accountNumber: process.env.ACCOUNT_NUMBER || '00134086952',
  accountKey: process.env.ACCOUNT_KEY || '94',
  bic: process.env.BIC_CODE || 'FRBR1019700476001340869294',
  iban: process.env.IBAN_CODE || 'FR26 1010 7004 7600 1340 8695 294',
  accountHolder: process.env.ACCOUNT_HOLDER || 'LES 4 AS',
};

export class PDFService {
  private static formatCurrency(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }

  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private static formatDateLong(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Nouveau header selon spécifications :
   * - Logo NEOSERV en haut à gauche
   * - Info document en haut à droite (numéro, dates, code client)
   */
  private static addNewHeader(
    doc: PDFKit.PDFDocument,
    documentType: 'DEVIS' | 'FACTURE',
    documentNumber: string,
    issueDate: Date,
    dueDate?: Date,
    validUntil?: Date,
    customerCode?: string
  ) {
    // GAUCHE - Logo NEOSERV
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('NEOSERV', 50, 50);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text('GUADELOUPE', 50, 80);

    // DROITE - Informations du document
    const rightX = 400;
    let rightY = 50;

    // Type de document + Numéro
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(`${documentType} ${documentNumber}`, rightX, rightY, { align: 'left' });

    rightY += 20;

    // Date de facturation/émission
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Date facturation : ${this.formatDateLong(issueDate)}`, rightX, rightY, { align: 'left' });

    rightY += 15;

    // Date d'échéance (factures uniquement)
    if (dueDate) {
      doc.text(`Date échéance : ${this.formatDateLong(dueDate)}`, rightX, rightY, { align: 'left' });
      rightY += 15;
    }

    // Valable jusqu'au (devis uniquement)
    if (validUntil) {
      doc.text(`Valable jusqu'au : ${this.formatDateLong(validUntil)}`, rightX, rightY, { align: 'left' });
      rightY += 15;
    }

    // Code client (si disponible)
    if (customerCode) {
      doc.text(`Code client : ${customerCode}`, rightX, rightY, { align: 'left' });
    }

    return doc;
  }

  /**
   * Boîtes Émetteur (gauche, fond gris) et Client (droite, encadré)
   */
  private static addEmitterAndClientBoxes(
    doc: PDFKit.PDFDocument,
    customer: Customer,
    yPosition: number
  ): number {
    const boxTop = yPosition;
    const leftBoxX = 50;
    const rightBoxX = 320;
    const boxWidth = 230;
    const boxHeight = 100;

    // GAUCHE - Émetteur (fond gris #F0F0F0)
    doc
      .rect(leftBoxX, boxTop, boxWidth, boxHeight)
      .fill('#F0F0F0');

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Émetteur', leftBoxX + 5, boxTop + 5);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text(`SAS ${COMPANY_INFO.name}`, leftBoxX + 5, boxTop + 22)
      .text(COMPANY_INFO.address, leftBoxX + 5, boxTop + 35)
      .text(`${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}`, leftBoxX + 5, boxTop + 48)
      .text(COMPANY_INFO.country, leftBoxX + 5, boxTop + 61)
      .text(`Tél.: ${COMPANY_INFO.phone}`, leftBoxX + 5, boxTop + 78);

    // DROITE - Client (encadré avec bordure noire)
    doc
      .rect(rightBoxX, boxTop, boxWidth, boxHeight)
      .fillAndStroke('#FFFFFF', '#000000');

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Adressé à', rightBoxX + 5, boxTop + 5);

    let clientY = boxTop + 22;
    doc.fontSize(9).font('Helvetica').fillColor('#000000');

    if (customer.type === 'COMPANY') {
      doc.text(customer.companyName || '', rightBoxX + 5, clientY, { width: boxWidth - 10 });
    } else {
      doc.text(`${customer.firstName || ''} ${customer.lastName || ''}`, rightBoxX + 5, clientY, { width: boxWidth - 10 });
    }
    clientY += 13;

    if (customer.address) {
      doc.text(customer.address, rightBoxX + 5, clientY, { width: boxWidth - 10 });
      clientY += 13;
    }

    if (customer.addressLine2) {
      doc.text(customer.addressLine2, rightBoxX + 5, clientY, { width: boxWidth - 10 });
      clientY += 13;
    }

    if (customer.postalCode && customer.city) {
      doc.text(`${customer.postalCode} ${customer.city}`, rightBoxX + 5, clientY, { width: boxWidth - 10 });
    }

    return boxTop + boxHeight + 30;
  }

  /**
   * Titre de section (ex: "LOCATION DU 05/12/2025" ou "DEVIS VALABLE JUSQU'AU...")
   */
  private static addSectionTitle(doc: PDFKit.PDFDocument, title: string, yPosition: number): number {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(title, 50, yPosition);

    return yPosition + 25;
  }

  /**
   * Nouveau tableau des articles selon spécifications
   * Colonnes : Désignation | TVA | P.U. HT | Qté | Unité | Montants exprimés en Euros | Total HT
   */
  private static addNewItemsTable(
    doc: PDFKit.PDFDocument,
    items: QuoteItem[] | OrderItem[] | InvoiceItem[],
    yPosition: number
  ): number {
    const tableTop = yPosition;
    const tableHeaders = ['Désignation', 'TVA', 'P.U. HT', 'Qté', 'Unité', 'Total HT'];
    const colWidths = [240, 40, 60, 30, 30, 70];
    const startX = 50;

    // En-têtes de tableau
    let xPos = startX;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000');

    // Ligne d'en-tête
    doc
      .moveTo(startX, tableTop)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), tableTop)
      .stroke('#000000');

    tableHeaders.forEach((header, i) => {
      const align = (i === 1 || i === 3) ? 'center' : (i >= 2 ? 'right' : 'left');
      doc.text(header, xPos + 3, tableTop + 5, {
        width: colWidths[i] - 6,
        align: align as any,
      });
      xPos += colWidths[i];
    });

    // Texte "Montants exprimés en Euros" dans l'en-tête à droite
    doc
      .fontSize(7)
      .font('Helvetica')
      .text('Montants exprimés en Euros', startX + 300, tableTop + 5);

    // Ligne en dessous de l'en-tête
    yPosition = tableTop + 20;
    doc
      .moveTo(startX, yPosition)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPosition)
      .stroke('#000000');

    // Lignes du tableau
    yPosition += 5;

    items.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternance de couleurs (blanc / gris très clair)
      const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc
        .rect(startX, yPosition - 3, colWidths.reduce((a, b) => a + b, 0), 20)
        .fill(rowColor);

      doc.fontSize(9).font('Helvetica').fillColor('#000000');

      xPos = startX;

      // Désignation
      doc.text(item.product.name, xPos + 3, yPosition, {
        width: colWidths[0] - 6,
        align: 'left',
      });
      xPos += colWidths[0];

      // TVA (centré)
      doc.text(`${item.taxRate}%`, xPos + 3, yPosition, {
        width: colWidths[1] - 6,
        align: 'center',
      });
      xPos += colWidths[1];

      // P.U. HT (droite)
      doc.text(this.formatCurrency(item.unitPrice), xPos + 3, yPosition, {
        width: colWidths[2] - 6,
        align: 'right',
      });
      xPos += colWidths[2];

      // Qté (centré)
      doc.text(item.quantity.toString(), xPos + 3, yPosition, {
        width: colWidths[3] - 6,
        align: 'center',
      });
      xPos += colWidths[3];

      // Unité (centré)
      doc.text('u.', xPos + 3, yPosition, {
        width: colWidths[4] - 6,
        align: 'center',
      });
      xPos += colWidths[4];

      // Total HT (droite)
      doc.text(this.formatCurrency(item.total), xPos + 3, yPosition, {
        width: colWidths[5] - 6,
        align: 'right',
      });

      yPosition += 20;

      // Ligne horizontale entre les produits
      doc
        .moveTo(startX, yPosition - 3)
        .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPosition - 3)
        .stroke('#CCCCCC');
    });

    return yPosition + 10;
  }

  /**
   * Section des totaux (partie droite du document)
   */
  private static addNewTotals(
    doc: PDFKit.PDFDocument,
    subtotal: number,
    taxAmount: number,
    discount: number,
    total: number,
    yPosition: number,
    paidAmount?: number
  ): number {
    const labelX = 400;
    const valueX = 500;
    const labelWidth = 95;
    const valueWidth = 75;

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    // Total HT
    doc
      .text('Total HT', labelX, yPosition, { width: labelWidth, align: 'right' })
      .text(this.formatCurrency(subtotal), valueX, yPosition, { width: valueWidth, align: 'right' });

    yPosition += 15;

    // Total TVA 8,5%
    doc
      .text('Total TVA 8,5%', labelX, yPosition, { width: labelWidth, align: 'right' })
      .text(this.formatCurrency(taxAmount), valueX, yPosition, { width: valueWidth, align: 'right' });

    yPosition += 15;

    // Total TTC
    doc
      .font('Helvetica-Bold')
      .text('Total TTC', labelX, yPosition, { width: labelWidth, align: 'right' })
      .text(this.formatCurrency(total), valueX, yPosition, { width: valueWidth, align: 'right' });

    yPosition += 20;

    // Ligne de séparation
    doc
      .moveTo(labelX, yPosition)
      .lineTo(valueX + valueWidth, yPosition)
      .stroke('#CCCCCC');

    yPosition += 10;

    // Payé et Reste à payer (si applicable - factures)
    if (paidAmount !== undefined && paidAmount > 0) {
      doc
        .font('Helvetica')
        .text('Payé', labelX, yPosition, { width: labelWidth, align: 'right' })
        .text(this.formatCurrency(paidAmount), valueX, yPosition, { width: valueWidth, align: 'right' });

      yPosition += 15;

      const remaining = total - paidAmount;
      doc
        .font('Helvetica-Bold')
        .text('Reste à payer', labelX, yPosition, { width: labelWidth, align: 'right' })
        .text(this.formatCurrency(remaining), valueX, yPosition, { width: valueWidth, align: 'right' });

      yPosition += 15;
    }

    return yPosition + 20;
  }

  /**
   * Conditions de règlement
   */
  private static addPaymentConditions(doc: PDFKit.PDFDocument, yPosition: number): number {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Conditions de règlement: À réception', 50, yPosition);

    return yPosition + 20;
  }

  /**
   * RIB (Relevé d'Identité Bancaire) en bas du document
   */
  private static addBankDetails(doc: PDFKit.PDFDocument, yPosition: number): number {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Règlement par virement sur le compte bancaire suivant:', 50, yPosition);

    yPosition += 15;

    // Tableau RIB
    const startX = 50;
    const colWidths = [90, 90, 120, 50];
    let xPos = startX;

    doc.fontSize(8).font('Helvetica-Bold');

    // En-têtes
    doc.text('Code banque', xPos, yPosition, { width: colWidths[0], align: 'center' });
    xPos += colWidths[0];
    doc.text('Code guichet', xPos, yPosition, { width: colWidths[1], align: 'center' });
    xPos += colWidths[1];
    doc.text('Numéro de compte', xPos, yPosition, { width: colWidths[2], align: 'center' });
    xPos += colWidths[2];
    doc.text('Clé', xPos, yPosition, { width: colWidths[3], align: 'center' });

    yPosition += 12;

    // Valeurs
    xPos = startX;
    doc.font('Helvetica');
    doc.text(BANK_INFO.bankCode, xPos, yPosition, { width: colWidths[0], align: 'center' });
    xPos += colWidths[0];
    doc.text(BANK_INFO.branchCode, xPos, yPosition, { width: colWidths[1], align: 'center' });
    xPos += colWidths[1];
    doc.text(BANK_INFO.accountNumber, xPos, yPosition, { width: colWidths[2], align: 'center' });
    xPos += colWidths[2];
    doc.text(BANK_INFO.accountKey, xPos, yPosition, { width: colWidths[3], align: 'center' });

    yPosition += 20;

    // BIC-IBAN encadré
    doc
      .rect(50, yPosition, 300, 30)
      .stroke('#000000');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`Code BIC: ${BANK_INFO.bic}`, 55, yPosition + 5)
      .text(`Code IBAN: ${BANK_INFO.iban}`, 55, yPosition + 18);

    yPosition += 40;

    // Mentions légales
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Nom du propriétaire du compte: ${BANK_INFO.accountHolder}`, 50, yPosition)
      .text(`N° d'identification au registre du commerce: SIRET ${COMPANY_INFO.siret}`, 50, yPosition + 10)
      .text(`NAF-APE: 93.293 - Numéro TVA: ${COMPANY_INFO.vatNumber}`, 50, yPosition + 20)
      .text(`Société par actions simplifiée (SAS) - Capital de 10 000 €`, 50, yPosition + 30);

    return yPosition + 50;
  }

  static generateQuotePDF(quote: Quote, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devis-${quote.number}.pdf`);

    doc.pipe(res);

    // En-tête avec informations du devis
    this.addNewHeader(
      doc,
      'DEVIS',
      quote.number,
      quote.createdAt,
      undefined,
      quote.validUntil,
      undefined // Code client si disponible
    );

    // Émetteur et Client (boîtes côte à côte)
    let yPosition = this.addEmitterAndClientBoxes(doc, quote.customer, 140);

    // Titre de section
    const validUntilStr = quote.validUntil ? this.formatDateLong(quote.validUntil) : '';
    yPosition = this.addSectionTitle(doc, `DEVIS VALABLE JUSQU'AU ${validUntilStr}`, yPosition);

    // Tableau des articles
    yPosition = this.addNewItemsTable(doc, quote.items, yPosition);

    // Totaux (partie droite)
    yPosition = this.addNewTotals(
      doc,
      quote.subtotal,
      quote.taxAmount,
      quote.discount,
      quote.total,
      yPosition
    );

    // Conditions de règlement
    yPosition = this.addPaymentConditions(doc, yPosition);

    // RIB en bas
    this.addBankDetails(doc, yPosition);

    doc.end();
  }

  static generateInvoicePDF(invoice: Invoice, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.number}.pdf`);

    doc.pipe(res);

    // En-tête avec informations de la facture
    this.addNewHeader(
      doc,
      'FACTURE',
      invoice.number,
      invoice.issueDate,
      invoice.dueDate,
      undefined,
      undefined // Code client si disponible
    );

    // Émetteur et Client (boîtes côte à côte)
    let yPosition = this.addEmitterAndClientBoxes(doc, invoice.customer, 140);

    // Titre de section
    yPosition = this.addSectionTitle(doc, `LOCATION DU ${this.formatDateLong(invoice.issueDate)}`, yPosition);

    // Tableau des articles
    yPosition = this.addNewItemsTable(doc, invoice.items, yPosition);

    // Totaux (partie droite) avec montant payé
    yPosition = this.addNewTotals(
      doc,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.discount,
      invoice.total,
      yPosition,
      invoice.paidAmount
    );

    // Conditions de règlement
    yPosition = this.addPaymentConditions(doc, yPosition);

    // RIB en bas
    this.addBankDetails(doc, yPosition);

    doc.end();
  }

  static generateDeliveryNotePDF(order: Order, res: Response) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bon-de-livraison-${order.number}.pdf`
    );

    doc.pipe(res);

    // En-tête simple
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('BON DE LIVRAISON', 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Numéro: ${order.number}`, 350, 50, { align: 'right' })
      .text(`Date: ${this.formatDate(order.createdAt)}`, 350, 65, { align: 'right' });

    // Adresse de livraison
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Adresse de livraison', 50, 120);

    let yPosition = 140;
    doc.fontSize(10).font('Helvetica');

    if (order.customer.type === 'COMPANY') {
      doc.text(order.customer.companyName || '', 50, yPosition);
    } else {
      doc.text(`${order.customer.firstName} ${order.customer.lastName}`, 50, yPosition);
    }
    yPosition += 15;

    const shippingAddress = order.shippingAddress || order.customer.address;
    const shippingCity = order.shippingCity || order.customer.city;
    const shippingPostalCode = order.shippingPostalCode || order.customer.postalCode;
    const shippingCountry = order.shippingCountry || order.customer.country;

    if (shippingAddress) {
      doc.text(shippingAddress, 50, yPosition);
      yPosition += 15;
    }
    if (shippingPostalCode && shippingCity) {
      doc.text(`${shippingPostalCode} ${shippingCity}`, 50, yPosition);
      yPosition += 15;
    }
    if (shippingCountry) {
      doc.text(shippingCountry, 50, yPosition);
      yPosition += 15;
    }

    yPosition += 10;
    doc.text(`Email: ${order.customer.email}`, 50, yPosition);
    if (order.customer.phone) {
      yPosition += 15;
      doc.text(`Tél: ${order.customer.phone}`, 50, yPosition);
    }

    yPosition += 40;

    // Tableau des articles (simplifié)
    const tableTop = yPosition;
    const tableHeaders = ['Désignation', 'SKU', 'Quantité'];
    const colWidths = [350, 120, 100];
    let xPos = 50;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000');

    doc
      .moveTo(50, tableTop)
      .lineTo(50 + 570, tableTop)
      .stroke('#000000');

    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos + 3, tableTop + 7, {
        width: colWidths[i] - 6,
        align: i > 1 ? 'right' : 'left',
      });
      xPos += colWidths[i];
    });

    yPosition = tableTop + 20;
    doc
      .moveTo(50, yPosition)
      .lineTo(50 + 570, yPosition)
      .stroke('#000000');

    yPosition += 5;

    order.items.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(50, yPosition - 3, 570, 20).fill(rowColor);

      doc.fontSize(9).font('Helvetica').fillColor('#000000');

      xPos = 50;
      doc.text(item.product.name, xPos + 3, yPosition, {
        width: colWidths[0] - 6,
        align: 'left',
      });
      xPos += colWidths[0];

      doc.text(item.product.sku, xPos + 3, yPosition, {
        width: colWidths[1] - 6,
        align: 'left',
      });
      xPos += colWidths[1];

      doc.text(item.quantity.toString(), xPos + 3, yPosition, {
        width: colWidths[2] - 6,
        align: 'right',
      });

      yPosition += 20;

      doc
        .moveTo(50, yPosition - 3)
        .lineTo(50 + 570, yPosition - 3)
        .stroke('#CCCCCC');
    });

    yPosition += 40;

    // Signature
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Signature du client:', 50, yPosition);

    yPosition += 50;
    doc
      .moveTo(50, yPosition)
      .lineTo(250, yPosition)
      .stroke('#000000');

    doc.end();
  }
}
