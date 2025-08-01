// Tipos para o sistema de notificações
export interface Notification {
  id: string;
  userId: string;
  empresaId: string;
  title: string;
  message: string;
  type: 'inspection' | 'contestation' | 'system' | 'reminder';
  read: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    inspectionId?: string;
    contestationId?: string;
    propertyId?: string;
    [key: string]: any;
  };
}

// Tipos para uploads de arquivos
export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  empresaId: string;
  category: 'image' | 'document' | 'logo';
  createdAt: string;
}

// Tipos para exportação de dados
export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    status?: string;
    vistoriadorId?: string;
    propertyType?: string;
    [key: string]: any;
  };
}

// Tipos para relatórios avançados
export interface DashboardAdvancedData {
  totalInspections: number;
  completedInspections: number;
  pendingInspections: number;
  inspectionsByMonth: Array<{
    month: string;
    count: number;
  }>;
  inspectionsByType: Array<{
    type: string;
    count: number;
  }>;
  inspectionsByStatus: Array<{
    status: string;
    count: number;
  }>;
  averageCompletionTime: number;
  topInspectors: Array<{
    id: string;
    name: string;
    inspectionCount: number;
  }>;
}

export interface PerformanceReport {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  overview: {
    totalInspections: number;
    averageInspectionsPerDay: number;
    averageCompletionTime: number;
    overallCompletionRate: number;
  };
  inspectorPerformance: Array<{
    inspectorId: string;
    inspectorName: string;
    totalInspections: number;
    completedInspections: number;
    completionRate: number;
    averageCompletionTime: number;
    qualityScore: number;
    efficiency: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    startDate: string;
    endDate: string;
    totalInspections: number;
    completedInspections: number;
    averageTime: number;
  }>;
  benchmarks: {
    industryAverage: {
      completionRate: number;
      averageTime: number;
      qualityScore: number;
    };
    companyTargets: {
      completionRate: number;
      averageTime: number;
      qualityScore: number;
    };
  };
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
}

export interface AnalyticsData {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  growthMetrics: {
    currentPeriodInspections: number;
    previousPeriodInspections: number;
    growthRate: number;
    trend: 'positive' | 'negative' | 'stable';
  };
  geographicDistribution: Array<{
    region: string;
    count: number;
    percentage: number;
  }>;
  seasonalityData: Array<{
    month: string;
    inspections: number;
    revenue: number;
  }>;
  satisfactionMetrics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  roiAnalysis: {
    totalRevenue: number;
    totalCosts: number;
    profit: number;
    roi: number;
  };
  detailedInsights: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionRequired: boolean;
    createdAt: string;
  }>;
  predictiveInsights: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
    timeframe: string;
  }>;
}

// Tipos para paginação
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para filtros de busca
export interface SearchFilters {
  q?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  empresaId?: string;
}