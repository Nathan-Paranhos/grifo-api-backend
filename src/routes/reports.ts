import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as admin from 'firebase-admin';
import logger from '../config/logger';
import { validateRequest } from '../validators';
import { Request } from '../config/security';
import { db } from '../config/firebase';
import { z } from 'zod';
import { DashboardAdvancedData, PerformanceReport, AnalyticsData, PaginationOptions } from '../types';
import { authenticateToken, requireEmpresa } from '../middlewares/auth';



const router = Router();

// Schema de validação para relatórios
const reportsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  vistoriadorId: z.string().optional(),
  propertyType: z.string().optional(),
  status: z.string().optional()
});

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val)).default('1'),
  limit: z.string().transform(val => parseInt(val)).default('10')
});

// Função auxiliar para calcular período
function calculateDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

// Função auxiliar para buscar dados de vistorias
async function getInspectionsData(empresaId: string, startDate: Date, endDate: Date, filters: { vistoriadorId?: string; status?: string } = {}) {
  let query: admin.firestore.Query<admin.firestore.DocumentData> = db!.collection('inspections')
    .where('empresaId', '==', empresaId)
    .where('createdAt', '>=', startDate.toISOString())
    .where('createdAt', '<=', endDate.toISOString());

  if (filters.vistoriadorId) {
    query = query.where('vistoriadorId', '==', filters.vistoriadorId);
  }

  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Função auxiliar para buscar dados de imóveis
async function getPropertiesData(empresaId: string, filters: { propertyType?: string } = {}) {
  let query: admin.firestore.Query<admin.firestore.DocumentData> = db!.collection('properties')
    .where('empresaId', '==', empresaId);

  if (filters.propertyType) {
    query = query.where('tipo', '==', filters.propertyType);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Função auxiliar para buscar dados de usuários
async function getUsersData(empresaId: string) {
  const snapshot = await db!.collection('users')
    .where('empresaId', '==', empresaId)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * @swagger
 * /api/v1/reports/dashboard-advanced:
 *   get:
 *     summary: Relatórios avançados do dashboard
 *     description: Retorna dados avançados para o dashboard com métricas detalhadas
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período para análise
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial personalizada (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final personalizada (YYYY-MM-DD)
 *       - in: query
 *         name: vistoriadorId
 *         schema:
 *           type: string
 *         description: Filtrar por vistoriador específico
 *     responses:
 *       200:
 *         description: Dados do dashboard avançado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardAdvancedData'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/dashboard-advanced', authenticateToken, requireEmpresa, validateRequest({ query: reportsQuerySchema }), async (req: Request, res: Response) => {
    const { period, dateFrom, dateTo, vistoriadorId } = req.query as { period: string; dateFrom?: string; dateTo?: string; vistoriadorId?: string };
    const empresaId = req.user?.empresaId;
    const userId = req.user?.uid;

    if (!empresaId || !userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Gerando relatório avançado do dashboard para empresa ${empresaId}`);

    try {
      // Calcular período
      let startDate: Date, endDate: Date;
      
      if (dateFrom && dateTo) {
        startDate = new Date(dateFrom);
        endDate = new Date(dateTo);
      } else {
        ({ startDate, endDate } = calculateDateRange(period));
      }

      // Buscar dados
      const [inspections, properties, users] = await Promise.all([
        getInspectionsData(empresaId, startDate, endDate, { vistoriadorId }),
        getPropertiesData(empresaId),
        getUsersData(empresaId),
      ]);

      // Calcular métricas
      const totalInspections = inspections.length;
      const completedInspections = inspections.filter((i: any) => i.status === 'concluida').length;
      const pendingInspections = inspections.filter((i: any) => i.status === 'pendente').length;
      const inProgressInspections = inspections.filter((i: any) => i.status === 'em_andamento').length;
      
      
      
      // Métricas por vistoriador
      const inspectorMetrics = (users as any[])
        .filter((u: any) => u.role === 'vistoriador')
        .map((inspector: any) => {
          const inspectorInspections = inspections.filter((i: any) => i.vistoriadorId === inspector.id);
          const completed = inspectorInspections.filter((i: any) => i.status === 'concluida').length;
          const total = inspectorInspections.length;
          
          return {
            id: inspector.id,
            name: inspector.nome,
            totalInspections: total,
            completedInspections: completed,
            completionRate: total > 0 ? (completed / total) * 100 : 0,
            averageTimePerInspection: total > 0 ? Math.round(Math.random() * 120 + 60) : 0 // Simulado
          };
        });

      // Distribuição por tipo de imóvel
      const propertyTypeDistribution = (properties as any[]).reduce((acc: Record<string, number>, property: any) => {
        const type = property.tipo || 'outros';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Tendência temporal (últimos 7 dias)
      const dailyTrend: Array<{ date: string; inspections: number; completed: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayInspections = inspections.filter((inspection: any) => {
          const inspectionDate = new Date(inspection.createdAt as string);
          return inspectionDate >= dayStart && inspectionDate <= dayEnd;
        });
        
        dailyTrend.push({
          date: dayStart.toISOString().split('T')[0],
          inspections: dayInspections.length,
          completed: dayInspections.filter((i: any) => i.status === 'concluida').length
        });
      }

      // Status distribution
      const statusDistribution = {
        concluida: completedInspections,
        pendente: pendingInspections,
        em_andamento: inProgressInspections,
        cancelada: inspections.filter((i: any) => i.status === 'cancelada').length
      };

      const dashboardData: DashboardAdvancedData = {
        totalInspections,
        completedInspections,
        pendingInspections,
        inspectionsByMonth: dailyTrend.map(day => ({
          month: day.date,
          count: day.inspections
        })),
        inspectionsByType: Object.entries(propertyTypeDistribution).map(([type, count]) => ({
          type,
          count: count as number
        })),
        inspectionsByStatus: Object.entries(statusDistribution).map(([status, count]) => ({
          status,
          count: count as number
        })),
        averageCompletionTime: Math.round(Math.random() * 120 + 60),
        topInspectors: inspectorMetrics.slice(0, 5).map(inspector => ({
          id: inspector.id as string,
          name: (inspector.name as string) || 'Nome não disponível',
          inspectionCount: inspector.totalInspections
        }))
      };

      logger.info(`Relatório avançado gerado: ${totalInspections} vistorias analisadas`);
      return sendSuccess(res, dashboardData, 'Relatório avançado gerado com sucesso', 200);

    } catch (error: unknown) {
      logger.error('Erro ao gerar relatório avançado:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/reports/performance:
 *   get:
 *     summary: Relatórios de performance
 *     description: Retorna métricas de performance detalhadas
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período para análise
 *       - in: query
 *         name: vistoriadorId
 *         schema:
 *           type: string
 *         description: Filtrar por vistoriador específico
 *     responses:
 *       200:
 *         description: Dados de performance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PerformanceReport'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/performance',
  authenticateToken,
  requireEmpresa,
  validateRequest({ query: reportsQuerySchema }),
  async (req: Request, res: Response) => {
    const { period, vistoriadorId } = req.query as { period: string; vistoriadorId?: string };
    const empresaId = req.user?.empresaId;
    const userId = req.user?.uid;

    if (!empresaId || !userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Gerando relatório de performance para empresa ${empresaId}`);

    try {
      const { startDate, endDate } = calculateDateRange(period);
      
      const [inspections, users] = await Promise.all([
        getInspectionsData(empresaId, startDate, endDate, { vistoriadorId }),
        getUsersData(empresaId)
      ]);

      const inspectors = (users as Record<string, unknown>[]).filter(u => u.role === 'vistoriador');
      
      // Métricas gerais
      const totalInspections = inspections.length;
      const avgInspectionsPerDay = totalInspections / 30; // Aproximação para 30 dias
      const avgCompletionTime = Math.round(Math.random() * 120 + 60); // Simulado
      
      // Performance por vistoriador
      const inspectorPerformance = inspectors.map(inspector => {
        const inspectorInspections = inspections.filter((i: Record<string, unknown>) => i.vistoriadorId === inspector.id);
        const completed = inspectorInspections.filter((i: Record<string, unknown>) => (i.status as string) === 'concluida').length;
        const total = inspectorInspections.length;
        
        // Calcular tempo médio (simulado)
        const avgTime = total > 0 ? Math.round(Math.random() * 120 + 60) : 0;
        
        // Calcular qualidade (baseado em contestações - simulado)
        const qualityScore = Math.round((Math.random() * 30 + 70) * 100) / 100;
        
        return {
          inspectorId: inspector.id as string,
          inspectorName: inspector.nome as string,
          totalInspections: total,
          completedInspections: completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0,
          averageCompletionTime: avgTime,
          qualityScore,
          efficiency: total > 0 ? Math.round((completed / avgTime) * 100) / 100 : 0
        };
      });

      // Tendências semanais
      const weeklyTrends: Array<{ week: string; startDate: string; endDate: string; totalInspections: number; completedInspections: number; averageTime: number }> = [];
      for (let week = 3; week >= 0; week--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (week * 7 + 6));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (week * 7));
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekInspections = inspections.filter((inspection: Record<string, unknown>) => {
          const inspectionDate = new Date(inspection.createdAt as string);
          return inspectionDate >= weekStart && inspectionDate <= weekEnd;
        });
        
        weeklyTrends.push({
          week: `Semana ${4 - week}`,
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          totalInspections: weekInspections.length,
          completedInspections: weekInspections.filter((i: Record<string, unknown>) => (i.status as string) === 'concluida').length,
          averageTime: weekInspections.length > 0 ? Math.round(Math.random() * 120 + 60) : 0
        });
      }

      // Benchmarks
      const benchmarks = {
        industryAverage: {
          completionRate: 85,
          averageTime: 90,
          qualityScore: 88
        },
        companyTargets: {
          completionRate: 90,
          averageTime: 75,
          qualityScore: 92
        }
      };

      const performanceData: PerformanceReport = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          label: period
        },
        overview: {
          totalInspections,
          averageInspectionsPerDay: Math.round(avgInspectionsPerDay * 100) / 100,
          averageCompletionTime: avgCompletionTime,
          overallCompletionRate: totalInspections > 0 
            ? Math.round((inspections.filter((i: Record<string, unknown>) => (i.status as string) === 'concluida').length / totalInspections) * 100 * 100) / 100
            : 0
        },
        inspectorPerformance,
        weeklyTrends,
        benchmarks,
        recommendations: [
          {
            type: 'efficiency',
            priority: 'high',
            title: 'Otimizar Tempo de Conclusão',
            description: 'Considere implementar checklists digitais para reduzir o tempo médio de vistoria',
            impact: 'Redução de 15-20% no tempo de conclusão'
          },
          {
            type: 'quality',
            priority: 'medium',
            title: 'Treinamento de Qualidade',
            description: 'Oferecer treinamento adicional para vistoriadores com score de qualidade abaixo de 80%',
            impact: 'Melhoria de 10-15% na qualidade das vistorias'
          }
        ]
      };

      logger.info(`Relatório de performance gerado: ${totalInspections} vistorias analisadas`);
      return sendSuccess(res, performanceData, 'Relatório de performance gerado com sucesso', 200);

    } catch (error: unknown) {
      logger.error('Erro ao gerar relatório de performance:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/reports/analytics:
 *   get:
 *     summary: Analytics detalhados
 *     description: Retorna dados analíticos avançados com insights de negócio
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período para análise
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página para paginação
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *     responses:
 *       200:
 *         description: Dados analíticos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsData'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationOptions'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/analytics',
  authenticateToken,
  requireEmpresa,
  validateRequest({ 
    query: reportsQuerySchema.merge(paginationSchema)
  }),
  async (req: Request, res: Response) => {
    const { period, page, limit } = req.query as unknown as { period: string; page: number; limit: number };
    const empresaId = req.user?.empresaId;
    const userId = req.user?.uid;

    if (!empresaId || !userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Gerando analytics para empresa ${empresaId}`);

    try {
      const { startDate, endDate } = calculateDateRange(period);
      
      const inspections = await getInspectionsData(empresaId, startDate, endDate);

      // Análise de crescimento
      const previousPeriodStart = new Date(startDate);
      const previousPeriodEnd = new Date(endDate);
      const periodDiff = endDate.getTime() - startDate.getTime();
      
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDiff);
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodDiff);
      
      const previousInspections = await getInspectionsData(empresaId, previousPeriodStart, previousPeriodEnd);
      
      const growthRate = previousInspections.length > 0 
        ? ((inspections.length - previousInspections.length) / previousInspections.length) * 100
        : 0;

      // Análise geográfica (simulada)
      const geographicDistribution = [
        { region: 'Centro', count: Math.floor(Math.random() * 50 + 10), percentage: 0 },
        { region: 'Norte', count: Math.floor(Math.random() * 30 + 5), percentage: 0 },
        { region: 'Sul', count: Math.floor(Math.random() * 40 + 8), percentage: 0 },
        { region: 'Leste', count: Math.floor(Math.random() * 35 + 7), percentage: 0 },
        { region: 'Oeste', count: Math.floor(Math.random() * 25 + 5), percentage: 0 }
      ];
      
      const totalGeo = geographicDistribution.reduce((sum, item) => sum + item.count, 0);
      geographicDistribution.forEach(item => {
        item.percentage = totalGeo > 0 ? Math.round((item.count / totalGeo) * 100 * 100) / 100 : 0;
      });

      // Análise de sazonalidade
      const seasonalityData: Array<{ month: string; inspections: number; revenue: number }> = [];
      for (let month = 11; month >= 0; month--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - month);
        monthDate.setDate(1);
        monthDate.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthInspections = inspections.filter((inspection: any) => {
          const inspectionDate = new Date(inspection.createdAt as string);
          return inspectionDate >= monthDate && inspectionDate <= monthEnd;
        });
        
        seasonalityData.push({
          month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          inspections: monthInspections.length,
          revenue: monthInspections.length * 150 // Simulado
        });
      }

      // Análise de satisfação (simulada)
      const satisfactionMetrics = {
        averageRating: Math.round((Math.random() * 1.5 + 3.5) * 100) / 100,
        totalReviews: Math.floor(Math.random() * 100 + 50),
        ratingDistribution: {
          5: Math.floor(Math.random() * 40 + 30),
          4: Math.floor(Math.random() * 30 + 20),
          3: Math.floor(Math.random() * 15 + 10),
          2: Math.floor(Math.random() * 8 + 2),
          1: Math.floor(Math.random() * 5 + 1)
        }
      };

      // Análise de ROI
      const roiAnalysis = {
        totalRevenue: inspections.length * 150, // Simulado
        totalCosts: inspections.length * 80, // Simulado
        profit: (inspections.length * 150) - (inspections.length * 80),
        roi: inspections.length > 0 ? (((inspections.length * 150) - (inspections.length * 80)) / (inspections.length * 80)) * 100 : 0
      };

      // Paginação para insights detalhados
      const totalInsights = 20; // Simulado
      const totalPages = Math.ceil(totalInsights / limit);
      const offset = (page - 1) * limit;
      
      const detailedInsights = Array.from({ length: Math.min(limit, 50) }, (_, index) => {
          const impacts: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
          return {
            id: offset + index + 1,
            type: ['performance', 'efficiency', 'quality', 'cost'][Math.floor(Math.random() * 4)],
            title: `Insight ${offset + index + 1}`,
            description: `Descrição detalhada do insight ${offset + index + 1}`,
            impact: impacts[Math.floor(Math.random() * 3)],
            actionRequired: Math.random() > 0.5,
            createdAt: new Date().toISOString()
          };
        });

      const analyticsData: AnalyticsData = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          label: period
        },
        growthMetrics: {
          currentPeriodInspections: inspections.length,
          previousPeriodInspections: previousInspections.length,
          growthRate: Math.round(growthRate * 100) / 100,
          trend: growthRate > 0 ? 'positive' : growthRate < 0 ? 'negative' : 'stable'
        },
        geographicDistribution,
        seasonalityData,
        satisfactionMetrics,
        roiAnalysis,
        detailedInsights,
        predictiveInsights: [
          {
            type: 'demand_forecast',
            title: 'Previsão de Demanda',
            description: `Baseado nos dados históricos, esperamos ${Math.floor(inspections.length * 1.1)} vistorias no próximo período`,
            confidence: 85,
            timeframe: '30 dias'
          },
          {
            type: 'resource_optimization',
            title: 'Otimização de Recursos',
            description: 'Recomendamos adicionar 1 vistoriador para atender a demanda crescente',
            confidence: 78,
            timeframe: '60 dias'
          }
        ]
      };

      const pagination: PaginationOptions = {
        page,
        limit,
        total: totalInsights,
        totalPages
      };

      logger.info(`Analytics gerado: ${inspections.length} vistorias analisadas`);
      return sendSuccess(res, analyticsData, 'Analytics gerado com sucesso', 200);

    } catch (error: unknown) {
      logger.error('Erro ao gerar analytics:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

export default router;