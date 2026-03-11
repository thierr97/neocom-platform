import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// GET /api/promo-banners - Récupérer toutes les bannières (ADMIN uniquement)
export const getAllPromoBanners = async (req: AuthRequest, res: Response) => {
  try {
    const banners = await prisma.promoBanner.findMany({
      orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    console.error('Error fetching promo banners:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bannières',
    });
  }
};

// GET /api/promo-banners/active - Récupérer la bannière active (PUBLIC)
export const getActiveBanner = async (req: AuthRequest, res: Response) => {
  try {
    const banner = await prisma.promoBanner.findFirst({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    res.json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    console.error('Error fetching active banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la bannière active',
    });
  }
};

// GET /api/promo-banners/:id - Récupérer une bannière par ID
export const getPromoBannerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée',
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    console.error('Error fetching promo banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la bannière',
    });
  }
};

// POST /api/promo-banners - Créer une nouvelle bannière
export const createPromoBanner = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      subtitle,
      discountText,
      emoji,
      endDate,
      endDateText,
      bgGradientFrom,
      bgGradientTo,
      badgeColor,
      textColor,
      isActive,
      priority,
    } = req.body;

    // Validation
    if (!title || !discountText) {
      return res.status(400).json({
        success: false,
        message: 'Le titre et le texte de réduction sont requis',
      });
    }

    // Si isActive = true, désactiver toutes les autres bannières
    if (isActive) {
      await prisma.promoBanner.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const banner = await prisma.promoBanner.create({
      data: {
        title,
        subtitle,
        discountText,
        emoji: emoji || '🎁',
        endDate: endDate ? new Date(endDate) : null,
        endDateText,
        bgGradientFrom: bgGradientFrom || 'bg-gradient-to-r from-blue-600',
        bgGradientTo: bgGradientTo || 'to-pink-600',
        badgeColor: badgeColor || 'bg-red-500',
        textColor: textColor || 'text-white',
        isActive: isActive || false,
        priority: priority || 0,
        createdBy: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Bannière créée avec succès',
      data: banner,
    });
  } catch (error: any) {
    console.error('Error creating promo banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la bannière',
    });
  }
};

// PUT /api/promo-banners/:id - Mettre à jour une bannière
export const updatePromoBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      discountText,
      emoji,
      endDate,
      endDateText,
      bgGradientFrom,
      bgGradientTo,
      badgeColor,
      textColor,
      isActive,
      priority,
    } = req.body;

    // Vérifier que la bannière existe
    const existingBanner = await prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée',
      });
    }

    // Si isActive = true, désactiver toutes les autres bannières
    if (isActive && !existingBanner.isActive) {
      await prisma.promoBanner.updateMany({
        where: {
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    const banner = await prisma.promoBanner.update({
      where: { id },
      data: {
        title,
        subtitle,
        discountText,
        emoji,
        endDate: endDate ? new Date(endDate) : null,
        endDateText,
        bgGradientFrom,
        bgGradientTo,
        badgeColor,
        textColor,
        isActive,
        priority,
      },
    });

    res.json({
      success: true,
      message: 'Bannière mise à jour avec succès',
      data: banner,
    });
  } catch (error: any) {
    console.error('Error updating promo banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la bannière',
    });
  }
};

// DELETE /api/promo-banners/:id - Supprimer une bannière
export const deletePromoBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée',
      });
    }

    await prisma.promoBanner.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Bannière supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting promo banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la bannière',
    });
  }
};

// PUT /api/promo-banners/:id/toggle - Activer/désactiver une bannière
export const togglePromoBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await prisma.promoBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée',
      });
    }

    const newActiveState = !banner.isActive;

    // Si on active, désactiver toutes les autres
    if (newActiveState) {
      await prisma.promoBanner.updateMany({
        where: {
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    const updatedBanner = await prisma.promoBanner.update({
      where: { id },
      data: { isActive: newActiveState },
    });

    res.json({
      success: true,
      message: `Bannière ${newActiveState ? 'activée' : 'désactivée'} avec succès`,
      data: updatedBanner,
    });
  } catch (error: any) {
    console.error('Error toggling promo banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut de la bannière',
    });
  }
};
