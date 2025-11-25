import { Request, Response } from 'express';
import aiService from '../services/ai.service';
import prisma from '../config/database';

/**
 * Get product recommendations for a customer
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    const recommendations = await aiService.getProductRecommendations(customerId, limit);

    return res.json({
      success: true,
      data: recommendations,
      message: `${recommendations.length} produits recommandés`,
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des recommandations',
      error: error.message,
    });
  }
};

/**
 * Get similar products
 */
export const getSimilarProducts = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 6;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    const similarProducts = await aiService.getSimilarProducts(productId, limit);

    return res.json({
      success: true,
      data: similarProducts,
      message: `${similarProducts.length} produits similaires trouvés`,
    });
  } catch (error: any) {
    console.error('Error getting similar products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de produits similaires',
      error: error.message,
    });
  }
};

/**
 * Predict customer churn risk
 */
export const predictChurn = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    const churnPrediction = await aiService.predictCustomerChurn(customerId);

    return res.json({
      success: true,
      data: churnPrediction,
      message: 'Analyse de risque de désengagement effectuée',
    });
  } catch (error: any) {
    console.error('Error predicting churn:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse de risque',
      error: error.message,
    });
  }
};

/**
 * Get batch churn predictions for multiple customers
 */
export const batchPredictChurn = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Get all customers
    const customers = await prisma.customer.findMany({
      take: limit,
    });

    // Get churn predictions for each
    const predictions = await Promise.all(
      customers.map(async customer => {
        const prediction = await aiService.predictCustomerChurn(customer.id);
        return {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          companyName: customer.companyName,
          email: customer.email,
          ...prediction,
        };
      })
    );

    // Sort by churn risk (high to low)
    const riskOrder = { high: 3, medium: 2, low: 1 };
    predictions.sort((a, b) => riskOrder[b.churnRisk] - riskOrder[a.churnRisk]);

    return res.json({
      success: true,
      data: predictions,
      summary: {
        total: predictions.length,
        high: predictions.filter(p => p.churnRisk === 'high').length,
        medium: predictions.filter(p => p.churnRisk === 'medium').length,
        low: predictions.filter(p => p.churnRisk === 'low').length,
      },
      message: 'Analyse de risque effectuée',
    });
  } catch (error: any) {
    console.error('Error in batch churn prediction:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse batch',
      error: error.message,
    });
  }
};

/**
 * Predict optimal order quantity for a product
 */
export const predictOrderQuantity = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    const prediction = await aiService.predictOptimalOrderQuantity(productId);

    return res.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        currentStock: product.stock,
        ...prediction,
      },
      message: 'Prédiction de quantité effectuée',
    });
  } catch (error: any) {
    console.error('Error predicting order quantity:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la prédiction de quantité',
      error: error.message,
    });
  }
};

/**
 * Get trending products
 */
export const getTrendingProducts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const trendingProducts = await aiService.getTrendingProducts(limit);

    return res.json({
      success: true,
      data: trendingProducts,
      message: `${trendingProducts.length} produits tendance trouvés`,
    });
  } catch (error: any) {
    console.error('Error getting trending products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de produits tendance',
      error: error.message,
    });
  }
};

/**
 * Get AI insights dashboard
 */
export const getAIInsights = async (req: Request, res: Response) => {
  try {
    // Get trending products
    const trending = await aiService.getTrendingProducts(5);

    // Get high-risk churn customers
    const customers = await prisma.customer.findMany({
      take: 20,
    });

    const churnPredictions = await Promise.all(
      customers.map(async customer => {
        const prediction = await aiService.predictCustomerChurn(customer.id);
        return {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          companyName: customer.companyName,
          ...prediction,
        };
      })
    );

    const highRiskCustomers = churnPredictions
      .filter(p => p.churnRisk === 'high')
      .slice(0, 5);

    // Get products needing restock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lt: 20 },
      },
      include: {
        category: true,
      },
      take: 10,
    });

    const restockPredictions = await Promise.all(
      lowStockProducts.map(async product => {
        const prediction = await aiService.predictOptimalOrderQuantity(product.id);
        return {
          ...product,
          ...prediction,
        };
      })
    );

    return res.json({
      success: true,
      data: {
        trendingProducts: trending,
        highRiskCustomers: highRiskCustomers,
        restockRecommendations: restockPredictions,
      },
      message: 'Insights IA générés',
    });
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des insights',
      error: error.message,
    });
  }
};
