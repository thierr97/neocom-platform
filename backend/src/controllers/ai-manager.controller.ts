import { Request, Response } from 'express';
import aiManagerService from '../services/ai-manager.service';

/**
 * AI Manager Controller - Expose AI management endpoints
 */
export class AIManagerController {
  /**
   * GET /api/ai-manager/status
   * Get AI system status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await aiManagerService.getStatus();
      res.json({
        success: true,
        status,
      });
    } catch (error: any) {
      console.error('Error getting AI status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/analyze/content
   * Analyze site content and get recommendations
   */
  async analyzeContent(req: Request, res: Response): Promise<void> {
    try {
      const decisions = await aiManagerService.analyzeSiteContent();
      res.json({
        success: true,
        decisions,
        count: decisions.length,
      });
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/analyze/inventory
   * Analyze inventory and suggest reordering
   */
  async analyzeInventory(req: Request, res: Response): Promise<void> {
    try {
      const decisions = await aiManagerService.analyzeInventory();
      res.json({
        success: true,
        decisions,
        count: decisions.length,
      });
    } catch (error: any) {
      console.error('Error analyzing inventory:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/analyze/customers
   * Analyze customer behavior and get insights
   */
  async analyzeCustomers(req: Request, res: Response): Promise<void> {
    try {
      const decisions = await aiManagerService.analyzeCustomerBehavior();
      res.json({
        success: true,
        decisions,
        count: decisions.length,
      });
    } catch (error: any) {
      console.error('Error analyzing customers:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/analyze/performance
   * Monitor site performance
   */
  async analyzePerformance(req: Request, res: Response): Promise<void> {
    try {
      const decisions = await aiManagerService.monitorSitePerformance();
      res.json({
        success: true,
        decisions,
        count: decisions.length,
      });
    } catch (error: any) {
      console.error('Error analyzing performance:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/recommendations
   * Generate intelligent recommendations using Claude
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const recommendations = await aiManagerService.generateSiteRecommendations();
      res.json({
        success: true,
        recommendations,
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/product/:productId/description
   * Generate AI description for a product
   */
  async generateProductDescription(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const description = await aiManagerService.generateProductDescription(productId);

      res.json({
        success: true,
        productId,
        description,
      });
    } catch (error: any) {
      console.error('Error generating product description:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/execute/safe-tasks
   * Execute safe automated tasks
   */
  async executeSafeTasks(req: Request, res: Response): Promise<void> {
    try {
      const result = await aiManagerService.executeSafeTasks();
      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error executing safe tasks:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ai-manager/analyze/all
   * Run all analyses and return comprehensive report
   */
  async analyzeAll(req: Request, res: Response): Promise<void> {
    try {
      const [
        contentDecisions,
        inventoryDecisions,
        customerDecisions,
        performanceDecisions,
      ] = await Promise.all([
        aiManagerService.analyzeSiteContent(),
        aiManagerService.analyzeInventory(),
        aiManagerService.analyzeCustomerBehavior(),
        aiManagerService.monitorSitePerformance(),
      ]);

      const allDecisions = [
        ...contentDecisions,
        ...inventoryDecisions,
        ...customerDecisions,
        ...performanceDecisions,
      ];

      // Sort by priority
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      allDecisions.sort((a, b) => {
        return priorityOrder[b.task.priority] - priorityOrder[a.task.priority];
      });

      res.json({
        success: true,
        summary: {
          total: allDecisions.length,
          critical: allDecisions.filter(d => d.task.priority === 'critical').length,
          high: allDecisions.filter(d => d.task.priority === 'high').length,
          medium: allDecisions.filter(d => d.task.priority === 'medium').length,
          low: allDecisions.filter(d => d.task.priority === 'low').length,
        },
        decisions: allDecisions,
        categories: {
          content: contentDecisions.length,
          inventory: inventoryDecisions.length,
          customers: customerDecisions.length,
          performance: performanceDecisions.length,
        },
      });
    } catch (error: any) {
      console.error('Error running full analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new AIManagerController();
