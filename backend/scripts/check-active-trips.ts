import prisma from '../src/config/database';

async function checkActiveTrips() {
  try {
    console.log('🔍 Vérification des trajets actifs...\n');

    const activeTrips = await prisma.trip.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        checkpoints: {
          orderBy: { timestamp: 'desc' },
          take: 3,
        },
      },
    });

    console.log(`📊 Trajets IN_PROGRESS: ${activeTrips.length}\n`);

    if (activeTrips.length === 0) {
      console.log('❌ Aucun trajet actif trouvé\n');
      
      const recentTrips = await prisma.trip.findMany({
        where: {
          startTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          checkpoints: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      console.log(`📝 Trajets récents (24h): ${recentTrips.length}\n`);
      recentTrips.forEach((trip: any) => {
        console.log(`  - ${trip.user.firstName} ${trip.user.lastName}`);
        console.log(`    Status: ${trip.status}`);
        console.log(`    Début: ${trip.startTime}`);
        console.log(`    Checkpoints: ${trip.checkpoints.length}`);
        if (trip.checkpoints[0]) {
          console.log(`    Dernière position: ${trip.checkpoints[0].timestamp}`);
        }
        console.log('');
      });
    } else {
      activeTrips.forEach((trip: any) => {
        console.log(`✅ Trajet actif: ${trip.id}`);
        console.log(`   User: ${trip.user.firstName} ${trip.user.lastName}`);
        console.log(`   Début: ${trip.startTime}`);
        console.log(`   Checkpoints: ${trip.checkpoints.length}`);
        if (trip.checkpoints[0]) {
          console.log(`   Dernière position: ${trip.checkpoints[0].timestamp}`);
          console.log(`   Lat/Lng: ${trip.checkpoints[0].latitude}, ${trip.checkpoints[0].longitude}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActiveTrips();
