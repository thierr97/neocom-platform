import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed des comptes comptables du Plan Comptable Général (PCG) français
 * Nécessaire pour le système de comptabilité automatique
 */

const accountingAccounts = [
  // CLASSE 1 - CAPITAUX PERMANENTS
  {
    code: '101000',
    name: 'Capital social',
    type: 'EQUITY' as AccountType,
  },

  // CLASSE 4 - COMPTES DE TIERS
  {
    code: '401000',
    name: 'Fournisseurs',
    type: 'LIABILITY' as AccountType,
  },
  {
    code: '411000',
    name: 'Clients',
    type: 'ASSET' as AccountType,
  },
  {
    code: '445660',
    name: 'TVA déductible',
    type: 'ASSET' as AccountType,
  },
  {
    code: '445710',
    name: 'TVA collectée',
    type: 'LIABILITY' as AccountType,
  },

  // CLASSE 5 - COMPTES FINANCIERS
  {
    code: '512000',
    name: 'Banque',
    type: 'ASSET' as AccountType,
  },
  {
    code: '530000',
    name: 'Caisse',
    type: 'ASSET' as AccountType,
  },

  // CLASSE 6 - COMPTES DE CHARGES
  {
    code: '607000',
    name: 'Achats de marchandises',
    type: 'EXPENSE' as AccountType,
  },
  {
    code: '624000',
    name: 'Transport',
    type: 'EXPENSE' as AccountType,
  },
  {
    code: '626000',
    name: 'Frais postaux et de télécommunications',
    type: 'EXPENSE' as AccountType,
  },
  {
    code: '641000',
    name: 'Rémunération du personnel',
    type: 'EXPENSE' as AccountType,
  },

  // CLASSE 7 - COMPTES DE PRODUITS
  {
    code: '707000',
    name: 'Ventes de marchandises',
    type: 'REVENUE' as AccountType,
  },
  {
    code: '708000',
    name: 'Produits des activités annexes',
    type: 'REVENUE' as AccountType,
  },

  // CLASSE 3 - COMPTES DE STOCKS
  {
    code: '370000',
    name: 'Stocks de marchandises',
    type: 'ASSET' as AccountType,
  },
];

async function main() {
  console.log('🌱 Seed des comptes comptables...');

  for (const account of accountingAccounts) {
    const existing = await prisma.accountingAccount.findUnique({
      where: { code: account.code },
    });

    if (existing) {
      console.log(`✓ Compte ${account.code} - ${account.name} existe déjà`);
      continue;
    }

    await prisma.accountingAccount.create({
      data: account,
    });

    console.log(`✅ Créé: ${account.code} - ${account.name}`);
  }

  console.log('\n✅ Seed des comptes comptables terminé!');
  console.log(`📊 Total: ${accountingAccounts.length} comptes`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
