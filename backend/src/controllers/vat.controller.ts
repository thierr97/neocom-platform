import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getVatReport = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Année et mois sont requis',
      });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    // Date de début et de fin du mois
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Récupérer toutes les factures du mois
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['SENT', 'PAID'],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            type: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculer les totaux (toutes factures)
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    // Calculer les totaux encaissés (factures PAID uniquement)
    let paidHT = 0;
    let paidTVA = 0;
    let paidTTC = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    // Regrouper par taux de TVA
    const vatByRate: { [key: number]: { ht: number; tva: number; ttc: number; count: number } } = {};

    invoices.forEach((invoice) => {
      const ht = invoice.subtotal;
      const tva = invoice.taxAmount;
      const ttc = invoice.total;

      totalHT += ht;
      totalTVA += tva;
      totalTTC += ttc;

      // Séparer les factures payées
      if (invoice.status === 'PAID') {
        paidHT += ht;
        paidTVA += tva;
        paidTTC += ttc;
        paidCount++;
      } else {
        unpaidCount++;
      }

      // Calculer le taux de TVA moyen des items
      invoice.items.forEach((item) => {
        const rate = item.taxRate;
        if (!vatByRate[rate]) {
          vatByRate[rate] = { ht: 0, tva: 0, ttc: 0, count: 0 };
        }

        const itemHT = item.unitPrice * item.quantity * (1 - item.discount / 100);
        const itemTVA = itemHT * (rate / 100);
        const itemTTC = itemHT + itemTVA;

        vatByRate[rate].ht += itemHT;
        vatByRate[rate].tva += itemTVA;
        vatByRate[rate].ttc += itemTTC;
        vatByRate[rate].count += 1;
      });
    });

    // Récupérer les commandes du mois pour statistiques
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
    });

    let ordersHT = 0;
    let ordersTVA = 0;
    let ordersTTC = 0;

    orders.forEach((order) => {
      ordersHT += order.subtotal;
      ordersTVA += order.taxAmount;
      ordersTTC += order.total;
    });

    res.json({
      success: true,
      data: {
        period: {
          year: yearNum,
          month: monthNum,
          startDate,
          endDate,
        },
        summary: {
          invoices: {
            count: invoices.length,
            totalHT: Math.round(totalHT * 100) / 100,
            totalTVA: Math.round(totalTVA * 100) / 100,
            totalTTC: Math.round(totalTTC * 100) / 100,
            paidCount: paidCount,
            unpaidCount: unpaidCount,
            paidHT: Math.round(paidHT * 100) / 100,
            paidTVA: Math.round(paidTVA * 100) / 100,
            paidTTC: Math.round(paidTTC * 100) / 100,
          },
          orders: {
            count: orders.length,
            totalHT: Math.round(ordersHT * 100) / 100,
            totalTVA: Math.round(ordersTVA * 100) / 100,
            totalTTC: Math.round(ordersTTC * 100) / 100,
          },
          global: {
            totalHT: Math.round((totalHT + ordersHT) * 100) / 100,
            totalTVA: Math.round((totalTVA + ordersTVA) * 100) / 100,
            totalTTC: Math.round((totalTTC + ordersTTC) * 100) / 100,
          },
          encaisse: {
            caHT: Math.round(paidHT * 100) / 100,
            tvaPaid: Math.round(paidTVA * 100) / 100,
            caTTC: Math.round(paidTTC * 100) / 100,
            count: paidCount,
          },
        },
        vatByRate: Object.entries(vatByRate).map(([rate, data]) => ({
          rate: parseFloat(rate),
          ht: Math.round(data.ht * 100) / 100,
          tva: Math.round(data.tva * 100) / 100,
          ttc: Math.round(data.ttc * 100) / 100,
          count: data.count,
        })),
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          date: invoice.createdAt,
          customer: invoice.customer.type === 'COMPANY'
            ? invoice.customer.companyName
            : `${invoice.customer.firstName} ${invoice.customer.lastName}`,
          ht: Math.round(invoice.subtotal * 100) / 100,
          tva: Math.round(invoice.taxAmount * 100) / 100,
          ttc: Math.round(invoice.total * 100) / 100,
          status: invoice.status,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error in getVatReport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport de TVA',
      error: error.message,
    });
  }
};

export const getYearVatSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Année est requise',
      });
    }

    const yearNum = parseInt(year as string);
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);

    // Récupérer toutes les factures de l'année
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['SENT', 'PAID'],
        },
      },
    });

    // Regrouper par mois
    const monthlyData: { [key: number]: { ht: number; tva: number; ttc: number; count: number } } = {};

    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { ht: 0, tva: 0, ttc: 0, count: 0 };
    }

    invoices.forEach((invoice) => {
      const month = invoice.createdAt.getMonth() + 1;
      monthlyData[month].ht += invoice.subtotal;
      monthlyData[month].tva += invoice.taxAmount;
      monthlyData[month].ttc += invoice.total;
      monthlyData[month].count += 1;
    });

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    res.json({
      success: true,
      data: {
        year: yearNum,
        months: Object.entries(monthlyData).map(([month, data]) => ({
          month: parseInt(month),
          monthName: monthNames[parseInt(month) - 1],
          ht: Math.round(data.ht * 100) / 100,
          tva: Math.round(data.tva * 100) / 100,
          ttc: Math.round(data.ttc * 100) / 100,
          count: data.count,
        })),
        yearTotal: {
          ht: Math.round(Object.values(monthlyData).reduce((sum, m) => sum + m.ht, 0) * 100) / 100,
          tva: Math.round(Object.values(monthlyData).reduce((sum, m) => sum + m.tva, 0) * 100) / 100,
          ttc: Math.round(Object.values(monthlyData).reduce((sum, m) => sum + m.ttc, 0) * 100) / 100,
          count: Object.values(monthlyData).reduce((sum, m) => sum + m.count, 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Error in getYearVatSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du résumé annuel de TVA',
      error: error.message,
    });
  }
};
