import { PrismaClient } from '@prisma/client';

// Utiliser l'URL de production
const DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie!');
  console.log('Usage: PROD_DATABASE_URL="postgresql://..." npx ts-node update-emails-production.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function updateEmails() {
  console.log('🔄 Mise à jour des emails NEOCOM → NEOSERV en PRODUCTION...\n');
  console.log(`📊 Base de données: ${DATABASE_URL.split('@')[1]}\n`);

  try {
    // Liste des emails à mettre à jour
    const emailMappings = [
      { old: 'admin@neocom.com', new: 'admin@neoserv.com' },
      { old: 'commercial@neocom.com', new: 'commercial@neoserv.com' },
      { old: 'comptable@neocom.com', new: 'comptable@neoserv.com' },
      { old: 'livreur@neocom.com', new: 'livreur@neoserv.com' },
      { old: 'delivery@neocom.com', new: 'delivery@neoserv.com' },
      { old: 'accountant@neocom.com', new: 'accountant@neoserv.com' },
      { old: 'client@neocom.com', new: 'client@neoserv.com' },
      { old: 'contact@neocom.com', new: 'contact@neoserv.com' },
      { old: 'public@neocom.com', new: 'public@neoserv.com' },
    ];

    let updatedCount = 0;

    // Vérifier d'abord quels emails existent
    console.log('🔍 Vérification des emails existants...\n');
    for (const mapping of emailMappings) {
      const user = await prisma.user.findUnique({
        where: { email: mapping.old },
        select: { email: true, firstName: true, lastName: true, role: true },
      });

      if (user) {
        console.log(`   📧 Trouvé: ${mapping.old} (${user.role})`);
      }
    }

    console.log('\n🔄 Mise à jour en cours...\n');

    // Mettre à jour chaque email
    for (const mapping of emailMappings) {
      const result = await prisma.user.updateMany({
        where: { email: mapping.old },
        data: { email: mapping.new },
      });

      if (result.count > 0) {
        console.log(`✅ ${mapping.old} → ${mapping.new} (${result.count} utilisateur(s))`);
        updatedCount += result.count;
      }
    }

    console.log(`\n✅ Total: ${updatedCount} utilisateur(s) mis à jour`);

    // Afficher tous les emails actuels
    console.log('\n📧 Liste de TOUS les utilisateurs après mise à jour:\n');
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { email: 'asc' },
    });

    users.forEach((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(`   ${user.role.padEnd(12)} - ${user.email.padEnd(35)} - ${fullName}`);
    });

    console.log('\n✨ Mise à jour terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateEmails()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
