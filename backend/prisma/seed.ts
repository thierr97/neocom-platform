import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed de la base de données...');

  // Create Admin User
  const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'Admin123!');

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@neocom.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@neocom.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'NEOCOM',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Admin créé:', admin.email);

  // Create Commercial User
  const commercialPassword = await hashPassword('Commercial123!');

  const commercial = await prisma.user.upsert({
    where: { email: 'commercial@neocom.com' },
    update: {},
    create: {
      email: 'commercial@neocom.com',
      password: commercialPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33 6 12 34 56 78',
      role: 'COMMERCIAL',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Commercial créé:', commercial.email);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronique' },
      update: {},
      create: {
        name: 'Électronique',
        slug: 'electronique',
        description: 'Produits électroniques et high-tech',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'informatique' },
      update: {},
      create: {
        name: 'Informatique',
        slug: 'informatique',
        description: 'Ordinateurs, accessoires et logiciels',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'mobilier' },
      update: {},
      create: {
        name: 'Mobilier',
        slug: 'mobilier',
        description: 'Meubles de bureau et accessoires',
      },
    }),
  ]);

  console.log('✅ Catégories créées:', categories.length);

  // Create Sample Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'LAPTOP-001' },
      update: {},
      create: {
        sku: 'LAPTOP-001',
        barcode: '1234567890123',
        name: 'Ordinateur Portable Pro 15"',
        slug: 'ordinateur-portable-pro-15',
        description: 'Ordinateur portable professionnel 15 pouces avec processeur Intel Core i7',
        shortDescription: 'Laptop haute performance pour professionnels',
        price: 1299.99,
        costPrice: 899.99,
        compareAtPrice: 1499.99,
        stock: 50,
        minStock: 10,
        status: 'ACTIVE',
        isVisible: true,
        isFeatured: true,
        categoryId: categories[1].id,
        images: ['/images/products/laptop-pro.jpg'],
        thumbnail: '/images/products/laptop-pro-thumb.jpg',
        weight: 2.1,
        width: 35.5,
        height: 23.5,
        length: 2.0,
        tags: ['laptop', 'professionnel', 'intel'],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PHONE-001' },
      update: {},
      create: {
        sku: 'PHONE-001',
        barcode: '1234567890124',
        name: 'Smartphone X Pro',
        slug: 'smartphone-x-pro',
        description: 'Smartphone dernière génération avec écran OLED 6.5"',
        shortDescription: 'Smartphone haut de gamme',
        price: 899.99,
        costPrice: 599.99,
        compareAtPrice: 999.99,
        stock: 100,
        minStock: 20,
        status: 'ACTIVE',
        isVisible: true,
        isFeatured: true,
        categoryId: categories[0].id,
        images: ['/images/products/phone-x.jpg'],
        thumbnail: '/images/products/phone-x-thumb.jpg',
        weight: 0.195,
        tags: ['smartphone', 'mobile', '5g'],
      },
    }),
    prisma.product.upsert({
      where: { sku: 'DESK-001' },
      update: {},
      create: {
        sku: 'DESK-001',
        barcode: '1234567890125',
        name: 'Bureau Ergonomique Réglable',
        slug: 'bureau-ergonomique-reglable',
        description: 'Bureau réglable en hauteur électriquement pour un confort optimal',
        shortDescription: 'Bureau ergonomique électrique',
        price: 599.99,
        costPrice: 349.99,
        compareAtPrice: 699.99,
        stock: 25,
        minStock: 5,
        status: 'ACTIVE',
        isVisible: true,
        categoryId: categories[2].id,
        images: ['/images/products/desk-ergo.jpg'],
        thumbnail: '/images/products/desk-ergo-thumb.jpg',
        weight: 45.0,
        width: 140.0,
        height: 75.0,
        length: 80.0,
        tags: ['bureau', 'ergonomique', 'réglable'],
      },
    }),
  ]);

  console.log('✅ Produits créés:', products.length);

  // Create Sample Customer
  const customer = await prisma.customer.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      type: 'COMPANY',
      status: 'ACTIVE',
      companyName: 'Entreprise ABC SAS',
      siret: '12345678900123',
      vatNumber: 'FR12345678901',
      email: 'client@example.com',
      phone: '+33 1 23 45 67 89',
      mobile: '+33 6 98 76 54 32',
      address: '123 Avenue des Champs-Élysées',
      city: 'Paris',
      postalCode: '75008',
      country: 'France',
      userId: commercial.id,
      notes: 'Client important - Tarif préférentiel',
      tags: ['vip', 'france'],
    },
  });

  console.log('✅ Client exemple créé:', customer.companyName);

  // Create Sample Settings
  await prisma.settings.upsert({
    where: { key: 'company_name' },
    update: {},
    create: {
      key: 'company_name',
      value: 'NEOCOM',
      type: 'string',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'company_email' },
    update: {},
    create: {
      key: 'company_email',
      value: 'contact@neocom.com',
      type: 'string',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'tax_rate' },
    update: {},
    create: {
      key: 'tax_rate',
      value: '20',
      type: 'number',
    },
  });

  console.log('✅ Paramètres système créés');

  console.log('\n✨ Seed terminé avec succès!\n');
  console.log('📧 Admin: admin@neocom.com / Admin123!');
  console.log('📧 Commercial: commercial@neocom.com / Commercial123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
