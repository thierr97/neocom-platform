/**
 * Script pour réinitialiser le mot de passe admin
 */
import { config } from 'dotenv';
config(); // Charger les variables d'environnement

// Si DATABASE_URL n'est pas définie, utiliser celle de Render
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://neoserv_db_user:assRxjUUAKXl6YMcubLnc8dlH2lNWYXM@dpg-cu9cmo68ii6s73d7e6d0-a.oregon-postgres.render.com/neoserv_db';
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔄 Réinitialisation du mot de passe admin...');

    // Nouveau mot de passe
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Trouver l'utilisateur admin
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@neoserv.com',
      },
    });

    if (!admin) {
      console.log('❌ Utilisateur admin@neoserv.com introuvable');

      // Créer un nouvel admin
      console.log('📝 Création d\'un nouvel utilisateur admin...');
      await prisma.user.create({
        data: {
          email: 'admin@neoserv.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'NEOSERV',
          role: 'ADMIN',
        },
      });
      console.log('✅ Utilisateur admin créé avec succès');
    } else {
      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword },
      });
      console.log('✅ Mot de passe admin mis à jour');
    }

    console.log('\n📧 Email: admin@neoserv.com');
    console.log('🔑 Mot de passe: admin123');

    // Aussi réinitialiser le compte commercial
    const commercial = await prisma.user.findFirst({
      where: { email: 'commercial@neoserv.com' },
    });

    if (commercial) {
      const commercialPassword = await bcrypt.hash('commercial123', 10);
      await prisma.user.update({
        where: { id: commercial.id },
        data: { password: commercialPassword },
      });
      console.log('\n✅ Mot de passe commercial mis à jour');
      console.log('📧 Email: commercial@neoserv.com');
      console.log('🔑 Mot de passe: commercial123');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
