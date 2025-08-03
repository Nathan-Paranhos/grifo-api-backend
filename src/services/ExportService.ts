import { getDbSafe, isFirebaseInitialized } from '../config/firebase';
import { AppError } from '../errors/AppError';
import { fileGeneratorService } from './FileGeneratorService';

class ExportService {
  public async exportInspections(empresaId: string, query: Record<string, unknown>): Promise<string> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }
    // TODO: Fetch and filter inspections data from Firestore
    const inspections = await this.getInspections(empresaId);
    const { format } = query;
    const formatStr = typeof format === 'string' ? format : 'pdf';
    const filename = `vistorias-${Date.now()}.${formatStr}`;
    return fileGeneratorService.generateFile(formatStr, inspections, filename, 'Vistorias');
  }

  public async exportProperties(empresaId: string, query: Record<string, unknown>): Promise<string> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }
    // TODO: Fetch and filter properties data from Firestore
    const properties = await this.getProperties(empresaId);
    const { format } = query;
    const formatStr = typeof format === 'string' ? format : 'pdf';
    const filename = `imoveis-${Date.now()}.${formatStr}`;
    return fileGeneratorService.generateFile(formatStr, properties, filename, 'Imóveis');
  }

  public async exportUsers(empresaId: string, query: Record<string, unknown>): Promise<string> {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Serviço de banco de dados indisponível', 503);
    }
    // TODO: Fetch and filter users data from Firestore
    const users = await this.getUsers(empresaId);
    const { format } = query;
    const formatStr = typeof format === 'string' ? format : 'pdf';
    const filename = `usuarios-${Date.now()}.${formatStr}`;
    return fileGeneratorService.generateFile(formatStr, users, filename, 'Usuários');
  }

  private async getInspections(empresaId: string): Promise<Record<string, unknown>[]> {
    if (!isFirebaseInitialized()) {
      return [];
    }
    
    const db = getDbSafe();
    if (!db) {
      return [];
    }
    const dbQuery: FirebaseFirestore.Query = db.collection('vistorias').where('empresaId', '==', empresaId);
    // Apply filters from query
    const snapshot = await dbQuery.get();
    return snapshot.docs.map(doc => doc.data());
  }

  private async getProperties(empresaId: string): Promise<Record<string, unknown>[]> {
    if (!isFirebaseInitialized()) {
      return [];
    }
    
    const db = getDbSafe();
    if (!db) {
      return [];
    }
    const dbQuery: FirebaseFirestore.Query = db.collection('imoveis').where('empresaId', '==', empresaId);
    // Apply filters from query
    const snapshot = await dbQuery.get();
    return snapshot.docs.map(doc => doc.data());
  }

  private async getUsers(empresaId: string): Promise<Record<string, unknown>[]> {
    if (!isFirebaseInitialized()) {
      return [];
    }
    
    const db = getDbSafe();
    if (!db) {
      return [];
    }
    const dbQuery: FirebaseFirestore.Query = db.collection('users').where('empresaId', '==', empresaId);
    // Apply filters from query
    const snapshot = await dbQuery.get();
    return snapshot.docs.map(doc => doc.data());
  }
}

export const exportService = new ExportService();