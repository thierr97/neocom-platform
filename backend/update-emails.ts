import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmails() {
  console.log('🔄 Mise à jour des emails NEOCOM → NEOSERV...\n');

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

    // Mettre à jour les settings si nécessaire
    const settingsResult = await prisma.settings.updateMany({
      where: { value: { contains: '@neocom.com' } },
      data: {}, // On va faire une requête brute pour le remplacement
    });

    console.log(`\n✅ Total: ${updatedCount} utilisateur(s) mis à jour`);

    // Afficher tous les emails actuels
    console.log('\n📧 Liste des utilisateurs après mise à jour:');
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { email: 'asc' },
    });

    users.forEach((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(`   ${user.role.padEnd(12)} - ${user.email.padEnd(30)} - ${fullName}`);
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
