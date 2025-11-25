import prisma from '../config/database';

interface RecommendationScore {
  productId: string;
  score: number;
  reasons: string[];
}

export class AIService {
  /**
   * Get product recommendations for a customer
   */
  async getProductRecommendations(
    customerId: string,
    limit: number = 10
  ): Promise<any[]> {
    // Get customer's purchase history
    const customerOrders = await prisma.order.findMany({
      where: {
        customerId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract purchased product IDs and categories
    const purchasedProductIds = new Set<string>();
    const purchasedCategories = new Map<string, number>();

    customerOrders.forEach(order => {
      order.items.forEach(item => {
        purchasedProductIds.add(item.productId);

        if (item.product.categoryId) {
          const count = purchasedCategories.get(item.product.categoryId) || 0;
          purchasedCategories.set(item.product.categoryId, count + item.quantity);
        }
      });
    });

    // Get all active products
    const allProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock: { gt: 0 },
      },
      include: {
        category: true,
      },
    });

    // Score each product
    const scores: RecommendationScore[] = [];

    for (const product of allProducts) {
      // Skip already purchased products
      if (purchasedProductIds.has(product.id)) {
        continue;
      }

      let score = 0;
      const reasons: string[] = [];

      // Category affinity (40 points max)
      if (product.categoryId && purchasedCategories.has(product.categoryId)) {
        const categoryPurchases = purchasedCategories.get(product.categoryId) || 0;
        const categoryScore = Math.min(40, categoryPurchases * 10);
        score += categoryScore;
        reasons.push(`Catégorie préférée: ${product.category?.name}`);
      }

      // Price range affinity (20 points max)
      const avgPurchasePrice = this.getAveragePrice(customerOrders);
      if (avgPurchasePrice > 0) {
        const priceDiff = Math.abs(product.price - avgPurchasePrice) / avgPurchasePrice;
        if (priceDiff < 0.5) {
          score += 20;
          reasons.push('Prix dans votre gamme habituelle');
        } else if (priceDiff < 1) {
          score += 10;
        }
      }

      // Stock level bonus (10 points)
      if (product.stock > 50) {
        score += 10;
        reasons.push('Bien disponible en stock');
      } else if (product.stock > 20) {
        score += 5;
      }

      // Featured product bonus (15 points)
      if (product.isFeatured) {
        score += 15;
        reasons.push('Produit mis en avant');
      }

      // Popularity from other customers (20 points max)
      const popularityScore = await this.getProductPopularity(product.id);
      score += popularityScore;
      if (popularityScore > 10) {
        reasons.push('Populaire auprès d\'autres clients');
      }

      scores.push({
        productId: product.id,
        score,
        reasons,
      });
    }

    // Sort by score and get top recommendations
    scores.sort((a, b) => b.score - a.score);
    const topRecommendations = scores.slice(0, limit);

    // Get full product details
    const recommendations = await Promise.all(
      topRecommendations.map(async rec => {
        const product = await prisma.product.findUnique({
          where: { id: rec.productId },
          include: {
            category: true,
          },
        });

        return {
          ...product,
          recommendationScore: rec.score,
          recommendationReasons: rec.reasons,
        };
      })
    );

    return recommendations;
  }

  /**
   * Get similar products based on category, price, and attributes
   */
  async getSimilarProducts(productId: string, limit: number = 6): Promise<any[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return [];
    }

    const similarProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE',
        stock: { gt: 0 },
        OR: [
          // Same category
          { categoryId: product.categoryId },
          // Similar price range (±30%)
          {
            price: {
              gte: product.price * 0.7,
              lte: product.price * 1.3,
            },
          },
        ],
      },
      include: {
        category: true,
      },
      take: limit,
    });

    return similarProducts;
  }

  /**
   * Predict customer churn risk
   */
  async predictCustomerChurn(customerId: string): Promise<{
    churnRisk: 'low' | 'medium' | 'high';
    score: number;
    factors: string[];
  }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    let churnScore = 0;
    const factors: string[] = [];

    // Factor 1: Days since last order (40 points max)
    if (customer.orders.length > 0) {
      const lastOrder = customer.orders[0];
      const daysSinceLastOrder = Math.floor(
        (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastOrder > 180) {
        churnScore += 40;
        factors.push(`Pas de commande depuis ${daysSinceLastOrder} jours`);
      } else if (daysSinceLastOrder > 90) {
        churnScore += 25;
        factors.push('Inactif depuis plus de 3 mois');
      } else if (daysSinceLastOrder > 60) {
        churnScore += 10;
      }
    } else {
      churnScore += 50;
      factors.push('Aucune commande');
    }

    // Factor 2: Order frequency decline (30 points max)
    if (customer.orders.length >= 3) {
      const recent = customer.orders.slice(0, 3);
      const older = customer.orders.slice(3, 6);

      if (older.length > 0) {
        const recentAvg = this.getAverageTimeBetweenOrders(recent);
        const olderAvg = this.getAverageTimeBetweenOrders(older);

        if (recentAvg > olderAvg * 1.5) {
          churnScore += 30;
          factors.push('Fréquence de commande en baisse');
        } else if (recentAvg > olderAvg * 1.2) {
          churnScore += 15;
        }
      }
    }

    // Factor 3: Order value decline (20 points max)
    if (customer.orders.length >= 4) {
      const recentAvg = this.getAverageOrderValue(customer.orders.slice(0, 2));
      const olderAvg = this.getAverageOrderValue(customer.orders.slice(2, 4));

      if (recentAvg < olderAvg * 0.7) {
        churnScore += 20;
        factors.push('Montant des commandes en baisse');
      } else if (recentAvg < olderAvg * 0.85) {
        churnScore += 10;
      }
    }

    // Factor 4: Cancelled orders (10 points max)
    const cancelledCount = customer.orders.filter(o => o.status === 'CANCELLED').length;
    if (cancelledCount > 0) {
      churnScore += Math.min(10, cancelledCount * 5);
      factors.push(`${cancelledCount} commande(s) annulée(s)`);
    }

    // Determine risk level
    let churnRisk: 'low' | 'medium' | 'high';
    if (churnScore >= 60) {
      churnRisk = 'high';
    } else if (churnScore >= 30) {
      churnRisk = 'medium';
    } else {
      churnRisk = 'low';
    }

    return {
      churnRisk,
      score: churnScore,
      factors,
    };
  }

  /**
   * Predict optimal order quantity for a product
   */
  async predictOptimalOrderQuantity(productId: string): Promise<{
    recommendedQuantity: number;
    confidence: number;
    reasoning: string;
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get order history for this product
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        order: { createdAt: 'desc' },
      },
      take: 100,
    });

    if (orderItems.length === 0) {
      return {
        recommendedQuantity: 10,
        confidence: 0.3,
        reasoning: 'Pas d\'historique de ventes disponible',
      };
    }

    // Calculate average daily sales
    const oldestOrder = orderItems[orderItems.length - 1].order;
    const daysSinceFirstOrder = Math.max(
      1,
      Math.floor((Date.now() - oldestOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const avgDailySales = totalSold / daysSinceFirstOrder;

    // Lead time (assume 30 days for restocking)
    const leadTimeDays = 30;

    // Safety stock (20% buffer)
    const safetyBuffer = 1.2;

    // Calculate recommended quantity
    const recommendedQuantity = Math.ceil(avgDailySales * leadTimeDays * safetyBuffer);

    // Calculate confidence based on data quality
    let confidence = Math.min(1, orderItems.length / 50);
    if (daysSinceFirstOrder < 30) {
      confidence *= 0.7;
    }

    const reasoning = `Basé sur ${orderItems.length} ventes sur ${daysSinceFirstOrder} jours (${avgDailySales.toFixed(1)} ventes/jour). Inclut 20% de stock de sécurité pour 30 jours de délai.`;

    return {
      recommendedQuantity,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
    };
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 10): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get products with most sales in last 30 days
    const trendingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get full product details
    const products = await Promise.all(
      trendingProducts.map(async item => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true,
          },
        });

        return {
          ...product,
          totalSold: item._sum.quantity || 0,
          orderCount: item._count.id,
        };
      })
    );

    return products.filter(p => p.id); // Filter out any null products
  }

  // Helper methods

  private getAveragePrice(orders: any[]): number {
    if (orders.length === 0) return 0;

    let totalPrice = 0;
    let totalItems = 0;

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        totalPrice += item.unitPrice * item.quantity;
        totalItems += item.quantity;
      });
    });

    return totalItems > 0 ? totalPrice / totalItems : 0;
  }

  private async getProductPopularity(productId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderCount = await prisma.orderItem.count({
      where: {
        productId,
        order: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      },
    });

    return Math.min(20, orderCount * 2);
  }

  private getAverageTimeBetweenOrders(orders: any[]): number {
    if (orders.length < 2) return 0;

    let totalDays = 0;
    for (let i = 0; i < orders.length - 1; i++) {
      const diff = orders[i].createdAt.getTime() - orders[i + 1].createdAt.getTime();
      totalDays += diff / (1000 * 60 * 60 * 24);
    }

    return totalDays / (orders.length - 1);
  }

  private getAverageOrderValue(orders: any[]): number {
    if (orders.length === 0) return 0;

    const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    return total / orders.length;
  }
}

export default new AIService();
