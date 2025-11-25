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
  name: 'NEOCOM',
  address: '123 Avenue des Champs-Élysées',
  city: 'Paris',
  zipCode: '75008',
  country: 'France',
  phone: '+33 1 23 45 67 89',
  email: 'contact@neocom.fr',
  siret: '123 456 789 00012',
  vatNumber: 'FR12345678900',
};

export class PDFService {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private static addHeader(doc: PDFKit.PDFDocument, title: string) {
    // Logo ou nom de l'entreprise
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(COMPANY_INFO.name, 50, 50);

    // Informations de l'entreprise
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(COMPANY_INFO.address, 50, 85)
      .text(`${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}, ${COMPANY_INFO.country}`, 50, 98)
      .text(`Tél: ${COMPANY_INFO.phone}`, 50, 111)
      .text(`Email: ${COMPANY_INFO.email}`, 50, 124)
      .text(`SIRET: ${COMPANY_INFO.siret}`, 50, 137)
      .text(`TVA: ${COMPANY_INFO.vatNumber}`, 50, 150);

    // Titre du document (aligné à droite)
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(title, 350, 50, {
        align: 'right',
      });

    return doc;
  }

  private static addCustomerInfo(doc: PDFKit.PDFDocument, customer: Customer, yPosition: number) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text('Client', 50, yPosition);

    yPosition += 20;

    doc.fontSize(10).font('Helvetica').fillColor('#374151');

    if (customer.type === 'COMPANY') {
      doc.text(customer.companyName || '', 50, yPosition);
      yPosition += 15;
      if (customer.siret) {
        doc.text(`SIRET: ${customer.siret}`, 50, yPosition);
        yPosition += 15;
      }
      if (customer.vatNumber) {
        doc.text(`TVA: ${customer.vatNumber}`, 50, yPosition);
        yPosition += 15;
      }
    } else {
      doc.text(`${customer.firstName} ${customer.lastName}`, 50, yPosition);
      yPosition += 15;
    }

    if (customer.address) {
      doc.text(customer.address, 50, yPosition);
      yPosition += 15;
    }
    if (customer.addressLine2) {
      doc.text(customer.addressLine2, 50, yPosition);
      yPosition += 15;
    }
    if (customer.postalCode && customer.city) {
      doc.text(`${customer.postalCode} ${customer.city}`, 50, yPosition);
      yPosition += 15;
    }
    if (customer.country) {
      doc.text(customer.country, 50, yPosition);
      yPosition += 15;
    }

    yPosition += 10;
    doc.text(`Email: ${customer.email}`, 50, yPosition);
    if (customer.phone) {
      yPosition += 15;
      doc.text(`Tél: ${customer.phone}`, 50, yPosition);
    }

    return yPosition + 30;
  }

  private static addItemsTable(
    doc: PDFKit.PDFDocument,
    items: QuoteItem[] | OrderItem[] | InvoiceItem[],
    yPosition: number
  ): number {
    const tableTop = yPosition;
    const tableHeaders = ['Désignation', 'SKU', 'Qté', 'P.U. HT', 'TVA', 'Total HT'];
    const colWidths = [200, 80, 50, 70, 50, 80];
    let xPos = 50;

    // En-têtes de tableau
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .rect(50, tableTop, 545, 25)
      .fill('#1e40af');

    doc.fillColor('#ffffff');
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, tableTop + 7, {
        width: colWidths[i],
        align: i > 1 ? 'right' : 'left',
      });
      xPos += colWidths[i];
    });

    // Lignes du tableau
    yPosition = tableTop + 30;
    let rowColor = '#f9fafb';

    items.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternance de couleurs
      rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(50, yPosition - 5, 545, 25).fill(rowColor);

      doc.fontSize(9).font('Helvetica').fillColor('#374151');

      xPos = 50;
      // Nom du produit
      doc.text(item.product.name, xPos, yPosition, {
        width: colWidths[0],
        align: 'left',
      });
      xPos += colWidths[0];

      // SKU
      doc.text(item.product.sku, xPos, yPosition, {
        width: colWidths[1],
        align: 'left',
      });
      xPos += colWidths[1];

      // Quantité
      doc.text(item.quantity.toString(), xPos, yPosition, {
        width: colWidths[2],
        align: 'right',
      });
      xPos += colWidths[2];

      // Prix unitaire
      doc.text(this.formatCurrency(item.unitPrice), xPos, yPosition, {
        width: colWidths[3],
        align: 'right',
      });
      xPos += colWidths[3];

      // TVA
      doc.text(`${item.taxRate}%`, xPos, yPosition, {
        width: colWidths[4],
        align: 'right',
      });
      xPos += colWidths[4];

      // Total
      doc.text(this.formatCurrency(item.total), xPos, yPosition, {
        width: colWidths[5],
        align: 'right',
      });

      yPosition += 25;
    });

    return yPosition + 10;
  }

  private static addTotals(
    doc: PDFKit.PDFDocument,
    subtotal: number,
    taxAmount: number,
    discount: number,
    total: number,
    yPosition: number,
    shippingCost?: number
  ) {
    const rightCol = 400;

    // Sous-total
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Sous-total HT:', rightCol, yPosition, { align: 'right' })
      .text(this.formatCurrency(subtotal), rightCol + 100, yPosition, { align: 'right' });

    yPosition += 20;

    // Remise (si applicable)
    if (discount > 0) {
      doc
        .text('Remise:', rightCol, yPosition, { align: 'right' })
        .text(`-${this.formatCurrency(discount)}`, rightCol + 100, yPosition, {
          align: 'right',
        });
      yPosition += 20;
    }

    // Frais de port (si applicable)
    if (shippingCost && shippingCost > 0) {
      doc
        .text('Frais de port:', rightCol, yPosition, { align: 'right' })
        .text(this.formatCurrency(shippingCost), rightCol + 100, yPosition, { align: 'right' });
      yPosition += 20;
    }

    // TVA
    doc
      .text('TVA:', rightCol, yPosition, { align: 'right' })
      .text(this.formatCurrency(taxAmount), rightCol + 100, yPosition, { align: 'right' });

    yPosition += 30;

    // Total TTC
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .rect(rightCol - 10, yPosition - 5, 170, 30)
      .fill('#e0e7ff')
      .fillColor('#1e40af')
      .text('Total TTC:', rightCol, yPosition, { align: 'right' })
      .text(this.formatCurrency(total), rightCol + 100, yPosition, { align: 'right' });

    return yPosition + 40;
  }

  private static addFooter(doc: PDFKit.PDFDocument, notes?: string, terms?: string) {
    let yPosition = 680;

    if (notes) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text('Notes:', 50, yPosition);
      yPosition += 15;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(notes, 50, yPosition, { width: 500 });
      yPosition += 30;
    }

    if (terms) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text('Conditions générales:', 50, yPosition);
      yPosition += 15;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(terms, 50, yPosition, { width: 500 });
    }

    // Pied de page
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(
        `${COMPANY_INFO.name} - ${COMPANY_INFO.address}, ${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}`,
        50,
        770,
        { align: 'center', width: 500 }
      );
  }

  static generateQuotePDF(quote: Quote, res: Response) {
    const doc = new PDFDocument({ margin: 50 });

    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devis-${quote.number}.pdf`);

    doc.pipe(res);

    // En-tête
    this.addHeader(doc, 'DEVIS');

    // Informations du devis
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`Numéro: ${quote.number}`, 350, 100, { align: 'right' })
      .text(`Date: ${this.formatDate(quote.createdAt)}`, 350, 115, { align: 'right' });

    if (quote.validUntil) {
      doc.text(`Valide jusqu'au: ${this.formatDate(quote.validUntil)}`, 350, 130, {
        align: 'right',
      });
    }

    // Informations client
    let yPosition = this.addCustomerInfo(doc, quote.customer, 200);

    // Tableau des articles
    yPosition = this.addItemsTable(doc, quote.items, yPosition);

    // Totaux
    yPosition = this.addTotals(
      doc,
      quote.subtotal,
      quote.taxAmount,
      quote.discount,
      quote.total,
      yPosition
    );

    // Notes et conditions
    this.addFooter(doc, quote.notes, quote.termsConditions);

    doc.end();
  }

  static generateInvoicePDF(invoice: Invoice, res: Response) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.number}.pdf`);

    doc.pipe(res);

    // En-tête
    this.addHeader(doc, 'FACTURE');

    // Informations de la facture
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`Numéro: ${invoice.number}`, 350, 100, { align: 'right' })
      .text(`Date d'émission: ${this.formatDate(invoice.issueDate)}`, 350, 115, {
        align: 'right',
      });

    if (invoice.dueDate) {
      doc.text(`Date d'échéance: ${this.formatDate(invoice.dueDate)}`, 350, 130, {
        align: 'right',
      });
    }

    // Informations client
    let yPosition = this.addCustomerInfo(doc, invoice.customer, 200);

    // Tableau des articles
    yPosition = this.addItemsTable(doc, invoice.items, yPosition);

    // Totaux
    yPosition = this.addTotals(
      doc,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.discount,
      invoice.total,
      yPosition
    );

    // Montant payé
    if (invoice.paidAmount > 0) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text(`Montant payé: ${this.formatCurrency(invoice.paidAmount)}`, 400, yPosition, {
          align: 'right',
        });

      const remaining = invoice.total - invoice.paidAmount;
      if (remaining > 0) {
        yPosition += 20;
        doc
          .fillColor('#dc2626')
          .text(`Reste à payer: ${this.formatCurrency(remaining)}`, 400, yPosition, {
            align: 'right',
          });
      }
    }

    // Notes et conditions
    this.addFooter(doc, invoice.notes, invoice.termsConditions);

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

    // En-tête
    this.addHeader(doc, 'BON DE LIVRAISON');

    // Informations du bon de livraison
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`Numéro: ${order.number}`, 350, 100, { align: 'right' })
      .text(`Date: ${this.formatDate(order.createdAt)}`, 350, 115, { align: 'right' });

    // Adresse de livraison
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text('Adresse de livraison', 50, 200);

    let yPosition = 220;
    doc.fontSize(10).font('Helvetica').fillColor('#374151');

    if (order.customer.type === 'COMPANY') {
      doc.text(order.customer.companyName || '', 50, yPosition);
    } else {
      doc.text(`${order.customer.firstName} ${order.customer.lastName}`, 50, yPosition);
    }
    yPosition += 15;

    // Utiliser l'adresse de livraison si disponible, sinon l'adresse du client
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

    // Tableau des articles (simplifié, sans prix)
    const tableTop = yPosition;
    const tableHeaders = ['Désignation', 'SKU', 'Quantité'];
    const colWidths = [350, 120, 100];
    let xPos = 50;

    // En-têtes de tableau
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .rect(50, tableTop, 545, 25)
      .fill('#1e40af');

    doc.fillColor('#ffffff');
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, tableTop + 7, {
        width: colWidths[i],
        align: i > 1 ? 'right' : 'left',
      });
      xPos += colWidths[i];
    });

    // Lignes du tableau
    yPosition = tableTop + 30;
    let rowColor = '#f9fafb';

    order.items.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(50, yPosition - 5, 545, 25).fill(rowColor);

      doc.fontSize(9).font('Helvetica').fillColor('#374151');

      xPos = 50;
      doc.text(item.product.name, xPos, yPosition, {
        width: colWidths[0],
        align: 'left',
      });
      xPos += colWidths[0];

      doc.text(item.product.sku, xPos, yPosition, {
        width: colWidths[1],
        align: 'left',
      });
      xPos += colWidths[1];

      doc.text(item.quantity.toString(), xPos, yPosition, {
        width: colWidths[2],
        align: 'right',
      });

      yPosition += 25;
    });

    yPosition += 40;

    // Signature
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text('Signature du client:', 50, yPosition);

    yPosition += 50;
    doc
      .moveTo(50, yPosition)
      .lineTo(250, yPosition)
      .stroke('#d1d5db');

    // Notes
    if (order.notes) {
      this.addFooter(doc, order.notes);
    }

    doc.end();
  }
}
