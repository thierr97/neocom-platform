import { Request, Response } from 'express';
import prisma from '../config/database';

// Récupérer la bannière active (pour le frontend public)
export const getActiveBanner = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const banner = await prisma.shopBanner.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } }
            ]
          },
          {
            AND: [
              { startDate: null },
              { endDate: null }
            ]
          },
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: null }
            ]
          },
          {
            AND: [
              { startDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: {
        priority: 'asc' // Bannière avec la plus haute priorité
      }
    });

    res.json({
      success: true,
      data: banner
    });
  } catch (error: any) {
    console.error('Error getting active banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la bannière active',
      error: error.message
    });
  }
};

// Récupérer toutes les bannières (admin)
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await prisma.shopBanner.findMany({
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: banners
    });
  } catch (error: any) {
    console.error('Error getting all banners:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bannières',
      error: error.message
    });
  }
};

// Récupérer une bannière par ID
export const getBannerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await prisma.shopBanner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière introuvable'
      });
    }

    res.json({
      success: true,
      data: banner
    });
  } catch (error: any) {
    console.error('Error getting banner by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la bannière',
      error: error.message
    });
  }
};

// Créer une nouvelle bannière (admin)
export const createBanner = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const bannerData = req.body;

    // Parser les dates si elles sont fournies
    if (bannerData.startDate) {
      bannerData.startDate = new Date(bannerData.startDate);
    }
    if (bannerData.endDate) {
      bannerData.endDate = new Date(bannerData.endDate);
    }

    const banner = await prisma.shopBanner.create({
      data: {
        ...bannerData,
        createdBy: userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bannière créée avec succès',
      data: banner
    });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la bannière',
      error: error.message
    });
  }
};

// Mettre à jour une bannière (admin)
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bannerData = req.body;

    // Parser les dates si elles sont fournies
    if (bannerData.startDate) {
      bannerData.startDate = new Date(bannerData.startDate);
    }
    if (bannerData.endDate) {
      bannerData.endDate = new Date(bannerData.endDate);
    }

    // Supprimer les champs qui ne doivent pas être mis à jour
    delete bannerData.id;
    delete bannerData.createdAt;
    delete bannerData.createdBy;

    const banner = await prisma.shopBanner.update({
      where: { id },
      data: bannerData
    });

    res.json({
      success: true,
      message: 'Bannière mise à jour avec succès',
      data: banner
    });
  } catch (error: any) {
    console.error('Error updating banner:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Bannière introuvable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la bannière',
      error: error.message
    });
  }
};

// Activer/désactiver une bannière (admin)
export const toggleBannerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await prisma.shopBanner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière introuvable'
      });
    }

    const updatedBanner = await prisma.shopBanner.update({
      where: { id },
      data: {
        isActive: !banner.isActive
      }
    });

    res.json({
      success: true,
      message: `Bannière ${updatedBanner.isActive ? 'activée' : 'désactivée'} avec succès`,
      data: updatedBanner
    });
  } catch (error: any) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut de la bannière',
      error: error.message
    });
  }
};

// Supprimer une bannière (admin)
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.shopBanner.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Bannière supprimée avec succès'
    });
  } catch (error: any) {
    console.error('Error deleting banner:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Bannière introuvable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la bannière',
      error: error.message
    });
  }
};
