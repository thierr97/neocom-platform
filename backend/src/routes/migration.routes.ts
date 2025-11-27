import { Router } from 'express';
import prisma from '../config/database';

const router = Router();

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

// Route pour ajouter la colonne availabilityStatus
router.post('/add-availability-status', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔄 Ajout de la colonne availabilityStatus...');

    // Créer le type ENUM s'il n'existe pas
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON', 'DISCONTINUED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Ajouter la colonne avec une valeur par défaut
    await prisma.$executeRaw`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS "availabilityStatus" "AvailabilityStatus" DEFAULT 'AVAILABLE';
    `;

    // Compter les produits
    const result: any = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM products`;

    res.json({
      success: true,
      message: '✅ Colonne availabilityStatus ajoutée avec succès',
      productCount: result[0]?.count || 0
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la migration',
      details: error.message
    });
  }
});

// Route pour ajouter le champ searchTerms et générer les termes
router.post('/add-search-terms', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔄 Ajout de la colonne searchTerms...');

    // Ajouter la colonne searchTerms
    await prisma.$executeRaw`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS "searchTerms" text[] DEFAULT ARRAY[]::text[];
    `;

    const result: any = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM products`;

    res.json({
      success: true,
      message: '✅ Colonne searchTerms ajoutée avec succès',
      productCount: result[0]?.count || 0,
      note: 'Exécutez maintenant: npx ts-node generate-search-terms.ts pour générer les termes'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la migration',
      details: error.message
    });
  }
});

// Route pour générer les termes de recherche
router.post('/generate-search-terms', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔍 Génération des termes de recherche...');

    // Dictionnaire de synonymes (version simplifié)
    const synonyms: Record<string, string[]> = {
      'valise': ['bagage', 'sac', 'bagagerie', 'trolley'],
      'bagage': ['valise', 'sac'],
      'cadenas': ['serrure', 'securite'],
      'balance': ['pese', 'mesure'],
      'tapis': ['paillasson'],
      'noir': ['black', 'fonce'],
      'blanc': ['white', 'clair'],
      'bleu': ['blue']
    };

    // Fonction pour normaliser
    const normalize = (text: string) => text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    // Récupérer les produits
    const products = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, description: true, tags: true }
    });

    let updated = 0;

    for (const product of products) {
      const terms = new Set<string>();

      // Mots du nom
      const nameWords = normalize(product.name).split(' ').filter(w => w.length > 2);
      nameWords.forEach(word => {
        terms.add(word);
        if (synonyms[word]) {
          synonyms[word].forEach(syn => terms.add(syn));
        }
      });

      // Mots de la description
      if (product.description) {
        const descWords = normalize(product.description).split(' ').filter(w => w.length > 2);
        descWords.slice(0, 10).forEach(word => terms.add(word));
      }

      // SKU
      if (product.sku) {
        terms.add(normalize(product.sku));
      }

      // Tags
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach((tag: string) => terms.add(normalize(tag)));
      }

      const searchTerms = Array.from(terms).filter(t => t.length > 2);

      await prisma.$executeRaw`
        UPDATE products
        SET "searchTerms" = ${searchTerms}::text[]
        WHERE id = ${product.id}
      `;

      updated++;

      if (updated % 100 === 0) {
        console.log(`✓ ${updated}/${products.length} produits traités...`);
      }
    }

    res.json({
      success: true,
      message: `✅ ${updated} produits mis à jour avec leurs termes de recherche`,
      productCount: updated
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération des termes',
      details: error.message
    });
  }
});

export default router;
