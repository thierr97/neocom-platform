import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création des utilisateurs de test manquants...');

  // Create Delivery User
  const deliveryPassword = await hashPassword('Delivery123!');

  const delivery = await prisma.user.upsert({
    where: { email: 'delivery@neoserv.com' },
    update: {
      password: deliveryPassword,
      role: 'DELIVERY',
      status: 'ACTIVE',
    },
    create: {
      email: 'delivery@neoserv.com',
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
  const accountantPassword = await hashPassword('Accountant123!');

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@neoserv.com' },
    update: {
      password: accountantPassword,
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
    create: {
      email: 'accountant@neoserv.com',
      password: accountantPassword,
      firstName: 'Marie',
      lastName: 'Comptabilité',
      phone: '+33 6 55 66 77 88',
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Comptable créé:', accountant.email);

  // Create Client User
  const clientPassword = await hashPassword('Client123!');

  const client = await prisma.user.upsert({
    where: { email: 'client@neoserv.com' },
    update: {
      password: clientPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
    },
    create: {
      email: 'client@neoserv.com',
      password: clientPassword,
      firstName: 'Sophie',
      lastName: 'Martin',
      phone: '+33 6 99 88 77 66',
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Client créé:', client.email);

  console.log('\n✨ Tous les utilisateurs de test sont prêts!\n');
  console.log('📧 Admin: admin@neoserv.com / Admin123!');
  console.log('📧 Commercial: commercial@neoserv.com / Commercial123!');
  console.log('📧 Delivery: delivery@neoserv.com / Delivery123!');
  console.log('📧 Accountant: accountant@neoserv.com / Accountant123!');
  console.log('📧 Client: client@neoserv.com / Client123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
