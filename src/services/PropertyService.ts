import { getDbSafe, isFirebaseInitialized } from '../config/firebase';
import { AppError } from '../errors/AppError';
import { Property } from '../models/Property'; // Assuming a Property model exists

interface ListParams {
  empresaId: string;
  search?: string;
  limit?: number;
}

class PropertyService {
  private get propertiesCollection() {
    if (!isFirebaseInitialized()) {
      throw new AppError('Firebase não está disponível em modo desenvolvimento', 503);
    }
    const db = getDbSafe();
    if (!db) {
      throw new AppError('Firebase não está disponível', 503);
    }
    return db.collection('imoveis');
  }

  async list({ empresaId, search, limit = 10 }: ListParams) {
    const query = this.propertiesCollection.where('empresaId', '==', empresaId);

    const snapshot = await query.limit(limit).get();

    if (snapshot.empty) {
      return { data: [], meta: { total: 0, page: 1, limit } };
    }

    const propertiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));

    let filteredData = propertiesData;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = propertiesData.filter(prop =>
        prop.enderecoCompleto?.toLowerCase().includes(searchTerm) ||
        prop.proprietario?.nome?.toLowerCase().includes(searchTerm)
      );
    }

    return { data: filteredData, meta: { total: filteredData.length, page: 1, limit } };
  }

  async getById(id: string, empresaId: string): Promise<Property> {
    const doc = await this.propertiesCollection.doc(id).get();

    if (!doc.exists || doc.data()?.empresaId !== empresaId) {
      throw new AppError('Propriedade não encontrada', 404);
    }

    return { id: doc.id, ...doc.data() } as Property;
  }

  async create(data: Omit<Property, 'id' | 'empresaId'>, empresaId: string): Promise<Property> {
    const propertyData = { ...data, empresaId, createdAt: new Date(), updatedAt: new Date() };
    const docRef = await this.propertiesCollection.add(propertyData);
    return { id: docRef.id, ...propertyData } as Property;
  }

  async update(id: string, data: Partial<Property>, empresaId: string): Promise<Property> {
    const property = await this.getById(id, empresaId);
    const updatedData = { ...data, updatedAt: new Date() };
    await this.propertiesCollection.doc(id).update(updatedData);
    return { ...property, ...updatedData };
  }

  async remove(id: string, empresaId: string): Promise<void> {
    await this.getById(id, empresaId); // Check if property exists and belongs to the company
    await this.propertiesCollection.doc(id).delete();
  }
}

export const propertyService = new PropertyService();