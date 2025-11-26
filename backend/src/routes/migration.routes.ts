import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Route pour mettre à jour les emails @neocom vers @neoserv
router.post('/update-emails-to-neoserv', async (req, res) => {
  try {
    // Vérifier un secret pour la sécurité
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔄 Mise à jour des emails NEOCOM → NEOSERV...');

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

    const updates = [];
    let updatedCount = 0;

    // Mettre à jour chaque email
    for (const mapping of emailMappings) {
      const result = await prisma.user.updateMany({
        where: { email: mapping.old },
        data: { email: mapping.new },
      });

      if (result.count > 0) {
        updates.push({
          from: mapping.old,
          to: mapping.new,
          count: result.count
        });
        updatedCount += result.count;
      }
    }

    // Récupérer tous les utilisateurs après mise à jour
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { email: 'asc' },
    });

    res.json({
      success: true,
      message: `✅ ${updatedCount} utilisateur(s) mis à jour`,
      updates,
      totalUsers: users.length,
      users: users.map(u => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role
      }))
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour',
      details: error.message
    });
  }
});

// Route GET pour vérifier l'état actuel
router.get('/check-emails', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { email: 'asc' },
    });

    const neocomEmails = users.filter(u => u.email.includes('@neocom.com'));
    const neoservEmails = users.filter(u => u.email.includes('@neoserv.com'));

    res.json({
      totalUsers: users.length,
      neocomEmails: neocomEmails.length,
      neoservEmails: neoservEmails.length,
      neocomUsers: neocomEmails.map(u => u.email),
      neoservUsers: neoservEmails.map(u => u.email),
      allUsers: users.map(u => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
