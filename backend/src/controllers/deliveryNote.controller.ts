import { Request, Response } from 'express';

// Stub controller for delivery notes
// TODO: Implement full delivery notes functionality with database model

export const getAllDeliveryNotes = async (req: Request, res: Response) => {
  try {
    // Get userId from JWT token (set by auth middleware)
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Return empty array for now - delivery notes feature not yet implemented
    return res.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error('Error fetching delivery notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bons de livraison',
    });
  }
};

export const getDeliveryNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    return res.status(404).json({
      success: false,
      message: 'Bon de livraison non trouvé',
    });
  } catch (error: any) {
    console.error('Error getting delivery note:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du bon de livraison',
    });
  }
};
