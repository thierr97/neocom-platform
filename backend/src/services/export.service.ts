import XLSX from 'xlsx';
import { Response } from 'express';

export class ExportService {
  /**
   * Export orders to Excel
   */
  static exportOrdersToExcel(orders: any[], res: Response) {
    const data = orders.map(order => ({
      'N° Commande': order.number,
      'Date': new Date(order.createdAt).toLocaleDateString('fr-FR'),
      'Client': order.customer?.companyName || `${order.customer?.firstName} ${order.customer?.lastName}`,
      'Email': order.customer?.email,
      'Téléphone': order.customer?.phone || order.customer?.mobile || '',
      'Statut': order.status,
      'Statut paiement': order.paymentStatus,
      'Sous-total (€)': order.subtotal,
      'TVA (€)': order.taxAmount,
      'Frais de port (€)': order.shippingCost,
      'Remise (€)': order.discount,
      'Total (€)': order.total,
      'Nombre d\'articles': order.items?.length || 0,
      'Ville': order.shippingCity || order.customer?.city || '',
      'Code postal': order.shippingPostalCode || order.customer?.postalCode || '',
      'Pays': order.shippingCountry || order.customer?.country || '',
      'Confirmée le': order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString('fr-FR') : '',
      'Expédiée le': order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('fr-FR') : '',
      'Livrée le': order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('fr-FR') : '',
      'Commercial': order.user ? `${order.user.firstName} ${order.user.lastName}` : '',
      'Notes': order.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // N° Commande
      { wch: 12 }, // Date
      { wch: 25 }, // Client
      { wch: 30 }, // Email
      { wch: 15 }, // Téléphone
      { wch: 12 }, // Statut
      { wch: 15 }, // Statut paiement
      { wch: 12 }, // Sous-total
      { wch: 10 }, // TVA
      { wch: 15 }, // Frais de port
      { wch: 10 }, // Remise
      { wch: 12 }, // Total
      { wch: 10 }, // Nombre d'articles
      { wch: 20 }, // Ville
      { wch: 12 }, // Code postal
      { wch: 12 }, // Pays
      { wch: 12 }, // Confirmée le
      { wch: 12 }, // Expédiée le
      { wch: 12 }, // Livrée le
      { wch: 20 }, // Commercial
      { wch: 30 }, // Notes
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=commandes_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export order details (with items) to Excel
   */
  static exportOrderDetailsToExcel(order: any, res: Response) {
    // Sheet 1: Order info
    const orderInfo = [{
      'N° Commande': order.number,
      'Date': new Date(order.createdAt).toLocaleDateString('fr-FR'),
      'Client': order.customer?.companyName || `${order.customer?.firstName} ${order.customer?.lastName}`,
      'Email': order.customer?.email,
      'Téléphone': order.customer?.phone || order.customer?.mobile,
      'Statut': order.status,
      'Statut paiement': order.paymentStatus,
      'Total (€)': order.total,
    }];

    // Sheet 2: Order items
    const items = order.items?.map((item: any) => ({
      'SKU': item.product?.sku || '',
      'Produit': item.product?.name || '',
      'Quantité': item.quantity,
      'Prix unitaire (€)': item.unitPrice,
      'Taux TVA (%)': item.taxRate,
      'Remise (€)': item.discount,
      'Total (€)': item.total,
    })) || [];

    const workbook = XLSX.utils.book_new();

    const orderSheet = XLSX.utils.json_to_sheet(orderInfo);
    XLSX.utils.book_append_sheet(workbook, orderSheet, 'Commande');

    const itemsSheet = XLSX.utils.json_to_sheet(items);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Articles');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=commande_${order.number}_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export customers to Excel
   */
  static exportCustomersToExcel(customers: any[], res: Response) {
    const data = customers.map(customer => ({
      'Type': customer.type,
      'Email': customer.email,
      'Nom société': customer.companyName || '',
      'Prénom': customer.firstName || '',
      'Nom': customer.lastName || '',
      'Téléphone': customer.phone || '',
      'Mobile': customer.mobile || '',
      'Adresse': customer.address || '',
      'Complément adresse': customer.addressLine2 || '',
      'Ville': customer.city || '',
      'Code postal': customer.postalCode || '',
      'Pays': customer.country || '',
      'SIRET': customer.siret || '',
      'N° TVA': customer.vatNumber || '',
      'Statut': customer.status,
      'Commercial': customer.user ? `${customer.user.firstName} ${customer.user.lastName}` : '',
      'Date création': new Date(customer.createdAt).toLocaleDateString('fr-FR'),
      'Tags': customer.tags?.join('; ') || '',
      'Notes': customer.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 12 }, // Type
      { wch: 30 }, // Email
      { wch: 25 }, // Nom société
      { wch: 15 }, // Prénom
      { wch: 15 }, // Nom
      { wch: 15 }, // Téléphone
      { wch: 15 }, // Mobile
      { wch: 30 }, // Adresse
      { wch: 20 }, // Complément adresse
      { wch: 20 }, // Ville
      { wch: 12 }, // Code postal
      { wch: 12 }, // Pays
      { wch: 15 }, // SIRET
      { wch: 15 }, // N° TVA
      { wch: 12 }, // Statut
      { wch: 20 }, // Commercial
      { wch: 12 }, // Date création
      { wch: 30 }, // Tags
      { wch: 40 }, // Notes
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=clients_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export products to Excel
   */
  static exportProductsToExcel(products: any[], res: Response) {
    const data = products.map(product => ({
      'SKU': product.sku,
      'Code barre': product.barcode || '',
      'Nom': product.name,
      'Description': product.description || '',
      'Prix (€)': product.price,
      'Prix d\'achat (€)': product.costPrice || '',
      'Prix barré (€)': product.compareAtPrice || '',
      'Stock': product.stock,
      'Stock minimum': product.minStock || '',
      'Stock maximum': product.maxStock || '',
      'Statut': product.status,
      'Visible': product.isVisible ? 'Oui' : 'Non',
      'En vedette': product.isFeatured ? 'Oui' : 'Non',
      'Catégorie': product.category?.name || '',
      'Fournisseur': product.supplier?.companyName || '',
      'Poids (kg)': product.weight || '',
      'Largeur (cm)': product.width || '',
      'Hauteur (cm)': product.height || '',
      'Longueur (cm)': product.length || '',
      'Tags': product.tags?.join('; ') || '',
      'Date création': new Date(product.createdAt).toLocaleDateString('fr-FR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 15 }, // SKU
      { wch: 15 }, // Code barre
      { wch: 30 }, // Nom
      { wch: 40 }, // Description
      { wch: 10 }, // Prix
      { wch: 15 }, // Prix d'achat
      { wch: 12 }, // Prix barré
      { wch: 8 }, // Stock
      { wch: 12 }, // Stock minimum
      { wch: 12 }, // Stock maximum
      { wch: 10 }, // Statut
      { wch: 8 }, // Visible
      { wch: 12 }, // En vedette
      { wch: 20 }, // Catégorie
      { wch: 25 }, // Fournisseur
      { wch: 10 }, // Poids
      { wch: 12 }, // Largeur
      { wch: 12 }, // Hauteur
      { wch: 12 }, // Longueur
      { wch: 30 }, // Tags
      { wch: 12 }, // Date création
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=produits_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export invoices to Excel
   */
  static exportInvoicesToExcel(invoices: any[], res: Response) {
    const data = invoices.map(invoice => ({
      'N° Facture': invoice.number,
      'Date émission': new Date(invoice.issueDate).toLocaleDateString('fr-FR'),
      'Date échéance': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : '',
      'Client': invoice.customer?.companyName || `${invoice.customer?.firstName} ${invoice.customer?.lastName}`,
      'Email': invoice.customer?.email,
      'Statut': invoice.status,
      'Sous-total (€)': invoice.subtotal,
      'TVA (€)': invoice.taxAmount,
      'Remise (€)': invoice.discount,
      'Total (€)': invoice.total,
      'Montant payé (€)': invoice.paidAmount,
      'Reste à payer (€)': invoice.total - invoice.paidAmount,
      'Payée le': invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('fr-FR') : '',
      'Commercial': invoice.user ? `${invoice.user.firstName} ${invoice.user.lastName}` : '',
      'N° Commande': invoice.order?.number || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 15 }, // N° Facture
      { wch: 12 }, // Date émission
      { wch: 12 }, // Date échéance
      { wch: 25 }, // Client
      { wch: 30 }, // Email
      { wch: 12 }, // Statut
      { wch: 12 }, // Sous-total
      { wch: 10 }, // TVA
      { wch: 10 }, // Remise
      { wch: 12 }, // Total
      { wch: 15 }, // Montant payé
      { wch: 15 }, // Reste à payer
      { wch: 12 }, // Payée le
      { wch: 20 }, // Commercial
      { wch: 15 }, // N° Commande
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=factures_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  /**
   * Export quotes to Excel
   */
  static exportQuotesToExcel(quotes: any[], res: Response) {
    const data = quotes.map(quote => ({
      'N° Devis': quote.number,
      'Date': new Date(quote.createdAt).toLocaleDateString('fr-FR'),
      'Client': quote.customer?.companyName || `${quote.customer?.firstName} ${quote.customer?.lastName}`,
      'Email': quote.customer?.email,
      'Statut': quote.status,
      'Valide jusqu\'au': quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : '',
      'Sous-total (€)': quote.subtotal,
      'TVA (€)': quote.taxAmount,
      'Remise (€)': quote.discount,
      'Total (€)': quote.total,
      'Envoyé le': quote.sentAt ? new Date(quote.sentAt).toLocaleDateString('fr-FR') : '',
      'Accepté le': quote.acceptedAt ? new Date(quote.acceptedAt).toLocaleDateString('fr-FR') : '',
      'Commercial': quote.user ? `${quote.user.firstName} ${quote.user.lastName}` : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 15 }, // N° Devis
      { wch: 12 }, // Date
      { wch: 25 }, // Client
      { wch: 30 }, // Email
      { wch: 12 }, // Statut
      { wch: 12 }, // Valide jusqu'au
      { wch: 12 }, // Sous-total
      { wch: 10 }, // TVA
      { wch: 10 }, // Remise
      { wch: 12 }, // Total
      { wch: 12 }, // Envoyé le
      { wch: 12 }, // Accepté le
      { wch: 20 }, // Commercial
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Devis');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=devis_${Date.now()}.xlsx`);
    res.send(buffer);
  }
}
