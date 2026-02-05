import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import prisma from '../config/database';

/**
 * Service de génération de PDF pour les documents B2B
 * - Bon de livraison (BL)
 * - Facture B2B
 * - Preuve de livraison signée
 */

const PDF_DIR = join(process.cwd(), 'public', 'pdfs');

// Créer le répertoire PDF s'il n'existe pas
if (!existsSync(PDF_DIR)) {
  mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Générer un bon de livraison (BL) pour une commande
 */
export async function generateDeliveryNote(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        include: {
          proProfile: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });

  if (!order) {
    throw new Error('Commande non trouvée');
  }

  const filename = `BL-${order.number}-${Date.now()}.pdf`;
  const filepath = join(PDF_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(filepath);

    stream.on('finish', () => resolve(`/public/pdfs/${filename}`));
    stream.on('error', reject);

    doc.pipe(stream);

    // En-tête
    doc
      .fontSize(20)
      .text('BON DE LIVRAISON', { align: 'center' })
      .moveDown();

    // Informations entreprise
    doc
      .fontSize(10)
      .text('NEOSERV', { continued: true })
      .text('   |   ', { continued: true })
      .text('Siège social: Paris, France')
      .text('SIRET: XXX XXX XXX XXXXX')
      .text('TVA: FR XX XXX XXX XXX')
      .moveDown();

    // Numéro et date
    doc
      .fontSize(12)
      .text(`BL N°: ${order.number}`, 50, 150)
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, 50, 165)
      .text(
        `Commande N°: ${order.number}`,
        50,
        180
      );

    // Informations client
    doc
      .fontSize(12)
      .text('Client:', 350, 150)
      .fontSize(10)
      .text(order.customer.companyName || 'N/A', 350, 165)
      .text(order.customer.address || '', 350, 180)
      .text(`${order.customer.postalCode || ''} ${order.customer.city || ''}`, 350, 195);

    // Conditions de paiement
    if (order.customer.proProfile) {
      doc
        .text(
          `Conditions: ${order.customer.proProfile.paymentTerms}`,
          350,
          210
        );
    }

    doc.moveDown(4);

    // Tableau des articles
    const tableTop = 250;
    let y = tableTop;

    // En-têtes du tableau
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Référence', 50, y)
      .text('Désignation', 150, y)
      .text('Qté', 400, y, { width: 50, align: 'right' })
      .text('Prix HT', 460, y, { width: 80, align: 'right' })
      .font('Helvetica');

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Lignes d'articles
    order.items.forEach((item) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc
        .fontSize(9)
        .text(item.product.sku || 'N/A', 50, y, { width: 90 })
        .text(item.product.name, 150, y, { width: 240 })
        .text(item.quantity.toString(), 400, y, { width: 50, align: 'right' })
        .text(`${item.unitPrice.toFixed(2)} €`, 460, y, { width: 80, align: 'right' });

      y += 25;
    });

    // Ligne de séparation
    y += 10;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;

    // Total HT
    const totalHT = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tva = totalHT * 0.2;
    const totalTTC = totalHT + tva;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total HT:', 400, y)
      .text(`${totalHT.toFixed(2)} €`, 460, y, { width: 80, align: 'right' })
      .text('TVA 20%:', 400, y + 20)
      .text(`${tva.toFixed(2)} €`, 460, y + 20, { width: 80, align: 'right' })
      .text('Total TTC:', 400, y + 40)
      .text(`${totalTTC.toFixed(2)} €`, 460, y + 40, { width: 80, align: 'right' });

    // Zone de signature
    y += 100;
    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Signature du destinataire', 50, y)
      .text('(pour réception conforme):', 50, y + 15);

    // Rectangle pour signature
    doc.rect(50, y + 40, 200, 80).stroke();

    // Mentions légales
    doc
      .fontSize(8)
      .text(
        'Document non contractuel. En cas de litige, seule la facture fait foi.',
        50,
        750,
        { align: 'center' }
      );

    doc.end();
  });
}

/**
 * Générer une facture B2B pour une commande
 */
export async function generateInvoice(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          customer: {
            include: {
              proProfile: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!invoice) {
    throw new Error('Facture non trouvée');
  }

  const filename = `FACTURE-${invoice.number}-${Date.now()}.pdf`;
  const filepath = join(PDF_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(filepath);

    stream.on('finish', () => resolve(`/public/pdfs/${filename}`));
    stream.on('error', reject);

    doc.pipe(stream);

    // En-tête
    doc
      .fontSize(25)
      .text('FACTURE', { align: 'center' })
      .moveDown();

    // Informations entreprise (émetteur)
    doc
      .fontSize(10)
      .text('NEOSERV SAS', 50, 120)
      .text('Siège social: 123 Avenue de Paris', 50, 135)
      .text('75001 Paris, France', 50, 150)
      .text('SIRET: XXX XXX XXX XXXXX', 50, 165)
      .text('TVA: FR XX XXX XXX XXX', 50, 180)
      .text('Capital social: 100 000 €', 50, 195);

    // Numéros et dates
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Facture N°: ${invoice.number}`, 350, 120)
      .font('Helvetica')
      .fontSize(10)
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, 350, 140)
      .text(`Commande N°: ${invoice.order.number}`, 350, 155);

    if (invoice.dueDate) {
      doc.text(
        `Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`,
        350,
        170
      );
    }

    // Informations client (destinataire)
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Facturé à:', 350, 200)
      .font('Helvetica')
      .fontSize(10)
      .text(invoice.order.customer.companyName || 'N/A', 350, 215)
      .text(invoice.order.customer.address || '', 350, 230)
      .text(
        `${invoice.order.customer.postalCode || ''} ${invoice.order.customer.city || ''}`,
        350,
        245
      );

    doc.moveDown(6);

    // Tableau des articles
    const tableTop = 290;
    let y = tableTop;

    // En-têtes du tableau
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Désignation', 50, y)
      .text('Qté', 350, y, { width: 50, align: 'right' })
      .text('Prix Unit. HT', 410, y, { width: 80, align: 'right' })
      .text('Total HT', 500, y, { width: 80, align: 'right' })
      .font('Helvetica');

    y += 20;
    doc.moveTo(50, y).lineTo(580, y).stroke();
    y += 10;

    // Lignes d'articles
    let totalHT = 0;

    invoice.order.items.forEach((item) => {
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      const lineTotal = item.unitPrice * item.quantity;
      totalHT += lineTotal;

      doc
        .fontSize(9)
        .text(item.product.name, 50, y, { width: 290 })
        .text(item.quantity.toString(), 350, y, { width: 50, align: 'right' })
        .text(`${item.unitPrice.toFixed(2)} €`, 410, y, { width: 80, align: 'right' })
        .text(`${lineTotal.toFixed(2)} €`, 500, y, { width: 80, align: 'right' });

      y += 25;
    });

    // Ligne de séparation
    y += 10;
    doc.moveTo(50, y).lineTo(580, y).stroke();
    y += 20;

    // Totaux
    const tva = totalHT * 0.2;
    const totalTTC = totalHT + tva;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Total HT:', 410, y, { width: 80, align: 'right' })
      .text(`${totalHT.toFixed(2)} €`, 500, y, { width: 80, align: 'right' })
      .text('TVA 20%:', 410, y + 20, { width: 80, align: 'right' })
      .text(`${tva.toFixed(2)} €`, 500, y + 20, { width: 80, align: 'right' })
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total TTC:', 410, y + 45, { width: 80, align: 'right' })
      .text(`${totalTTC.toFixed(2)} €`, 500, y + 45, { width: 80, align: 'right' });

    // Paiements reçus
    if (invoice.paidAmount && invoice.paidAmount > 0) {
      doc
        .font('Helvetica')
        .fontSize(11)
        .text('Payé:', 410, y + 70, { width: 80, align: 'right' })
        .text(`${invoice.paidAmount.toFixed(2)} €`, 500, y + 70, { width: 80, align: 'right' });

      const remaining = totalTTC - invoice.paidAmount;
      doc
        .font('Helvetica-Bold')
        .text('Reste à payer:', 410, y + 90, { width: 80, align: 'right' })
        .text(`${remaining.toFixed(2)} €`, 500, y + 90, { width: 80, align: 'right' });
    }

    // Conditions de paiement
    y += 130;
    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Conditions de paiement:', 50, y)
      .font('Helvetica')
      .text(
        invoice.order.customer.proProfile?.paymentTerms || 'NET30',
        50,
        y + 15
      );

    // Mentions légales
    doc
      .fontSize(8)
      .text(
        'En cas de retard de paiement, seront exigibles, conformément à l\'article L.441-6 du Code de Commerce, une indemnité calculée sur la base de trois fois le taux de l\'intérêt légal en vigueur ainsi qu\'une indemnité forfaitaire pour frais de recouvrement de 40 euros.',
        50,
        y + 50,
        { width: 500, align: 'justify' }
      );

    doc.end();
  });
}

/**
 * Générer une preuve de livraison signée
 */
export async function generateDeliveryProof(deliveryId: string): Promise<string> {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      deliveryProof: true,
    },
  });

  if (!delivery || !delivery.deliveryProof) {
    throw new Error('Preuve de livraison non trouvée');
  }

  const filename = `PREUVE-${delivery.id}-${Date.now()}.pdf`;
  const filepath = join(PDF_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(filepath);

    stream.on('finish', () => resolve(`/public/pdfs/${filename}`));
    stream.on('error', reject);

    doc.pipe(stream);

    // En-tête
    doc
      .fontSize(22)
      .text('PREUVE DE LIVRAISON', { align: 'center' })
      .moveDown();

    // Informations de livraison
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Informations de livraison', 50, 120)
      .font('Helvetica')
      .fontSize(10)
      .text(`Livraison ID: ${delivery.id}`, 50, 140)
      .text(`Commande N°: ${delivery.order.number}`, 50, 155)
      .text(
        `Date de livraison: ${new Date(delivery.actualDeliveryAt!).toLocaleDateString('fr-FR')}`,
        50,
        170
      );

    // Client
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Client:', 50, 200)
      .font('Helvetica')
      .fontSize(10)
      .text(delivery.order.customer.companyName || 'N/A', 50, 215)
      .text(delivery.order.customer.address || '', 50, 230)
      .text(
        `${delivery.order.customer.postalCode || ''} ${delivery.order.customer.city || ''}`,
        50,
        245
      );

    // Articles livrés
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Articles livrés:', 50, 280)
      .font('Helvetica')
      .fontSize(9);

    let y = 300;
    delivery.order.items.forEach((item) => {
      doc.text(
        `• ${item.product.name} - Quantité: ${item.quantity}`,
        60,
        y
      );
      y += 15;
    });

    // Signature
    y += 30;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Signature du destinataire:', 50, y)
      .font('Helvetica')
      .fontSize(10)
      .text(
        `Reçu par: ${delivery.deliveryProof.signedBy || 'N/A'}`,
        50,
        y + 20
      )
      .text(
        `Date: ${new Date(delivery.deliveryProof.signedAt).toLocaleDateString('fr-FR')} ${new Date(delivery.deliveryProof.signedAt).toLocaleTimeString('fr-FR')}`,
        50,
        y + 35
      );

    // Afficher la signature si disponible
    if (delivery.deliveryProof.signatureImage) {
      try {
        // Ajouter l'image de signature
        doc.image(delivery.deliveryProof.signatureImage, 50, y + 60, {
          width: 200,
          height: 100,
        });
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la signature:', error);
      }
    }

    // Notes
    if (delivery.deliveryProof.notes) {
      y += 180;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Notes:', 50, y)
        .font('Helvetica')
        .text(delivery.deliveryProof.notes, 50, y + 15, { width: 500 });
    }

    // Mentions légales
    doc
      .fontSize(8)
      .text(
        'Ce document atteste de la réception conforme de la marchandise à la date indiquée.',
        50,
        750,
        { align: 'center' }
      );

    doc.end();
  });
}

/**
 * Générer un récapitulatif de commande pour le client
 */
export async function generateOrderSummary(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        include: {
          proProfile: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Commande non trouvée');
  }

  const filename = `RECAP-${order.number}-${Date.now()}.pdf`;
  const filepath = join(PDF_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(filepath);

    stream.on('finish', () => resolve(`/public/pdfs/${filename}`));
    stream.on('error', reject);

    doc.pipe(stream);

    // En-tête
    doc
      .fontSize(20)
      .text('RÉCAPITULATIF DE COMMANDE', { align: 'center' })
      .moveDown();

    // Informations
    doc
      .fontSize(12)
      .text(`Commande N°: ${order.number}`, 50, 120)
      .text(
        `Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`,
        50,
        135
      )
      .text(`Statut: ${order.status}`, 50, 150);

    // Client
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Client:', 350, 120)
      .font('Helvetica')
      .fontSize(10)
      .text(order.customer.companyName || 'N/A', 350, 135)
      .text(order.customer.email, 350, 150);

    doc.moveDown(3);

    // Articles
    const tableTop = 200;
    let y = tableTop;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Désignation', 50, y)
      .text('Qté', 400, y)
      .text('Prix HT', 480, y)
      .font('Helvetica');

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    order.items.forEach((item) => {
      doc
        .fontSize(9)
        .text(item.product.name, 50, y, { width: 340 })
        .text(item.quantity.toString(), 400, y)
        .text(`${item.unitPrice.toFixed(2)} €`, 480, y);
      y += 20;
    });

    y += 10;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;

    // Total
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Total TTC: ${order.total.toFixed(2)} €`, 400, y);

    doc.end();
  });
}
