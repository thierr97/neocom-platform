import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Calculate margin for a product
export const calculateMargin = (costPrice: number, sellingPrice: number) => {
  const margin = sellingPrice - costPrice;
  const marginRate = costPrice > 0 ? (margin / costPrice) * 100 : 0;
  const markup = costPrice > 0 ? (margin / sellingPrice) * 100 : 0;

  return {
    margin,
    marginRate: Math.round(marginRate * 100) / 100,
    markup: Math.round(markup * 100) / 100,
  };
};

// Get product margins analysis
export const getProductMargins = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, supplierId, minMarginRate, maxMarginRate } = req.query;

    const where: any = {
      costPrice: { gt: 0 },
    };

    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
    });

    // Calculate margins for each product
    const productsWithMargins = products.map((product) => {
      const { margin, marginRate, markup } = calculateMargin(
        product.costPrice || 0,
        product.price
      );

      return {
        ...product,
        margin,
        marginRate,
        markup,
      };
    });

    // Filter by margin rate if specified
    let filtered = productsWithMargins;
    if (minMarginRate) {
      filtered = filtered.filter((p) => p.marginRate >= parseFloat(minMarginRate as string));
    }
    if (maxMarginRate) {
      filtered = filtered.filter((p) => p.marginRate <= parseFloat(maxMarginRate as string));
    }

    // Calculate statistics
    const totalProducts = filtered.length;
    const avgMarginRate =
      totalProducts > 0
        ? filtered.reduce((sum, p) => sum + p.marginRate, 0) / totalProducts
        : 0;
    const totalMargin = filtered.reduce((sum, p) => sum + p.margin, 0);

    res.json({
      success: true,
      data: {
        products: filtered,
        statistics: {
          totalProducts,
          avgMarginRate: Math.round(avgMarginRate * 100) / 100,
          totalMargin: Math.round(totalMargin * 100) / 100,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in getProductMargins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des marges',
      error: error.message,
    });
  }
};

// Get margin analysis by category
export const getMarginsByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        costPrice: { gt: 0 },
      },
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryMargins: any = {};

    products.forEach((product) => {
      const categoryName = product.category?.name || 'Sans catégorie';

      if (!categoryMargins[categoryName]) {
        categoryMargins[categoryName] = {
          category: product.category,
          totalProducts: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalMargin: 0,
          avgMarginRate: 0,
        };
      }

      const { margin } = calculateMargin(product.costPrice || 0, product.price);

      categoryMargins[categoryName].totalProducts += 1;
      categoryMargins[categoryName].totalRevenue += product.price * product.stock;
      categoryMargins[categoryName].totalCost += (product.costPrice || 0) * product.stock;
      categoryMargins[categoryName].totalMargin += margin * product.stock;
    });

    // Calculate average margin rates
    Object.keys(categoryMargins).forEach((key) => {
      const data = categoryMargins[key];
      data.avgMarginRate =
        data.totalCost > 0
          ? ((data.totalMargin / data.totalCost) * 100)
          : 0;
      data.avgMarginRate = Math.round(data.avgMarginRate * 100) / 100;
    });

    res.json({
      success: true,
      data: Object.values(categoryMargins),
    });
  } catch (error: any) {
    console.error('Error in getMarginsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse des marges par catégorie',
      error: error.message,
    });
  }
};

// AI-powered price suggestion
export const suggestPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { targetMarginRate, competitorPrices } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    const costPrice = product.costPrice || 0;

    if (costPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix de revient doit être défini pour calculer une suggestion',
      });
    }

    // Get similar products in the same category
    const similarProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        costPrice: { gt: 0 },
        id: { not: productId },
      },
      take: 10,
    });

    // Calculate average margin rate from similar products
    let avgMarginRate = 25; // Default 25%
    if (similarProducts.length > 0) {
      const totalMarginRate = similarProducts.reduce((sum, p) => {
        const { marginRate } = calculateMargin(p.costPrice || 0, p.price);
        return sum + marginRate;
      }, 0);
      avgMarginRate = totalMarginRate / similarProducts.length;
    }

    // Use target margin rate if provided, otherwise use average
    const appliedMarginRate = targetMarginRate || avgMarginRate;

    // Calculate suggested price based on target margin
    // marginRate = (price - cost) / cost * 100
    // price = cost * (1 + marginRate/100)
    const suggestedPrice = costPrice * (1 + appliedMarginRate / 100);

    // Factor in competitor prices if provided
    let competitorAnalysis: any = null;
    if (competitorPrices && competitorPrices.length > 0) {
      const avgCompetitorPrice =
        competitorPrices.reduce((sum: number, p: number) => sum + p, 0) / competitorPrices.length;
      const minCompetitorPrice = Math.min(...competitorPrices);
      const maxCompetitorPrice = Math.max(...competitorPrices);

      competitorAnalysis = {
        avgPrice: Math.round(avgCompetitorPrice * 100) / 100,
        minPrice: minCompetitorPrice,
        maxPrice: maxCompetitorPrice,
        suggestedPosition: 'COMPETITIVE',
      };

      // Adjust suggestion based on competitor prices
      if (suggestedPrice > maxCompetitorPrice) {
        competitorAnalysis.suggestedPosition = 'PREMIUM';
      } else if (suggestedPrice < minCompetitorPrice) {
        competitorAnalysis.suggestedPosition = 'LOW_COST';
      }
    }

    // Psychological pricing suggestions
    const psychologicalPrices = [
      Math.floor(suggestedPrice) - 0.01, // 99.99 effect
      Math.floor(suggestedPrice) + 0.49, // .49 effect
      Math.floor(suggestedPrice) + 0.95, // .95 effect
      Math.ceil(suggestedPrice / 5) * 5 - 0.01, // Round to nearest 5
      Math.ceil(suggestedPrice / 10) * 10 - 0.01, // Round to nearest 10
    ];

    // Calculate margins for each suggested price
    const priceOptions = [
      {
        type: 'CALCULATED',
        price: Math.round(suggestedPrice * 100) / 100,
        ...calculateMargin(costPrice, suggestedPrice),
      },
      ...psychologicalPrices.map((price) => ({
        type: 'PSYCHOLOGICAL',
        price: Math.round(price * 100) / 100,
        ...calculateMargin(costPrice, price),
      })),
    ].filter((option) => option.price > costPrice); // Only show profitable prices

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          costPrice,
          currentPrice: product.price,
          currentMargin: calculateMargin(costPrice, product.price),
        },
        suggestions: {
          appliedMarginRate: Math.round(appliedMarginRate * 100) / 100,
          categoryAvgMarginRate: Math.round(avgMarginRate * 100) / 100,
          priceOptions,
          competitorAnalysis,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in suggestPrice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suggestion de prix',
      error: error.message,
    });
  }
};

// Update product price with margin calculation
export const updateProductPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { price, costPrice } = req.body;

    const updateData: any = {};
    if (price !== undefined) updateData.price = parseFloat(price);
    if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        supplier: true,
      },
    });

    const marginData = calculateMargin(product.costPrice || 0, product.price);

    res.json({
      success: true,
      message: 'Prix mis à jour avec succès',
      data: {
        ...product,
        ...marginData,
      },
    });
  } catch (error: any) {
    console.error('Error in updateProductPrice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du prix',
      error: error.message,
    });
  }
};

// Bulk update prices with margin target
export const bulkUpdatePrices = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, targetMarginRate, adjustmentType } = req.body;

    if (!targetMarginRate || targetMarginRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le taux de marge cible doit être supérieur à 0',
      });
    }

    const where: any = { costPrice: { gt: 0 } };
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({ where });

    const updates = products.map(async (product) => {
      const costPrice = product.costPrice || 0;
      let newPrice = product.price;

      if (adjustmentType === 'SET_MARGIN') {
        // Set exact margin rate
        newPrice = costPrice * (1 + targetMarginRate / 100);
      } else if (adjustmentType === 'INCREASE_MARGIN') {
        // Increase margin by percentage
        newPrice = product.price * (1 + targetMarginRate / 100);
      }

      return prisma.product.update({
        where: { id: product.id },
        data: { price: Math.round(newPrice * 100) / 100 },
      });
    });

    await Promise.all(updates);

    res.json({
      success: true,
      message: `${products.length} produits mis à jour avec succès`,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Error in bulkUpdatePrices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour en masse',
      error: error.message,
    });
  }
};
