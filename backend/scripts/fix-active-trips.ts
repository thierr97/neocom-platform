import { PrismaClient, TripStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function fixActiveTrips() {
  try {
    console.log('🔍 Recherche des trajets IN_PROGRESS...');

    const activeTrips = await prisma.trip.findMany({
      where: {
        status: TripStatus.IN_PROGRESS,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`📊 ${activeTrips.length} trajets IN_PROGRESS trouvés`);

    if (activeTrips.length === 0) {
      console.log('✅ Aucun trajet à corriger');
      return;
    }

    // Afficher les trajets trouvés
    activeTrips.forEach((trip, index) => {
      console.log(`\n${index + 1}. Trajet ${trip.id}`);
      console.log(`   Utilisateur: ${trip.user.email}`);
      console.log(`   Démarré: ${trip.startTime}`);
    });

    console.log('\n🔧 Mise à jour des trajets...');

    // Terminer tous les trajets actifs
    const result = await prisma.trip.updateMany({
      where: {
        status: TripStatus.IN_PROGRESS,
      },
      data: {
        status: TripStatus.COMPLETED,
        endTime: new Date(),
      },
    });

    console.log(`✅ ${result.count} trajets terminés avec succès`);
    console.log('🎉 Les utilisateurs peuvent maintenant démarrer de nouveaux trajets');
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixActiveTrips()
  .then(() => {
    console.log('\n✨ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Le script a échoué:', error);
    process.exit(1);
  });
