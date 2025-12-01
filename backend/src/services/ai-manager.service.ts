import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/database';

interface AITask {
  type: 'content_update' | 'product_optimization' | 'inventory_check' | 'customer_insight' | 'site_monitoring';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: any;
}

interface AIDecision {
  task: AITask;
  action: string;
  reasoning: string;
  confidence: number;
  suggestedChanges?: any;
}

/**
 * AI Manager Service - Intelligent site management with Claude AI
 */
export class AIManagerService {
  private anthropic: Anthropic;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.isEnabled = !!apiKey;

    if (this.isEnabled) {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Analyze site content and suggest improvements
   */
  async analyzeSiteContent(): Promise<AIDecision[]> {
    if (!this.isEnabled) {
      throw new Error('AI Manager is not enabled. Set ANTHROPIC_API_KEY.');
    }

    const decisions: AIDecision[] = [];

    // 1. Check product descriptions
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { description: null },
          { description: { equals: '' } },
        ],
      },
      take: 10,
    });

    if (products.length > 0) {
      decisions.push({
        task: {
          type: 'content_update',
          priority: 'medium',
          description: `${products.length} produits sans description`,
          metadata: { productIds: products.map(p => p.id) },
        },
        action: 'generate_descriptions',
        reasoning: 'Les descriptions de produits améliorent le SEO et les conversions',
        confidence: 0.95,
      });
    }

    // 2. Check company settings (commented out as model may not exist)
    // const settings = await prisma.companySettings.findFirst();
    // if (!settings || !settings.description) {
    //   decisions.push({
    //     task: {
    //       type: 'content_update',
    //       priority: 'high',
    //       description: 'Description de l\'entreprise manquante',
    //     },
    //     action: 'update_company_info',
    //     reasoning: 'La description de l\'entreprise est essentielle pour le SEO',
    //     confidence: 0.98,
    //   });
    // }

    return decisions;
  }

  /**
   * Generate optimized product descriptions using AI
   */
  async generateProductDescription(productId: string): Promise<string> {
    if (!this.isEnabled) {
      throw new Error('AI Manager is not enabled. Set ANTHROPIC_API_KEY.');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const prompt = `Tu es un expert en rédaction de fiches produits e-commerce pour une entreprise en Guadeloupe (NEOSERV).

Produit:
- Nom: ${product.name}
- SKU: ${product.sku}
- Catégorie: ${product.category?.name || 'Non catégorisé'}
- Prix: ${product.price} €

Génère une description de produit professionnelle, attrayante et optimisée pour le SEO:
- 2-3 paragraphes
- Met en avant les avantages et caractéristiques
- Utilise un ton professionnel mais accessible
- Inclus des mots-clés pertinents
- Adapté au marché guadeloupéen
- En français`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const description = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Update product with generated description
    await prisma.product.update({
      where: { id: productId },
      data: { description },
    });

    return description;
  }

  /**
   * Analyze inventory and suggest reordering
   */
  async analyzeInventory(): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock: { lte: 10 },
      },
      include: { category: true },
    });

    for (const product of lowStockProducts) {
      // Get sales history
      const salesData = await prisma.orderItem.findMany({
        where: {
          productId: product.id,
          order: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        },
      });

      const totalSold = salesData.reduce((sum, item) => sum + item.quantity, 0);
      const avgDailySales = totalSold / 90;

      let priority: 'low' | 'medium' | 'high' | 'critical';
      if (product.stock < 5 && avgDailySales > 1) {
        priority = 'critical';
      } else if (product.stock < 10 && avgDailySales > 0.5) {
        priority = 'high';
      } else if (avgDailySales > 0.2) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      decisions.push({
        task: {
          type: 'inventory_check',
          priority,
          description: `Stock faible pour ${product.name}`,
          metadata: {
            productId: product.id,
            currentStock: product.stock,
            avgDailySales,
          },
        },
        action: 'reorder_product',
        reasoning: `Ventes moyennes: ${avgDailySales.toFixed(2)}/jour. Stock actuel: ${product.stock}`,
        confidence: 0.85,
        suggestedChanges: {
          recommendedOrderQuantity: Math.ceil(avgDailySales * 60), // 60 days supply
        },
      });
    }

    return decisions;
  }

  /**
   * Monitor site performance and suggest optimizations
   */
  async monitorSitePerformance(): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    // Check products without images
    const productsWithoutImages = await prisma.product.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { images: { isEmpty: true } },
          { thumbnail: null },
        ],
      },
    });

    if (productsWithoutImages > 0) {
      decisions.push({
        task: {
          type: 'content_update',
          priority: 'high',
          description: `${productsWithoutImages} produits sans image`,
        },
        action: 'add_product_images',
        reasoning: 'Les images augmentent les conversions de 40%',
        confidence: 0.99,
      });
    }

    // Check for products with low views but good descriptions
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        description: { not: null },
      },
      take: 100,
    });

    // Check categories distribution
    const categoryStats = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const emptyCategories = await prisma.category.findMany({
      where: {
        products: { none: {} },
      },
    });

    if (emptyCategories.length > 0) {
      decisions.push({
        task: {
          type: 'product_optimization',
          priority: 'low',
          description: `${emptyCategories.length} catégories vides`,
          metadata: { categories: emptyCategories.map(c => c.name) },
        },
        action: 'cleanup_categories',
        reasoning: 'Catégories vides nuisent à la navigation',
        confidence: 0.92,
      });
    }

    return decisions;
  }

  /**
   * Analyze customer behavior and generate insights
   */
  async analyzeCustomerBehavior(): Promise<AIDecision[]> {
    if (!this.isEnabled) {
      throw new Error('AI Manager is not enabled. Set ANTHROPIC_API_KEY.');
    }

    const decisions: AIDecision[] = [];

    // Get customers with no recent orders
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        orders: {
          every: {
            createdAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 50,
    });

    if (inactiveCustomers.length > 10) {
      decisions.push({
        task: {
          type: 'customer_insight',
          priority: 'high',
          description: `${inactiveCustomers.length} clients inactifs depuis 90+ jours`,
          metadata: {
            customerCount: inactiveCustomers.length,
          },
        },
        action: 'reactivation_campaign',
        reasoning: 'Campagne de réactivation peut récupérer 15-20% des clients',
        confidence: 0.88,
        suggestedChanges: {
          action: 'send_reactivation_email',
          discount: '10%',
          targetCustomers: inactiveCustomers.length,
        },
      });
    }

    // Analyze cart abandonment
    // Note: Would need cart tracking in schema
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        customer: true,
      },
    });

    const activeCustomersCount = await prisma.customer.count({
      where: {
        status: 'ACTIVE',
        orders: {
          some: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }
      }
    });
    const conversionRate = activeCustomersCount > 0 ? recentOrders.length / activeCustomersCount : 0;

    if (conversionRate < 0.05) {
      decisions.push({
        task: {
          type: 'site_monitoring',
          priority: 'critical',
          description: 'Taux de conversion très faible',
          metadata: { conversionRate: conversionRate * 100 },
        },
        action: 'improve_checkout',
        reasoning: `Taux de conversion actuel: ${(conversionRate * 100).toFixed(2)}%. Objectif: >5%`,
        confidence: 0.91,
      });
    }

    return decisions;
  }

  /**
   * Generate intelligent site recommendations using Claude
   */
  async generateSiteRecommendations(): Promise<string> {
    if (!this.isEnabled) {
      throw new Error('AI Manager is not enabled. Set ANTHROPIC_API_KEY.');
    }

    // Gather site statistics
    const stats = {
      totalProducts: await prisma.product.count(),
      activeProducts: await prisma.product.count({ where: { status: 'ACTIVE' } }),
      totalCustomers: await prisma.customer.count(),
      totalOrders: await prisma.order.count(),
      recentOrders: await prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      productsWithoutDescription: await prisma.product.count({
        where: { OR: [{ description: null }, { description: '' }] },
      }),
      productsWithoutImage: await prisma.product.count({
        where: { OR: [{ images: { isEmpty: true } }, { thumbnail: null }] },
      }),
      lowStockProducts: await prisma.product.count({
        where: { stock: { lte: 10 }, status: 'ACTIVE' },
      }),
    };

    const prompt = `Tu es un consultant e-commerce expert. Analyse ces statistiques d'un site e-commerce en Guadeloupe (NEOSERV) et donne 5-7 recommandations concrètes et actionnables:

Statistiques:
- ${stats.totalProducts} produits (${stats.activeProducts} actifs)
- ${stats.totalCustomers} clients
- ${stats.totalOrders} commandes au total
- ${stats.recentOrders} commandes ce mois
- ${stats.productsWithoutDescription} produits sans description
- ${stats.productsWithoutImage} produits sans image
- ${stats.lowStockProducts} produits en stock faible

Donne des recommandations prioritaires, chiffrées et actionnables en français.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].type === 'text'
      ? message.content[0].text
      : 'Impossible de générer des recommandations';
  }

  /**
   * Auto-execute safe tasks
   */
  async executeSafeTasks(): Promise<{ executed: number; results: any[] }> {
    const results: any[] = [];
    let executed = 0;

    try {
      // 1. Generate descriptions for products without any
      const productsToUpdate = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { description: null },
            { description: { equals: '' } },
          ],
        },
        take: 5, // Limit to 5 at a time
      });

      for (const product of productsToUpdate) {
        try {
          const description = await this.generateProductDescription(product.id);
          results.push({
            task: 'generate_description',
            productId: product.id,
            productName: product.name,
            success: true,
            description: description.substring(0, 100) + '...',
          });
          executed++;
        } catch (error: any) {
          results.push({
            task: 'generate_description',
            productId: product.id,
            productName: product.name,
            success: false,
            error: error.message,
          });
        }
      }

      // 2. Log site statistics
      const decisions = await this.monitorSitePerformance();
      results.push({
        task: 'site_monitoring',
        decisionsFound: decisions.length,
        decisions: decisions.map(d => ({
          type: d.task.type,
          priority: d.task.priority,
          description: d.task.description,
        })),
      });

    } catch (error: any) {
      results.push({
        task: 'error',
        error: error.message,
      });
    }

    return { executed, results };
  }

  /**
   * Get AI health status
   */
  async getStatus(): Promise<{
    enabled: boolean;
    lastCheck?: Date;
    pendingTasks: number;
    recommendations: string[];
  }> {
    const pendingTasks = [
      ...(await this.analyzeInventory()),
      ...(await this.monitorSitePerformance()),
    ].filter(d => d.task.priority === 'high' || d.task.priority === 'critical');

    return {
      enabled: this.isEnabled,
      lastCheck: new Date(),
      pendingTasks: pendingTasks.length,
      recommendations: pendingTasks.map(t => t.task.description),
    };
  }
}

export default new AIManagerService();
