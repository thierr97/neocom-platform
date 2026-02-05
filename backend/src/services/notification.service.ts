import nodemailer from 'nodemailer';
import prisma from '../config/database';

/**
 * Service de notifications par email pour les événements B2B
 */

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Envoyer un email générique
 */
async function sendEmail(to: string, subject: string, html: string, cc?: string[]) {
  try {
    const info = await transporter.sendMail({
      from: `"NEOSERV" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      cc: cc?.join(', '),
      subject,
      html,
    });

    console.log(`Email envoyé: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

/**
 * Notification: Nouvelle inscription client PRO
 */
export async function notifyProCustomerRegistration(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      proProfile: true,
    },
  });

  if (!customer) return;

  // Email au client
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Bienvenue chez NEOSERV !</h2>
      <p>Bonjour ${customer.companyName},</p>
      <p>Votre demande de compte professionnel a bien été reçue.</p>
      <p>Nos équipes vont l'examiner et vous recevrez une réponse sous 48 heures.</p>
      <p>En attendant, vous pouvez préparer les documents suivants :</p>
      <ul>
        <li>KBIS de moins de 3 mois</li>
        <li>RIB de l'entreprise</li>
        <li>Pièce d'identité du gérant</li>
        <li>Numéro de TVA intracommunautaire</li>
      </ul>
      <p>À très bientôt !</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #7f8c8d; font-size: 12px;">
        NEOSERV - Service B2B<br>
        Email: ${process.env.SMTP_USER}<br>
        Tél: +33 1 XX XX XX XX
      </p>
    </div>
  `;

  await sendEmail(
    customer.email,
    'Votre demande de compte professionnel',
    customerHtml
  );

  // Email aux admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUB_ADMIN'] } },
  });

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">Nouvelle demande de compte PRO</h2>
      <p>Une nouvelle entreprise a demandé un compte professionnel :</p>
      <ul>
        <li><strong>Entreprise :</strong> ${customer.companyName}</li>
        <li><strong>Email :</strong> ${customer.email}</li>
        <li><strong>Téléphone :</strong> ${customer.phone || 'N/A'}</li>
        <li><strong>Adresse :</strong> ${customer.address || 'N/A'}, ${customer.postalCode || ''} ${customer.city || ''}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/admin/b2b/customers/${customerId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir la demande</a></p>
    </div>
  `;

  for (const admin of admins) {
    await sendEmail(admin.email, '[NEOSERV] Nouvelle demande compte PRO', adminHtml);
  }
}

/**
 * Notification: Compte PRO approuvé
 */
export async function notifyProCustomerApproved(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      proProfile: true,
    },
  });

  if (!customer || !customer.proProfile) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60;">✓ Votre compte professionnel est activé !</h2>
      <p>Bonjour ${customer.companyName},</p>
      <p>Excellente nouvelle ! Votre compte professionnel NEOSERV a été approuvé.</p>
      <h3>Vos conditions commerciales :</h3>
      <ul>
        <li><strong>Conditions de paiement :</strong> ${customer.proProfile.paymentTerms}</li>
        <li><strong>Limite de crédit :</strong> ${customer.proProfile.creditLimit || 0} €</li>
        <li><strong>Remise par défaut :</strong> ${customer.proProfile.defaultDiscount || 0}%</li>
      </ul>
      <p>Vous pouvez dès maintenant accéder à votre espace client PRO et passer vos premières commandes aux tarifs négociés.</p>
      <p><a href="${process.env.FRONTEND_URL}/pro/dashboard" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accéder à mon espace PRO</a></p>
      <p>Bienvenue dans la famille NEOSERV !</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #7f8c8d; font-size: 12px;">
        NEOSERV - Service B2B<br>
        Email: ${process.env.SMTP_USER}
      </p>
    </div>
  `;

  await sendEmail(
    customer.email,
    '✓ Votre compte professionnel est activé !',
    html
  );
}

/**
 * Notification: Compte PRO rejeté
 */
export async function notifyProCustomerRejected(customerId: string, reason: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">Demande de compte professionnel</h2>
      <p>Bonjour ${customer.companyName},</p>
      <p>Nous avons examiné votre demande de compte professionnel.</p>
      <p>Malheureusement, nous ne pouvons pas donner suite à votre demande pour la raison suivante :</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
        ${reason}
      </div>
      <p>Si vous souhaitez des précisions ou soumettre de nouvelles informations, n'hésitez pas à nous contacter.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #7f8c8d; font-size: 12px;">
        NEOSERV - Service B2B<br>
        Email: ${process.env.SMTP_USER}
      </p>
    </div>
  `;

  await sendEmail(
    customer.email,
    'Votre demande de compte professionnel',
    html
  );
}

/**
 * Notification: Nouvelle commande B2B
 */
export async function notifyNewB2BOrder(orderId: string) {
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

  if (!order) return;

  // Email au client
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Confirmation de commande</h2>
      <p>Bonjour ${order.customer.companyName},</p>
      <p>Votre commande a bien été enregistrée.</p>
      <h3>Récapitulatif :</h3>
      <ul>
        <li><strong>N° de commande :</strong> ${order.number}</li>
        <li><strong>Date :</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</li>
        <li><strong>Montant TTC :</strong> ${order.total.toFixed(2)} €</li>
        <li><strong>Conditions :</strong> ${order.customer.proProfile?.paymentTerms || 'N/A'}</li>
      </ul>
      <h3>Articles commandés :</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Article</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Qté</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Prix HT</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.unitPrice.toFixed(2)} €</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p>Nous vous tiendrons informé de l'avancement de votre commande.</p>
      <p><a href="${process.env.FRONTEND_URL}/pro/orders/${orderId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Suivre ma commande</a></p>
    </div>
  `;

  await sendEmail(
    order.customer.email,
    `Confirmation de commande ${order.number}`,
    customerHtml
  );

  // TODO: Email au commercial assigné (assignedCommercial relation not yet implemented)
  // if (order.customer.assignedCommercial) {
  //   const commercialHtml = `
  //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  //       <h2 style="color: #2c3e50;">Nouvelle commande B2B</h2>
  //       <p>Votre client ${order.customer.companyName} vient de passer une commande.</p>
  //       <ul>
  //         <li><strong>N° :</strong> ${order.number}</li>
  //         <li><strong>Montant :</strong> ${order.total.toFixed(2)} € TTC</li>
  //         <li><strong>Articles :</strong> ${order.items.length}</li>
  //       </ul>
  //       <p><a href="${process.env.FRONTEND_URL}/admin/b2b/orders/${orderId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir la commande</a></p>
  //     </div>
  //   `;

  //   await sendEmail(
  //     order.customer.assignedCommercial.email,
  //     `Nouvelle commande ${order.number}`,
  //     commercialHtml
  //   );
  // }
}

/**
 * Notification: Changement de statut de commande
 */
export async function notifyOrderStatusChange(orderId: string, newStatus: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (!order) return;

  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Votre commande a été confirmée et est en cours de préparation.',
    PROCESSING: 'Votre commande est en cours de traitement.',
    SHIPPED: 'Votre commande a été expédiée.',
    DELIVERED: 'Votre commande a été livrée.',
    CANCELLED: 'Votre commande a été annulée.',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Mise à jour de votre commande</h2>
      <p>Bonjour ${order.customer.companyName},</p>
      <p><strong>Commande ${order.number}</strong></p>
      <p>${statusMessages[newStatus] || 'Le statut de votre commande a été mis à jour.'}</p>
      <p><a href="${process.env.FRONTEND_URL}/pro/orders/${orderId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir ma commande</a></p>
    </div>
  `;

  await sendEmail(
    order.customer.email,
    `Commande ${order.number} - ${newStatus}`,
    html
  );
}

/**
 * Notification: Livraison effectuée avec signature
 */
export async function notifyDeliveryComplete(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: {
        include: {
          customer: {
            include: {
              proProfile: true,
            },
          },
        },
      },
      deliveryProof: true,
    },
  });

  if (!delivery || !delivery.deliveryProof) return;

  // Email au client
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60;">✓ Livraison effectuée</h2>
      <p>Bonjour ${delivery.order.customer.companyName},</p>
      <p>Votre commande <strong>${delivery.order.number}</strong> a été livrée avec succès.</p>
      <ul>
        <li><strong>Date de livraison :</strong> ${new Date(delivery.actualDeliveryAt!).toLocaleDateString('fr-FR')} à ${new Date(delivery.actualDeliveryAt!).toLocaleTimeString('fr-FR')}</li>
        <li><strong>Reçu par :</strong> ${delivery.deliveryProof.signedBy || 'N/A'}</li>
      </ul>
      <p>Le bon de livraison signé et la facture sont disponibles dans votre espace client.</p>
      <p><a href="${process.env.FRONTEND_URL}/pro/orders/${delivery.orderId}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir les documents</a></p>
    </div>
  `;

  await sendEmail(
    delivery.order.customer.email,
    `Livraison effectuée - Commande ${delivery.order.number}`,
    customerHtml
  );

  // Email à la comptabilité
  const accountingEmail = delivery.order.customer.proProfile?.accountingEmail;
  const ccEmails = [];

  // TODO: Add assignedCommercial email when relation is implemented
  // if (delivery.order.customer.assignedCommercial) {
  //   ccEmails.push(delivery.order.customer.assignedCommercial.email);
  // }

  if (accountingEmail) {
    const accountingHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Livraison effectuée - À facturer</h2>
        <p>La commande <strong>${delivery.order.number}</strong> a été livrée.</p>
        <ul>
          <li><strong>Client :</strong> ${delivery.order.customer.companyName}</li>
          <li><strong>Montant TTC :</strong> ${delivery.order.total.toFixed(2)} €</li>
          <li><strong>Conditions :</strong> ${delivery.order.customer.proProfile?.paymentTerms || 'N/A'}</li>
          <li><strong>Livré le :</strong> ${new Date(delivery.actualDeliveryAt!).toLocaleDateString('fr-FR')}</li>
        </ul>
        <p>La facture peut maintenant être générée.</p>
        <p><a href="${process.env.FRONTEND_URL}/admin/b2b/orders/${delivery.orderId}/invoice" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Générer la facture</a></p>
      </div>
    `;

    await sendEmail(
      accountingEmail,
      `[COMPTABILITÉ] Livraison ${delivery.order.number}`,
      accountingHtml,
      ccEmails
    );
  }
}

/**
 * Notification: Facture générée
 */
export async function notifyInvoiceGenerated(invoiceId: string) {
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
        },
      },
    },
  });

  if (!invoice) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Nouvelle facture disponible</h2>
      <p>Bonjour ${invoice.order.customer.companyName},</p>
      <p>Votre facture pour la commande <strong>${invoice.order.number}</strong> est disponible.</p>
      <ul>
        <li><strong>N° de facture :</strong> ${invoice.number}</li>
        <li><strong>Montant TTC :</strong> ${invoice.total.toFixed(2)} €</li>
        <li><strong>Date d'échéance :</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : 'N/A'}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/pro/invoices/${invoiceId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir la facture</a></p>
    </div>
  `;

  await sendEmail(
    invoice.order.customer.email,
    `Facture ${invoice.number}`,
    html
  );

  // Envoyer aussi à l'email comptabilité si renseigné
  const accountingEmail = invoice.order.customer.proProfile?.accountingEmail;
  if (accountingEmail && accountingEmail !== invoice.order.customer.email) {
    await sendEmail(accountingEmail, `Facture ${invoice.number}`, html);
  }
}

/**
 * Notification: Rappel d'échéance de facture
 */
export async function notifyInvoiceDueReminder(invoiceId: string) {
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
        },
      },
    },
  });

  if (!invoice || !invoice.dueDate) return;

  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e67e22;">Rappel: Échéance de facture</h2>
      <p>Bonjour ${invoice.order.customer.companyName},</p>
      <p>Nous vous rappelons que la facture <strong>${invoice.number}</strong> arrive à échéance dans ${daysUntilDue} jours.</p>
      <ul>
        <li><strong>Montant TTC :</strong> ${invoice.total.toFixed(2)} €</li>
        <li><strong>Montant payé :</strong> ${(invoice.paidAmount || 0).toFixed(2)} €</li>
        <li><strong>Reste à payer :</strong> ${(invoice.total - (invoice.paidAmount || 0)).toFixed(2)} €</li>
        <li><strong>Date d'échéance :</strong> ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/pro/invoices/${invoiceId}" style="background-color: #e67e22; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir la facture</a></p>
    </div>
  `;

  await sendEmail(
    invoice.order.customer.email,
    `Rappel: Échéance facture ${invoice.number}`,
    html
  );
}

export default {
  notifyProCustomerRegistration,
  notifyProCustomerApproved,
  notifyProCustomerRejected,
  notifyNewB2BOrder,
  notifyOrderStatusChange,
  notifyDeliveryComplete,
  notifyInvoiceGenerated,
  notifyInvoiceDueReminder,
};
