import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/settings/company
 * Récupère les informations de l'entreprise
 */
router.get('/company', async (req: AuthRequest, res: Response) => {
  try {
    // Récupérer tous les settings de l'entreprise
    const companySettings = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: 'company_'
        }
      }
    });

    // Transformer en objet
    const company: any = {};
    companySettings.forEach(setting => {
      const key = setting.key.replace('company_', '');
      company[key] = setting.value;
    });

    res.json({
      success: true,
      company
    });

  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations',
      error: error.message
    });
  }
});

/**
 * PUT /api/settings/company
 * Met à jour les informations de l'entreprise (Admin seulement)
 */
router.put('/company', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;

    // Liste des champs autorisés
    const allowedFields = [
      'name',
      'legalForm',
      'siret',
      'vatNumber',
      'address',
      'addressLine2',
      'postalCode',
      'city',
      'country',
      'region',
      'phone',
      'mobile',
      'email',
      'website',
      'capital',
      'rcs',
      'description'
    ];

    // Mettre à jour chaque champ
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        await prisma.settings.upsert({
          where: {
            key: `company_${key}`
          },
          update: {
            value: String(value),
            updatedAt: new Date()
          },
          create: {
            key: `company_${key}`,
            value: String(value),
            type: 'string'
          }
        });
      }
    }

    // Récupérer les nouvelles valeurs
    const companySettings = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: 'company_'
        }
      }
    });

    const company: any = {};
    companySettings.forEach(setting => {
      const key = setting.key.replace('company_', '');
      company[key] = setting.value;
    });

    res.json({
      success: true,
      message: 'Informations mises à jour avec succès',
      company
    });

  } catch (error: any) {
    console.error('Error updating company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
});

export default router;
