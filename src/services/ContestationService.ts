import { getDbSafe, isFirebaseInitialized } from '../config/firebase';
import logger from '../config/logger';
import { AppError } from '../errors/AppError';

interface CreateContestationData {
  inspectionId: string;
  motivo: string;
  detalhes?: string;
  clienteId?: string;
  empresaId: string;
}

class ContestationService {
  public async create(data: CreateContestationData): Promise<Record<string, unknown>> {
    const { inspectionId, motivo, detalhes, clienteId, empresaId } = data;
    
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }

    const inspectionRef = db.collection('vistorias').doc(inspectionId);
    const inspectionDoc = await inspectionRef.get();

    if (!inspectionDoc.exists) {
      throw new AppError('Vistoria não encontrada', 404);
    }

    const contestation = {
      id: `contest_${Date.now()}`,
      inspectionId,
      empresaId,
      clienteId: clienteId,
      motivo,
      detalhes,
      status: 'pendente',
      dataContestacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('contestations').doc(contestation.id).set(contestation);
    await inspectionRef.update({ hasContestation: true, updatedAt: new Date().toISOString() });

    logger.info(`Contestação ${contestation.id} registrada com sucesso para vistoria ${inspectionId}`);
    return contestation;
  }

  public async list(empresaId: string, filters: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }

    let query: FirebaseFirestore.Query = db.collection('contestations').where('empresaId', '==', empresaId);

    if (filters.inspectionId) {
      query = query.where('inspectionId', '==', filters.inspectionId);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.clienteId) {
      query = query.where('clienteId', '==', filters.clienteId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  }

  public async getById(id: string, empresaId: string): Promise<Record<string, unknown>> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }

    const doc = await db.collection('contestations').doc(id).get();

    if (!doc.exists || doc.data()?.empresaId !== empresaId) {
      throw new AppError('Contestação não encontrada', 404);
    }

    const data = doc.data();
    if (!data) {
      throw new AppError('Dados da contestação não encontrados', 404);
    }

    return data;
  }

  public async updateStatus(id: string, empresaId: string, status: string, resposta?: string): Promise<Record<string, unknown>> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }

    const docRef = db.collection('contestations').doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.empresaId !== empresaId) {
      throw new AppError('Contestação não encontrada', 404);
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (resposta) {
      updateData.respostaAdmin = resposta;
      updateData.dataResposta = new Date().toISOString();
    }

    await docRef.update(updateData);

    return { id, status, ...updateData };
  }

  public async getStats(empresaId: string): Promise<Record<string, unknown>> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }

    const snapshot = await db.collection('contestations').where('empresaId', '==', empresaId).get();
    const contestations = snapshot.docs.map(doc => doc.data());

    return {
      total: contestations.length,
      pendente: contestations.filter(c => c.status === 'pendente').length,
      em_analise: contestations.filter(c => c.status === 'em_analise').length,
      aprovada: contestations.filter(c => c.status === 'aprovada').length,
      rejeitada: contestations.filter(c => c.status === 'rejeitada').length,
    };
  }
}

export const contestationService = new ContestationService();