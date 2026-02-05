import { config } from 'dotenv';
config(); // Load .env file

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Recherche d\'un client professionnel...');

    // Trouver un client professionnel (COMPANY)
    const customer = await prisma.customer.findFirst({
      where: {
        type: 'COMPANY',
      },
      include: {
        invoices: {
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            paidAmount: true,
          },
          take: 5,
        },
        orders: {
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
          },
          take: 5,
        },
      },
    });

    if (!customer) {
      console.log('❌ Aucun client professionnel trouvé');
      console.log('💡 Création d\'un client test...');

      const hashedPassword = await hashPassword('Client123!');

      const newCustomer = await prisma.customer.create({
        data: {
          type: 'COMPANY',
          companyName: 'Entreprise Test SAS',
          email: 'test@entreprise.com',
          password: hashedPassword,
          phone: '+33 1 23 45 67 89',
          address: '123 Rue du Commerce',
          city: 'Paris',
          postalCode: '75001',
          status: 'ACTIVE',
          userId: (await prisma.user.findFirst({ where: { role: 'COMMERCIAL' } }))!.id,
        },
      });

      console.log('\n✅ Client test créé avec succès!');
      console.log('\n📧 Email:', newCustomer.email);
      console.log('🔑 Mot de passe: Client123!');
      console.log('\n🔗 URL de connexion: http://localhost:3000/auth/customer-login');
      return;
    }

    // Si le client existe mais n'a pas de mot de passe, en créer un
    if (!customer.password) {
      console.log('⚠️  Client trouvé mais sans mot de passe. Création...');
      const hashedPassword = await hashPassword('Client123!');

      await prisma.customer.update({
        where: { id: customer.id },
        data: { password: hashedPassword },
      });

      console.log('✅ Mot de passe créé!');
    }

    console.log('\n✅ Identifiants client professionnel:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 Entreprise:', customer.companyName);
    console.log('📧 Email:', customer.email);
    console.log('🔑 Mot de passe: Client123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📊 Données client:');
    console.log(`   • ${customer.invoices.length} facture(s)`);
    customer.invoices.forEach((inv) => {
      const paid = inv.paidAmount || 0;
      const remaining = inv.total - paid;
      console.log(`     - ${inv.number}: ${inv.total}€ (${inv.status}) - Reste: ${remaining}€`);
    });

    console.log(`   • ${customer.orders.length} commande(s)`);
    customer.orders.forEach((ord) => {
      console.log(`     - ${ord.number}: ${ord.total}€ (${ord.status})`);
    });

    console.log('\n🔗 URL de connexion: http://localhost:3000/auth/customer-login');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
