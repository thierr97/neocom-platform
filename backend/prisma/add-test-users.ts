import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ajout des utilisateurs de test manquants...');

  // Create Delivery User
  const deliveryPassword = await hashPassword('Livreur123!');

  const delivery = await prisma.user.upsert({
    where: { email: 'livreur@neoserv.com' },
    update: {},
    create: {
      email: 'livreur@neoserv.com',
      password: deliveryPassword,
      firstName: 'Marc',
      lastName: 'Livraison',
      phone: '+33 6 11 22 33 44',
      role: 'DELIVERY',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Livreur créé:', delivery.email);

  // Create Accountant User
  const accountantPassword = await hashPassword('Comptable123!');

  const accountant = await prisma.user.upsert({
    where: { email: 'comptable@neoserv.com' },
    update: {},
    create: {
      email: 'comptable@neoserv.com',
      password: accountantPassword,
      firstName: 'Marie',
      lastName: 'Comptabilité',
      phone: '+33 6 55 66 77 88',
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Comptable créé:', accountant.email);

  console.log('\n✨ Utilisateurs de test créés avec succès!\n');
  console.log('📧 Livreur: livreur@neoserv.com / Livreur123!');
  console.log('📧 Comptable: comptable@neoserv.com / Comptable123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
