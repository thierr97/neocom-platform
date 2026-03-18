import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { CompanySettings, BankInfo } from '../utils/getCompanySettings';

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
    barcode?: string;
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
    barcode?: string;
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
    barcode?: string;
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

// Les informations de l'entreprise et bancaires sont maintenant passées dynamiquement
// depuis la base de données via getCompanySettings() et getBankInfo()

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
    companySettings: CompanySettings,
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
      .text(companySettings.name, 50, 50);

    // Tagline/Subtitle (optionnel)
    const companyTagline = process.env.COMPANY_TAGLINE || companySettings.country.toUpperCase();
    if (companyTagline) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(companyTagline, 50, 80);
    }

    // DROITE - Informations du document
    const rightX = 320;
    const rightWidth = 225;
    let rightY = 50;

    // Type de document + Numéro (aligné à droite)
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(`${documentType} ${documentNumber}`, rightX, rightY, {
        width: rightWidth,
        align: 'right'
      });

    rightY += 20;

    // Date de facturation/émission
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Date facturation : ${this.formatDateLong(issueDate)}`, rightX, rightY, {
        width: rightWidth,
        align: 'right'
      });

    rightY += 15;

    // Date d'échéance (factures uniquement)
    if (dueDate) {
      doc.text(`Date échéance : ${this.formatDateLong(dueDate)}`, rightX, rightY, {
        width: rightWidth,
        align: 'right'
      });
      rightY += 15;
    }

    // Valable jusqu'au (devis uniquement)
    if (validUntil) {
      doc.text(`Valable jusqu'au : ${this.formatDateLong(validUntil)}`, rightX, rightY, {
        width: rightWidth,
        align: 'right'
      });
      rightY += 15;
    }

    // Code client (si disponible)
    if (customerCode) {
      doc.text(`Code client : ${customerCode}`, rightX, rightY, {
        width: rightWidth,
        align: 'right'
      });
    }

    return doc;
  }

  /**
   * Boîtes Émetteur (gauche, fond gris) et Client (droite, encadré)
   */
  private static addEmitterAndClientBoxes(
    doc: PDFKit.PDFDocument,
    companySettings: CompanySettings,
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

    const companyType = process.env.COMPANY_TYPE || '';
    const companyFullName = companyType ? `${companyType} ${companySettings.name}` : companySettings.name;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text(companyFullName, leftBoxX + 5, boxTop + 22)
      .text(companySettings.address, leftBoxX + 5, boxTop + 35)
      .text(`${companySettings.postalCode} ${companySettings.city}`, leftBoxX + 5, boxTop + 48)
      .text(companySettings.country, leftBoxX + 5, boxTop + 61)
      .text(`Tél.: ${companySettings.phone}`, leftBoxX + 5, boxTop + 78);

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
   * Colonnes : Désignation (+ SKU + code-barres) | TVA | P.U. HT | Remise | Qté | Unité | Total HT
   */
  private static addNewItemsTable(
    doc: PDFKit.PDFDocument,
    items: QuoteItem[] | OrderItem[] | InvoiceItem[],
    yPosition: number
  ): number {
    const tableTop = yPosition;
    const tableHeaders = ['Désignation', 'TVA', 'P.U. HT', 'Remise', 'Qté', 'U.', 'Total HT'];
    const colWidths = [195, 35, 58, 38, 28, 28, 88];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0); // 470
    const startX = 50;
    const desigColW = colWidths[0] - 6;

    // En-têtes de tableau
    let xPos = startX;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000');

    // Ligne d'en-tête
    doc
      .moveTo(startX, tableTop)
      .lineTo(startX + tableWidth, tableTop)
      .stroke('#000000');

    tableHeaders.forEach((header, i) => {
      const align = i === 0 ? 'left' : (i === 4 || i === 5 ? 'center' : 'right');
      doc.text(header, xPos + 3, tableTop + 5, {
        width: colWidths[i] - 6,
        align: align as any,
        lineBreak: false,
      });
      xPos += colWidths[i];
    });

    // Ligne en dessous de l'en-tête
    yPosition = tableTop + 20;
    doc
      .moveTo(startX, yPosition)
      .lineTo(startX + tableWidth, yPosition)
      .stroke('#000000');

    // Lignes du tableau
    yPosition += 5;

    items.forEach((item, index) => {
      const hasSku = !!item.product.sku;
      const hasBarcode = !!(item.product as any).barcode;

      // Mesure la hauteur réelle du nom (peut wrapper sur plusieurs lignes)
      doc.fontSize(9).font('Helvetica');
      const nameHeight = doc.heightOfString(item.product.name, { width: desigColW });
      const skuHeight = hasSku ? 10 : 0;
      const barcodeHeight = hasBarcode ? 9 : 0;
      const rowHeight = Math.max(22, nameHeight + skuHeight + barcodeHeight + 6);

      if (yPosition + rowHeight > 720) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternance de couleurs
      const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc
        .rect(startX, yPosition - 2, tableWidth, rowHeight + 2)
        .fill(rowColor);

      doc.fontSize(9).font('Helvetica').fillColor('#000000');

      xPos = startX;
      const colCenterY = yPosition + (rowHeight - 11) / 2;

      // Désignation : nom (peut wrapper) + Réf + EAN
      doc.font('Helvetica').fontSize(9).fillColor('#000000')
        .text(item.product.name, xPos + 3, yPosition + 2, {
          width: desigColW,
          align: 'left',
        });
      let subY = yPosition + 2 + nameHeight;
      if (hasSku) {
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
          .text(`Réf: ${item.product.sku}`, xPos + 3, subY, {
            width: desigColW,
            align: 'left',
            lineBreak: false,
          });
        subY += 10;
      }
      if (hasBarcode) {
        doc.font('Helvetica').fontSize(7).fillColor('#777777')
          .text(`EAN: ${(item.product as any).barcode}`, xPos + 3, subY, {
            width: desigColW,
            align: 'left',
            lineBreak: false,
          });
      }
      xPos += colWidths[0];

      doc.font('Helvetica').fontSize(9).fillColor('#000000');

      // TVA
      doc.text(`${item.taxRate}%`, xPos + 3, colCenterY, {
        width: colWidths[1] - 6,
        align: 'center',
      });
      xPos += colWidths[1];

      // P.U. HT
      doc.text(this.formatCurrency(item.unitPrice), xPos + 3, colCenterY, {
        width: colWidths[2] - 6,
        align: 'right',
      });
      xPos += colWidths[2];

      // Remise %
      const discountPct = item.unitPrice > 0 && item.quantity > 0
        ? Math.round((item.discount / (item.unitPrice * item.quantity)) * 100)
        : 0;
      if (discountPct > 0) {
        doc.font('Helvetica-Bold').fillColor('#E53E3E')
          .text(`-${discountPct}%`, xPos + 3, colCenterY, {
            width: colWidths[3] - 6,
            align: 'center',
          });
        doc.font('Helvetica').fillColor('#000000');
      } else {
        doc.text('-', xPos + 3, colCenterY, {
          width: colWidths[3] - 6,
          align: 'center',
        });
      }
      xPos += colWidths[3];

      // Qté
      doc.text(item.quantity.toString(), xPos + 3, colCenterY, {
        width: colWidths[4] - 6,
        align: 'center',
      });
      xPos += colWidths[4];

      // Unité
      doc.text('u.', xPos + 3, colCenterY, {
        width: colWidths[5] - 6,
        align: 'center',
      });
      xPos += colWidths[5];

      // Total HT
      doc.text(this.formatCurrency(item.total), xPos + 3, colCenterY, {
        width: colWidths[6] - 6,
        align: 'right',
      });

      yPosition += rowHeight + 4;

      // Ligne horizontale de séparation
      doc
        .moveTo(startX, yPosition - 2)
        .lineTo(startX + tableWidth, yPosition - 2)
        .strokeColor('#CCCCCC')
        .stroke();
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

    yPosition += 13;

    // Total TVA 8,5%
    doc
      .text('Total TVA 8,5%', labelX, yPosition, { width: labelWidth, align: 'right' })
      .text(this.formatCurrency(taxAmount), valueX, yPosition, { width: valueWidth, align: 'right' });

    yPosition += 13;

    // Total TTC
    doc
      .font('Helvetica-Bold')
      .text('Total TTC', labelX, yPosition, { width: labelWidth, align: 'right' })
      .text(this.formatCurrency(total), valueX, yPosition, { width: valueWidth, align: 'right' });

    yPosition += 16;

    // Ligne de séparation
    doc
      .moveTo(labelX, yPosition)
      .lineTo(valueX + valueWidth, yPosition)
      .stroke('#CCCCCC');

    yPosition += 8;

    // Payé et Reste à payer (si applicable - factures)
    if (paidAmount !== undefined && paidAmount > 0) {
      doc
        .font('Helvetica')
        .text('Payé', labelX, yPosition, { width: labelWidth, align: 'right' })
        .text(this.formatCurrency(paidAmount), valueX, yPosition, { width: valueWidth, align: 'right' });

      yPosition += 13;

      const remaining = total - paidAmount;
      doc
        .font('Helvetica-Bold')
        .text('Reste à payer', labelX, yPosition, { width: labelWidth, align: 'right' })
        .text(this.formatCurrency(remaining), valueX, yPosition, { width: valueWidth, align: 'right' });

      yPosition += 13;
    }

    return yPosition + 12;
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

    return yPosition + 12;
  }

  /**
   * RIB (Relevé d'Identité Bancaire) en bas du document
   */
  private static addBankDetails(doc: PDFKit.PDFDocument, companySettings: CompanySettings, bankInfo: BankInfo, yPosition: number): number {
    const PAGE_BOTTOM = 792; // A4 = 842, margin = 50
    const SECTION_HEIGHT = 130; // Hauteur totale estimée de la section

    // Si le contenu risque de déborder, ajouter une nouvelle page
    if (yPosition + SECTION_HEIGHT > PAGE_BOTTOM) {
      doc.addPage();
      yPosition = 50;
    }

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Règlement par virement sur le compte bancaire suivant:', 50, yPosition);

    yPosition += 15;

    // Encadré compact avec fond gris clair
    const boxHeight = 38;
    doc
      .fillColor('#F5F5F5')
      .rect(50, yPosition, 500, boxHeight)
      .fill();

    doc
      .strokeColor('#CCCCCC')
      .rect(50, yPosition, 500, boxHeight)
      .stroke();

    // IBAN
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('IBAN:', 60, yPosition + 7);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text(bankInfo.iban || 'Non renseigné', 100, yPosition + 7);

    // BIC / SWIFT
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('BIC:', 60, yPosition + 22);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text(bankInfo.bic || 'Non renseigné', 100, yPosition + 22);

    // Titulaire à droite du box
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Titulaire:', 350, yPosition + 7);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#333333')
      .text(bankInfo.accountHolder || companySettings.name, 390, yPosition + 7, { width: 155 });

    yPosition += boxHeight + 10;

    // Mentions légales sur une seule ligne
    const companyType = process.env.COMPANY_TYPE || '';
    const companyTypeLong = process.env.COMPANY_TYPE_LONG || '';
    const companyCapital = process.env.COMPANY_CAPITAL || '';
    const companyNaf = process.env.COMPANY_NAF || '';

    const legalParts: string[] = [];
    if (companySettings.siret) legalParts.push(`SIRET ${companySettings.siret}`);
    if (companySettings.vatNumber) legalParts.push(`TVA: ${companySettings.vatNumber}`);
    if (companyNaf) legalParts.push(`NAF: ${companyNaf}`);
    if (companyTypeLong && companyCapital) legalParts.push(`${companyTypeLong} (${companyType}) - Capital ${companyCapital}`);

    if (legalParts.length > 0) {
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#666666')
        .text(legalParts.join('  |  '), 50, yPosition, { width: 500, align: 'center' });
      yPosition += 12;
    }

    return yPosition;
  }

  static generateQuotePDF(quote: Quote, companySettings: CompanySettings, bankInfo: BankInfo, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devis-${quote.number}.pdf`);

    doc.pipe(res);

    // En-tête avec informations du devis
    this.addNewHeader(
      doc,
      companySettings,
      'DEVIS',
      quote.number,
      quote.createdAt,
      undefined,
      quote.validUntil,
      undefined // Code client si disponible
    );

    // Émetteur et Client (boîtes côte à côte)
    let yPosition = this.addEmitterAndClientBoxes(doc, companySettings, quote.customer, 140);

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
    this.addBankDetails(doc, companySettings, bankInfo, yPosition);

    doc.end();
  }

  static generateInvoicePDF(invoice: Invoice, companySettings: CompanySettings, bankInfo: BankInfo, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.number}.pdf`);

    doc.pipe(res);

    // En-tête avec informations de la facture
    this.addNewHeader(
      doc,
      companySettings,
      'FACTURE',
      invoice.number,
      invoice.issueDate,
      invoice.dueDate,
      undefined,
      undefined // Code client si disponible
    );

    // Émetteur et Client (boîtes côte à côte)
    let yPosition = this.addEmitterAndClientBoxes(doc, companySettings, invoice.customer, 140);

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
    this.addBankDetails(doc, companySettings, bankInfo, yPosition);

    doc.end();
  }

  static generateDeliveryNotePDF(order: Order, companySettings: CompanySettings, res: Response) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bon-de-livraison-${order.number}.pdf`
    );

    doc.pipe(res);

    // En-tête avec informations de l'entreprise
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(companySettings.name, 50, 50);

    let yPos = 68;
    doc.fontSize(9).font('Helvetica');

    if (companySettings.address) {
      doc.text(companySettings.address, 50, yPos);
      yPos += 12;
    }
    if (companySettings.postalCode && companySettings.city) {
      doc.text(`${companySettings.postalCode} ${companySettings.city}`, 50, yPos);
      yPos += 12;
    }
    if (companySettings.siret) {
      doc.text(`SIRET: ${companySettings.siret}`, 50, yPos);
      yPos += 12;
    }

    // Titre et numéro du document à droite
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('BON DE LIVRAISON', 300, 50, { align: 'right' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Numéro: ${order.number}`, 300, 75, { align: 'right' })
      .text(`Date: ${this.formatDate(order.createdAt)}`, 300, 90, { align: 'right' });

    // Adresse de livraison
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Adresse de livraison', 50, 140);

    let yPosition = 160;
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
