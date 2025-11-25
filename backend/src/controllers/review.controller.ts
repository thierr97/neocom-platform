import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Get reviews for a product (published only for public)
 */
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isPublished: true,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Count total
    const total = await prisma.review.count({
      where: {
        productId,
        isPublished: true,
      },
    });

    // Calculate stats
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        isPublished: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Count by rating
    const ratingDistribution = await Promise.all(
      [5, 4, 3, 2, 1].map(async (rating) => {
        const count = await prisma.review.count({
          where: {
            productId,
            isPublished: true,
            rating,
          },
        });
        return { rating, count };
      })
    );

    return res.json({
      success: true,
      data: {
        reviews,
        stats: {
          average: stats._avg.rating || 0,
          total: stats._count.rating,
          distribution: ratingDistribution,
        },
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting product reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message,
    });
  }
};

/**
 * Create a new review (public endpoint)
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, customerName, customerEmail, customerId } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 1 et 5',
      });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Le commentaire doit contenir au moins 10 caractères',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    // Check if customer has already reviewed this product
    if (customerId) {
      const existingReview = await prisma.review.findFirst({
        where: {
          productId,
          customerId,
        },
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà laissé un avis pour ce produit',
        });
      }
    }

    // Check if customer has purchased this product (if customerId provided)
    let isVerified = false;
    if (customerId) {
      const purchase = await prisma.orderItem.findFirst({
        where: {
          productId,
          order: {
            customerId,
            status: { in: ['DELIVERED', 'CONFIRMED'] },
          },
        },
      });
      isVerified = !!purchase;
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        customerId: customerId || null,
        rating: parseInt(rating),
        title: title || null,
        comment: comment.trim(),
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        isVerified,
        isApproved: false, // Requires moderation
        isPublished: false, // Not published until approved
      },
    });

    return res.status(201).json({
      success: true,
      data: review,
      message: 'Avis soumis avec succès. Il sera publié après modération.',
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis',
      error: error.message,
    });
  }
};

/**
 * Get all reviews (admin only - includes unpublished)
 */
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    if (status === 'pending') {
      where.isApproved = false;
    } else if (status === 'approved') {
      where.isApproved = true;
      where.isPublished = true;
    } else if (status === 'rejected') {
      where.isApproved = false;
      where.isPublished = false;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.review.count({ where });

    return res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error getting all reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message,
    });
  }
};

/**
 * Update review status (admin only)
 */
export const updateReviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved, isPublished } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: {
        isApproved: isApproved !== undefined ? isApproved : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: review,
      message: 'Statut de l\'avis mis à jour',
    });
  } catch (error: any) {
    console.error('Error updating review status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message,
    });
  }
};

/**
 * Delete a review (admin only)
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Avis supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis',
      error: error.message,
    });
  }
};

/**
 * Get review statistics (admin only)
 */
export const getReviewStatistics = async (req: Request, res: Response) => {
  try {
    const totalReviews = await prisma.review.count();
    const publishedReviews = await prisma.review.count({
      where: { isPublished: true },
    });
    const pendingReviews = await prisma.review.count({
      where: { isApproved: false },
    });
    const verifiedReviews = await prisma.review.count({
      where: { isVerified: true },
    });

    const averageRating = await prisma.review.aggregate({
      where: { isPublished: true },
      _avg: {
        rating: true,
      },
    });

    // Reviews per product (top 10)
    const reviewsPerProduct = await prisma.review.groupBy({
      by: ['productId'],
      where: { isPublished: true },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const topProducts = await Promise.all(
      reviewsPerProduct.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true },
        });
        return {
          product,
          reviewCount: item._count.id,
        };
      })
    );

    return res.json({
      success: true,
      data: {
        total: totalReviews,
        published: publishedReviews,
        pending: pendingReviews,
        verified: verifiedReviews,
        averageRating: averageRating._avg.rating || 0,
        topProducts,
      },
    });
  } catch (error: any) {
    console.error('Error getting review statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};
