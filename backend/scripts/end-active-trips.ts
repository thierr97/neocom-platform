/**
 * Script pour terminer tous les trajets actifs
 * Utile quand un trajet n'a pas été terminé correctement
 */
import prisma from '../src/config/database';

async function endActiveTrips() {
  try {
    console.log('🔍 Recherche des trajets actifs...');

    const activeTrips = await prisma.trip.findMany({
      where: { status: 'IN_PROGRESS' },
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

    console.log(`📊 Trajets actifs trouvés: ${activeTrips.length}\n`);

    if (activeTrips.length === 0) {
      console.log('✅ Aucun trajet actif à terminer');
      return;
    }

    for (const trip of activeTrips) {
      console.log(`📍 Trajet: ${trip.id}`);
      console.log(`   User: ${trip.user.firstName} ${trip.user.lastName} (${trip.user.email})`);
      console.log(`   Démarré: ${trip.startTime}`);
      console.log(`   Objectif: ${trip.purpose}`);

      await prisma.trip.update({
        where: { id: trip.id },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
          endLatitude: trip.startLatitude,
          endLongitude: trip.startLongitude,
          endAddress: trip.startAddress || 'Position de fin',
        },
      });

      console.log(`   ✅ Trajet terminé\n`);
    }

    console.log(`🎉 ${activeTrips.length} trajet(s) terminé(s) avec succès`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
endActiveTrips()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
