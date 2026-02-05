import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Recherche d\'un commercial...');
    const commercial = await prisma.user.findFirst({
      where: { role: 'COMMERCIAL' },
    });

    if (!commercial) {
      console.error('❌ Aucun commercial trouvé dans la base de données');
      console.log('💡 Créez d\'abord un utilisateur commercial depuis l\'interface admin');
      return;
    }

    console.log('✅ Commercial trouvé:', commercial.firstName, commercial.lastName);
    console.log('🔐 Hash du mot de passe...');
    const hashedPassword = await bcrypt.hash('Client123!', 10);

    console.log('👤 Création du client professionnel...\n');

    const customer = await prisma.customer.create({
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
        userId: commercial.id,
      },
    });

    console.log('✅ Client professionnel créé avec succès!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 Entreprise:', customer.companyName);
    console.log('📧 Email:', customer.email);
    console.log('🔑 Mot de passe: Client123!');
    console.log('📱 Téléphone:', customer.phone);
    console.log('📍 Adresse:', `${customer.address}, ${customer.postalCode} ${customer.city}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Vous pouvez maintenant vous connecter sur la page client!');
    console.log('🔗 URL: https://neocom-frontend.onrender.com/auth/customer-login');

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('\n💡 Le client existe déjà! Utilisez ces identifiants:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: test@entreprise.com');
      console.log('🔑 Mot de passe: Client123!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ Essayez de vous connecter avec ces identifiants!');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
