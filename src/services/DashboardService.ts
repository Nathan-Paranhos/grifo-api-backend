import { db } from '../config/firebase';
import logger from '../config/logger';
import { AppError } from '../errors/AppError';

type Inspection = { id: string; vistoriadorId?: string; status?: string; [key: string]: unknown };

class DashboardService {
  public async getStats(empresaId: string, vistoriadorId?: string): Promise<Record<string, unknown>> {
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }

    const inspectionsQuery = db.collection('vistorias').where('empresaId', '==', empresaId);
    const inspectionsSnapshot = await inspectionsQuery.get();
    const inspections = inspectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inspection));

    let filteredInspections: Inspection[] = inspections;
    if (vistoriadorId) {
      filteredInspections = inspections.filter(i => i.vistoriadorId === vistoriadorId);
    }

    const total = filteredInspections.length;
    const pendentes = filteredInspections.filter(i => i.status === 'Pendente').length;
    const concluidas = filteredInspections.filter(i => i.status === 'Concluída').length;
    const emAndamento = filteredInspections.filter(i => i.status === 'Em Andamento').length;

    logger.info(`Retornando estatísticas do dashboard: ${total} inspeções`);

    return {
      overview: {
        total,
        pendentes,
        concluidas,
        emAndamento,
      },
    };
  }
}

export const dashboardService = new DashboardService();